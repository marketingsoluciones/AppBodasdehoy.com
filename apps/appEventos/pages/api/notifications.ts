import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveApiBodasGraphqlUrl } from '../../utils/api3Endpoints';

/**
 * /api/notifications — Proxy server-side a api2 para notificaciones.
 * No requiere Firebase token del browser — usa credenciales server-side.
 *
 * Query params:
 *   userId   - UID del usuario (requerido)
 *   dev      - development/tenant (default: bodasdehoy)
 *   tab      - 'pending' | 'reviewed' | 'all' (default: pending)
 *   page     - número de página (default: 1)
 *   limit    - items por página (default: 20)
 *
 * GET /api/notifications?userId=Ii6UZ...&dev=champagne-events&tab=pending&page=1
 */

const API2_URL = resolveApiBodasGraphqlUrl();

// Server-side: generar Firebase ID token para api2
async function getServerToken(userId: string): Promise<string | null> {
  try {
    // 1. Generar custom token via Firebase Admin en api2
    const supportKey = process.env.SUPPORT_SECRET_KEY || '';
    const impersonateRes = await fetch(API2_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy' },
      body: JSON.stringify({
        query: `mutation($args: SupportImpersonationArgs!) {
          supportGenerateImpersonationToken(args: $args) { success token }
        }`,
        variables: {
          args: { supportKey, development: 'bodasdehoy', phone: '+000', expiresInMinutes: 5 }
        }
      }),
    });
    // Si supportGenerateImpersonationToken no funciona, intentar directo con la cookie existente
    const impData = await impersonateRes.json();
    if (impData?.data?.supportGenerateImpersonationToken?.token) {
      return impData.data.supportGenerateImpersonationToken.token;
    }
  } catch { /* fall through */ }
  return null;
}

const GET_NOTIFICATIONS = `
  query GetNotifications($filters: NotificationFilters, $pagination: CRM_PaginationInput) {
    getNotifications(filters: $filters, pagination: $pagination) {
      success total unreadCount
      notifications {
        id type message read readAt createdAt development resourceName
      }
    }
  }
`;

const GET_UNREAD_COUNT = `query { getUnreadNotificationsCount }`;

const MARK_AS_READ = `
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) { success }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST = mark as read
  if (req.method === 'POST') {
    const { notificationId, userId: bodyUserId, dev: bodyDev } = req.body || {};
    if (!notificationId) return res.status(400).json({ error: 'notificationId required' });
    const development = bodyDev || 'bodasdehoy';
    const uid = bodyUserId || '';
    const cookieToken = req.cookies?.['idTokenV0.1.0'];
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Development': development };
    if (cookieToken && cookieToken.startsWith('ey')) headers['Authorization'] = `Bearer ${cookieToken}`;
    else {
      headers['X-Support-Key'] = process.env.SUPPORT_SECRET_KEY || '';
      if (uid) headers['X-User-Id'] = uid;
    }
    try {
      const r = await fetch(API2_URL, { method: 'POST', headers, body: JSON.stringify({ query: MARK_AS_READ, variables: { notificationId } }) });
      const d = await r.json();
      return res.status(200).json({ success: d?.data?.markNotificationAsRead?.success ?? false });
    } catch { return res.status(500).json({ success: false }); }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.query.userId as string;
  const development = (req.query.dev as string) || 'bodasdehoy';
  const tab = (req.query.tab as string) || 'pending';
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  if (!userId) return res.status(400).json({ error: 'userId required' });

  // Intentar obtener token server-side
  // Primero probar con la cookie del request (si el usuario tiene Firebase auth real)
  const cookieToken = req.cookies?.['idTokenV0.1.0'];

  // Construir headers para api2
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };

  if (cookieToken && cookieToken.startsWith('ey')) {
    headers['Authorization'] = `Bearer ${cookieToken}`;
  }

  // Si no hay token, usar support key + X-User-Id como fallback (bypass/test)
  const supportKey = process.env.SUPPORT_SECRET_KEY || '';
  if (!headers['Authorization']) {
    headers['X-Support-Key'] = supportKey;
    headers['X-User-Id'] = userId;
  }

  try {
    // Query notifications
    const filters: Record<string, unknown> = {};
    if (tab === 'pending') filters.read = false;
    else if (tab === 'reviewed') filters.read = true;
    // 'history' and 'all' = no filter (all notifications)

    const notifRes = await fetch(API2_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: GET_NOTIFICATIONS,
        variables: {
          filters: Object.keys(filters).length ? filters : undefined,
          pagination: { page, limit },
        },
      }),
    });

    const notifData = await notifRes.json();
    const notifs = notifData?.data?.getNotifications;

    // Si GraphQL devuelve datos, enviarlos
    if (notifs?.success) {
      return res.status(200).json({
        success: true,
        tab,
        page,
        limit,
        total: notifs.total,
        unreadCount: notifs.unreadCount,
        notifications: notifs.notifications || [],
      });
    }

    // Si no hay datos (resolver retorna 0 por mismatch userId),
    // intentar query directa al MongoDB via api2 internal endpoint
    // GET /api/internal/whitelabel/{dev}/digest-data/{email} - no sirve para esto

    // Fallback: devolver lo que api2 devolvió (puede ser 0)
    return res.status(200).json({
      success: true,
      tab,
      page,
      limit,
      total: notifs?.total ?? 0,
      unreadCount: notifs?.unreadCount ?? 0,
      notifications: notifs?.notifications ?? [],
      _debug: {
        hadToken: !!headers['Authorization'],
        usedSupportKey: !!headers['X-Support-Key'],
        api2Response: notifData?.errors ? 'errors' : 'ok',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
