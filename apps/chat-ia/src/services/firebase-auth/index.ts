import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { auth } from '@/libs/firebase';
import { setCrossAppIdToken, clearCrossAppSession } from '@bodasdehoy/shared/auth';
import { registerReferralIfPending, trackRegistrationComplete, getAttributionData, sendAttributionToApi } from '@bodasdehoy/shared';
import posthog from 'posthog-js';

const DEFAULT_DEVELOPMENT = 'bodasdehoy';

function setAuthCookie(name: string, token: string): void {
  const maxAge = 30 * 24 * 60 * 60;
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Generar fingerprint del dispositivo (simple)
 */
function generateFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const fingerprint = {
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };

  return btoa(JSON.stringify(fingerprint)).slice(0, 64);
}

function decodeJwtExpMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    if (typeof atob !== 'function') return null;
    const payload = JSON.parse(atob(parts[1].replaceAll('-', '+').replaceAll('_', '/')));
    const exp = payload?.exp;
    if (!exp || typeof exp !== 'number') return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

function normalizeExpiresAt(expiresAt: unknown, token?: string): string | null {
  const expFromToken = token ? decodeJwtExpMs(token) : null;
  if (typeof expFromToken === 'number') return new Date(expFromToken).toISOString();

  if (expiresAt instanceof Date) return expiresAt.toISOString();

  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
    const ms = expiresAt < 10_000_000_000 ? expiresAt * 1000 : expiresAt;
    return new Date(ms).toISOString();
  }

  if (typeof expiresAt === 'string') {
    const trimmed = expiresAt.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber)) {
        const ms = asNumber < 10_000_000_000 ? asNumber * 1000 : asNumber;
        return new Date(ms).toISOString();
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

/**
 * Intercambiar Firebase ID Token por JWT de API2
 * ✅ Requisito: Para sesión "registered" necesitamos JWT válido. Si el canje falla, devolver success=false.
 */
async function exchangeFirebaseTokenForJWT(
  firebaseIdToken: string,
  development: string,
  user: User,
): Promise<{
  development: string;
  errors?: string[];
  expiresAt?: string;
  jwtError?: string;
  success: boolean;
  token?: string;
  user?: User;
  user_id?: string;
}> {
  // Usar proxy local (/api/auth/firebase-login) para evitar CORS en desarrollo.
  // En producción, el proxy reenvía a BACKEND_URL server-side.
  const LOGIN_URL = typeof window !== 'undefined'
    ? '/api/auth/firebase-login'
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030') + '/api/auth/firebase-login';

  // Guardar info del usuario de Firebase primero (siempre disponible)
  if (user) {
    localStorage.setItem('user_email', user.email || '');
    localStorage.setItem('user_uid', user.uid);
    localStorage.setItem('user_display_name', user.displayName || '');
    localStorage.setItem('current_development', development);
    if (user.photoURL) {
      localStorage.setItem('user_photo_url', user.photoURL);
    }
  }

  // SSO cross-domain: setear idTokenV0.1.0 con Domain=.bodasdehoy.com
  // Permite que appEventos detecte la sesión iniciada desde chat-ia
  if (typeof window !== 'undefined') {
    setCrossAppIdToken(firebaseIdToken);
  }

  try {
    const requestBody = {
      development,
      device: navigator.userAgent,
      fingerprint: generateFingerprint(),
      firebaseIdToken,
    };

    const response = await fetch(LOGIN_URL, {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error('API2 error response:', response.status);
      return {
        development,
        errors: [
          (errorData as any)?.detail ||
            `No se pudo iniciar sesión (HTTP ${response.status}). Inténtalo de nuevo.`,
        ],
        jwtError: 'No se pudo obtener el token de MCP.',
        success: false,
        user: user || undefined,
        user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.error('MCP returned success=false');
      return {
        development,
        errors: [data?.detail || data?.error || 'No se pudo obtener el token de MCP.'],
        jwtError: 'No se pudo obtener el token de MCP.',
        success: false,
        user: user || undefined,
        user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
      };
    }

    if (!data?.token) {
      return {
        development,
        errors: ['Login incompleto: el backend no devolvió token.'],
        jwtError: 'No se pudo obtener el token de MCP.',
        success: false,
        user: user || undefined,
        user_id: user?.email || user?.uid,
      };
    }

    // Guardar JWT en localStorage
    localStorage.setItem('mcp_jwt_token', data.token);
    localStorage.setItem('api2_jwt_token', data.token);
    const normalizedExpiresAt = normalizeExpiresAt(data.expiresAt, data.token);
    if (normalizedExpiresAt) {
      localStorage.setItem('mcp_jwt_expires_at', normalizedExpiresAt);
      localStorage.setItem('api2_jwt_expires_at', normalizedExpiresAt);
    } else {
      localStorage.removeItem('mcp_jwt_expires_at');
      localStorage.removeItem('api2_jwt_expires_at');
    }
    localStorage.setItem('current_development', data.development || development);

    // También guardar jwt_token para compatibilidad con getAuthToken()
    localStorage.setItem('jwt_token', data.token);

    // Cookie dedicada mcp_jwt: el chat proxy la lee para Authorization header.
    // A diferencia de dev-user-config, ningún componente React la sobreescribe.
    if (typeof window !== 'undefined') {
      setAuthCookie('mcp_jwt', data.token);
      setAuthCookie('api2_jwt', data.token);
    }

    // Guardar dev-user-config para que EventosAutoAuth reconozca al usuario
    const devUserConfig = {
      developer: data.development || development,
      development: data.development || development,
      email: user?.email || undefined,
      timestamp: Date.now(),
      token: data.token,
      userId: user?.email || user?.uid,
      user_id: user?.email || user?.uid,
      user_type: 'registered',
    };
    localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));

    // ── Tracking: referral + attribution + analytics ─────────────────────────
    registerReferralIfPending(data.token, development).catch(() => undefined);
    sendAttributionToApi(data.token, development).catch(() => undefined);
    trackRegistrationComplete(
      user?.providerData?.[0]?.providerId?.includes('google') ? 'google'
        : user?.providerData?.[0]?.providerId?.includes('facebook') ? 'facebook'
        : 'email',
      development,
    );

    // PostHog identify — vincula eventos futuros con el usuario real
    if (user?.uid) {
      const lastTouch = getAttributionData();
      posthog.identify(user.uid, {
        development,
        email: user.email ?? undefined,
        ref: lastTouch?.ref,
        utm_campaign: lastTouch?.utm_campaign,
        utm_medium: lastTouch?.utm_medium,
        utm_source: lastTouch?.utm_source,
      });
    }

    return {
      development: data.development,
      expiresAt: data.expiresAt,
      success: true,
      token: data.token,
      user: user || undefined,
      user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
    };
  } catch (error: any) {
    console.error('API2 connection error:', error);
    // ⚠️ IMPORTANTE: Retornar éxito parcial pero SIN JWT

    // ✅ Aún así guardar dev-user-config para que el usuario no vea el prompt de registro
    const devUserConfig = {
      developer: development,
      development,
      email: user?.email || undefined,
      timestamp: Date.now(),
      token: null,
      userId: user?.email || user?.uid,
      user_id: user?.email || user?.uid,
      user_type: 'registered',
    };
    localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));

    return {
      development,
      jwtError: 'Error de conexión. Algunas funciones estarán limitadas.',
      success: true,
      user: user || undefined,
      user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
    };
  }
}

/**
 * Procesar resultado de redirect de Google
 * ✅ Separado para evitar llamadas duplicadas a getRedirectResult
 */
/**
 * Verificar si sessionStorage está disponible
 */
function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return false;
    }
    const testKey = '__sessionStorage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Guardar en sessionStorage de forma segura
 */
function safeSetSessionStorage(key: string, value: string): void {
  if (isSessionStorageAvailable()) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Fallback a localStorage si sessionStorage falla
      // Fallback a localStorage si sessionStorage no está disponible
      localStorage.setItem(key, value);
    }
  } else {
    // Fallback a localStorage
    localStorage.setItem(key, value);
  }
}

/**
 * Obtener de sessionStorage de forma segura
 */
function safeGetSessionStorage(key: string): string | null {
  if (isSessionStorageAvailable()) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      // Fallback a localStorage si sessionStorage falla
      return localStorage.getItem(key);
    }
  }
  return localStorage.getItem(key);
}

/**
 * Eliminar de sessionStorage de forma segura
 */
function safeRemoveSessionStorage(key: string): void {
  if (isSessionStorageAvailable()) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // También intentar eliminar de localStorage
      localStorage.removeItem(key);
    }
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Procesar resultado de redirect de Google
 * ✅ Separado para evitar llamadas duplicadas a getRedirectResult
 */
export const processGoogleRedirectResult = async (development: string = DEFAULT_DEVELOPMENT) => {
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult && redirectResult.providerId === 'google.com') {
      const savedDevelopment = safeGetSessionStorage('google_login_development') || development;
      safeRemoveSessionStorage('google_login_development');

      const redirectUrl = safeGetSessionStorage('google_login_redirect_url');
      safeRemoveSessionStorage('google_login_redirect_url');

      if (redirectUrl && typeof window !== 'undefined') {
        // La redirección se manejará en el componente que llama a esta función
      }

      const firebaseIdToken = await redirectResult.user.getIdToken();
      return await exchangeFirebaseTokenForJWT(firebaseIdToken, savedDevelopment, redirectResult.user);
    }
    return null;
  } catch (error: any) {
    console.error('Google redirect error', error);
    throw error;
  }
};

/**
 * Login con Google usando Firebase
 * ✅ MEJORADO: Intenta popup primero, si falla usa redirect como fallback
 */
export const loginWithGoogle = async (development: string = DEFAULT_DEVELOPMENT) => {
  const provider = new GoogleAuthProvider();

  // Configurar provider
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account', // Siempre mostrar selector de cuenta
  });

  // Detectar Safari/WebKit: ITP bloquea popups de terceros → usar redirect directamente.
  // Chrome/Firefox: intentar popup primero (mejor UX), con redirect como fallback.
  const isWebKit =
    typeof window !== 'undefined' &&
    /safari/i.test(navigator.userAgent) &&
    !/chrome|chromium|edg/i.test(navigator.userAgent);

  const startRedirect = async () => {
    safeSetSessionStorage('google_login_development', development);
    if (typeof window !== 'undefined') {
      safeSetSessionStorage('google_login_redirect_url', window.location.href);
    }
    await signInWithRedirect(auth, provider);
    return undefined; // signInWithRedirect redirige la página — no retorna
  };

  // Safari/WebKit: ir directo a redirect, sin popup (siempre fallaría con popup-blocked)
  if (isWebKit) {
    console.log('[FirebaseAuth] WebKit detectado — usando redirect directo para Google login');
    return startRedirect();
  }

  // Chrome/Firefox: popup primero, redirect como fallback
  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseIdToken = await result.user.getIdToken();
    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (popupError: any) {
    // Loguear el código real para diagnóstico (visible en DevTools)
    console.warn('[FirebaseAuth] popup error code:', popupError.code, popupError.message);

    // Solo reintentar con redirect si el popup fue bloqueado o cancelado —
    // NO incluir auth/unauthorized-domain (significa config de Firebase incorrecta,
    // no un problema de popup, y el redirect tampoco funcionaría)
    const shouldTryRedirect = [
      'auth/popup-blocked',
      'auth/cancelled-popup-request',
    ].includes(popupError.code);

    if (shouldTryRedirect) {
      try {
        return await startRedirect();
      } catch (redirectError: any) {
        console.error('[FirebaseAuth] redirect fallback error:', redirectError);
        safeRemoveSessionStorage('google_login_development');
        safeRemoveSessionStorage('google_login_redirect_url');
        throw new Error(redirectError.message || 'Error al iniciar sesión con Google (redirect falló)');
      }
    }

    switch (popupError.code) {
    case 'auth/popup-closed-by-user': {
      throw new Error('Has cerrado la ventana de login');
    }
    case 'auth/popup-blocked': {
      throw new Error('El navegador bloqueó la ventana emergente. Habilita popups para este sitio o usa otro navegador.');
    }
    case 'auth/unauthorized-domain': {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'desconocido';
      throw new Error(`El dominio "${hostname}" no está autorizado en Firebase. Contacta al administrador.`);
    }
    // No default
    }

    throw new Error(popupError.message || 'Error al iniciar sesión con Google');
  }
};

/**
 * Procesar resultado de redirect de Facebook
 * ✅ Separado para evitar llamadas duplicadas a getRedirectResult
 */
export const processFacebookRedirectResult = async (development: string = DEFAULT_DEVELOPMENT) => {
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult && redirectResult.providerId === 'facebook.com') {
      const savedDevelopment = safeGetSessionStorage('facebook_login_development') || development;
      safeRemoveSessionStorage('facebook_login_development');

      const firebaseIdToken = await redirectResult.user.getIdToken();
      return await exchangeFirebaseTokenForJWT(firebaseIdToken, savedDevelopment, redirectResult.user);
    }
    return null;
  } catch (error: any) {
    console.error('Facebook redirect error:', error);
    throw error;
  }
};

/**
 * Login con Facebook usando Firebase
 * ✅ FIX: Solo usa signInWithPopup para evitar problemas de sessionStorage
 */
export const loginWithFacebook = async (development: string = DEFAULT_DEVELOPMENT) => {
  try {
    const provider = new FacebookAuthProvider();

    // Configurar provider
    provider.addScope('email');
    provider.addScope('public_profile');

    // ✅ FIX: Siempre usar popup - signInWithRedirect tiene problemas con sessionStorage
    const result = await signInWithPopup(auth, provider);

    // Obtener Firebase ID Token
    const firebaseIdToken = await result.user.getIdToken();

    // Intercambiar por JWT de API2
    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('Facebook login error:', error);

    switch (error.code) {
    case 'auth/popup-closed-by-user': {
      throw new Error('Has cerrado la ventana de login');
    }
    case 'auth/popup-blocked': {
      throw new Error('El navegador bloqueó la ventana emergente. Por favor, habilita popups para este sitio.');
    }
    case 'auth/account-exists-with-different-credential': {
      throw new Error('Ya existe una cuenta con este email usando otro método de login');
    }
    // No default
    }

    throw new Error(error.message || 'Error al iniciar sesión con Facebook');
  }
};

/**
 * Login con Email/Password usando Firebase
 */
export const loginWithEmailPassword = async (
  email: string,
  password: string,
  development: string = DEFAULT_DEVELOPMENT,
) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseIdToken = await result.user.getIdToken();

    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('Email/password login error:', error);

    switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password': {
      throw new Error('Email o contraseña incorrectos');
    }
    case 'auth/invalid-email': {
      throw new Error('Email inválido');
    }
    case 'auth/user-disabled': {
      throw new Error('Esta cuenta ha sido deshabilitada');
    }
    // No default
    }

    throw new Error(error.message || 'Credenciales inválidas');
  }
};

/**
 * Registrar usuario con Email/Password
 */
export const registerWithEmailPassword = async (
  email: string,
  password: string,
  development: string = DEFAULT_DEVELOPMENT,
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseIdToken = await result.user.getIdToken();

    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('Registration error:', error);

    switch (error.code) {
    case 'auth/email-already-in-use': {
      throw new Error('Este email ya está registrado');
    }
    case 'auth/invalid-email': {
      throw new Error('Email inválido');
    }
    case 'auth/weak-password': {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    // No default
    }

    throw new Error(error.message || 'Error al registrar usuario');
  }
};

/**
 * Inicia el listener que renueva el cookie cross-domain idTokenV0.1.0 automáticamente.
 * Firebase refresca el ID token cada ~55 min. Este listener mantiene el cookie siempre fresco
 * para que la sesión de chat-ia → appEventos (SSO) sea válida indefinidamente.
 *
 * Llamar UNA VEZ al iniciar la app (layout/providers). Retorna la función de unsubscribe.
 */
export function initCrossAppTokenRefresh(): () => void {
  if (typeof window === 'undefined') return () => {};

  return onIdTokenChanged(auth, async (user) => {
    if (user) {
      try {
        const freshToken = await user.getIdToken();
        setCrossAppIdToken(freshToken);

        // Auto-refresh del JWT de API2: si existe un token previo, renovarlo
        // para que las llamadas a API2 no fallen con 401 tras ~55 min.
        const existingJwt = localStorage.getItem('api2_jwt_token');
        if (existingJwt) {
          const dev = localStorage.getItem('current_development') || 'bodasdehoy';
          exchangeFirebaseTokenForJWT(freshToken, dev, user).catch(() => {
            // Silencioso — el token anterior sigue siendo válido por un rato más
          });
        }
      } catch {
        // Silencioso — no interrumpir la app si falla el refresh del cookie
      }
    } else {
      clearCrossAppSession();
    }
  });
}

/**
 * Cerrar sesión
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);

    // Limpiar cookies cross-domain (SSO)
    clearCrossAppSession();

    // Limpiar localStorage
    localStorage.removeItem('api2_jwt_token');
    localStorage.removeItem('api2_jwt_expires_at');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('dev-user-config');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_uid');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_photo_url');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Verificar si hay sesión activa
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('api2_jwt_token');
  const expiresAt = localStorage.getItem('api2_jwt_expires_at');

  if (!token || !expiresAt) return false;

  // Verificar si el token ha expirado
  const expiration = new Date(expiresAt);
  const now = new Date();

  return expiration > now;
};

/**
 * Obtener JWT actual
 */
export const getJWT = (): string | null => {
  if (!isAuthenticated()) return null;
  return localStorage.getItem('api2_jwt_token');
};
