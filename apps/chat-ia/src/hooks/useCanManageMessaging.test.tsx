// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeState: { userRole?: string } = {};
vi.mock('@/store/chat', () => ({
  useChatStore: (selector: (s: any) => any) => selector(storeState),
}));

import { useCanManageMessaging } from './useCanManageMessaging';

/**
 * Auditoria 15-09: el gate leia el claim `role` del JWT en render. El resto de la
 * app resuelve el rol por el store (lo que devuelve el backend), asi que un
 * operador real se quedaba sin acciones. Aqui se fija la prioridad store > JWT
 * y el default restrictivo.
 */
describe('useCanManageMessaging', () => {
  beforeEach(() => {
    storeState.userRole = undefined;
    localStorage.clear();
  });

  it('sin rol conocido no gestiona (default restrictivo)', () => {
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(false);
  });

  it('gestiona cuando el rol del store lo permite (fuente del backend)', () => {
    storeState.userRole = 'admin';
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(true);
  });

  it('el rol de cliente del store no gestiona', () => {
    storeState.userRole = 'user';
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(false);
  });

  // ── 17-09: la fuente pasa a ser `developmentRoles`, no `role` ─────────────────
  const tokenCon = (payload: Record<string, unknown>) => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    localStorage.setItem('jwt_token', `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`);
  };

  it('abre con un rol de gestión en developmentRoles', () => {
    tokenCon({ developmentRoles: ['empresa', 'editor', 'admin'] });
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(true);
  });

  it('NO abre con el rol de plataforma: `role` ya no cuenta', () => {
    // Antes este caso devolvía true y era el bug: un 'admin' de PLATAFORMA obtenía
    // administración de una marca en la que no es nada. El backend añadió
    // `developmentRoles` justo para separar las dos cosas.
    tokenCon({ development: 'bodasdehoy', developmentRoles: [], role: 'admin' });
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(false);
  });

  it('no abre con roles de marca que no gestionan canales', () => {
    tokenCon({ developmentRoles: ['empresa', 'editor'] });
    const { result } = renderHook(() => useCanManageMessaging());
    expect(result.current).toBe(false);
  });
});
