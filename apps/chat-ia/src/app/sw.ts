import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// eslint-disable-next-line no-undef
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  clientsClaim: true,
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: defaultCache,
  skipWaiting: true,
});

serwist.addEventListeners();

// ─── SPRINT 4 Web Push Notifications (6-jul) ────────────────────────────────
// Handlers de `push` + `notificationclick` para notificaciones nativas del
// sistema (mensaje WA nuevo, mención @, comentario en /servicios, etc.).
// El backend api-ia (VAPID keys + emisor) enviará payloads con este shape:
//   {
//     title:  "Título visible",
//     body:   "Cuerpo del mensaje",
//     icon:   "/icons/icon-192.png",  (opcional, default LobeChat icon)
//     badge:  "/icons/badge.png",     (opcional, iOS/Android status bar)
//     tag:    "<msg-id>",             (agrupa notifs del mismo hilo)
//     url:    "/messages/wa-abc/conv-xyz",  (a dónde navegar al click)
//     data:   { convId, msgId, type: 'whatsapp'|'comment'|... }
//   }
// Si el payload NO trae title/body (edge case), mostramos un placeholder.

self.addEventListener('push', (event) => {
  let payload: any = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    // Payload no era JSON — intentamos leer como string.
    try {
      const text = event.data?.text() ?? '';
      payload = { title: 'Notificación', body: text };
    } catch {
      payload = { title: 'Notificación', body: 'Tienes un mensaje nuevo' };
    }
  }

  const title = payload.title || 'AppBodas';
  const options: NotificationOptions = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge.png',
    tag: payload.tag,
    data: {
      url: payload.url || '/messages',
      ...(payload.data || {}),
    },
    // requireInteraction: true cuando la notif es "importante" (mención directa)
    requireInteraction: payload.requireInteraction === true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data as any)?.url || '/messages';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Si ya hay una pestaña abierta del origin, foco + navegar dentro.
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await (client as WindowClient).navigate(targetUrl);
            } catch {
              // navigate() puede no estar disponible en algunas plataformas
            }
          }
          return;
        }
      }

      // Sin pestaña abierta → abrir nueva.
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
