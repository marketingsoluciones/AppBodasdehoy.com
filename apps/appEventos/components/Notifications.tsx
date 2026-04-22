import { useEffect, useState, useCallback, useRef } from "react";
import ClickAwayListener from "react-click-away-listener"
import { RiNotification2Fill } from "react-icons/ri";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider, SocketContextProvider } from "../context";
import { useTranslation } from "react-i18next";
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
  readAt?: string;
  createdAt: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  development?: string;
}

type Tab = 'pending' | 'reviewed';

const POLL_INTERVAL = 60_000;
const PAGE_SIZE = 15;

const TYPE_ICON: Record<string, string> = {
  whatsapp_message: '💬',
  task_reminder: '📋',
  access_revoked: '🔒',
  permission_updated: '🔑',
  resource_shared: '📤',
  resource_access_revoked: '🚫',
  user: '👤',
  event: '📅',
};

// ========================================
// Component
// ========================================

export const Notifications = () => {
  const { t } = useTranslation();
  const { user, config } = AuthContextProvider();
  const router = useRouter();

  const [showPanel, setShowPanel] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [notifications, setNotifications] = useState<Api2Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const development = config?.development || 'bodasdehoy';
  const userId = user?.uid;
  const isRealUser = !!userId && user?.displayName !== 'guest' && user?.displayName !== 'anonymous';

  // Fetch notifications via our API route (server-side proxy)
  const fetchNotifications = useCallback(async (selectedTab: Tab, selectedPage: number) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?userId=${userId}&dev=${development}&tab=${selectedTab}&page=${selectedPage}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[Notifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, development]);

  // Poll unread count
  const pollUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/notifications?userId=${userId}&dev=${development}&tab=pending&page=1&limit=1`
      );
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silent */ }
  }, [userId, development]);

  // Start polling on mount
  useEffect(() => {
    if (!isRealUser) return;
    pollUnread();
    pollRef.current = setInterval(pollUnread, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isRealUser, pollUnread]);

  // Fetch when panel opens or tab/page changes
  useEffect(() => {
    if (showPanel && isRealUser) {
      fetchNotifications(tab, page);
    }
  }, [showPanel, tab, page, isRealUser, fetchNotifications]);

  const handleOpen = () => {
    setShowPanel(true);
    setTab('pending');
    setPage(1);
  };

  const handleClose = () => setShowPanel(false);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div className="relative">
        {/* Bell icon + badge */}
        <button
          onClick={() => showPanel ? handleClose() : handleOpen()}
          className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-200 cursor-pointer relative"
        >
          <RiNotification2Fill className="text-primary w-6 h-6 scale-x-90" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-red-500 flex items-center justify-center px-1">
              <span className="text-white text-[10px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
            </span>
          )}
        </button>

        {/* Panel */}
        {showPanel && (
          <div className="absolute bg-white rounded-lg w-96 shadow-xl shadow-gray-300 top-12 right-0 overflow-hidden z-[60] border border-gray-100">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">{t("Mis notificaciones")}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} {t("sin leer")}
                  </span>
                )}
              </div>
              {/* Tabs */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleTabChange('pending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === 'pending'
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t("Pendientes")} {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => handleTabChange('reviewed')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === 'reviewed'
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t("Revisadas")}
                </button>
              </div>
            </div>

            {/* Notification list */}
            <ul className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <li className="py-8 text-center text-gray-400 text-xs">{t("cargando")}...</li>
              ) : notifications.length === 0 ? (
                <li className="py-8 text-center text-gray-400 text-xs">
                  {tab === 'pending' ? t("No hay notificaciones pendientes") : t("No hay notificaciones revisadas")}
                </li>
              ) : (
                notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="flex gap-2 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      // Navigate based on type
                      if (notif.resourceId) {
                        router.push(`/resumen-evento?event=${notif.resourceId}`);
                      }
                    }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {TYPE_ICON[notif.type || ''] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 break-words leading-relaxed">
                        {notif.message}
                      </p>
                      <RelativeTime
                        date={new Date(notif.createdAt).getTime()}
                        className="text-[10px] text-gray-400 italic mt-1 block"
                      />
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                    )}
                  </li>
                ))
              )}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                >
                  ← {t("Anterior")}
                </button>
                <span className="text-[10px] text-gray-400">
                  {page} / {totalPages} ({total} total)
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                >
                  {t("Siguiente")} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ClickAwayListener>
  );
}
