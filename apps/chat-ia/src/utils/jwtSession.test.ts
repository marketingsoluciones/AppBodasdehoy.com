import { describe, expect, it } from 'vitest';

import { isJwtExpired, isLikelyJwt, isRestorableSessionToken } from './jwtSession';

// Helper para fabricar un JWT (sin firma real) con el payload dado.
const makeJwt = (payload: Record<string, unknown>): string => {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
};

const NOW_SEC = Math.floor(Date.now() / 1000);

describe('isLikelyJwt', () => {
  it('acepta strings con 3 segmentos', () => {
    expect(isLikelyJwt('a.b.c')).toBe(true);
  });
  it('rechaza strings sin 3 segmentos', () => {
    expect(isLikelyJwt('a.b')).toBe(false);
    expect(isLikelyJwt('noseparators')).toBe(false);
  });
});

describe('isJwtExpired', () => {
  it('token con exp futuro NO está expirado', () => {
    expect(isJwtExpired(makeJwt({ exp: NOW_SEC + 3600 }))).toBe(false);
  });
  it('token con exp pasado SÍ está expirado', () => {
    expect(isJwtExpired(makeJwt({ exp: NOW_SEC - 3600 }))).toBe(true);
  });
  it('token sin exp no se considera expirado (no podemos afirmarlo)', () => {
    expect(isJwtExpired(makeJwt({ uid: 'x' }))).toBe(false);
  });
  it('token malformado se trata como expirado/inválido', () => {
    expect(isJwtExpired('no-es-jwt')).toBe(true);
    expect(isJwtExpired('a.b.c')).toBe(true); // payload no decodificable
  });
});

describe('isRestorableSessionToken', () => {
  it('restaura un JWT válido y no expirado', () => {
    expect(isRestorableSessionToken(makeJwt({ exp: NOW_SEC + 3600, uid: 'u1' }))).toBe(true);
  });

  it('NO restaura un JWT expirado (residuo viejo)', () => {
    expect(isRestorableSessionToken(makeJwt({ exp: NOW_SEC - 1, uid: 'u1' }))).toBe(false);
  });

  it('NO restaura valores vacíos / placeholder', () => {
    expect(isRestorableSessionToken(undefined)).toBe(false);
    expect(isRestorableSessionToken(null)).toBe(false);
    expect(isRestorableSessionToken('')).toBe(false);
    expect(isRestorableSessionToken('null')).toBe(false);
    expect(isRestorableSessionToken('undefined')).toBe(false);
  });

  it('NO restaura strings que no son JWT', () => {
    expect(isRestorableSessionToken('cualquier-cosa')).toBe(false);
  });

  it('restaura JWT sin exp (sesión legítima sin caducidad declarada)', () => {
    expect(isRestorableSessionToken(makeJwt({ uid: 'u1' }))).toBe(true);
  });
});
