import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { auth } from '@/libs/firebase';

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
    console.warn('⚠️ No se encontró NEXT_PUBLIC_BASE_URL ni APP_URL, usando localhost (solo para desarrollo)');
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
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

  // Guardar info del usuario de Firebase primero (siempre disponible)
  if (user) {
    localStorage.setItem('user_email', user.email || '');
    localStorage.setItem('user_uid', user.uid);
    localStorage.setItem('user_display_name', user.displayName || '');
    localStorage.setItem('current_development', development);
    if (user.photoURL) {
      localStorage.setItem('user_photo_url', user.photoURL);
    }
    console.log('💾 Datos de Firebase guardados en localStorage');
  }

  try {
    console.log('🔄 [AUTH-DEBUG] Intercambiando Firebase token por JWT...');
    console.log('🔄 [AUTH-DEBUG] Backend URL:', BACKEND_URL);
    console.log('🔄 [AUTH-DEBUG] Development:', development);
    console.log('🔄 [AUTH-DEBUG] Firebase token (primeros 50 chars):', firebaseIdToken.slice(0, 50) + '...');

    const requestBody = {
      development,
      device: navigator.userAgent,
      fingerprint: generateFingerprint(),
      firebaseIdToken,
    };
    console.log('🔄 [AUTH-DEBUG] Request body (sin token):', { ...requestBody, firebaseIdToken: '[HIDDEN]' });

    const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    console.log('🔄 [AUTH-DEBUG] Response status:', response.status);
    console.log('🔄 [AUTH-DEBUG] Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      console.error('❌ [AUTH-DEBUG] API2 respondió con error:', errorData);
      console.error('❌ [AUTH-DEBUG] Status code:', response.status);
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
    console.log('🔄 [AUTH-DEBUG] Response data:', {
      errors: data.errors,
      expiresAt: data.expiresAt,
      hasToken: !!data.token,
      source: data.source,
      success: data.success,
      tokenLength: data.token?.length || 0,
    });

    if (!data.success) {
      console.error('❌ [AUTH-DEBUG] API retornó success=false:', data.errors);
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

    console.log('✅ [AUTH-DEBUG] JWT obtenido exitosamente!');
    console.log('✅ [AUTH-DEBUG] Token length:', data.token?.length);
    console.log('✅ [AUTH-DEBUG] Token source:', data.source || 'api2');
    console.log('✅ [AUTH-DEBUG] Expires at:', data.expiresAt);

    // Guardar JWT en localStorage
    console.log('💾 [AUTH-DEBUG] Guardando tokens en localStorage...');

    localStorage.setItem('api2_jwt_token', data.token);
    console.log('💾 [AUTH-DEBUG] api2_jwt_token guardado');

    localStorage.setItem('api2_jwt_expires_at', data.expiresAt || '');
    console.log('💾 [AUTH-DEBUG] api2_jwt_expires_at guardado');

    localStorage.setItem('current_development', data.development || development);
    console.log('💾 [AUTH-DEBUG] current_development guardado:', data.development || development);

    // ✅ También guardar jwt_token para compatibilidad con getAuthToken()
    localStorage.setItem('jwt_token', data.token);
    console.log('💾 [AUTH-DEBUG] jwt_token guardado (compatibilidad)');

    // ✅ CRÍTICO: Guardar dev-user-config para que EventosAutoAuth reconozca al usuario
    const devUserConfig = {
      developer: data.development || development,
      timestamp: Date.now(),
      token: data.token,
      userId: user?.email || user?.uid,
      user_type: 'registered',
    };
    localStorage.setItem('dev-user-config', JSON.stringify(devUserConfig));
    console.log('💾 [AUTH-DEBUG] dev-user-config guardado:', {
      developer: devUserConfig.developer,
      hasToken: !!devUserConfig.token,
      userId: devUserConfig.userId,
    });

    // ✅ Verificación final
    const savedToken = localStorage.getItem('api2_jwt_token');
    const savedJwtToken = localStorage.getItem('jwt_token');
    console.log('✅ [AUTH-DEBUG] Verificación final:');
    console.log('   - api2_jwt_token presente:', !!savedToken);
    console.log('   - jwt_token presente:', !!savedJwtToken);
    console.log('   - tokens coinciden:', savedToken === savedJwtToken);

    return {
      development: data.development,
      expiresAt: data.expiresAt,
      success: true,
      token: data.token,
      user: user || undefined,
      user_id: user?.email || user?.uid,  // ✅ CORRECCIÓN: Añadir user_id para compatibilidad
    };
  } catch (error: any) {
    console.error('❌ Error conectando a API2 para obtener JWT:', error.message);
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
      console.log('✅ Login con Google completado (redirect):', {
        email: redirectResult.user.email,
        uid: redirectResult.user.uid,
      });

      const savedDevelopment = safeGetSessionStorage('google_login_development') || development;
      safeRemoveSessionStorage('google_login_development');
      
      // ✅ Obtener URL de redirección guardada
      const redirectUrl = safeGetSessionStorage('google_login_redirect_url');
      safeRemoveSessionStorage('google_login_redirect_url');
      
      if (redirectUrl && typeof window !== 'undefined') {
        console.log('📍 Redirigiendo a:', redirectUrl);
        // La redirección se manejará en el componente que llama a esta función
      }

      const firebaseIdToken = await redirectResult.user.getIdToken();
      return await exchangeFirebaseTokenForJWT(firebaseIdToken, savedDevelopment, redirectResult.user);
    }
    return null;
  } catch (error: any) {
    console.error('❌ Error procesando redirect result de Google:', error);
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
    } catch (e) {
      console.warn('⚠️ No se pudo guardar en sessionStorage, usando localStorage como fallback:', e);
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
    } catch (e) {
      console.warn('⚠️ No se pudo leer de sessionStorage, usando localStorage como fallback:', e);
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
    console.log('🔐 Iniciando login con Google (popup)...');

    const result = await signInWithPopup(auth, provider);

    // Obtener Firebase ID Token
    const firebaseIdToken = await result.user.getIdToken();

    console.log('✅ Login con Google exitoso (popup):', {
      email: result.user.email,
      uid: result.user.uid,
    });

    // Intercambiar por JWT de API2
    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (popupError: any) {
    console.warn('⚠️ Popup falló, intentando con redirect...', popupError.code);

    // Si el popup fue bloqueado o cerrado, intentar con redirect
    const shouldTryRedirect = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/unauthorized-domain',
    ].includes(popupError.code);

    if (shouldTryRedirect) {
      try {
        console.log('🔄 Usando redirect como fallback...');
        
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
        console.error('❌ Error con redirect:', redirectError);
        
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
    console.error('❌ Error en login con Google (popup):', popupError);

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
      console.log('✅ Login con Facebook completado (redirect):', {
        email: redirectResult.user.email,
        uid: redirectResult.user.uid,
      });

      const savedDevelopment = safeGetSessionStorage('facebook_login_development') || development;
      safeRemoveSessionStorage('facebook_login_development');

      const firebaseIdToken = await redirectResult.user.getIdToken();
      return await exchangeFirebaseTokenForJWT(firebaseIdToken, savedDevelopment, redirectResult.user);
    }
    return null;
  } catch (error: any) {
    console.error('❌ Error procesando redirect result de Facebook:', error);
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

    console.log('🔐 Iniciando login con Facebook (popup)...');

    // ✅ FIX: Siempre usar popup - signInWithRedirect tiene problemas con sessionStorage
    const result = await signInWithPopup(auth, provider);

    // Obtener Firebase ID Token
    const firebaseIdToken = await result.user.getIdToken();

    console.log('✅ Login con Facebook exitoso:', {
      email: result.user.email,
      uid: result.user.uid,
    });

    // Intercambiar por JWT de API2
    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('❌ Error en login con Facebook:', error);

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
    console.log('🔐 Iniciando login con Email/Password...');

    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseIdToken = await result.user.getIdToken();

    console.log('✅ Login con Email/Password exitoso:', {
      email: result.user.email,
      uid: result.user.uid,
    });

    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('❌ Error en login con Email/Password:', error);

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
    console.log('🔐 Registrando usuario con Email/Password...');

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseIdToken = await result.user.getIdToken();

    console.log('✅ Registro exitoso:', {
      email: result.user.email,
      uid: result.user.uid,
    });

    return await exchangeFirebaseTokenForJWT(firebaseIdToken, development, result.user);
  } catch (error: any) {
    console.error('❌ Error en registro:', error);

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
 * Cerrar sesión
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);

    // Limpiar localStorage
    localStorage.removeItem('api2_jwt_token');
    localStorage.removeItem('api2_jwt_expires_at');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('dev-user-config');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_uid');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_photo_url');

    console.log('✅ Sesión cerrada');
  } catch (error: any) {
    console.error('❌ Error cerrando sesión:', error);
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
