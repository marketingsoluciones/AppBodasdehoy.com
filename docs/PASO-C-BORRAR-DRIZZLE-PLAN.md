# PASO C — Quitar drizzle como capa de datos (NO borrar servicios)

> ⚠️ ENFOQUE CORREGIDO (user 2026-06-03): NO se borran los servicios. Se MANTIENEN TODOS
> (image, sessions, topics, chatGroup, thread, etc.) — los gestionamos NOSOTROS igual, pero
> SIN drizzle por debajo. Lo que cambia es la CAPA DE DATOS: de "PostgreSQL local del front
> (drizzle/pglite/tRPC)" a "api-ia → api-mcp → MongoDB". Misma funcionalidad, misma UI.
>
> Patrón YA aplicado en message/session/topic: el `index.ts` del servicio usa `ApiIaXxxService`
> (fetch a api-ia) en vez de `ServerService` (tRPC→drizzle). El servicio NO se borra, solo su
> backend de datos. Se replica a los demás servicios.
>
> VENTAJAS de quitar drizzle:
> - Compilación: drizzle+pglite+tRPC+25 routers = miles de módulos fuera del árbol de /chat.
> - Una sola BD: hoy hay 2 (PG local del front + MongoDB real). Quitar drizzle = solo MongoDB.
> - Facturación: todo pasa por api-ia (el contable), nada se persiste saltándose el revenue.
> - Menos deps/infra de mantener.
>
> Objetivo: reducir el árbol de compilación (40.422 módulos en /chat).
> **NO ejecutar hasta E2E 04-jun OK.** GRADUAL por capas. Estado verificado 2026-06-03.

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

## CAPA 2 — Resto de servicios activos (MIGRAR su data-layer a api-ia, NO borrar)

TODOS estos servicios SE MANTIENEN — se gestionan igual pero sin drizzle. Cada uno: crear
`ApiIaXxxService` (fetch a api-ia) + cambiar su `index.ts` para usarlo bajo flag, igual que
message/session/topic. Requiere que api-ia exponga el endpoint de cada dominio:
- `image` (1) · `aiProvider` (1) · `chatGroup` (2) · `thread` (1) · `tool` (3) · `global` (2)
  · `upload` (3) · `file` · `plugin` · `user` · `generation*` · `rag`/`ragEval`/`knowledgeBase`
- ⚠️ `discover` (6) usa react-router-dom legacy — migrar aparte.

**Pendiente api-ia:** exponer endpoints REST para estos dominios. Mientras no existan, ese
servicio sigue en tRPC (no se rompe), pero su drizzle no se puede quitar aún.

## CAPA 3 — Infra tRPC (lo último, cuando 0 servicios la usen)

Cuando CAPA 1+2 estén migradas (todos los servicios usan ApiIaXxxService) y 0 archivos importen tRPC:
- `libs/trpc/*` (cliente) · `server/routers/lambda/*` (los 25 routers) · `database/` (drizzle schemas)
- Quitar las 8 deps del package.json (drizzle/pglite/pg/neon/trpc).
- **Aquí cae el grueso de los 40k módulos** — drizzle deja de existir en el front.

## Orden de ejecución (tras E2E 04-jun)

1. Confirmar flag `USE_API_IA_ENDPOINTS` activo y estable en prod (chat-core por api-ia).
2. CAPA 1: en message/session/topic, eliminar server.ts/client.ts/_deprecated.ts (el servicio
   queda solo con apiIa.ts + index.ts). El servicio SIGUE existiendo. Medir módulos.
3. CAPA 2: crear ApiIaXxxService para los demás servicios (image/chatGroup/thread/... ) según
   api-ia vaya exponiendo endpoints. Cada servicio se mantiene, solo cambia su data-layer.
4. CAPA 3: cuando 0 servicios usen tRPC → borrar infra tRPC + drizzle schemas + deps.
   **Medir reducción final de módulos.**

> Cada capa: validar chat-ia 200 + tests + medir módulos ANTES de la siguiente. Reversible por git.
> NINGÚN servicio se borra — todos se gestionan igual, sin drizzle por debajo.
