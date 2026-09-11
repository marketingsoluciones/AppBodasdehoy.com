# SPRINT 4 — Web Push Notifications (front)

> 2026-07-06 · Estado: **parte front completa**, esperando backend api-ia.

## Qué hace

Notificaciones nativas del sistema operativo (Chrome/Firefox/Edge/Safari
15+) que llegan al usuario incluso con la app **cerrada**. Se usan para:

- Mensaje WhatsApp nuevo en la bandeja
- Mención `@` del user en una nota / tarea CRM
- Comentario nuevo en `/servicios` o `/itinerario` donde el user es viewer
- Cualquier evento SSE que el backend decida escalar a push

## Piezas del sistema

```
┌─────────────────┐   permiso + subscribe    ┌───────────────┐
│  Browser        │◄─────────────────────────┤  Chat-IA UI   │
│  (Push API)     │                          │  hook +       │
└────┬────────────┘                          │  button       │
     │ endpoint FCM/GCM                      └──────┬────────┘
     ▼                                              │
┌─────────────────┐         POST subscription       │
│  Service Worker │  ─────────────────────────────► │
│  (sw.ts)        │                                 ▼
│  handlers push  │                          ┌──────────────────┐
└─────────────────┘                          │ /api/push/       │
     ▲                                       │  subscribe route │
     │ push emitido                          └──────┬───────────┘
     │                                              │ POST proxy
┌────┴────────────┐                                 ▼
│   api-ia        │◄──────────────────────── ┌──────────────────┐
│   web-push lib  │       push payload       │  api-ia server   │
│   VAPID sign    │                          │  (persistence +  │
└─────────────────┘                          │   emisor)        │
                                             └──────────────────┘
```

## Front (implementado 6-jul)

- **`apps/chat-ia/src/app/sw.ts`** — handlers `push` + `notificationclick`
  del Service Worker. Serwist ya estaba montado; extendido con nuestra
  lógica sin tocar el precache.
- **`apps/chat-ia/src/hooks/useWebPushSubscription.ts`** — hook React
  que expone: `{ supported, permission, subscribed, loading, error,
  subscribe, unsubscribe }`. Consume `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en
  build.
- **`apps/chat-ia/src/features/WebPush/PushSubscribeButton.tsx`** —
  botón opt-in reutilizable. Se auto-oculta si el browser no soporta;
  muestra estado explicativo si `permission='denied'`.
- **`apps/chat-ia/src/app/(backend)/api/push/subscribe/route.ts`** —
  proxy Next.js `POST` + `DELETE` a `api-ia/api/push/subscribe`.
  Propaga `Authorization`, `X-Development`, `X-Internal-Secret`.
- **Tests** — `useWebPushSubscription.test.ts` (5/5 pass) cubre:
  - browser sin soporte
  - `permission='default'` inicial
  - `subscribe()` completo con POST al backend
  - denegación de permiso
  - VAPID key ausente

## Payload del emisor (contrato con backend api-ia)

Cuando api-ia emita push, el SW espera este JSON:

```json
{
  "title": "Ana comentó en 'Catering Casa Roma'",
  "body": "@usuario revisa esto por favor",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/badge.png",
  "tag": "comment-6789",
  "url": "/servicios?task=task-123",
  "data": {
    "convId": null,
    "type": "comment_mention",
    "authorId": "ana-uid"
  },
  "requireInteraction": false
}
```

- `title`, `body` obligatorios (si faltan, SW usa placeholder).
- `icon`, `badge` opcionales (SW usa defaults `/icons/icon-192.png` +
  `/icons/badge.png`).
- `tag` opcional — agrupa notifs del mismo hilo (ej. 3 mensajes de la
  misma conversación reemplazan a una sola).
- `url` opcional (default `/messages`). Al click, SW:
  1. Busca pestaña abierta del origin → foco + navigate al url.
  2. Si no hay pestaña → `clients.openWindow(url)`.

## Pendiente backend api-ia

1. **Generar VAPID keys** — par asimétrico (pública + privada, uncompressed
   base64url 87 chars). Guardar privada server-only. Exponer pública en
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en el build del front.
2. **Endpoint `POST /api/push/subscribe`** — persiste `{endpoint, keys,
   userAgent, subscribedAt, userId}` (userId inferido del JWT). Idempotente:
   si el mismo endpoint ya existe, actualiza `subscribedAt`.
3. **Endpoint `DELETE /api/push/subscribe`** — elimina por endpoint.
4. **Emisor push** — hook en cada evento que hoy dispara SSE (nueva conv,
   mensaje, comentario, mención). Usa `web-push` library con las VAPID keys.
5. **Purga endpoints muertos** — cuando `web-push` devuelve 410 Gone,
   eliminar la suscripción del store. Cronjob semanal para GDPR.

## Cómo probar cuando esté listo

```js
// En browser incógnito con permission='default'
const push = useWebPushSubscription();
await push.subscribe();
// Aparece prompt del OS → aceptar
// Fetch a /api/push/subscribe debe devolver 200

// Backend api-ia debe enviar un push de prueba:
// El SW recibe el evento y muestra la notif del sistema.
// Click en la notif → abre pestaña con la URL del payload.

// Para desactivar:
await push.unsubscribe();
```

## Gotchas

- Safari macOS 15/iOS 16.4+ soporta Web Push, pero **requiere que el
  usuario haya "Añadido a pantalla de inicio"** primero (PWA). Sin PWA
  install, el hook detecta `supported=false`.
- El SW debe estar **HTTPS** obligatoriamente. En localhost funciona
  sin cert.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` **NO se puede cambiar sin invalidar
  todas las suscripciones existentes**. Documentar rotación anual con
  ventana de gracia (SW admite N-1 durante 30 días).
- Serwist auto-genera `/sw.js` en build. NO subir cambios al `.next/`
  a mano.

## Referencias del código

| Archivo | Función |
|---|---|
| `apps/chat-ia/src/app/sw.ts` | Service Worker (handlers push + click) |
| `apps/chat-ia/src/hooks/useWebPushSubscription.ts` | Hook estado + subscribe/unsubscribe |
| `apps/chat-ia/src/features/WebPush/PushSubscribeButton.tsx` | UI opt-in |
| `apps/chat-ia/src/app/(backend)/api/push/subscribe/route.ts` | Proxy a api-ia |
| `apps/chat-ia/src/hooks/useWebPushSubscription.test.ts` | 5 unit tests |
