// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { canManageMessaging, getJwtRole } from './jwtRole';

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
