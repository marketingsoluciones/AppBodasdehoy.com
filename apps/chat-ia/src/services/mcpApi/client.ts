import { loginWithDemoCredentials } from './auth';

import { resolvePublicMcpGraphqlUrl, resolveServerMcpGraphqlUrl } from '@/const/mcpEndpoints';

const getMcpGraphqlUrl = (): string => {
  if (typeof window !== 'undefined') {
    const candidate = resolvePublicMcpGraphqlUrl();
    if (candidate) {
      if (candidate.startsWith('/')) return candidate;
      try {
        const u = new URL(candidate, window.location.href);
        if (u.origin === window.location.origin) return u.toString();
      } catch {}
    }
    return '/api/graphql';
  }

  return resolveServerMcpGraphqlUrl();
};

const DEFAULT_DEVELOPMENT =
  process.env.NEXT_PUBLIC_MCP_DEVELOPMENT ??
  process.env.NEXT_PUBLIC_API2_DEVELOPMENT ??
  process.env.NEXT_PUBLIC_WHITELABEL ??
  'bodasdehoy';

type GraphQLErrorShape = { message?: string };

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorShape[];
}

// Solo borrar el token si el error indica que el token está expirado o es inválido,
// NOT si simplemente no hay autenticación (ej: "proporciona un token válido")
const shouldResetToken = (errors?: GraphQLErrorShape[]) =>
  errors?.some((error) => {
    const msg = error?.message?.toLowerCase() ?? '';
    return msg.includes('token expired') || msg.includes('token inválido') || msg.includes('jwt expired');
  }) ?? false;

/** Decodifica el payload de un JWT sin verificar firma */
const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

/** Devuelve true si el token tiene exp y ya venció */
const isExpired = (token: string): boolean => {
  const exp = decodeJwtExp(token);
  if (!exp) return false; // sin exp → asumir válido
  return Date.now() >= exp * 1000;
};

const readToken = () => {
  if (typeof window === 'undefined') return undefined;

  // 0. Primero buscar jwt_token_cache (HS256, válido ~7 días)
  const cache = localStorage.getItem('jwt_token_cache');
  if (cache) {
    try {
      const { token, expiry } = JSON.parse(cache) as { expiry: number, token: string; };
      if (token && expiry && Date.now() < expiry) return token;
    } catch { /* ignorar */ }
  }

  // 1. jwt_token (login directo o Firebase reciente)
  const directToken = localStorage.getItem('jwt_token');
  if (directToken && directToken !== 'null' && directToken !== 'undefined' && !isExpired(directToken)) {
    return directToken;
  }

  const mcpToken = localStorage.getItem('mcp_jwt_token');
  if (mcpToken && mcpToken !== 'null' && mcpToken !== 'undefined' && !isExpired(mcpToken)) {
    return mcpToken;
  }

  // 2. api2_jwt_token (legacy)
  const firebaseToken = localStorage.getItem('api2_jwt_token');
  if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined' && !isExpired(firebaseToken)) {
    return firebaseToken;
  }

  return undefined;
};

const readDevelopment = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const direct = localStorage.getItem('current_development');
    if (direct && direct !== 'null' && direct !== 'undefined') return direct;
    const raw = localStorage.getItem('dev-user-config');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { developer?: string, development?: string; };
    return parsed.development || parsed.developer || undefined;
  } catch {
    return undefined;
  }
};

export class McpClient {
  private development: string;

  constructor(development: string = DEFAULT_DEVELOPMENT) {
    this.development = development;
  }

  private async request<T>(body: string): Promise<GraphQLResponse<T>> {
    const url = getMcpGraphqlUrl();
    const token = readToken();
    const development = readDevelopment() || this.development;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Development': development,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      body,
      headers,
      method: 'POST',
    });

    // Verificar que la respuesta sea JSON antes de parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ [MCP] Respuesta no es JSON:', {
        contentType,
        preview: text.slice(0, 200),
        status: response.status,
        statusText: response.statusText,
        url,
      });
      throw new Error(
        `MCP devolvió una respuesta no-JSON (${response.status} ${response.statusText}). Verifica que el servidor esté funcionando correctamente.`
      );
    }

    let payload: GraphQLResponse<T>;
    try {
      payload = (await response.json()) as GraphQLResponse<T>;
    } catch (error) {
      const text = await response.text();
      console.error('❌ [MCP] Error al parsear JSON:', {
        error,
        preview: text.slice(0, 200),
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(
        `Error al parsear respuesta de MCP: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    if (shouldResetToken(payload.errors) && typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('mcp_jwt_token');
      localStorage.removeItem('api2_jwt_token');
      localStorage.removeItem('jwt_token_cache');
      // Notificar a la UI para que muestre un aviso de sesión expirada
      window.dispatchEvent(new CustomEvent('mcp:token-expired'));
    }

    return payload;
  }

  async query<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      const payload = await this.request<T>(JSON.stringify({ query, variables }));

      if (payload.errors && payload.errors.length > 0) {
        const errorMessage = payload.errors[0]?.message ?? 'Error desconocido al consultar MCP';
        console.error('❌ [MCP] Error en query:', errorMessage);
        console.error('❌ [MCP] Errores completos:', payload.errors);
        throw new Error(errorMessage);
      }

      if (!payload.data) {
        console.error('❌ [MCP] Respuesta vacía sin datos');
        throw new Error('MCP devolvió una respuesta vacía');
      }

      console.log('✅ [MCP] Query exitosa');
      return payload.data;
    } catch (error) {
      console.error('❌ [MCP] Excepción en query:', error);
      throw error;
    }
  }

  async ensureDemoToken(): Promise<void> {
    const token = readToken();
    if (!token) {
      const result = await loginWithDemoCredentials();
      if (!result.success) {
        console.warn('[McpClient] ensureDemoToken: login automático falló o no hay credenciales configuradas.');
      }
    }
  }
}

export const mcpClient = new McpClient();
