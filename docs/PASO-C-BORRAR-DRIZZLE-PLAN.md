# PASO C — Plan de borrado del data-layer (drizzle/pglite/tRPC)

> Objetivo: eliminar drizzle/pglite/tRPC del front chat-ia → reduce el árbol de compilación
> (40.422 módulos en /chat). **NO ejecutar hasta E2E 04-jun OK.** Borrado GRADUAL por capas.
> Estado verificado 2026-06-03.

## Por qué NO es un borrado de golpe

**35 archivos** importan el runtime tRPC (`lambdaClient`/`@/server/routers/lambda`), no solo los
7 service-abstractions. El data-layer está entrelazado con ~15 services. Borrar de golpe rompería
los que aún no están migrados. Hay que ir por capas.

## Deps a quitar de package.json (AL FINAL, cuando 0 imports)

```
@electric-sql/pglite   @neondatabase/serverless   pg   drizzle-orm   drizzle-zod
@trpc/client   @trpc/react-query   @trpc/server
```
⚠️ NO quitarlas hasta que NINGÚN archivo las importe (hoy las usan ~15 services + libs/trpc).

## CAPA 1 — Chat-core (YA migrado a api-ia, listo tras E2E) ✅

Services con `USE_API_IA_ENDPOINTS` ya cableado a api-ia:
- `message` (ApiIaMessageService) · `session` (ApiIaSessionService) · `topic` (ApiIaTopicService)

**Tras E2E OK + flag activo:** borrar de estos 3 services: `server.ts` (tRPC) + `client.ts` (pglite)
+ `_deprecated.ts`. Quedan solo `apiIa.ts` + `index.ts`. Verificar antes que el flag esté ON en prod.

## CAPA 2 — Features OFF (gateadas, candidatas a ELIMINAR sin migrar)

Gateadas OFF en UI (market/knowledge/rag/generation). Su código tRPC se borra al eliminar la feature:
- `rag` (4) · `ragEval` (2) · `knowledgeBase` (2) · `generation`/`generationBatch`/`generationTopic` (1 c/u)
- ⚠️ `knowledge` acoplado a `/files` (bug conocido) — verificar antes de borrar.
- ⚠️ `discover` (6 sitios) usa react-router-dom legacy — tech debt aparte.

**Requiere decisión del user:** ¿eliminar estas features OFF o migrarlas? (eliminar = más reducción).

## CAPA 3 — Services activos que aún usan tRPC (NECESITAN migración a api-ia)

NO se pueden borrar — están activos. Migrar a api-ia primero (pedir endpoints):
- `image` (1) · `aiProvider` (1) · `chatGroup` (2) · `thread` (1) · `tool` (3) · `global` (2) · `upload` (3)
- `file` · `plugin` · `user` (ya tienen apiIa parcial vía pglite-diferido, falta server.ts→api-ia)

**Pendiente api-ia:** exponer endpoints para estos dominios antes de borrar su tRPC.

## CAPA 4 — Infra tRPC (lo último)

Cuando CAPA 1-3 estén migradas/eliminadas y 0 archivos importen tRPC:
- `libs/trpc/*` (cliente) · `server/routers/lambda/*` (los 25 routers) · `database/` (drizzle schemas)
- Quitar las 8 deps del package.json.
- **Aquí cae el grueso de los 40k módulos.**

## Orden de ejecución (tras E2E 04-jun)

1. Confirmar flag `USE_API_IA_ENDPOINTS` activo y estable en prod (chat-core por api-ia).
2. CAPA 1: borrar server.ts/client.ts/_deprecated.ts de message/session/topic. Medir módulos.
3. Decisión user sobre CAPA 2 (eliminar features OFF).
4. CAPA 3: migrar services activos (requiere endpoints api-ia).
5. CAPA 4: borrar infra tRPC + deps. **Medir reducción final de módulos.**

> Cada capa: validar chat-ia 200 + tests + medir módulos ANTES de la siguiente. Reversible por git.
