/**
 * 🚧 Cliente de LECTURA del inbox (externalChat) vía api-ia — INACTIVO hasta confirmar rutas REST.
 *
 * REGLA (user 2026-06-03): el front NO llama a api-mcp directamente para nada de IA/agentes/
 * conversaciones. api-ia es el "militar/contable" + gestor de agentes. Hoy externalChat ENVÍA
 * bien (por /api/backend → api-ia) pero LEE 6 queries directo de api-mcp (apolloClient) →
 * deuda a migrar. Ver [[feedback_api_ia_gestor_agentes_no_solo_billing]].
 *
 * Este cliente reemplaza esas 6 lecturas por fetch a /api/backend/... (proxy que YA apunta a
 * api-ia, ver src/app/(backend)/api/backend/[...path]/route.ts). Mismo patrón que
 * useConversationHistory (fetch + buildAuthHeaders + credentials:'include').
 *
 * ⚠️ NO ACTIVAR (USE_API_IA_INBOX=false default) hasta que api-ia confirme las rutas REST
 * equivalentes a: getSession, getUserChats, getUserApiConfigs, getUserRelatedEvents,
 * getUserByEmail, getWhiteLabelConfig. Si no existen → 404 y rompe el inbox. Pedido a api-ia.
 */
import { buildAuthHeaders } from '@/utils/authToken';

// Flag independiente del chat-core (USE_API_IA_ENDPOINTS): el inbox es otra feature.
export const USE_API_IA_INBOX = process.env.NEXT_PUBLIC_USE_API_IA_INBOX === 'true';

// El proxy /api/backend/[...path] reenvía a api-ia (api-ia.bodasdehoy.com) sin CORS.
const BACKEND = '/api/backend';

function ensureEnabled(fn: string): void {
  if (!USE_API_IA_INBOX) {
    throw new Error(
      `[inbox-api] ${fn}: lectura de inbox vía api-ia NO activada (USE_API_IA_INBOX=false). ` +
        `Pendiente confirmar rutas REST en api-ia. Ver feedback_api_ia_gestor_agentes_no_solo_billing.`,
    );
  }
}

async function getJson(path: string, params?: Record<string, string | number | undefined>): Promise<any> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const q = qs.toString();
  const url = `${BACKEND}${path}${q ? `?${q}` : ''}`;
  const res = await fetch(typeof window !== 'undefined' ? url : `${window.location?.origin || ''}${url}`, {
    credentials: 'include',
    headers: { ...buildAuthHeaders(), Accept: 'application/json' },
    method: 'GET',
  });
  if (!res.ok) throw new Error(`[inbox-api] GET ${path} → HTTP ${res.status}`);
  return res.json();
}

// ─── Las 6 lecturas del inbox (rutas REST por confirmar con api-ia) ───
// NOTA: los paths /api/inbox/* son PROPUESTA — confirmar con api-ia antes de activar.

/** GET_CHAT_SOURCE { sessionId } → getSession */
export async function getSession(sessionId: string): Promise<any> {
  ensureEnabled('getSession');
  return getJson(`/api/inbox/sessions/${encodeURIComponent(sessionId)}`);
}

/** GET_USER_CHATS { development, userId, pagination } → getUserChats */
export async function getUserChats(
  userId: string,
  opts: { development: string; limit?: number; page?: number },
): Promise<any> {
  ensureEnabled('getUserChats');
  return getJson('/api/inbox/chats', {
    development: opts.development,
    limit: opts.limit,
    page: opts.page,
    userId,
  });
}

/** GET_USER_API_CONFIGS { userId } → getUserApiConfigs */
export async function getUserApiConfigs(userId: string): Promise<any> {
  ensureEnabled('getUserApiConfigs');
  return getJson('/api/inbox/api-configs', { userId });
}

/** GET_USER_EVENTS_BY_EMAIL/PHONE → getAllUserRelatedEventsBy... */
export async function getUserRelatedEvents(
  userIdOrContact: string,
  opts: { development: string; limit?: number; page?: number },
): Promise<any> {
  ensureEnabled('getUserRelatedEvents');
  const isEmail = userIdOrContact.includes('@');
  return getJson('/api/inbox/events', {
    development: opts.development,
    limit: opts.limit ?? 100,
    page: opts.page ?? 1,
    [isEmail ? 'email' : 'phone']: userIdOrContact,
  });
}

/** GET_USER_PROFILE { development, email } → getUserByEmail */
export async function getUserProfile(email: string, development: string): Promise<any> {
  ensureEnabled('getUserProfile');
  return getJson('/api/inbox/user-profile', { development, email });
}

/** GET_WHITELABEL_CONFIG { development, supportKey } → getWhiteLabelConfig */
export async function getWhitelabelConfig(development: string, supportKey?: string): Promise<any> {
  ensureEnabled('getWhitelabelConfig');
  return getJson('/api/inbox/whitelabel', { development, supportKey });
}
