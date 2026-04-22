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
// API2 modern notifications (same as chat-ia)
// ========================================

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const POLL_INTERVAL = 60_000; // 60s

const API2_UNREAD_COUNT_QUERY = `query { getUnreadNotificationsCount }`;

const API2_GET_NOTIFICATIONS_QUERY = `
  query GetNotifications($filters: NotificationFilters, $pagination: CRM_PaginationInput) {
    getNotifications(filters: $filters, pagination: $pagination) {
      success
      total
      unreadCount
      notifications {
        id type resourceType resourceId resourceName
        message read readAt development createdAt
      }
    }
  }
`;

const API2_MARK_READ_QUERY = `
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) { success }
  }
`;

async function api2Query<T>(query: string, variables?: Record<string, unknown>, token?: string, development?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Development': development || 'bodasdehoy',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API2_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** Convert api2 notification to legacy format for unified display */
function api2ToLegacy(n: { id: string; message: string; read: boolean; createdAt: string; type?: string; resourceId?: string }): Notification {
  return {
    _id: `api2_${n.id}`,
    uid: '',
    message: n.message,
    state: n.read ? 'read' : 'sent',
    type: n.type || 'event',
    fromUid: 'system',
    focused: '',
    createdAt: new Date(n.createdAt).getTime(),
    updatedAt: new Date(n.createdAt).getTime(),
  };
}

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
  const [api2UnreadCount, setApi2UnreadCount] = useState(0);
  const router = useRouter()
  const detallesUsuarioIds = eventsGroup?.flatMap(event => [...event.detalles_compartidos_array, event.detalles_usuario_id])?.filter(id => id !== undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const development = config?.development || 'bodasdehoy';
  const isRealUser = user?.uid && user?.displayName !== 'guest' && user?.displayName !== 'anonymous';

  // Get auth token for api2 calls (Firebase ID token or session cookie as fallback)
  const getToken = useCallback(async (): Promise<string | undefined> => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (firebaseToken) return firebaseToken;
    } catch { /* no Firebase auth available */ }
    // Fallback: use session cookie (bypass mode in test)
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const session = cookies.find(c => c.startsWith('idTokenV0.1.0='));
      if (session) return session.split('=')[1];
    } catch { /* no cookie */ }
    return undefined;
  }, []);

  // Poll api2 unread count
  const pollUnreadCount = useCallback(async () => {
    if (!isRealUser) return;
    const token = await getToken();
    const data = await api2Query<{ getUnreadNotificationsCount: number }>(
      API2_UNREAD_COUNT_QUERY, undefined, token, development
    );
    if (data) setApi2UnreadCount(data.getUnreadNotificationsCount ?? 0);
  }, [isRealUser, development, getToken]);

  // Start polling
  useEffect(() => {
    if (!isRealUser) return;
    pollUnreadCount();
    pollRef.current = setInterval(pollUnreadCount, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRealUser, pollUnreadCount]);

  // Fetch api2 modern notifications when panel opens
  const fetchApi2Notifications = useCallback(async () => {
    if (!isRealUser) return;
    const token = await getToken();
    const data = await api2Query<{
      getNotifications: { notifications: Array<{ id: string; message: string; read: boolean; createdAt: string; type?: string; resourceId?: string }>, unreadCount: number }
    }>(API2_GET_NOTIFICATIONS_QUERY, { pagination: { limit: 20, page: 1 } }, token, development);

    if (data?.getNotifications?.notifications?.length) {
      const api2Items = data.getNotifications.notifications.map(api2ToLegacy);
      setApi2UnreadCount(data.getNotifications.unreadCount ?? 0);

      // Merge with existing legacy notifications (api2 items at top)
      setNotifications(prev => {
        const legacyItems = (prev?.results || []).filter(n => !n._id.startsWith('api2_'));
        const merged = [...api2Items, ...legacyItems];
        return {
          total: merged.length,
          results: merged,
        };
      });
    }
  }, [isRealUser, development, getToken, setNotifications]);

  // Mark api2 notification as read
  const markApi2AsRead = useCallback(async (notificationId: string) => {
    const realId = notificationId.replace('api2_', '');
    const token = await getToken();
    await api2Query(API2_MARK_READ_QUERY, { notificationId: realId }, token, development);
    setApi2UnreadCount(prev => Math.max(0, prev - 1));
  }, [development, getToken]);

  let skip = 0
  const handleScroll = (e) => {
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
        countScroll.count++
        setCountScroll({ ...countScroll })
        notifications.total = result.total
        notifications.results = [...notifications.results, ...result.results]
        setShowLoad(false)
        setNotifications({ ...notifications })
      })
    }
  };

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    if (showNotifications) {
      const d = document.getElementById("ul-notifications")
      d?.addEventListener("scroll", handleScroll, { passive: true });
      // Also fetch api2 modern notifications when panel opens
      fetchApi2Notifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    // Cargar notificaciones cuando el usuario real esté disponible.
    if (isRealUser) {
      fetchApiBodas({
        query: queries.getNotifications,
        variables: { args: { uid: user?.uid }, sort: { createdAt: -1 }, skip: 0, limit: 8 },
        development: config?.development
      }).then((result: ResultNotifications) => {
        setNotifications(result)
      })
    }
  }, [user?.uid])

  useEffect(() => {
    if (showNotifications && notifications?.results && notifications.results.length > 0 && notifications.results[0]?.state === "sent") {
      const notificationsReduce = notifications?.results.reduce((acc, item) => {
        if (item.state === "sent" && !item._id.startsWith('api2_')) {
          acc.ids.push(item._id)
          acc.results.push({ ...item, state: "received" })
          return acc
        }
        acc.results.push(item)
        return acc
      }, { results: [] as Notification[], ids: [] as string[] })
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
        })
      }
    }
  }, [showNotifications])

  const handleFalseShowNotifications = () => {
    setShowNotifications(false)
    if (!notifications?.results || notifications.results.length === 0) {
      return
    }
    const notificationsReduce = notifications.results.reduce((acc, item) => {
      if (item.state === "received" && !item._id.startsWith('api2_')) {
        acc.ids.push(item._id)
        acc.results.push({ ...item, state: "read" })
        return acc
      }
      acc.results.push(item)
      return acc
    }, { results: [] as Notification[], ids: [] as string[] })
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
      })
    }
  }

  // Badge: legacy unread + api2 unread
  const legacyUnread = notifications?.results?.filter(n => n.state === 'sent' && !n._id.startsWith('api2_')).length || 0;
  const totalUnread = legacyUnread + api2UnreadCount;

  // Type icons for api2 notifications
  const typeIcon: Record<string, string> = {
    whatsapp_message: '💬',
    task_reminder: '📋',
    access_revoked: '🔒',
    permission_updated: '🔑',
    resource_shared: '📤',
    resource_access_revoked: '🚫',
  };

  return (
    <ClickAwayListener onClickAway={() => { handleFalseShowNotifications() }}>
      <div onClick={() => { !showNotifications ? setShowNotifications(true) : handleFalseShowNotifications() }} className="bg-white items-center flex relative cursor-default">
        <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer" >
          <RiNotification2Fill className="text-primary w-6 h-6 scale-x-90" />
          {totalUnread > 0 && (
            <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold px-1">{totalUnread > 99 ? '99+' : totalUnread}</span>
            </div>
          )}
        </div>
        {showNotifications && (
          <div className="absolute bg-white rounded-lg w-80 h-max shadow-lg shadow-gray-400 top-0 right-10 translate-x-1/2 translate-y-[46px] overflow-hidden z-[60] title-display">
            <div className="w-full pb-2 flex justify-between items-center text-gray-600 border-[1px] border-b-2 rounded-lg rounded-b-none border-gray-300 py-2 px-3 text-sm">
              <span>{t("Mis notificaciones")}</span>
              {totalUnread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {totalUnread} {t("sin leer")}
                </span>
              )}
            </div>
            <ul id="ul-notifications" className="bg-white flex flex-col text-xs place-items-left text-black max-h-[365px] overflow-y-scroll break-words">
              {notifications?.results?.map((item: Notification, idx: number) => {
                const isApi2 = item._id.startsWith('api2_');

                if (isApi2) {
                  // Modern api2 notification
                  return (
                    <li key={item._id} onClick={() => {
                      if (item.state !== 'read') markApi2AsRead(item._id);
                    }} className="flex w-full cursor-pointer">
                      <div className="w-full hover:bg-base text-gray-700 flex py-2 ml-2">
                        <div className="bg-white text-gray-500 w-7 h-7 rounded-full border-gray-200 border-[1px] flex justify-center items-center -translate-y-1 mx-1 text-sm">
                          {typeIcon[item.type] || '🔔'}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-xs break-words w-[248px]">{item.message}</span>
                          <RelativeTime date={item.createdAt} className="text-[10px] flex-1 text-right italic" />
                        </div>
                        <div className="w-4 flex items-center justify-center">
                          {item.state !== "read" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                      </div>
                    </li>
                  );
                }

                // Legacy notification
                if (item.fromUid != null) {
                  const eventID = item?.focused?.split("event=")[1]?.split("&")[0]
                  const itineraryID = item?.focused?.split("itinerary=")[1]?.split("&")[0];
                  const taskID = item?.focused?.split("task=")[1]?.split("&")[0];
                  const eventExist = eventsGroup.find(event => event._id === eventID)

                  return (
                    <li key={idx} onClick={() => {
                      if (item?.focused) {
                        if (eventExist) {
                          router.push(`${window.location.origin}${item.focused}`)
                        }
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
                          <RelativeTime
                            date={item.createdAt}
                            className="text-[10px] flex-1 text-right italic"
                          />
                        </div>
                        <div className="w-4 flex items-center justify-center">
                          {item?.state !== "read" && <div className={`w-2.5 h-2.5 rounded-full bg-green`} />}
                        </div>
                      </div>
                    </li>
                  )
                }
              })}
              <li className="flex items-center justify-center">
                <span className="text-xs first-letter:capitalize">{
                  notifications?.results?.length === notifications?.total
                    ? notifications?.results?.length ? t("no hay más notificaciones") : t("no hay notificaciones")
                    : !showLoad ? t("burcar más") : t("cargando")
                }</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </ClickAwayListener>
  )
}
