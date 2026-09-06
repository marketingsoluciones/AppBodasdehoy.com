/**
 * useWebPushSubscription.test.ts — verifica la matriz de estados del hook
 * sin necesidad de un browser real. Cubre las 3 rutas críticas:
 *   1. Browser sin soporte → supported=false, permission='unsupported'
 *   2. Permiso 'default' con hook.subscribe() → llama Notification.requestPermission
 *   3. Subscribe exitoso hace POST al backend con el shape esperado
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useWebPushSubscription } from './useWebPushSubscription';

// ─── Setup ──────────────────────────────────────────────────────────────────

const originalNavigator = global.navigator;
const originalFetch = global.fetch;
const originalProcessEnv = { ...process.env };

// Clave pública VAPID real de api-ia (pública por diseño, sin riesgo en tests).
const VAPID_PUBLIC_KEY =
  'BCUXyM5TY-RNY0Kr88yuubLcG44IUTH0TbgHaoJoEdMaaWOnlVbHVZ_X0BLmS1VddEZkpkMvYFsDiToWjY1qeMs';

/** fetch que responde la clave VAPID en el GET y `postResult` en el POST/DELETE. */
function mockFetch(postResult: any = { ok: true, status: 200 }, publicKey: any = VAPID_PUBLIC_KEY) {
  return vi.fn().mockImplementation((url: string) => {
    if (url === '/api/push/vapid-public-key') {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ publicKey }) });
    }
    return Promise.resolve(postResult);
  });
}

function mockBrowserSupport(opts?: {
  permission?: NotificationPermission;
  existingSubscription?: any;
}) {
  const permission = opts?.permission ?? 'default';

  (global as any).Notification = {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  };

  (global as any).PushManager = {};

  const swReady = Promise.resolve({
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(opts?.existingSubscription ?? null),
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://fcm.googleapis.com/fcm/send/xyz',
        toJSON: () => ({ keys: { p256dh: 'p256dh-value', auth: 'auth-value' } }),
        unsubscribe: vi.fn().mockResolvedValue(true),
      }),
    },
  });

  (global as any).navigator = {
    ...originalNavigator,
    serviceWorker: { ready: swReady },
    userAgent: 'Mozilla/5.0 (E2E)',
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useWebPushSubscription', () => {
  afterEach(() => {
    process.env = { ...originalProcessEnv };
    (global as any).navigator = originalNavigator;
    global.fetch = originalFetch;
    delete (global as any).Notification;
    delete (global as any).PushManager;
    vi.restoreAllMocks();
  });

  it('supported=false cuando el browser no tiene PushManager', () => {
    // Sin PushManager global
    (global as any).navigator = { ...originalNavigator };
    const { result } = renderHook(() => useWebPushSubscription());
    expect(result.current.supported).toBe(false);
    expect(result.current.permission).toBe('unsupported');
  });

  it('permission=default cuando browser soporta pero no ha decidido', async () => {
    mockBrowserSupport({ permission: 'default' });
    const { result } = renderHook(() => useWebPushSubscription());
    // Esperar al useEffect asíncrono
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.supported).toBe(true);
    expect(result.current.permission).toBe('default');
    expect(result.current.subscribed).toBe(false);
  });

  it('subscribe() hace fetch al backend con endpoint + keys', async () => {
    mockBrowserSupport({ permission: 'default' });
    (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');

    const fetchSpy = mockFetch();
    global.fetch = fetchSpy as any;

    const { result } = renderHook(() => useWebPushSubscription());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    // Pide la clave VAPID al proxy antes de suscribir.
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/push/vapid-public-key',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/push/subscribe',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    const postCall = fetchSpy.mock.calls.find(([u]: [string]) => u === '/api/push/subscribe');
    const [, opts] = postCall;
    const body = JSON.parse(opts.body);
    expect(body.endpoint).toBe('https://fcm.googleapis.com/fcm/send/xyz');
    expect(body.keys).toEqual({ p256dh: 'p256dh-value', auth: 'auth-value' });
    expect(body.subscribedAt).toBeDefined();

    expect(result.current.subscribed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('subscribe() falla si el usuario deniega el permiso', async () => {
    mockBrowserSupport({ permission: 'default' });
    (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const { result } = renderHook(() => useWebPushSubscription());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.subscribed).toBe(false);
    expect(result.current.error).toContain('Permiso denegado');
  });

  it('subscribe() falla si el servidor no devuelve la clave VAPID', async () => {
    mockBrowserSupport({ permission: 'default' });
    (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');

    // El proxy responde 200 pero sin publicKey → escalar como error (no fallback).
    global.fetch = mockFetch({ ok: true, status: 200 }, null) as any;

    const { result } = renderHook(() => useWebPushSubscription());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.subscribed).toBe(false);
    expect(result.current.error).toContain('VAPID');
  });
});
