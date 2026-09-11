# INFORME a api-mcp — Conexión eventos intermitente + bugs mutations invitados

> Para: BACKEND-api-mcp · De: COORD-AppEventos · 2026-05-28
> Objetivo: que api-mcp investigue y resuelva si procede. Toda evidencia es reproducible.
> Acceso usado: SSH read-only api-mcp + curl GraphQL prod + token Firebase fresco vía REST.

## Resumen ejecutivo

1. **🚨 P0 — Conexión a la DB de eventos (`MONGODB_DBEVENT_URI`/`prueba1`) es INTERMITENTE.** Sube y baja. Afecta TODAS las operaciones de eventos (reads + mutations). NO es problema de auth.
2. **🐛 3 bugs en mutations de invitados** (secundarios — sin conexión estable no aplican).

---

## P0 — Conexión eventos intermitente

### Evidencia A — reproducible en vivo (curl, token Firebase válido)
```
10/10 queries getEventos consecutivas (2026-05-28 03:41 UTC) → "La base de datos no está conectada" (0 OK)
```
Query usada:
```graphql
query { getEventos(pagination:{page:1,limit:1}){ total errors{code message} } }
```
Respuesta:
```json
{"data":{"getEventos":{"total":0,"errors":[{"code":"DATABASE_CONNECTION_ERROR",
  "message":"La base de datos no está conectada. Por favor, intente de nuevo en unos segundos."}]}}}
```
⚠️ Intermitencia confirmada: el **2026-05-27** (mismo tipo de token) la MISMA query devolvía `total:228` y `getEventosByUsuario`→`158`. Hoy 0/10. La conexión **flapea**.

### Evidencia B — logs api-mcp (SSH read-only)
```
266 ocurrencias de MongoNotConnectedError en /var/www/api-production/logs/combined.log
Rango temporal: 2026-05-21 14:36:53  →  2026-05-28 03:41:22  (≈1 semana, hasta AHORA)
```
Stack (recurrente):
```
MongoNotConnectedError: Client must be connected before running operations
  at autoConnect (mongoose/node_modules/mongodb/.../execute_operation.ts:139)
  at Collection.countDocuments (...)
  at model.Query.exec (...)
  at Object.getEventos (src/graphql/resolvers/evento-queries.resolver.ts:127)
```

### Diagnóstico
- NO es auth: el token es válido y pasa `resolveDualAuth` (cuando la conexión está arriba, devuelve 158/228 eventos correctamente).
- Es la conexión Mongoose a `MONGODB_DBEVENT_URI` (DB `prueba1`) que **no se mantiene viva / no reconecta**. El driver lanza `MongoNotConnectedError` a nivel `autoConnect`.
- Datos INTACTOS: `prueba1.eventos` = 2574 docs (verificado por consulta directa cuando la conexión estaba arriba).

### Hipótesis a investigar (BACKEND)
- ¿Connection pool agotado / `maxPoolSize`?
- ¿Falta `serverSelectionTimeoutMS` / auto-reconnect en la conexión DBEVENT?
- ¿La conexión se abre al arranque pero Atlas la cierra por idle y no se re-abre?
- ¿Se usa una conexión Mongoose separada para DBEVENT que no tiene los mismos listeners de reconexión que la principal?

---

## Bugs mutations invitados (verificados, secundarios al P0)

### Bug 1 — `removerInvitado` (single) es NO-OP — FIX DE 1 LÍNEA
`src/graphql/resolvers/evento-mutations.resolver.ts:706-707`
```js
evento.invitados_array = evento.invitados_array.filter(
  (invitado: any) => invitado.id !== invitado_id   // ❌ usa .id; los invitados usan _id
);
```
`invitado.id` es `undefined` → `undefined !== invitado_id` siempre true → no filtra → retorna `success:true` pero NO borra.
**Fix** (consistente con vuestras líneas 754 y 905):
```js
(invitado: any) => invitado._id?.toString() !== invitado_id && invitado.id !== invitado_id
```
Workaround front: `removerInvitadosBatch` (SÍ funciona).

### Bug 2 — `agregarInvitado` sin `_id` → invitado irremovible
Si el `invitado:JSON` no trae `_id`, api-mcp lo guarda sin id → no se puede targetear para borrar. Sugerencia: autogenerar `_id` server-side si falta.

### Bug 3 — `agregarInvitadosBatch` → respuesta rompe
```
{"errors":[{"message":"Cannot return null for non-nullable field EventoBatchResponse.processed."}]}
```
El resolver no setea `processed` (declarado `Int!` en el typedef) → la respuesta GraphQL falla aunque la operación corra.

### ✅ Verificado CORRECTOS (no tocar)
`borraMesa` (resolver:1213 filtra por `_id`), borrar menu (1384), borrar pago (2342 `_id||id`), planSpace elements (1867 `_id||id`).

---

## Petición a api-mcp
1. **P0**: investigar y estabilizar la conexión `MONGODB_DBEVENT_URI` (pool/keepalive/reconnect). Es el bloqueador raíz de todo el sistema de eventos.
2. Aplicar fix `removerInvitado` (1 línea) + `agregarInvitadosBatch.processed` + autogenerar `_id` en agregarInvitado.
3. (Aparte) Limpiar invitado de test huérfano `[E2E-TEST] BORRAR` en evento `69fbfc67387842179a486b10`.

## Cleanup pendiente nuestro
Tras estabilizar la conexión, FRONT cierra la migración de los 331 call-sites apiapp→api-mcp (keystone de eventos ya migrado).
