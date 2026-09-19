'use client';

import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';
// Import relativo a proposito: en vitest.config.mts el alias '@/utils' apunta al
// sub-paquete packages/utils, no a src/utils — con '@/utils/jwtRole' el test no resuelve.
import { canManageAnyRole, canManageRole, getJwtDevelopmentRoles } from '../utils/jwtRole';

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
 *
 * ── 17-09: se lee `developmentRoles`, NO `role` ──────────────────────────────────
 * El backend añadió el claim `developmentRoles`: los roles del usuario EN ESTA
 * MARCA (array, p. ej. ["empresa","editor","admin"]). Es el que hay que consultar
 * para "Gestionar canales".
 *
 * El claim `role` de al lado es el rol de PLATAFORMA y se deja de usar a propósito:
 * un usuario puede ser 'admin' de plataforma sin ser nada en esta marca, y leerlo
 * le daba administración de una marca ajena. Antes el gate dependía por completo de
 * ese claim — verificado en dev, el `userRole` del store llega `null`, así que `role`
 * era lo único que lo abría.
 */
export function useCanManageMessaging(): boolean {
  const userRole = useChatStore((s) => s.userRole);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Primer render (y SSR) restrictivo y estable → sin mismatch de hidratación.
  if (!mounted) return false;
  // Orden: roles de marca del JWT (fuente correcta) → rol del store (backend, hoy
  // suele venir null). El claim `role` YA NO cuenta.
  return canManageAnyRole(getJwtDevelopmentRoles()) || canManageRole(userRole);
}
