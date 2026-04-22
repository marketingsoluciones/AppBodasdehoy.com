import { useEffect, useState, useCallback, useRef } from "react";
import ClickAwayListener from "react-click-away-listener"
import { RiNotification2Fill } from "react-icons/ri";
import { MisEventosIcon, TarjetaIcon } from "./icons";
import { fetchApiBodas, queries } from "../utils/Fetching";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider } from "../context";
import { Notification, ResultNotifications } from "../utils/Interfaces";
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
const POLL_INTERVAL = 60_000;

const TYPE_ICON: Record<string, string> = {
  whatsapp_message: '💬', task_reminder: '📋', access_revoked: '🔒',
  permission_updated: '🔑', resource_shared: '📤', resource_access_revoked: '🚫',
  user: '👤', event: '📅', shop: '🛒',
};

// ========================================
// Component
// ========================================

export const Notifications = () => {
  const { t } = useTranslation()
  const { event: selectedEvent } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, config } = AuthContextProvider()
  const { notifications, setNotifications } = SocketContextProvider()
  const router = useRouter()

  const [showPanel, setShowPanel] = useState(false);
  const [view, setView] = useState<View>('legacy');
  const [filter, setFilter] = useState<Filter>('pending');
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);

  // Legacy state
  const [countScroll, setCountScroll] = useState({ count: 1 })
  const [showLoad, setShowLoad] = useState(false);
  const detallesUsuarioIds = eventsGroup?.flatMap(ev => [...ev.detalles_compartidos_array, ev.detalles_usuario_id])?.filter(Boolean);

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

  // ========================================
  // API2 fetch
  // ========================================

  const fetchApi2 = useCallback(async (tab: string, page: number, eventId?: string) => {
    if (!userId) return;
    setApi2Loading(true);
    try {
      let url = `/api/notifications?userId=${userId}&dev=${development}&tab=${tab}&page=${page}&limit=${tab === 'history' ? 50 : PAGE_SIZE}`;
      if (eventId) url += `&eventId=${eventId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setApi2Notifs(data.notifications || []);
        setApi2Total(data.total || 0);
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
        // Build per-event unread map
        const map: Record<string, number> = {};
        (data.notifications || []).forEach((n: Api2Notification) => {
          const eid = n.resourceId || 'unknown';
          map[eid] = (map[eid] || 0) + 1;
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

  // ========================================
  // Legacy notifications (tab "Actual")
  // ========================================

  let skip = 0;
  const handleScroll = (e: any) => {
    const zf = window.devicePixelRatio;
    const sh = e.target.scrollHeight / zf;
    const oh = e.target.offsetHeight / zf;
    const st = e.target.scrollTop / zf;
    if (notifications?.results && st + oh >= sh - 5 && notifications.results.length < notifications.total && skip !== 8 * countScroll.count) {
      skip = 8 * countScroll.count;
      setShowLoad(true);
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user.uid }, sort: { createdAt: -1 }, skip: 8 * countScroll.count, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        if (result) {
          countScroll.count++;
          setCountScroll({ ...countScroll });
          notifications.total = result.total;
          notifications.results = [...notifications.results, ...result.results];
          setShowLoad(false);
          setNotifications({ ...notifications });
        }
      }).catch(() => setShowLoad(false));
    }
  };

  useEffect(() => {
    if (isRealUser) {
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user?.uid }, sort: { createdAt: -1 }, skip: 0, limit: 8 },
        development: config?.development
      }).then((r: ResultNotifications) => { if (r) setNotifications(r); }).catch(() => {});
    }
  }, [user?.uid]);

  useEffect(() => {
    if (showPanel && view === 'legacy' && notifications?.results?.length > 0 && notifications.results[0]?.state === "sent") {
      const reduce = notifications.results.reduce((acc: any, item: any) => {
        if (item.state === "sent") { acc.ids.push(item._id); acc.results.push({ ...item, state: "received" }); }
        else acc.results.push(item);
        return acc;
      }, { results: [], ids: [] });
      if (reduce.ids.length) {
        fetchApiBodas({ query: queries.updateNotifications, variables: { args: { _id: reduce.ids, state: "received" } }, development: config?.development })
          .then((r: any) => { if (r) { notifications.results = reduce.results; setNotifications({ ...notifications }); } }).catch(() => {});
      }
    }
  }, [showPanel, view]);

  const handleClose = () => {
    setShowPanel(false);
    if (view !== 'legacy' || !notifications?.results?.length) return;
    const reduce = notifications.results.reduce((acc: any, item: any) => {
      if (item.state === "received") { acc.ids.push(item._id); acc.results.push({ ...item, state: "read" }); }
      else acc.results.push(item);
      return acc;
    }, { results: [], ids: [] });
    if (reduce.ids.length) {
      fetchApiBodas({ query: queries.updateNotifications, variables: { args: { _id: reduce.ids, state: "read" } }, development: config?.development })
        .then((r: any) => { if (r) { notifications.results = reduce.results; setNotifications({ ...notifications }); } }).catch(() => {});
    }
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
      fetchApi2('pending', 1, selectedEvent._id);
    } else {
      setView('events-overview');
    }
  };

  const handleEventClick = (eventId: string) => {
    setView('event-notifications');
    setFocusedEventId(eventId);
    setFilter('pending');
    setApi2Page(1);
    fetchApi2('pending', 1, eventId);
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
    fetchApi2(f === 'pending' ? 'pending' : 'all', 1, focusedEventId || undefined);
  };

  const handleViewChange = (v: View) => {
    setView(v);
    setApi2Page(1);
    if (v === 'history') fetchApi2('history', 1);
    else if (v === 'events-overview') { /* no fetch needed */ }
    else if (v === 'legacy') { /* legacy uses its own state */ }
  };

  // Refetch on page change
  useEffect(() => {
    if (!showPanel || view === 'legacy' || view === 'events-overview') return;
    const tab = view === 'history' ? 'history' : filter === 'pending' ? 'pending' : 'all';
    fetchApi2(tab, api2Page, focusedEventId || undefined);
  }, [api2Page]);

  // Derived
  const legacyUnread = notifications?.results?.filter((n: Notification) => n.state === 'sent').length || 0;
  const totalUnread = legacyUnread + api2UnreadCount;
  const api2TotalPages = Math.ceil(api2Total / (view === 'history' ? 50 : PAGE_SIZE));
  const focusedEventName = eventsGroup?.find((e: any) => e._id === focusedEventId)?.nombre || '';

  // Events with unread counts (for overview) — excluir archivados y realizados
  const eventsWithUnread = eventsGroup?.filter((ev: any) => {
    const status = (ev.estatus || ev.status || 'pendiente').toLowerCase();
    return status === 'pendiente';
  }).map((ev: any) => ({
    _id: ev._id,
    nombre: ev.nombre,
    unread: eventUnreadMap[ev._id] || 0,
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
          <RiNotification2Fill className="text-primary w-6 h-6 scale-x-90" />
          {notifications?.results?.length > 0 && notifications.results[0]?.state === "sent" && (
            <div className="absolute w-2.5 h-2.5 rounded-full bg-green translate-x-2.5 translate-y-1.5" />
          )}
          {api2UnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-0.5">
              <span className="text-white text-[9px] font-bold">{api2UnreadCount > 99 ? '99+' : api2UnreadCount}</span>
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
                <span className="text-gray-600 text-sm font-medium">{t("Mis notificaciones")}</span>
                {totalUnread > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{totalUnread}</span>
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

            {/* ========== VIEW: LEGACY (original, intacta) ========== */}
            {view === 'legacy' && (
              <ul id="ul-notifications" className="bg-white flex flex-col text-xs text-black max-h-[365px] overflow-y-scroll break-words">
                {notifications?.results?.map((item: Notification, idx: number) => {
                  if (item.fromUid != null) {
                    const eventID = item?.focused?.split("event=")[1]?.split("&")[0];
                    const eventExist = eventsGroup.find((ev: any) => ev._id === eventID);
                    return (
                      <li key={idx} onClick={() => item?.focused && eventExist && router.push(`${window.location.origin}${item.focused}`)} className={`flex w-full ${item?.focused && "cursor-pointer"}`}>
                        <div className="w-full hover:bg-base text-gray-700 flex py-2 ml-2">
                          <div className="bg-white text-gray-500 w-7 h-7 rounded-full border-gray-200 border flex justify-center items-center -translate-y-1 mx-1">
                            {(!item?.type || item?.type === "event") && <MisEventosIcon className="w-5 h-5" />}
                            {item?.type === "shop" && <TarjetaIcon className="w-5 h-5" />}
                            {item?.type === "user" && <div className="w-5 h-5"><ImageAvatar user={detallesUsuarioIds?.find((elem: any) => elem?.uid === item?.fromUid)} disabledTooltip /></div>}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <Interweave className="text-xs break-words w-[248px]" content={item?.type === "user" ? `${detallesUsuarioIds?.find((elem: any) => elem?.uid === item?.fromUid)?.displayName} ${item?.message}` : item?.message} />
                            <RelativeTime date={item.createdAt} className="text-[10px] flex-1 text-right italic" />
                          </div>
                          <div className="w-4 flex items-center justify-center">
                            {item?.state !== "read" && <div className="w-2.5 h-2.5 rounded-full bg-green" />}
                          </div>
                        </div>
                      </li>
                    );
                  }
                  return null;
                })}
                <li className="flex items-center justify-center py-2">
                  <span className="text-xs first-letter:capitalize">{
                    notifications?.results?.length === notifications?.total
                      ? notifications?.results?.length ? t("no hay más notificaciones") : t("no hay notificaciones")
                      : !showLoad ? t("burcar más") : t("cargando")
                  }</span>
                </li>
              </ul>
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
                {/* Notification list */}
                <ul className="max-h-[340px] overflow-y-auto">
                  {api2Loading ? (
                    <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
                  ) : api2Notifs.length === 0 ? (
                    <li className="py-8 text-center text-gray-400 text-xs">{t("No hay notificaciones")}</li>
                  ) : api2Notifs.map(n => (
                    <li key={n.id} className="flex gap-2 px-4 py-2.5 hover:bg-base border-b border-gray-50 cursor-pointer" onClick={() => n.resourceId && router.push(`/resumen-evento?event=${n.resourceId}`)}>
                      <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type || ''] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 break-words">{n.message}</p>
                        {n.resourceName && <span className="text-[10px] text-gray-400">{n.resourceName}</span>}
                        <RelativeTime date={new Date(n.createdAt).getTime()} className="text-[10px] text-gray-400 italic block" />
                      </div>
                      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-green shrink-0 mt-2" />}
                    </li>
                  ))}
                </ul>
                {/* Pagination */}
                {api2TotalPages > 1 && <Pagination page={api2Page} total={api2TotalPages} onPageChange={setApi2Page} t={t} />}
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
                    const key = n.resourceName || n.resourceId || 'other';
                    if (!groups[key]) groups[key] = { name: n.resourceName || t("Sin evento"), id: n.resourceId, items: [] };
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
                          <li key={notif.id} className="flex gap-2 px-4 pl-8 py-2 hover:bg-base text-xs text-gray-600">
                            <span className="shrink-0">{TYPE_ICON[notif.type || ''] || '🔔'}</span>
                            <span className="flex-1 break-words">{notif.message}</span>
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
        <span className={`text-[9px] px-1 py-0 rounded-full font-bold ${active ? 'bg-white/30 text-white' : 'bg-red-100 text-red-600'}`}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
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
