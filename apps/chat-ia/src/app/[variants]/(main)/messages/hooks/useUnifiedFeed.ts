'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AppNotification,
  getNotifications,
  markNotificationAsRead,
} from '@/services/api2/notifications';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useChatStore } from '@/store/chat';

import { type ChannelKind, useRecentConversations } from './useRecentConversations';
import { buildHeaders } from '../utils/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FeedItemKind = 'conversation' | 'notification';

export interface FeedItem {
  /** 'conv-{channelParam}-{conversationId}' or 'notif-{notificationId}' */
  id: string;
  kind: FeedItemKind;
  channelKind: ChannelKind | 'notification';
  /** First URL segment: /messages/{channelParam}/... (null for notifications) */
  channelParam: string | null;
  /** Second URL segment: /messages/{channelParam}/{conversationId} (null for notifications) */
  conversationId: string | null;
  /** Contact name or notification type label */
  name: string;
  /** Last message preview or notification message */
  preview: string;
  /** ISO string for sorting and display */
  timestamp: string;
  unreadCount: number;
  /** null for conversations */
  notificationId: string | null;
  isRead: boolean;
  /** Short label for multi-channel disambiguation (e.g. "Sv", "IG") */
  channelLabel?: string;
  /** Pre-computed navigation URL (for notifications) */
  navigationUrl?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  access_revoked: { icon: '🔒', label: 'Acceso revocado' },
  permission_updated: { icon: '🔑', label: 'Permiso actualizado' },
  resource_access_revoked: { icon: '🚫', label: 'Acceso eliminado' },
  resource_shared: { icon: '📤', label: 'Recurso compartido' },
  task_reminder: { icon: '📋', label: 'Tarea pendiente' },
  whatsapp_message: { icon: '💬', label: 'Mensaje WhatsApp' },
};

function computeNotificationUrl(n: AppNotification): string | null {
  const focused = n.focused ?? '';
  if (
    focused.startsWith('/messages') ||
    focused.startsWith('/chat/') ||
    focused.startsWith('/settings')
  ) {
    return focused.split('?')[0];
  }
  if (focused.startsWith('/tasks')) return '/messages';
  if (n.type === 'whatsapp_message') return '/messages';
  if (n.type === 'task_reminder') return '/messages';
  if (n.type === 'access_revoked' || n.type === 'permission_updated') return '/settings';
  if (focused) return '/messages';
  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUnifiedFeed(maxItems = 60): {
  items: FeedItem[];
  loading: boolean;
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

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

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

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGuestUser, development, refreshTick]);

  // SSE — GET /api/messages/stream (api-ia, desplegado 2026-04-13)
  // Reconecta automáticamente con backoff exponencial.
  const sseRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isGuestUser || typeof window === 'undefined') return;

    const dev = development || 'bodasdehoy';
    let retryDelay = 3_000;

    function connect() {
      const headers = buildHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '') ?? '';
      const url = `/api/messages/stream?development=${dev}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      const es = new EventSource(url);
      sseRef.current = es;

      es.addEventListener('message', () => {
        // Nuevo mensaje → refrescar el feed inmediatamente
        refresh();
        retryDelay = 3_000; // reset backoff on success
      });

      es.addEventListener('ping', () => {
        retryDelay = 3_000;
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        // Reconectar con backoff (máx 60s)
        sseRetryRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 60_000);
          connect();
        }, retryDelay);
      };
    }

    connect();

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
      if (sseRetryRef.current) clearTimeout(sseRetryRef.current);
    };
  }, [isGuestUser, development]);

  // Map conversations → FeedItem
  const convItems: FeedItem[] = conversations.map((conv) => ({
    id: `conv-${conv.channelParam}-${conv.conversationId}`,
    kind: 'conversation' as const,
    channelKind: conv.kind,
    channelParam: conv.channelParam,
    conversationId: conv.conversationId,
    name: conv.name,
    preview: conv.lastMessage,
    timestamp: conv.lastMessageAt,
    unreadCount: conv.unreadCount,
    notificationId: null,
    isRead: conv.unreadCount === 0,
    channelLabel: conv.channelLabel,
  }));

  // Map notifications → FeedItem
  const notifItems: FeedItem[] = notifications.map((n) => {
    const typeInfo = TYPE_LABEL[n.type ?? ''];
    return {
      id: `notif-${n.id}`,
      kind: 'notification' as const,
      channelKind: 'notification' as const,
      channelParam: null,
      conversationId: null,
      name: typeInfo ? `${typeInfo.icon} ${typeInfo.label}` : (n.type ?? 'Notificación'),
      preview: n.message,
      timestamp: n.createdAt,
      unreadCount: n.read ? 0 : 1,
      notificationId: n.id,
      isRead: n.read,
      navigationUrl: computeNotificationUrl(n) ?? undefined,
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

  return {
    items,
    loading: convLoading || notifLoading,
    markNotificationRead,
    refresh,
  };
}
