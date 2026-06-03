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

## 7. Estimación honesta
- Fase 1.0-1.3 (message+topic+session a api-ia): ~1-2 sesiones SI api-ia ya los cubre.
- Fase 1.4-1.5 (resto + limpieza): varias sesiones.
- Bloqueante real: que el backend cubra el CRUD de conversaciones. Verificar ANTES de empezar.
