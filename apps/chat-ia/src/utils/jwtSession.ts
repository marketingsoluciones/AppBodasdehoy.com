/**
 * Validación mínima de JWT para decidir si una sesión guardada en localStorage
 * puede restaurarse sin volver a autenticar.
 *
 * 🔒 SEGURIDAD: NO verifica la firma (eso es responsabilidad del backend en cada
 * request). Solo descarta tokens malformados o ya expirados, evitando que un
 * `dev-user-config` viejo o manipulado reviva una sesión inválida ("login fantasma").
 */

export const isLikelyJwt = (token: string): boolean => token.split('.').length === 3;

const base64UrlDecode = (segment: string): string => {
  const normalized = segment.replaceAll('-', '+').replaceAll('_', '/');
  if (typeof atob === 'function') return atob(normalized);
  // entorno node (tests/SSR)
  return Buffer.from(normalized, 'base64').toString('binary');
};

export const isJwtExpired = (token: string): boolean => {
  try {
    if (!isLikelyJwt(token)) return true;
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]));
    const exp = payload?.exp;
    if (!exp || typeof exp !== 'number') return false; // sin exp → no podemos afirmar que expiró
    return Date.now() >= exp * 1000;
  } catch {
    return true; // si no se puede decodificar, tratarlo como inválido
  }
};

/**
 * Un token sirve para restaurar sesión solo si es un JWT bien formado y no expirado.
 * (Un valor vacío / 'null' / 'undefined' no es restaurable.)
 */
export const isRestorableSessionToken = (token?: string | null): boolean => {
  if (!token || token === 'null' || token === 'undefined') return false;
  if (!isLikelyJwt(token)) return false;
  return !isJwtExpired(token);
};
