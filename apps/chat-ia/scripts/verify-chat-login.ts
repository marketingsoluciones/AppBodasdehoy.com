/**
 * Script de Verificación de Estado de Login en el Chat
 * 
 * Este script proporciona funciones para verificar que el usuario
 * está correctamente logueado en el chat/copilot después del login.
 * 
 * Verifica múltiples fuentes de verdad:
 * - localStorage (api2_jwt_token, dev-user-config)
 * - Cookies (dev-user-config)
 * - Store de Zustand (useChatStore)
 * - UI del chat (usuario visible)
 */

/**
 * Resultado de verificación de login en el chat
 */
export interface ChatLoginVerification {
  /** Si el usuario está logueado */
  isLoggedIn: boolean;
  /** ID del usuario (email o teléfono) */
  userId?: string;
  /** Email del usuario */
  userEmail?: string;
  /** Si tiene token JWT */
  hasToken: boolean;
  /** Si tiene configuración de usuario */
  hasConfig: boolean;
  /** Development/marca actual */
  development?: string;
  /** Tipo de usuario (registered, guest) */
  userType?: string;
  /** Detalles adicionales */
  details: {
    hasApi2Token: boolean;
    hasJwtToken: boolean;
    hasDevUserConfig: boolean;
    hasDevUserConfigCookie: boolean;
    token?: string;
    config?: any;
    chatStoreState?: any;
    cookies?: string[];
  };
}

/**
 * Verifica el estado de login en el chat
 * 
 * Esta función debe ser ejecutada en el contexto del navegador
 * usando las herramientas MCP de Cursor.
 */
export function getVerificationScript(): string {
  return `
    (function() {
      // Verificar localStorage
      const api2Token = localStorage.getItem('api2_jwt_token');
      const jwtToken = localStorage.getItem('jwt_token');
      const devUserConfig = localStorage.getItem('dev-user-config');
      
      // Parsear dev-user-config si existe
      let config = null;
      if (devUserConfig) {
        try {
          config = JSON.parse(devUserConfig);
        } catch (e) {
          console.warn('Error parseando dev-user-config:', e);
        }
      }
      
      // Verificar store de Zustand (si está disponible)
      let chatStoreState = null;
      try {
        // Intentar acceder al store de chat desde window
        if (typeof window !== 'undefined') {
          // El store puede estar disponible globalmente o a través de un módulo
          const stores = (window as any).__ZUSTAND_STORES__;
          if (stores && stores.chatStore) {
            chatStoreState = stores.chatStore.getState();
          } else if ((window as any).useChatStore) {
            // Si useChatStore está disponible globalmente
            chatStoreState = (window as any).useChatStore.getState();
          }
        }
      } catch (e) {
        // El store puede no estar disponible en este contexto
        console.warn('No se pudo acceder al store de chat:', e);
      }
      
      // Verificar cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key) {
          acc[key] = decodeURIComponent(value || '');
        }
        return acc;
      }, {} as Record<string, string>);
      
      const hasDevUserConfigCookie = !!cookies['dev-user-config'];
      
      // Determinar userId
      const userId = config?.userId || config?.user_id || chatStoreState?.currentUserId || null;
      const userEmail = config?.email || (userId && userId.includes('@') ? userId : null);
      
      // Determinar si está logueado
      const isLoggedIn = !!(
        userId &&
        userId !== 'visitante@guest.local' &&
        userId !== 'guest' &&
        userId !== 'anonymous' &&
        (api2Token || jwtToken || hasDevUserConfigCookie)
      );
      
      return {
        isLoggedIn: isLoggedIn,
        userId: userId,
        userEmail: userEmail,
        hasToken: !!(api2Token || jwtToken),
        hasConfig: !!devUserConfig,
        development: config?.developer || config?.development || chatStoreState?.development || null,
        userType: config?.user_type || chatStoreState?.userType || null,
        details: {
          hasApi2Token: !!api2Token,
          hasJwtToken: !!jwtToken,
          hasDevUserConfig: !!devUserConfig,
          hasDevUserConfigCookie: hasDevUserConfigCookie,
          token: api2Token || jwtToken || null,
          config: config,
          chatStoreState: chatStoreState ? {
            currentUserId: chatStoreState.currentUserId,
            development: chatStoreState.development,
            userType: chatStoreState.userType,
            userProfile: chatStoreState.userProfile,
          } : null,
          cookies: Object.keys(cookies).filter(k => 
            k.includes('session') || 
            k.includes('dev-user') || 
            k.includes('jwt')
          ),
        }
      };
    })();
  `;
}

/**
 * Verifica que el usuario está logueado en el chat
 * 
 * Esta función debe ser llamada desde las herramientas MCP del navegador.
 * 
 * Ejemplo de uso:
 * ```typescript
 * const verification = await browser_execute_script({
 *   script: getVerificationScript()
 * });
 * const result = JSON.parse(verification);
 * if (result.isLoggedIn) {
 *   console.log('✅ Usuario está logueado:', result.userId);
 * }
 * ```
 */
export async function verifyChatLogin(): Promise<ChatLoginVerification> {
  const script = getVerificationScript();
  
  // Nota: Esta función sería llamada desde las herramientas MCP
  // const result = await browser_execute_script({ script });
  // return JSON.parse(result);
  
  // Por ahora, retornamos una estructura de ejemplo
  return {
    isLoggedIn: false,
    hasToken: false,
    hasConfig: false,
    details: {
      hasApi2Token: false,
      hasJwtToken: false,
      hasDevUserConfig: false,
      hasDevUserConfigCookie: false,
      cookies: [],
    },
  };
}

/**
 * Verifica que el usuario aparece en la UI del chat
 * 
 * Busca elementos en el DOM que indiquen que el usuario está logueado.
 */
export function getUIVerificationScript(): string {
  return `
    (function() {
      // Buscar elementos que indiquen usuario logueado
      const userInfoElements = document.querySelectorAll('[data-testid*="user"], [class*="user-info"], [class*="UserInfo"]');
      const userAvatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
      const loginButtons = document.querySelectorAll('button:has-text("Iniciar sesión"), a:has-text("Iniciar sesión")');
      const logoutButtons = document.querySelectorAll('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
      
      // Verificar si hay indicadores de usuario logueado
      const hasUserInfo = userInfoElements.length > 0;
      const hasUserAvatar = userAvatars.length > 0;
      const hasLoginButton = loginButtons.length > 0;
      const hasLogoutButton = logoutButtons.length > 0;
      
      // Buscar texto que indique email o nombre de usuario
      const bodyText = document.body.innerText || '';
      const hasEmailInText = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/.test(bodyText);
      
      return {
        hasUserInfo: hasUserInfo,
        hasUserAvatar: hasUserAvatar,
        hasLoginButton: hasLoginButton,
        hasLogoutButton: hasLogoutButton,
        hasEmailInText: hasEmailInText,
        userInfoCount: userInfoElements.length,
        avatarCount: userAvatars.length,
        // Si hay botón de logout pero no de login, probablemente está logueado
        probablyLoggedIn: hasLogoutButton && !hasLoginButton,
      };
    })();
  `;
}

/**
 * Verifica la sesión compartida entre subdominios
 * 
 * Verifica que las cookies están configuradas correctamente
 * para compartir sesión entre subdominios.
 */
export function getSubdomainSharingVerificationScript(): string {
  return `
    (function() {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const baseDomain = parts.length > 2 ? '.' + parts.slice(-2).join('.') : hostname;
      
      // Verificar cookies
      const cookies = document.cookie.split(';').map(c => c.trim());
      const devUserConfigCookie = cookies.find(c => c.startsWith('dev-user-config='));
      const sessionCookies = cookies.filter(c => 
        c.includes('session') || 
        c.includes('dev-user') ||
        c.includes('jwt')
      );
      
      // Verificar dominio de cookies (si es posible)
      // Nota: No podemos leer el dominio de las cookies desde JavaScript,
      // pero podemos verificar que existen
      
      return {
        hostname: hostname,
        baseDomain: baseDomain,
        hasDevUserConfigCookie: !!devUserConfigCookie,
        sessionCookies: sessionCookies,
        cookieCount: cookies.length,
        // Si hay cookie dev-user-config, probablemente está compartida
        probablyShared: !!devUserConfigCookie,
      };
    })();
  `;
}

/**
 * Función helper para verificar login completo
 * 
 * Combina todas las verificaciones en una sola función.
 */
export async function verifyCompleteLogin(): Promise<{
  chatLogin: ChatLoginVerification;
  uiVerification?: any;
  subdomainSharing?: any;
}> {
  const chatLogin = await verifyChatLogin();
  
  // Nota: Estas verificaciones adicionales se harían con browser_execute_script
  // const uiScript = getUIVerificationScript();
  // const uiResult = await browser_execute_script({ script: uiScript });
  // const uiVerification = JSON.parse(uiResult);
  
  // const sharingScript = getSubdomainSharingVerificationScript();
  // const sharingResult = await browser_execute_script({ script: sharingScript });
  // const subdomainSharing = JSON.parse(sharingResult);
  
  return {
    chatLogin,
    // uiVerification,
    // subdomainSharing,
  };
}
