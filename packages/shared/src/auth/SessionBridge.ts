/* eslint-disable no-var */
declare var process: { env: Record<string, string | undefined> };
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

  const domain = getCrossAppDomain();
  const maxAge = 7 * 24 * 3600; // 7 días — el contenido se renueva via onIdTokenChanged

  const cookieParts = [
    `idTokenV0.1.0=${idToken}`,
    'path=/',
    `max-age=${maxAge}`,
    'SameSite=Lax',
  ];

  if (domain) {
    cookieParts.push(`Domain=${domain}`);
  }

  // HTTPS: Secure para que la cookie se envíe al volver a app-test/app
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieParts.push('Secure');
  }

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = cookieParts.join('; ');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SessionBridge] idTokenV0.1.0 seteado con Domain=${domain || 'local'}`);
  }
}

/**
 * Limpia las cookies cross-app en logout.
 */
export function clearCrossAppSession(): void {
  if (typeof document === 'undefined') return;

  const domain = getCrossAppDomain();
  const expiredParts = [
    'idTokenV0.1.0=',
    'path=/',
    'max-age=0',
    'SameSite=Lax',
  ];

  if (domain) {
    expiredParts.push(`Domain=${domain}`);
  }

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = expiredParts.join('; ');
}
