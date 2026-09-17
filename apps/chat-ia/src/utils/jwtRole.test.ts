// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  canManageAnyRole,
  canManageMessaging,
  canManageRole,
  getJwtDevelopmentRoles,
  getJwtRole,
} from './jwtRole';

/**
 * Auditoria QA 14-09 (N27/N29): gates visuales por rol del JWT.
 * Default restrictivo: sin token o sin claim role -> 'user' -> no gestiona.
 */

const b64 = (obj: object) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const makeJwt = (payload: object) => `h.${b64(payload)}.s`;

afterEach(() => localStorage.clear());

describe('jwtRole (N27/N29)', () => {
  it('sin token -> rol user restrictivo', () => {
    expect(getJwtRole()).toBe('user');
    expect(canManageMessaging()).toBe(false);
  });

  it('token corrupto -> rol user restrictivo', () => {
    localStorage.setItem('jwt_token', 'not-a-jwt');
    expect(getJwtRole()).toBe('user');
    expect(canManageMessaging()).toBe(false);
  });

  it('role user -> no gestiona mensajeria', () => {
    localStorage.setItem('jwt_token', makeJwt({ role: 'user' }));
    expect(canManageMessaging()).toBe(false);
  });

  it('role agent/admin/support/superadmin -> gestiona', () => {
    for (const role of ['agent', 'admin', 'support', 'superadmin']) {
      localStorage.setItem('jwt_token', makeJwt({ role }));
      expect(canManageMessaging()).toBe(true);
    }
  });

  it('lee tambien de mcp_jwt_token como fallback', () => {
    localStorage.setItem('mcp_jwt_token', makeJwt({ role: 'admin' }));
    expect(canManageMessaging()).toBe(true);
  });
});
describe('empresa gestiona canales (decision JCP 17-09)', () => {
  it('empresa abre la gestion de canales', () => {
    // Es el rol REAL de los usuarios de marca: el JWT vivo de bodasdehoy trae
    // developmentRoles ["empresa","editor","admin"]. Sin esto, un cliente no podia
    // conectar su propio WhatsApp y tenia que pedirlo a soporte.
    expect(canManageRole('empresa')).toBe(true);
    expect(canManageAnyRole(['empresa', 'editor'])).toBe(true);
  });

  it('editor por si solo NO gestiona canales', () => {
    // Edita contenido; configurar canales de envio es otra cosa. Si alguien mete
    // 'editor' en la lista, este test lo dice.
    expect(canManageRole('editor')).toBe(false);
    expect(canManageAnyRole(['editor'])).toBe(false);
  });

  it('el default sigue siendo restrictivo para lo demas', () => {
    expect(canManageAnyRole(['user', 'guest', 'invitado'])).toBe(false);
    expect(canManageAnyRole([])).toBe(false);
  });
});

describe('canManageRole — regla de rol aislada (auditoria 15-09)', () => {
  it('acepta los roles que gestionan mensajeria', () => {
    for (const role of ['agent', 'admin', 'support', 'superadmin']) {
      expect(canManageRole(role)).toBe(true);
    }
  });

  it('rechaza rol desconocido, vacio o ausente (default restrictivo)', () => {
    expect(canManageRole('user')).toBe(false);
    expect(canManageRole('guest')).toBe(false);
    expect(canManageRole('')).toBe(false);
    expect(canManageRole(undefined)).toBe(false);
    expect(canManageRole(null)).toBe(false);
  });
});

describe('developmentRoles — el claim de marca (backend 17-09)', () => {
  const jwt = (payload: Record<string, any>) => {
    const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url');
    return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.firma`;
  };
  const conToken = (payload: Record<string, any>) => {
    localStorage.setItem('jwt_token', jwt(payload));
  };

  beforeEach(() => localStorage.clear());

  it('lee el array tal como lo manda el backend', () => {
    // Forma verificada contra un JWT vivo en dev.
    conToken({ developmentRoles: ['empresa', 'editor', 'admin'], role: 'admin' });
    expect(getJwtDevelopmentRoles()).toEqual(['empresa', 'editor', 'admin']);
  });

  it('tolera que llegue como string separado por comas', () => {
    conToken({ developmentRoles: 'editor, admin' });
    expect(getJwtDevelopmentRoles()).toEqual(['editor', 'admin']);
  });

  it('sin el claim devuelve lista vacía, no adivina', () => {
    conToken({ role: 'admin' });
    expect(getJwtDevelopmentRoles()).toEqual([]);
  });

  it('descarta entradas que no son texto', () => {
    conToken({ developmentRoles: ['admin', 42, null, 'editor'] });
    expect(getJwtDevelopmentRoles()).toEqual(['admin', 'editor']);
  });

  it('canManageAnyRole abre con un rol de gestión y cierra sin ninguno', () => {
    expect(canManageAnyRole(['empresa', 'editor', 'admin'])).toBe(true);
    expect(canManageAnyRole(['agent'])).toBe(true);
    // CAMBIO DE POLÍTICA (JCP, 17-09): esta línea afirmaba `false`. Se decidió que
    // `empresa` gestione canales, porque es el rol que de verdad tienen los usuarios
    // de marca y sin él un cliente no podía conectar su propio WhatsApp.
    // El test hizo su trabajo: al cambiar la lista falló aquí y obligó a declarar el
    // cambio en vez de dejarlo pasar de tapadillo.
    expect(canManageAnyRole(['empresa', 'editor'])).toBe(true);
    expect(canManageAnyRole(['editor'])).toBe(false);
    expect(canManageAnyRole([])).toBe(false);
    expect(canManageAnyRole(undefined)).toBe(false);
  });

  it('el rol de PLATAFORMA no abre la gestión de marca', () => {
    // Lo esencial del cambio: 'admin' de plataforma sin roles en la marca NO gestiona.
    conToken({ development: 'bodasdehoy', developmentRoles: [], role: 'admin' });
    expect(canManageAnyRole(getJwtDevelopmentRoles())).toBe(false);
  });
});
