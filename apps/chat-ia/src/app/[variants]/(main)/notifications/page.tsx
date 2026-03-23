'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';

import {
  AppNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/api2/notifications';

const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  access_revoked: { icon: '🔒', label: 'Acceso revocado' },
  permission_updated: { icon: '🔑', label: 'Permiso actualizado' },
  resource_access_revoked: { icon: '🚫', label: 'Acceso eliminado' },
  resource_shared: { icon: '📤', label: 'Recurso compartido' },
  task_reminder: { icon: '📋', label: 'Tarea pendiente' },
  whatsapp_message: { icon: '💬', label: 'Mensaje WhatsApp' },
};

function getNotificationUrl(n: AppNotification): string | null {
  const focused = n.focused ?? '';
  if (focused.startsWith('/messages') || focused.startsWith('/tasks') || focused.startsWith('/chat/') || focused.startsWith('/settings')) {
    return focused.split('?')[0];
  }
  if (n.type === 'whatsapp_message') return '/messages';
  if (n.type === 'task_reminder') return '/tasks';
  if (n.type === 'access_revoked' || n.type === 'permission_updated') return '/settings';
  if (focused) return '/messages';
  return null;
}

function getExternalUrl(_n: AppNotification): string | null {
  return null;
}

function timeAgo(createdAt: number | string): string {
  const ts = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d}d`;
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getDateGroup(createdAt: number | string): string {
  const ts = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0 && date.getDate() === now.getDate()) return 'Hoy';
  if (diffDays <= 7) return 'Esta semana';
  return 'Anteriores';
}

const SNOOZE_KEY = 'bodas_snoozed_notifications';

function getSnoozed(): Record<string, number> {
  try {
    const stored = localStorage.getItem(SNOOZE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function snoozeNotification(id: string, minutes: number) {
  try {
    const snoozed = getSnoozed();
    snoozed[id] = Date.now() + minutes * 60_000;
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozed));
  } catch { /* ignore */ }
}

function isSnoozed(id: string): boolean {
  const snoozed = getSnoozed();
  return (snoozed[id] ?? 0) > Date.now();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);

  const PAGE_SIZE = 30;

  const load = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true);
    const res = await getNotifications(PAGE_SIZE, f === 'unread', p);
    setNotifications(res.notifications);
    setTotal(res.total);
    setUnreadCount(res.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(1, filter);
    setPage(1);
  }, [filter, load]);

  const handleClick = useCallback(async (n: AppNotification) => {
    if (!n.read) {
      await markNotificationAsRead(n.id || n._id!);
      setNotifications((prev) => prev.map((x) => (x.id === n.id || x._id === n._id) ? { ...x, read: true, status: true } : x));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    const url = getNotificationUrl(n);
    const ext = getExternalUrl(n);
    if (url) router.push(url);
    else if (ext) window.open(ext, '_blank');
  }, [router]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: true })));
    setUnreadCount(0);
  }, []);

  const handleSnooze = useCallback((id: string, minutes: number) => {
    snoozeNotification(id, minutes);
    setSnoozeMenuId(null);
    setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
  }, []);

  // Filter by search, type, and snoozed
  const displayNotifications = useMemo(() => {
    let result = notifications.filter((n) => !isSnoozed(n.id || n._id!));
    if (typeFilter) {
      result = result.filter((n) => n.type === typeFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((n) => n.message.toLowerCase().includes(q));
    }
    return result;
  }, [notifications, searchTerm, typeFilter]);

  // Available types from current notifications
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return Array.from(types);
  }, [notifications]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    for (const n of displayNotifications) {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }, [displayNotifications]);

  const groupOrder = ['Hoy', 'Esta semana', 'Anteriores'];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <EventosAutoAuth />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">{unreadCount} sin leer</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              onClick={handleMarkAllRead}
            >
              Marcar todas como leídas
            </button>
          )}
          <button
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            onClick={() => load(1, filter)}
            type="button"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-pink-400 focus:outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar notificaciones..."
          type="text"
          value={searchTerm}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {(['all', 'unread'] as const).map((f) => (
          <button
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : 'Sin leer'}
          </button>
        ))}
      </div>

      {/* Type filter chips */}
      {availableTypes.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              !typeFilter ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setTypeFilter(null)}
            type="button"
          >
            Todos
          </button>
          {availableTypes.map((t) => {
            const meta = TYPE_LABEL[t] || { icon: '🔔', label: t };
            return (
              <button
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                type="button"
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="space-y-1">
        {loading && (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div className="h-16 animate-pulse rounded-xl bg-gray-100" key={i} />
            ))}
          </div>
        )}

        {!loading && displayNotifications.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-3 text-5xl">🔔</div>
            <p className="text-gray-500">
              {searchTerm ? `Sin resultados para "${searchTerm}"` : filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        )}

        {!loading && groupOrder.map((groupName) => {
          const items = groupedNotifications[groupName];
          if (!items || items.length === 0) return null;

          return (
            <div key={groupName}>
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-1 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {groupName}
                </span>
              </div>
              {items.map((n) => {
                const meta = TYPE_LABEL[n.type] || { icon: '🔔', label: n.type };
                const url = getNotificationUrl(n);
                const ext = getExternalUrl(n);
                const isClickable = !!(url || ext);

                return (
                  <div
                    className={`relative flex items-start gap-3 rounded-xl px-4 py-3 transition-colors ${
                      n.read ? 'bg-white hover:bg-gray-50' : 'bg-pink-50 hover:bg-pink-100'
                    } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    key={n.id || n._id}
                  >
                    {/* Main content - clickable */}
                    <div className="flex-1 flex items-start gap-3" onClick={() => handleClick(n)}>
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              {meta.label}
                            </span>
                            <p className="mt-0.5 text-sm leading-snug text-gray-800">{n.message}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt ?? 0)}</span>
                            {!n.read && <span className="h-2 w-2 rounded-full bg-pink-500" />}
                          </div>
                        </div>
                        {isClickable && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {url === '/messages' && '→ Ir a bandeja de mensajes'}
                            {url === '/tasks' && '→ Ver tareas pendientes'}
                            {url === '/settings' && '→ Ver configuración'}
                            {url?.startsWith('/chat/') && '→ Abrir conversación'}
                            {ext && '→ Ver en la app'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snooze button */}
                    <div className="relative">
                      <button
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        onClick={(e) => { e.stopPropagation(); setSnoozeMenuId(snoozeMenuId === (n.id || n._id!) ? null : (n.id || n._id!)); }}
                        title="Posponer"
                        type="button"
                      >
                        ⏰
                      </button>
                      {snoozeMenuId === (n.id || n._id) && (
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {[
                            { label: '30 minutos', minutes: 30 },
                            { label: '1 hora', minutes: 60 },
                            { label: '4 horas', minutes: 240 },
                            { label: 'Mañana', minutes: 1440 },
                          ].map((opt) => (
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              key={opt.minutes}
                              onClick={(e) => { e.stopPropagation(); handleSnooze(n.id || n._id!, opt.minutes); }}
                              type="button"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {!loading && notifications.length < total && (
        <div className="mt-6 text-center">
          <button
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={async () => {
              const nextPage = page + 1;
              setPage(nextPage);
              const res = await getNotifications(PAGE_SIZE, filter === 'unread', nextPage);
              setNotifications((prev) => [...prev, ...res.notifications]);
              setTotal(res.total);
            }}
          >
            Cargar más ({total - notifications.length} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
