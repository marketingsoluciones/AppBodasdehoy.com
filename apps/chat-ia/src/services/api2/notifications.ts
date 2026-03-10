import { api2Client } from './client';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  message: string;
  read: boolean;
  readAt?: string;
  development: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
  errors: string[];
}

const GET_UNREAD_COUNT = `
  query GetUnreadNotificationsCount {
    getUnreadNotificationsCount
  }
`;

const GET_NOTIFICATIONS = `
  query GetNotifications($page: Int, $limit: Int, $filters: NotificationFilters) {
    getNotifications(pagination: { page: $page, limit: $limit }, filters: $filters) {
      success
      notifications {
        id
        type
        resourceType
        resourceId
        resourceName
        message
        read
        readAt
        createdAt
      }
      total
      unreadCount
      errors { message }
    }
  }
`;

const MARK_ALL_READ = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
      count
      errors { message }
    }
  }
`;

const MARK_READ = `
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      success
      errors { message }
    }
  }
`;

export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const data = await api2Client.query<{ getUnreadNotificationsCount: number }>(GET_UNREAD_COUNT);
    return data.getUnreadNotificationsCount ?? 0;
  } catch {
    return 0;
  }
}

export async function getNotifications(limit = 20, unreadOnly = false, page = 1): Promise<NotificationsResponse> {
  try {
    const filters = unreadOnly ? { read: false } : undefined;
    const data = await api2Client.query<{ getNotifications: any }>(GET_NOTIFICATIONS, { page, limit, filters });
    const res = data.getNotifications;
    return {
      success: res.success,
      notifications: res.notifications ?? [],
      total: res.total ?? 0,
      unreadCount: res.unreadCount ?? 0,
      errors: (res.errors ?? []).map((e: any) => e.message),
    };
  } catch {
    return { success: false, notifications: [], total: 0, unreadCount: 0, errors: [] };
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const data = await api2Client.query<{ markAllNotificationsAsRead: { success: boolean } }>(MARK_ALL_READ);
    return data.markAllNotificationsAsRead.success;
  } catch {
    return false;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const data = await api2Client.query<{ markNotificationAsRead: { success: boolean } }>(MARK_READ, { notificationId });
    return data.markNotificationAsRead.success;
  } catch {
    return false;
  }
}
