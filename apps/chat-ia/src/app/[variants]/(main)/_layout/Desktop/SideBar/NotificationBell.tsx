'use client';

import { ActionIcon } from '@lobehub/ui';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/store/chat';
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/api2/notifications';

function getNotificationUrl(n: AppNotification): string | null {
  const focused = n.focused ?? '';
  if (focused.startsWith('/messages') || focused.startsWith('/chat/') || focused.startsWith('/settings')) {
    return focused.split('?')[0]; // strip query params for chat-ia navigation
  }
  if (focused.startsWith('/tasks')) return '/messages'; // /tasks redirige a /messages
  if (n.type === 'whatsapp_message') return '/messages';
  if (n.type === 'task_reminder') return '/messages';
  if (n.type === 'access_revoked' || n.type === 'permission_updated') return '/settings';
  if (focused) return '/messages'; // appEventos link — redirect to bandeja
  return null;
}

function getExternalUrl(_n: AppNotification): string | null {
  return null;
}

const ICON_SIZE = { blockSize: 40, size: 22, strokeWidth: 2 };
const POLL_INTERVAL = 60_000; // 60s

const TYPE_LABEL: Record<string, string> = {
  access_revoked: '🔒',
  permission_updated: '🔑',
  resource_access_revoked: '🚫',
  resource_shared: '📤',
  task_reminder: '📋',
  whatsapp_message: '💬',
};

function timeAgo(createdAt: number | string): string {
  const ts = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const NotificationBell = memo(() => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isGuestUser = useChatStore((s) => {
    const email = s.userProfile?.email || s.currentUserId;
    if (!email) return true;
    const lower = email.toLowerCase();
    return lower === 'guest' || lower === 'anonymous' || lower.includes('@guest.') || lower.startsWith('visitor_');
  });

  // Poll unread count
  useEffect(() => {
    if (isGuestUser) return;
    const fetch = () => getUnreadNotificationsCount().then(setUnread);
    fetch();
    const id = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isGuestUser]);

  // Load full list when panel opens
  useEffect(() => {
    if (!open || isGuestUser) return;
    setLoading(true);
    getNotifications(20).then((res) => {
      setNotifications(res.notifications);
      setUnread(res.unreadCount);
      setLoading(false);
    });
  }, [open, isGuestUser]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: true })));
    setUnread(0);
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id || n._id === id) ? { ...n, read: true, status: true } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  }, []);

  const handleClickNotification = useCallback(async (n: AppNotification) => {
    if (!n.read) await handleMarkRead(n.id || n._id!);
    const url = getNotificationUrl(n);
    const ext = getExternalUrl(n);
    if (url) { setOpen(false); router.push(url); }
    else if (ext) window.open(ext, '_blank');
  }, [handleMarkRead, router]);

  if (isGuestUser) return null;

  return (
    <div style={{ position: 'relative' }}>
      <ActionIcon
        icon={Bell}
        onClick={() => setOpen((v) => !v)}
        size={ICON_SIZE}
        style={{ position: 'relative' }}
        title="Notificaciones"
        tooltipProps={{ placement: 'right' }}
      />
      {/* Unread badge */}
      {unread > 0 && (
        <span
          style={{
            alignItems: 'center',
            background: '#ef4444',
            borderRadius: '999px',
            color: '#fff',
            display: 'flex',
            fontSize: 10,
            fontWeight: 700,
            height: 16,
            justifyContent: 'center',
            lineHeight: 1,
            minWidth: 16,
            padding: '0 3px',
            pointerEvents: 'none',
            position: 'absolute',
            right: 4,
            top: 4,
          }}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}

      {/* Notification panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            bottom: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            left: 64,
            overflow: 'hidden',
            position: 'fixed',
            top: 'auto',
            width: 320,
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              alignItems: 'center',
              background: '#fafafa',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
            }}
          >
            <span style={{ color: '#111', fontSize: 14, fontWeight: 600 }}>
              Notificaciones {unread > 0 && <span style={{ color: '#ef4444' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: 4,
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '2px 6px',
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && (
              <div style={{ color: '#9ca3af', fontSize: 13, padding: '24px', textAlign: 'center' }}>
                Cargando...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: 13, padding: '24px', textAlign: 'center' }}>
                No tienes notificaciones
              </div>
            )}
            {!loading && notifications.map((n) => {
              const url = getNotificationUrl(n);
              const ext = getExternalUrl(n);
              const isClickable = !!(url || ext);
              return (
                <div
                  key={n.id || n._id}
                  onClick={() => handleClickNotification(n)}
                  style={{
                    background: n.read ? '#fff' : '#fef3f2',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex',
                    gap: 10,
                    padding: '10px 16px',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ flexShrink: 0, fontSize: 18, marginTop: 1 }}>
                    {TYPE_LABEL[n.type ?? ''] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                      {n.message}
                    </p>
                    <div style={{ alignItems: 'center', display: 'flex', gap: 6, marginTop: 3 }}>
                      <span style={{ color: '#9ca3af', fontSize: 11 }}>{timeAgo(n.createdAt ?? 0)}</span>
                      {isClickable && (
                        <span style={{ color: '#ec4899', fontSize: 11, fontWeight: 500 }}>
                          {url === '/messages' ? '→ Bandeja' : url === '/settings' ? '→ Config' : url?.startsWith('/chat/') ? '→ Conversación' : '→ Ver en app'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <span
                      style={{
                        background: '#ef4444',
                        borderRadius: '50%',
                        flexShrink: 0,
                        height: 8,
                        marginTop: 6,
                        width: 8,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer — ver todas */}
          <div
            style={{
              borderTop: '1px solid #f0f0f0',
              padding: '10px 16px',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => { setOpen(false); router.push('/notifications'); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ec4899',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                padding: 0,
              }}
            >
              Ver todas las notificaciones →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
