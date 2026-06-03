# Opción A — Fase 1 detallada: desacoplar chat-ia de la infra LobeChat

> Objetivo Fase 1: que chat-ia deje de depender del backend tRPC+drizzle+pglite de LobeChat,
> usando vuestro api-ia/api-mcp como fuente de datos. Reduce deps reales y peso de compilación.
> SIN perder funcionalidad (migración por paridad).

## 1. Arquitectura actual (verificada en código)

LobeChat tiene servicios con 3 implementaciones intercambiables vía env var:
```
src/services/<dominio>/   (message, topic, session, user, file, plugin, thread...)
  client.ts       → BD local pglite (navegador)
  _deprecated.ts  → BD client vieja
  server.ts       → lambdaClient (tRPC LobeChat → drizzle/postgres server-side)
  index.ts        → switch: SERVICE_MODE==='server' ? server : client
```
**chat-ia corre AHORA en `SERVICE_MODE="server"`** → usa `server.ts` → `@/libs/trpc/client`
(lambdaClient). Por eso arrastra: `@trpc/*` (3), `drizzle-*` (4), `@lobechat/database`,
`@lobechat/context-engine`, `pglite`, etc.

## 2. El acople (126 archivos) por capa

| Capa | Archivos | Qué es | Acción Fase 1 |
|---|---|---|---|
| `server/routers` | 41 | tRPC routers (backend LobeChat) | el destino a eliminar/no usar |
| `server/services` | 15 | servicios server-side (drizzle) | idem |
| `database/_deprecated` | 12 | BD vieja | eliminar (ya deprecated) |
| `services/<dominio>` | ~30 | clientes (client/server/index) | **aquí está la palanca** |
| `libs/trpc` | 3 | cliente tRPC | reemplazar destino |

## 3. La palanca (mejor práctica): nuevo modo de servicio "api-ia"

NO reescribir el chat. Aprovechar la abstracción que LobeChat YA tiene:
- Crear `<dominio>/apiServer.ts` (o adaptar `server.ts`) que llame a **api-ia/api-mcp**
  en vez de `lambdaClient` (tRPC LobeChat).
- El `index.ts` switch elige el nuevo modo.
- Empezar por los dominios que el CHAT usa de verdad (no los 30): **message, topic, session**
  (lo crítico para conversar) — el resto después.

## 4. Orden de ejecución (incremental, por paridad)

1. **Fase 1.0 — Mapear el contrato**: qué métodos de `messageService`/`topicService`/
   `sessionService` usa el chat (createMessage, getMessages, etc.) y qué endpoint de api-ia/api-mcp
   los cubre. Si falta endpoint → coordinar con BACKEND (no inventar).
2. **Fase 1.1 — message**: crear `message/apiServer.ts` → api-ia. Switch. Verificar que el chat
   crea/lee mensajes igual (paridad). El tRPC `message` router queda sin uso.
3. **Fase 1.2 — topic + session**: idem.
4. **Fase 1.3 — medir**: ¿bajaron deps/módulos al no usar lambdaClient para esos dominios?
5. **Fase 1.4 — resto de dominios** (user, file, plugin, thread) según uso real.
6. **Fase 1.5 — eliminar** server/routers + drizzle + pglite cuando NADA los use.

## 5. Riesgos / no perder nada
- El modo `server` actual (tRPC) SE MANTIENE funcionando hasta que el modo api-ia tenga paridad.
- Cada dominio migrado se verifica contra el comportamiento actual antes de quitar el viejo.
- ⚠️ Verificar con BACKEND que api-ia/api-mcp cubre los métodos (createMessage, getMessages,
  topics, sessions). Si NO los cubre, Fase 1 depende de que el backend los exponga primero.

## 6. ✅ BLOQUEANTE DESPEJADO (verificado SSH a api-mcp 2026-06-03)
api-mcp YA expone el CRUD de conversaciones para LobeChat. Confirmado en código:
- **`src/graphql/typeDefs/lobe-chat.ts` + `src/graphql/resolvers/lobe-chat.ts`** ← schema GraphQL
  ESPECÍFICO para LobeChat (el backend YA empezó este camino).
- Operaciones: `createMessage`, `getMessages`, `deleteMessage`, `createSession`, `getSessions`,
  `conversations`, `messages/send`.
- → **El backend YA hizo su parte.** Fase 1 = recablear los `services/<dominio>` de chat-ia
  para que usen este GraphQL de api-mcp en vez del `lambdaClient` (tRPC LobeChat). NO bloqueado.
- Pendiente menor: confirmar paridad de campos (¿el resolver lobe-chat cubre topics además de
  sessions/messages?) — verificar `lobe-chat.ts` resolver en detalle al empezar Fase 1.1.

## 6.b MAPA DE PARIDAD message (verificado 2026-06-03) — bloqueo PARCIAL real

Contrato: `IMessageService` (~28 métodos). Lo que el resolver `lobe-chat.ts` de api-mcp YA cubre:

| Método chat (usos) | api-mcp lobe-chat |
|---|---|
| getMessages (4) | ✅ |
| updateMessage (13) | ✅ |
| removeMessage/deleteMessage (1) | ✅ |
| getSessions | ✅ |
| **createMessage (23 — el #1)** | ❌ FALTA |
| createNewMessage, batchCreateMessages | ❌ FALTA |
| updateMessageTTS/Translate/PluginState/RAG (9) | ❌ FALTA |
| getAllMessages, countMessages, rankModels, getHeatmaps | ❌ FALTA |

**CONCLUSIÓN:** el backend cubrió la LECTURA pero NO la ESCRITURA de mensajes (falta createMessage
y las updates específicas). Recablear `message` completo a api-mcp HOY romper ía crear mensajes.
→ **Fase 1.1 está BLOQUEADA por backend**: necesita que api-mcp añada `createMessage`,
`createNewMessage`, `batchCreateMessages` y los `updateMessage*` específicos al resolver lobe-chat.
Esto es tarea de BACKEND (escalación), no de frontend. Sin eso, el desacople de message no avanza.

### Qué SÍ se puede hacer ahora (sin backend)
- Recablear solo los métodos de LECTURA (getMessages/getSessions/updateMessage/deleteMessage) NO
  sirve: el service es atómico (o todo a api-mcp o todo a tRPC). Migrar parcial deja el chat roto.
- → Lo accionable HOY es: (a) escalar a BACKEND la lista de mutations faltantes, (b) mientras,
  avanzar en lo que NO depende del backend (ej. eliminar features muertas ya decididas).

## 7. Estimación honesta
- Fase 1.0-1.3 (message+topic+session a api-ia): ~1-2 sesiones SI api-ia ya los cubre.
- Fase 1.4-1.5 (resto + limpieza): varias sesiones.
- Bloqueante real: que el backend cubra el CRUD de conversaciones. Verificar ANTES de empezar.

## 8. ESTADO 2026-06-03: Fase 1 escalada a BACKEND (bloqueada hasta CRUD completo)

Verificado el alcance real: los 3 dominios de persistencia (message/session/topic) usan en
total ~53 métodos; api-mcp lobe-chat cubre solo LECTURA (getMessages/getSessions/updateMessage/
deleteMessage). La parte de STREAMING IA ya está desacoplada (aiChat→chatService→api-ia OK).

Escalado a BACKEND (Slack #coordinacion hilo AppBodas) la lista completa de mutations faltantes,
con prioridad: createMessage + createSession + createTopic + getTopics (mínimo para persistir).

**FRONT no puede avanzar el desacople hasta que BACKEND complete esas mutations** (service atómico).
Mientras: el chat sigue funcionando en SERVICE_MODE=server (tRPC LobeChat) — no se toca hasta paridad.

## 9. ✅ API-IA CONFIRMÓ (2026-06-03): streaming NO depende de la BD LobeChat
Respuesta API-IA verificada contra su código:
- `messages = payload.get("messages", [])` (rest_chat_handler.py:1145, 1498) — reconstruyen
  el contexto desde el array `messages` del request body, NO de la BD.
- 0 imports de drizzle/tRPC/postgres/prisma. "Lobe" solo para formato SSE, no para leer su BD.
- → CONFIRMADO: se puede quitar la BD/tRPC de LobeChat sin tocar api-ia. Riesgo de streaming = 0.

Pendiente único: BACKEND-api-mcp completar P1 (createMessage/Session/Topic + getTopics + file).

## 10. MAPEO REAL confirmado por BACKEND (2026-06-03) — guía de implementación

GraphQL: https://api-mcp.eventosorganizador.com/graphql
Auth: Authorization: Bearer <mcp_jwt> + X-Development: <dev>  (login: POST /auth/firebase-login {firebaseToken, development})

MESSAGE:
  createMessage  → sendMessage(sessionId, input)  ✅ {success,message:{id},errors}  [implementado en apiServer.ts]
  getMessages    → getMessages ✅ {success,messages[],total,pagination}
  updateMessage  → updateMessage ✅ (genérico: input:{tts|translate|pluginState|error|...})
  deleteMessage  → deleteMessage ✅ (soft delete)
  createNewMessage → usar sendMessage + devolver objeto
  batchCreateMessages → ❌ FALTA (P2, no bloquea)
  updateMessageTTS/Translate/Plugin*/RAG → vía updateMessage(input:{campo}) — confirmar shape exacto

SESSION:
  createSession(type,defaultValue) → createLobeSession(userId, development, input) ✅
     ⚠️ mapeo NO 1:1: input={titulo?, session_type(LOBE_CHAT), participants[userId], config?, meta?, group_id?}
  getSessions   → getSessions ✅ {success,sessions[],total,pagination}
  updateSession → updateSession ✅ ; deleteSession ✅ ; archive/restore ✅ ; searchSessions ✅
  getGroupedSessions → ❌ FALTA (el sidebar lo usa — pedir o construir desde getSessions+getSessionGroups)
  getSessionConfig, removeAllSessions, cloneSession → ❌ FALTAN (P3)
  SessionGroups: create/update/delete/get ✅

TOPIC:
  createTopic, getTopics → ⏳ BACKEND implementando (Opción A subdocumento en Chat, ETA 50min)
  resto topic → P3

CAMPOS clave getMessages: id(_id), role(USER|ASSISTANT|SYSTEM), content, sessionId, createdAt/updatedAt(ISO8601)
  + legacy: emisor, mensaje(=content), tokens, cost, aiProvider, aiModel
CAMPOS clave getSessions: id, titulo, session_type, participants[], config, meta, group_id,
  status(ACTIVE|DELETED|ARCHIVED), development, whitelabel_info{whitelabel,project_id,event_id}

GAPS que FRONT debe resolver al recablear:
  - getGroupedSessions: construir en cliente desde getSessions + getSessionGroups (BACKEND no lo tiene)
  - role mayúsculas (USER no user) — mapear en ambos sentidos
  - createSession: adaptar (type,defaultValue) de LobeChat → input de createLobeSession

## 11. ✅✅ BACKEND ENTREGÓ P1 COMPLETO (2026-06-03, commits 4e0d565 + df55c40)

VERIFICADO en código api-mcp (no solo Slack). El resolver lobe-chat ahora tiene:
- ✅ createMessage (ALIAS directo de sendMessage — nombre ya coincide 1:1, no hay que mapear)
- ✅ createSession (alias) + createLobeSession
- ✅ createTopic(sessionId, title, favorite) -> ID!  + getTopics(sessionId) -> [Topic!]!
- ✅ updateTopic, removeTopic
- ✅ getMessages, getSessions, getSession, updateMessage, deleteMessage, searchSessions
- ✅ sessionGroups (create/update/delete/get)
- ✅ BONUS: subscriptions onNewMessage/onNewSession/onSessionUpdated, markAsRead, shareChatSession

Topic implementado como Opción A (modelo unificado de mensajería — commit df55c40
"unificar colecciones mensajería en modelo único").

→ BLOQUEANTE DESPEJADO. P1 COMPLETO. FRONT puede recablear message+session+topic AHORA.
   Los aliases (createMessage/createSession con esos nombres) hacen el recableo casi 1:1.

PRÓXIMO (FRONT): completar apiServer.ts de los 3 dominios, switch, verificar contra
docs/CHECKLIST-PARIDAD-INPUT-CHAT.md, medir reducción de módulos.

## 12. ⚠️ CRÍTICO — separación facturación/contabilidad (api-ia) vs persistencia (api-mcp)

Alerta del usuario (2026-06-03): api-ia es el backend de chat-ia Y lleva la CONTABILIDAD/
FACTURACIÓN (ingresos reales). api-ia habla con api-mcp por debajo. RIESGO: que al recablear
el chat "directo a api-mcp" se BYPASEE la capa contable de api-ia y se rompan los ingresos.

ANÁLISIS (verificado en código frontend):
- Mi recableo SOLO toca message/session/topicService (persistencia de TEXTO de conversaciones).
  → Verificado: server.ts de los 3 NO tienen refs a wallet/billing/cost/factura (0 refs). NO facturan.
- La FACTURACIÓN/wallet va por OTRO camino que NO toco:
  · `services/mcpApi/wallet.ts` (wallet_checkBalance)
  · `chatService` (services/chat/index.ts) → api-ia (streaming + X-User-ID + balance)
- chatService NO usa message/session/topicService → mi recableo NO le afecta.
- El STREAMING sigue por api-ia (confirmado por API-IA). La FACTURACIÓN sigue por su camino.

REGLA PARA EL RECABLEO (no romper ingresos):
1. Solo cambiar el DESTINO de persistencia de conversaciones (tRPC LobeChat → api-mcp GraphQL).
2. NO tocar: chatService (api-ia), mcpApi/wallet, balance, X-User-ID, el flujo de streaming.
3. El flujo correcto se mantiene: chat-ia → api-ia (streaming + contabilidad) → api-mcp (persistencia).
   La persistencia directa a api-mcp es SOLO para guardar/leer el texto, NO para facturar.
4. ⚠️ DUDA A RESOLVER CON BACKEND: ¿la persistencia de mensajes debe pasar por api-ia (para que
   contabilice) o el front puede escribir directo a api-mcp? BACKEND dijo "NO bypass api-ia" pero
   también dio el GraphQL de api-mcp como destino de persistencia. ACLARAR antes de activar el switch.

## 13. ✅ AUDITORÍA facturación chat (SSH api-mcp + frontend, 2026-06-03) — diseño RESPETADO

Revisado dónde está la facturación/IA del chat hoy vs el diseño original. RESULTADO: el flujo
de facturación del CHAT ya es correcto, NO hay bypass que romper.

DISEÑO ORIGINAL (de MEMORY "Balance enforcement chat-ia"):
  chat-ia front (X-User-ID) → api-ia hace wallet_checkBalance → 402 si insufficient_balance
  → showInsufficientBalance. api-ia es quien factura/chequea el chat.

VERIFICADO en código:
- Frontend chat: factura VÍA api-ia (aiChat/initialState: "detail from api-ia 402/503",
  "backend returns 402 insufficient_balance"). El chat NO chequea balance directo a api-mcp. ✅
- walletService.checkBalance (mcpApi/wallet → api-mcp directo) SOLO se usa en settings/billing
  (página de saldo/recarga), NO en el flujo del chat. Legítimo (mostrar saldo). ✅
- api-mcp tiene unified-usage-tracking (AI_TOKENS_INPUT/OUTPUT, CHAT_MESSAGE) y wallet.resolver
  → es el ALMACÉN del wallet/tracking. api-ia lo CONSUME para facturar. Correcto: api-mcp = dato,
  api-ia = lógica de facturación del chat.

REGLA CONFIRMADA para el recableo de persistencia:
- NO tocar nada de facturación: el chat seguirá facturando vía api-ia (sin cambios).
- El recableo solo cambia DÓNDE se guarda el TEXTO de conversaciones (persistencia), que NO factura.
- api-ia sigue siendo la capa de IA + facturación del chat. api-mcp = persistencia + wallet-store.
- → NO se rompe ningún ingreso. La preocupación del usuario está cubierta y verificada.

PENDIENTE menor (aclarar con BACKEND, no urgente): si createMessage (persistencia del texto)
debe pasar por api-ia para que cuente el mensaje, o el front escribe directo a api-mcp. El
STREAMING (que es lo que factura) ya va por api-ia sí o sí.

## 14. AUDITORÍA respuesta BACKEND 16:30 (2026-06-03) — decisión correcta PERO 2 banderas rojas

BACKEND decidió: TODA escritura facturable (chat/storage/whatsapp/sms/email/imagen/audio) vía
api-ia (8 endpoints REST/SSE); lectura (getMessages/getSessions/getFiles) directo a api-mcp.
Conceptualmente CORRECTO (centraliza facturación en api-ia, protege ingresos).

🔴 BANDERA ROJA 1 — DOMINIO MUERTO:
  BACKEND documentó todos los endpoints en `https://api3-ia.eventosorganizador.com`.
  VERIFICADO: api3-ia.eventosorganizador.com = NXDOMAIN (no resuelve). El dominio REAL de
  api-ia es `api-ia.bodasdehoy.com` (172.67.137.140). Memoria ya lo marcaba NXDOMAIN desde 05-18.
  → Si se implementa contra api3-ia, TODO falla. Confirmar dominio correcto con BACKEND.

🔴 BANDERA ROJA 2 — ENDPOINTS NO EXISTEN AÚN:
  Los 8 endpoints REST (/chat/stream, /storage/upload, /whatsapp/send, etc.) NO están
  implementados. El propio checklist de BACKEND: "API-IA [ ] Implementar 8 endpoints, ETA 8h".
  El frontend HOY usa OTRO flujo que YA FUNCIONA: createAssistantMessageStream + /api/storage/upload
  (proxy local). Migrar a endpoints inexistentes = romper el chat.

🟡 ALCANCE AMPLIADO: esto ya no es "recablear persistencia". Es migrar 8 flujos del front a un
  patrón REST nuevo contra api-ia. Proyecto grande (front ETA BACKEND dice 6h + api-ia 8h).

SECUENCIA OBLIGATORIA (BACKEND lo dice): NO deployar frontend antes de que api-ia tenga los
endpoints. Riesgo: app rota.

BLOQUEANTES para FRONT (no podemos avanzar hasta):
  1. api-ia implementa los 8 endpoints REST (ETA 8h backend) — NO existen.
  2. Confirmar dominio real (api-ia.bodasdehoy.com, NO api3-ia.eventosorganizador.com).
  3. Decisión: ¿migramos los 8 flujos o solo chat/persistencia primero? (alcance).
  4. El streaming/upload ACTUAL funciona — no romperlo hasta que los nuevos estén probados.

## 15. DECISIÓN COORD (2026-06-03): alcance = LOS 8 ENDPOINTS completos (plan BACKEND)

COORD eligió migrar los 8 flujos al patrón REST de api-ia (chat/storage/whatsapp/sms/email/
imagen/audio + lectura directo api-mcp). Centraliza facturación en api-ia, arquitectura limpia.

SECUENCIA OBLIGATORIA (BACKEND lo marcó, RIESGO app rota si se salta):
  1. api-ia IMPLEMENTA los 8 endpoints REST/SSE (ETA backend 8h) — HOY NO EXISTEN.
  2. api-ia DESPLIEGA + da URL/dominio REAL probado (NO api3-ia.eventosorganizador.com = NXDOMAIN;
     el real es api-ia.bodasdehoy.com).
  3. api-mcp: Files P1 opción B (ETA 1h) — pendiente.
  4. SOLO ENTONCES front migra con feature flag USE_API_IA_ENDPOINTS, testing E2E conjunto, rollout gradual.

FRONT BLOQUEADO hasta paso 1+2. NO tocar el flujo actual (streaming + upload YA funcionan).
Mientras: preparar los helpers api-ia.ts (esqueleto) SIN activarlos, contra el dominio correcto.

LO QUE FRONT PUEDE ADELANTAR (sin romper, sin endpoints aún):
  - Esqueleto src/services/api-ia.ts con las 8 funciones (sendChatMessage, uploadFile, sendWhatsApp...)
    apuntando a NEXT_PUBLIC_API_IA_URL (api-ia.bodasdehoy.com), detrás de flag USE_API_IA_ENDPOINTS=false.
  - Mapear qué llamadas actuales del front reemplazará cada endpoint.

## 16. ✅ ARQUITECTURA CONFIRMADA por api-mcp (análisis 07:08) — todos alineados

api-mcp confirmó la lógica original del usuario:
  chat-ia → api-ia (streaming IA + facturación) → api-mcp (persistencia GraphQL, colección UNIFICADA chats)

- api-mcp implementó Topics CORRECTO (subdoc en `chats`, unificada con WhatsApp/Instagram/etc).
- Resolvers GraphQL persistencia correctos. El problema era QUIÉN los llama → debe ser api-ia, NO el front directo.
- Hay 6 colecciones de mensajería hoy (chats/chat_messages/email_messages/developmentmessages/
  whatsapp/inbox) → meta: unificar en `chats`. api-mcp ya empezó (df55c40).

IMPLICACIÓN para FRONT (corrige enfoque previo):
  ❌ message/apiServer.ts (apolloClient → api-mcp DIRECTO) = ENFOQUE EQUIVOCADO (bypass api-ia). DESCARTADO.
  ✅ services/api-ia.ts (todo por api-ia) = ENFOQUE CORRECTO. Este se mantiene.
  El front escribe SOLO contra api-ia (8 endpoints); api-ia persiste en api-mcp.
  Lectura (getMessages/getSessions): BACKEND dijo directo a api-mcp OK — pero confirmar si también
  debe pasar por api-ia para consistencia (su análisis sugiere api-ia como gateway).

ESTADO REAL (PROYECTO 4 de api-mcp): AppEventos BLOQUEADO por api-ia endpoints.
  Front no completa nada hasta que api-ia: (1) tenga los 8 endpoints, (2) persista en api-mcp GraphQL.
  ETA api-ia: ~1 día. PRIORIDAD CRÍTICA (revenue).

LO QUE FRONT YA DEJÓ LISTO (en paralelo, inactivo):
  - services/api-ia.ts: 8 funciones detrás de USE_API_IA_ENDPOINTS=false. Dominio correcto
    (api-ia.bodasdehoy.com, NO api3-ia=NXDOMAIN). Activar cuando api-ia despliegue.
  - El upload YA va por api-ia (uploadService.uploadFileToS3) — no necesita migración.

## 17. DECISIONES COORD (2026-06-03) + esqueleto api-ia.ts COMPLETO

D1 DOMINIO: api-ia.bodasdehoy.com (verificado /health → 200; api-ia.eventosorganizador.com
   también responde 200, pero el front YA usa bodasdehoy en .env → sin cambio, sin riesgo CORS).
   api3-ia.eventosorganizador.com = NXDOMAIN (descartado). Confirmar con api-ia team cuál prod.
D2 LECTURA: OPCIÓN A — todo vía api-ia gateway (lectura + escritura). Front = 1 cliente.
   api-ia necesita GET /chat/messages y GET /chat/sessions además de los POST.
D3 FILES: FASE 2 (separada). El upload actual ya va por api-ia (uploadService) → no se pierde.

ESQUELETO services/api-ia.ts COMPLETO (inactivo, USE_API_IA_ENDPOINTS=false):
  Escritura: sendChatMessage, createChatSession, uploadFile, sendWhatsApp, sendSMS,
             sendEmailCampaign, generateImage, transcribeAudio
  Lectura (D2-A): getChatMessages, getChatSessions
  Headers front: Authorization(JWT) + X-Development. NO X-Api-Ia-Secret (es server-to-server api-ia↔api-mcp).
  Base: NEXT_PUBLIC_API_IA_URL (api-ia.bodasdehoy.com) / same-origin en navegador.

ENDPOINTS que api-ia debe implementar (CRÍTICO chat básico):
  POST /chat/stream, POST /chat/session, GET /chat/messages, GET /chat/sessions
  (MEDIO/fase2: /storage/upload, /whatsapp/send, /sms/send, /email/campaign)

BLOQUEANTE: api-ia despliega esos 4 endpoints CRÍTICOS. ETA ~1 día. Luego: verificar dominio,
activar flag staging, E2E conjunto (5 pasos de api-mcp), rollout 10→50→100%.

## 18. PROCEDIMIENTO DE ACTIVACIÓN (cuando api-ia despliegue) + tests del cliente

Estado verificado 2026-06-03: los 4 endpoints api-ia (/chat/stream,/session,/messages,/sessions)
dan 404 en api-ia.bodasdehoy.com (dominio OK, endpoints NO desplegados aún). Sigue bloqueado.

✅ Cliente FRONT verificado con tests (src/services/api-ia.test.ts, 3/3):
  - flag=false → funciones lanzan error (no activan por accidente)
  - flag=true → sendChatMessage POST /chat/stream con JWT+X-Development+body OK
  - flag=true → getChatMessages GET /chat/messages?sessionId=...&limit= OK

PROCEDIMIENTO DE ACTIVACIÓN (orden estricto, cuando api-ia confirme endpoints listos):
  1. Verificar endpoints vivos (NO 404):
       curl -I https://api-ia.bodasdehoy.com/chat/stream   → esperar 401/405 (existe), no 404/000
  2. CABLEAR los call-sites del chat con el patrón flag (PENDIENTE, hacer en esa sesión):
       - sendMessage: store/chat/slices/aiChat/.../generateAIChat.ts → si flag, usar api-ia.sendChatMessage
       - createSession: store/session/slices/session/action.ts:119 → api-ia.createChatSession
       - getMessages/getSessions: services correspondientes → api-ia.getChatMessages/getChatSessions
       (mapear shape api-ia → al que el store espera; verificar contra CHECKLIST-PARIDAD-INPUT-CHAT.md)
  3. Activar en STAGING: NEXT_PUBLIC_USE_API_IA_ENDPOINTS=true
  4. E2E conjunto (5 pasos de api-mcp): UI chat + logs persistencia + BD chats/messages + facturación.
  5. Rollout gradual: 10% → 24h → 50% → 24h → 100%.

⚠️ El cableado de call-sites (paso 2) NO se hace ahora: requiere el shape REAL de respuesta de
los endpoints api-ia (que no existen). Hacerlo a ciegas = retrabajo. Se hace cuando api-ia
despliegue y pueda probarse contra el endpoint real. El esqueleto + tests ya garantizan que el
cliente está correcto.

## 19. ✅ HALLAZGO (2026-06-03): api-ia SÍ tiene endpoints — rutas REALES (≠ las documentadas)

Verificado contra el openapi REAL de api-ia (https://api-ia.bodasdehoy.com/openapi.json, 332 rutas).
BACKEND documentó /chat/stream etc. pero ESAS NO existen (404). Las rutas REALES son:

| Documentado (mal) | REAL en api-ia (verificado openapi) |
|---|---|
| POST /chat/stream  | POST /api/messages/send  (+ GET /api/messages/stream para SSE) |
| POST /chat/session | POST /api/sessions |
| GET /chat/messages | GET /api/messages/conversations/{conversationId}/messages |
| GET /chat/sessions | GET /api/sessions |
| (status)           | GET /api/lobechat/status (adaptador LobeChat ya existe) |

Contratos reales (openapi):
  POST /api/messages/send → { conversationId*, channel*, text*, attachments? }
  POST /api/sessions      → { title, model, development, user_email }

→ api-ia YA TIENE la integración LobeChat (/api/lobechat/status existe). El esqueleto
services/api-ia.ts CORREGIDO con las rutas reales. Tests 3/3 con rutas reales. Lint OK.

ESTADO: el cliente FRONT ahora apunta a las rutas REALES de api-ia. Falta:
  - Confirmar con api-ia el shape de RESPUESTA de /api/messages/send y /api/sessions (para mapear
    al store del chat). Probar un request real con JWT.
  - Cablear call-sites del chat con flag (cuando se confirme el shape de respuesta).
  - api-ia tiene /api/messages/* y /api/sessions VIVOS (no 404) — verificar auth/método exactos.
