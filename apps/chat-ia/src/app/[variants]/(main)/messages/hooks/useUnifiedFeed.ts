'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AppNotification,
  getNotifications,
  markNotificationAsRead,
} from '@/services/mcpApi/notifications';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useChatStore } from '@/store/chat';

import { type ChannelKind, useRecentConversations } from './useRecentConversations';
import { buildHeaders } from '../utils/auth';

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
  kind: FeedItemKind;
  /** Contact name or notification type label */
  name: string;
  /** Pre-computed navigation URL (for notifications) */
  navigationUrl?: string;
  /** null for conversations */
  notificationId: string | null;
  /** Last message preview or notification message */
  preview: string;
  /** ISO string for sorting and display */
  timestamp: string;
  unreadCount: number;
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

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGuestUser, development]);

  // SSE — GET /api/messages/stream (api-ia, desplegado 2026-04-13)
  // Usa fetch+ReadableStream en lugar de EventSource para enviar el JWT en el
  // header Authorization y evitar exponerlo en la URL (logs de servidor, historial).
  const sseRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isGuestUser || typeof window === 'undefined') return;

    const dev = development || 'bodasdehoy';
    let retryDelay = 3000;
    let cancelled = false;

    async function connect() {
      if (cancelled) return;

      sseAbortRef.current?.abort();
      const controller = new AbortController();
      sseAbortRef.current = controller;

      const authHeaders = buildHeaders();

      try {
        const response = await fetch(`/api/messages/stream?development=${dev}`, {
          headers: {
            Accept: 'text/event-stream',
            ...(authHeaders['Authorization'] ? { Authorization: authHeaders['Authorization'] } : {}),
            ...(authHeaders['X-Development'] ? { 'X-Development': authHeaders['X-Development'] } : {}),
            ...(authHeaders['X-User-ID'] ? { 'X-User-ID': authHeaders['X-User-ID'] } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(`SSE ${response.status}`);

        retryDelay = 3000; // reset backoff on successful connection
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buf += decoder.decode(value, { stream: true });
          const blocks = buf.split('\n\n');
          buf = blocks.pop() ?? '';

          for (const block of blocks) {
            if (block.includes('event: message') || block.startsWith('data:')) {
              refresh();
            }
            // any event resets the backoff
            retryDelay = 3000;
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError' || cancelled) return;
        // Reconectar con backoff exponencial (máx 60s)
        sseRetryRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 60_000);
          connect();
        }, retryDelay);
      }
    }

    connect();

    return () => {
      cancelled = true;
      sseAbortRef.current?.abort();
      sseAbortRef.current = null;
      if (sseRetryRef.current) clearTimeout(sseRetryRef.current);
    };
  }, [isGuestUser, development]);

  // Map conversations → FeedItem
  const convItems: FeedItem[] = conversations.map((conv) => ({
    channelKind: conv.kind,
    channelLabel: conv.channelLabel,
    channelParam: conv.channelParam,
    conversationId: conv.conversationId,
    id: `conv-${conv.channelParam}-${conv.conversationId}`,
    isRead: conv.unreadCount === 0,
    kind: 'conversation' as const,
    name: conv.name,
    notificationId: null,
    preview: conv.lastMessage,
    timestamp: conv.lastMessageAt,
    unreadCount: conv.unreadCount,
  }));

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
      navigationUrl: computeNotificationUrl(n) ?? undefined,
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

  return {
    items,
    loading: convLoading || notifLoading,
    markNotificationRead,
    refresh,
  };
}
