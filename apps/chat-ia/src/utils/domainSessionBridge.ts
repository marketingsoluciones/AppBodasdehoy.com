/**
 * Puente de sesión SSO: cookie `dev-user-config` → localStorage.
 *
 * P0 coherencia de sesión (QA 15-ago, 2 informes). Un usuario que llega por SSO
 * (primer load desde appEventos / pestaña nueva) trae la sesión en COOKIES del
 * dominio `.bodasdehoy.com`, pero localStorage está VACÍO (es por-origen). El
 * bootstrap de identidad (EventosAutoAuth) siembra `currentUserId`/perfil leyendo
 * `dev-user-config` de localStorage → en ese caso no encuentra nada y cae al camino
 * LENTO de validación contra backend. Durante esa ventana la app muestra "Visitante"
 * y gates de invitado en rutas clave (muy visible en el túnel real por la latencia;
 * casi invisible en localhost — por eso los repros locales no lo reproducían).
 *
 * Este puente copia la cookie a localStorage ANTES de que corra EventosAutoAuth, para
 * que tome el camino RÁPIDO (sembrar desde localStorage) y la identidad resuelva de
 * inmediato — cerrando la ventana de "Visitante" en el origen, para gates E identidad.
 *
 * Seguridad / no-regresión:
 *  - NO-OP si localStorage ya tiene la config (sesión caliente) → no toca lo que ya
 *    funciona.
 *  - NO-OP si no hay cookie (visitante real) → no inventa sesión.
 *  - La cookie la escribe el propio EventosAutoAuth (misma fuente, maxage 30d), y su
 *    validación posterior descarta tokens expirados igual que si vinieran de localStorage
 *    → 0 nueva superficie de confianza.
 */

let bridged = false;

function readCookie(name: string): string | null {
  try {
    const prefix = `${name}=`;
    const part = document.cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(prefix));
    return part ? part.slice(prefix.length) : null;
  } catch {
    return null;
  }
}

export function hydrateDomainConfigFromCookie(): void {
  if (typeof window === 'undefined' || bridged) return;
  try {
    const existing = localStorage.getItem('dev-user-config');
    if (existing && existing !== 'null' && existing !== 'undefined') {
      bridged = true; // ya hay sesión en localStorage → nada que sembrar
      return;
    }
    const raw = readCookie('dev-user-config');
    if (!raw) return; // sin cookie → visitante real, no tocar (reintenta en próximos renders)
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    const identity = parsed?.userId || parsed?.user_id || parsed?.email;
    if (!parsed || !identity) return; // cookie sin identidad → no sembrar
    localStorage.setItem('dev-user-config', decoded);
    // Sembrar también los tokens que algunos gates leen directo de localStorage
    // (hasLocalJwt, UserInfo.hasActiveSession, etc.).
    const token = parsed.token;
    if (token && typeof token === 'string' && token.length > 20) {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('mcp_jwt_token', token);
    }
    bridged = true;
  } catch {
    /* ante la duda NO sembramos (fail-safe hacia visitante) */
  }
}
