'use client';

import { useCallback, useMemo } from 'react';

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

    // Buscar JWT en las diferentes ubicaciones
    const jwtToken = localStorage.getItem('api2_jwt_token') ||
                     localStorage.getItem('jwt_token') ||
                     getUserConfig()?.token;

    if (!jwtToken) return false;

    // Verificar expiración si existe
    const expiresAt = localStorage.getItem('api2_jwt_expires_at');
    if (expiresAt) {
      const expiration = new Date(expiresAt);
      if (expiration <= new Date()) {
        console.warn('⚠️ JWT token expirado');
        return false;
      }
    }

    return true;
  }, [getUserConfig]);

  /**
   * Verifica si el usuario está autenticado
   */
  const checkAuth = useCallback((): AuthCheckResult => {
    const config = getUserConfig();

    const isAuthenticated = !!(
      config?.user_id &&
      config.user_id !== 'guest' &&
      config.user_id !== 'anonymous' &&
      config.user_id !== ''
    );

    const hasValidJwt = checkJwtValidity();

    // Usuario identificado pero sin JWT válido = necesita re-login
    const needsRelogin = isAuthenticated && !hasValidJwt;

    if (needsRelogin) {
      console.warn('⚠️ Usuario identificado pero sin JWT válido - necesita re-login');
    }

    return {
      development: config?.development || 'bodasdehoy',
      hasValidJwt,
      isAuthenticated,
      needsRelogin,
      userEmail: config?.email || null,
      userId: config?.user_id || null,
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
    localStorage.removeItem('api2_jwt_token');
    localStorage.removeItem('api2_jwt_expires_at');
    localStorage.removeItem('jwt_token');

    // Redirigir a dev-login
    window.location.href = '/dev-login?reason=session_expired';
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
