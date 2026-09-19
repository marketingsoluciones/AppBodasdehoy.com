/* eslint-disable no-var */
declare var window: any;
/**
 * SessionManager — renovación CENTRAL y PROACTIVA del ID token de Firebase.
 *
 * Problema (auditoría auth 28-jul, fallback FB-2): el token de Firebase vive 1 h pero
 * la cookie SSO `idTokenV0.1.0` vive 30 días, y HOY solo appEventos la refresca
 * (SocketContext.onIdTokenChanged), con pestaña abierta y si `securetoken` responde.
 * Cuando cualquier eslabón cae, la cookie sirve un token muerto hasta 30 días → sesión
 * "muerta" en silencio en el resto de apps (chat-ia/memories/editor solo LEEN la cookie).
 *
 * Solución: una primitiva compartida que CUALQUIER app arranca una vez. Mantiene la cookie
 * cross-app al día por dos vías redundantes:
 *   1. `onIdTokenChanged` — Firebase rota el token (~1 h) → reescribimos la cookie.
 *   2. timer proactivo — fuerza `getIdToken(true)` ~10 min antes de expirar, por si la
 *      pestaña estuvo en background y el SDK no rotó.
 * Y `getFreshToken()` para el patrón "nunca enviar un token caducado": pídelo justo antes
 * de llamar al backend (Firebase auto-refresca si está por expirar).
 *
 * No importa `firebase/auth` (para no atar el paquete shared a una versión); recibe una
 * instancia con la forma mínima que usamos. Sin fallback silencioso: si el refresco falla,
 * se reporta por consola y NO se rompe el hilo (el backend rechazará y la UI podrá escalar).
 */
import { clearCrossAppIdToken, setCrossAppIdToken } from './SessionBridge';

/** Lee una cookie por nombre (cliente). null si no existe. */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const m = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

/** true si el JWT está caducado o es ilegible. Sin verificar firma (solo `exp`). */
function isExpiredJwt(token: string): boolean {
  try {
    const seg = token.split('.')[1];
    if (!seg) return true;
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(json);
    return typeof payload.exp === 'number' ? payload.exp < Date.now() / 1000 : false;
  } catch {
    return true;
  }
}

export interface FirebaseUserLike {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

export interface FirebaseAuthLike {
  currentUser: FirebaseUserLike | null;
  onIdTokenChanged: (cb: (user: FirebaseUserLike | null) => void) => () => void;
}

// Token de Firebase: 60 min. Refrescamos ~10 min antes → ventana de 50 min.
const PROACTIVE_REFRESH_MS = 50 * 60 * 1000;

let _timer: ReturnType<typeof setInterval> | null = null;
let _unsub: (() => void) | null = null;

/**
 * Arranca la renovación central. Idempotente por app (llamar una vez; re-llamar
 * reinicia limpio). Devuelve un `stop()` para desmontar.
 */
export function startSessionRefresh(auth: FirebaseAuthLike): () => void {
  if (typeof window === 'undefined' || !auth) return () => undefined;

  stopSessionRefresh();

  // 1) Rotación natural del SDK → mantener la cookie cross-app al día.
  _unsub = auth.onIdTokenChanged(async (user) => {
    if (!user) {
      // AUTO-SANADO (incidente 17-19 jul): sin usuario Firebase pero con cookie SSO que trae
      // un token CADUCADO → el navegador seguiría enviando un token muerto hasta 30 días
      // ("sesión muerta" que obligaba a incógnito). La limpiamos para no servir el token
      // muerto; el próximo login la vuelve a escribir fresca. Solo si está caducada (no si
      // falta ni si es válida).
      const stale = readCookie('idTokenV0.1.0');
      if (stale && isExpiredJwt(stale)) {
        clearCrossAppIdToken();
        console.warn('[SessionManager] cookie SSO con token caducado y sin usuario → limpiada (auto-sanado)');
      }
      return;
    }
    try {
      const token = await user.getIdToken();
      if (token) setCrossAppIdToken(token);
    } catch (e) {
      console.warn('[SessionManager] onIdTokenChanged: no se pudo refrescar la cookie SSO:', e);
    }
  });

  // 2) Refresco proactivo forzado (cubre pestañas en background donde el SDK no rota).
  _timer = setInterval(async () => {
    const u = auth.currentUser;
    if (!u) return;
    try {
      const token = await u.getIdToken(true);
      if (token) setCrossAppIdToken(token);
    } catch (e) {
      console.warn('[SessionManager] refresco proactivo falló (securetoken?):', e);
    }
  }, PROACTIVE_REFRESH_MS);

  return stopSessionRefresh;
}

export function stopSessionRefresh(): void {
  if (_unsub) {
    try {
      _unsub();
    } catch {
      /* noop */
    }
    _unsub = null;
  }
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

/**
 * Token de Firebase SIEMPRE fresco: `getIdToken()` auto-refresca si está por expirar.
 * Devuelve null si no hay sesión. De paso, mantiene la cookie SSO al día. Úsalo justo
 * antes de cualquier llamada al backend para no enviar nunca un token caducado.
 */
export async function getFreshToken(auth: FirebaseAuthLike): Promise<string | null> {
  if (typeof window === 'undefined' || !auth?.currentUser) return null;
  try {
    const token = await auth.currentUser.getIdToken();
    if (token) setCrossAppIdToken(token);
    return token || null;
  } catch (e) {
    console.warn('[SessionManager] getFreshToken falló:', e);
    return null;
  }
}
