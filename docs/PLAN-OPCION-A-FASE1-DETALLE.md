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
