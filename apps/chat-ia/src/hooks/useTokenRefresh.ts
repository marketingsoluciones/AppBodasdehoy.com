/**
 * Hook para renovación automática del JWT token antes de que expire
 * 
 * Características:
 * - Verifica el token cada 5 minutos
 * - Renueva automáticamente cuando quedan menos de 2 días
 * - Usa Firebase para renovar el token
 * - Notifica al usuario cuando el token está próximo a expirar
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Importar auth de forma lazy para evitar errores en SSR
let auth: any = null;
const getAuth = async () => {
  if (!auth && typeof window !== 'undefined') {
    const firebaseModule = await import('@/libs/firebase');
    auth = firebaseModule.auth;
  }
  return auth;
};

interface TokenRefreshStatus {
  daysUntilExpiry: number | null;
  isChecking: boolean;
  lastCheck: Date | null;
  nextRefresh: Date | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

// Configuración
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Verificar cada 5 minutos
const REFRESH_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000; // Renovar cuando quedan menos de 2 días

export const useTokenRefresh = () => {
  const [status, setStatus] = useState<TokenRefreshStatus>({
    daysUntilExpiry: null,
    isChecking: false,
    lastCheck: null,
    nextRefresh: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isRefreshingRef = useRef(false);

  /**
   * Obtener Firebase ID Token fresco
   * ✅ MEJORADO: Espera a que Firebase Auth se inicialice y maneje casos donde currentUser es null
   */
  const getFirebaseToken = useCallback(async (): Promise<string | null> => {
    try {
      const authInstance = await getAuth();
      if (!authInstance) {
        console.log('🔒 Firebase Auth no disponible (SSR)');
        return null;
      }

      // Si hay usuario actual, obtener token
      if (authInstance.currentUser) {
        const firebaseToken = await authInstance.currentUser.getIdToken(true);
        console.log('✅ Firebase token renovado desde currentUser');
        return firebaseToken;
      }

      // Si no hay currentUser, esperar a que Firebase Auth se inicialice
      // (puede pasar después de recargar la página)
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏱️ Timeout esperando Firebase Auth, no hay usuario autenticado');
          resolve(null);
        }, 5000); // Esperar máximo 5 segundos

        const unsubscribe = onAuthStateChanged(authInstance, async (user: User | null) => {
          clearTimeout(timeout);
          unsubscribe();

          if (user) {
            try {
              const firebaseToken = await user.getIdToken(true);
              console.log('✅ Firebase token renovado después de onAuthStateChanged');
              resolve(firebaseToken);
            } catch (error) {
              console.error('❌ Error obteniendo token después de auth state change:', error);
              resolve(null);
            }
          } else {
            console.log('🔒 No hay usuario de Firebase autenticado');
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error obteniendo Firebase token:', error);
      return null;
    }
  }, []);

  /**
   * Renovar JWT de API2 usando Firebase token
   */
  const refreshJWT = useCallback(async (silent: boolean = true): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('⏳ Ya hay una renovación en curso, saltando...');
      return false;
    }

    try {
      isRefreshingRef.current = true;

      if (!silent) {
        message.loading({ content: 'Renovando sesión...', duration: 0, key: 'token-refresh' });
      }

      // Obtener Firebase token fresco
      const firebaseToken = await getFirebaseToken();
      if (!firebaseToken) {
        console.warn('⚠️ No se pudo obtener Firebase token para renovar');
        return false;
      }

      // Obtener development actual
      const development = localStorage.getItem('current_development') || 'bodasdehoy';

      // Intercambiar por JWT de API2
      const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
        body: JSON.stringify({
          development,
          device: navigator.userAgent,
          fingerprint: generateFingerprint(),
          firebaseIdToken: firebaseToken,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        console.error('❌ Error renovando JWT:', response.statusText);
        if (!silent) {
          message.error({ content: 'No se pudo renovar la sesión', key: 'token-refresh' });
        }
        return false;
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        console.error('❌ API2 no devolvió token válido');
        if (!silent) {
          message.error({ content: 'No se pudo renovar la sesión', key: 'token-refresh' });
        }
        return false;
      }

      // Guardar nuevo token
      localStorage.setItem('api2_jwt_token', data.token);
      localStorage.setItem('api2_jwt_expires_at', data.expiresAt);
      
      console.log('✅ JWT renovado exitosamente. Expira:', data.expiresAt);

      if (!silent) {
        message.success({ content: 'Sesión renovada correctamente', key: 'token-refresh' });
      }

      return true;
    } catch (error) {
      console.error('❌ Error inesperado renovando JWT:', error);
      if (!silent) {
        message.error({ content: 'Error renovando la sesión', key: 'token-refresh' });
      }
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [getFirebaseToken]);

  /**
   * Verificar si el token necesita renovación
   */
  const checkTokenExpiry = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const token = localStorage.getItem('api2_jwt_token');
      const expiresAtStr = localStorage.getItem('api2_jwt_expires_at');

      if (!token || !expiresAtStr) {
        console.log('⚠️ No hay JWT en localStorage');
        setStatus(prev => ({
          ...prev,
          daysUntilExpiry: null,
          isChecking: false,
          lastCheck: new Date(),
        }));
        return;
      }

      const expiresAt = new Date(expiresAtStr);
      const now = new Date();
      const msUntilExpiry = expiresAt.getTime() - now.getTime();
      const daysUntilExpiry = msUntilExpiry / (24 * 60 * 60 * 1000);

      console.log(`🕐 Token expira en ${daysUntilExpiry.toFixed(1)} días (${expiresAt.toLocaleString()})`);

      setStatus(prev => ({
        ...prev,
        daysUntilExpiry,
        isChecking: false,
        lastCheck: new Date(),
      }));

      // Si el token ya expiró
      if (msUntilExpiry <= 0) {
        console.warn('⚠️ Token expirado, renovando...');
        await refreshJWT(false);
        return;
      }

      // Si quedan menos de 2 días, renovar automáticamente
      if (msUntilExpiry < REFRESH_THRESHOLD_MS) {
        console.log(`🔄 Token próximo a expirar (${daysUntilExpiry.toFixed(1)} días), renovando...`);
        const success = await refreshJWT(true);
        
        if (success) {
          message.success('Tu sesión se ha renovado automáticamente');
        }
      }
    } catch (error) {
      console.error('❌ Error verificando expiración del token:', error);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        lastCheck: new Date(),
      }));
    }
  }, [refreshJWT]);

  /**
   * Iniciar monitoreo automático
   */
  useEffect(() => {
    // Verificar inmediatamente
    checkTokenExpiry();

    // Configurar intervalo de verificación
    intervalRef.current = setInterval(() => {
      checkTokenExpiry();
    }, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkTokenExpiry]);

  /**
   * Renovar manualmente (para botón de usuario)
   */
  const manualRefresh = useCallback(async () => {
    message.loading({ content: 'Renovando sesión...', duration: 0, key: 'manual-refresh' });
    const success = await refreshJWT(false);
    
    if (success) {
      message.success({ content: 'Sesión renovada correctamente', key: 'manual-refresh' });
      await checkTokenExpiry(); // Actualizar estado
    } else {
      message.error({ content: 'No se pudo renovar la sesión', key: 'manual-refresh' });
    }

    return success;
  }, [refreshJWT, checkTokenExpiry]);

  return {
    checkTokenExpiry,
    refreshJWT: manualRefresh,
    status,
  };
};

/**
 * Generar fingerprint del dispositivo
 */
function generateFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * ============================================
 * FUNCIONES STANDALONE (sin hook)
 * Para usar en servicios que no son componentes React
 * ============================================
 */

/**
 * Refrescar JWT de forma standalone (sin hook)
 * Útil para servicios y funciones que no son componentes React
 */
export async function refreshJWTStandalone(silent: boolean = true): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const authInstance = await getAuth();
    if (!authInstance) {
      console.log('🔒 Firebase Auth no disponible');
      return false;
    }

    // Obtener usuario de Firebase (esperar si es necesario)
    let firebaseToken: string | null = null;

    if (authInstance.currentUser) {
      firebaseToken = await authInstance.currentUser.getIdToken(true);
    } else {
      // Esperar a que Firebase Auth se inicialice
      firebaseToken = await new Promise<string | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 3000);
        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
          clearTimeout(timeout);
          unsubscribe();
          if (user) {
            try {
              resolve(await user.getIdToken(true));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
    }

    if (!firebaseToken) {
      console.warn('⚠️ No se pudo obtener Firebase token');
      return false;
    }

    const development = localStorage.getItem('current_development') || 'bodasdehoy';
    const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
      body: JSON.stringify({
        development,
        device: navigator.userAgent,
        fingerprint: generateFingerprint(),
        firebaseIdToken: firebaseToken,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.success || !data.token) return false;

    localStorage.setItem('api2_jwt_token', data.token);
    localStorage.setItem('api2_jwt_expires_at', data.expiresAt);

    // También actualizar jwt_token para compatibilidad
    localStorage.setItem('jwt_token', data.token);

    // ✅ Actualizar token en dev-user-config si existe
    try {
      const existingConfig = localStorage.getItem('dev-user-config');
      if (existingConfig) {
        const config = JSON.parse(existingConfig);
        config.token = data.token;
        config.timestamp = Date.now();
        localStorage.setItem('dev-user-config', JSON.stringify(config));
      }
    } catch {
      // Ignorar errores de parsing
    }

    console.log('✅ JWT renovado automáticamente');

    if (!silent) {
      message.success('Sesión renovada');
    }

    return true;
  } catch (error) {
    console.error('❌ Error renovando JWT:', error);
    return false;
  }
}

/**
 * Verificar si el error indica sesión expirada
 */
export function isSessionExpiredError(error: any): boolean {
  if (!error) return false;

  const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
  const lowerError = errorStr.toLowerCase();

  return (
    lowerError.includes('session_expired') ||
    lowerError.includes('sesión ha expirado') ||
    lowerError.includes('sesion ha expirado') ||
    lowerError.includes('jwt_requerido') ||
    lowerError.includes('token expired') ||
    lowerError.includes('unauthorized')
  );
}

/**
 * Ejecutar una función con reintento automático si falla por sesión expirada
 *
 * @param fn - Función async a ejecutar
 * @param maxRetries - Número máximo de reintentos (default: 1)
 * @returns Resultado de la función
 */
export async function withSessionRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Solo reintentar si es error de sesión expirada
      if (attempt < maxRetries && isSessionExpiredError(error)) {
        console.log(`🔄 Sesión expirada, renovando y reintentando (intento ${attempt + 1}/${maxRetries})...`);

        const refreshed = await refreshJWTStandalone(true);
        if (!refreshed) {
          console.warn('⚠️ No se pudo renovar la sesión, no se reintentará');
          break;
        }

        // Continuar con el siguiente intento
        continue;
      }

      // Si no es error de sesión o ya agotamos reintentos, lanzar error
      break;
    }
  }

  throw lastError;
}




