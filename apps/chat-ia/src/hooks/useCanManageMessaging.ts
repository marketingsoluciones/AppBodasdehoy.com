'use client';

import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';
// Import relativo a proposito: en vitest.config.mts el alias '@/utils' apunta al
// sub-paquete packages/utils, no a src/utils — con '@/utils/jwtRole' el test no resuelve.
import { canManageRole, getJwtRole } from '../utils/jwtRole';

/**
 * useCanManageMessaging — ¿este usuario gestiona canales/mensajería de la marca?
 *
 * Auditoría 15-09: los gates de N27/N29 llamaban a `canManageMessaging()` durante
 * el render. Eso traía tres problemas:
 *   1. leía `localStorage` en render → en SSR devuelve siempre 'user' y el cliente
 *      podía devolver otra cosa (mismatch de hidratación);
 *   2. no era reactivo: si el token/rol llegaba después, la UI se quedaba en el
 *      estado restringido hasta un re-render por otra causa;
 *   3. miraba solo el claim `role` del JWT, mientras el resto de la app (p. ej. el
 *      layout de /admin) resuelve el rol por `useChatStore(s => s.userRole)`, que es
 *      lo que devuelve el backend en el login. Si ese claim no existe, un operador
 *      real se queda sin acciones.
 *
 * Ahora manda el rol del store (fuente del backend) y el claim del JWT queda como
 * respaldo. El default sigue siendo restrictivo: sin rol conocido, no se gestiona.
 */
export function useCanManageMessaging(): boolean {
  const userRole = useChatStore((s) => s.userRole);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Primer render (y SSR) restrictivo y estable → sin mismatch de hidratación.
  if (!mounted) return false;
  return canManageRole(userRole) || canManageRole(getJwtRole());
}
