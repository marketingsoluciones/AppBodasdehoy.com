/**
 * Configuración de API para Eventos
 * Integración con el backend de agentes IA
 */

// Detectar entorno y configurar URL del backend
// ARQUITECTURA COMPATIBLE CON LOBE CHAT:
// - En el navegador: SIEMPRE same-origin ('') para evitar CORS con api-ia.bodasdehoy.com
//   Las rutas /api/auth/identify-user, /api/auth/sync-user-identity, etc. hacen proxy al backend.
// - En el servidor (SSR): usar NEXT_PUBLIC_BACKEND_URL o localhost.
const getBackendURL = () => {
  // En el navegador, usar siempre same-origin para que las peticiones vayan al Copilot
  // (localhost:3210) y sus API routes hagan proxy a api-ia. Evita CORS.
  if (typeof window !== 'undefined') {
    return '';
  }

  // En el servidor (SSR), usar backend externo
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8030';
};

export const EVENTOS_API_CONFIG = {
  // URL del backend de agentes (inteligente según entorno)
  BACKEND_URL: getBackendURL(),


  // 30 segundos
// Headers por defecto
DEFAULT_HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },




// Endpoints específicos
ENDPOINTS: {
    CHAT_HEALTH: '/health',
    CHAT_MESSAGE: '/send-message',
    CHAT_SESSION: '/create-lobe-session',
    EVENTS_SEARCH: '/process-with-ai',
    GET_MESSAGES: '/get-messages',
    GET_SESSIONS: '/get-sessions',
    GET_USER_IDENTITY: '/get-user-identity',
    GET_USER_SESSIONS: '/get-user-sessions',
    IDENTIFY_USER: '/identify-user',
    LOGIN_WITH_JWT: '/login-with-jwt',
    MIGRATE_DATA: '/migrate-anonymous-data',
    SYNC_USER_IDENTITY: '/sync-user-identity',
    SYSTEM_STATUS: '/check-ollama',
    TRACK_USAGE: '/track-usage',
    USER_REGISTRATION_MIGRATION: '/user-registration-migration'
  },


  // Configuración de timeout (reducido para evitar esperas largas)
TIMEOUT: 10_000  // 10 segundos
};

/**
 * Cliente para la API de Eventos
 */
export class EventosAPIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = EVENTOS_API_CONFIG.BACKEND_URL;
    this.timeout = EVENTOS_API_CONFIG.TIMEOUT;
  }

  /**
   * Enviar mensaje de chat
   */
  async sendMessage(data: {
    content: string;
    metadata?: any;
    process_with_ai?: boolean;
    role: string;
    sessionId: string;
    type?: string;
  }) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.CHAT_MESSAGE}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Crear sesión de chat
   */
  async createSession(data: {
    config?: any;
    development: string;
    meta?: any;
    title?: string;
    userId: string;
  }) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.CHAT_SESSION}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtener mensajes de una sesión
   */
  async getMessages(sessionId: string, page: number = 1, limit: number = 50) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.GET_MESSAGES}/${sessionId}?page=${page}&limit=${limit}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Procesar mensaje con IA
   */
  async processWithAI(data: {
    message: string;
    model?: string;
    sessionId: string;
  }) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.EVENTS_SEARCH}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.CHAT_HEALTH}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(5000) // 5 segundos para health check
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'healthy';
  }

  /**
   * Verificar estado de Ollama
   */
  async checkOllama() {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.SYSTEM_STATUS}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtener sesiones del usuario
   */
  async getUserSessions(userId: string, development: string = 'eventosorganizador') {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.GET_SESSIONS}/${userId}?development=${development}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Migrar datos anónimos
   */
  async migrateAnonymousData(data: {
    anonymous_session_id: string;
    conversations: any[];
    development?: string;
    user_id: string;
  }) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.MIGRATE_DATA}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Migración automática cuando un usuario se registra o actualiza configuración
   * Equivalente a 'actualizar usuario' en debug - migra todos los chats anónimos
   */
  async userRegistrationMigration(data: {
    anonymous_session_id?: string;
    development?: string;
    user_email?: string;
    user_id: string;
    user_name?: string;
  }) {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.USER_REGISTRATION_MIGRATION}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtener sesiones detalladas del usuario (incluyendo migradas)
   */
  async getUserSessionsDetailed(userId: string, development: string = 'eventosorganizador') {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.GET_USER_SESSIONS}/${userId}?development=${development}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Sincronizar identidad del usuario entre frontend y middleware
   * Se llama cuando el usuario se registra o actualiza su configuración
   */
  async syncUserIdentity(data: {
    anonymous_session_id?: string;
    development?: string;
    user_email?: string;
    user_id: string;
    user_name?: string;
  }) {
    // El endpoint está en /api/auth/sync-user-identity (el router auth ya tiene prefijo /api/auth)
    const response = await fetch(`${this.baseURL}/api/auth${EVENTOS_API_CONFIG.ENDPOINTS.SYNC_USER_IDENTITY}`, {
      body: JSON.stringify(data),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtener información de identidad del usuario
   */
  async getUserIdentity(userId: string, development: string = 'eventosorganizador') {
    const response = await fetch(`${this.baseURL}${EVENTOS_API_CONFIG.ENDPOINTS.GET_USER_IDENTITY}/${userId}?development=${development}`, {
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Identificar tipo de usuario (visitante o registrado)
   * El backend maneja toda la lógica de identificación
   */
  async identifyUser(developer?: string, email?: string, phone?: string) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{baseURL:this.baseURL,developer,hasEmail:!!email,hasPhone:!!phone},hypothesisId:'A',location:'eventos-api.ts:324',message:'identifyUser ENTRY',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
    // #endregion
    try {
      console.log('📡 EventosAPIClient.identifyUser llamando a:', {
        developer: developer || 'bodasdehoy',
        email: email ? `${email.slice(0, 10)}...` : undefined,
        endpoint: `${this.baseURL}/api/auth${EVENTOS_API_CONFIG.ENDPOINTS.IDENTIFY_USER}`,
        hasEmail: !!email,
        hasPhone: !!phone,
        phone: phone ? `${phone.slice(0, 10)}...` : undefined
      });

      // ✅ FIX: Reducido de 20s a 8s. En modo iframe el usuario llega via AUTH_CONFIG (~600ms),
      // así que identifyUser solo se llama como fallback (no-iframe o fallback). 20s era excesivo.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos para identifyUser

      // #region agent log
      const fetchStartTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{timestamp:fetchStartTime,url:`${this.baseURL}/api/auth${EVENTOS_API_CONFIG.ENDPOINTS.IDENTIFY_USER}`},hypothesisId:'A',location:'eventos-api.ts:341',message:'identifyUser BEFORE fetch',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
      // #endregion
      try {
        // El endpoint está en /api/auth/identify-user (el router auth ya tiene prefijo /api/auth)
        const response = await fetch(`${this.baseURL}/api/auth${EVENTOS_API_CONFIG.ENDPOINTS.IDENTIFY_USER}`, {
          body: JSON.stringify({
            developer: developer || 'bodasdehoy',
            email: email || undefined,
            phone: phone || undefined
          }),
          headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
          method: 'POST',
          signal: controller.signal
        });

        // #region agent log
        const fetchEndTime = Date.now();
        fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{elapsed:fetchEndTime-fetchStartTime,ok:response.ok,status:response.status,statusText:response.statusText},hypothesisId:'A',location:'eventos-api.ts:352',message:'identifyUser AFTER fetch',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
        // #endregion
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error ${response.status} en identifyUser:`, errorText);

          // ✅ CRÍTICO: Intentar parsear respuesta JSON para obtener mensaje de error detallado
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          // Crear error con información detallada
          const error = new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
          (error as any).status = response.status;
          (error as any).error_code = errorData.error_code;
          (error as any).error_details = errorData.error_details;
          (error as any).response_data = errorData;

          throw error;
        }

        const result = await response.json();

        // ✅ CRÍTICO: Verificar si la respuesta indica error aunque sea HTTP 200
        if (result.success === false) {
          const error = new Error(result.message || result.error || 'Error al identificar usuario');
          (error as any).status = 500;
          (error as any).error_code = result.error_code;
          (error as any).error_details = result.error_details;
          (error as any).response_data = result;
          throw error;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{hasUserId:!!result.user_id,success:result.success,userType:result.user_type},hypothesisId:'A',location:'eventos-api.ts:360',message:'identifyUser SUCCESS',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
        // #endregion
        console.log('✅ identifyUser respuesta recibida:', {
          development: result.development,
          success: result.success,
          user_id: result.user_id ? `${result.user_id.slice(0, 20)}...` : undefined,
          user_type: result.user_type
        });

        return result;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{isAbort:fetchError.name==='AbortError',message:fetchError.message,name:fetchError.name},hypothesisId:'A',location:'eventos-api.ts:369',message:'identifyUser FETCH ERROR',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
        // #endregion
        if (fetchError.name === 'AbortError') {
          throw new Error(`Timeout después de 8 segundos al identificar usuario`);
        }
        throw fetchError;
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{message:error.message,name:error.name},hypothesisId:'A',location:'eventos-api.ts:376',message:'identifyUser CATCH ERROR',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
      // #endregion
      console.error('❌ Error en EventosAPIClient.identifyUser:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n')[0]
      });
      throw error;
    }
  }

  /**
   * Login completo con autenticación JWT
   * El backend obtiene el token y datos completos del usuario
   * Usa el cliente optimizado para cache y rate limiting
   */
  async loginWithJWT(email: string, password: string, developer: string) {
    // Usar cliente optimizado si está disponible
    try {
      const { optimizedApiClient } = await import('@/utils/api-client-optimized');

      // Verificar si hay token válido en cache antes de hacer login
      const cachedToken = await optimizedApiClient.getToken();
      if (cachedToken) {
        console.log('📦 Token encontrado en cache, verificando validez...');
        // Intentar usar token cacheado primero
        // Si falla, se hará login normal
      }
    } catch {
      // Si no existe el cliente optimizado, continuar con método normal
      console.warn('⚠️ Cliente optimizado no disponible, usando método normal');
    }

    // El endpoint está en /api/auth/login-with-jwt (el router auth ya tiene prefijo /api/auth)
    const response = await fetch(`${this.baseURL}/api/auth${EVENTOS_API_CONFIG.ENDPOINTS.LOGIN_WITH_JWT}`, {
      body: JSON.stringify({ developer, email, password }),
      headers: EVENTOS_API_CONFIG.DEFAULT_HEADERS,
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Guardar token usando cliente optimizado si está disponible
    if (data.token) {
      try {
        const { optimizedApiClient } = await import('@/utils/api-client-optimized');
        optimizedApiClient.setToken(data.token, data.user_id, data.development);
      } catch {
        // Fallback: guardar directamente en localStorage
        localStorage.setItem('jwt_token', data.token);
      }
    }

    return data;
  }

  /**
   * Login con Firebase ID Token
   * Intercambia el Firebase ID Token por un JWT oficial de API2
   */
  async loginWithFirebase(
    firebaseIdToken: string,
    developer: string,
    device?: string,
    fingerprint?: string
  ) {
    const { loginWithFirebase: firebaseLogin } = await import('@/services/api2/auth');

    const result = await firebaseLogin({
      development: developer,
      device,
      fingerprint,
      firebaseIdToken,
    });

    if (!result.success || !result.token) {
      throw new Error(result.errors?.join(', ') || 'No se pudo autenticar con Firebase');
    }

    // Guardar token usando cliente optimizado si está disponible
    if (result.token) {
      try {
        const { optimizedApiClient } = await import('@/utils/api-client-optimized');
        // Necesitamos obtener el userId del token o de otra fuente
        // Por ahora, guardamos solo el token
        optimizedApiClient.setToken(result.token, '', developer);
      } catch {
        // Fallback: guardar directamente en localStorage
        localStorage.setItem('jwt_token', result.token);
      }
    }

    return {
      development: developer,
      expiresAt: result.expiresAt,
      success: true,
      token: result.token,
    };
  }
}

// Instancia global del cliente
export const eventosAPI = new EventosAPIClient();



