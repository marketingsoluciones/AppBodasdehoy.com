/**
 * Cliente API optimizado con cache de tokens, throttling y manejo de rate limits
 * 
 * Características:
 * - Cache de tokens JWT (válidos por 7 días)
 * - Throttling automático (200ms entre requests)
 * - Manejo de errores 429 con exponential backoff
 * - Lectura de headers X-RateLimit
 * - Batch requests para operaciones masivas
 */

// Type definitions
type RequestInitType = {
  body?: string | FormData;
  headers?: Record<string, string>;
  method?: string;
  signal?: AbortSignal;
};

type HeadersInitType = Record<string, string>;

interface TokenCache {
  development?: string;
  expiry: number; 
  token: string;
  // Timestamp de expiración
  userId?: string;
}

interface RateLimitInfo {
  remaining: number;
  reset: number; // Timestamp cuando se resetea
}

interface RequestQueueItem {
  execute: () => Promise<any>;
  reject: (error: any) => void;
  resolve: (value: any) => void;
}

export class OptimizedApiClient {
  private tokenCache: TokenCache | null = null;
  private requestQueue: RequestQueueItem[] = [];
  private processingQueue = false;
  private minInterval = 200; // 200ms mínimo entre requests
  private lastRequestTime = 0;
  private rateLimitInfo: RateLimitInfo | null = null;
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = '', timeout: number = 120_000) { // ✅ Aumentado a 120s para coincidir con backend
    this.baseURL = baseURL;
    this.timeout = timeout;
    
    // Cargar token del cache si existe
    this.loadTokenCache();
  }

  /**
   * Cargar token del localStorage si existe y no expiró
   */
  private loadTokenCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem('jwt_token_cache');
      if (cached) {
        const tokenData: TokenCache = JSON.parse(cached);
        // Verificar si no expiró (con margen de 5 minutos)
        if (Date.now() < tokenData.expiry - 5 * 60 * 1000) {
          this.tokenCache = tokenData;
          console.log('✅ Token cargado del cache (válido hasta:', new Date(tokenData.expiry).toLocaleString(), ')');
        } else {
          console.log('⚠️ Token expirado, se renovará en la próxima request');
          localStorage.removeItem('jwt_token_cache');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando token cache:', error);
    }
  }

  /**
   * Guardar token en cache con expiración de 7 días
   */
  private saveTokenCache(token: string, userId?: string, development?: string): void {
    if (typeof window === 'undefined') return;

    const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 días
    this.tokenCache = { development, expiry, token, userId };

    try {
      localStorage.setItem('jwt_token_cache', JSON.stringify(this.tokenCache));
      // También guardar en jwt_token para compatibilidad
      localStorage.setItem('jwt_token', token);
      console.log('💾 Token guardado en cache (válido hasta:', new Date(expiry).toLocaleString(), ')');
    } catch (error) {
      console.warn('⚠️ Error guardando token cache:', error);
    }
  }

  /**
   * Obtener token (del cache o renovar si es necesario)
   */
  async getToken(): Promise<string | null> {
    // Si hay token válido en cache, reutilizar
    if (this.tokenCache && Date.now() < this.tokenCache.expiry - 5 * 60 * 1000) {
      return this.tokenCache.token;
    }

    // Si hay token en localStorage pero no en cache, intentar cargarlo
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) {
        // Asumir que el token sigue siendo válido (el backend validará)
        // Guardar en cache con expiración de 7 días desde ahora
        this.saveTokenCache(storedToken);
        return storedToken;
      }
    }

    // No hay token disponible, retornar null
    return null;
  }

  /**
   * Establecer token manualmente (después de login)
   */
  setToken(token: string, userId?: string, development?: string): void {
    this.saveTokenCache(token, userId, development);
  }

  /**
   * Throttling: esperar tiempo mínimo entre requests
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, waitTime); });
    }

    // Si rate limit está cerca de agotarse, aumentar delay
    if (this.rateLimitInfo && this.rateLimitInfo.remaining < 10) {
      const extraDelay = 500; // 500ms extra si quedan menos de 10 requests
      await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, extraDelay); });
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Actualizar información de rate limit desde headers
   */
  private updateRateLimitInfo(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining !== null && reset !== null) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10) * 1000, // Convertir a timestamp
      };
    }
  }

  /**
   * Calcular tiempo de espera para exponential backoff
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30_000);
    
    // Si hay rate limit info, usar el tiempo de reset si está cerca
    if (this.rateLimitInfo && this.rateLimitInfo.reset > Date.now()) {
      const resetDelay = this.rateLimitInfo.reset - Date.now();
      return Math.max(delay, resetDelay);
    }

    return delay;
  }

  /**
   * Request con retry automático y manejo de rate limits
   */
  private async requestWithRetry(
    url: string,
    options: RequestInitType,
    retryCount = 0,
    maxRetries = 3
  ): Promise<Response> {
    await this.throttle();

    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.timeout),
      });

      // Actualizar información de rate limit
      this.updateRateLimitInfo(response);

      // Si es 429 (Too Many Requests), esperar y reintentar
      if (response.status === 429) {
        if (retryCount >= maxRetries) {
          throw new Error(`Rate limit excedido después de ${maxRetries} intentos`);
        }

        const delay = this.calculateBackoffDelay(retryCount);
        console.warn(`⚠️ Rate limit (429). Esperando ${delay}ms antes de reintentar...`);
        
        await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, delay); });
        return this.requestWithRetry(url, options, retryCount + 1, maxRetries);
      }

      // Si hay error pero no es 429, lanzarlo
      if (!response.ok && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      // Si es timeout y aún hay reintentos, reintentar
      if (error.name === 'TimeoutError' && retryCount < maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.warn(`⚠️ Timeout. Reintentando en ${delay}ms...`);
        await new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, delay); });
        return this.requestWithRetry(url, options, retryCount + 1, maxRetries);
      }

      throw error;
    }
  }

  /**
   * Hacer request GraphQL con todas las optimizaciones
   */
  async graphqlRequest(
    query: string,
    variables?: Record<string, any>,
    useToken = true
  ): Promise<any> {
    const token = useToken ? await this.getToken() : null;

    const headers: HeadersInitType = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://eventosorganizador.com',
      'User-Agent': 'LobeChat-Client/1.0',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Usar middleware Python (evita CORS y SSL)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
    const graphqlURL = this.baseURL || `${BACKEND_URL}/graphql`;
    const url = graphqlURL.includes('/graphql') ? graphqlURL : `${graphqlURL}/graphql`;

    const response = await this.requestWithRetry(url, {
      body: JSON.stringify({ query, variables }),
      headers,
      method: 'POST',
    } as RequestInitType);

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  /**
   * Hacer request HTTP genérico con optimizaciones
   */
  async request(
    endpoint: string,
    options: RequestInitType = {},
    useToken = true
  ): Promise<any> {
    const token = useToken ? await this.getToken() : null;

    const headers: HeadersInitType = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    const response = await this.requestWithRetry(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * Batch request: agrupar múltiples operaciones
   * Útil para crear múltiples leads/contactos en una sola request
   */
  async batchRequest<T>(
    operations: Array<{ query: string; variables?: Record<string, any> }>
  ): Promise<T[]> {
    // Si hay menos de 2 operaciones, ejecutar individualmente
    if (operations.length < 2) {
      const result = await this.graphqlRequest(operations[0].query, operations[0].variables);
      return [result] as T[];
    }

    // Para múltiples operaciones, intentar usar batch mutation si está disponible
    // Por ahora, ejecutar en paralelo con throttling
    const results = await Promise.all(
      operations.map((op, index) =>
        new Promise<T>((resolve) => {
          setTimeout(async () => {
            try {
              const result = await this.graphqlRequest(op.query, op.variables);
              resolve(result as T);
            } catch (error) {
              console.error(`Error en operación ${index}:`, error);
              resolve(null as T);
            }
          }, index * this.minInterval);
        })
      )
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Limpiar cache de token (útil para logout)
   */
  clearTokenCache(): void {
    this.tokenCache = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token_cache');
      localStorage.removeItem('jwt_token');
    }
  }

  /**
   * Obtener información de rate limit actual
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }
}

// Instancia global optimizada
export const optimizedApiClient = new OptimizedApiClient();

