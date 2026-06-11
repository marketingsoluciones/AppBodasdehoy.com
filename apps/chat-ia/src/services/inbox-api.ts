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
 * ✅ RUTAS CONFIRMADAS por api-ia (2026-06-03): todas existen, shape plano {success,data,...},
 * reenvían Authorization+X-Development a api-mcp. Ninguna queda en api-mcp directo.
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
  // En cliente: prefijar origin si url es relativa. En server: usar url tal cual (ya lleva BACKEND).
  const fetchUrl = typeof window !== 'undefined' ? `${window.location?.origin || ''}${url}` : url;
  const res = await fetch(fetchUrl, {
    credentials: 'include',
    headers: { ...buildAuthHeaders(), Accept: 'application/json' },
    method: 'GET',
  });
  if (!res.ok) throw new Error(`[inbox-api] GET ${path} → HTTP ${res.status}`);
  return res.json();
}

// ─── Las 6 lecturas del inbox — RUTAS CONFIRMADAS por api-ia (2026-06-03) ───

/** GET_CHAT_SOURCE { sessionId } → GET /chat/messages?sessionId=X */
export async function getSession(sessionId: string): Promise<any> {
  ensureEnabled('getSession');
  return getJson('/chat/messages', { sessionId });
}

/** GET_USER_CHATS { development, userId, pagination } → GET /chat/sessions?userId=X */
export async function getUserChats(
  userId: string,
  opts: { development: string; limit?: number; page?: number },
): Promise<any> {
  ensureEnabled('getUserChats');
  return getJson('/chat/sessions', {
    development: opts.development,
    limit: opts.limit,
    page: opts.page,
    userId,
  });
}

/** GET_USER_API_CONFIGS → GET /webapi/config/whitelabel?development=X */
export async function getUserApiConfigs(development: string): Promise<any> {
  ensureEnabled('getUserApiConfigs');
  return getJson('/webapi/config/whitelabel', { development });
}

/** GET_USER_EVENTS_BY_EMAIL/PHONE → GET /api/users/related-events?email|phone */
export async function getUserRelatedEvents(
  userIdOrContact: string,
  opts: { development: string; limit?: number; page?: number },
): Promise<any> {
  ensureEnabled('getUserRelatedEvents');
  const isEmail = userIdOrContact.includes('@');
  return getJson('/api/users/related-events', {
    development: opts.development,
    limit: opts.limit ?? 100,
    page: opts.page ?? 1,
    [isEmail ? 'email' : 'phone']: userIdOrContact,
  });
}

/** GET_USER_PROFILE { email } → GET /api/users/by-email?email=X */
export async function getUserProfile(email: string, development: string): Promise<any> {
  ensureEnabled('getUserProfile');
  return getJson('/api/users/by-email', { development, email });
}

/** GET_WHITELABEL_CONFIG { development } → GET /webapi/config/whitelabel?development=X
 *  (api-ia ya resuelve la supportKey internamente; el front solo manda development). */
export async function getWhitelabelConfig(development: string): Promise<any> {
  ensureEnabled('getWhitelabelConfig');
  return getJson('/webapi/config/whitelabel', { development });
}
