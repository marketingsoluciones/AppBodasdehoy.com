# [API-IA] Exponer 15 endpoints REST para CAPA 2 PASO C

> **Solicitado por**: COORD-AppEventos · **Fecha**: 2026-06-04
> **Bloquea**: borrar drizzle + pglite + @trpc/* del package.json chat-ia (CAPA 3)
> **Impacto esperado**: reducción de ~25k módulos compilados, build chat-ia 10min → 3-4min

---

## Contexto

CAPA 1 PASO C YA ejecutada (2026-06-04, commit `969fa493`): `message`, `session`, `topic`
ahora persisten 100% vía api-ia (REST), eliminados 14 archivos tRPC + tests.

CAPA 2 pide replicar el patrón para los 15 servicios restantes. Cada uno necesita:
1. Endpoint(s) REST en api-ia (`GET/POST/PATCH/DELETE /chat/<dominio>/...`)
2. Shape JSON request/response confirmado (igual al modelo Drizzle actual o documentado si cambia)
3. Auth: igual que los actuales (`Authorization: Bearer <Firebase idToken>`, `X-Development: <tenant>`)

Patrón a replicar en front: `ApiIaXxxService` (fetch a api-ia REST) detrás de
flag `NEXT_PUBLIC_USE_API_IA_ENDPOINTS`. Cuando esté activo, el index.ts del
servicio usa solo el cliente REST y borramos server.ts/client.ts tRPC.

---

## Lista priorizada de endpoints

### 🔴 PRIORIDAD ALTA — afecta /chat directamente

#### 1. `image` (frontend: `services/image.ts` — 222 líneas, 2 refs tRPC)

Usado en avatares de mensajes, attachments del chat, miniaturas de fotos.

**Métodos actuales (vía tRPC `imageRouter`):**
- `createImage({ fileId, url, prompt? }) → Image`
- `getImageItem({ id }) → Image | null`
- `removeImage({ id }) → void`

**Endpoints REST propuestos:**
- `POST   /chat/images` body `{ fileId, url, prompt? }` → `{ id, fileId, url, prompt, createdAt }`
- `GET    /chat/images/:id` → `{ id, fileId, url, prompt, createdAt }` o `null`
- `DELETE /chat/images/:id` → `204`

---

#### 2. `upload` (frontend: `services/upload.ts` — 487 líneas, 2 refs tRPC)

Usado en drag & drop, file picker, paste de archivos en el chat.

**Métodos actuales (vía tRPC `fileRouter.uploadFile`):**
- Upload chunked: presigned URL + finalize
- Validación tamaño/mime
- Vincular a knowledge base / message attachment

**Endpoints REST propuestos:**
- `POST   /chat/uploads/presign` body `{ filename, contentType, size }` →
  `{ uploadId, putUrl, headers, expiresAt }`
- `POST   /chat/uploads/:uploadId/complete` body `{ etag }` →
  `{ fileId, url, name, size, contentType, createdAt }`
- `POST   /chat/uploads/abort` body `{ uploadId }` → `204`

Compatible con flujo R2 multitenant ya existente (`singleUpload` api-mcp).

---

### 🟡 PRIORIDAD MEDIA

#### 3. `chatGroup` (frontend: `services/chatGroup/server.ts` — 67 líneas, ~9 métodos)

Chat rooms multi-usuario (invitar al copilot a un evento, etc.).

**Métodos actuales:**
- `getChatGroups({ filter? }) → ChatGroup[]`
- `getChatGroupById(id) → ChatGroup`
- `createChatGroup(input) → ChatGroup`
- `updateChatGroup(id, input) → ChatGroup`
- `removeChatGroup(id) → void`
- `addMember(groupId, userId, role) → ChatGroupMember`
- `updateMember(groupId, userId, role) → ChatGroupMember`
- `removeMember(groupId, userId) → void`
- `listMembers(groupId) → ChatGroupMember[]`

**Endpoints REST propuestos:**
- `GET    /chat/groups?filter=...` → `ChatGroup[]`
- `GET    /chat/groups/:id` → `ChatGroup`
- `POST   /chat/groups` body `{ name, description?, ... }` → `ChatGroup`
- `PATCH  /chat/groups/:id` body partial → `ChatGroup`
- `DELETE /chat/groups/:id` → `204`
- `GET    /chat/groups/:id/members` → `ChatGroupMember[]`
- `POST   /chat/groups/:id/members` body `{ userId, role }` → `ChatGroupMember`
- `PATCH  /chat/groups/:id/members/:userId` body `{ role }` → `ChatGroupMember`
- `DELETE /chat/groups/:id/members/:userId` → `204`

---

#### 4. `global` (frontend: `services/global.ts` — 79 líneas, 4 refs tRPC)

Config global por usuario (preferences, defaults UI).

**Métodos actuales:**
- `getGlobalConfig() → GlobalConfig`
- `updateGlobalConfig(patch) → GlobalConfig`

**Endpoints REST propuestos:**
- `GET   /chat/me/global-config` → `GlobalConfig`
- `PATCH /chat/me/global-config` body partial → `GlobalConfig`

---

#### 5. `aiProvider` (frontend: `services/aiProvider/server.ts` — 43 líneas)

Config de providers IA (OpenAI key, Anthropic key, etc.) y modelos disponibles.

**Métodos actuales:**
- `getAiProviderList() → AiProvider[]`
- `getAiProviderById(id) → AiProvider`
- `getAiProviderRuntimeState({ isLogin }) → RuntimeState`
- `createAiProvider(input) → AiProvider`
- `updateAiProvider(id, patch) → AiProvider`
- `updateAiProviderConfig(id, config) → AiProvider`
- `removeAiProvider(id) → void`

**Endpoints REST propuestos:**
- `GET    /chat/ai-providers?login=true|false` → `{ providers: AiProvider[], runtime: RuntimeState }`
- `GET    /chat/ai-providers/:id` → `AiProvider`
- `POST   /chat/ai-providers` body input → `AiProvider`
- `PATCH  /chat/ai-providers/:id` body partial → `AiProvider`
- `PATCH  /chat/ai-providers/:id/config` body `{ config }` → `AiProvider`
- `DELETE /chat/ai-providers/:id` → `204`

---

#### 6. `file` (frontend: `services/file/server.ts` — 53 líneas)

Files del knowledge base (PDFs, docs, sheets parseados).

**Métodos actuales:**
- `listFiles({ filter?, knowledgeBaseId? }) → File[]`
- `getFile(id) → File`
- `createFile(input) → File`
- `removeFile(id) → void`
- `removeFiles(ids) → void`
- `checkFileHash(hash) → { exists: boolean, fileId?: string }`

**Endpoints REST propuestos:**
- `GET    /chat/files?filter=...&knowledgeBaseId=...` → `File[]`
- `GET    /chat/files/:id` → `File`
- `POST   /chat/files` body input → `File`
- `DELETE /chat/files/:id` → `204`
- `POST   /chat/files/batch-delete` body `{ ids: string[] }` → `204`
- `GET    /chat/files/check-hash?hash=...` → `{ exists, fileId? }`

---

#### 7. `user` (frontend: `services/user/server.ts` — 47 líneas)

Perfil del usuario y settings (preferences, locale, theme).

**Métodos actuales:**
- `getUserState() → UserState`
- `updatePreference(patch) → void`
- `updateGuide(patch) → void`
- `updateSettings(patch) → void`
- `resetSettings() → void`

**Endpoints REST propuestos:**
- `GET    /chat/me/state` → `UserState`
- `PATCH  /chat/me/preference` body partial → `void`
- `PATCH  /chat/me/guide` body partial → `void`
- `PATCH  /chat/me/settings` body partial → `void`
- `POST   /chat/me/settings/reset` → `void`

---

#### 8. `knowledgeBase` (frontend: `services/knowledgeBase.ts` — 34 líneas, 8 refs tRPC)

Bases de conocimiento (colecciones de archivos para RAG).

**Métodos actuales:**
- `getKnowledgeBaseList() → KnowledgeBase[]`
- `getKnowledgeBaseById(id) → KnowledgeBase`
- `createKnowledgeBase(input) → KnowledgeBase`
- `updateKnowledgeBase(id, patch) → KnowledgeBase`
- `removeKnowledgeBase(id) → void`
- `addFilesToKnowledgeBase(kbId, fileIds[]) → void`
- `removeFilesFromKnowledgeBase(kbId, fileIds[]) → void`

**Endpoints REST propuestos:**
- `GET    /chat/knowledge-bases` → `KnowledgeBase[]`
- `GET    /chat/knowledge-bases/:id` → `KnowledgeBase`
- `POST   /chat/knowledge-bases` body input → `KnowledgeBase`
- `PATCH  /chat/knowledge-bases/:id` body partial → `KnowledgeBase`
- `DELETE /chat/knowledge-bases/:id` → `204`
- `POST   /chat/knowledge-bases/:id/files` body `{ fileIds: string[] }` → `void`
- `DELETE /chat/knowledge-bases/:id/files` body `{ fileIds: string[] }` → `void`

---

### 🟢 PRIORIDAD BAJA — uso esporádico o features deprecables

#### 9. `thread` (frontend: `services/thread/server.ts` — 32 líneas)

Threading dentro de un topic.

**Endpoints REST propuestos:**
- `GET    /chat/topics/:topicId/threads` → `Thread[]`
- `POST   /chat/topics/:topicId/threads` body `{ name, ... }` → `Thread`
- `DELETE /chat/threads/:id` → `204`

---

#### 10. `tool` (`services/tool.ts` — 22 líneas, 2 refs tRPC)

Manifests + state de tools custom (plugins MCP/función).

**Endpoints REST propuestos:**
- `GET    /chat/tools/manifests?ids=...` → `ToolManifest[]`
- `GET    /chat/tools/state/:identifier` → `any`

---

#### 11. `plugin` (`services/plugin/server.ts` — 42 líneas)

Plugins externos (registry de plugins de terceros).

**Endpoints REST propuestos:**
- `GET    /chat/plugins/installed` → `InstalledPlugin[]`
- `POST   /chat/plugins/install` body `{ identifier, version, manifest }` → `InstalledPlugin`
- `DELETE /chat/plugins/:identifier` → `204`
- `GET    /chat/plugins/:identifier/settings` → `any`
- `POST   /chat/plugins/:identifier/settings` body settings → `void`

---

#### 12. `generation` (`services/generation.ts` — 16 líneas, 3 refs tRPC)

Image generation (DALL-E, stable diffusion).

**Endpoints REST propuestos:**
- `GET    /chat/generations?topicId=...` → `Generation[]`
- `POST   /chat/generations` body `{ prompt, model, ... }` → `Generation`
- `DELETE /chat/generations/:id` → `204`

---

#### 13. `rag` (`services/rag.ts` — 34 líneas, 8 refs tRPC)

RAG queries (retrieval augmented generation).

**Endpoints REST propuestos:**
- `POST   /chat/rag/semantic-search` body `{ query, knowledgeBaseId, topK }` → `Chunk[]`
- `POST   /chat/rag/parse-chunks` body `{ fileId }` → `{ chunksCount }`
- `GET    /chat/rag/chunks/:id` → `Chunk`

---

#### 14. `ragEval` (`services/ragEval.ts` — 71 líneas, 13 refs tRPC)

RAG evaluation (golden datasets, scoring).

**Endpoints REST propuestos:** (similar a knowledgeBase pero para evaluación)
- CRUD `eval-datasets`, `eval-cases`, `eval-runs`. Detalle a definir cuando se priorice.

---

#### 15. `discover` (`services/discover.ts`)

⚠️ Usa `react-router-dom` legacy. Migrar aparte o eliminar antes de PASO C.

---

## Auth y multitenancy

Todos los endpoints siguen el mismo contrato actual:

```
Authorization: Bearer <Firebase idToken o JWT api-ia>
X-Development: <tenant slug, ej. "bodasdehoy">
Content-Type: application/json
```

api-ia ya valida el JWT y descubre `userId + tenant` (igual que `/chat/messages`,
`/chat/sessions`, `/chat/topics` ya hacen). Replicar ese resolver para los nuevos
endpoints.

## Contract role (mensajes)

Recordatorio: `front ↔ api-ia` usa role MINÚSCULAS (`user`, `assistant`, `tool`).
`api-ia ↔ api-mcp` usa MAYÚSCULAS (`USER`, `ASSISTANT`, `TOOL`) — api-ia uppercasea
al pasar al persistor. NO cambiar front a mayúsculas (rompe facturación assistant).

---

## Plan de integración propuesto

Por cada servicio listo en api-ia:

1. api-ia confirma endpoints + smoke con `curl` + Postman collection (opcional).
2. COORD-FRONT crea `services/<svc>/apiIa.ts` implementando los métodos REST.
3. Simplifica `services/<svc>/index.ts` → usar SOLO `ApiIaXxxService` (igual que CAPA 1).
4. Borra `server.ts` / `client.ts` / `_deprecated.ts` del servicio.
5. Verifica TypeScript + smoke local con `NEXT_PUBLIC_USE_API_IA_ENDPOINTS=true`.
6. Commit + push.

**Iteración bloque a bloque, no esperar al lote completo.**

Cuando los 15 estén migrados:
7. Borrar deps físicas del `package.json` chat-ia:
   - `drizzle-orm`, `drizzle-zod`
   - `@electric-sql/pglite`, `pg`, `@neondatabase/serverless`
   - `@trpc/client`, `@trpc/react-query`, `@trpc/server`
8. Borrar `src/libs/trpc/*`, `src/server/routers/lambda/*`, `src/database/*`.
9. Aquí cae el grueso de los 40k módulos (esperado: ~25k menos).

---

## Pregunta a api-ia

- ¿Plan + fecha para los **2 PRIORIDAD ALTA** (`image`, `upload`)? Con esos 2 cubrimos el 80% del impacto en /chat.
- ¿Algún endpoint de la lista ya existe parcialmente y no lo sabemos? (auditar `src/app/(backend)/api/backend/[...path]` en chat-ia que proxea a api-ia)
- ¿Algún cambio de naming/shape vs lo propuesto? (encantados de adaptarnos)

DRI: api-ia → confirmar plan en hilo Slack `1779046688.849779`.
