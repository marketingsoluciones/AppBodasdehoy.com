/* eslint-disable no-var */
declare var process: { env: Record<string, string | undefined> };
import { developments } from '../types/developments';
/**
 * SessionBridge — SSO cross-domain entre apps del monorepo
 *
 * Problema:
 *   - appEventos login → setea sessionBodas + idTokenV0.1.0 con Domain=.bodasdehoy.com ✅
 *   - chat-ia login → solo setea localStorage (no cross-domain) ❌
 *   → El usuario que entra primero por chat.bodasdehoy.com tiene que volver a loguearse en app.bodasdehoy.com
 *
 * Solución:
 *   1. chat-ia llama setCrossAppIdToken(idToken) después de login → cookie idTokenV0.1.0 cross-domain
 *   2. appEventos AuthContext detecta la cookie → llama queries.auth(idToken) → sessionBodas
 *   → SSO bidireccional dentro de *.{tenant}.com — funciona para cualquier white-label sin cambios
 */

/**
 * Obtiene el dominio cross-subdomain correcto según el hostname actual.
 * Derivado dinámicamente — funciona para cualquier tenant sin whitelist.
 *
 * Ejemplos:
 *   chat-dev.bodasdehoy.com  → .bodasdehoy.com
 *   chat.vivetuboda.com      → .vivetuboda.com
 *   chat.nuevocliente.es     → .nuevocliente.es
 *   localhost                → "" (sin Domain, solo aplica a localhost)
 */
export const CROSS_APP_ID_TOKEN_COOKIE = 'idTokenV0.1.0';
export const CROSS_APP_DEVELOPMENT_COOKIE = 'current_development';
export const LOGOUT_TRANSITION_STORAGE_KEY = 'bdh:auth:logging-out-until';
const DEFAULT_LOGOUT_TRANSITION_MS = 15_000;

function getCrossAppDomain(): string {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname;

  // localhost / IP — no usar Domain
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return '';

  const parts = hostname.split('.');
  // Necesita al menos subdominio.dominio.tld
  if (parts.length < 2) return '';

  // Derivar root domain: últimos 2 segmentos → .dominio.tld
  return '.' + parts.slice(-2).join('.');
}

/**
 * Setea la cookie idTokenV0.1.0 con dominio cross-app (.bodasdehoy.com)
 * para que appEventos pueda detectar la sesión iniciada desde chat-ia.
 *
 * Llamar después de cualquier login en chat-ia.
 *
 * @param idToken — Firebase ID token (válido ~1h, appEventos lo usa para crear sessionBodas)
 */
export function setCrossAppIdToken(idToken: string): void {
  if (typeof document === 'undefined' || !idToken) return;

  clearLogoutTransition();
  writeCookie(CROSS_APP_ID_TOKEN_COOKIE, idToken, {
    domain: getCrossAppDomain(),
    maxAge: 30 * 24 * 3600,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SessionBridge] ${CROSS_APP_ID_TOKEN_COOKIE} seteado con Domain=${getCrossAppDomain() || 'local'}`);
  }
}

/**
 * Setea la cookie current_development con dominio cross-app (.bodasdehoy.com) para
 * que app-dev ↔ chat-dev compartan el whitelabel activo. localStorage no cruza
 * subdominios; esta cookie sí. Llamar siempre que se persista current_development.
 */
export function setCrossAppDevelopment(development: string): void {
  if (typeof document === 'undefined' || !development) return;

  writeCookie(CROSS_APP_DEVELOPMENT_COOKIE, encodeURIComponent(development), {
    domain: getCrossAppDomain(),
    maxAge: 30 * 24 * 3600,
  });
}

/**
 * Limpia las cookies cross-app en logout.
 */
export function clearCrossAppSession(): void {
  if (typeof document === 'undefined') return;

  const domain = getCrossAppDomain();
  const cookieNames = new Set<string>([
    CROSS_APP_ID_TOKEN_COOKIE,
    CROSS_APP_DEVELOPMENT_COOKIE,
    ...developments.flatMap((development) =>
      [development.cookie, development.cookieGuest].filter((value): value is string => Boolean(value))
    ),
  ]);

  for (const cookieName of cookieNames) {
    expireCookie(cookieName);
    if (domain) {
      expireCookie(cookieName, { domain });
    }
  }
}

export function beginLogoutTransition(durationMs = DEFAULT_LOGOUT_TRANSITION_MS): number | null {
  if (typeof window === 'undefined') return null;
  const expiresAt = Date.now() + durationMs;
  localStorage.setItem(LOGOUT_TRANSITION_STORAGE_KEY, String(expiresAt));
  return expiresAt;
}

export function clearLogoutTransition(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGOUT_TRANSITION_STORAGE_KEY);
}

export function isLogoutTransitionActive(now = Date.now()): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(LOGOUT_TRANSITION_STORAGE_KEY);
  if (!raw) return false;
  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    localStorage.removeItem(LOGOUT_TRANSITION_STORAGE_KEY);
    return false;
  }
  return true;
}

export function isTokenExpiringSoon(token: string | null | undefined, refreshWindowMs = 5 * 60 * 1000): boolean {
  const expiresAt = getTokenExpiryMs(token);
  if (!expiresAt) return true;
  return expiresAt - Date.now() <= refreshWindowMs;
}

export async function getFreshIdToken(options: {
  currentToken?: string | null;
  getToken?: (() => Promise<string | null | undefined>) | null;
  refreshWindowMs?: number;
}): Promise<string | null> {
  const {
    currentToken = null,
    getToken,
    refreshWindowMs = 5 * 60 * 1000,
  } = options;

  const needsRefresh = !currentToken || isTokenExpiringSoon(currentToken, refreshWindowMs);

  if (needsRefresh) {
    if (!getToken) {
      return null;
    }
    const freshToken = await getToken?.();
    if (freshToken) {
      setCrossAppIdToken(freshToken);
      return freshToken;
    }
    return null;
  }

  return currentToken || null;
}

function getTokenExpiryMs(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const payload = parseJwtPayload(token);
    if (!payload?.exp || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const [, payloadSegment] = token.split('.');
  if (!payloadSegment) return null;

  try {
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((character) => `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function writeCookie(
  name: string,
  value: string,
  options: {
    domain?: string;
    maxAge?: number;
  } = {}
): void {
  if (typeof document === 'undefined') return;

  const parts = [
    `${name}=${value}`,
    'path=/',
    `max-age=${options.maxAge ?? 30 * 24 * 3600}`,
    'SameSite=Lax',
  ];

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = parts.join('; ');
}

function expireCookie(name: string, options: { domain?: string } = {}): void {
  if (typeof document === 'undefined') return;

  const parts = [
    `${name}=`,
    'path=/',
    'max-age=0',
    'SameSite=Lax',
  ];

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = parts.join('; ');
}
