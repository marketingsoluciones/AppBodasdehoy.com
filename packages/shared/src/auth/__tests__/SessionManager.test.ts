import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Aislar SessionManager de la escritura real de cookie.
vi.mock('../SessionBridge', () => ({
  setCrossAppIdToken: vi.fn(),
  clearCrossAppIdToken: vi.fn(),
}));

import { setCrossAppIdToken, clearCrossAppIdToken } from '../SessionBridge';
import { startSessionRefresh, stopSessionRefresh, getFreshToken } from '../SessionManager';

const mockSet = setCrossAppIdToken as unknown as ReturnType<typeof vi.fn>;
const mockClear = clearCrossAppIdToken as unknown as ReturnType<typeof vi.fn>;

// JWTs de prueba (sin firma real; solo el payload importa para isExpiredJwt).
const b64url = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwtWithExp = (expSec: number) => `eyJhbGciOiJSUzI1NiJ9.${b64url({ exp: expSec })}.sig`;
const EXPIRED_JWT = jwtWithExp(1); // exp en 1970 → caducado
const VALID_JWT = jwtWithExp(9_999_999_999); // exp lejano → válido

// Mock mínimo con la forma FirebaseAuthLike que usa SessionManager.
function makeAuth(token: string | null) {
  const user = token ? { getIdToken: vi.fn(async (_force?: boolean) => token) } : null;
  const auth: any = {
    currentUser: user,
    _cb: null as null | ((u: any) => void),
    onIdTokenChanged: vi.fn((cb: (u: any) => void) => {
      auth._cb = cb;
      return vi.fn(); // función de desuscripción
    }),
  };
  return auth;
}

beforeEach(() => {
  (globalThis as any).window = (globalThis as any).window || {};
  mockSet.mockClear();
  mockClear.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  stopSessionRefresh();
  delete (globalThis as any).document;
  vi.useRealTimers();
});

describe('SessionManager — refresco central del token cross-app', () => {
  it('getFreshToken devuelve el token y mantiene la cookie SSO al día', async () => {
    const auth = makeAuth('tok-123');
    const t = await getFreshToken(auth);
    expect(t).toBe('tok-123');
    expect(auth.currentUser.getIdToken).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith('tok-123');
  });

  it('getFreshToken devuelve null si no hay sesión (no escribe cookie)', async () => {
    const auth = makeAuth(null);
    const t = await getFreshToken(auth);
    expect(t).toBeNull();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('startSessionRefresh se suscribe a onIdTokenChanged y refresca la cookie al rotar el SDK', async () => {
    const auth = makeAuth('tok-A');
    const stop = startSessionRefresh(auth);
    expect(auth.onIdTokenChanged).toHaveBeenCalledTimes(1);
    expect(typeof stop).toBe('function');
    // simular rotación natural del token (~1h)
    await auth._cb!(auth.currentUser);
    expect(mockSet).toHaveBeenCalledWith('tok-A');
  });

  it('el timer proactivo fuerza getIdToken(true) antes de expirar (cubre pestaña en background)', async () => {
    const auth = makeAuth('tok-P');
    startSessionRefresh(auth);
    mockSet.mockClear();
    await vi.advanceTimersByTimeAsync(50 * 60 * 1000); // ventana proactiva
    expect(auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
    expect(mockSet).toHaveBeenCalledWith('tok-P');
  });

  it('stopSessionRefresh desuscribe y limpia el timer (idempotente)', () => {
    const auth = makeAuth('tok-S');
    startSessionRefresh(auth);
    expect(() => stopSessionRefresh()).not.toThrow();
    expect(() => stopSessionRefresh()).not.toThrow();
  });

  it('AUTO-SANADO: sin usuario y cookie con token CADUCADO → limpia la cookie SSO', async () => {
    (globalThis as any).document = { cookie: `idTokenV0.1.0=${EXPIRED_JWT}` };
    const auth = makeAuth('x');
    startSessionRefresh(auth);
    await auth._cb!(null); // onIdTokenChanged sin usuario
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('AUTO-SANADO: sin usuario pero cookie VÁLIDA → NO limpia', async () => {
    (globalThis as any).document = { cookie: `idTokenV0.1.0=${VALID_JWT}` };
    const auth = makeAuth('x');
    startSessionRefresh(auth);
    await auth._cb!(null);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('AUTO-SANADO: sin usuario y sin cookie → NO limpia', async () => {
    (globalThis as any).document = { cookie: '' };
    const auth = makeAuth('x');
    startSessionRefresh(auth);
    await auth._cb!(null);
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('sin window (SSR) no arranca nada y devuelve noop', () => {
    const saved = (globalThis as any).window;
    delete (globalThis as any).window;
    const auth = makeAuth('tok-SSR');
    const stop = startSessionRefresh(auth);
    expect(auth.onIdTokenChanged).not.toHaveBeenCalled();
    expect(typeof stop).toBe('function');
    (globalThis as any).window = saved;
  });
});
