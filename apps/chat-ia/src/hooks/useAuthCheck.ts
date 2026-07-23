'use client';

import { useCallback, useMemo } from 'react';

// BUG-CW-N23 (QA1 informe 23-jun, 7+ warns en <1s): useAuthCheck es un hook
// que MUCHOS componentes consumen (sidebar, badge, captation, copilot, etc.).
// En la primera hidratación todos llaman checkAuth() simultáneamente y cada
// llamada disparaba 1 warn → spam de consola (que QA2 confundió con bloqueo
// de Firebase API). Dedupe a nivel módulo: emitir cada warn UNA vez por
// ventana de 60s. Reset en cada cambio de estado real (logout, login).
const __warnedOnce: Record<string, number> = {};
const warnOnce = (key: string, msg: string) => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const last = __warnedOnce[key] ?? 0;
  if (now - last < 60_000) return;
  __warnedOnce[key] = now;
  // eslint-disable-next-line no-console
  console.warn(msg);
};

export interface DevUserConfig {
  development?: string;
  email?: string;
  name?: string;
  token?: string;
  user_id?: string;
}

export interface AuthCheckResult {
  development: string;
  hasValidJwt: boolean;
  isAuthenticated: boolean;
  needsRelogin: boolean;
  userEmail: string | null;
  userId: string | null;
  userName: string | null;
}

export interface CaptationMessage {
  cta_secondary?: string;
  cta_text: string;
  features: string[];
  subtitle: string;
  title: string;
  urgency?: string;
}

export interface CaptationResponse {
  action_required: string;
  cta: {
    primary_text: string;
    register_url: string;
    secondary_text: string;
  };
  is_guest: boolean;
  message: CaptationMessage;
  success: boolean;
}

/**
 * Hook para verificar el estado de autenticación del usuario
 * y obtener mensajes de captación para usuarios no registrados
 */
export const useAuthCheck = () => {
  /**
   * Obtiene la configuración del usuario desde localStorage
   */
  const getUserConfig = useCallback((): DevUserConfig | null => {
    if (typeof window === 'undefined') return null;

    try {
      const rawConfig = localStorage.getItem('dev-user-config');
      if (!rawConfig) return null;
      return JSON.parse(rawConfig) as DevUserConfig;
    } catch {
      return null;
    }
  }, []);

  /**
   * Verifica si hay un JWT válido (no expirado)
   */
  const checkJwtValidity = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const isLikelyJwt = (t: string) => t.split('.').length === 3;
    const decodeJwtExpMs = (t: string): number | null => {
      try {
        if (!isLikelyJwt(t)) return null;
        if (typeof atob !== 'function') return null;
        const payload = JSON.parse(atob(t.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')));
        const exp = payload?.exp;
        if (!exp || typeof exp !== 'number') return null;
        return exp * 1000;
      } catch {
        return null;
      }
    };

    // Buscar JWT en las diferentes ubicaciones
    let jwtToken =
      localStorage.getItem('jwt_token') ||
      localStorage.getItem('mcp_jwt_token') ||
      localStorage.getItem('mcp_jwt_token') ||
      getUserConfig()?.token;

    if (!jwtToken) {
      const cache = localStorage.getItem('jwt_token_cache');
      if (cache) {
        try {
          const parsed = JSON.parse(cache) as { expiry?: number; token?: string };
          if (parsed?.token && parsed?.expiry && Date.now() < parsed.expiry) {
            jwtToken = parsed.token;
          }
        } catch {}
      }
    }

    if (!jwtToken) return false;
    if (!isLikelyJwt(jwtToken)) return false;

    // Verificar expiración si existe
    const expiresAt =
      localStorage.getItem('mcp_jwt_expires_at') || localStorage.getItem('api2_jwt_expires_at');
    if (expiresAt) {
      const expiration = new Date(expiresAt);
      if (expiration <= new Date()) {
        warnOnce('jwt-expired', '⚠️ JWT token expirado');
        return false;
      }
      return true;
    }

    const expMs = decodeJwtExpMs(jwtToken);
    if (expMs && expMs <= Date.now()) return false;
    return true;
  }, [getUserConfig]);

  /**
   * Verifica si el usuario está autenticado
   */
  const checkAuth = useCallback((): AuthCheckResult => {
    const config = getUserConfig();

    // Support both snake_case (user_id) and camelCase (userId) for backwards compat
    const resolvedUserId = config?.user_id || (config as any)?.userId;
    const isAuthenticated = !!(
      resolvedUserId &&
      resolvedUserId !== 'guest' &&
      resolvedUserId !== 'anonymous' &&
      resolvedUserId !== '' &&
      !(resolvedUserId as string).startsWith('visitor_')
    );

    const hasValidJwt = checkJwtValidity();

    // BUG-1 QA (23-jul): el banner "Tu cuenta ha caducado" se mostraba a usuarios
    // que NUNCA iniciaron sesión. "Caducado/expirado" solo es correcto si EXISTIÓ
    // un token que ahora es inválido. Si no hay NINGÚN token (nunca hubo sesión de
    // chat), no es un re-login: es un estado no-autenticado → no alarmar con "caducado".
    const hasAnyToken =
      typeof window !== 'undefined' &&
      !!(
        localStorage.getItem('jwt_token') ||
        localStorage.getItem('mcp_jwt_token') ||
        config?.token ||
        localStorage.getItem('jwt_token_cache')
      );

    // Usuario identificado + TENÍA token (ahora inválido/expirado) = necesita re-login.
    const needsRelogin = isAuthenticated && !hasValidJwt && hasAnyToken;

    if (needsRelogin) {
      warnOnce('needs-relogin', '⚠️ Usuario identificado pero sin JWT válido - necesita re-login');
    }

    return {
      development: config?.development || (config as any)?.developer || 'bodasdehoy',
      hasValidJwt,
      isAuthenticated,
      needsRelogin,
      userEmail: config?.email || null,
      userId: resolvedUserId || null,
      userName: config?.name || null,
    };
  }, [getUserConfig, checkJwtValidity]);

  /**
   * Verifica si es un usuario guest (no autenticado)
   */
  const isGuest = useMemo(() => {
    const { isAuthenticated } = checkAuth();
    return !isAuthenticated;
  }, [checkAuth]);

  /**
   * Obtiene mensaje de captación desde el backend
   */
  const getCaptationMessage = useCallback(
    async (feature: string = 'default'): Promise<CaptationResponse | null> => {
      const { development } = checkAuth();

      try {
        const response = await fetch(
          `/api/auth/guest-restriction?development=${development}&feature=${feature}`,
        );

        if (!response.ok) {
          console.error('Error obteniendo mensaje de captación:', response.status);
          return null;
        }

        const data = await response.json();
        return data as CaptationResponse;
      } catch (error) {
        console.error('Error en getCaptationMessage:', error);
        return null;
      }
    },
    [checkAuth],
  );

  /**
   * Verifica autenticación antes de ejecutar una acción premium
   * Retorna true si puede continuar, false si debe mostrar captación
   */
  const checkBeforePremiumAction = useCallback(
    async (
      feature: string,
      onShowCaptation: (message: CaptationResponse) => void,
    ): Promise<boolean> => {
      const { isAuthenticated } = checkAuth();

      if (isAuthenticated) {
        return true;
      }

      // Usuario no autenticado - obtener mensaje de captación
      const captationMessage = await getCaptationMessage(feature);

      if (captationMessage) {
        onShowCaptation(captationMessage);
      }

      return false;
    },
    [checkAuth, getCaptationMessage],
  );

  /**
   * Obtiene la URL de registro según el desarrollo
   */
  const getRegisterUrl = useCallback((): string => {
    const { development } = checkAuth();

    const registerUrls: Record<string, string> = {
      bodasdehoy: 'https://bodasdehoy.com/registro',
      eventosorganizador: 'https://eventosorganizador.com/registro',
      wildliberty: 'https://wildliberty.com/registro',
    };

    return registerUrls[development] || registerUrls.bodasdehoy;
  }, [checkAuth]);

  /**
   * Obtiene la URL de login según el desarrollo
   */
  const getLoginUrl = useCallback((): string => {
    const { development } = checkAuth();

    const loginUrls: Record<string, string> = {
      bodasdehoy: 'https://bodasdehoy.com/login',
      eventosorganizador: 'https://eventosorganizador.com/login',
      wildliberty: 'https://wildliberty.com/login',
    };

    return loginUrls[development] || loginUrls.bodasdehoy;
  }, [checkAuth]);

  /**
   * Verifica si necesita re-login (tiene email pero no JWT)
   */
  const needsRelogin = useMemo(() => {
    const { needsRelogin: needs } = checkAuth();
    return needs;
  }, [checkAuth]);

  /**
   * Fuerza el re-login limpiando tokens y redirigiendo
   */
  const forceRelogin = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Limpiar tokens expirados/inválidos
    localStorage.removeItem('mcp_jwt_token');
    localStorage.removeItem('mcp_jwt_expires_at');
    localStorage.removeItem('mcp_jwt_token');
    localStorage.removeItem('api2_jwt_expires_at');
    localStorage.removeItem('jwt_token');

    // Redirigir a login
    window.location.href = '/login?reason=session_expired';
  }, []);

  return {
    checkAuth,
    checkBeforePremiumAction,
    forceRelogin,
    getCaptationMessage,
    getLoginUrl,
    getRegisterUrl,
    getUserConfig,
    isGuest,
    needsRelogin,
  };
};

export default useAuthCheck;
