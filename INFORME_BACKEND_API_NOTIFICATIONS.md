# Informe para el proveedor del backend (api3-mcp / api-eventos)

**Producto afectado:** appEventos (frontend Next.js, dominio `app-dev.bodasdehoy.com`).
**Backend afectado:** api3-mcp / api-eventos (resolver GraphQL).
**Fecha:** 2026-04-29.
**Severidad:** crítica.

---

## Update 4 — Sweep masivo de mutations rotas (2026-04-30 12:30 UTC)

Tras seguir auditando el resto del schema (no solo notificaciones y queryenEvento), se han detectado más resolvers que cambiaron firma o desaparecieron en api3-mcp. **El cliente sigue usando la firma legacy en todos ellos**, así que están rotos hoy:

### Resolvers Query rotos / desaparecidos

| Resolver | Estado | Lo que pide el cliente | Realidad backend |
|---|---|---|---|
| `queryenEvento` | ⚠️ parcial | subfields completos del Evento | tipos anidados como `[JSON!]` (ver Update 3) |
| `getAllEvents(development)` | ✅ | OK | OK |
| `getItinerario(eventID, development)` | ❌ | `eventID` | renombrado a `evento_id: ID!` |
| `queryenInvitados(eventID, development)` | ❌ | resolver completo | **NO EXISTE** "Cannot query field queryenInvitados on type Query" |
| `getLinkInvitation(args, development)` | ❌ | resolver completo | **NO EXISTE** |
| `getPGuestEvent(args, development)` | ❌ | resolver completo | **NO EXISTE** |
| `getExistUser(uid, development)` | ❌ | resolver completo | **NO EXISTE** o argumentos cambiados |

### Resolvers Mutation rotos / con firma cambiada

| Mutation | Estado | Cambio detectado |
|---|---|---|
| `createComment` | ❌ | Ahora pide `task_id: ID!`, `development: String!`, `comment: TaskCommentInput!` (objeto, no string). Antes pedía `eventID/itinerarioID/taskID/comment:String/attachments`. **Afecta a TODO el flujo de comentarios — bloqueador para real-time.** |
| `createEvento` | ❌ | Argumento `args` desapareció, firma desconocida |
| `updateEvento` | ❌ | Argumento `eventID` desapareció |
| `deleteEvento` | ❌ | Retorna `EventoResponse!` sin subfields ("must have a selection of subfields") |
| `createInvitado` | ❌ | **NO EXISTE** "Cannot query field createInvitado on type Mutation" |
| `updateInvitado` | ❌ | **NO EXISTE** |
| `deleteInvitado` | ❌ | **NO EXISTE** (probable) |
| `createNotifications` | ⚠️ stub | Schema OK, resolver no persiste (Update 1) |
| `getNotifications` | ❌ | Argumentos cambiados (Update inicial) |
| `updateNotifications` | ❌ | Argumentos cambiados + retorna EventoResponse! sin subfields |
| `addCompartitions/updateCompartitions/deleteCompartitions` | ❌ | NO EXISTEN |
| `updateCustomer/updateActivity/updateActivityLink` | ❌ | input types ausentes |
| `getEventTicket` | ❌ | input type ausente |

### Patrón sospechoso: convención de nombres pasó de camelCase a snake_case en argumentos

El cliente histórico usa: `eventID`, `taskID`, `itinerarioID`, `userId`. El backend nuevo (al menos en `createComment`) pide: `task_id`, `evento_id`, `itinerario_id`. Si esa renombrada se aplicó a TODAS las mutaciones, entonces **el cliente entero está hablando un idioma distinto al backend**.

### Tipo `TaskCommentResponse` nuevo

`createComment` ya no devuelve un `Comment { _id comment uid createdAt }`. Devuelve un tipo `TaskCommentResponse` con campos distintos (no documentado al cliente). Hay que conocer la nueva forma para que el cliente pueda procesar la respuesta.

### Acción requerida (resumen consolidado para la última sesión de fixes)

1. **Restaurar tipos GraphQL fuertes** del Evento (mesas_array, invitados_array, itinerarios_array, planSpace, detalles_compartidos_array, lugar, imgEvento, etc) — Update 3.
2. **Restaurar resolvers desaparecidos**: `queryenInvitados`, `getLinkInvitation`, `getPGuestEvent`, `getExistUser`, `createInvitado`, `updateInvitado`, `deleteInvitado`, `addCompartitions`, `updateCompartitions`, `deleteCompartitions`.
3. **Mantener camelCase en argumentos** (eventID, taskID, itinerarioID) para coincidir con el cliente, O comunicar la nueva convención snake_case y migrar el cliente. Decidir UNA.
4. **Implementar el resolver de `createNotifications`** para que persista y emita socket (Update 1).
5. **Arreglar `queryenEvento(_id)`** para que devuelva el evento concreto (ya devuelve count:1, OK).
6. **Implementar broadcast del socket** para que `app:message {action:"setEvent"}` se retransmita a la room (Update 2).

Sin estos seis bloques arreglados, **no se puede usar la app**: la home no carga eventos, no se puede crear/editar invitados, no se puede compartir eventos, las notificaciones no llegan, los comentarios en tiempo real no se propagan.

---

## Update 3 — BREAKING CHANGE masivo del schema (2026-04-30 10:30 UTC)

Tras el último deploy del proveedor, el schema GraphQL ha sufrido un cambio mayor: **todos los tipos anidados del tipo `Evento` se han colapsado a `JSON`/`[JSON!]`/`String`, perdiendo subfields**. La query `queryenEvento` sigue devolviendo eventos (200), pero el cliente pide subfields que ya no existen y obtiene HTTP 400. Resultado funcional: el banner "No se pudieron cargar los eventos. El servidor no responde." aparece SIEMPRE en la home porque la query completa nunca termina.

Probado contra `/api/proxy/graphql` con la sesión real autenticada. Antes esos campos eran tipos GraphQL fuertes con sub-objetos; ahora:

| Campo en `Evento` | Tipo NUEVO en api3-mcp | Lo que pide el cliente |
|---|---|---|
| `mesas_array` | `[JSON!]` | `{ _id nombre_mesa tipo cantidad_sillas posicion{...} }` |
| `invitados_array` | `[JSON!]` | `{ _id nombre grupo_edad correo telefono chairs{...} comunicaciones_array{...} ... }` |
| `notificaciones_array` | `[JSON!]` | `{ _id fecha_creacion fecha_lectura mensaje }` |
| `planSpace` | `[JSON!]` | `{ _id title size{...} sections{...} tables{...} elements{...} }` |
| `itinerarios_array` | `[JSON!]` | `{ _id title tasks{ _id descripcion comments{...} attachments{...} ... } }` |
| `detalles_compartidos_array` | `[JSON!]` | `{ email uid permissions{ title value } createdAt updatedAt }` |
| `lugar` | `JSON` | `{ _id title slug }` |
| `imgEvento` | `String` (¡!) | `{ _id i1024 i800 i640 i320 createdAt }` |
| `imgInvitacion` | (probablemente igual) | igual estructura |
| `tematica` | NO EXISTE | string |
| `listIdentifiers` | NO EXISTE | `{ table start_Id end_Id }` |

Mensajes de error literales del backend cuando el cliente intenta pedir subfields:

```
Field "detalles_compartidos_array" must not have a selection since type "[JSON!]" has no subfields.
Field "lugar" must not have a selection since type "JSON" has no subfields.
Field "imgEvento" must not have a selection since type "String" has no subfields.
Field "itinerarios_array" must not have a selection since type "[JSON!]" has no subfields.
Field "mesas_array" must not have a selection since type "[JSON!]" has no subfields.
Field "invitados_array" must not have a selection since type "[JSON!]" has no subfields.
Field "notificaciones_array" must not have a selection since type "[JSON!]" has no subfields.
Field "planSpace" must not have a selection since type "[JSON!]" has no subfields.
Cannot query field "tematica" on type "Evento".
Cannot query field "listIdentifiers" on type "Evento".
```

Lo que **sí responde 200** son los campos primitivos directos del tipo `Evento`: `_id`, `nombre`, `tipo`, `fecha`, `fecha_creacion`, `usuario_id`, `compartido_array`, `pais`, `poblacion`, `timeZone`.

**Impacto funcional:**

- Home no carga eventos (banner de error).
- Resumen de evento: imposible (necesita `lugar`, `imgEvento`, `detalles_compartidos_array`).
- Invitados: imposible (necesita `invitados_array{...}`).
- Mesas: imposible (necesita `mesas_array{...}` y `planSpace{...}`).
- Itinerario / Servicios: imposible (necesita `itinerarios_array{ tasks{ comments{...} } }`).
- Compartir/permisos: imposible (necesita `detalles_compartidos_array{ permissions{...} }`).

**Acción requerida del proveedor (decisión arquitectónica):**

Hay dos opciones, hay que elegir una:

**Opción 1 — Restaurar los tipos GraphQL fuertes** (recomendado). Volver a declarar los tipos `Itinerario`, `Task`, `Comment`, `Mesa`, `Invitado`, `PlanSpace`, `Lugar`, `ImgEvento`, `DetalleCompartido`, `ListIdentifier`, `Tematica` con sus subfields, como estaban antes de la migración. Es lo que el cliente espera y lo que mantiene un GraphQL schema funcional. Ventajas: validación de schema, autocompletado, filtrado por field; es el estándar GraphQL.

**Opción 2 — Mantener `JSON` y migrar al cliente** a parsear los blobs JSON crudos. Implica cambiar miles de líneas del cliente (cualquier sitio que haga `event.mesas_array[i].nombre_mesa` debe documentar el contrato a mano, sin validación). Pierde todas las ventajas del schema fuerte. **Es un anti-patrón en GraphQL**.

Si optan por mantener `JSON`, además habría que documentar la estructura interna de cada blob JSON exhaustivamente, porque el cliente tiene 50+ archivos que asumen la forma. La migración del cliente no es trivial.

**Recomiendo Opción 1: restaurar el schema fuerte.** Si la decisión fue por simplicidad de implementación del backend, un código generador desde una sola fuente de verdad (e.g., los modelos MongoDB) sigue siendo viable manteniendo el schema GraphQL completo.

---

## Update 2 — prueba end-to-end real-time A→B (2026-04-30 07:59 UTC)

Reproducción definitiva del bug de propagación con dos sesiones reales:

- **Usuario A** (`bodasdehoy.com@gmail.com`, propietario de "Boda de Isabel & Raúl") — autenticado.
- **Usuario B** (`jcc@bodasdehoy.com`, colaborador en el mismo evento) — autenticado, en `/servicios` viendo la tarea "Floristeria" con 16 comentarios y un watcher JS (MutationObserver + polling cada 500ms) instalado.

A llamó directamente a la mutation `createComment` con un marker único (saltándose el editor del cliente para evitar dudas):

```bash
mutation createComment(eventID, itinerarioID, taskID, comment="AUDIT_RT_TEST_1777535985556", attachments=[], …)
```

Respuesta:

```json
{ "data": { "createComment": { "_id": "69f30bf16d3ac4d06848a276", "comment": "AUDIT_RT_TEST_1777535985556", "uid": "<A_uid>", "createdAt": "2026-04-30T07:59:45.723Z" } } }
```

Inmediatamente después, en B se verificó:

| Comprobación | Resultado |
|---|---|
| El comentario está en BD (consultado desde la sesión de B con `queryenEvento(usuario_id)`) | ✅ presente, encontrado por marker |
| El DOM de B contiene el marker `AUDIT_RT_TEST_1777535985556` (push real-time) | ❌ NO |
| Contador "comentarios" en la UI de B subió de 16 a 17 | ❌ NO, sigue en 16 |
| Watcher de B (5 min activo, 204 polls) detectó el marker | ❌ NO |

**Conclusión: el socket Socket.IO no está retransmitiendo el evento `app:message {type:"event", action:"setEvent", value:eventId}` a los demás miembros de la room del evento.** El cliente A sí emite (verificado en su `SocketControlator.tsx:313`), pero el backend no hace broadcast a la sala. B nunca recibe el push y solo verá el comentario nuevo si recarga manualmente.

Aunque el broadcast se implementara, también haría falta arreglar `queryenEvento(variable:"_id", valor:X)` (apartado más abajo) porque B usa esa query para refetchear el evento individual tras recibir el push, y devuelve `[]` aunque el evento exista.

**Acción requerida del proveedor:**

1. **Implementar el broadcast** en el handler del socket de api3-mcp/socket-server: cuando un cliente emite `app:message` con `type` en `["event","planSpaceActive","joinRoom"]`, el backend debe retransmitirlo a todos los sockets unidos a la room `event._id` (excepto al emisor o incluyéndolo, según convención). Hoy el evento se "pierde": A lo emite y nadie lo recibe.

2. Confirmar que el handler de `joinRoom` que el cliente emite al cambiar `event._id` está funcionando: `socket.emit("app:message", { type: "joinRoom", payload: { action: "add", value: event._id } })`.

3. Arreglar `queryenEvento(variable:"_id")` (ya cubierto en el apartado siguiente) para que el refetch tras el push funcione.

---

## Update tras primer ciclo de fixes (2026-04-30 04:30 UTC)

El proveedor restauró el schema de `createNotifications` (ya no devuelve 400 "Unknown type inputNotifications"), pero el **resolver sigue siendo un stub** que devuelve `{ total: 0, results: [] }` sin persistir nada en BD. Probado desde la sesión de un usuario autenticado real (cookie Bearer Firebase válida) con cinco variantes de `args` distintas — incluyendo `args: {}` vacío y combinaciones plausibles del cliente real:

```
mutation createNotifications(args: …) → 200 OK siempre, total:0 siempre, results:[] siempre
```

Tras la mutation, `getNotifications` y `/api/notifications?tab=pending` para los uids destinatarios siguen devolviendo `unreadCount: 0`. **El backend no escribe ninguna notificación en MongoDB.**

Esto es **peor que el 400 anterior** desde el punto de vista del usuario final: el cliente ya no muestra el toast de error de `useNotification.ts` (porque solo se dispara con `total === 0` o errores de red, y ahora `total === 0` parece no ser distinguible de "envío silencioso a 0 destinatarios"). El usuario que escribe un comentario cree que la notificación se ha enviado bien, pero el destinatario sigue sin recibir nada.

**Acción requerida del proveedor:** completar la lógica del resolver `createNotifications` para que persista en la colección de notificaciones y emita socket `notification` a los uids destinatarios. El schema ya está bien, falta la implementación.

### Bug colateral encontrado: `queryenEvento(variable="_id", valor=...)` siempre devuelve `[]`

Esta query es la que el cliente llama (`fetchApiBodas` con `queries.getEventsByID`, que internamente apunta a `queryenEvento`) cada vez que recibe un push de socket `app:message {action:"setEvent", value:eventId}` para refetchear el evento individual y aplicar los cambios. Si devuelve `[]`, el cliente no puede refrescar el evento.

Reproducido directamente contra `/api/proxy/graphql` desde una sesión Firebase autenticada, con tres IDs de eventos que SÍ existen en BD (los obtuve previamente con `queryenEvento(variable:"compartido_array", valor:<uid>)` que sí devuelve la lista):

```
queryenEvento(variable:"_id", valor:"66a9042dec5c58aa734bca44")  → []   (es Boda de Isabel & Raúl, existe)
queryenEvento(variable:"_id", valor:"65e1a4c6f9d4cf50e203bcb9")  → []   (es Jhj, existe)
queryenEvento(variable:"_id", valor:"673bb4d879a9e6767609ea51")  → []   (es Juan Carlos, existe)
```

Sin embargo, las otras dos variantes funcionan:

```
queryenEvento(variable:"usuario_id", valor:<uid>)        → 3 items OK
queryenEvento(variable:"compartido_array", valor:<uid>)  → 3 items OK
```

El resolver tiene una rama o un filtro que cuando `variable === "_id"` no encuentra el documento. **Esto rompe el refetch del evento tras un push real-time**, así que aunque los sockets se arreglen y `createNotifications` empiece a persistir, el comentario seguirá sin actualizarse en B sin recargar la página manualmente.

**Acción requerida:** revisar el branch `_id` del resolver de `queryenEvento`. Probablemente comparando con un campo MongoDB que requiere `ObjectId` y no `String`, o un filtro adicional que excluye los matches.

Otros operadores siguen con el mismo estado de antes del fix:

```
getNotifications(args:inputNotification, …)   → 400  Unknown argument "args" 
updateNotifications(args:inputNotification)   → 400  retorna EventoResponse! sin subfields
updateCustomer(args:inputCustomer)            → 400  Unknown type "inputCustomer"
updateActivity(args:inputActivity)            → 400  Unknown type "inputActivity"
updateActivityLink(args:inputActivityLink)    → 400  EventoResponse! sin subfields
addCompartitions(args:inputCompartition)      → 400  "Cannot query field addCompartitions on type Mutation"  ← EMPEORÓ: el campo entero ya no existe
getEventTicket(args:inputEventTicket)         → 400  Unknown type "inputEventTicket"
```

Confirmado: la migración api3-mcp dejó como placeholder no solo `createNotifications` sino también todas las mutations/queries con argumento `args:input...` complejo. Sigue pendiente arreglar las 7 anteriores.

---

## Alcance del problema (descubierto durante la auditoría)

El bug **no se limita a `createNotifications`**. Tras probar uno por uno todos los `input types` que el cliente sigue declarando en su capa GraphQL, **los 9 están ausentes del schema actual de api3-mcp**:

```
inputActivity         → Unknown type
inputActivityLink     → Unknown type
inputCompartition     → Unknown type
inputCongigTemplate   → Unknown type    (sic, typo en código del cliente: "Congig")
inputCustomer         → Unknown type
inputEventTicket      → Unknown type
inputFileData         → Unknown type    (¡afecta a createComment cuando hay attachments!)
inputNotification     → Unknown type
inputNotifications    → Unknown type
```

Cualquier mutation/query del cliente que reciba `args:input…` está rota. Eso afecta como mínimo (operaciones probadas, todas devuelven 400):

| Operación | Input type | Función de negocio que rompe |
|---|---|---|
| `updateCustomer(args:inputCustomer)` | inputCustomer | Actualizar datos de cliente |
| `updateActivity(args:inputActivity)` | inputActivity | Tracking de actividad de sesión |
| `updateActivityLink(args:inputActivityLink)` | inputActivityLink | Tracking de clicks/links |
| `addCompartitions(args:inputCompartition)` | inputCompartition | **Compartir un evento con un colaborador** |
| `updateCompartitions(args:inputCompartition)` | inputCompartition | **Modificar permisos de un colaborador** |
| `deleteCompartitions(args:inputCompartition)` | inputCompartition | **Quitar a un colaborador del evento** |
| `getEventTicket(args:inputEventTicket, …)` | inputEventTicket | Listado de tickets/entradas |
| `getNotifications(args:inputNotification, …)` | inputNotification | Listar notificaciones |
| `createNotifications(args:inputNotifications)` | inputNotifications | Crear notificaciones |
| `updateNotifications(args:inputNotification)` | inputNotification | Marcar notif como leída/recibida |

`createComment` se libra **solo cuando `attachments` viaja como array vacío**. Cuando un usuario adjunte un archivo a un comentario, su tipo `[inputFileData]` también fallará.

Las únicas operaciones del dominio notificaciones que funcionan (200 OK) son las dos que NO usan input types complejos: `markNotificationAsRead(notificationId: ID!)` y `getUnreadNotificationsCount` (sin args).

**Conclusión clave:** la migración api2→api3-mcp dejó stubs/placeholders en estos resolvers que apuntan a `EventoResponse` o `EventoResponse!` y removió todos los input types custom. **Esto bloquea funciones de negocio críticas: compartir eventos, crear notificaciones, tracking de actividad, modificar customer.**

## TL;DR

Tras la migración del proxy GraphQL de `apiapp` (legacy) a **api3-mcp** (commit `5855369e` del frontend, "fix: migrar proxy/graphql de apiapp (viejo) a api3-mcp"), la mutación **`createNotifications`** ha quedado desincronizada en el backend: el schema actual no coincide con la firma que sigue usando el cliente. Cada vez que un usuario escribe un comentario en una tarea de un evento compartido, el cliente intenta crear las notificaciones para los destinatarios y recibe **HTTP 400** con cuatro errores de validación de GraphQL.

Resultado funcional para el negocio:

- La campana de notificaciones **nunca suma** notificaciones nuevas (siempre `unreadCount: 0`).
- Los colaboradores de un evento compartido **no se enteran en tiempo real** cuando otro escribe un comentario (la persistencia del comentario en sí, vía `createComment`, sí funciona — sólo falla la notificación).
- En el cliente se muestra el toast "No se pudo enviar la notificación" cada vez que se intenta crear una.

Necesitamos del proveedor del backend que **alinee el schema de `createNotifications` con la firma legacy** (o que nos pase la nueva firma si decidieron cambiarla, para actualizar el cliente).

---

## 1. Reproducción exacta

Endpoint que prueba el proxy del frontend: `POST /api/proxy-bodas/graphql` (también probado en `/api/proxy/graphql`, mismo resultado).

### Request del cliente (idéntico a `apps/appEventos/utils/Fetching.ts:838-845`)

```http
POST /api/proxy-bodas/graphql
Content-Type: application/json
X-Development: bodasdehoy
Cookie: idTokenV0.1.0=…

{
  "query": "mutation ($args:inputNotifications){ createNotifications(args:$args){ total results{ _id } } }",
  "variables": {
    "args": {
      "type": "user",
      "message": "PROBE_TEST_NOTIF_CORRECT",
      "uids": ["OMkxtxExEgZHvVJVW249uZHq5eR2"],
      "fromUid": "<uid del autor>",
      "focused": "/probe"
    }
  }
}
```

### Respuesta actual del backend

```http
HTTP/1.1 400
{
  "errors": [
    { "message": "Unknown type \"inputNotifications\".", "locations": [{ "line": 1, "column": 17 }], "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" } },
    { "message": "Unknown argument \"args\" on field \"Mutation.createNotifications\".", "locations": [{ "line": 1, "column": 58 }], "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" } },
    { "message": "Cannot query field \"total\" on type \"EventoResponse\".", "locations": [{ "line": 1, "column": 71 }], "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" } },
    { "message": "Cannot query field \"results\" on type \"EventoResponse\".", "locations": [{ "line": 1, "column": 77 }], "extensions": { "code": "GRAPHQL_VALIDATION_FAILED" } }
  ]
}
```

`trace_id` recibidos en mis pruebas (para que el proveedor pueda correlacionar en sus logs):

- `777672bf-6003-409c-8d18-e65d3d01bbf2`
- `b3e5a8eb-5c20-44d6-9546-87bffc10fe59`
- `7fd6abcf-53dc-4b13-b24b-96c7039419ea`
- `cf2…` (truncado)

Stacktrace parcial reportado por el backend:

```
GraphQLError: Unknown type "inputNotifications".
    at Object.NamedType (/root/api-eventos/node_modules/graphql/validation/rules/KnownTypeNamesRule.js:57:…)
```

---

## 2. Lo que el cliente necesita del schema

El frontend espera, **literal**, la firma siguiente. Si cambia algún nombre, hay que reflejarlo después en el cliente:

```graphql
input inputNotifications {
  type: String           # "event" | "shop" | "guest" | "invitation" | "user"
  message: String        # texto HTML/plano de la notificación
  uids: [String]         # destinatarios (UIDs Firebase)
  fromUid: String        # autor de la acción (sólo cuando type = "user")
  focused: String        # path o link contextual (ej. "/itinerario?event=…&task=…&comment=…")
}

type Notification {
  _id: ID
  uid: String
  message: String
  state: String          # "sent" | "received" | "read"
  type: String
  fromUid: String
  focused: String
  createdAt: String
  updatedAt: String
}

type CreateNotificationsResult {
  total: Int
  results: [Notification]
}

extend type Mutation {
  createNotifications(args: inputNotifications): CreateNotificationsResult
}
```

Otras queries/mutations del mismo dominio que el frontend sigue usando y que conviene verificar también en api3-mcp, por si la migración las dejó igual de descolgadas:

| Operación | Tipo | Dónde la usa el cliente | Estado en api3-mcp |
|---|---|---|---|
| `createNotifications(args:inputNotifications)` | Mutation | `useNotification.ts` | 🔴 **400 — Unknown type "inputNotifications" + Unknown argument "args" + retorna EventoResponse** |
| `getNotifications(args:inputNotification, skip, limit)` | Query | `Notifications.tsx` (vista legacy + REST proxy) | 🔴 **400 — Unknown argument "args"/"skip"/"limit"** |
| `updateNotifications(args:inputNotification)` | Mutation | `Notifications.tsx` (mark as read en flujo legacy) | 🔴 **400 — Unknown argument "args" + retorna EventoResponse! (requiere subfields, schema mal)** |
| `markNotificationAsRead(notificationId)` | Mutation | `pages/api/notifications.ts` (proxy server-side) | ✅ 200 (probado con ID inválido → `{ success: false }`) |
| `getUnreadNotificationsCount` | Query | `pages/api/notifications.ts` | ✅ 200 (devuelve `0`) |

**3 de 5 operaciones del dominio notificaciones están rotas en api3-mcp.** Las que funcionan son las más simples (sin input types complejos). Las que fallan comparten el mismo síntoma: `args` no existe como argumento y los tipos de retorno apuntan a `EventoResponse` (parece un placeholder genérico que el resolver dejó en el migrate).

---

## 3. Otros hallazgos relacionados que conviene revisar en backend

### 3.0. Patrón común de fallo: las 3 mutations/queries con argumento `args:input...` están rotas

Probadas las cinco operaciones del dominio notificaciones desde el proxy `/api/proxy-bodas/graphql` con la sesión real del cliente:

```
createNotifications(args:inputNotifications)              → 400  Unknown type "inputNotifications"
getNotifications(args:inputNotification, skip, limit)     → 400  Unknown argument "args"/"skip"/"limit"
updateNotifications(args:inputNotification)               → 400  Unknown argument "args" + tipo de retorno EventoResponse!
markNotificationAsRead(notificationId: ID!)               → 200  OK
getUnreadNotificationsCount                               → 200  OK (devuelve 0)
```

Las tres que están rotas comparten síntomas:
1. El argumento `args` (que tomaba un input type) no existe.
2. El tipo de retorno aparece como `EventoResponse` o `EventoResponse!` (que es claramente un placeholder genérico de la migración, no el tipo real de notificaciones).
3. Los input types `inputNotifications` / `inputNotification` no están declarados en el nuevo schema.

Conclusión probable: durante la migración api2→api3-mcp, esos resolvers se sustituyeron por stubs que apuntan a `EventoResponse` y se perdieron los inputs específicos. Las dos operaciones que sí funcionan (`markNotificationAsRead` y `getUnreadNotificationsCount`) son las que **no usaban input types complejos**, por eso sobrevivieron a la migración.

### 3.1. `getNotifications` con tab=pending devuelve siempre vacío

Endpoint REST proxy: `GET /api/notifications?userId=<UID>&dev=bodasdehoy&tab=pending&page=1&limit=100` (proxy a api3-mcp `getNotifications` con filtro `read:false`).

**Probado con usuario carlos.carrillo@recargaexpress.com (UID `OMkxtxExEgZHvVJVW249uZHq5eR2`):**

```json
{ "success": true, "tab": "pending", "page": 1, "limit": 100, "total": 0, "unreadCount": 0, "notifications": [] }
```

A pesar de que el evento "Boda de Isabel & Raúl" tiene comentarios escritos por usuarios distintos a Carlos en los últimos días (visibles en `/servicios`), el backend no devuelve ninguna notificación pendiente para él. Posibles causas a confirmar:

1. El resolver `getNotifications` no está implementado en api3-mcp y está retornando vacío sin error.
2. El resolver existe pero filtra mal por `uid` (no asocia las notifs al destinatario correcto).
3. Las notifs nunca se persistieron porque `createNotifications` está roto (apartado 1).

La hipótesis 3 es la más probable: si `createNotifications` lleva días tirando 400, no hay nada en BD para que `getNotifications` devuelva.

### 3.2. Logout silencioso al enviar comentario

Síntoma reproducido por el usuario (no por mí, falta capturar con spy activo): al pulsar el botón de envío de un comentario en `/servicios`, la sesión actual queda en la URL `/servicios` pero "sin datos" (state vacío, sin event cargado). NO redirige a `/login`. Otras sesiones simultáneas en otros navegadores no se ven afectadas.

`createComment` devuelve 200 OK al backend (probado directamente), así que **no es esa mutation** la que dispara el deslogueo. Posibles causas a confirmar en backend:

1. Otra mutation en la cadena (`updateEvento`, `getEventsByID` post-`setEvent`, broadcast socket) responde 401/403 transitorio que el interceptor del cliente trata como expiración.
2. El resolver de notificaciones, al fallar con 400, hace efecto colateral en la conexión socket (cierre forzado) que el cliente interpreta como expiración.

Para diagnóstico definitivo necesitaríamos los logs del backend del momento exacto de un envío, correlacionados por `trace_id`.

---

## 4. Eventos socket que dependen del backend

El cliente está suscrito al socket en estos canales (después del fix `baeca782` del propio frontend):

```
socket.on("connect", …)
socket.on("app:message", …)         // Mutaciones colaborativas (joinRoom, setEvent, planSpaceActive, etc.)
socket.on("notification", …)        // Notificaciones nuevas para el user actual
socket.on("cms:message", …)         // Mensajes desde panel admin
socket.io.on("reconnect_attempt", …)
```

Pendientes de verificar en backend:

- ¿El resolver de `createComment` emite tras commitear un evento socket `app:message{action:"setEvent", value:event._id}` a la sala del evento (broadcast a TODOS los miembros, incluyendo o no al emisor)? El cliente espera que sí.
- Cuando `createNotifications` se arregle, ¿el resolver emitirá el evento socket `notification` a los UIDs destinatarios?
- El `joinRoom` del cliente (`socket.emit("app:message", {type:"joinRoom", payload:{action:"add", value:event._id}})`) ¿está siendo procesado y une al socket a la sala del evento?

---

## 5. Cómo confirmar el fix una vez aplicado

Una vez api3-mcp restaure (o documente la nueva firma de) `createNotifications`, este probe debería devolver `total >= 1` y persistir entradas:

```bash
curl -X POST 'https://app-dev.bodasdehoy.com/api/proxy-bodas/graphql' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -H 'Cookie: idTokenV0.1.0=<token-firebase-valido>' \
  -d '{"query":"mutation ($args:inputNotifications){ createNotifications(args:$args){ total results{ _id } } }","variables":{"args":{"type":"user","message":"smoke test","uids":["<uid-destinatario>"],"fromUid":"<uid-autor>","focused":"/test"}}}'
```

Esperado:

```json
{ "data": { "createNotifications": { "total": 1, "results": [{ "_id": "…" }] } } }
```

Y poco después:

```bash
curl 'https://app-dev.bodasdehoy.com/api/notifications?userId=<uid-destinatario>&dev=bodasdehoy&tab=pending&page=1&limit=20'
```

Esperado: `unreadCount: 1`, `notifications: [...]` con la entrada nueva.

---

## 6. Contexto del frontend para correlacionar

- Versión del frontend desplegada en `app-dev`: rama `main`, commits hasta `1984aa1a` (fix: campana notificaciones conectada a socket + error handling) más parche local pendiente de commitear (`useAllowed.tsx`, "home siempre permitida").
- `apps/appEventos/api.js` cambia de proxy según hostname:
  - localhost / `-test.` / `-dev.` → `/api/proxy` (server-side proxy)
  - producción → `process.env.NEXT_PUBLIC_BASE_URL`
- `pages/api/proxy/graphql.ts` y `pages/api/proxy-bodas/graphql.ts` reenvían a `resolveApiBodasGraphqlUrl()` (api3-mcp).
- El cliente sigue importando `queries.createNotifications` desde `apps/appEventos/utils/Fetching.ts:838-845`, sin cambios desde el día de la migración del proxy.

## 7. Prioridad y bloqueo

Bug bloqueante para el caso de uso "comentarios entre colaboradores en eventos compartidos". Mientras `createNotifications` esté en 400:

- La feature de campana en tiempo real no funciona — los usuarios no se enteran de que les escriben.
- El push del socket de la campana (que el frontend ya implementa correctamente) no llega porque no hay nada que persistir y emitir.

Una vez se arregle el schema:

- El frontend ya está listo para recibir el push (suscripción socket existente desde el commit `1984aa1a`).
- La campana se actualizará al instante, sin esperar al polling de 5 minutos.
- El UI marcará el icono en rojo + animación pulse cuando haya unread (parche local pendiente de commitear).

---

## Anexo: archivos del frontend relevantes

```
apps/appEventos/utils/Fetching.ts           — queries GraphQL (createNotifications, getNotifications, updateNotifications)
apps/appEventos/hooks/useNotification.ts    — wrapper que dispara createNotifications con el toast de error
apps/appEventos/components/Notifications.tsx— campana, suscripción socket "notification", polling fallback /api/notifications
apps/appEventos/components/DefaultLayout/SocketControlator.tsx — handler de socket "notification" + "app:message"
apps/appEventos/pages/api/notifications.ts  — proxy REST hacia api3-mcp con filters {read:false}
apps/appEventos/api.js                      — interceptor 401/403 → handleSessionExpired
```
