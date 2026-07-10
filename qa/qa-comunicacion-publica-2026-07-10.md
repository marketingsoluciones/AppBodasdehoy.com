# QA comunicación / notificaciones — resumen público — 2026-07-10

## Estado general

- Fase 0: `PASS`
- Batería B: `PARCIAL`
  - `B1`: `FAIL`
  - `B2`: `FAIL parcial` con avance real
  - `B3`: `BLOCKED`

## Fase 0

- `app-dev.bodasdehoy.com`: `200`
- `chat-dev.bodasdehoy.com`: `200`
- `chat-dev/sw.js`: `200`
- `Content-Type sw.js`: `application/javascript; charset=UTF-8`
- `VAPID publicKey`: presente, longitud `87`

## Build observada

- `chat-dev/settings/advanced`: `dbg 99db3b2 | sBiTmcp`
- `app-dev`: `dbg 8b135f2 | sBiT`

## B1 — Web Push subscribe end-to-end

- Resultado: `FAIL`
- En `chat-dev/settings/advanced` se ve el bloque `Notificaciones en este dispositivo`, pero no aparece el CTA funcional de suscripción.
- No se observó GET a `/api/push/vapid-public-key` ni POST a `/api/push/subscribe`.
- Señales técnicas: error de acceso cruzado con `firebaseapp.com` y `400 Bad Request` en consola.
- Lectura: el pipeline se rompe antes del subscribe real.

## B2 — Campana in-app

- Resultado: `FAIL parcial`
- La contraseña que funcionó en este rerun para owner fue `lorca2012M*+`.
- El owner entra en `app-dev`, la campana aparece, abre panel y se ven las tabs `Actual`, `Pendientes` e `Historial`.
- Se observó polling de `/api/notifications?...tab=pending`.
- No quedó confirmado refresco por socket ni `markNotificationAsRead` limpio.
- Persisten errores de runtime, en especial `Minified React error #418`.

## B3 — `comment_added` cross-app

- Resultado: `BLOCKED`
- No se consiguió abrir una conversación útil en `chat-dev/messages` para crear una nota reproducible desde `NotesPanel`.
- No apareció tráfico `createCRMNote` ni `deleteCRMNote`.
- No llegó notificación `comment_added` a la sesión de `app-dev`.
- Señales observadas: deriva a Google signup/OAuth en la sesión A y `401 Unauthorized` en consola.

## Conclusión

El reintento mejora el estado respecto al bloqueo inicial porque ya hay ejecución real de la batería B.

La parte más estable de este rerun es `B2`: login owner OK, campana visible, panel visible y polling funcionando. Sin embargo, no se puede cerrar en verde por los errores de runtime y porque no queda confirmado el flujo de lectura/socket.

Los problemas más sólidos que siguen abiertos son:

1. `B1`: ausencia del CTA funcional de Web Push en `chat-dev/settings/advanced`
2. `B2`: degradación por `React #418` y flujo de notificaciones no limpio
3. `B3`: `comment_added` no reproducible end-to-end en esta build

## Recomendación inmediata

Antes de continuar con la batería A, conviene hacer una de estas dos cosas:

1. aceptar `B2` como `PASS parcial` y seguir con bandeja/mensajes
2. hacer una pasada corta adicional solo sobre:
   - `B1` con inspección manual del CTA Web Push
   - `B2` centrada en `markNotificationAsRead`
   - `B3` con un fixture o conversación concreta para no depender de heurísticas
