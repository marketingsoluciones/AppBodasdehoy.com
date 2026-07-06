'use client';

/**
 * useWebPushSubscription — SPRINT 4 iMessage (6-jul).
 *
 * Gestiona el ciclo de vida de Web Push Notifications:
 *   - Detecta si el browser soporta Push API + Service Worker.
 *   - Lee estado actual del permiso (default | granted | denied).
 *   - Suscribe (con VAPID public key) → POST al backend con la
 *     PushSubscription serializada.
 *   - Desuscribe → DELETE al backend con el endpoint.
 *
 * VAPID public key debe venir del server-side rendering vía la env var
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY (base64url uncompressed, 87 chars). El
 * backend api-ia genera el par y expone la pública en su config.
 *
 * Uso:
 *   const push = useWebPushSubscription();
 *   if (push.supported && push.permission === 'default') {
 *     <button onClick={push.subscribe}>Activar notificaciones</button>
 *   }
 */
import { useCallback, useEffect, useState } from 'react';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UseWebPushSubscription {
  /** true si el browser soporta ServiceWorker + PushManager. */
  supported: boolean;
  /** Estado actual del permiso. 'unsupported' si el browser no lo tiene. */
  permission: PushPermissionState;
  /** true si ya hay suscripción activa registrada en el SW. */
  subscribed: boolean;
  /** true mientras la operación está en curso. */
  loading: boolean;
  /** Último error de subscribe/unsubscribe. null si OK. */
  error: string | null;
  /** Inicia el flujo de permiso + subscribe + POST al backend. */
  subscribe: () => Promise<void>;
  /** Elimina la suscripción del SW + DELETE al backend. */
  unsubscribe: () => Promise<void>;
}

// ─── Utils ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.codePointAt(i)!;
  }
  return output;
}

function serializeSubscription(sub: PushSubscription): Record<string, unknown> {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: json.keys,
    // Fecha para que backend pueda purgar suscripciones viejas
    subscribedAt: new Date().toISOString(),
    // UA para diagnóstico
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWebPushSubscription(): UseWebPushSubscription {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar soporte + estado inicial (una sola vez).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSupport =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(hasSupport);
    if (!hasSupport) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermissionState);

    // Comprobar si ya hay suscripción activa
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
      } catch {
        setSubscribed(false);
      }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) {
      setError('Este navegador no soporta notificaciones push.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Pedir permiso al usuario.
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);
      if (perm !== 'granted') {
        setError(perm === 'denied' ? 'Permiso denegado.' : 'Permiso no concedido.');
        return;
      }

      // 2. Obtener VAPID public key inyectada en build.
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) {
        setError('VAPID public key no configurada. Backend api-ia pendiente.');
        return;
      }

      // 3. Suscribir con el Service Worker registrado.
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });

      // 4. POST al backend con la suscripción serializada.
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeSubscription(sub)),
        credentials: 'include',
      });
      if (!res.ok) {
        // Rollback: quitar suscripción local si backend rechazó.
        await sub.unsubscribe().catch(() => {});
        throw new Error(`Backend rechazó suscripción: HTTP ${res.status}`);
      }

      setSubscribed(true);
    } catch (e: any) {
      setError(e?.message || 'Error al suscribir a notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // DELETE al backend antes de invalidar local (para que el emisor
        // deje de enviar a un endpoint muerto ASAP).
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
          credentials: 'include',
        }).catch(() => {
          // Si backend falla, seguimos con unsubscribe local. Backend
          // debe tener una purga por TTL de endpoints muertos.
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e: any) {
      setError(e?.message || 'Error al desuscribir.');
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe };
}
