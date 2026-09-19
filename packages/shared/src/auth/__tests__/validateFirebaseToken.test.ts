import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mockear jose para no hacer verificación criptográfica real contra JWKS.
const jwtVerify = vi.fn();
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: (...args: any[]) => jwtVerify(...args),
}));

import { validateFirebaseToken } from '../AuthBridge';

const OLD_ENV = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

beforeEach(() => {
  jwtVerify.mockReset();
});
afterEach(() => {
  if (OLD_ENV === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = OLD_ENV;
});

describe('validateFirebaseToken — multi-tenant (GAP 5)', () => {
  it('usa el projectId PASADO como argumento para el issuer (per-tenant)', async () => {
    jwtVerify.mockResolvedValue({ payload: { sub: 'u1', exp: 9_999_999_999 } });
    const p = await validateFirebaseToken('tok', 'tenant-A-123');
    expect(p).toMatchObject({ sub: 'u1' });
    expect(jwtVerify).toHaveBeenCalledWith(
      'tok',
      'mock-jwks',
      expect.objectContaining({
        issuer: 'https://securetoken.google.com/tenant-A-123',
        algorithms: ['RS256'],
      }),
    );
  });

  it('cae al env NEXT_PUBLIC_FIREBASE_PROJECT_ID si no se pasa projectId', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'env-proj';
    jwtVerify.mockResolvedValue({ payload: { sub: 'u2', exp: 9_999_999_999 } });
    await validateFirebaseToken('tok');
    expect(jwtVerify).toHaveBeenCalledWith(
      'tok',
      'mock-jwks',
      expect.objectContaining({ issuer: 'https://securetoken.google.com/env-proj' }),
    );
  });

  it('fail-closed: sin projectId ni env → throw (no valida contra proyecto obsoleto)', async () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    await expect(validateFirebaseToken('tok')).rejects.toThrow(/projectId/);
  });

  it('token vacío → null sin llamar a jwtVerify', async () => {
    const p = await validateFirebaseToken('');
    expect(p).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it('token inválido (jwtVerify lanza) → null', async () => {
    jwtVerify.mockRejectedValue(new Error('bad signature'));
    const p = await validateFirebaseToken('tok', 'proj');
    expect(p).toBeNull();
  });

  it('token caducado (exp en el pasado) → null', async () => {
    jwtVerify.mockResolvedValue({ payload: { sub: 'u3', exp: 1 } });
    const p = await validateFirebaseToken('tok', 'proj');
    expect(p).toBeNull();
  });
});
