'use client';

type NormalizedHeaders = Record<string, string>;
type HeadersInput = Headers | Array<[string, string]> | Record<string, string>;

// Flag para evitar logs repetitivos
let lastLogTime = 0;
const LOG_THROTTLE_MS = 5000; // Solo loguear cada 5 segundos

const shouldLog = () => {
  const now = Date.now();
  if (now - lastLogTime > LOG_THROTTLE_MS) {
    lastLogTime = now;
    return true;
  }
  return false;
};

const normalizeHeaders = (headers?: HeadersInput): NormalizedHeaders => {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const normalized: NormalizedHeaders = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<NormalizedHeaders>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return { ...headers };
};

const readTokenFromDevConfig = () => {
  try {
    const rawConfig = localStorage.getItem('dev-user-config');
    if (!rawConfig) {
      if (shouldLog()) console.log('🔍 [TOKEN-DEBUG] dev-user-config: NO EXISTE');
      return undefined;
    }
    const parsed = JSON.parse(rawConfig);
    const token = parsed?.token;
    if (shouldLog()) {
      console.log('🔍 [TOKEN-DEBUG] dev-user-config encontrado:', {
        developer: parsed?.developer,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        userId: parsed?.userId,
      });
    }
    return typeof token === 'string' && token ? token : undefined;
  } catch (e) {
    console.error('❌ [TOKEN-DEBUG] Error leyendo dev-user-config:', e);
    return undefined;
  }
};

export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const doLog = shouldLog();

  if (doLog) {
    console.log('🔍 [TOKEN-DEBUG] === Buscando token JWT ===');
  }

  // 1. Primero buscar jwt_token (login directo API2)
  const directToken = localStorage.getItem('jwt_token');
  if (doLog) {
    console.log('🔍 [TOKEN-DEBUG] jwt_token:', directToken ? `presente (${directToken.length} chars)` : 'NO EXISTE');
  }
  if (directToken && directToken !== 'null' && directToken !== 'undefined') {
    if (doLog) console.log('✅ [TOKEN-DEBUG] Usando jwt_token');
    return directToken;
  }

  // 2. Buscar api2_jwt_token (login con Firebase Auth)
  const firebaseToken = localStorage.getItem('api2_jwt_token');
  if (doLog) {
    console.log('🔍 [TOKEN-DEBUG] api2_jwt_token:', firebaseToken ? `presente (${firebaseToken.length} chars)` : 'NO EXISTE');
  }
  if (firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined') {
    if (doLog) console.log('✅ [TOKEN-DEBUG] Usando api2_jwt_token');
    return firebaseToken;
  }

  // 3. Fallback: buscar en dev-user-config
  const devToken = readTokenFromDevConfig();
  if (devToken) {
    if (doLog) console.log('✅ [TOKEN-DEBUG] Usando token de dev-user-config');
    return devToken;
  }

  if (doLog) {
    console.warn('⚠️ [TOKEN-DEBUG] NO SE ENCONTRÓ NINGÚN TOKEN');
    console.log('🔍 [TOKEN-DEBUG] Estado localStorage:');
    console.log('   - jwt_token:', localStorage.getItem('jwt_token'));
    console.log('   - api2_jwt_token:', localStorage.getItem('api2_jwt_token'));
    console.log('   - dev-user-config:', localStorage.getItem('dev-user-config')?.slice(0, 100));
    console.log('   - user_email:', localStorage.getItem('user_email'));
  }

  return undefined;
};

/**
 * ✅ NUEVO: Función de debug para verificar estado de autenticación
 * Llamar desde la consola: window.debugAuthState()
 */
export const debugAuthState = () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    DEBUG AUTH STATE                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const jwtToken = localStorage.getItem('jwt_token');
  const api2Token = localStorage.getItem('api2_jwt_token');
  const devConfig = localStorage.getItem('dev-user-config');
  const userEmail = localStorage.getItem('user_email');
  const currentDev = localStorage.getItem('current_development');

  console.log('\n📦 Tokens en localStorage:');
  console.log('  jwt_token:', jwtToken ? `✅ (${jwtToken.length} chars)` : '❌ NO EXISTE');
  console.log('  api2_jwt_token:', api2Token ? `✅ (${api2Token.length} chars)` : '❌ NO EXISTE');

  if (devConfig) {
    try {
      const parsed = JSON.parse(devConfig);
      console.log('\n📋 dev-user-config:');
      console.log('  userId:', parsed.userId || '❌');
      console.log('  developer:', parsed.developer || '❌');
      console.log('  token:', parsed.token ? `✅ (${parsed.token.length} chars)` : '❌ NO EXISTE');
      console.log('  user_type:', parsed.user_type || '❌');
      console.log('  timestamp:', parsed.timestamp ? new Date(parsed.timestamp).toISOString() : '❌');
    } catch {
      console.log('\n📋 dev-user-config: ❌ Error parseando JSON');
    }
  } else {
    console.log('\n📋 dev-user-config: ❌ NO EXISTE');
  }

  console.log('\n👤 Info de usuario:');
  console.log('  user_email:', userEmail || '❌');
  console.log('  current_development:', currentDev || '❌');

  const finalToken = getAuthToken();
  console.log('\n🎯 Token final (getAuthToken):', finalToken ? `✅ (${finalToken.length} chars)` : '❌ NINGUNO');

  return {
    api2Token: !!api2Token,
    devConfigToken: !!devConfig,
    finalToken: !!finalToken,
    jwtToken: !!jwtToken,
    userEmail,
  };
};

// Exponer función de debug globalmente
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
}

export const buildAuthHeaders = (headers?: HeadersInput): NormalizedHeaders => {
  const normalizedHeaders = normalizeHeaders(headers);
  const token = getAuthToken();

  if (token) {
    normalizedHeaders.Authorization = `Bearer ${token}`;
  }

  return normalizedHeaders;
};


