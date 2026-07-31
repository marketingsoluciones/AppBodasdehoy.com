import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Aislar SessionManager de la escritura real de cookie.
vi.mock('../SessionBridge', () => ({
  setCrossAppIdToken: vi.fn(),
}));

import { setCrossAppIdToken } from '../SessionBridge';
import { startSessionRefresh, stopSessionRefresh, getFreshToken } from '../SessionManager';

const mockSet = setCrossAppIdToken as unknown as ReturnType<typeof vi.fn>;

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
  vi.useFakeTimers();
});

afterEach(() => {
  stopSessionRefresh();
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
