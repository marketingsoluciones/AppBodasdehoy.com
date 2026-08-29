'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AppNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/mcpApi/notifications';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useBandejaStore } from '@/store/bandeja';
import { useChatStore } from '@/store/chat';

import { useAgentAssignmentOverrides } from './useAgentAssignmentOverrides';
import { type ChannelKind, useRecentConversations } from './useRecentConversations';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FeedItemKind = 'conversation' | 'notification';

export interface FeedItem {
  channelKind: ChannelKind | 'notification';
  /** Short label for multi-channel disambiguation (e.g. "Sv", "IG") */
  channelLabel?: string;
  /** First URL segment: /messages/{channelParam}/... (null for notifications) */
  channelParam: string | null;
  /** Second URL segment: /messages/{channelParam}/{conversationId} (null for notifications) */
  conversationId: string | null;
  /** 'conv-{channelParam}-{conversationId}' or 'notif-{notificationId}' */
  id: string;
  isRead: boolean;
  /** api-mcp jidType (user|group|newsletter|broadcast). One-way (informativo) si
   *  newsletter/broadcast → la lista pinta un tag "Informativo" (ISSUE-002 dogfood 20-ago). */
  jidType?: string | null;
  kind: FeedItemKind;
  /** Contact name or notification type label */
  name: string;
  /** Pre-computed navigation URL (for notifications) */
  navigationUrl?: string;
  /** null for conversations */
  notificationId: string | null;
  /** Tipo crudo de la notificación (service_comment, itinerary_*, whatsapp_message…)
   *  para clasificar por dominio en la vista "Esperan respuesta". undefined en conversaciones. */
  notifType?: string;
  /** Last message preview or notification message */
  preview: string;
  /** ISO string for sorting and display */
  timestamp: string;
  unreadCount: number;
  /** FASE B v2.0: estado RSVP del invitado en modo Evento. Solo se pinta el
   *  badge cuando hay valor. Vendrá de ConversationExtended.guestStatus
   *  (api-mcp) — hoy se queda undefined hasta que api-mcp lo exponga. */
  rsvpStatus?: 'confirmed' | 'pending' | 'declined';
  /** ID de evento vinculado (linkedEventId) — para filtrar por scope evento. */
  linkedEventId?: string | null;
  /** ID del contacto CRM vinculado. */
  linkedContactId?: string | null;
  /** FASE 2 Agentes (17-ago): AGENTE IA responsable de la conversación. Null-safe:
   *  undefined hasta que backend exponga assignedAgentId (mismo patrón que rsvpStatus).
   *  El badge de responsable y el filtro ?agent= de la Bandeja se auto-activan cuando
   *  hay valor; hasta entonces quedan dormidos. */
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  access_revoked: { icon: '🔒', label: 'Acceso revocado' },
  permission_updated: { icon: '🔑', label: 'Permiso actualizado' },
  resource_access_revoked: { icon: '🚫', label: 'Acceso eliminado' },
  resource_shared: { icon: '📤', label: 'Recurso compartido' },
  task_reminder: { icon: '📋', label: 'Tarea pendiente' },
  whatsapp_message: { icon: '💬', label: 'Mensaje WhatsApp' },
  // 2-jul: shape acordado con BACKEND-api-mcp para notifs de comentarios en
  // /servicios y /itinerario. Payload esperado: { entity_type, entity_id,
  // comment_id, author_id, author_name, excerpt, created_at, url }.
  comment_added: { icon: '💭', label: 'Nuevo comentario' },
};

function computeNotificationUrl(
  n: AppNotification,
  convById?: Map<string, string>,
): string | null {
  // B12 · el deep-link REAL manda sobre todo lo demas.
  // api-ia lo escribe al emitir (notifications_internal.py:101) y api-mcp lo persiste
  // en metadata desde su commit 907cb24. Antes esto no se leia y el clic caia al
  // generico de abajo (whatsapp_message -> /bandeja), es decir a la LISTA en vez de a
  // la conversacion — que es justo el sintoma de B12.
  // El campo focused NO sirve para esto: lo fabricamos nosotros con resourceId
  // (mcpApi/notifications.ts:81) y un resourceId no es una ruta.
  const deeplink = (n.metadata as { deeplink?: unknown } | undefined)?.deeplink;
  if (typeof deeplink === 'string' && deeplink.startsWith('/')) return deeplink;

  // Segundo camino, sin depender del backend: la notificacion SI trae el id de la
  // conversacion en resourceId (verificado 29-ago: 100 de 100 lo tienen, mientras
  // que 0 de 100 traen metadata). Lo que le falta es el canal — y ese lo tenemos ya
  // cargado en la lista de conversaciones del propio feed. Con los dos se arma la
  // misma ruta que daria el deeplink.
  const convId = n.resourceId;
  if (convId && convById) {
    const canal = convById.get(convId);
    if (canal) return `/bandeja/${canal}/${encodeURIComponent(convId)}`;
  }

  const focused = n.focused ?? '';
  if (
    focused.startsWith('/bandeja') ||
    focused.startsWith('/chat/') ||
    focused.startsWith('/settings')
  ) {
    return focused.split('?')[0];
  }
  if (focused.startsWith('/tasks')) return '/bandeja';
  if (n.type === 'whatsapp_message') return '/bandeja';
  if (n.type === 'task_reminder') return '/bandeja';
  if (n.type === 'access_revoked' || n.type === 'permission_updated') return '/settings';
  // comment_added: navegar directo al recurso comentado. El backend nos manda
  // `url` en el payload → si focused viene con ese URL, respeta el default
  // (primer if). Si no, best-effort a /messages.
  if (n.type === 'comment_added') return focused || '/bandeja';
  if (focused) return '/bandeja';
  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUnifiedFeed(maxItems = 60): {
  items: FeedItem[];
  loading: boolean;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  /** Fuerza un refresh inmediato del feed (p.ej. tras recibir un SSE message) */
  refresh: () => void;
} {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const { checkAuth, isGuest } = useAuthCheck();
  const { development } = checkAuth();
  const userType = useChatStore((s) => s.userType);
  const isGuestUser = isGuest || userType === 'guest' || userType === 'visitor';

  const { conversations, loading: convLoading } = useRecentConversations(50, refreshTick);
  // conversationId -> channelParam, para resolver el destino de las notificaciones.
  const convByIdRef = new Map<string, string>(
    conversations.map((c) => [c.conversationId, c.channelParam]),
  );
  const resolveAgent = useAgentAssignmentOverrides((s) => s.resolve);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const refresh = useCallback(() => {
    const now = Date.now();
    const minIntervalMs = 1500;

    if (now - lastRefreshAtRef.current >= minIntervalMs) {
      lastRefreshAtRef.current = now;
      setRefreshTick((t) => t + 1);
      return;
    }

    if (refreshTimerRef.current) return;
    const waitMs = Math.max(0, minIntervalMs - (now - lastRefreshAtRef.current));
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      lastRefreshAtRef.current = Date.now();
      setRefreshTick((t) => t + 1);
    }, waitMs);
  }, []);

  // Fetch notifications on mount + every 60s
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGuestUser) {
      setNotifications([]);
      setNotifLoading(false);
      return;
    }

    async function fetchNotifications() {
      try {
        const res = await getNotifications(20);
        setNotifications(res.notifications);
      } catch {
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    }

    // BUG-CW-N18 + perf mobile (informe QA 5ª ronda): pausar polling cuando
    // pestaña en background; refresh inmediato al volver. Evita drain batería.
    fetchNotifications();
    if (typeof document === 'undefined') return;

    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!document.hidden) fetchNotifications();
      }, 60_000);
    };
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { fetchNotifications(); start(); }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [isGuestUser, development]);

  // SSE — Eje A rediseño (commit cc6cac82): el SSE singleton vive ahora en
  // useBandejaStore (initBandeja). En lugar de abrir un EventSource propio
  // aquí, nos suscribimos al store: cuando entra new_message / conv_updated /
  // notification, el _lastSyncAt del store cambia → disparamos refresh local.
  //
  // Esto elimina el SSE duplicado que abría este hook (1 conexión menos).
  // Cuando el resto de hooks (useMessageStream, useRecentConversations) se
  // migren al store, el total bajará a 1 SSE por device (o tab leader).
  useEffect(() => {
    if (isGuestUser || typeof window === 'undefined') return;
    let lastSync = useBandejaStore.getState()._lastSyncAt;
    const unsub = useBandejaStore.subscribe((state) => {
      if (state._lastSyncAt !== lastSync) {
        lastSync = state._lastSyncAt;
        refresh();
      }
    });
    return () => {
      unsub();
    };
  }, [isGuestUser, refresh]);

  // Map conversations → FeedItem
  const convItems: FeedItem[] = conversations.map((conv) => {
    // FASE 2 Agentes: responsable = agente IA. api-ia cachea el valor que viene de api-mcp
    // durante 120 s, así que tras asignar hay hasta dos minutos en los que la lista seguiría
    // mostrando el dato viejo. resolveAgent superpone la asignación recién hecha y se retira
    // sola cuando el backend coincide (ver useAgentAssignmentOverrides).
    const agent = resolveAgent(conv.conversationId, {
      id: conv.assignedAgentId ?? null,
      name: conv.assignedAgentName ?? null,
    });
    return {
      assignedAgentId: agent.id ?? undefined,
      assignedAgentName: agent.name ?? undefined,
      channelKind: conv.kind,
      channelLabel: conv.channelLabel,
      channelParam: conv.channelParam,
      conversationId: conv.conversationId,
      id: `conv-${conv.channelParam}-${conv.conversationId}`,
      isRead: conv.unreadCount === 0,
      jidType: (conv as any).jidType ?? null,
      kind: 'conversation' as const,
      linkedContactId: conv.linkedContactId,
      linkedEventId: conv.linkedEventId,
      name: conv.name,
      notificationId: null,
      preview: conv.lastMessage,
      // FASE B v2.0 — api-mcp commit 7d52fec (25-jun) expone guestStatus.
      rsvpStatus: conv.guestStatus ?? undefined,
      timestamp: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
    };
  });

  // Map notifications → FeedItem
  const notifItems: FeedItem[] = notifications.map((n) => {
    const typeInfo = TYPE_LABEL[n.type ?? ''];
    return {
      channelKind: 'notification' as const,
      channelParam: null,
      conversationId: null,
      id: `notif-${n.id}`,
      isRead: n.read,
      kind: 'notification' as const,
      name: typeInfo ? `${typeInfo.icon} ${typeInfo.label}` : (n.type ?? 'Notificación'),
      navigationUrl: computeNotificationUrl(n, convByIdRef) ?? undefined,
      notifType: n.type ?? undefined,
      notificationId: n.id,
      preview: n.message,
      timestamp: n.createdAt,
      unreadCount: n.read ? 0 : 1,
    };
  });

  // Merge, sort by timestamp desc, cap at maxItems
  const items: FeedItem[] = [...convItems, ...notifItems]
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    })
    .slice(0, maxItems);

  // Optimistic mark-as-read
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    markNotificationAsRead(notificationId).catch(() => {
      // Best-effort; UI already updated optimistically
    });
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((curr) => curr.map((n) => ({ ...n, read: true })));
    try {
      const ok = await markAllNotificationsAsRead();
      if (!ok) setNotifications(prev);
    } catch {
      setNotifications(prev);
    }
  }, [notifications]);

  return {
    items,
    loading: convLoading || notifLoading,
    markAllNotificationsRead,
    markNotificationRead,
    refresh,
  };
}
