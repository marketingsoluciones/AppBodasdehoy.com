import { useEffect, useState, useCallback, useRef } from "react";
import ClickAwayListener from "react-click-away-listener"
import { RiNotification2Fill } from "react-icons/ri";
import { MisEventosIcon, TarjetaIcon } from "./icons";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider } from "../context";
import { Interweave } from "interweave";
import { useTranslation } from "react-i18next";
import { ImageAvatar } from "./Utils/ImageAvatar";
import { RelativeTime } from "./Utils/RelativeTime";
import { useRouter } from "next/navigation";

// ========================================
// Types
// ========================================

interface Api2Notification {
  id: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
  resourceName?: string;
  resourceId?: string;
}

/** Vista activa dentro del panel */
type View =
  | 'legacy'              // Tab "Actual" — vista original sin tocar
  | 'events-overview'     // Sin evento seleccionado → lista de eventos con badge
  | 'event-notifications' // Dentro de un evento (o click desde overview) → notificaciones del evento
  | 'all-pending'         // Todas las pendientes de todos los eventos
  | 'history';            // Historial agrupado por evento

type Filter = 'pending' | 'all';

const PAGE_SIZE = 20;
// Socket cubre el push en tiempo real; el polling queda como fallback con intervalo amplio.
const POLL_INTERVAL = 300_000; // 5 min

const TYPE_ICON: Record<string, string> = {
  whatsapp_message: '💬', task_reminder: '📋', access_revoked: '🔒',
  permission_updated: '🔑', resource_shared: '📤', resource_access_revoked: '🚫',
  user: '👤', event: '📅', shop: '🛒',
};

/** Extraer nombre del evento del mensaje (ej: "... | Evento boda: <strong>TINA & JOHN</strong>") */
function extractEventName(message: string): string | null {
  const match = message.match(/Evento\s+\w+:\s*(?:<[^>]+>)?([^<|]+)/i);
  return match?.[1]?.trim() || null;
}

// ========================================
// Component
// ========================================

export const Notifications = () => {
  const { t } = useTranslation()
  const { event: selectedEvent } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, config } = AuthContextProvider()
  const { socket } = SocketContextProvider()
  const router = useRouter()

  const [showPanel, setShowPanel] = useState(false);
  const [view, setView] = useState<View>('legacy');
  const [filter, setFilter] = useState<Filter>('pending');
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);

  // Api2 state
  const [api2Notifs, setApi2Notifs] = useState<Api2Notification[]>([]);
  const [api2Total, setApi2Total] = useState(0);
  const [api2UnreadCount, setApi2UnreadCount] = useState(0);
  const [api2Page, setApi2Page] = useState(1);
  const [api2Loading, setApi2Loading] = useState(false);
  const [eventUnreadMap, setEventUnreadMap] = useState<Record<string, number>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const development = config?.development || 'bodasdehoy';
  const userId = user?.uid;
  const isRealUser = !!userId && user?.displayName !== 'guest' && user?.displayName !== 'anonymous';
  const hasSelectedEvent = !!selectedEvent?._id;

  // Mark as read
  const markAsRead = useCallback(async (notifId: string) => {
    if (!userId) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId, userId, dev: development }),
      });
      setApi2Notifs(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setApi2UnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [userId, development]);

  // ========================================
  // API2 fetch
  // ========================================

  const fetchApi2 = useCallback(async (tab: string, page: number, filterEventName?: string) => {
    if (!userId) return;
    setApi2Loading(true);
    try {
      // Fetch more if filtering client-side by event name
      const limit = filterEventName ? 200 : (tab === 'history' ? 50 : PAGE_SIZE);
      const url = `/api/notifications?userId=${userId}&dev=${development}&tab=${tab}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        let notifs = data.notifications || [];
        // Client-side filter by event name when inside a specific event
        if (filterEventName) {
          const upperName = filterEventName.toUpperCase();
          notifs = notifs.filter((n: Api2Notification) => {
            const name = n.resourceName || extractEventName(n.message);
            return name && name.toUpperCase() === upperName;
          });
        }
        setApi2Notifs(notifs);
        setApi2Total(filterEventName ? notifs.length : (data.total || 0));
        setApi2UnreadCount(data.unreadCount || 0);
      }
    } catch { /* silent */ }
    finally { setApi2Loading(false); }
  }, [userId, development]);

  // Poll unread count + per-event counts
  const pollUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&dev=${development}&tab=pending&page=1&limit=100`);
      const data = await res.json();
      if (data.success) {
        setApi2UnreadCount(data.unreadCount || 0);
        // Build per-event unread map using event name from message
        const map: Record<string, number> = {};
        (data.notifications || []).forEach((n: Api2Notification) => {
          const eventName = n.resourceName || extractEventName(n.message) || 'unknown';
          map[eventName] = (map[eventName] || 0) + 1;
        });
        setEventUnreadMap(map);
      }
    } catch { /* silent */ }
  }, [userId, development]);

  useEffect(() => {
    if (!isRealUser) return;
    pollUnread();
    pollRef.current = setInterval(pollUnread, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRealUser, pollUnread]);

  // Push en tiempo real: cuando llega una "notification" por socket,
  // refrescar inmediatamente el contador y la lista visible (si el panel está abierto).
  useEffect(() => {
    if (!socket || !isRealUser) return;
    const onNotification = () => {
      pollUnread();
      if (!showPanel) return;
      if (view === 'event-notifications' && focusedEventId) {
        const ev = eventsGroup?.find(e => e._id === focusedEventId);
        fetchApi2(filter, api2Page, ev?.nombre);
      } else if (view === 'all-pending' || view === 'legacy' || view === 'history') {
        fetchApi2(filter, api2Page);
      }
    };
    socket.on('notification', onNotification);
    return () => { socket.off('notification', onNotification); };
  }, [socket, isRealUser, showPanel, view, focusedEventId, filter, api2Page, eventsGroup, pollUnread, fetchApi2]);

  const handleClose = () => {
    setShowPanel(false);
  };

  // ========================================
  // Panel open logic
  // ========================================

  const handleOpen = () => {
    setShowPanel(true);
    // Default view depends on whether an event is selected
    if (hasSelectedEvent) {
      setView('event-notifications');
      setFocusedEventId(selectedEvent._id);
      setFilter('pending');
      setApi2Page(1);
      fetchApi2('pending', 1, selectedEvent.nombre);
    } else {
      setView('events-overview');
    }
  };

  const handleEventClick = (eventId: string) => {
    setView('event-notifications');
    setFocusedEventId(eventId);
    setFilter('pending');
    setApi2Page(1);
    const eventName = eventsGroup?.find((e: any) => e._id === eventId)?.nombre;
    fetchApi2('pending', 1, eventName);
  };

  const handleShowAll = () => {
    setView('all-pending');
    setFocusedEventId(null);
    setFilter('pending');
    setApi2Page(1);
    fetchApi2('pending', 1);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setApi2Page(1);
    const eventName = focusedEventId ? eventsGroup?.find((e: any) => e._id === focusedEventId)?.nombre : undefined;
    fetchApi2(f === 'pending' ? 'pending' : 'all', 1, eventName);
  };

  const handleViewChange = (v: View) => {
    setView(v);
    setApi2Page(1);
    if (v === 'history') fetchApi2('history', 1);
    else if (v === 'events-overview') { /* no fetch needed */ }
    else if (v === 'legacy') fetchApi2('all', 1);
  };

  // Refetch on page change
  useEffect(() => {
    if (!showPanel || view === 'legacy' || view === 'events-overview') return;
    const tab = view === 'history' ? 'history' : filter === 'pending' ? 'pending' : 'all';
    const eventName = focusedEventId ? eventsGroup?.find((e: any) => e._id === focusedEventId)?.nombre : undefined;
    fetchApi2(tab, api2Page, eventName);
  }, [api2Page]);

  // Derived
  const totalUnread = api2UnreadCount;
  const api2TotalPages = Math.ceil(api2Total / (view === 'history' ? 50 : PAGE_SIZE));
  const focusedEventName = eventsGroup?.find((e: any) => e._id === focusedEventId)?.nombre || '';

  // Events with unread counts (for overview) — excluir archivados y realizados
  const eventsWithUnread = eventsGroup?.filter((ev: any) => {
    const status = (ev.estatus || ev.status || 'pendiente').toLowerCase();
    return status === 'pendiente';
  }).map((ev: any) => ({
    _id: ev._id,
    nombre: ev.nombre,
    unread: eventUnreadMap[ev.nombre?.toUpperCase()] || eventUnreadMap[ev.nombre] || eventUnreadMap[ev._id] || 0,
  })).sort((a: any, b: any) => b.unread - a.unread) || [];

  // ========================================
  // Render
  // ========================================

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div className="bg-white items-center flex relative cursor-default">
        {/* Bell icon */}
        <div
          onClick={() => showPanel ? handleClose() : handleOpen()}
          className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer"
        >
          <RiNotification2Fill
            className={`w-6 h-6 scale-x-90 transition-colors ${api2UnreadCount > 0 ? 'text-red-600 animate-pulse' : 'text-primary'}`}
          />
          {api2UnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[24px] h-[24px] rounded-full bg-red-600 flex items-center justify-center shadow-md">
              <span className="text-white text-[11px] font-bold leading-none">{api2UnreadCount > 99 ? '99+' : api2UnreadCount}</span>
            </span>
          )}
        </div>

        {/* Panel */}
        {showPanel && (
          <div
            className="absolute bg-white rounded-lg w-96 shadow-lg shadow-gray-400 top-0 right-10 translate-x-1/2 translate-y-[46px] overflow-hidden z-[60]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b-2 border-gray-300 py-2 px-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  {t("Mis notificaciones")}
                  {view === 'event-notifications' && focusedEventName
                    ? <span className="text-gray-400 text-xs ml-1">({focusedEventName})</span>
                    : view !== 'legacy' && <span className="text-gray-400 text-xs ml-1">({t("Todos")})</span>
                  }
                </span>
                {totalUnread > 0 && (
                  <span className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{totalUnread}</span>
                )}
              </div>
              {/* Navigation tabs */}
              <div className="flex gap-1 flex-wrap">
                <TabBtn active={view === 'legacy'} onClick={() => handleViewChange('legacy')} label={t("Actual")} />
                <TabBtn
                  active={view === 'events-overview' || view === 'event-notifications' || view === 'all-pending'}
                  onClick={() => handleViewChange('events-overview')}
                  label={t("Pendientes")}
                  badge={api2UnreadCount}
                />
                <TabBtn active={view === 'history'} onClick={() => handleViewChange('history')} label={t("Historial")} />
              </div>
            </div>

            {/* ========== VIEW: ACTUAL (últimas notificaciones via api2) ========== */}
            {view === 'legacy' && (
              <NotifList
                notifications={api2Notifs}
                loading={api2Loading}
                emptyText={t("No hay notificaciones")}
                totalPages={api2TotalPages}
                page={api2Page}
                onPageChange={setApi2Page}
                t={t}
                router={router}
                onMarkRead={markAsRead}
              />
            )}

            {/* ========== VIEW: EVENTS OVERVIEW (sin evento seleccionado) ========== */}
            {view === 'events-overview' && (
              <div className="max-h-[400px] overflow-y-auto">
                {/* Ver todas button */}
                <button onClick={handleShowAll} className="w-full text-left px-4 py-2.5 text-xs font-medium text-primary hover:bg-pink-50 border-b border-gray-100 flex justify-between items-center">
                  <span>📋 {t("Ver todas las pendientes")}</span>
                  {api2UnreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{api2UnreadCount}</span>}
                </button>
                {/* Events list */}
                {eventsWithUnread.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">{t("No hay eventos")}</div>
                ) : eventsWithUnread.map((ev: any) => (
                  <button
                    key={ev._id}
                    onClick={() => handleEventClick(ev._id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-sm">📅</span>
                    <span className="flex-1 text-xs text-gray-700 truncate">{ev.nombre}</span>
                    {ev.unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 font-bold shrink-0">
                        {ev.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ========== VIEW: EVENT NOTIFICATIONS / ALL PENDING ========== */}
            {(view === 'event-notifications' || view === 'all-pending') && (
              <div>
                {/* Sub-header: back + event name + filter */}
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  {!hasSelectedEvent && (
                    <button onClick={() => setView('events-overview')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
                  )}
                  <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                    {view === 'all-pending' ? t("Todos los eventos") : focusedEventName || t("Evento")}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleFilterChange('pending')} className={`px-2 py-0.5 text-[10px] rounded ${filter === 'pending' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-200'}`}>
                      {t("Pendientes")}
                    </button>
                    <button onClick={() => handleFilterChange('all')} className={`px-2 py-0.5 text-[10px] rounded ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-200'}`}>
                      {t("Todas")}
                    </button>
                  </div>
                </div>
                <NotifList
                  notifications={api2Notifs}
                  loading={api2Loading}
                  emptyText={t("No hay notificaciones")}
                  totalPages={api2TotalPages}
                  page={api2Page}
                  onPageChange={setApi2Page}
                  t={t}
                  router={router}
                />
              </div>
            )}

            {/* ========== VIEW: HISTORY (grouped by event) ========== */}
            {view === 'history' && (
              <ul className="max-h-[400px] overflow-y-auto">
                {api2Loading ? (
                  <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
                ) : api2Notifs.length === 0 ? (
                  <li className="py-8 text-center text-gray-400 text-xs">{t("No hay historial")}</li>
                ) : (() => {
                  const groups: Record<string, { name: string; id?: string; items: Api2Notification[] }> = {};
                  api2Notifs.forEach(n => {
                    const eventName = n.resourceName || extractEventName(n.message) || null;
                    const key = eventName || 'other';
                    if (!groups[key]) groups[key] = { name: eventName || t("General"), id: n.resourceId, items: [] };
                    groups[key].items.push(n);
                  });
                  return Object.entries(groups).map(([key, group]) => (
                    <li key={key} className="border-b border-gray-100">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => group.id && router.push(`/resumen-evento?event=${group.id}`)}>
                        <span className="text-sm">📅</span>
                        <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{group.name}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{group.items.length}</span>
                      </div>
                      <ul>
                        {group.items.slice(0, 5).map(notif => (
                          <li key={notif.id} className="flex gap-2 px-4 pl-8 py-2 hover:bg-base text-xs text-gray-600 cursor-pointer">
                            <span className="shrink-0">{TYPE_ICON[notif.type || ''] || '🔔'}</span>
                            <Interweave className="flex-1 break-words text-xs" content={notif.message} />
                            <RelativeTime date={new Date(notif.createdAt).getTime()} className="text-[10px] text-gray-400 shrink-0" />
                          </li>
                        ))}
                        {group.items.length > 5 && (
                          <li className="pl-8 py-1 text-[10px] text-primary italic cursor-pointer hover:underline" onClick={() => { handleEventClick(group.id || ''); }}>
                            +{group.items.length - 5} {t("más")}...
                          </li>
                        )}
                      </ul>
                    </li>
                  ));
                })()}
                {api2TotalPages > 1 && <li><Pagination page={api2Page} total={api2TotalPages} onPageChange={setApi2Page} t={t} /></li>}
              </ul>
            )}
          </div>
        )}
      </div>
    </ClickAwayListener>
  );
}

// ========================================
// Sub-components
// ========================================

function TabBtn({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${active ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
      {label}
      {!!badge && badge > 0 && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  );
}

function NotifList({ notifications, loading, emptyText, totalPages, page, onPageChange, t, router, onMarkRead }: {
  notifications: Api2Notification[]; loading: boolean; emptyText: string;
  totalPages: number; page: number; onPageChange: (p: number) => void;
  t: (k: string) => string; router: any; onMarkRead?: (id: string) => void;
}) {
  return (
    <div>
      <ul className="max-h-[340px] overflow-y-auto">
        {loading ? (
          <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
        ) : notifications.length === 0 ? (
          <li className="py-8 text-center text-gray-400 text-xs">{emptyText}</li>
        ) : notifications.map(n => {
          const eventName = n.resourceName || extractEventName(n.message);
          return (
            <li key={n.id} className="flex gap-2 px-4 py-2.5 hover:bg-base border-b border-gray-50 cursor-pointer"
                onClick={() => { if (!n.read && onMarkRead) onMarkRead(n.id); }}>
              <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type || ''] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <Interweave className="text-xs text-gray-700 break-words" content={n.message} />
                {eventName && <span className="text-[10px] text-primary font-medium block mt-0.5">📅 {eventName}</span>}
                <RelativeTime date={new Date(n.createdAt).getTime()} className="text-[10px] text-gray-400 italic block" />
              </div>
              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-green shrink-0 mt-2" />}
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && <Pagination page={page} total={totalPages} onPageChange={onPageChange} t={t} />}
    </div>
  );
}

function Pagination({ page, total, onPageChange, t }: { page: number; total: number; onPageChange: (p: number) => void; t: (k: string) => string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 border-t bg-gray-50">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="text-[10px] text-gray-500 disabled:opacity-30">← {t("Anterior")}</button>
      <span className="text-[10px] text-gray-400">{page}/{total}</span>
      <button onClick={() => onPageChange(Math.min(total, page + 1))} disabled={page >= total} className="text-[10px] text-gray-500 disabled:opacity-30">{t("Siguiente")} →</button>
    </div>
  );
}
