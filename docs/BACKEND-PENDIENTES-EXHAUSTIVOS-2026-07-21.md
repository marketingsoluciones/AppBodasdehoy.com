# BACKEND PENDIENTES — inventario exhaustivo 2026-07-21

> Auditoría exhaustiva de TODO lo escalado/documentado/enterrado que espera acción
> de **api-ia** (Python/agent runtime) o **api-mcp** (GraphQL Node) o equipos
> externos (infra/producto). Verificado contra `docs/backend-asks/*`, todos los
> `PENDIENTES-*` / `PLAN-*` / `HANDOFF-*` / `QA-*` recientes, y greps de
> TODO/FIXME/PENDING sobre `apps/chat-ia/src`, `apps/appEventos`, `packages/shared/src`.
>
> **Fuente única de verdad** del estado de bloqueos externos al front. Reemplaza
> conceptualmente `docs/RESUMEN-PENDIENTES-Y-BLOQUEOS-API-IA.md` (feb-25, obsoleto).
>
> Rama base al auditar: `dev` @ `e8b36a43` (post sprints α+β+γ del PR #204/#205/#206).

---

## Resumen ejecutivo

| Equipo | Items | P0 | P1 | P2 |
|---|---:|---:|---:|---:|
| **api-ia** | 32 | 2 | 12 | 18 |
| **api-mcp** | 26 | 1 | 12 | 13 |
| **cross-cutting** | 4 | 0 | 2 | 2 |
| **infra / SRE** | 3 | 0 | 1 | 2 |
| **producto** | 7 | 0 | 2 | 5 |
| **TOTAL** | **72** | **3** | **29** | **40** |

**P0 (bloquean usuario final) — 3:**
- `IA-1` `get_event_guests` sin `activeEventId` default (Copilot no puede leer datos del evento).
- `IA-5` Write-guard mutación IA server-side (asimetría read/write; front ya emite `confirmation_required`).
- `MCP-20` api-mcp restart loop recurrente (cascada 502/timeout en save invitados/grupo/menú).

**P1 críticos (bloquean sprint del front) — top 10:**
- `IA-13` Web Push emisor real (VAPID keys server, POST/DELETE subscribe, hook por SSE, purga 410) — push con app cerrada NO funciona hoy.
- `IA-21` Migrar 9 routers lambda a REST api-ia — desbloquea sprint γ C1c (borrar drizzle+pglite+@lobechat/database del root, ~50MB bundle).
- `IA-25` `POST /api/messages/send` → 500 con payload válido (`trc_2d8a5c95eace`) — mensaje WhatsApp de prueba no envía.
- `IA-26` `GET /api/messages/conversations/{id}` devuelve `[]` aunque lista dice "3 mensajes" — hilo vacío.
- `IA-27` Middleware resolución `development` (JWT→Origin) en `/api/messages/*` — bloquea retirar muletas `?development=`.
- `MCP-3` mutation `createPlanSpace` NO existe — botón "Añadir plano" bloqueado.
- `MCP-4` `whatsappSendMessage` stub (solo loguea) — canal WhatsApp no funciona por esta vía.
- `MCP-11` Emitir primer `comment_added` real — front cableado esperando emit.
- `MCP-17` Bridge `conversation↔invitado` para `actualizarInvitado` desde bandeja — RSVP sidebar solo optimista.
- `MCP-24` Bandeja handoff v2 (12 features UI + 6 endpoints): `guestStatus`, `assignedToType`, `internalNotes`, IA drafts CRUD, `iaGenerated/callTranscription`.

---

## 1 · api-ia (Python / agent runtime) — 32 items

| # | Item | Motivo dep | Escalado en | Bloquea front | Prio |
|---|---|---|---|---|---|
| IA-1 | `get_event_guests` toma `metadata.activeEventId` como default | tool corre server-side, front ya envía metadata | `ANALISIS-COPILOT-CONTEXTO-EVENTO-2026-07-03.md#5`, `PLAN-CONSOLIDADO#B2` | Sí | P0 |
| IA-2 | Añadir param `status` (all/confirmed/pending/rejected) a `get_event_guests` | firma tool api-ia | ANALISIS §5 | Cierra multi-turn robustness | P1 |
| IA-3 | Limitar reintentos de tool a 1 + propagar error GraphQL al LLM | loop server-side | ANALISIS §5 | Evita `tool_start` sin `tool_result` | P1 |
| IA-4 | Si `eventScope='all'` y op requiere evento → preguntar con `availableEvents` | orquestador server | ANALISIS §5 + `PLAN-CONSOLIDADO#X2(d)` | Sí — bloquea X2(d) v2 backend | P1 |
| IA-5 | Write-guard: mutación IA sin activeEventId resuelto → bloquear + confirm | seguridad server | ANALISIS §5.1 | Front ya emite `confirmation_required` (X2(a) cerrado); falta simetría write | P0 |
| IA-6 | Sticky evento por conversación (persistir `session.metadata.eventId`) | requiere columna en storage server | `PLAN-CONSOLIDADO#X2(b)` | Front MVP client-only ya; migrar cuando api-ia soporte | P1 |
| IA-7 | Filtrar `availableEvents` por permisos (respetar `compartido_array`) | seguridad server | ANALISIS §5.1 | Sí | P1 |
| IA-8 | Normalización nombres eventos server-side | robustez matching | ANALISIS §5.1 | Front util ya (X2(c) cerrado); redundancia | P2 |
| IA-9 | P2 intent routing (CRUD/nav/consejo) | `rest_chat_handler.py:~L2055` | `PLAN-MEJORA-IA-ROUTING-Y-CALIDAD.md#P2` + `PLAN-CONSOLIDADO#B6` | Calidad respuestas | P1 |
| IA-10 | P3 fallback Groq `EMPTY_RESPONSE` (retry con next provider) | 245 ocurrencias históricas | `PLAN-MEJORA-IA-ROUTING-Y-CALIDAD.md#P3` | Reduce 503 usuario | P1 |
| IA-11 | P4 `user_id` en `chat_events.ndjson` | headers server extraction | `PLAN-MEJORA-IA-ROUTING-Y-CALIDAD.md#P4` | Observabilidad | P2 |
| IA-12 | P5 `conversation_length` + `has_tool_calls` en NDJSON | tracking backend | `PLAN-MEJORA-IA-ROUTING-Y-CALIDAD.md#P5` | Observabilidad | P2 |
| IA-13 | **Web Push emisor real** (VAPID keys server, POST/DELETE `/api/push/subscribe`, hook por SSE, purga 410) | infra server + web-push lib | `SPRINT-4-WEB-PUSH.md` §"Pendiente backend" | Sí — push con app cerrada NO funciona | P1 |
| IA-14 | `draftState` field (contar items `pending`) | api-ia debe exponer | [messages/page.tsx:41](../apps/chat-ia/src/app/[variants]/(main)/messages/page.tsx#L41) | Chip "Pendientes IA" hardcoded a 0 | P2 |
| IA-15 | Agentes: `config.disabled` field en `LobeAgentConfig` | schema server | [agentes/page.tsx:20-22](../apps/chat-ia/src/app/[variants]/(main)/agentes/page.tsx#L20) (Slack ts 1784383734) | Estado activo/pausado MOCK localStorage | P2 |
| IA-16 | Agentes: `GET /api/backend/chat/agents/{userId}/metrics?period=today` | server | agentes/page.tsx:23-25 | Métricas MOCK | P2 |
| IA-17 | Agentes: `POST /api/backend/chat/agents/{userId}/channel-assignments` | server | agentes/page.tsx:206 TODO | Canales MOCK localStorage | P2 |
| IA-18 | Agentes: SSE type='handoff' | server evento | agentes/page.tsx:28-29 | Actividad reciente vacía | P2 |
| IA-19 | Campañas: cola api-ia (submit real) | server | [admin/campaigns/page.tsx:192](../apps/chat-ia/src/app/[variants]/(main)/admin/campaigns/page.tsx#L192) | Botón submit fake setTimeout | P2 |
| IA-20 | Billing datos por día (desglose de total_tokens) | server aggregate | [useBillingData.ts:78](../apps/chat-ia/src/app/[variants]/(main)/admin/billing/hooks/useBillingData.ts#L78) | UI sin desglose | P2 |
| IA-21 | **Migración 9 routers lambda a REST api-ia** (aiChat/memory/agent/generation/apiKey/aiModel/exporter/importer/market) | tRPC lambda usa `@lobechat/database` local | `PLAN-CONSOLIDADO#C1c` XL | Sí — bloquea borrar drizzle+pglite del root | P1 |
| IA-22 | SMS channel backend | canal server | [messages/[channel]/page.tsx:20](../apps/chat-ia/src/app/[variants]/(main)/messages/[channel]/page.tsx#L20) `PENDING_BACKEND_CHANNELS` | Canal sms rota UI | P2 |
| IA-23 | Inbox REST `USE_API_IA_INBOX` (6 lecturas) | api-ia ya lo tiene, falta activar | [inbox-api.ts:2,30-31](../apps/chat-ia/src/services/inbox-api.ts#L2) | Front usa fallback | P2 |
| IA-24 | `/api/messages/send` genérico `storage_unavailable` (Redis) | Redis infra | `INFORME-PENDIENTES-Y-DRI-2026-06-12.md#IA-7` | Front ya no lo usa | P2 |
| IA-25 | **`POST /api/messages/send` → 500 payload válido** (`trc_2d8a5c95eace`) | root cause server | `docs/backend-asks/slack-ready/BUGS-MENSAJERIA-PARA-API-IA.code.txt#BUG-1` | Sí — WhatsApp test no envía | P1 |
| IA-26 | **`GET /api/messages/conversations/{id}` devuelve `[]`** aunque lista dice "3 mensajes" | mapeo IDs server | mismo doc #BUG-2 + `INFORME-PENDIENTES-Y-DRI#IA-8` | Sí — hilo vacío | P1 |
| IA-27 | **Middleware resolución `development`** (JWT→Origin) en `/api/messages/*` | server | `PENDIENTES-POR-EQUIPO-2026-06-14.md#API-IA` | Sí — bloquea retirar muletas `?development=` | P1 |
| IA-28 | Branding `/chat/config` construye URLs con `https://https://` duplicado | origen server | `slack-ready/PENDIENTES-PARA-API-IA.code.txt#PENDIENTE-6` + `INFORME-PENDIENTES-Y-DRI#IA-6` | Front sanea; falta arreglar origen | P2 |
| IA-29 | `/api/auth/save-user-config` → 502 (debería 404) mapping | server | `blocking/BLOQUEANTE-api-ia.md#BUG-4` | No bloquea | P2 |
| IA-30 | `POST /api/files/register-metadata` (sin re-subir binario) | endpoint nuevo server | `slack-ready/PENDIENTES-PARA-API-IA.code.txt#PENDIENTE-4` | Frágil `createFile` passthrough en `services/file/apiIa.ts:77-91` | P2 |
| IA-31 | `GET /image/generations/{id}/status` dedicado | server endpoint | mismo #PENDIENTE-5 | Front deriva del GET | P2 |
| IA-32 | Batch-embed-file lookup file_id → R2 puro (Fase 2 sin `text`) | server descarga interna | `RAG-PARTE-A-CERRADA-PARA-API-IA.code.txt#3` | Front listo, falta smoke | P2 |

## 2 · api-mcp (GraphQL Node) — 26 items

| # | Item | Motivo dep | Escalado en | Bloquea front | Prio |
|---|---|---|---|---|---|
| MCP-1 | `CRM_NotesResponse.notes` non-nullable devuelve `null` | resolver `getCRMNotesByMultipleEntities` | `docs/BUG-CRM-NOTES-NON-NULLABLE-2026-07-07.md` | Front defensivo ya ([useCRMNotes.ts:113](../packages/shared/src/crm-ui/useCRMNotes.ts#L113)); backend abierto | P1 |
| MCP-2 | Enum `CRM_NoteEntityType` — Mongo falta `CONVERSATION` (SDL sí lo tiene) | `dist-production/src/db/models/note.js` | `AUDITORIA-CRM-INFRAUTILIZADO-2026-06-24.code.txt#L83-108` | Front usa `ENTITY` catch-all | P2 |
| MCP-3 | **`createPlanSpace` mutation NO existe** | schema api-mcp | `QA-REDISENO-MESAS-2026-07-17.md:88` + `PLAN-REDISENO-MESAS#L15,27,122` | Sí — botón "Añadir plano" no expone | P1 |
| MCP-4 | **`whatsappSendMessage` es STUB** (solo loguea) | resolver `evento-mutations.resolver.ts:2575` | [whatsapp.ts:40-48](../apps/chat-ia/src/services/mcpApi/whatsapp.ts#L40) | Front no cablea | P1 |
| MCP-5 | `removerInvitado` filtra `.id` en vez de `._id` → no-op | resolver `evento-mutations.resolver.ts:707` | `PENDIENTES-MAESTRO-2026-06-11.md#MCP-3` + Slack ts 1779920471 | Front usa `removerInvitadosBatch` workaround | P2 |
| MCP-6 | `agregarInvitado` sin `_id` cliente → doc orphan | resolver | mismo doc | Front usa `agregarInvitadosBatch` | P2 |
| MCP-7 | `getUsersByIds` User incompleto (falta `displayName/photoURL/phoneNumber/onLine`) | schema server | `F1-PARA-API-MCP-pendientes-finales.txt#[1]` + `F10#P9` | UX degradada SocketControlator/AddUserToEvent | P2 |
| MCP-8 | `getAllBusinesses` types `Unknown` (`searchCriteriaBusiness`, `sortCriteriaBusiness`) | schema server | `F1#[2]` + `F10#P10` | `Resumen/BlockLugarEvento.tsx` no carga negocios | P2 |
| MCP-9 | Cat C restantes: pagos boda + getAllProducts + generatePdf + getGeoInfo + getPlanSpaceSelect + getPsTemplate + getItinerario lectura + updateTasksOrder | ops apiapp legacy no migradas | `PARA-API-MCP.md#1)` + `HANDOFF-2026-07-06.md#3.4` | Impide apagar droplet apiapp | P2 |
| MCP-10 | `aiImageProvider/aiImageModel` fields en schema whitelabel | schema server | `HANDOFF-2026-07-06.md#3.4` + memory `feedback_mcp_whitelabel_ai_config_null` | Whitelabel bodasdehoy fallback | P2 |
| MCP-11 | **Emitir primer `comment_added` real** (shape acordado) | evento server | `HANDOFF-2026-07-06.md#P2-comment_added` | Front cableado en `useUnifiedFeed.ts:65` esperando | P1 |
| MCP-12 | Diff dry-run 275 huérfanos `development=null` | investigación server | `HANDOFF-2026-07-06.md#P1-275huerfanos` | Data-fix backend | P1 |
| MCP-13 | Enunciado BUG-07 whitelabel (posible `aiProvider/aiModel=null` sin `supportKey`) | falta enunciado | `HANDOFF-2026-07-06.md#BUG-07` + `PLAN-CONSOLIDADO#B3` | P1 timeout keys >15s | P1 |
| MCP-14 | Magic-link specs completos (endpoint emisor + validador + TTL + redirect base + JWT secret) | server | `HANDOFF-2026-07-06.md#P2-magic-link` — stub 501 en `pages/auth/magic/[token].tsx` | Front no valida hasta backend defina | P2 |
| MCP-15 | Smoke SSH BUG-09 currency USA/Vzla | SSH backend | `HANDOFF-2026-07-06.md#P2-smoke-ssh` + `scripts/smoke-bug09-currency.sh` | Verificación | P2 |
| MCP-16 | **`mentions[]` en `createCRMNote`** → notif tipo `mention` al mencionado | resolver + emit notif | `HANDOFF-QA-COMUNICACION-2026-07-09.md#C2` + [MentionAutocomplete.tsx:12](../packages/shared/src/crm-ui/MentionAutocomplete.tsx#L12) | @menciones detectadas pero NO notifican | P1 |
| MCP-17 | **Bridge `conversation↔invitado`** para `actualizarInvitado` desde bandeja | modelo datos server | [EventSidebar.tsx:16-19](../apps/chat-ia/src/app/[variants]/(main)/messages/components/EventSidebar.tsx#L16) (D3) | RSVP en sidebar solo cambio local | P1 |
| MCP-18 | `conversationId` fragmentado: nº +34622440213 con 3 IDs distintos | normalización server | `PENDIENTES-POR-EQUIPO-2026-06-14.md#API-MCP-1` | Cosmético inbox | P2 |
| MCP-19 | Auditar `cluster0.dhikg` consumers ANTES de apagar | investigación server | `PENDIENTES-POR-EQUIPO-2026-06-14.md#API-MCP-2` + memory `project_dhikg_no_apagable_sin_verificar` | No bloquea | P2 |
| MCP-20 | **api-mcp restart loop RECURRENTE** (561→804 restarts, causa cambiante — churn WhatsApp prekey / Mongo latencia) | infra + código server | `QA-MASTER-NAVEGADOR-2026-07-12.md:259` + memory `project_api_mcp_restart_loops_patron` | Cascada 502/timeout invitados/grupo/menú save | **P0** |
| MCP-21 | Cluster `saqnro0/eventos_organizador` M0 Free Tier → upgrade M2/M10 | infra Atlas | memory `project_mongodb_arquitectura_real` | Auth timeout 3s save user (retry mitiga) | P1 |
| MCP-22 | Healthcheck `/health` con ping Mongo real + PM2 `health_check_url` + alerta Slack `MongoNotConnectedError` | infra server | `F1-PARA-API-MCP-pendientes-finales.txt#[3]` | No bloquea | P2 |
| MCP-23 | E2E Lote 12 `status` mutation single-secret bloqueado | secret sharing | memory `project_lote12_e2e_blocked_status_mutation` | Bloquea Lote 12 E2E | P1 |
| MCP-24 | **Bandeja handoff v2** (12 features UI + 6 endpoints): `guestStatus` CRUD, `assignedToType` team, `internalNotes` server, IA drafts CRUD, `iaGenerated/callTranscription` fields en Message | modelo datos server | `ANALISIS-HANDOFF-BANDEJA-MENSAJES-2026-06-24.code.txt#L29-63` | Sí | P1 |
| MCP-25 | **`assignConversationToUser(conv_id, user_id)`** mutation | server | `HANDOFF-QA-COMUNICACION-2026-07-09.md#C1` | Picker de asignación depende | P1 |
| MCP-26 | **`updateGuestRsvp`** mutation externa (portal público invitado) | server | `HANDOFF-QA-COMUNICACION-2026-07-09.md#R2` | RSVP público end-to-end | P1 |

## 3 · Cross-cutting (api-ia + api-mcp coordinados) — 4 items

| # | Item | Motivo dep | Escalado en | Bloquea front | Prio |
|---|---|---|---|---|---|
| X-1 | **SSE keepalive heartbeat cada 30s** en `/api/messages/stream` (evita timeout Cloudflare 100s → BUG-NEW-07 524/503) | api-ia stream + Cloudflare | `ANALISIS-MENSAJERIA-TIEMPO-REAL-2026-06-27.code.txt#SPRINT-1` | Sí — inbox realtime inestable | P1 |
| X-2 | Typing indicators + read receipts (`typing`, `read_receipt` SSE events) | api-ia emit + api-mcp persistir | mismo #SPRINT-2 | Front tiene `state.typingByConv` esperando | P2 |
| X-3 | Edit/delete cross-device (`message_updated`, `message_deleted` events) | api-ia emit + api-mcp persistir | mismo #SPRINT-3 | Falta iMessage paridad | P2 |
| X-4 | **Rotar credenciales prod MongoDB compartidas en Slack** (14-jun) | política seguridad | `INFORME-PENDIENTES-Y-DRI-2026-06-12.md#SEGURIDAD` + `P0-MONGODB-CIERRE-PARA-API-MCP.code.txt#L8-10` | No bloquea | P1 |

## 4 · Infra / SRE — 3 items

| # | Item | Motivo dep | Escalado en | Bloquea front | Prio |
|---|---|---|---|---|---|
| I-1 | Reset password Firebase Auth DEV para `jcc@marketingsoluciones.com` | ops Firebase | `HANDOFF-2026-07-06.md#3.2` | Bloquea 3er user QA multi-usuario | P1 |
| I-2 | Habilitar `app-dev.bodasdehoy.com` en claude.ai extensión (política org) | admin claude.ai | `PENDIENTES-POR-EQUIPO-2026-06-14.md#TI` | Bloquea auditar SSO/realtime 2 usuarios | P2 |
| I-3 | Apagar droplet `apiapp.bodasdehoy.com` (front ya no apunta, JCP 04-jul dado por apagado) | ops DigitalOcean | `PENDIENTE-producto-JCP.md#[2b]` + `U3-PARA-TI-JCP.txt#VIERNES` | Ahorro €/mes | P2 |

## 5 · Producto (decisión externa a front) — 7 items

| # | Item | Motivo dep | Escalado en | Bloquea front | Prio |
|---|---|---|---|---|---|
| PR-1 | Validar topes plan memoria (FREE 0 / BASIC 50 / PRO 500 / MAX 5000) + Q3 empezar ticket memoria persistente | decisión producto | `F11-producto-decisiones-P11-P12-P13.txt#P11` + `PENDIENTE-producto-JCP.md#[2a]` | Bloquea ticket api-ia memoria | P2 |
| PR-2 | Decidir `(main)/discover` (175 archivos, `showMarket=true` default) — borrar o gatear con `notFound()` | decisión producto | `PLAN-CONSOLIDADO#C2` | Ruta accesible en dev sin gate | P1 |
| PR-3 | Decidir `(main)/knowledge` (31 archivos, gateado pero default true) | decisión producto | `PLAN-CONSOLIDADO#C3a` | Accesible hoy | P1 |
| PR-4 | Decidir `(main)/image` (63 archivos, `NEXT_PUBLIC_SERVICE_MODE=server` prod) | decisión producto | `PLAN-CONSOLIDADO#C3b` | Accesible hoy | P2 |
| PR-5 | R1 renombrar `/chat`→`/asistente` y `/messages`→`/bandeja` (impacta URLs+SEO) | decisión producto | `PLAN-CONSOLIDADO#R1` | Backlog congelado | P2 |
| PR-6 | R2 modelo CONTACTO cross-canal / roles cross-evento (`linkedContactId`) | decisión producto + api-mcp | `PLAN-CONSOLIDADO#R2` | Rediseño estratégico | P2 |
| PR-7 | Aprobar sistema IA copilot/autopilot completo + hilos Slack-style + llamadas transcripción | decisión producto (20-30h backend cada uno) | `ANALISIS-HANDOFF-BANDEJA-MENSAJES-2026-06-24.code.txt#FASE-D` | Alcance grande | P2 |

---

## Anotaciones

### Cerrados por backend desde el resumen previo
- ✅ IA `/chat/structured` 502 (fix Groq routing 3 líneas) — `F19-fase3b-extras-cableados.txt`.
- ✅ IA billing en `/chat/structured` + `/chat/messages/turn` — mismo doc.
- ✅ IA image sync — `INFORME-PENDIENTES-Y-DRI-2026-06-12.md`.
- ✅ Bug #2 chunks + Bug #3 PDF NameError — `F19` + `F15-api-ia-3-bugs-bloques-4-5.txt`.
- ✅ MCP P0 MongoDB pool (max2/min0 → max10/min2) — "P0 confirmado estable".
- ✅ CAPA 1 message/session/topic 100% api-ia (14 archivos tRPC borrados, commit `969fa493`).
- ✅ Cat C 11/11 ops (borraPago, updateTasksOrder, Thread) — `F1`.
- ✅ magic-link ACTIVO 07-jul + Web Push VAPID runtime.
- ✅ IA-4 register-metadata acordado.
- ✅ RAG PARTE A 3/3 (embed + batch-embed-file + search).

### Contradicciones docs vs código
- `PLAN-CONSOLIDADO#B1` decía RAG "ya no aplica" pero `PENDIENTES-PARA-API-IA.code.txt` sigue listando bug 6 branding `https://https://` abierto. Reflejado como IA-28.
- `INFORME-PENDIENTES-Y-DRI` marcaba IA-4 y MCP-2 cerrados pero `services/file/apiIa.ts:176,187` sigue con TODO dedupe hash y cancel task — dependen de IA-4 parcial.
- CAPA 3 F2 (28-may) listaba 11 servicios cliente bloqueados; hoy son 9 routers (IA-21).
- MCP-23 Lote 12 sigue en memory, no aparece explícito en docs recientes.

### Escalado Slack ya hecho hoy (2026-07-21)
Solo 3 de los 72 items: `IA-1..IA-5` cubiertos por B2, `MCP-13` por B3, `IA-9..IA-12` por B6. `ts=1784586990.769649` en canal `C0AV8EV5495` hilo `1778170638.897419`.

**No escalados en esa notificación (críticos):** `IA-13`, `IA-21`, `IA-25`, `IA-26`, `IA-27`, `MCP-3`, `MCP-4`, `MCP-11`, `MCP-16`, `MCP-17`, `MCP-20`, `MCP-24`, `MCP-25`, `MCP-26`, `X-1`, `X-4`, `I-1`. Requiere re-escalado o hilo separado.
