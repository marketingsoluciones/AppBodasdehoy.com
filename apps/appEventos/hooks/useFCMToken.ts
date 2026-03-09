/**
 * useFCMToken — solicita permiso de notificaciones push y obtiene el FCM token.
 * Lo guarda en api2 asociado al usuario para que el backend pueda enviar pushes.
 *
 * Uso: llamar dentro de AuthContext o _app.tsx tras confirmar sesión de usuario.
 */
import { useEffect, useRef, useState } from 'react';

const FCM_TOKEN_KEY = 'fcm_push_token';

async function loadFirebaseMessaging() {
  const { getApp, getApps } = await import('firebase/app');
  const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
  const app = getApps().length > 0 ? getApp() : null;
  if (!app) return null;
  try {
    const messaging = getMessaging(app);
    return { messaging, getToken, onMessage };
  } catch {
    return null;
  }
}

async function saveFCMTokenToServer(token: string, userId: string, development: string) {
  try {
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, development }),
    });
  } catch {
    // Fallo silencioso — no bloquear la UX
  }
}

export function useFCMToken(userId?: string, development?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const initialized = useRef(false);

  useEffect(() => {
    if (!userId || !development) return;
    if (initialized.current) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    initialized.current = true;

    const init = async () => {
      // No pedir permiso automáticamente — esperar interacción del usuario
      const currentPerm = Notification.permission;
      setPermission(currentPerm);

      if (currentPerm === 'denied') return;

      // Cargar el service worker primero
      let swRegistration: ServiceWorkerRegistration | null = null;
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
      } catch {
        return;
      }

      if (currentPerm !== 'granted') return;

      // Ya tiene permiso → obtener token
      await getAndSaveToken(swRegistration, userId, development);
    };

    init();
  }, [userId, development]);

  async function getAndSaveToken(
    swReg: ServiceWorkerRegistration,
    uid: string,
    dev: string
  ) {
    const cached = localStorage.getItem(FCM_TOKEN_KEY);
    if (cached) {
      setToken(cached);
      return cached;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) return null;

    const fb = await loadFirebaseMessaging();
    if (!fb) return null;

    try {
      const fcmToken = await fb.getToken(fb.messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
      });
      if (fcmToken) {
        localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
        setToken(fcmToken);
        await saveFCMTokenToServer(fcmToken, uid, dev);
        return fcmToken;
      }
    } catch {
      // Error obteniendo token — puede ser que el dominio no esté autorizado
    }
    return null;
  }

  /**
   * Solicita permiso explícitamente (llamar desde un botón de UI).
   * Devuelve el FCM token si se concede permiso.
   */
  async function requestPermission(): Promise<string | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    const perm = await Notification.requestPermission();
    setPermission(perm);

    if (perm !== 'granted') return null;

    const swReg = await navigator.serviceWorker.ready;
    if (!userId || !development) return null;
    return getAndSaveToken(swReg, userId, development);
  }

  function clearToken() {
    localStorage.removeItem(FCM_TOKEN_KEY);
    setToken(null);
  }

  return { token, permission, requestPermission, clearToken };
}
