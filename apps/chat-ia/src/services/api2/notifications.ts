import { api2Client } from './client';

export interface AppNotification {
  _id?: string;
  createdAt: string;
  development?: string;
  id: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  type?: string;
  updatedAt?: string;
  userId?: string;
  // Legacy compat — older code may reference these
  focused?: string;  // derived from resourceType/resourceId
  status?: boolean;  // alias for !read
}

export interface NotificationsResponse {
  errors: string[];
  notifications: AppNotification[];
  success: boolean;
  total: number;
  unreadCount: number;
}

const GET_NOTIFICATIONS = `
  query GetNotifications($filters: NotificationFilters, $pagination: CRM_PaginationInput) {
    getNotifications(filters: $filters, pagination: $pagination) {
      success
      total
      unreadCount
      notifications {
        id
        type
        resourceType
        resourceId
        resourceName
        message
        read
        readAt
        development
        createdAt
        updatedAt
      }
    }
  }
`;

const GET_UNREAD_COUNT = `
  query { getUnreadNotificationsCount }
`;

const MARK_AS_READ = `
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      success
      errors { message }
    }
  }
`;

const MARK_ALL_READ = `
  mutation { markAllNotificationsAsRead { success count errors { message } } }
`;

function normalizeNotification(n: any): AppNotification {
  return {
    ...n,
    _id: n.id,
    focused: n.resourceId || undefined,
    status: !n.read,
  };
}

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
    const data = await api2Client.query<{
      getNotifications: {
        success: boolean;
        total: number;
        unreadCount: number;
        notifications: any[];
      };
    }>(GET_NOTIFICATIONS, {
      filters,
      pagination: { page, limit },
    });
    const res = data.getNotifications;
    const notifications = (res?.notifications ?? []).map(normalizeNotification);
    return {
      errors: [],
      notifications,
      success: res?.success ?? true,
      total: res?.total ?? 0,
      unreadCount: res?.unreadCount ?? 0,
    };
  } catch {
    return { errors: [], notifications: [], success: false, total: 0, unreadCount: 0 };
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await api2Client.query(MARK_AS_READ, { notificationId });
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    await api2Client.query(MARK_ALL_READ);
    return true;
  } catch {
    return false;
  }
}
