'use client';

/**
 * useBandejaStore — store unificado de Bandeja.
 *
 * Centraliza:
 *  - Conversaciones (todos los canales)
 *  - Notificaciones
 *  - Unread counts derivados
 *  - SSE singleton client (1 por device)
 *  - BroadcastChannel cross-tab sync (1 SSE compartido por N tabs del browser)
 *
 * Uso:
 *  ```ts
 *  const conversations = useBandejaStore((s) => Object.values(s.conversations));
 *  const total = useBandejaStore((s) => s.unreadCounts.total);
 *  useBandejaStore.getState().initBandeja(); // 1 vez al montar root
 *  ```
 *
 * Migración:
 *  Los hooks viejos (useUnifiedFeed, useRecentConversations, ...) se
 *  reescribirán como wrappers que delegan al store. Componentes se migran
 *  uno a uno sin breaking.
 */
import { create } from 'zustand';

import { initBroadcast, tryAcquireLeadership } from './broadcastSync';
import { destroySSEManager, getSSEManager } from './sseClient';
import type { BandejaState, Conversation, Notification, SSEEvent } from './types';

interface BandejaActions {
  // Lifecycle
  initBandeja: (development: string, authHeaders: () => Record<string, string>) => Promise<void>;
  destroyBandeja: () => void;
  refresh: () => Promise<void>;

  // Mutations
  upsertConversation: (conv: Conversation) => void;
  upsertNotification: (notif: Notification) => void;
  applyEvent: (event: SSEEvent) => void;
  recomputeUnreads: () => void;

  // UI state
  setActiveScope: (scope: string) => void;
  setActiveChannelFilter: (channel: string) => void;
}

type BandejaStore = BandejaState & BandejaActions;

let _broadcastHandle: ReturnType<typeof initBroadcast> | null = null;
let _development: string | null = null;
let _authHeadersFn: (() => Record<string, string>) | null = null;

export const useBandejaStore = create<BandejaStore>((set, get) => ({
  // Estado inicial
  conversations: {},
  notifications: [],
  unreadCounts: { byChannel: {}, total: 0, notifications: 0 },
  typingByConv: {},
  _sseInitialized: false,
  _broadcastInitialized: false,
  _isLeaderTab: false,
  _lastSyncAt: 0,
  activeScope: 'support',
  activeChannelFilter: 'all',
  loading: false,
  error: null,

  // ─── Lifecycle ──────────────────────────────────────────────────────────
  initBandeja: async (development, authHeaders) => {
    if (get()._sseInitialized) return;

    _development = development;
    _authHeadersFn = authHeaders;
    set({ loading: true, error: null });

    // 1. Fetch inicial REST (1 sola vez por tab)
    try {
      const headers = authHeaders();
      const [convsRes, notifsRes] = await Promise.all([
        fetch(`/api/messages/conversations?development=${encodeURIComponent(development)}`, {
          headers,
        }),
        fetch(`/api/notifications?limit=20`, { headers }),
      ]);

      if (convsRes.ok) {
        const data = await convsRes.json();
        const convs: Conversation[] = data?.conversations ?? data ?? [];
        const map: Record<string, Conversation> = {};
        for (const c of convs) {
          if (c?.id) map[c.id] = c;
        }
        set({ conversations: map });
      }

      if (notifsRes.ok) {
        const data = await notifsRes.json();
        const notifs: Notification[] = data?.notifications ?? data ?? [];
        set({ notifications: notifs });
      }
    } catch (err: any) {
      set({ error: err?.message ?? 'Error inicial bandeja' });
    } finally {
      set({ loading: false, _lastSyncAt: Date.now() });
      get().recomputeUnreads();
    }

    // 2. BroadcastChannel cross-tab — leader election
    _broadcastHandle = initBroadcast({
      onLeaderEvent: (event) => {
        get().applyEvent(event);
      },
      onBecameLeader: () => {
        set({ _isLeaderTab: true });
        startSSEIfLeader();
      },
      onLostLeader: () => {
        set({ _isLeaderTab: false });
        destroySSEManager();
      },
    });

    set({ _broadcastInitialized: true, _isLeaderTab: tryAcquireLeadership() });

    // 3. SSE singleton — solo si soy leader tab
    startSSEIfLeader();

    set({ _sseInitialized: true });
  },

  destroyBandeja: () => {
    destroySSEManager();
    _broadcastHandle?.destroy();
    _broadcastHandle = null;
    set({
      _sseInitialized: false,
      _broadcastInitialized: false,
      _isLeaderTab: false,
    });
  },

  refresh: async () => {
    if (!_development || !_authHeadersFn) return;
    await get().initBandeja(_development, _authHeadersFn);
  },

  // ─── Mutations ──────────────────────────────────────────────────────────
  upsertConversation: (conv) => {
    set((s) => ({
      conversations: { ...s.conversations, [conv.id]: conv },
    }));
    get().recomputeUnreads();
  },

  upsertNotification: (notif) => {
    set((s) => {
      const idx = s.notifications.findIndex((n) => n.id === notif.id);
      if (idx >= 0) {
        const next = [...s.notifications];
        next[idx] = notif;
        return { notifications: next };
      }
      return { notifications: [notif, ...s.notifications] };
    });
    get().recomputeUnreads();
  },

  applyEvent: (event) => {
    switch (event.type) {
      case 'new_message': {
        // Cuando llega mensaje nuevo, incrementar unread + actualizar last
        set((s) => {
          const conv = s.conversations[event.convId];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [event.convId]: {
                ...conv,
                lastMessage: event.message?.content ?? conv.lastMessage,
                lastMessageAt: event.message?.timestamp ?? new Date().toISOString(),
                unreadCount: conv.unreadCount + 1,
              },
            },
          };
        });
        get().recomputeUnreads();
        // Re-broadcast a hermanas si soy leader
        _broadcastHandle?.broadcastFromLeader(event);
        break;
      }
      case 'conv_updated': {
        set((s) => {
          const conv = s.conversations[event.convId];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [event.convId]: { ...conv, ...event.fields },
            },
          };
        });
        _broadcastHandle?.broadcastFromLeader(event);
        break;
      }
      case 'notification': {
        get().upsertNotification(event.notif);
        _broadcastHandle?.broadcastFromLeader(event);
        break;
      }
      case 'typing': {
        set((s) => ({
          typingByConv: {
            ...s.typingByConv,
            [event.convId]: [
              ...(s.typingByConv[event.convId] ?? []).filter(
                (t) => t.expiresAt > Date.now() && t.userId !== event.userId,
              ),
              { userId: event.userId, expiresAt: Date.now() + (event.ttl ?? 3000) },
            ],
          },
        }));
        break;
      }
      case 'read_receipt': {
        // Cuando otro device marca leído, sincronizar unread
        set((s) => {
          const conv = s.conversations[event.convId];
          if (!conv) return s;
          return {
            conversations: {
              ...s.conversations,
              [event.convId]: { ...conv, unreadCount: 0 },
            },
          };
        });
        get().recomputeUnreads();
        _broadcastHandle?.broadcastFromLeader(event);
        // SPRINT 2 iMessage 2-jul: propagar el evento al hook useMessages
        // vía CustomEvent en window. Así el mensaje individual con msgId
        // pinta ✓✓ azul (getStatusIcon en MessageItem.tsx) sin acoplar
        // el hook al store bandeja.
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('bandeja:read_receipt', {
                detail: { convId: event.convId, msgId: event.msgId, readByUserId: event.readByUserId },
              }),
            );
          } catch { /* CustomEvent no disponible en SSR */ }
        }
        break;
      }
      // SPRINT 3 iMessage 6-jul: edit/delete cross-device.
      // El store no guarda la lista de mensajes de cada conv (viven en
      // useMessages hook). Igual que read_receipt, broadcasteamos con
      // CustomEvent para que useMessages actualice el message individual.
      case 'message_updated': {
        _broadcastHandle?.broadcastFromLeader(event);
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('bandeja:message_updated', {
                detail: {
                  convId: event.convId,
                  msgId: event.msgId,
                  text: event.text,
                  editedAt: event.editedAt,
                  editedBy: event.editedBy,
                },
              }),
            );
          } catch { /* CustomEvent no disponible en SSR */ }
        }
        break;
      }
      case 'message_deleted': {
        _broadcastHandle?.broadcastFromLeader(event);
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('bandeja:message_deleted', {
                detail: {
                  convId: event.convId,
                  msgId: event.msgId,
                  deletedAt: event.deletedAt,
                  deletedBy: event.deletedBy,
                  mode: event.mode ?? 'soft',
                },
              }),
            );
          } catch { /* CustomEvent no disponible en SSR */ }
        }
        break;
      }
    }
  },

  recomputeUnreads: () => {
    const { conversations, notifications } = get();
    const byChannel: Record<string, number> = {};
    let total = 0;
    for (const c of Object.values(conversations)) {
      byChannel[c.channel] = (byChannel[c.channel] ?? 0) + c.unreadCount;
      total += c.unreadCount;
    }
    const notifUnread = notifications.filter((n) => !n.read).length;
    set({ unreadCounts: { byChannel, total, notifications: notifUnread } });
  },

  setActiveScope: (scope) => set({ activeScope: scope }),
  setActiveChannelFilter: (channel) => set({ activeChannelFilter: channel }),
}));

// QA 30-jun: exponer el store en window en dev/-dev/-test para E2E
// (typing UI test, inspección manual desde DevTools). Producción real (host
// exacto sin `-dev/-test`) queda sin exponer.
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  const isDevLike =
    host.includes('-dev') ||
    host.includes('-test') ||
    host === 'localhost' ||
    host === '127.0.0.1';
  if (isDevLike) {
    (window as any).useBandejaStore = useBandejaStore;
  }
}

function startSSEIfLeader() {
  const state = useBandejaStore.getState();
  if (!state._isLeaderTab) return;
  if (!_development || !_authHeadersFn) return;

  const dev = _development;
  const headersFn = _authHeadersFn;

  const sse = getSSEManager({
    url: `/api/messages/stream?development=${encodeURIComponent(dev)}`,
    authHeaders: headersFn,
    onEvent: (event) => {
      useBandejaStore.getState().applyEvent(event);
    },
    onConnectionChange: (_connected) => {
      // hook futuro para mostrar badge "reconectando..."
    },
  });
  sse.start();
}
