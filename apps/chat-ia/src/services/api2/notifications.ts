import { api2Client } from './client';

export interface AppNotification {
  _id: string;
  createdAt: number;
  focused?: string;
  fromUid?: string;
  message: string;
  state?: string;
  status: boolean; // true = read, false = unread
  type?: string;
  uid?: string;
  updatedAt?: number;
}

export interface NotificationsResponse {
  errors: string[];
  notifications: AppNotification[];
  success: boolean;
  total: number;
  unreadCount: number;
}

const GET_NOTIFICATIONS = `
  query GetNotifications($skip: Int, $limit: Int) {
    getNotifications(skip: $skip, limit: $limit) {
      total
      results {
        _id
        uid
        message
        status
        state
        type
        fromUid
        focused
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_NOTIFICATION = `
  mutation UpdateNotification($args: inputNotification) {
    updateNotifications(args: $args)
  }
`;

export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const data = await api2Client.query<{ getNotifications: { total: number; results: AppNotification[] } }>(
      GET_NOTIFICATIONS,
      { skip: 0, limit: 50 },
    );
    const results = data.getNotifications?.results ?? [];
    return results.filter((n) => !n.status).length;
  } catch {
    return 0;
  }
}

export async function getNotifications(limit = 20, unreadOnly = false, page = 1): Promise<NotificationsResponse> {
  try {
    const skip = (page - 1) * limit;
    const data = await api2Client.query<{ getNotifications: { total: number; results: AppNotification[] } }>(
      GET_NOTIFICATIONS,
      { skip, limit },
    );
    const res = data.getNotifications;
    const allNotifs = res?.results ?? [];
    const notifications = unreadOnly ? allNotifs.filter((n) => !n.status) : allNotifs;
    const unreadCount = allNotifs.filter((n) => !n.status).length;
    return {
      errors: [],
      notifications,
      success: true,
      total: res?.total ?? 0,
      unreadCount,
    };
  } catch {
    return { errors: [], notifications: [], success: false, total: 0, unreadCount: 0 };
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const data = await api2Client.query<{ getNotifications: { results: AppNotification[] } }>(GET_NOTIFICATIONS, {
      skip: 0,
      limit: 100,
    });
    const unread = (data.getNotifications?.results ?? []).filter((n) => !n.status);
    await Promise.all(
      unread.map((n) =>
        api2Client.query(UPDATE_NOTIFICATION, { args: { _id: n._id, status: true } }),
      ),
    );
    return true;
  } catch {
    return false;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await api2Client.query(UPDATE_NOTIFICATION, { args: { _id: notificationId, status: true } });
    return true;
  } catch {
    return false;
  }
}
