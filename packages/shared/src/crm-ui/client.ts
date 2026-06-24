/**
 * Cliente GraphQL minimalista hacia api-mcp para CRM-UI.
 *
 * Diseño:
 * - Reusable entre chat-ia y appEventos (sin dependencia de Apollo).
 * - Lee JWT + development desde localStorage (igual que el resto del front).
 * - Endpoint configurable via env var NEXT_PUBLIC_API_MCP_GRAPHQL_URL.
 *
 * api-mcp confirmó CORS allowlist + auth JWT + X-Development. Sin proxy.
 */

const DEFAULT_MCP_GRAPHQL_URL = 'https://api-mcp.eventosorganizador.com/graphql';

function getMcpGraphqlUrl(): string {
  // Vite/Next inyectan process.env.NEXT_PUBLIC_* en build time. Acceder de
  // forma defensiva por si el caller corre sin process global (no debería).
  const p = (globalThis as any).process;
  const envUrl = p?.env?.NEXT_PUBLIC_API_MCP_GRAPHQL_URL;
  if (typeof envUrl === 'string' && envUrl.length > 0) return envUrl;
  return DEFAULT_MCP_GRAPHQL_URL;
}

function getJWT(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Prioridad: mcp_jwt_token > jwt_token > jwt_token_cache (igual que chat-ia mcpClient)
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
  } catch {
    /* ignorar */
  }
  return null;
}

function getDevelopment(): string {
  if (typeof window === 'undefined') return 'bodasdehoy';
  try {
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
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const url = getMcpGraphqlUrl();
  const res = await fetch(url, {
    body: JSON.stringify({ query, variables }),
    headers,
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`[crm-ui] HTTP ${res.status} ${res.statusText}`);
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
