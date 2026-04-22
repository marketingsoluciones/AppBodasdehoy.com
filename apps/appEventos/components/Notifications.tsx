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
// API2 modern notifications (tabs Historial/Revisadas)
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

type Tab = 'current' | 'pending' | 'reviewed' | 'history';

const PAGE_SIZE = 20;
const POLL_INTERVAL = 60_000;

const TYPE_ICON: Record<string, string> = {
  whatsapp_message: '💬', task_reminder: '📋', access_revoked: '🔒',
  permission_updated: '🔑', resource_shared: '📤', resource_access_revoked: '🚫',
  user: '👤', event: '📅',
};

// ========================================
// Component
// ========================================

export const Notifications = () => {
  const { t } = useTranslation()
  const { event } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider();
  const { user, config } = AuthContextProvider()
  const { notifications, setNotifications } = SocketContextProvider()
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMounted, setIsMounted] = useState(false)
  const [countScroll, setCountScroll] = useState({ count: 1 })
  const [showLoad, setShowLoad] = useState<boolean>(false);
  const router = useRouter()
  const detallesUsuarioIds = eventsGroup?.flatMap(event => [...event.detalles_compartidos_array, event.detalles_usuario_id])?.filter(id => id !== undefined);

  // New tabs state
  const [tab, setTab] = useState<Tab>('current');
  const [api2Notifications, setApi2Notifications] = useState<Api2Notification[]>([]);
  const [api2Total, setApi2Total] = useState(0);
  const [api2UnreadCount, setApi2UnreadCount] = useState(0);
  const [api2Page, setApi2Page] = useState(1);
  const [api2Loading, setApi2Loading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const development = config?.development || 'bodasdehoy';
  const userId = user?.uid;
  const isRealUser = !!userId && user?.displayName !== 'guest' && user?.displayName !== 'anonymous';

  // ========================================
  // Legacy notifications (original behavior — tab "current")
  // ========================================

  let skip = 0
  const handleScroll = (e: any) => {
    const zoomFactor = window.devicePixelRatio;
    const scrollHeight = e.target.scrollHeight / zoomFactor;
    const offsetHeight = e.target.offsetHeight / zoomFactor;
    const scrollTop = e.target.scrollTop / zoomFactor;
    if (notifications?.results && scrollTop + offsetHeight >= scrollHeight - 5 && notifications.results.length < notifications.total && skip !== 8 * countScroll.count) {
      skip = (8 * countScroll.count)
      setShowLoad(true)
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user.uid }, sort: { createdAt: -1 }, skip: 8 * countScroll.count, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        if (result) {
          countScroll.count++
          setCountScroll({ ...countScroll })
          notifications.total = result.total
          notifications.results = [...notifications.results, ...result.results]
          setShowLoad(false)
          setNotifications({ ...notifications })
        }
      }).catch(() => setShowLoad(false))
    }
  };

  useEffect(() => {
    if (!isMounted) setIsMounted(true)
    return () => { setIsMounted(false) }
  }, [])

  useEffect(() => {
    if (showNotifications && tab === 'current') {
      const d = document.getElementById("ul-notifications")
      d?.addEventListener("scroll", handleScroll, { passive: true });
    }
  }, [showNotifications, tab]);

  useEffect(() => {
    const isReal = user?.uid && user?.displayName !== 'guest' && user?.displayName !== 'anonymous';
    if (isReal) {
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user?.uid }, sort: { createdAt: -1 }, skip: 0, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        if (result) setNotifications(result)
      }).catch(() => { /* legacy query may fail if api2 removed schema */ })
    }
  }, [user?.uid])

  useEffect(() => {
    if (showNotifications && tab === 'current' && notifications?.results && notifications.results.length > 0 && notifications.results[0]?.state === "sent") {
      const notificationsReduce = notifications?.results.reduce((acc: any, item: any) => {
        if (item.state === "sent") {
          acc.ids.push(item._id)
          acc.results.push({ ...item, state: "received" })
          return acc
        }
        acc.results.push(item)
        return acc
      }, { results: [], ids: [] })
      if (notificationsReduce?.ids?.length) {
        fetchApiBodas({
          query: queries.updateNotifications,
          variables: { args: { _id: notificationsReduce.ids, state: "received" } },
          development: config?.development
        }).then((result: ResultNotifications) => {
          if (result) {
            notifications.results = notificationsReduce.results
            setNotifications({ ...notifications })
          }
        }).catch(() => {})
      }
    }
  }, [showNotifications, tab])

  const handleFalseShowNotifications = () => {
    setShowNotifications(false)
    if (!notifications?.results || notifications.results.length === 0 || tab !== 'current') return
    const notificationsReduce = notifications.results.reduce((acc: any, item: any) => {
      if (item.state === "received") {
        acc.ids.push(item._id)
        acc.results.push({ ...item, state: "read" })
        return acc
      }
      acc.results.push(item)
      return acc
    }, { results: [], ids: [] })
    if (notificationsReduce?.ids?.length) {
      fetchApiBodas({
        query: queries.updateNotifications,
        variables: { args: { _id: notificationsReduce.ids, state: "read" } },
        development: config?.development
      }).then((result: ResultNotifications) => {
        if (result) {
          notifications.results = notificationsReduce.results
          setNotifications({ ...notifications })
        }
      }).catch(() => {})
    }
  }

  // ========================================
  // API2 modern notifications (tabs pending/reviewed/history)
  // ========================================

  const fetchApi2 = useCallback(async (selectedTab: Tab, selectedPage: number) => {
    if (!userId) return;
    setApi2Loading(true);
    try {
      const apiTab = selectedTab === 'history' ? 'history' : selectedTab;
      const limit = selectedTab === 'history' ? 50 : PAGE_SIZE;
      const res = await fetch(`/api/notifications?userId=${userId}&dev=${development}&tab=${apiTab}&page=${selectedPage}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setApi2Notifications(data.notifications || []);
        setApi2Total(data.total || 0);
        setApi2UnreadCount(data.unreadCount || 0);
      }
    } catch { /* silent */ }
    finally { setApi2Loading(false); }
  }, [userId, development]);

  // Poll unread count
  const pollUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&dev=${development}&tab=pending&page=1&limit=1`);
      const data = await res.json();
      if (data.success) setApi2UnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
  }, [userId, development]);

  useEffect(() => {
    if (!isRealUser) return;
    pollUnread();
    pollRef.current = setInterval(pollUnread, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRealUser, pollUnread]);

  // Fetch when switching to api2 tabs
  useEffect(() => {
    if (showNotifications && tab !== 'current') {
      fetchApi2(tab, api2Page);
    }
  }, [showNotifications, tab, api2Page, fetchApi2]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setApi2Page(1);
  };

  // Badge: legacy unread + api2 unread
  const legacyUnread = notifications?.results?.filter((n: Notification) => n.state === 'sent').length || 0;
  const totalUnread = legacyUnread + api2UnreadCount;
  const api2TotalPages = Math.ceil(api2Total / PAGE_SIZE);

  // ========================================
  // Render
  // ========================================

  return (
    <ClickAwayListener onClickAway={() => { handleFalseShowNotifications() }}>
      <div onClick={() => { !showNotifications ? (setShowNotifications(true), setTab('current')) : handleFalseShowNotifications() }} className="bg-white items-center flex relative cursor-default">
        {/* Bell icon — original style */}
        <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer" >
          <RiNotification2Fill className="text-primary w-6 h-6 scale-x-90" />
          {/* Original green dot for legacy */}
          {notifications?.results && notifications.results.length > 0 && notifications.results[0]?.state === "sent" && <div className={`absolute w-2.5 h-2.5 rounded-full bg-green translate-x-2.5 translate-y-1.5`} />}
          {/* Red badge for api2 unread */}
          {api2UnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-0.5">
              <span className="text-white text-[9px] font-bold">{api2UnreadCount > 99 ? '99+' : api2UnreadCount}</span>
            </span>
          )}
        </div>

        {/* Panel */}
        {showNotifications && (
          <div className="absolute bg-white rounded-lg w-96 h-max shadow-lg shadow-gray-400 top-0 right-10 translate-x-1/2 translate-y-[46px] overflow-hidden z-[60] title-display" onClick={e => e.stopPropagation()}>
            {/* Header with tabs */}
            <div className="w-full border-b-2 border-gray-300 py-2 px-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">{t("Mis notificaciones")}</span>
                {totalUnread > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                )}
              </div>
              <div className="flex gap-1 flex-wrap">
                {(['current', 'pending', 'reviewed', 'history'] as Tab[]).map(tabId => (
                  <button
                    key={tabId}
                    onClick={() => handleTabChange(tabId)}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                      tab === tabId ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {tabId === 'current' ? t("Actual") : tabId === 'pending' ? t("Pendientes") : tabId === 'reviewed' ? t("Revisadas") : t("Historial")}
                  </button>
                ))}
              </div>
            </div>

            {/* ========== TAB: CURRENT (original legacy view) ========== */}
            {tab === 'current' && (
              <ul id="ul-notifications" className="bg-white flex flex-col text-xs place-items-left text-black max-h-[365px] overflow-y-scroll break-words">
                {notifications?.results?.map((item: Notification, idx: number) => {
                  if (item.fromUid != null) {
                    const eventID = item?.focused?.split("event=")[1]?.split("&")[0]
                    const eventExist = eventsGroup.find(event => event._id === eventID)

                    return (
                      <li key={idx} onClick={() => {
                        if (item?.focused && eventExist) {
                          router.push(`${window.location.origin}${item.focused}`)
                        }
                      }} className={`flex w-full ${item?.focused && "cursor-pointer"}`}>
                        <div className="w-full hover:bg-base text-gray-700 flex py-2 ml-2">
                          <div className="bg-white text-gray-500 w-7 h-7 rounded-full border-gray-200 border-[1px] flex justify-center items-center -translate-y-1 mx-1">
                            {(!item?.type || item?.type === "event") && <MisEventosIcon className="w-5 h-5" />}
                            {(item?.type === "shop") && <TarjetaIcon className="w-5 h-5" />}
                            {(item?.type === "user") && <div className="w-5 h-5">
                              <ImageAvatar user={detallesUsuarioIds.find(elem => elem?.uid === item?.fromUid)} disabledTooltip />
                            </div>}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <Interweave
                              className="text-xs break-words w-[248px]"
                              content={
                                item?.type === "user"
                                  ? `${detallesUsuarioIds.find(elem => elem?.uid === item?.fromUid)?.displayName} ${item?.message}`
                                  : item?.message
                              }
                            />
                            <RelativeTime date={item.createdAt} className="text-[10px] flex-1 text-right italic" />
                          </div>
                          <div className="w-4 flex items-center justify-center">
                            {item?.state !== "read" && <div className={`w-2.5 h-2.5 rounded-full bg-green`} />}
                          </div>
                        </div>
                      </li>
                    )
                  }
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

            {/* ========== TAB: PENDING / REVIEWED (flat list from api2) ========== */}
            {(tab === 'pending' || tab === 'reviewed') && (
              <ul className="bg-white max-h-[365px] overflow-y-auto">
                {api2Loading ? (
                  <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
                ) : api2Notifications.length === 0 ? (
                  <li className="py-8 text-center text-gray-400 text-xs">
                    {tab === 'pending' ? t("No hay notificaciones pendientes") : t("No hay notificaciones revisadas")}
                  </li>
                ) : api2Notifications.map(notif => (
                  <li key={notif.id} className="flex gap-2 px-4 py-3 hover:bg-base border-b border-gray-50 cursor-pointer" onClick={() => notif.resourceId && router.push(`/resumen-evento?event=${notif.resourceId}`)}>
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[notif.type || ''] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 break-words">{notif.message}</p>
                      <RelativeTime date={new Date(notif.createdAt).getTime()} className="text-[10px] text-gray-400 italic mt-1 block" />
                    </div>
                    {!notif.read && <span className="w-2.5 h-2.5 rounded-full bg-green shrink-0 mt-2" />}
                  </li>
                ))}
                {api2TotalPages > 1 && (
                  <li className="flex justify-between px-4 py-2 border-t bg-gray-50">
                    <button onClick={() => setApi2Page(p => Math.max(1, p - 1))} disabled={api2Page <= 1} className="text-[10px] text-gray-500 disabled:opacity-30">← {t("Anterior")}</button>
                    <span className="text-[10px] text-gray-400">{api2Page}/{api2TotalPages}</span>
                    <button onClick={() => setApi2Page(p => Math.min(api2TotalPages, p + 1))} disabled={api2Page >= api2TotalPages} className="text-[10px] text-gray-500 disabled:opacity-30">{t("Siguiente")} →</button>
                  </li>
                )}
              </ul>
            )}

            {/* ========== TAB: HISTORY (grouped by event) ========== */}
            {tab === 'history' && (
              <ul className="bg-white max-h-[365px] overflow-y-auto">
                {api2Loading ? (
                  <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
                ) : api2Notifications.length === 0 ? (
                  <li className="py-8 text-center text-gray-400 text-xs">{t("No hay historial")}</li>
                ) : (() => {
                  const groups: Record<string, { name: string; id?: string; items: Api2Notification[] }> = {};
                  api2Notifications.forEach(n => {
                    const key = n.resourceName || n.resourceId || 'other';
                    if (!groups[key]) groups[key] = { name: n.resourceName || t("Sin evento"), id: n.resourceId, items: [] };
                    groups[key].items.push(n);
                  });
                  return Object.entries(groups).map(([key, group]) => (
                    <li key={key} className="border-b border-gray-100">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => group.id && router.push(`/resumen-evento?event=${group.id}`)}>
                        <span className="text-sm">📅</span>
                        <span className="text-xs font-semibold text-gray-700 flex-1">{group.name}</span>
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
                          <li className="pl-8 py-1 text-[10px] text-primary italic cursor-pointer hover:underline" onClick={() => group.id && router.push(`/resumen-evento?event=${group.id}`)}>
                            +{group.items.length - 5} {t("más")}...
                          </li>
                        )}
                      </ul>
                    </li>
                  ));
                })()}
                {api2TotalPages > 1 && (
                  <li className="flex justify-between px-4 py-2 border-t bg-gray-50">
                    <button onClick={() => setApi2Page(p => Math.max(1, p - 1))} disabled={api2Page <= 1} className="text-[10px] text-gray-500 disabled:opacity-30">← {t("Anterior")}</button>
                    <span className="text-[10px] text-gray-400">{api2Page}/{api2TotalPages}</span>
                    <button onClick={() => setApi2Page(p => Math.min(api2TotalPages, p + 1))} disabled={api2Page >= api2TotalPages} className="text-[10px] text-gray-500 disabled:opacity-30">{t("Siguiente")} →</button>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </ClickAwayListener>
  )
}
