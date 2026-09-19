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

import { initBroadcast } from './broadcastSync';
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
let _generation = 0;
let _refreshPromise: Promise<void> | null = null;
const seenMessages = new Set<string>();
const MAX_SEEN_MESSAGES = 2000;

async function fetchSnapshot() {
  if (!_development || !_authHeadersFn) return;
  if (_refreshPromise) return _refreshPromise;
  const generation = _generation;
  const development = _development;
  const authHeaders = _authHeadersFn;
  const before = useBandejaStore.getState();
  const request = (async () => {
    const headers = authHeaders();
    // Each endpoint is independent: HTML, invalid JSON or a network error in
    // notifications must not discard a valid conversations response.
    const readList = async (url: string, field: string) => {
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(field + ' HTTP ' + response.status);
        const data = await response.json();
        if (data?.success === false) throw new Error(field + ': operación no exitosa');
        const list = data?.[field] ?? data;
        if (!Array.isArray(list)) throw new Error(field + ': respuesta inválida');
        return { ok: true as const, list, error: null };
      } catch (error) {
        return { ok: false as const, list: [], error: error instanceof Error ? error.message : field + ': error' };
      }
    };
    const [convsRes, notifsRes] = await Promise.all([
      readList('/api/messages/conversations?development=' + encodeURIComponent(development), 'conversations'),
      readList('/api/notifications?limit=20', 'notifications'),
    ]);
    if (generation !== _generation) return;
    const conversations: Conversation[] = convsRes.list.filter((c: any) => c?.id).map((c: any) => ({
      ...c,
      conversationId: c.conversationId || c.id,
      channelParam: c.channelParam || c.channel,
      name: c.name || c.contact?.name || c.contact?.phone || c.id,
      lastMessage: typeof c.lastMessage === 'string' ? c.lastMessage : c.lastMessage?.text || '',
      lastMessageAt: c.lastMessageAt || c.lastMessage?.timestamp || '',
      unreadCount: Number(c.unreadCount) || 0,
      linkedEventId: c.linkedEventId ?? null,
      linkedContactId: c.linkedContactId ?? null,
    }));
    const notifications: Notification[] = notifsRes.list;
    const current = useBandejaStore.getState();
    const nextConversations = Object.fromEntries(conversations.filter(c => c?.id).map(c => [c.id, c]));
    // A snapshot started before an SSE event must not erase that newer event.
    for (const [id, conversation] of Object.entries(current.conversations)) {
      if (conversation === before.conversations[id]) continue;
      const previous = before.conversations[id];
      const changed = previous ? Object.fromEntries(Object.entries(conversation).filter(
        ([key, value]) => value !== previous[key as keyof Conversation],
      )) : conversation;
      nextConversations[id] = { ...(nextConversations[id] ?? conversation), ...changed };
    }
    const previousNotifications = new Map(before.notifications.map(n => [n.id, n]));
    const nextNotifications = new Map(notifications.map(n => [n.id, n]));
    for (const notification of current.notifications) {
      if (notification !== previousNotifications.get(notification.id)) nextNotifications.set(notification.id, notification);
    }
    useBandejaStore.setState({
      ...(convsRes.ok ? { conversations: nextConversations } : {}),
      ...(notifsRes.ok ? { notifications: [...nextNotifications.values()] } : {}),
      error: [...new Set([convsRes.error, notifsRes.error].filter(Boolean))].join('; ') || null,
      _lastSyncAt: Date.now(),
    });
    useBandejaStore.getState().recomputeUnreads();
  })().catch((error: unknown) => {
    if (generation === _generation) useBandejaStore.setState({ error: error instanceof Error ? error.message : 'Error de bandeja' });
  });
  _refreshPromise = request;
  try { await request; } finally { if (_refreshPromise === request) _refreshPromise = null; }
}

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
  _lastEvent: null,
  _eventSequence: 0,
  _sseConnected: false,
  activeScope: 'support',
  activeChannelFilter: 'all',
  loading: false,
  error: null,

  // ─── Lifecycle ──────────────────────────────────────────────────────────
  initBandeja: async (development, authHeaders) => {
    if (_development === development && (get()._sseInitialized || get().loading)) return;
    get().destroyBandeja();
    const generation = _generation;

    _development = development;
    _authHeadersFn = authHeaders;
    set({ loading: true, error: null });

    const snapshot = fetchSnapshot();

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

    set({ _broadcastInitialized: true, _isLeaderTab: _broadcastHandle.isLeader() });

    // 3. SSE singleton — solo si soy leader tab
    startSSEIfLeader();

    set({ _sseInitialized: true });
    await snapshot;
    if (generation === _generation) set({ loading: false });
  },

  destroyBandeja: () => {
    _generation++;
    _refreshPromise = null;
    _development = null;
    _authHeadersFn = null;
    seenMessages.clear();
    destroySSEManager();
    _broadcastHandle?.destroy();
    _broadcastHandle = null;
    set({
      conversations: {}, notifications: [], typingByConv: {},
      unreadCounts: { byChannel: {}, total: 0, notifications: 0 },
      _lastEvent: null, _sseConnected: false, loading: false, error: null,
      _sseInitialized: false,
      _broadcastInitialized: false,
      _isLeaderTab: false,
    });
  },

  refresh: async () => {
    if (!_development || !_authHeadersFn) return;
    await fetchSnapshot();
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
    if (event.type === 'new_message') {
      const id = event.message?.id ?? event.message?.message_id;
      if (id) {
        const key = `${event.convId}:${id}`;
        if (seenMessages.has(key)) return;
        seenMessages.add(key);
        if (seenMessages.size > MAX_SEEN_MESSAGES) seenMessages.delete(seenMessages.values().next().value!);
      }
      if (!get().conversations[event.convId]) void get().refresh();
    }
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
                unreadCount: conv.unreadCount + (event.message?.direction ? (event.message.direction === 'outbound' ? 0 : 1) : (event.message?.fromUser || event.message?.from_user || event.message?.fromMe ? 0 : 1)),
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
        _broadcastHandle?.broadcastFromLeader(event);
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
    set((state) => ({ _lastEvent: event, _eventSequence: state._eventSequence + 1 }));
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
    onConnectionChange: (connected) => {
      useBandejaStore.setState({ _sseConnected: connected });
      // API IA resumes from future events only; reconcile the disconnected gap.
      if (connected) void useBandejaStore.getState().refresh();
    },
  });
  sse.start();
}
