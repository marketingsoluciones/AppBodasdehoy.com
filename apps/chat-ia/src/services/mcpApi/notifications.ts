import { mcpClient } from './client';

export interface AppNotification {
  _id?: string;
  createdAt: string;
  development?: string;
  // Legacy compat — older code may reference these
  focused?: string;
  id: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  // derived from resourceType/resourceId
  status?: boolean;
  type?: string;
  updatedAt?: string;  
  userId?: string;  // alias for !read
}

export interface NotificationsResponse {
  errors: string[];
  notifications: AppNotification[];
  success: boolean;
  total: number;
  unreadCount: number;
}

/*
 * B12: `metadata` trae el deep-link (metadata.deeplink = "/bandeja/{canal}/{conv}").
 * api-ia lo escribe al emitir (notifications_internal.py:101) y api-mcp lo persiste
 * desde su commit 907cb24. Sin pedirlo, el clic caía al genérico whatsapp_message
 * → /bandeja, es decir a la LISTA en vez de a la conversación.
 *
 * ⚠️ NUNCA comentarios `#` DENTRO del template: el proxy GraphQL no los soporta y
 * devuelve 400 GRAPHQL_PARSE_FAILED ("Expected Name, found <EOF>"). Eso dejó la
 * pestaña de Notificaciones vacía — detectado en el QA del 29-ago (FQ-01).
 */
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
        metadata
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
    const data = await mcpClient.query<{ getUnreadNotificationsCount: number }>(GET_UNREAD_COUNT);
    return data.getUnreadNotificationsCount ?? 0;
  } catch {
    return 0;
  }
}

export async function getNotifications(limit = 20, unreadOnly = false, page = 1): Promise<NotificationsResponse> {
  try {
    const filters = unreadOnly ? { read: false } : undefined;
    const data = await mcpClient.query<{
      getNotifications: {
        notifications: any[];
        success: boolean;
        total: number;
        unreadCount: number;
      };
    }>(GET_NOTIFICATIONS, {
      filters,
      pagination: { limit, page },
    });
    const res = data.getNotifications;
    const notifications = (res?.notifications ?? []).map(normalizeNotification);
    const errors = ((res as any)?.errors ?? []).map((e: any) =>
      typeof e === 'string' ? e : (e?.message ?? String(e)),
    );
    return {
      errors,
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
    await mcpClient.query(MARK_AS_READ, { notificationId });
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    await mcpClient.query(MARK_ALL_READ);
    return true;
  } catch {
    return false;
  }
}
