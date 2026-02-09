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

const shouldResetToken = (errors?: GraphQLErrorShape[]) =>
  errors?.some((error) => error?.message?.toLowerCase().includes('token')) ?? false;

const readToken = () => {
  if (typeof window === 'undefined') return undefined;
  
  // 1. Primero buscar jwt_token (login directo API2)
  const directToken = localStorage.getItem('jwt_token');
  if (directToken && directToken !== 'null' && directToken !== 'undefined') {
    return directToken;
  }
  
  // 2. Buscar api2_jwt_token (login con Firebase Auth)
  const firebaseToken = localStorage.getItem('api2_jwt_token');
  if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined') {
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

    // ✅ FIX: Logs detallados para debugging
    console.log('📤 [API2] Request:', {
      bodyPreview: body.slice(0, 200),
      headers: {
        'Authorization': token ? `Bearer ${token.slice(0, 20)}...` : 'NO TOKEN',
        'Content-Type': headers['Content-Type'],
        'X-Development': headers['X-Development'],
      },
      method: 'POST',
      url: API2_GRAPHQL_URL,
    });

    const response = await fetch(API2_GRAPHQL_URL, {
      body,
      headers,
      method: 'POST',
    });

    console.log('📥 [API2] Response:', {
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
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
      }

    return payload;
  }

  async query<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const token = readToken();
    
    // ✅ FIX: Logs siempre activos para debugging de recarga
    console.log('🔍 [API2] Query:', query.split('\n')[0].trim());
    console.log('🔍 [API2] Variables:', variables);
    console.log('🔍 [API2] Token presente:', !!token);
    console.log('🔍 [API2] URL:', API2_GRAPHQL_URL);
    console.log('🔍 [API2] Development:', this.development);
    
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


