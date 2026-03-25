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
 *   → SSO bidireccional dentro de *.bodasdehoy.com
 */

/**
 * Obtiene el dominio cross-subdomain correcto según el entorno.
 * Ejemplos:
 *   chat-test.bodasdehoy.com → .bodasdehoy.com
 *   app.vivetuboda.com       → .vivetuboda.com
 *   localhost                → "" (sin Domain, solo aplica a localhost)
 */
// Whitelist of known root domains for cross-subdomain cookies
const KNOWN_DOMAINS = ['.bodasdehoy.com', '.vivetuboda.com', '.eventosorganizador.com'];

function getCrossAppDomain(): string {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname;

  // localhost — no usar Domain (causaría que la cookie no se establezca)
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '';

  // Only set cross-domain cookies for whitelisted domains
  for (const domain of KNOWN_DOMAINS) {
    if (hostname.endsWith(domain.slice(1))) return domain;
  }

  // Unknown domain — don't share cookies
  return '';
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
