/**
 * Cliente GraphQL minimalista hacia api-mcp para CRM-UI.
 *
 * Diseño:
 * - Reusable entre chat-ia y appEventos (sin dependencia de Apollo).
 * - Lee JWT + development desde localStorage (igual que el resto del front).
 * - Endpoint configurable via env var NEXT_PUBLIC_API_MCP_GRAPHQL_URL.
 *
 * Auth: Authorization Bearer + X-Development.
 */

const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';

function normalizeGraphqlUrl(u: string): string {
  const trimmed = u.trim().replace(/\/+$/, '');
  return /\/graphql$/i.test(trimmed) ? trimmed : `${trimmed}/graphql`;
}

function getMcpGraphqlUrl(): string {
  // Acceso ESTÁTICO a process.env.NEXT_PUBLIC_* — Next/Vite DefinePlugin solo
  // sustituye literales. (globalThis as any).process?.env… NO se inlinea y
  // caía siempre al DEFAULT de producción (rate-limit / schema distinto).
  const envUrl = process.env.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal) {
      // Env local/VPN (api-v2 en :4000, etc.) → usarla.
      if (typeof envUrl === 'string' && envUrl.length > 0 && !/api-mcp\.eventosorganizador\.com/i.test(envUrl)) {
        return normalizeGraphqlUrl(envUrl);
      }
      // Sin env local: same-origin proxy de appEventos (evita pegar a prod).
      return '/api/proxy-bodas/graphql';
    }
  }

  if (typeof envUrl === 'string' && envUrl.length > 0) {
    return normalizeGraphqlUrl(envUrl);
  }
  return DEFAULT_MCP_GRAPHQL_URL;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function getJWT(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1) chat-ia / bridge: localStorage
    const direct = localStorage.getItem('mcp_jwt_token');
    if (direct && direct !== 'null' && direct !== 'undefined') return direct;

    const legacy = localStorage.getItem('jwt_token');
    if (legacy && legacy !== 'null' && legacy !== 'undefined') return legacy;

    const cache = localStorage.getItem('jwt_token_cache');
    if (cache) {
      const parsed = JSON.parse(cache) as { token?: string; expiry?: number };
      if (parsed?.token && parsed?.expiry && Date.now() < parsed.expiry) {
        return parsed.token;
      }
    }

    // 2) appEventos: cookie Firebase SSO (mismo que ApiApp / fetchApiBodas)
    const idToken = readCookie('idTokenV0.1.0');
    if (idToken) return idToken;

    // 3) appEventos: sessionBodas (JWT api-mcp) + fallback si cookie >4KB
    const sessionBodas = readCookie('sessionBodas');
    if (sessionBodas) return sessionBodas;
    const sessionFallback = localStorage.getItem('sessionBodas_fallback');
    if (sessionFallback && sessionFallback !== 'null') return sessionFallback;
  } catch {
    /* ignorar */
  }
  return null;
}

function getDevelopment(): string {
  if (typeof window === 'undefined') return 'bodasdehoy';
  try {
    const fromEnv =
      typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEVELOPMENT : undefined;
    if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv;

    const dev = localStorage.getItem('current_development');
    if (dev) return dev;
    const cfg = localStorage.getItem('dev-user-config');
    if (cfg) {
      const parsed = JSON.parse(cfg) as { development?: string; developer?: string };
      if (parsed?.development) return parsed.development;
      if (parsed?.developer) return parsed.developer;
    }
  } catch {
    /* ignorar */
  }
  return 'bodasdehoy';
}

export interface MCPGraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, any>;
}

export interface MCPGraphQLResponse<T> {
  data?: T;
  errors?: MCPGraphQLError[];
}

/**
 * Llama a una query/mutation GraphQL de api-mcp DIRECTO desde el navegador.
 *
 * @throws Error si HTTP no 200 o si la respuesta trae errors GraphQL.
 */
export async function callMcpGraphQL<TData = any, TVars = Record<string, any>>(
  query: string,
  variables: TVars,
): Promise<TData> {
  const jwt = getJWT();
  const development = getDevelopment();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
    // ApiApp/fetchApiBodas también envían Development (sin X-); api-mcp acepta ambos.
    Development: development,
  };
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else if (typeof console !== 'undefined') {
    console.warn('[crm-ui] sin JWT (cookie idTokenV0.1.0 / sessionBodas / mcp_jwt_token). createCRMNote fallará UNAUTHENTICATED.');
  }

  const url = getMcpGraphqlUrl();
  const res = await fetch(url, {
    body: JSON.stringify({ query, variables }),
    headers,
    method: 'POST',
  });

  if (!res.ok) {
    // Rate-limit / proxy a veces devuelve JSON sin shape GraphQL
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) detail = `${detail}: ${body.error}`;
      else if (body?.message) detail = `${detail}: ${body.message}`;
    } catch {
      /* ignore */
    }
    throw new Error(`[crm-ui] HTTP ${detail}`);
  }

  const json = (await res.json()) as MCPGraphQLResponse<TData>;
  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`[crm-ui] GraphQL: ${msg}`);
  }
  if (!json.data) {
    throw new Error('[crm-ui] respuesta sin data');
  }
  return json.data;
}
