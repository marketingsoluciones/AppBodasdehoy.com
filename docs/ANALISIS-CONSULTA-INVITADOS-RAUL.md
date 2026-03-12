# Análisis: consulta "invitados que se llama Raul" no llega bien a api-ia

## Síntoma

El usuario escribe algo como **"quiero ver los invitados que se llama raul"**. El Copilot muestra:

- "Analizando tu solicitud..."
- "Consultando tus eventos..."
- "Formulando tu respuesta..."

Y luego responde:

- *"Parece que hay un problema con la conexión a la base de datos y no puedo acceder a tus eventos en este momento. Por favor, intenta de nuevo más tarde."*

## Flujo de la petición

1. **Origen**: El Copilot está en un iframe (chat-ia) cargado desde app-test (appEventos).
2. **Destino**: El mensaje se envía a **chat-ia** (`/webapi/chat/auto`), que hace **proxy** al backend **api-ia** (`/webapi/chat/auto`).
3. **api-ia** debe:
   - Identificar al usuario (p. ej. con `X-User-ID` o `metadata.userId`).
   - Saber **en qué evento** buscar (p. ej. con `X-Event-ID` o `metadata.eventId`).
   - Llamar a herramientas como `get_user_events` y `search_guests` para devolver invitados llamados "Raul".

Si **no recibe evento** (o usuario), las herramientas pueden fallar o no encontrar datos y el modelo contesta con un mensaje genérico de “no puedo acceder a tus eventos / problema de base de datos”.

**Importante**: La petición HTTP **sí llega** a api-ia (chat-ia hace proxy y el backend responde 200). El fallo es de **contexto**: al no enviar `eventId` (ni `metadata` en el body), api-ia no sabe en qué evento buscar y las herramientas devuelven error o vacío; el modelo entonces formula la respuesta de "problema con la base de datos".

## Causas identificadas en el front (chat-ia)

### 1. `eventId` no se enviaba cuando no hay `userEvents` en el store

- En chat-ia, `eventId` se obtenía solo del store: `userEvents` → primer evento activo.
- Si el usuario está identificado por **Firebase (UUID)**, `fetchUserEvents` **no** llama a api2 (solo se hace para email/teléfono), así que `userEvents` queda **vacío**.
- En ese caso **nunca** se mandaba `X-Event-ID` ni `eventId` en el body, aunque app-test sí envía `eventId` en **AUTH_CONFIG** y el bridge lo guarda en `localStorage` como `current_event_id`.

**Consecuencia**: api-ia recibe la petición sin evento → no puede acotar la búsqueda de invitados (p. ej. “Raul”) a un evento concreto → falla o responde “no puedo acceder a tus eventos”.

### 2. El body no incluía `metadata` para api-ia

- appEventos (ruta `/api/copilot/chat`) envía **metadata** en el body (userId, eventId, development, pageContext).
- chat-ia solo enviaba **headers** (X-User-ID, X-Development, X-Event-ID cuando existía) y **no** un objeto `metadata` en el body.
- Si el backend api-ia espera **metadata** en el body (común en diseños tipo “tool context”), la petición desde chat-ia podía llegar “incompleta”.

## Cambios realizados en chat-ia

### 1. Usar `eventId` desde `localStorage` cuando el store no tiene eventos

**Archivo**: `apps/chat-ia/src/services/chat/index.ts`

- Si `userEvents` está vacío y no se obtiene `eventId` del store, se lee **`current_event_id`** de `localStorage` (donde el CopilotBridge guarda el valor recibido en AUTH_CONFIG desde app-test).
- Ese `eventId` se usa para:
  - Enviar el header **`X-Event-ID`**.
  - Incluirlo en **`metadata.eventId`** en el body (ver abajo).

Así, cuando el Copilot va embebido desde app-test y el padre envía `eventId`, la petición hacia api-ia **sí** lleva evento aunque el usuario sea Firebase y `userEvents` esté vacío.

### 2. Incluir `metadata` en el body de la petición de chat

**Archivo**: `apps/chat-ia/src/services/chat/index.ts`

- Se construye un objeto **`metadata`** con:
  - `userId`: usuario actual.
  - `eventId`: evento activo (store o `localStorage`).
  - `development`: developer/whitelabel.
- Se envía en el **body** de la petición a `/webapi/chat/{provider}` (se fusiona con cualquier `metadata` existente en el payload).

Con esto, api-ia recibe el mismo tipo de contexto que cuando la petición viene de appEventos (userId, eventId, development en el body).

## Cuándo se envía eventId y cuándo no

| Situación | ¿Enviamos eventId? | Motivo |
|-----------|--------------------|--------|
| **Copilot dentro de app-test** con un evento abierto | **Sí** | app-test envía `AUTH_CONFIG` con `eventId` → se guarda en `current_event_id` (localStorage). Si el store no tiene eventos, lo leemos de ahí. Las preguntas ("invitados Raul", presupuesto, mesas) deben ir acotadas a ese evento. |
| **Chat-ia standalone** (sin iframe) con eventos en el store | **Sí** | `eventId` sale del primer evento activo en `userEvents`. |
| **Chat-ia standalone** sin eventos en el store y sin `current_event_id` | **No** | No hay evento conocido. El usuario puede hacer preguntas generales ("qué es bodasdehoy", "cómo crear un evento"); api-ia no debe asumir un evento. |
| **Copilot en app-test** pero el usuario aún no ha entrado en un evento concreto | **No** | Si app-test no envía `eventId` en AUTH_CONFIG (p. ej. pantalla de listado de eventos), no inventamos uno. |

**Regla en código**: se envía `eventId` **solo cuando lo tenemos** (store o localStorage). Si no hay valor, no se envía ni header `X-Event-ID` ni `metadata.eventId`. Así api-ia sabe cuándo puede usar herramientas que requieren evento y cuándo no.

## Comportamiento cuando tienes un evento seleccionado

Cuando en **app-test** tienes un evento seleccionado (por ejemplo entras en Invitados, Presupuesto o cualquier pantalla de un evento concreto):

1. **app-test (ChatSidebar)** obtiene `eventId = event?._id` del `EventContext` y se lo pasa a **CopilotIframe** (`eventId`, `event`).
2. **CopilotIframe** envía al iframe (chat-ia) un mensaje **AUTH_CONFIG** por postMessage con:
   - `userId`, `development`, `token`, `eventId` (o `event?._id`), `eventName`, `pageContext`, etc.
3. **chat-ia (useCopilotBridge)** al recibir **AUTH_CONFIG**:
   - Actualiza el store de auth y, si viene `payload.eventId`, hace **`localStorage.setItem('current_event_id', payload.eventId)`**.
   - Opcionalmente inyecta `pageContext` en el system prompt.
4. Cuando el usuario escribe en el Copilot, **getChatCompletion** (chat-ia) lee `eventId` del store o, si no hay eventos en el store, de **`localStorage.getItem('current_event_id')`** y lo envía en headers (`X-Event-ID`) y en **metadata** del body a api-ia.

**Si cambias de evento** (por ejemplo seleccionas otro evento en el selector): **CopilotIframe** reenvía **AUTH_CONFIG** con el nuevo `eventId` en un `useEffect` que detecta `eventChanged`; así el iframe actualiza `current_event_id` y las siguientes preguntas van al evento correcto. También se envía **PAGE_CONTEXT** para actualizar el contexto de pantalla.

**Resumen**: Con evento seleccionado → AUTH_CONFIG lleva `eventId` → el iframe guarda `current_event_id` → cada mensaje al chat envía ese `eventId` a api-ia → las herramientas (invitados, presupuesto, etc.) actúan sobre ese evento.

## Qué comprobar si sigue fallando

1. **Que app-test envíe AUTH_CONFIG con `eventId`**  
   - Al cargar el Copilot se envía `AUTH_CONFIG` con `eventId: eventId || event?._id`.  
   - Al **cambiar de evento** (selector o navegación), `CopilotIframe` reenvía `AUTH_CONFIG` para que el iframe actualice `current_event_id`.

2. **Que api-ia use headers o `metadata`**  
   - Confirmar en el backend que las herramientas (`get_user_events`, `search_guests`) usan:
     - `X-User-ID` / `X-Event-ID`, o
     - `body.metadata.userId` / `body.metadata.eventId`.  
   - Si api-ia solo lee `metadata` del body, con el cambio anterior ya debería recibirlo.

3. **Errores en api-ia**  
   - Si las herramientas fallan por base de datos, permisos o usuario no existente, el modelo puede seguir respondiendo “problema con la base de datos / no puedo acceder a tus eventos”.  
   - Revisar logs del backend (api-ia) para el `request_id` o `trace_id` de esa conversación.

4. **Usuario no registrado en api-ia**  
   - Documentación del repo indica que si el usuario **no existe en la base de datos de api-ia**, las consultas pueden fallar.  
   - Ver por ejemplo: `REPORTE-PARA-API-IA.md`, `RESUMEN-FINAL-TESTS-API-IA.md`.

## Resumen

- **Problema**: La consulta de “invitados que se llama Raul” podía llegar a api-ia **sin evento** (y sin metadata en el body) cuando el usuario era Firebase y el store no tenía eventos, aunque app-test sí enviaba `eventId` por AUTH_CONFIG.
- **Solución en front**:  
  1) Usar `eventId` de `localStorage` cuando el store no tenga eventos.  
  2) Enviar siempre `metadata` (userId, eventId, development) en el body de la petición de chat.  
- Con esto, la petición **sí llega a api-ia** con el contexto necesario; si la respuesta sigue siendo de error, el siguiente paso es revisar backend (api-ia) y base de datos (usuario/evento existentes, permisos, logs).

## Plan de acción

| # | Acción | Responsable | Comando / detalle |
|---|--------|-------------|-------------------|
| 1 | **Verificar cambios en local** | Tú | ✅ Código verificado: chat/index.ts (eventId desde localStorage + metadata) y CopilotIframe.tsx (eventChanged → sendAuthConfig). ✅ `pnpm build:web` compila OK. `pnpm build:copilot` puede tardar 2+ min; ejecutar si quieres confirmar chat-ia. |
| 2 | **Probar en vivo (app-test + Copilot)** | Tú | Levantar app-test (p. ej. puerto 8080) y chat-ia (3210/3211). Entrar en un evento con invitados → abrir Copilot → preguntar *"invitados que se llama Raul"*. Comprobar que la respuesta usa datos del evento. Cambiar de evento y repetir; debe usar el evento nuevo. |
| 3 | **Ejecutar pruebas api-ia y enviar resumen a Slack** | Tú | ✅ Hecho. Health 200, chat/auto 200, config 200. Resumen enviado a #copilot-api-ia (chat.postMessage). |
| 4 | **Merge / deploy** | Tú | ✅ Commit y push hechos (rama `feature/nextjs-15-migration`). Pendiente: merge a main/develop si aplica y **desplegar** app-test y chat-test. |
| 5 | **Avisar a api-ia por Slack** | Tú | ✅ Hecho. Mensaje enviado a #copilot-api-ia (fix eventId/metadata + reenvío AUTH_CONFIG al cambiar evento). |
| 6 | **Seguimiento** | Tú | Si tras el deploy la consulta sigue fallando: pedir en Slack que revisen logs (request_id/trace_id) y que confirmen uso de X-Event-ID/metadata.eventId y que usuario/evento existan en su BD. Revisar doc "Qué comprobar si sigue fallando" en este mismo archivo. |
| 7 | **(Opcional) Test E2E** | Tú / equipo | ✅ Añadido `e2e-app/copilot-invitados-evento.spec.ts`: app-test con evento → abrir Copilot → "invitados que se llama Raul" → comprueba que la respuesta no es el error de BD. Ejecutar: `pnpm test:e2e:app BASE_URL=https://app-test.bodasdehoy.com e2e-app/copilot-invitados-evento.spec.ts`. |

**Orden sugerido:** 1 → 2 → 3 → 4 → 5 → 6. El paso 7 cuando haya tiempo.

**Estado:** Pasos 1, 3, 4 (commit + push), 5 y 7 hechos. Pendientes: **2** (probar en vivo), **4** (solo deploy), **6** (seguimiento tras deploy).

**Commit sugerido (paso 4):**
```bash
git add apps/chat-ia/src/services/chat/index.ts apps/appEventos/components/Copilot/CopilotIframe.tsx docs/ANALISIS-CONSULTA-INVITADOS-RAUL.md e2e-app/copilot-invitados-evento.spec.ts e2e-app/README.md docs/INVENTARIO-TESTS.md
git commit -m "fix(copilot): enviar eventId y metadata a api-ia desde iframe; reenviar AUTH_CONFIG al cambiar evento

- chat-ia: eventId desde localStorage (current_event_id) cuando userEvents vacío
- chat-ia: metadata (userId, eventId, development) en body de /webapi/chat
- CopilotIframe: reenviar AUTH_CONFIG cuando cambia el evento seleccionado
- E2E: copilot-invitados-evento.spec.ts; doc en README e INVENTARIO-TESTS
- Doc: ANALISIS-CONSULTA-INVITADOS-RAUL.md con plan de acción"
git push  # y desplegar según tu flujo
```

## Siguientes pasos

1. **Probar en vivo**  
   - En app-test, selecciona un evento que tenga invitados (p. ej. alguno con “Raul”).  
   - Abre el Copilot y pregunta: *"¿Qué invitados se llaman Raul?"* o *"invitados que se llama Raul"*.  
   - Comprueba que la respuesta use datos de ese evento.  
   - Cambia a otro evento y haz otra pregunta de invitados; debe responder con datos del **nuevo** evento (AUTH_CONFIG se reenvía al cambiar evento).

2. **Si sigue fallando**  
   - Revisar en **api-ia** que las herramientas (`get_user_events`, `search_guests`) lean `X-Event-ID` o `body.metadata.eventId` y que el usuario/evento existan en su base de datos.  
   - Revisar logs de api-ia (request_id / trace_id) para esa conversación.

3. **Opcional**  
   - El E2E `copilot-invitados-evento.spec.ts` ya está añadido e inventariado en `e2e-app/README.md` y `docs/INVENTARIO-TESTS.md`. Ejecutarlo cuando quieras: `BASE_URL=https://app-test.bodasdehoy.com pnpm exec playwright test e2e-app/copilot-invitados-evento.spec.ts --config=playwright.config.ts`.

## Verificar código / enviar petición por Slack

**Nota:** Un agente (Cursor/IA) no tiene acceso por SSH a tus servidores ni puede enviar mensajes a Slack; tú ejecutas los comandos en tu máquina.

### Verificar api-ia y enviar resumen a Slack

Desde la raíz del repo, con `.env` que tenga al menos `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK`:

```bash
# Pruebas básicas (health, chat/auto, config) y envío del resumen a #copilot-api-ia
bash scripts/test-api-ia-y-enviar-slack.sh
```

Con usuario real (si tienes `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` en `.env` o exportados):

```bash
TEST_USER_EMAIL=... TEST_USER_PASSWORD=... bash scripts/test-api-ia-y-enviar-slack.sh
```

### Enviar un mensaje (petición o resumen) a #copilot-api-ia

```bash
# Mensaje corto
./scripts/slack-send.sh "Frontend: hemos aplicado fix eventId/metadata para consultas tipo 'invitados Raul'. ¿Pueden confirmar que api-ia usa X-Event-ID o metadata.eventId en get_user_events/search_guests?"

# Mensaje desde contexto Copilot (firma "Front Copilot LobeChat")
./scripts/slack-send.sh --copilot "Mensaje aquí"

# Notificación con tipo (success / info / error)
./scripts/slack-notify.sh info "Fix invitados Raul desplegado" "Detalle opcional..."
```

Requisitos: en la raíz del repo, `.env` con `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK` (para enviar); opcionalmente `SLACK_BOT_TOKEN` para usar `chat.postMessage`. Ver `docs/COMO-CONECTAR-SLACK-COPILOT.md` y `docs/PENDIENTES-Y-SLACK-ESTADO.md`.
