/**
 * services/mcpAuth.ts
 *
 * Helper reutilizable para llamar a la mutation `auth(idToken)` de
 * api-mcp GraphQL — el único endpoint que emite `sessionCookie`
 * (JWT api2 HS256) que el ecosistema AppBodas usa como cookie
 * cross-subdomain `sessionBodas`.
 *
 * Antes esta llamada estaba duplicada en 2 sitios (dev fue R6 2-jul):
 *   - services/firebase-auth/index.ts (login directo chat-ia)
 *   - app/(backend)/api/auth/sso-auto/route.ts (SSO handoff appEventos)
 * Con drift potencial en timeout, header Development, error handling.
 *
 * Este módulo unifica ambos comportamientos.
 */

const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';

function resolveMcpGraphqlUrl(): string {
  if (typeof process === 'undefined') return DEFAULT_MCP_GRAPHQL_URL;
  return (
    process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL ||
    process.env.API_MCP_GRAPHQL_URL ||
    DEFAULT_MCP_GRAPHQL_URL
  );
}

export interface McpAuthResult {
  sessionCookie: string | null;
  /** Mensaje del backend cuando NO devolvió sessionCookie (para logging). */
  errorMessage?: string;
  /** trace_id GraphQL para escalar al backend si vino con errors[]. */
  traceId?: string;
}

/**
 * Llama a la mutation Auth(idToken) del api-mcp GraphQL.
 * Devuelve `{sessionCookie}` cuando OK, o `{sessionCookie: null, errorMessage, traceId}`
 * cuando el backend responde con `data.auth = null + errors[]`.
 *
 * NO lanza (except para errores de red / abort — el caller decide qué hacer).
 * Timeout configurable, default 6s (suficiente para el fix save-user con audit
 * skipAudit del 1-jul + margen).
 */
export async function callMcpAuthMutation(
  firebaseIdToken: string,
  development: string,
  opts: { timeoutMs?: number; graphqlUrl?: string } = {},
): Promise<McpAuthResult> {
  const url = opts.graphqlUrl || resolveMcpGraphqlUrl();
  const timeoutMs = opts.timeoutMs ?? 6000;

  const response = await fetch(url, {
    body: JSON.stringify({
      query: 'mutation Auth($idToken: String!) { auth(idToken: $idToken) { sessionCookie } }',
      variables: { idToken: firebaseIdToken },
    }),
    headers: {
      'Content-Type': 'application/json',
      Development: development,
    },
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await response.json().catch(() => null);
  const sessionCookie = data?.data?.auth?.sessionCookie || null;

  if (sessionCookie) {
    return { sessionCookie };
  }

  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const errorMessage = errors[0]?.message || 'sin sessionCookie';
  const traceId = errors[0]?.extensions?.traceId;

  return { sessionCookie: null, errorMessage, traceId };
}

/**
 * Setea la cookie `sessionBodas` cross-subdomain (`.bodasdehoy.com`
 * derivado del hostname) con el valor de sessionCookie devuelto por
 * api-mcp. Solo funciona en cliente (necesita document + window).
 *
 * @returns true si se seteó, false si no había document o dominio inválido.
 */
export function writeSessionBodasCookie(sessionCookie: string): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (!sessionCookie) return false;

  const hostParts = window.location.hostname.split('.');
  const rootDomain = hostParts.length >= 2 ? '.' + hostParts.slice(-2).join('.') : '';

  const attrs = [
    `sessionBodas=${encodeURIComponent(sessionCookie)}`,
    'path=/',
    `max-age=${30 * 24 * 60 * 60}`,
    'SameSite=Lax',
  ];
  if (rootDomain) attrs.push(`Domain=${rootDomain}`);
  if (window.location.protocol === 'https:') attrs.push('Secure');

  document.cookie = attrs.join('; ');
  return true;
}
