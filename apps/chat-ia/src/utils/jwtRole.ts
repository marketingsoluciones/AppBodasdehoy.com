/**
 * getJwtRole — lee el claim `role` del JWT de sesión (jwt_token en localStorage).
 *
 * Uso: gates VISUALES en el front (defensa en profundidad). La autorización
 * real SIEMPRE es server-side; esto solo evita mostrar acciones que el
 * backend debe (y a veces aún no) rechaza.
 *
 * Auditoría QA 14-09 (N27/N29): el JWT de API2 incluye `role` (`user`,
 * `agent`, `admin`…). Si no hay token o no se puede decodificar, se asume
 * el rol más restrictivo ('user') para NO mostrar acciones sensibles.
 */

export type JwtRole = string;

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const seg = token.split('.')[1];
    if (!seg) return null;
    const padded = seg.padEnd(seg.length + ((4 - (seg.length % 4)) % 4), '=');
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** Devuelve el rol del JWT de sesión, o 'user' si no es determinable. */
export function getJwtRole(): JwtRole {
  if (typeof window === 'undefined') return 'user';
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('mcp_jwt_token');
  if (!token) return 'user';
  const payload = decodeJwtPayload(token);
  return payload?.role || 'user';
}

/** Roles que pueden gestionar canales/mensajería de la marca. */
export const MESSAGING_MANAGER_ROLES = ['agent', 'admin', 'support', 'superadmin'];

/** Regla de rol, aislada para poder aplicarla a cualquier fuente (store o JWT). */
export function canManageRole(role?: string | null): boolean {
  return !!role && MESSAGING_MANAGER_ROLES.includes(role);
}

/**
 * true solo para roles que gestionan canales/mensajería de la marca.
 *
 * Preferir el hook `useCanManageMessaging()`: esta versión lee localStorage en
 * render (no reactiva, y en SSR siempre 'user') y solo mira el claim del JWT.
 */
export function canManageMessaging(): boolean {
  return canManageRole(getJwtRole());
}
