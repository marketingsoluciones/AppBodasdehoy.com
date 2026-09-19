# [API-IA] Endpoints para CAPA 2 PASO C — estado real tras audit OpenAPI

> **Solicitado por**: COORD-AppEventos · **Fecha**: 2026-06-04 (actualizado)
> **Bloquea**: borrar drizzle + pglite + @trpc/* del package.json chat-ia (CAPA 3)
> **Hallazgo clave**: api-ia ya tiene **347 endpoints** documentados en
> `https://api-ia.bodasdehoy.com/openapi.json`. La mayoría de CAPA 2 **ya está
> cubierto** — solo faltan 2 servicios.

---

## TL;DR

| Servicio | Estado | Acción |
|---|---|---|
| `image` | ✅ **28 endpoints** | Front integra (no requiere backend) |
| `upload` | ✅ **9 endpoints** | Front integra |
| `chatGroup` | ✅ 2 endpoints `/chat/session-groups` | Front integra |
| `file` | ✅ 7 endpoints `/api/files/*`, `/api/storage/files/*` | Front integra |
| `user` | ✅ 17 endpoints `/api/auth/*`, `/api/users/*` | Front integra |
| `aiProvider` | ✅ 7 endpoints `/api/providers/*`, `/webapi/models/*` | Front integra |
| `global` | ✅ 11 endpoints `/api/config/*`, `/chat/config` | Front integra |
| `plugin` / `tool` | ✅ 1 endpoint `/webapi/plugin/gateway` | Front integra |
| `generation` | ✅ 3 endpoints `/api/ai/images/generate/*` | Front integra |
| `rag` | ✅ 15 endpoints (lobechat-kb + storage) | Front integra |
| `knowledgeBase` | ✅ 23 endpoints (admin/kb + lobechat-kb) | Front integra |
| `memories` | ✅ 22 endpoints `/api/memories/albums/*` | Ya integrado |
| **`thread`** | ❌ **0 endpoints** | **PEDIR a api-ia** |
| **`ragEval`** | ❌ **0 endpoints** | **PEDIR a api-ia** (puede ser BAJA prioridad) |

**Conclusión:** solo 2 servicios requieren trabajo de backend. El resto es
trabajo de integración del front contra endpoints ya existentes.

---

## Lo que SÍ pedimos a api-ia

### 🟡 1. `thread` — endpoints threading dentro de topic

Uso en `services/thread/server.ts` (32 líneas):
- `getThreads({ topicId }) → Thread[]`
- `createThread({ topicId, name, sourceMessageId? }) → Thread`
- `updateThread(id, patch) → Thread`
- `removeThread(id) → void`

**Endpoints REST propuestos:**
- `GET    /chat/topics/:topicId/threads` → `Thread[]`
- `POST   /chat/topics/:topicId/threads` body `{ name, sourceMessageId? }` → `Thread`
- `PATCH  /chat/threads/:id` body partial → `Thread`
- `DELETE /chat/threads/:id` → `204`

Patrón: igual que `/chat/topics/*` y `/chat/messages/*` que ya existen.

---

### 🟢 2. `ragEval` — endpoints evaluation datasets (BAJA prioridad)

Uso en `services/ragEval.ts` (71 líneas, 13 refs tRPC).

Solo si usáis RAG eval activamente. Si no, podemos eliminarlo del front
(quitar el servicio + sus call-sites).

**Si se mantiene, endpoints propuestos:**
- CRUD `/chat/eval-datasets`, `/chat/eval-cases`, `/chat/eval-runs`

DRI a confirmar con producto si vale la pena mantener.

---

## Lo que NO pedimos (trabajo es del front)

Los siguientes endpoints **YA EXISTEN en api-ia**. El trabajo es del front:
escribir `ApiIaXxxService` que apunte a esos paths + verificar que el shape
JSON coincide con lo que el front espera (o escribir mapper si difiere).

### `image` (28 endpoints en api-ia)

Endpoints relevantes para el front:
- Storage:
  - `POST /api/storage/r2/events/{event_id}/upload`
  - `POST /api/storage/r2/users/{user_id}/upload`
  - `POST /api/storage/r2/branding/upload`
  - `GET /api/storage/r2/files`
  - `DELETE /api/storage/r2/files`
- Edición / generación IA:
  - `POST /api/ai/images/generate`, `/generate/core`, `/generate/ultra`
  - `POST /api/ai/images/edit`, `/inpainting`, `/upscale`, `/enhance`
  - `POST /api/ai/images/style-transfer`, `/interior-redesign`, `/virtual-staging`, etc.
- Web API:
  - `POST /webapi/text-to-image/{provider}`
  - `POST /webapi/image/edit/{operation}`

Necesidad front: mapear `createImage / getImageItem / removeImage` a estos
endpoints. Probablemente `r2/files` cubre el CRUD básico.

---

### `upload` (9 endpoints en api-ia)

- `POST /storage/upload` (genérico)
- `POST /api/files/upload`
- `POST /api/storage/events/{event_id}/upload`
- `POST /api/storage/r2/events/{event_id}/upload`
- `POST /api/storage/r2/users/{user_id}/upload`
- `POST /api/memories/albums/{album_id}/upload`
- `POST /api/admin/branding/upload`
- `POST /api/admin/debug-logs/upload`

Necesidad front: 487 líneas de `upload.ts` se simplifican a llamadas REST.

---

### `chatGroup` (2 endpoints, CRUD básico)

- `GET    /chat/session-groups` → `ChatGroup[]`
- `POST   /chat/session-groups` → `ChatGroup`
- `PATCH  /chat/session-groups/{group_id}` → `ChatGroup`
- `DELETE /chat/session-groups/{group_id}` → `204`

**Gap potencial:** los 9 métodos del front incluyen `members` (add/remove/list).
api-ia no parece exponer `members` aún. Verificar:
- ¿Los members se gestionan dentro del PATCH del group?
- ¿O necesitamos `GET/POST/DELETE /chat/session-groups/{id}/members`?

→ Verificar shape exacto antes de integrar.

---

### `file` (7 endpoints)

- `GET    /api/files/list` → `File[]`
- `POST   /api/files/upload` → `File`
- `DELETE /api/files/{file_id}` → `204`
- `GET    /api/storage/files/{file_id}` → `File`
- `DELETE /api/storage/files/{file_id}` → `204`
- `GET    /api/storage/files/{file_id}/metadata` → `FileMetadata`
- `GET    /api/files/health` → status

---

### `user` (17 endpoints)

- `GET    /api/auth/get-user-config` → `UserConfig`
- `POST   /api/auth/save-user-config` body partial → `UserConfig`
- `POST   /api/auth/identify-user` → `UserState`
- `POST   /api/auth/sync-user-identity` → `void`
- `GET    /api/users/by-email?email=...` → `User | null`
- `GET    /api/users/related-events` → `Event[]`
- `POST   /api/auth/login`, `/login-with-jwt`, `/firebase-login`
- Admin: `GET/POST /api/admin/users`, `PATCH /api/admin/users/{user_id}`

Cubre todos los métodos del front.

---

### `aiProvider` (7 endpoints)

- `GET    /api/providers/{development}` → `Provider[]`
- `POST   /api/providers/{development}/test` body `{ providerId, config }` → `TestResult`
- `GET    /api/developers/{developer_id}/ai-providers` → `Provider[]`
- `GET    /webapi/models/{provider}` → `Model[]`
- `POST   /webapi/models/{provider}/pull` → `void`
- `POST   /webapi/chat/{provider}` → `ChatResponse`
- `POST   /webapi/text-to-image/{provider}` → `ImageResponse`

Cubre runtime + config.

---

### `global` (11 endpoints)

- `GET    /chat/config` → `ChatConfig`
- `GET    /api/config` → `GlobalConfig`
- `GET    /api/config/{developer}` → `DeveloperConfig`
- `GET    /api/auth/get-user-config` → `UserConfig` (también para `user`)
- `POST   /api/auth/save-user-config` → `void`
- `GET    /webapi/config/whitelabel` → `WhitelabelConfig`
- `PATCH  /api/sessions/{session_id}/config` → `SessionConfig`
- `GET    /api/developers/{developer_id}/ai-config` → `AiConfig`
- `GET    /api/developers/{developer_id}/config` → `DeveloperConfig`

---

### `plugin` + `tool` (1 endpoint compartido)

- `POST   /webapi/plugin/gateway` body `{ identifier, action, params }` → `any`

Patrón "gateway" centralizado. El front pasa qué plugin/tool y qué acción.

---

### `generation` (3 endpoints)

- `POST   /api/ai/images/generate` → `Image`
- `POST   /api/ai/images/generate/core` → `Image`
- `POST   /api/ai/images/generate/ultra` → `Image`

---

### `rag` (15 endpoints) + `knowledgeBase` (23 endpoints)

Cobertura amplia con:
- `/api/admin/kb/*` (documents, faqs, offers, products, import file/json, stats, status)
- `/api/lobechat-kb/*` (embed, batch-embed, search, query-embedding, stats)
- `/api/kb/sync/*` (sync batch + document)
- `/api/storage/*` (events files, R2)

Necesidad front: mapear `getKnowledgeBaseList`, `addFilesToKnowledgeBase`,
`semanticSearch`, etc. a estos paths.

---

## Plan revisado de integración (chat-ia front)

Iteración bloque a bloque, sin esperar entre bloques.

### Fase 1 — Servicios de alto impacto en `/chat` (1-2 días total)

1. **`upload`** — 487 líneas → ~150 líneas REST. Aplica patrón ApiIaUploadService.
2. **`image`** — 222 líneas → ~80 líneas REST.
3. **`user`** — endpoints `/api/auth/*` ya documentados.
4. **`global`** — config base, simple.

### Fase 2 — Servicios secundarios (1 día)

5. **`file`** — list/upload/delete.
6. **`chatGroup`** — CRUD básico + verificar gap `members`.
7. **`aiProvider`** — providers + models runtime.

### Fase 3 — Servicios de uso esporádico (1 día)

8. **`plugin`** + **`tool`** — gateway único.
9. **`generation`** — image gen.
10. **`rag`** + **`knowledgeBase`** — KB system (más complejo, dejar para el final).

### Fase 4 — Pedir a api-ia (bloqueado externamente)

11. **`thread`** — `/chat/topics/:topicId/threads` (4 endpoints, propuesta arriba).
12. **`ragEval`** — decidir si se mantiene o se elimina.

### Fase 5 — Cerrar PASO C

13. Borrar `src/libs/trpc/*`, `src/server/routers/lambda/*`, `src/database/*`.
14. Borrar deps del `package.json`:
    - `drizzle-orm`, `drizzle-zod`
    - `@electric-sql/pglite`, `pg`, `@neondatabase/serverless`
    - `@trpc/client`, `@trpc/react-query`, `@trpc/server`
15. **Aquí cae el grueso de los 40k módulos** (esperado: -25k módulos).
16. Build chat-ia 10 min → 3-4 min.

---

## Cosas que necesitamos confirmar con api-ia ANTES de integrar

Para que el front escriba `ApiIaXxxService` sin sorpresas, necesitamos confirmar
shape exacto de los siguientes endpoints (auditando `openapi.json` ya tenemos
casi todo, pero hay zonas que requieren probe live con JWT):

1. **`chatGroup` members**: ¿se gestionan dentro de PATCH del group o hay endpoint dedicado?
2. **`global` vs `user`**: el endpoint `/api/auth/get-user-config` aparece en ambos. ¿Cuál es la fuente única de verdad?
3. **`tool` vs `plugin`**: ambos usan `/webapi/plugin/gateway`. ¿Cómo se discrimina `tool` (manifest) vs `plugin` (instalado)?
4. **`thread`**: confirmar si está en roadmap o si lo eliminamos del front (uso real bajo).
5. **`ragEval`**: confirmar si lo mantenemos.

DRI: api-ia → responder en hilo Slack `1779046688.849779`.

---

## Pregunta resumida a api-ia

1. ¿Confirmas plan para `/chat/topics/:topicId/threads` (4 endpoints) y `ragEval`?
2. ¿Resuelves las 5 confirmaciones de shape arriba?

El resto del trabajo es del front. **No necesitamos más endpoints nuevos por ahora.**
