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

/**
 * Obtener la URL actual para usar como redirect URL
 * ✅ IMPORTANTE: Usa el dominio real, no localhost (requerido para Google OAuth)
 */
function getCurrentOrigin(): string {
  if (typeof window !== 'undefined') {
    // En el cliente, usar la URL real del navegador
    return window.location.origin;
  }
  
  // En el servidor, usar variables de entorno con dominio real
  // Prioridad: NEXT_PUBLIC_BASE_URL > APP_URL > fallback a localhost solo en desarrollo
  const baseUrl = 
    process.env.NEXT_PUBLIC_BASE_URL || 
    process.env.APP_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : undefined);
  
  if (baseUrl) {
    // Asegurarse de que sea una URL completa
    try {
      const url = new URL(baseUrl);
      return url.origin;
    } catch {
      // Si no es una URL válida, intentar construirla
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return baseUrl;
      }
      return `https://${baseUrl}`;
    }
  }
  
  // Fallback solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  
  // En producción, lanzar error si no hay URL configurada
  throw new Error('NEXT_PUBLIC_BASE_URL o APP_URL debe estar configurado para Google OAuth');
}

const DEFAULT_DEVELOPMENT = 'bodasdehoy';

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

/**
 * Intercambiar Firebase ID Token por JWT de API2
 * ✅ MEJORADO: Si API2 falla, igual retorna success=true usando datos de Firebase
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
      // ⚠️ IMPORTANTE: Retornar éxito parcial pero SIN JWT
      // El usuario está autenticado con Firebase pero no podrá ejecutar mutations

      // ✅ Aún así guardar dev-user-config para que el usuario no vea el prompt de registro
      const devUserConfig = {
        developer: development,
        timestamp: Date.now(),
        token: null,
        userId: user?.email || user?.uid,
        user_type: 'registered',
      };
      localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));

      return {
        development,
        jwtError: 'No se pudo obtener token de escritura. Algunas funciones estarán limitadas.',
        success: true,
        user: user || undefined,
        user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.error('API2 returned success=false');
      // ⚠️ IMPORTANTE: Retornar éxito parcial pero SIN JWT

      // ✅ Aún así guardar dev-user-config para que el usuario no vea el prompt de registro
      const devUserConfig = {
        developer: development,
        timestamp: Date.now(),
        token: null,
        userId: user?.email || user?.uid,
        user_type: 'registered',
      };
      localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));

      return {
        development,
        jwtError: 'No se pudo obtener token de escritura. Algunas funciones estarán limitadas.',
        success: true,
        user: user || undefined,
        user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
      };
    }

    // Guardar JWT en localStorage
    localStorage.setItem('api2_jwt_token', data.token);
    localStorage.setItem('api2_jwt_expires_at', data.expiresAt || '');
    localStorage.setItem('current_development', data.development || development);

    // También guardar jwt_token para compatibilidad con getAuthToken()
    localStorage.setItem('jwt_token', data.token);

    // Cookie dedicada api2_jwt: el chat proxy la lee para Authorization header.
    // A diferencia de dev-user-config, ningún componente React la sobreescribe.
    if (typeof window !== 'undefined') {
      document.cookie = `api2_jwt=${encodeURIComponent(data.token)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }

    // Guardar dev-user-config para que EventosAutoAuth reconozca al usuario
    const devUserConfig = {
      developer: data.development || development,
      timestamp: Date.now(),
      token: data.token,
      userId: user?.email || user?.uid,
      user_type: 'registered',
    };
    localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));

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
      timestamp: Date.now(),
      token: null,
      userId: user?.email || user?.uid,
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
export const processGoogleRedirectResult = async (development: string = DEFAULT_DEVELOPMENT) => {
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult && redirectResult.providerId === 'google.com') {
      const savedDevelopment = safeGetSessionStorage('google_login_development') || development;
      safeRemoveSessionStorage('google_login_development');
      
      // ✅ Obtener URL de redirección guardada
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

  // ✅ ESTRATEGIA: Intentar popup primero (mejor UX), si falla usar redirect
  try {
    const result = await signInWithPopup(auth, provider);

    // Obtener Firebase ID Token
    const firebaseIdToken = await result.user.getIdToken();

    // Intercambiar por JWT de API2
    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (popupError: any) {
    // Si el popup fue bloqueado o cerrado, intentar con redirect
    const shouldTryRedirect = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/unauthorized-domain',
    ].includes(popupError.code);

    if (shouldTryRedirect) {
      try {
        // Guardar development para después del redirect
        safeSetSessionStorage('google_login_development', development);
        
        // Guardar URL actual para redirigir después del login
        if (typeof window !== 'undefined') {
          safeSetSessionStorage('google_login_redirect_url', window.location.href);
        }

        // Usar redirect (esto redirige la página, no retorna)
        await signInWithRedirect(auth, provider);
        
        // No retornamos aquí porque signInWithRedirect redirige la página
        // El resultado se procesará con processGoogleRedirectResult después del redirect
        return undefined;
      } catch (redirectError: any) {
        console.error('Google redirect fallback error:', redirectError);
        
        // Limpiar sessionStorage
        safeRemoveSessionStorage('google_login_development');
        safeRemoveSessionStorage('google_login_redirect_url');

        // Manejo de errores específicos
        if (redirectError.code === 'auth/unauthorized-domain') {
          const hostname = typeof window !== 'undefined' ? window.location.hostname : 'desconocido';
          throw new Error(`⚠️ El dominio "${hostname}" no está autorizado en Firebase. Contacta al administrador para agregarlo.`);
        }

        throw new Error(redirectError.message || 'Error al iniciar sesión con Google (redirect falló)');
      }
    }

    // Otros errores de popup - no reintentar con redirect
    console.error('Google popup login error:', popupError);

    switch (popupError.code) {
    case 'auth/popup-closed-by-user': {
      throw new Error('Has cerrado la ventana de login');
    }
    case 'auth/popup-blocked': {
      throw new Error('El navegador bloqueó la ventana emergente. Por favor, habilita popups para este sitio o intenta nuevamente.');
    }
    case 'auth/cancelled-popup-request': {
      throw new Error('Login cancelado');
    }
    case 'auth/unauthorized-domain': {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'desconocido';
      throw new Error(`⚠️ El dominio "${hostname}" no está autorizado en Firebase. Contacta al administrador.`);
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
