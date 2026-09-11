# Informe: socket realtime + notificaciones — appEventos

Resumen del trabajo y hallazgos sobre la propagación de comentarios y notificaciones entre usuarios en eventos compartidos.

## TL;DR

- El bug original ("usuario B no recibe en tiempo real el comentario que escribe usuario A en una tarea") tenía **dos causas independientes** que se sumaban.
- El equipo ya reparó la causa principal en `baeca782` (canal de socket roto + listeners sin cleanup).
- Encima, descubrí una segunda causa: la **campana de notificaciones no consumía el socket**, sólo polling cada 60 s.
- Aplicado un parche adicional que conecta la campana al socket y mejora el manejo de errores en `createNotifications`.
- Quedan 4 bugs residuales menores documentados al final, sin aplicar.

---

## Causa 1 (ya reparada por el equipo) — commit `baeca782`

`apps/appEventos/components/DefaultLayout/SocketControlator.tsx`

Las dos primeras emisiones de `setEvent` y `setPlanSpaceActive` iban literalmente al canal `'undefined'` por una guarda mal escrita:

```diff
- socket?.emit(countEvent > 2 ? `app:message` : `undefined`, { ... })
+ socket?.emit(`app:message`, { ... })
```

Esto explicaba por qué el primer comentario tras login nunca llegaba al otro usuario: el servidor descartaba el evento por canal inválido. Tras el commit, todas las emisiones van a `app:message` desde el primer envío.

Otros fixes incluidos en el mismo commit:

- Listeners en `socket.on(...)` ahora con `socket.off(...)` en el cleanup del effect (antes había leak de listeners en cada re-mount).
- El receptor del evento `setEvent` antes rechazaba payloads con `value` tipo string (`if (typeof rawValue !== 'object') return`); ahora si llega string hace `getEventsByID` y aplica el evento refetcheado.
- `joinRoom` con null-guards (`if (!socket) return; if (!event?._id) return;`).
- `api.js`: pooling del `Manager` de `socket.io-client` (Map por URL) → evita crear conexión nueva en cada render. Forzado `transports: ["websocket"]` (sin polling fallback).
- `EventsGroupContext`: `filter` en vez de `splice` para limpiar todas las ocurrencias duplicadas del usuario en `compartido_array`.
- `AddUserToEvent`: deduplicación con `Set` antes de `push`.

## Causa 2 (parche aplicado por mí) — la campana ignoraba el socket

`apps/appEventos/components/Notifications.tsx` renderiza el badge real de la campana, pero **no importaba `SocketContext` ni se suscribía a `socket.on('notification')`**. Sólo hacía polling a `/api/notifications` cada `POLL_INTERVAL = 60_000` (1 minuto).

Resultado: aunque el socket entregara correctamente `notification` al cliente B (cosa que sí hace tras el commit anterior), el contador de la campana NO subía hasta el siguiente tick del polling — entre 0 y 60 s de retraso.

Mientras tanto, `SocketControlator.tsx:243-249` actualizaba un `notifications.total + 1` en `SocketContext` que **nadie leía**.

### Cambios aplicados

#### `apps/appEventos/components/Notifications.tsx`

- Importa `SocketContextProvider` desde `../context`.
- Lee `socket` del context.
- Nuevo `useEffect` que registra `socket.on('notification', ...)` con su `socket.off(...)` correspondiente. Cuando llega el evento socket:
  - Llama `pollUnread()` para refrescar el badge inmediato.
  - Si el panel está abierto, vuelve a llamar `fetchApi2(...)` con los argumentos correctos según la vista activa (`event-notifications` filtra por `eventsGroup.find(_id === focusedEventId)`).
- `POLL_INTERVAL` subido de `60_000` a `300_000` (5 min) — el socket cubre el push real-time, el polling queda sólo como fallback para reconexión.

#### `apps/appEventos/hooks/useNotification.ts`

La mutación `createNotifications` antes era ciega. Si fallaba en backend, el cliente A pensaba que todo estaba OK y no se enteraba de que B nunca recibió la notificación. Ahora:

- `result.total === 0` → `toast("error", "No se pudo enviar la notificación")`.
- Respuesta inválida (sin campo `total`) → `toast` de error + `console.error`.
- `.catch(err)` añadido para errores de red/promesa → `toast` de error + `console.error`.

---

## Cómo verificar

1. **Real-time del comentario** (lo importante, ya verificado):
   - Abrir el mismo evento compartido en dos sesiones (usuarios distintos).
   - A escribe un comentario en una tarea.
   - B debería ver el comentario actualizarse en pantalla y la campana incrementar **al instante** (≤ 1 s).
2. **Smoke test del socket** desde DevTools de B:
   - Antes del comentario, en consola: `[SocketContext] Conectado` debe haberse logueado.
   - Tras el comentario de A, B debería ver el push del `app:message` (refresca la tarea) y el `notification` (refresca campana).
3. **Manejo de error** (sintético):
   - Cortar internet en el cliente A justo antes de enviar el comentario.
   - Debería aparecer toast rojo "No se pudo enviar la notificación".

---

## Bugs residuales identificados (NO aplicados, queda decisión del equipo)

### 1. `joinRoom` no espera a `socket.connected`
`SocketControlator.tsx:276-290` — el effect dispara con `[event?._id, reconet]`. Si el socket está reconectándose justo cuando cambia `event._id`, el `emit` se mete en cola del cliente; algunos servidores ignoran emits previos al `connect` real. Recomendado: comprobar `socket.connected` y, si false, registrar `socket.once('connect', () => emit(joinRoom))`.

### 2. Token rotado no actualiza el socket
`SocketContext.tsx:35-57` — las deps del `useEffect` son `[user, config?.development, searchParams]`. Cuando Firebase rota `idTokenV0.1.0` (cada hora aprox), el cookie cambia pero ninguna dep dispara, así que el socket sigue con el token caducado. Tras la expiración el backend invalida la conexión silenciosamente. Recomendado: leer la cookie en un `setInterval` o suscribirse al evento de Firebase `onIdTokenChanged` y reabrir el socket.

### 3. `senderPlanSpaceActive` es `let` dentro del componente
`SocketControlator.tsx:21` — declarado como variable local (`let`), se resetea en cada render. Las flags entre renders se pierden. Debería ser `useRef(false)` para persistir entre renders sin causar re-render.

### 4. Logs de debug en `SocketContext.tsx`
Líneas 36-44: cuatro `console.log` con el patrón `=======> User`, `=======> parseJwt`, etc. Ruido en consola del cliente y leak menor de información del JWT en producción. Eliminar o pasar a `useDevLogger`.

---

## Archivos modificados en este informe (parche segundo)

```
apps/appEventos/components/Notifications.tsx       (+22, -2)
apps/appEventos/hooks/useNotification.ts           (+13, -2)
```

Los cambios son aditivos sobre `baeca782` y no tocan ninguna API existente.

## Riesgos

- `Notifications.tsx` añade una dep al `useEffect` que incluye `eventsGroup`, `pollUnread` y `fetchApi2` (functions estables vía `useCallback`). Riesgo bajo de re-suscripciones extra al socket si alguna de esas referencias cambia más de lo esperado.
- `useNotification.ts` ahora muestra toast de error en casos donde antes había silencio. Si el backend devuelve `total: 0` en algún flujo legítimo (p. ej. el usuario es el único destinatario y se filtró), saldrá un toast rojo donde antes no salía nada — revisar antes de mergear.

## Observación operativa

Durante la verificación remota desde Cowork, `app-dev.bodasdehoy.com` quedó sin hidratar React tras un restart (bundle se descarga 200, polyfill carga, pero `_app.tsx` no llega a ejecutar — `bootSec` congelado en 0s, `hasReact: false`). No bloquea las pruebas en local. Si reaparece, mirar el output de la terminal de `next dev` (o `pm2 logs`) — el error vivirá ahí.
