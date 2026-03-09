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
  if (n.type === 'whatsapp_message' || n.resourceType === 'WHATSAPP') return '/messages';
  if (n.type === 'task_reminder' || n.resourceType === 'SERVICE') return '/tasks';
  if (n.resourceType === 'CONVERSATION' && n.resourceId) return `/chat/${n.resourceId}`;
  if (n.type === 'access_revoked' || n.type === 'permission_updated') return '/settings';
  return null;
}

function getExternalUrl(_n: AppNotification): string | null {
  return null;
}

const ICON_SIZE = { blockSize: 40, size: 22, strokeWidth: 2 };
const POLL_INTERVAL = 60_000; // 60s

const TYPE_LABEL: Record<string, string> = {
  resource_shared: '📤',
  access_revoked: '🔒',
  permission_updated: '🔑',
  resource_access_revoked: '🚫',
  task_reminder: '📋',
  whatsapp_message: '💬',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  }, []);

  const handleClickNotification = useCallback(async (n: AppNotification) => {
    if (!n.read) await handleMarkRead(n.id);
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
        size={ICON_SIZE}
        title="Notificaciones"
        tooltipProps={{ placement: 'right' }}
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative' }}
      />
      {/* Unread badge */}
      {unread > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: '#ef4444',
            color: '#fff',
            borderRadius: '999px',
            fontSize: 10,
            fontWeight: 700,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            pointerEvents: 'none',
            lineHeight: 1,
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
            position: 'fixed',
            top: 'auto',
            left: 64,
            bottom: 'auto',
            zIndex: 9999,
            width: 320,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              background: '#fafafa',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
              Notificaciones {unread > 0 && <span style={{ color: '#ef4444' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Cargando...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No tienes notificaciones
              </div>
            )}
            {!loading && notifications.map((n) => {
              const url = getNotificationUrl(n);
              const ext = getExternalUrl(n);
              const isClickable = !!(url || ext);
              return (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '10px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    background: n.read ? '#fff' : '#fef3f2',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                    {TYPE_LABEL[n.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(n.createdAt)}</span>
                      {isClickable && (
                        <span style={{ fontSize: 11, color: '#ec4899', fontWeight: 500 }}>
                          {url === '/messages' ? '→ Bandeja' : url === '/tasks' ? '→ Tareas' : url === '/settings' ? '→ Config' : url?.startsWith('/chat/') ? '→ Conversación' : '→ Ver en app'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#ef4444',
                        flexShrink: 0,
                        marginTop: 6,
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
                fontSize: 13,
                color: '#ec4899',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
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

export { NotificationBell };
