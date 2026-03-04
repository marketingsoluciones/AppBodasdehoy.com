import { loginWithDemoCredentials } from './auth';

const API2_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_API2_GRAPHQL_URL ?? 'https://api2.eventosorganizador.com/graphql';

const DEFAULT_DEVELOPMENT =
  process.env.NEXT_PUBLIC_API2_DEVELOPMENT ?? process.env.NEXT_PUBLIC_WHITELABEL ?? 'bodasdehoy';

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
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
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

  // 0. Primero buscar jwt_token_cache (api2 HS256, válido ~7 días)
  const cache = localStorage.getItem('jwt_token_cache');
  if (cache) {
    try {
      const { token, expiry } = JSON.parse(cache) as { token: string; expiry: number };
      if (token && expiry && Date.now() < expiry) return token;
    } catch { /* ignorar */ }
  }

  // 1. jwt_token (login directo API2 o Firebase reciente)
  const directToken = localStorage.getItem('jwt_token');
  if (directToken && directToken !== 'null' && directToken !== 'undefined' && !isExpired(directToken)) {
    return directToken;
  }

  // 2. api2_jwt_token (login con Firebase Auth)
  const firebaseToken = localStorage.getItem('api2_jwt_token');
  if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined' && !isExpired(firebaseToken)) {
    return firebaseToken;
  }

  return undefined;
};

export class API2Client {
  private development: string;

  constructor(development: string = DEFAULT_DEVELOPMENT) {
    this.development = development;
  }

  private async request<T>(body: string): Promise<GraphQLResponse<T>> {
    const token = readToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Development': this.development,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API2_GRAPHQL_URL, {
      body,
      headers,
      method: 'POST',
    });

    // Verificar que la respuesta sea JSON antes de parsear
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ [API2] Respuesta no es JSON:', {
        contentType,
        preview: text.slice(0, 200),
        status: response.status,
        statusText: response.statusText,
        url: API2_GRAPHQL_URL,
      });
      throw new Error(
        `API2 devolvió una respuesta no-JSON (${response.status} ${response.statusText}). Verifica que el servidor esté funcionando correctamente.`
      );
    }

    let payload: GraphQLResponse<T>;
    try {
      payload = (await response.json()) as GraphQLResponse<T>;
    } catch (error) {
      const text = await response.text();
      console.error('❌ [API2] Error al parsear JSON:', {
        error,
        preview: text.slice(0, 200),
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(
        `Error al parsear respuesta de API2: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }

    if (shouldResetToken(payload.errors) && typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('api2_jwt_token');
      localStorage.removeItem('jwt_token_cache');
    }

    return payload;
  }

  async query<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      const payload = await this.request<T>(JSON.stringify({ query, variables }));

      if (payload.errors && payload.errors.length > 0) {
        const errorMessage = payload.errors[0]?.message ?? 'Error desconocido al consultar API2';
        console.error('❌ [API2] Error en query:', errorMessage);
        console.error('❌ [API2] Errores completos:', payload.errors);
        throw new Error(errorMessage);
      }

      if (!payload.data) {
        console.error('❌ [API2] Respuesta vacía sin datos');
        throw new Error('API2 devolvió una respuesta vacía');
      }

      console.log('✅ [API2] Query exitosa');
      return payload.data;
    } catch (error) {
      console.error('❌ [API2] Excepción en query:', error);
      throw error;
    }
  }

  async ensureDemoToken(): Promise<void> {
    const token = readToken();
    if (!token) {
      await loginWithDemoCredentials();
    }
  }
}

export const api2Client = new API2Client();


