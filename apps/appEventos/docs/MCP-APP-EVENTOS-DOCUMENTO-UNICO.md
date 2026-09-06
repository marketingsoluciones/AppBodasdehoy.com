# API2 ↔ App eventos — documento único (copiar / Slack / ticket)

## 0. Mensaje oficial API2 → equipo App eventos (2026-04-18)

*(Texto recibido para referencia interna.)*

Hola equipo App eventos —

Os dejamos el acuerdo de coordinación con **API2** (2026-04-18), para que lo tengáis como referencia en un solo mensaje:

**Gobernanza**  
API2 marca **protocolo de escalado** y **contrato de interfaz** (GraphQL, enums, cabeceras, códigos de error, URLs de servicios). El cliente **se implementa y adapta** a ese contrato.

**Integración**  
• Eventos / invitados: API app (`NEXT_PUBLIC_BASE_URL` → POST `/graphql`).  
• Planes / `getMySubscription`: API2 (`NEXT_PUBLIC_API2_URL`).  
• Tiempo real: derivado de `NEXT_PUBLIC_BASE_API_BODAS` (o URL que acuerde **infra**). El GraphQL de API2 **no** sirve `/socket.io/`; 404 o DNS → revisar **host/path oficial del socket** o proxy, no el resolver.

**Suscripción**  
El enum `SubscriptionStatus` en esquema va en **MAYÚSCULAS**; en BD venía en minúsculas y rompía la query. **API2 corrige con field resolver** BD → enum. Tras **deploy verificado**, podéis volver a pedir **`status`** en `getMySubscription`. **`trial_end`** no tiene el mismo problema de enum.

**Escalado mínimo** (obligatorio si hay timeout/error duro)  
Entorno + timestamp + `event_id` + uid de prueba + captura HTTP/GraphQL **sin JWT** + enlace a ticket/deploy.

**Glosario**  
`creaInvitado` (vuestro repo) ↔ `agregarInvitado` (cita API2): mismo hueco de producto hasta unificar nombre en documentación.

**Cuota invitados (`guests-per-event`)**  
Hoy **no** hay paridad servidor/UI en la mutación de invitados; es **backlog** hasta definir códigos `errors[].code` y lógica en servidor.

Variables solo por nombre: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API2_URL`, `NEXT_PUBLIC_BASE_API_BODAS`.

Cualquier duda operativa: **un hilo por incidente** y pegáis enlace al ticket o deploy cuando cerréis.

Gracias — API2

---


**Un solo texto** con contexto front, respuestas API2, protocolo de escalado, checklist y borrador de mensaje.  
**Fecha:** 2026-04-18.

---

## A. Contexto front (app eventos)

- **API app:** `NEXT_PUBLIC_BASE_URL` → POST `/graphql` para eventos e invitados (`getEventsByID` / `queryenEvento`, etc.). Mutación típica de invitados en **este repo:** **`creaInvitado`** (`utils/Fetching.ts`).
- **API2:** `NEXT_PUBLIC_API2_URL` (p. ej. `https://api2.eventosorganizador.com/graphql`) → planes, `getSubscriptionPlans`, `getMySubscription` (`hooks/usePlanLimits.ts`).
- **Socket.IO:** derivado de `NEXT_PUBLIC_BASE_API_BODAS` (normalizado en `utils/resolveApi2BaseUrl.ts`). **Tiempo real:** salas por `event_id`, sincronización entre sesiones (`SocketControlator`: `setEvent`, `setPlanSpaceActive`, `setStatusComunicacion`, notificaciones). **No sustituye** los listados GraphQL: si el socket falla, hace falta **refrescar o re-fetch**.

---

## B. Qué responde API2 (texto acordado)

### B.1 GraphQL eventos (`getEventsByID` / `queryenEvento`, `usuario_id`, `compartido_array`)

Consultas contra **Mongo** con esos filtros; hay **índice** en `compartido_array`. **No** hay SLA/p95 fijo publicado en código: depende de carga, tamaño del documento y red.

Si hay **timeouts ~20 s**, hace falta **entorno**, **hora aproximada**, **id del evento**, **uid de prueba** (sin tokens) y captura de red para **correlación en logs**. No hay incidencia genérica documentada en repo sin trazas.

### B.2 Socket.IO

El **backend donde vive el GraphQL de API2** en este flujo **no expone** `/socket.io/`. Un **404** en `/socket.io/` sobre el mismo host que GraphQL indica que el **realtime va en otro servicio/host** o falta **proxy/rewrite** en infra. **`ERR_NAME_NOT_RESOLVED`** hacia `api2…` es **DNS/registro o entorno**, no un path que “falte” en el resolver GraphQL.

### B.3 `getMySubscription` / `SubscriptionStatus`

El **esquema** exige enum en **MAYÚSCULAS:** `ACTIVE`, `CANCELLED`, `SUSPENDED`, `EXPIRED`, `TRIAL`, `PAST_DUE`. En **BD** los valores estaban en **minúsculas** y eso podía **romper la query**. En API2 se corrige con **field resolver** que mapea BD → enum. **Tras deploy verificado**, el cliente puede **volver a pedir `status` y `trial_end`**. (Hoy el front **omite solo `status`** hasta deploy verificado del resolver; **`trial_end`** vuelve a pedirse — sin conflicto de enum según API2.)

### B.4 Multi-marca

Conviene **contrato estable** de cabeceras: **`Development`** (API app) y **`X-Development`** (API2). En API2 ya se lee `X-Development` con fallback.

### B.5 Cuota invitados (`guests-per-event`)

API2 indica que la mutación que ellos citan como **`agregarInvitado`** **no aplica aún** en servidor la cuota del plan (solo permisos de edición y push al array) ni devuelve `errors[].code` alineado a límites de plan: **paridad servidor/UI = backlog** hasta implementarlo (sin ETA en el mensaje original). En este monorepo la operación análoga en código es **`creaInvitado`** — mismo hueco de producto hasta que el servidor aplique cuota.

### B.6 Variables (solo nombres, nunca valores secretos)

`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API2_URL`, `NEXT_PUBLIC_BASE_API_BODAS`.

---

## C. Protocolo de escalado (mínimo obligatorio)

Al reportar timeout o error duro, incluir siempre:

1. Entorno (app-dev, test, prod, localhost).  
2. Timestamp (UTC o local) y correlation id si existe.  
3. `event_id` y uid de **prueba** (no datos de clientes finales).  
4. Captura o HAR: status HTTP + mensaje GraphQL (**sin JWT**).  
5. Enlazar **ticket o ventana de deploy** al abrir o cerrar el incidente.

---

## D. Checklists operativos

**Tras deploy del resolver `UserSubscription.status` (API2)**  
- [ ] Probar `getMySubscription` con `status` y `trial_end` sin error de enum.  
- [ ] Restaurar esos campos en `hooks/usePlanLimits.ts` y desplegar app eventos.  
- [ ] Pegar enlace al ticket/deploy en el hilo de Slack.

**Socket / realtime**  
- [ ] Infra: host + path **oficial** del servicio Socket.IO y rewrites si aplica.  
- [ ] (Opcional) Acordar `NEXT_PUBLIC_SOCKET_URL` si el realtime **no** comparte base con `NEXT_PUBLIC_BASE_API_BODAS`.

**Cuota invitados (backlog)**  
- [ ] Acordar códigos `errors[].code` con `utils/planLimitsCoordination.ts`.  
- [ ] Enlazar ETA/ticket cuando exista.

---

## E. Mejoras de coordinación sugeridas

1. En mensajes cruzados, glosario: **`creaInvitado` (repo appEventos)** vs **`agregarInvitado` (nombre citado por API2)**.  
2. **Un hilo por incidente** con cierre enlazado a deploy.  
3. **Changelog / aviso previo** ante cambios de esquema GraphQL que rompan clientes.

---

## F. Borrador para Slack (copiar y pegar)

**Asunto:** App eventos — protocolo API2 (GraphQL, Socket, suscripción, invitados)

Hola,

Aceptamos y dejamos registrado el acuerdo **2026-04-18**:

1. **Eventos GraphQL:** escalamos timeouts con entorno, timestamp, `event_id`, uid de prueba y captura (sin tokens) para trazas en Mongo (`compartido_array` indexado).  
2. **Socket:** confirmamos que el GraphQL API2 en ese host **no** sirve `/socket.io/`; pedimos a **infra** la **URL oficial** del realtime o el proxy adecuado (404/DNS fuera del grafo).  
3. **`SubscriptionStatus`:** tras **deploy verificado** del resolver BD→enum, reactivamos `status`/`trial_end` en el cliente; pedimos **enlace a ticket o ventana de deploy**.  
4. **Multi-marca:** mantener contrato claro `Development` / `X-Development`.  
5. **Cuota invitados:** entendido como **backlog** hasta paridad servidor/UI; cuando haya ETA, enlazamos ticket.

Variables solo por nombre: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API2_URL`, `NEXT_PUBLIC_BASE_API_BODAS`.

Gracias — quedamos atentos al enlace de deploy/ticket en este hilo.

---

## G. Referencias en código (repo)

- `apps/appEventos/hooks/usePlanLimits.ts` — query `getMySubscription`.  
- `apps/appEventos/utils/planLimitsCoordination.ts`, `planLimitFromApiError.ts` — cuotas y códigos.  
- `apps/appEventos/api.js` — GraphQL timeout; comentario `resolveSocketBaseUrl`.  
- `apps/appEventos/context/EventsGroupContext.tsx` — timeout consultas eventos.  
- `apps/appEventos/components/DefaultLayout/SocketControlator.tsx` — uso del socket.

---

## H. Seguimiento API2 — respuesta a las tres peticiones (2026-04-18)

**Para:** App eventos — recibido, gracias.

Confirmamos el acuerdo 2026-04-18 (gobernanza de contrato, escalado y glosario `creaInvitado` ↔ `agregarInvitado`).

**Sobre las tres peticiones:**

1. **Deploy `SubscriptionStatus` (BD → enum)**  
   El field resolver en `UserSubscription.status` está en **código API2**; pendiente **merge + deploy** por entorno. Cuando **staging/prod** esté verificado, API2 avisa en **el hilo** con **enlace a ticket y/o ventana de deploy** para que el cliente reactive `status` en `getMySubscription`. **`trial_end`** no está afectado por el bug de enum — el cliente puede seguir pidiéndolo sin esperar a ese deploy si ya lo tiene estable.

2. **Socket.IO / realtime**  
   API2 GraphQL **no** expone `/socket.io/` en el mismo proceso. El host/path **oficial** del socket lo fija **infra + propietario del servicio realtime** (o el proxy delante). API2 puede **acompañar** el acuerdo por escrito en el hilo una vez infra confirme URL. Si la base de `NEXT_PUBLIC_BASE_API_BODAS` **no** es el origen real del socket, lo sano es **`NEXT_PUBLIC_SOCKET_URL`** (nombre acordado) — **implementado en el cliente:** si está definida, Socket.IO usa esa URL; si no, sigue el comportamiento anterior con `NEXT_PUBLIC_BASE_API_BODAS`.

3. **Backlog cuota invitados (`guests-per-event`)**  
   Cuando exista **ticket con alcance + ETA**, API2 lo **enlaza en el hilo**. Hoy sigue siendo backlog sin fecha cerrada en ese mensaje.

**Escalado:** protocolo mínimo recibido (entorno, timestamp, `event_id`, uid de prueba, captura sin JWT, enlace ticket/deploy).

**Variables solo por nombre:** `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_API2_URL`, `NEXT_PUBLIC_BASE_API_BODAS`, `NEXT_PUBLIC_SOCKET_URL` (opcional).

Gracias — **API2 / backend** (texto recibido, consolidado aquí).

**Anexo técnico Socket (cliente):** ver sección **§I** más abajo para usos, handshake, payloads `emit`/`on` y checklist servidor — útil para que backend/infra implemente o valide el servicio realtime.


---

## I. Socket.IO en App eventos — usos, estructura y protocolo (para backend / infra)

Este apartado describe **solo lo que hace el cliente hoy** (`socket.io-client`, `apps/appEventos/api.js`, `SocketContext.tsx`, `SocketControlator.tsx`, etc.) para que el **servidor de realtime** y **infra** puedan validar compatibilidad o proponer cambios.

### I.1 Conexión (handshake)

- **Librería:** `socket.io-client` → `Manager(baseUrl)` y `manager.socket("/", { auth })` (namespace raíz `/`).
- **URL base:** `NEXT_PUBLIC_SOCKET_URL` si está definida (normalizada con la misma regla de host que `resolveApi2BaseUrl`); si no, `NEXT_PUBLIC_BASE_API_BODAS` (también normalizada).
- **Auth en handshake** (`auth` del socket):  
  - `token`: `Bearer <jwt>` desde cookie Firebase, o la cadena `"anonymous"`.  
  - `development`: marca / tenant (viene de `config.development` en contexto).  
  - `father`: query param opcional `?father=` de la URL.  
  - `origin`: `window.origin` del navegador.

El **GraphQL** de API2 **no** vive en el mismo proceso que Socket.IO (acuerdo previo); el servidor realtime debe aceptar esta forma de `auth` o documentar la alternativa.

### I.2 Eventos que el cliente **escucha** del servidor

| Nombre Socket.IO | Uso en cliente |
|------------------|----------------|
| `connect` / `disconnect` / `connect_error` | Logs y re-disparo de unión a sala (`reconet` en `SocketControlator`). |
| `app:message` | Canal principal de negocio (ver payloads §I.3). |
| `notification` | Empuja una notificación: se acumula en estado `notifications` (`SocketContext`) y la UI `Notifications.tsx` (lista inicial además viene de GraphQL `getNotifications` vía `fetchApiBodas`). |

**Nota:** En `SocketControlator` hay ramas para un canal `cms:message` en el estado local, pero **no** hay `socket.on("cms:message", ...)`; si el backend envía `cms:message`, hoy **no entraría** por socket salvo que lo encapsuléis dentro de `app:message` o añadáis listener en cliente.

### I.3 Payloads `emit` desde el cliente (**evento de socket:** `app:message`)

Todos los `emit` de producto usan el evento Socket.IO **`app:message`** y un **cuerpo JSON** con forma común:

```text
{
  event?: string | null,      // a veces null en joinRoom
  emit: string,               // uid del emisor (Firebase)
  receiver: string | null,    // null en join; en otras acciones suele ser event_id
  type: string,               // ver tabla abajo
  payload: { action: string, value: unknown }
}
```

**Casos concretos:**

| `type` | `payload.action` | `payload.value` | Cuándo se emite |
|----------|--------------------|-------------------|------------------|
| `joinRoom` | `add` | `event._id` | Al cambiar evento activo o reconectar; une cliente a la sala del evento (`SocketControlator`, también botones dev en `InfoDevelopment.js`). |
| `joinRoom` | `del` | `event._id` | Solo en **InfoDevelopment** (modo desarrollo), prueba de salir de sala. |
| `planSpaceActive` | `setPlanSpaceActive` | objeto **planSpaceActive** (espacio de plan seleccionado) | Cuando cambia el plan activo; `receiver` = `event._id`. |
| `event` | `setEvent` | `event._id` | Emisión periódica al mutar `event` en contexto (sincronía remota); `receiver` = `event._id`. |

**Quirk heredado:** en algunos `emit`, si un contador interno es ≤2, el **nombre del evento Socket** se manda como la cadena `"undefined"` en lugar de `app:message` (`SocketControlator`). Es comportamiento legacy; un servidor estricto podría ignorar esos paquetes; conviene alinear en backend o corregir en front en un refactors futuro.

### I.4 Payloads **entrantes** (`app:message` recibidos) — lo que hace la UI

El cliente trata el mensaje entrante como `msg` y deriva `payload.action`:

| `payload.action` | Efecto en App eventos |
|--------------------|-------------------------|
| `setEvent` | `payload.value` es el documento **Event** completo: se fusiona con estado local, permisos de compartidos, y se enriquecen usuarios vía GraphQL `getUsers` (`fetchApiBodas`). |
| `setPlanSpaceActive` | Actualiza `planSpaceActive` y el array `event.planSpace` si coincide el id. |
| `setStatusComunicacion` | Actualiza `statuses` de una comunicación en `invitados_array` (entregado/leído/etc., deduplicación por nombre+timestamp). |

**Usuario anónimo:** solo se procesa `setEvent` en flujo restringido (comentarios/itinerario en vistas públicas).

### I.5 Otros usos del socket en el repo

| Archivo | Uso |
|---------|-----|
| `components/Invitaciones/Test.tsx` (WhatsApp) | Escucha `app:message` con `qrCode`, `whatsapp_deleted`, `connected` en `payload.action` para flujo QR/sesión. |
| `components/InfoDevelopment.js` | Botones de prueba `joinRoom` add/del (solo en desarrollo). |
| `components/Notifications.tsx` | Combina lista inicial **HTTP** + empujones `notification` por socket. |

### I.6 Requisitos mínimos del servidor realtime (checklist para infra/backend)

1. **Socket.IO** (Engine.IO v4 compatible con el cliente) en la URL configurada (`NEXT_PUBLIC_SOCKET_URL` o base API).  
2. Aceptar `auth`: `token` (`Bearer …` o `anonymous`), `development`, `father`, `origin`.  
3. **Rooms** por `event_id`: el cliente hace `joinRoom` con `payload.value = event_id`; el servidor debe enrutar `app:message` con `receiver` / sala coherente con ese id.  
4. Redifusión: cuando un cliente envía `setEvent` / `setPlanSpaceActive` / estados de comunicación, el servidor debería **broadcast** a otros miembros de la misma sala de evento (comportamiento esperado por la UX colaborativa).  
5. Evento `notification`: cuerpo compatible con lo que `Notifications.tsx` concatena a `results`.  
6. (Opcional) Unificar emisión siempre a `app:message` y **eliminar** emits a `"undefined"` en el cliente en un PR futuro.

### I.7 Relación con GraphQL

Listas, CRUD y notificaciones **históricas** siguen yendo por **GraphQL/REST**; el socket es **delta en vivo**. Si el socket cae, la app **sigue** con datos vistos al último fetch; hace falta refrescar o repetir consultas para alinear.

---

## J. Cursor (agente IA) vs Slack — canal establecido `#copilot-api-ia`

### Qué está definido en el proyecto

- **Canal acordado:** `#copilot-api-ia` (ID por defecto `C0AEV0GCLM7` en `scripts/slack-send.sh`).
- **Envío:** `./scripts/slack-send.sh [--copilot|--web] "mensaje"` desde la **raíz del monorepo**; lee **`.env`** con `SLACK_BOT_TOKEN` (preferido) o webhooks (`SLACK_WEBHOOK_FRONTEND`, etc.). Ver comentarios al inicio de `scripts/slack-send.sh`.
- **Lectura:** `scripts/slack-read.sh` (mismo `.env`).
- **Reglas:** `.cursor/rules/mcp-slack-plan-invites.mdc` y `scripts/cursor-global-rule-mcp-slack.txt` (pegar en Cursor → Rules si queréis que todos los workspaces lo recuerden).

### Por qué el agente de Cursor **no** “habla solo” por Slack

1. **No hay integración Slack obligatoria en el IDE:** el asistente en el chat **no recibe** vuestro `SLACK_BOT_TOKEN` ni ejecuta scripts salvo que **vosotros** lo hagáis en la terminal o un hook lo dispare.
2. **Seguridad:** los tokens van en `.env` (gitignore); no deben pegarse en el chat; el agente **no debe** inventar envíos sin credenciales reales.
3. **“api-ia tiene acceso a todo”** suele referirse al **equipo / producto api-ia** y a los **bots** que ya están en Slack con permisos — **no** implica que cada sesión de Cursor en un portátil tenga el mismo acceso automático.

### Cómo coordinar bien en la práctica

| Quién | Acción |
|-------|--------|
| **Humano** | Ejecutar `slack-send.sh` con el texto acordado (p. ej. anexo §I o mensaje de protocolo). |
| **Agente Cursor** | Redactar mensajes, unificar docs (`MCP-APP-EVENTOS-DOCUMENTO-UNICO.md`), código; **pedir** que el humano pulse envío si hace falta llegar a Slack. |
| **Equipo api-ia** | Responder en `#copilot-api-ia` o enlazar tickets; es el canal único documentado para Front ↔ api-ia. |

Si queréis que **cada PR** avise a Slack, eso sería **CI (GitHub Actions)** o **hook de Cursor** con script — no viene activado por defecto en este repo.

---

## K. Siguientes pasos (orden rápido)

1. **Slack:** mensajes enviados a **#copilot-api-ia** (resumen doc + recordatorio de bloqueantes). Siguientes avisos: cuando haya URL socket o deploy status.
2. **Infra:** confirmar URL Socket.IO oficial → setear `NEXT_PUBLIC_SOCKET_URL` en Vercel/.env si no coincide con `NEXT_PUBLIC_BASE_API_BODAS`.
3. **Tras aviso MCP** (deploy `SubscriptionStatus`): añadir `status` otra vez en `GET_MY_SUBSCRIPTION` en `hooks/usePlanLimits.ts` y desplegar app eventos.
4. **Cuota invitados:** cuando MCP enlace ticket+ETA, alinear `creaInvitado` / códigos con `planLimitsCoordination.ts`.
5. **Cliente (hecho en repo):** emits socket ya no usan el nombre de evento `"undefined"`; siempre `app:message` (`SocketControlator.tsx`).

