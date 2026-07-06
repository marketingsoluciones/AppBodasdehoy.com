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
  beforeEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BExampleKey_base64url_87chars_' + 'a'.repeat(58);
  });

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

    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchSpy as any;

    const { result } = renderHook(() => useWebPushSubscription());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/push/subscribe',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    const [, opts] = fetchSpy.mock.calls[0];
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

  it('subscribe() falla si NEXT_PUBLIC_VAPID_PUBLIC_KEY no está', async () => {
    mockBrowserSupport({ permission: 'default' });
    (global as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const { result } = renderHook(() => useWebPushSubscription());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.subscribed).toBe(false);
    expect(result.current.error).toContain('VAPID public key');
  });
});
