# HANDOFF QA — Comunicación & Notificaciones (Sprint 09-jul)

**Para**: agente QA que ejecutará las baterías.
**De**: COORD AppEventos (Juan Carlos).
**Objetivo global**: validar que TODOS los caminos de comunicación entre usuarios (invitados, organizador, equipo, IA) funcionan end-to-end en `dev-live` sin regresiones tras los ~30 commits promovidos hoy (Refactor D, FASE B v2.0 Bandeja, SPRINT 4 Web Push, Memory UI, CRM_Note, drafts M1, fixes BUG-04/08/09/11).

---

## 0. Contexto de negocio (imprescindible)

**Bodas de Hoy** es un organizador de eventos. La cadena de valor de la comunicación es:

```
        [E] Auth
         │
         ▼
  ┌─────────────┐          ┌─────────────┐          ┌──────────────┐
  │  Organizador│ ◄── C ──►│    Equipo   │          │   Invitados  │
  │  (planner)  │          │(asistentes) │          │ (asisten o no)│
  └──────┬──────┘          └──────┬──────┘          └───────┬──────┘
         │                        │                         │
         │◄──── B ── notif ───────┘                         │
         │                                                  │
         └──────────── A ── bandeja mensajes ───────────────┤
         │                                                  │
         ▼                                                  ▼
        [D] Agente IA (Copilot)                     [A.RSVP] Portal público
```

Cada letra = área de test. **Todas deben funcionar simultáneamente sin bloquearse entre sí.**

---

## 1. Actores y credenciales

Cargar variables desde `.env.e2e.dev` (raíz del repo).

| Rol | Email | Contraseña | Uso |
|---|---|---|---|
| **DUEÑO / SUPER-ADMIN** | `bodasdehoy.com@gmail.com` | ver `TEST_USER_PASSWORD` | Es el organizador principal. Dueño de sus eventos. Recibe todas las notificaciones. |
| **INVITADO / SECUNDARIO** | `jcc@bodasdehoy.com` | ver `TEST_PASSWORD` | Ve un evento **compartido con permiso viewer/write**. Su vista es limitada. |
| **INVÁLIDO / INEXISTENTE** | `jcc@marketingsoluciones.com` | ver `TEST_ADMIN_PASSWORD` | Se usa para probar que el login inválido se **rechaza correctamente** (no debe funcionar; si funciona, es un bug de auth). |

### Eventos

- **PROTEGIDO — NUNCA MODIFICAR**: `Boda Isabel & Raúl` (`_id 66a9042dec5c58aa734bca44`). Puede leerse, NO tocar (borrar/editar/crear invitados/borrar notas/…). Regla vital: hay E2E y datos de otros equipos vivos ahí.
- **Para escritura**: crear un evento nuevo al inicio de la sesión (`Boda Test QA 09-jul` o similar) y **borrarlo al final** (cleanup).

### Entornos

- `BASE_URL=https://app-dev.bodasdehoy.com` (appEventos)
- `CHAT_URL=https://chat-dev.bodasdehoy.com` (chat-ia)
- `MEMORIES_URL=https://memories-dev.bodasdehoy.com`

---

## 2. Reglas críticas (NO negociables)

1. **Playwright con `webkit`**. NUNCA chromium. `PLAYWRIGHT_BROWSER=webkit`.
2. **NO tocar `Boda Isabel & Raúl`**. Regla vital.
3. **Cleanup obligatorio**: al final de cada batería que cree datos, borrarlos. Si un test crashea a mitad → siguiente comienzo del run empieza con cleanup preventivo.
4. **Bateras pequeñas 1-3 tests máximo**, validar y avanzar. NUNCA lanzar suite completa (`bun run test`) — tarda ~10min y consume tokens innecesarios.
5. **Detectar runtime errors UI** además de asserts: escuchar `page.on('pageerror')` y `page.on('console')` con nivel error, y **abortar el test si aparece** un error runtime. Reportarlo.
6. **Health-check bypass**: usar `E2E_SKIP_HEALTH=1` para no exigir servidor local.
7. **2-strikes rule**: si un mismo fix falla 2 veces, PARAR y buscar root cause. No insistir a ciegas.
8. **NO tocar `apps/appEventos/`** para arreglar bugs — reportar y esperar. Sí se puede tocar `apps/chat-ia/` para fixes obvios de UI.
9. **Solo lectura SSH backends**. Backend fixes NO son tarea de QA.
10. **Formato reporte**: al terminar, tabla resultado por batería + evidencias (screenshots, logs). Postear en Slack canal `C0AV8EV5495` hilo `1778170638.897419` con formato DE/PARA/DRI/ASUNTO (ver §7).

---

## 3. Comandos de arranque

```bash
# desde raíz del repo
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com

# Verificar salud entornos ANTES de empezar
curl -s -o /dev/null --max-time 15 -w "app-dev: %{http_code}\n" https://app-dev.bodasdehoy.com/
curl -s -o /dev/null --max-time 15 -w "chat-dev: %{http_code}\n" https://chat-dev.bodasdehoy.com/
curl -s --max-time 15 https://chat-dev.bodasdehoy.com/ | grep -oE 'BUILD_ID_ESPERADO_[A-Za-z0-9_-]+' # confirmar build

# Correr un spec E2E individual (patrón obligatorio)
E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit E2E_SKIP_HEALTH=1 \
  npx playwright test e2e-app/<spec>.spec.ts --reporter=line

# Vitest unitario chat-ia
cd apps/chat-ia && bunx vitest run --silent='passed-only' '<pattern>'
```

---

## 4. Baterías de test — con OBJETIVO explícito por escenario

Cada test tiene:
- **OBJETIVO**: qué demuestra este test.
- **ACTOR**: qué usuario ejecuta.
- **PRECOND**: estado inicial.
- **PASOS**: acciones concretas.
- **EXPECT PASA**: qué se ve si funciona.
- **EXPECT FALLA**: qué señal indica bug (NO qué causa).
- **CLEANUP**: qué borrar al final.

---

### 🔔 BATERÍA B — Notificaciones al ORGANIZADOR

Prioridad P0. Sin esto, el organizador no sabe qué pasa en su evento.

#### B1 — Web Push subscribe end-to-end (**parte automatizable**)

- **OBJETIVO**: verificar que el pipeline VAPID + subscribe + persistir funciona hasta el POST al backend, sin depender del prompt del OS.
- **ACTOR**: DUEÑO logueado en `chat-dev/settings/advanced`.
- **PRECOND**: browser context con permission `granted` preseteado (Playwright `context.grantPermissions(['notifications'], {origin: CHAT_URL})`).
- **PASOS**:
  1. `page.goto(CHAT_URL + '/settings/advanced')`
  2. Localizar card "Notificaciones en este dispositivo" (`data-testid="push-subscribe"`)
  3. Interceptar network: `page.route('**/api/push/subscribe', ...)` y `page.route('**/api/push/vapid-public-key', ...)`
  4. Click botón "Activar notificaciones"
  5. Esperar POST a `/api/push/subscribe`
- **EXPECT PASA**:
  - GET `/api/push/vapid-public-key` → 200 con `publicKey` de 87 chars
  - POST `/api/push/subscribe` → 200 con body `{endpoint, keys:{p256dh,auth}, subscribedAt, userAgent}`
  - Botón cambia a `data-testid="push-subscribed"` (verde "Notificaciones activas")
- **EXPECT FALLA**: cualquier request 4xx/5xx, botón no cambia, o `pageerror` disparado.
- **CLEANUP**: click "Desactivar" → DELETE `/api/push/subscribe` → botón vuelve a "Activar".

#### B2 — Campana in-app (`getNotifications` + polling + Socket)

- **OBJETIVO**: verificar que la campana carga notifs reales, cuenta unread correcto, polling cada 60s, y evento Socket `"notification"` refresca la lista.
- **ACTOR**: DUEÑO en `app-dev`.
- **PRECOND**: al menos 1 notificación pending del DUEÑO en Mongo (verificar antes con curl al proxy).
- **PASOS**:
  1. Login DUEÑO → dashboard
  2. Localizar icono campana → click → despliega dropdown
  3. Verificar 3 tabs: Actual / Pendientes / Historial (data-testids en `apps/appEventos/components/Notificaciones`)
  4. Contar items en Actual → debe coincidir con `unreadCount` badge
  5. Click en una notif → mutation `markNotificationAsRead` → badge decrementa
  6. Esperar 65s con Network abierto → verificar que aparece GET `/api/notifications?tab=pending` (polling)
  7. Trigger evento socket falso (`page.evaluate` a `window.socket.emit('notification', {...})`) → nueva notif en la lista sin refresh
- **EXPECT PASA**: cada paso responde 2xx; badge se actualiza; polling ocurre a los 60s.
- **EXPECT FALLA**: 502 en `/api/notifications` (bug `SUPPORT_SECRET_KEY` roto), badge no baja al click, polling no dispara, socket no reconecta.
- **CLEANUP**: ninguno (no crea data).

#### B3 — `comment_added` end-to-end cross-app

- **OBJETIVO**: verificar el flujo completo desde que se genera un comentario en chat-ia hasta que aparece en la campana de appEventos.
- **ACTORES**: 2 sesiones simultáneas del DUEÑO (window/context distintos):
  - Session A: `chat-dev` con conversación abierta
  - Session B: `app-dev` con campana visible
- **PRECOND**: ambas sesiones activas + Socket conectado en B.
- **PASOS**:
  1. En A, crear una nota interna con `@mención` al DUEÑO desde `NotesPanel` de una conversación (fixture entity CONTACT).
  2. Comprobar en Network A: mutation `createCRMNote` con `mentions[]` conteniendo el userId del DUEÑO.
  3. En B **sin refrescar**, verificar que en 5s aparece nueva notif en campana (evento socket + `getNotifications` refetch).
  4. Click en la notif → navega al deep link de la conversación en chat-ia.
- **EXPECT PASA**: notif aparece <5s, tipo `comment_added`, click lleva a la conversación correcta.
- **EXPECT FALLA**: la notif nunca llega (backend no emite), llega pero sin deep link, o timeout.
- **CLEANUP**: borrar la nota creada (mutation `deleteCRMNote`).

---

### 💬 BATERÍA A — Bandeja mensajes con INVITADOS

Prioridad P0. Es el uso más común del sistema.

#### A1 — Recepción de mensaje en conversación existente

- **OBJETIVO**: verificar que el SSE `/api/messages/stream` sigue empujando mensajes nuevos tras el refactor SSE singleton.
- **ACTOR**: DUEÑO en `chat-dev/messages/whatsapp/{conv_id}` con una conversación de un invitado ficticio.
- **PRECOND**: conversación existente con historia de mensajes (fixture o buscar la primera con `unreadCount>0`).
- **PASOS**:
  1. Abrir conversación → verificar mensajes cargan (query `getMessages`)
  2. Trigger un mensaje entrante desde api-mcp (curl a mutation `sendInboundMessage` con el JID del invitado ficticio)
  3. Verificar SSE frame llega al browser (Network → EventStream tab)
  4. Verificar el mensaje aparece en la UI sin refresh
- **EXPECT PASA**: mensaje aparece en <2s, unreadCount++, avatar de la conversación en lista mueve al top.
- **EXPECT FALLA**: mensaje no aparece (SSE roto), duplicado (bug store singleton), aparece pero sin timestamp.
- **CLEANUP**: no aplica en dev (mensaje fake se queda).

#### A2 — WhatsApp ventana 24h expirada → template picker

- **OBJETIVO**: verificar que cuando `lastInboundAt > 24h`, aparece `WhatsAppTemplatePicker` y bloquea el composer libre.
- **ACTOR**: DUEÑO en conversación WA con `lastInboundAt` old (fixture con timestamp -48h).
- **PASOS**:
  1. Abrir conversación
  2. Verificar composer normal NO visible, en su lugar `WhatsAppTemplatePicker` (`isWhatsAppWindowExpired` = true)
  3. Seleccionar template `hello_world` → composer se rellena con el body del template
  4. Enviar → mutation `sendWhatsAppTemplate` (query param `?development=` no header)
- **EXPECT PASA**: template picker aparece, send funciona.
- **EXPECT FALLA**: composer libre sigue visible (bug detección 24h), send devuelve 4xx.

#### A3 — Envío con IaLevelPicker Autopiloto

- **OBJETIVO**: verificar que en modo Autopiloto la IA responde sola (backend api-ia genera + envía).
- **ACTOR**: DUEÑO cambia IaLevelPicker en `ConversationHeader` a "Autopiloto".
- **PASOS**:
  1. Abrir conversación con nuevo mensaje entrante
  2. Cambiar picker a Autopiloto → persiste (PATCH `/workspace/ia-config`)
  3. Esperar <10s → api-ia genera respuesta y la manda (visible en burbujas)
  4. Verificar burbuja con sello "✦ Enviado por IA" + estilo distinto (`isAssistant=true` en payload)
- **EXPECT PASA**: respuesta aparece con sello, sin intervención del usuario.
- **EXPECT FALLA**: se queda en "Borrador IA" (backend en modo Copiloto por error), o no responde.

---

### 👥 BATERÍA C — Comunicación entre EQUIPO (internos)

Prioridad P1. Colaboración planner ↔ asistentes.

#### C1 — Asignar conversación a otro miembro del equipo

- **OBJETIVO**: verificar que el picker de asignación con `searchCRMUsers` funciona y persiste.
- **ACTOR**: DUEÑO en conversación con evento vinculado → EventSidebar visible.
- **PASOS**:
  1. En EventSidebar, click "Asignar" → picker abre
  2. Escribir nombre en search → llamada a `searchCRMUsers` (verificar shape `{user_id, name, email}`)
  3. Seleccionar INVITADO → mutation `assignConversationToUser({conv_id, user_id})`
  4. Recargar → asignación persiste
- **EXPECT PASA**: mutation devuelve success, EventSidebar muestra "Asignada a jcc@bodasdehoy.com".
- **EXPECT FALLA**: search vacío (bug shape backend), mutation falla, no persiste.

#### C2 — Nota interna con @mención al DUEÑO desde otro miembro

- **OBJETIVO**: verificar `MentionAutocomplete` + backend persiste `mentions[]`.
- **ACTOR**: INVITADO (`jcc@bodasdehoy.com`) en un evento del DUEÑO donde tiene permiso.
- **PASOS**:
  1. Login INVITADO → navegar a evento compartido
  2. Abrir `TaskDetailModal` de una tarea → EntityNotesSection
  3. En composer, escribir `@bodas` → dropdown de MentionAutocomplete con búsqueda debounced
  4. Seleccionar DUEÑO → texto queda `@bodasdehoy.com@gmail.com `
  5. Guardar nota → `createCRMNote` con entityType=TASK, mentions=[uid_dueño]
  6. Sesión paralela DUEÑO abierta → verificar campana recibe notif tipo `mention` en <5s
- **EXPECT PASA**: menciones detectadas correctamente, notif llega al DUEÑO.
- **EXPECT FALLA**: dropdown no aparece (bug import GQL_SEARCH_CRM_USERS), notif no llega (backend `mentions[]` no procesado — REPORTAR, no fix).
- **CLEANUP**: borrar la nota.

#### C3 — Draft M1 cross-device

- **OBJETIVO**: verificar que un draft escrito en un browser aparece al abrir la misma conversación en otro browser.
- **ACTORES**: DUEÑO en 2 contexts distintos (Playwright `browser.newContext()` × 2).
- **PASOS**:
  1. Context A: abrir conversación → escribir "Hola, ¿cómo estás?" en composer → esperar 2s (debounce PUT)
  2. Verificar Network A: `PUT /api/messages/conversations/{id}/draft` con body `{text: "Hola..."}`
  3. Context B: abrir MISMA conversación → verificar que composer aparece con el texto
- **EXPECT PASA**: texto aparece en B en <3s desde apertura.
- **EXPECT FALLA**: composer vacío en B (bug shape `content` vs `text` — ya arreglado, si vuelve = regresión).

#### C4 — NotesPanel cross-app: nota creada en `chat-ia` visible en `resumen-evento`

- **OBJETIVO**: verificar el sistema NotesPanel universal — misma nota en 2 apps distintas.
- **ACTOR**: DUEÑO.
- **PASOS**:
  1. En `chat-dev`, abrir conversación con `linkedEventId` → sidebar Notas
  2. Crear nota con texto "TEST QA 09-jul" → success
  3. Ir a `app-dev/resumen-evento?eventId={mismo}` → EntityNotesSection card
  4. Verificar la nota "TEST QA 09-jul" aparece
- **EXPECT PASA**: nota visible en ambas apps con mismo id.
- **EXPECT FALLA**: nota solo en una app (bug shape `notes:null` o entity mismatch).
- **CLEANUP**: borrar la nota.

---

### 🤖 BATERÍA D — Agente IA + Memoria

Prioridad P1.

#### D1 — Streaming SSE Copilot

- **OBJETIVO**: verificar que el chat con la IA recibe stream real-time y no bloquea la UI.
- **ACTOR**: DUEÑO en `chat-dev/chat`.
- **PASOS**:
  1. Enviar prompt "Dame 3 ideas para el catering de una boda de 100 personas"
  2. Verificar Network: POST a `/api/chat/send` (o proxy a api-ia)
  3. Verificar EventStream tab: llegan frames incrementales
  4. UI muestra el texto escribiéndose progresivamente
- **EXPECT PASA**: primer chunk <2s, texto se completa <15s.
- **EXPECT FALLA**: timeout, "Error de conexión", texto entero de golpe (no streaming).

#### D2 — Elegir modelo específico (Manual override auto-routing)

- **OBJETIVO**: verificar que Settings → Agente permite elegir modelo y api-ia respeta.
- **ACTOR**: DUEÑO.
- **PASOS**:
  1. `chat-dev/settings?active=agent&tab=modal` → verificar selector modelo
  2. Cambiar a `claude-opus-4-7` (o el que esté disponible en la lista)
  3. Ir a `/chat` y enviar mensaje
  4. Verificar respuesta backend: campo `ai_model` = valor elegido, `auto_route=false`
- **EXPECT PASA**: `ai_model` respeta la elección del usuario.
- **EXPECT FALLA**: `ai_model` = default groq/llama (bug — no se envía el modelo elegido).

#### D3 — MemoryManager CRUD

- **OBJETIVO**: verificar UI de memoria en Ajustes.
- **ACTOR**: DUEÑO.
- **PASOS**:
  1. `chat-dev/settings/advanced` → card Memoria
  2. Verificar carga (GET `/api/backend/api/memory` con header `X-User-Id`)
  3. Crear un recuerdo (via chat: "Recuerda que mi color favorito es azul" → api-ia extrae automáticamente)
  4. Volver a Settings → aparece el recuerdo
  5. Editar texto → PATCH `/api/backend/api/memory/{id}` con body `{text}`
  6. Borrar → DELETE → recuerdo desaparece
  7. Buscar semánticamente ("¿qué colores me gustan?") → POST `/recall`
- **EXPECT PASA**: los 4 endpoints responden 200 con shapes documentados.
- **EXPECT FALLA**: 401 sin X-User-Id (regresión del fix `b5fa8729`), 4xx en PATCH.

---

### 🔐 BATERÍA E — Auth

Prioridad P1.

#### E1 — Login OAuth Google popup

- **OBJETIVO**: verificar que el popup Google se abre y NO se cuelga (fix 24-jun timeout 60s).
- **ACTOR**: cualquiera.
- **PASOS**:
  1. `chat-dev/login` → click "Continuar con Google"
  2. Interceptar `window.open` → verificar URL Google Accounts
  3. Simular timeout (no cerrar el popup) → verificar UI de chat-dev NO se queda bloqueada tras 60s
- **EXPECT PASA**: popup abre, UI recupera control tras timeout.
- **EXPECT FALLA**: popup no abre, o UI queda infinita "Cargando…" (regresión del fix).

#### E2 — Magic-link camino error + éxito

- **OBJETIVO**: cubrir los 2 caminos (token inválido y token válido).
- **PASOS**:
  1. `app-dev/auth/magic/dummy-token-xxx` → verificar página "Enlace inválido o expirado" 200
  2. Token válido: **BLOQUEADO por falta de emisor** (requiere backend). Documentar como "no ejecutable hasta que backend proporcione token de prueba".
- **EXPECT PASA**: camino error muestra mensaje legible.
- **EXPECT FALLA**: 500 en `/auth/magic/*` (regresión — bug del handler SSR).

#### E3 — Login inválido rechazado

- **OBJETIVO**: verificar que el usuario inexistente NO puede acceder.
- **ACTOR**: `jcc@marketingsoluciones.com` (no existe en la tabla).
- **PASOS**:
  1. `app-dev/login` con esas credenciales
  2. Verificar respuesta rechaza (mensaje "Usuario no encontrado" o similar)
- **EXPECT PASA**: rechaza limpio, no crashea.
- **EXPECT FALLA**: acepta (bug crítico de auth) o crashea (bug menor pero reportable).

---

### 🎉 BATERÍA A.RSVP — INVITADO externo (no autenticado)

Prioridad P1.

#### R1 — Portal público /e/[id]

- **OBJETIVO**: verificar el fix MOM-02 sigue vivo (endpoint `getEventoPublicoById`).
- **ACTOR**: **navegador sin cookies** (`context.clearCookies()`).
- **PASOS**:
  1. Crear evento nuevo "Boda Test QA 09-jul" con `linkPublico` habilitado
  2. Copiar la URL pública
  3. Abrir en context anónimo → verificar que carga info evento sin pedir login
- **EXPECT PASA**: página con nombre, fecha, mensaje del organizador visible sin auth.
- **EXPECT FALLA**: redirect a /login (bug: proteger endpoint público) o "no se pudo cargar".

#### R2 — Confirmar asistencia (RSVP) invitado

- **OBJETIVO**: verificar que un invitado externo puede confirmar asistencia y el organizador recibe la notif.
- **ACTORES**: navegador anónimo (invitado) + sesión DUEÑO en pestaña paralela.
- **PASOS**:
  1. Con evento del R1, crear un invitado ficticio + generar link confirmación
  2. Abrir link en context anónimo → formulario RSVP
  3. Marcar "Sí asisto" + enviar
  4. Verificar mutation `updateGuestRsvp` OK
  5. En sesión DUEÑO, esperar <10s → notif "Fulano confirmó asistencia" en campana
- **EXPECT PASA**: RSVP persiste, notif llega.
- **EXPECT FALLA**: form no envía, RSVP no actualiza, notif nunca llega.
- **CLEANUP**: borrar evento test + invitados creados.

---

## 5. Cleanup obligatorio al final del run

Script cleanup:

```bash
# 1. Localizar eventos creados hoy con nombre "Boda Test QA 09-jul"
curl -X POST https://api-mcp.eventosorganizador.com/graphql \
  -H "X-Development: bodasdehoy" \
  -H "Authorization: Bearer $DUENO_JWT" \
  -d '{"query":"query{getEventosByUsuario{_id nombre}}"}' \
  | jq '.data.getEventosByUsuario[] | select(.nombre | startswith("Boda Test QA"))'

# 2. Borrar cada uno con `deleteEvento(_id:...)`
# 3. Borrar todas las notas creadas con tag "TEST QA 09-jul"
# 4. Unsubscribe Web Push (DELETE /api/push/subscribe con endpoint)
# 5. Verificar Boda Isabel & Raúl (66a9042dec5c58aa734bca44) NO fue modificada
```

---

## 6. Detección de runtime errors — obligatorio

En cada test, montar listeners:

```typescript
const runtimeErrors: string[] = [];
page.on('pageerror', (err) => runtimeErrors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') runtimeErrors.push(`console.error: ${msg.text()}`);
});

// tras cada test:
if (runtimeErrors.length > 0) {
  console.log('RUNTIME ERRORS:', runtimeErrors);
  test.fail();
}
```

Errores esperables IGNORABLES (allowlist):
- `Cannot return null for non-nullable field CRM_NotesResponse.notes` — bug backend conocido, no bloquea el run.
- Warnings SSR hidratation en desarrollo (solo si empiezan con "Warning:" y contienen "hydrated").

Cualquier otro error → **fail** y reportar.

---

## 7. Formato de reporte a Slack (obligatorio al terminar)

Canal: `C0AV8EV5495` · Hilo: `1778170638.897419` · Token: `~/.slack-bodasdehoy.env`.

Formato exacto:

```
DE: QA-Bot / <tu nombre>
PARA: COORD-AppEventos
DRI: qa_oncall
CANAL: #coordinacion
HILO: 1778170638.897419
ASUNTO: :test_tube: Ejecución QA Comunicación/Notif 09-jul — resultado {N}/{TOTAL} verde

Ejecutado el plan HANDOFF-QA-COMUNICACION-2026-07-09.md.

*Verde:*
✅ B1 Web Push subscribe E2E (POST /api/push/subscribe 200)
✅ B2 Campana + polling 60s + socket refresh
✅ A1 SSE realtime mensajes nuevos
✅ A2 Ventana 24h WA + template picker
✅ ...

*Rojo (bugs):*
❌ C2 — MentionAutocomplete: menciones aceptadas pero `getNotifications` no devuelve tipo `mention` en 5s. Sospecha: backend api-ia `mentions[]` no traducido a notif. Evidencia: {log Network + screenshot}.
❌ D2 — Model manual: eligiendo Claude Opus el backend responde igual con groq/llama. Sospecha: chat-ia no está enviando `ai_model` en request. Evidencia: {payload POST /api/chat/send}.

*Amarillo (no ejecutado):*
⏸ E2 magic-link camino éxito — bloqueado por falta de token válido de prueba.
⏸ B1 permission prompt del OS — no automatizable, requiere clic humano.

*Cleanup ejecutado:* ✅ evento "Boda Test QA 09-jul" borrado, N notas borradas, subscribe Push cancelado.

DRI: qa_oncall
```

---

## 8. Salidas esperadas de este handoff

- Un run completo de las baterías A/B/C/D/E/A.RSVP (30-45 tests).
- Cleanup 100% aplicado.
- Reporte Slack en el hilo.
- Screenshots + logs en `test-results/qa-comunicacion-09jul/` para bugs encontrados.
- Cero regresiones sobre "Boda Isabel & Raúl".

Cualquier duda antes de arrancar: preguntar EN EL HILO SLACK, no empezar a ciegas.

---

## Anexo — commits relevantes desplegados hoy (contexto)

- BUILD dev-live: `mznr1ohVcXCxSv5iH6u0e` (chat-dev) + magic-link + Memory + fixes hoy.
- Últimos 30 commits en `origin/dev` promovidos entre 25-jun y 09-jul: refactor D (eliminar model-runtime + 66 providers), FASE B v2.0 Bandeja, SPRINT 3 iMessage, SPRINT 4 Web Push, CRM_Note universal, drafts M1, magic-link activo, fix AWS SES, 4 bugs QA-#13/#17.

Ver `git log origin/dev --since=2026-06-25 --oneline` para el listado completo.
