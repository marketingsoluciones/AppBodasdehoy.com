# PLAN CONSOLIDADO — chat-ia + Copilot · 2026-07-20

> **Sustituye conceptualmente** a los 11 planes dispersos jun-jul 2026.
> Se conservan por historial, pero **este documento es la fuente única de verdad**
> del backlog vivo. Al terminar cada bloque, marcar el `[ ]` y `git rm` los planes
> obsoletos que quedan en §5.
>
> Ver auditoría de origen: informe interno 2026-07-20 (contexto agente).

---

## 0 · Alcance

**Sí cubre:** apps/chat-ia (fullscreen + backend), apps/appEventos Copilot embebido, packages/copilot-shared, dependencia con api-ia/api-mcp.

**No cubre:** rediseño Mesas (cerrado #192-#199), memories, editor-web, whatsapp-web, sprints backend puros (van a `docs/backend-asks/`).

---

## 1 · Estado real de partida (ya cerrado, NO retocar)

- ✅ FASE B Bandeja v2.0 mergeada — badges canal/RSVP, IaLevelPicker, EventSidebar, ScopeSelector, SSE, 3 tabs, móvil BottomNavBar, picker asignación user.
- ✅ Refactor runtime-only api-ia — eliminado `@lobechat/model-runtime` + 66 providers + SDK deps (commits `c8c60bbf`, `80fea89c`, `a72541d7`, `9185bbbd`, `0dcb955d`).
- ✅ Migración Neon → api-ia + rename `/api/lobe/*` → `/api/history/*` (`686e0f08`, `a0ec2c32`).
- ✅ Services `message`/`session`/`topic`/`file` 100% via api-ia (`34f353f7`, `969fa493`, `7c5066b2`) + switch `NEXT_PUBLIC_USE_API_IA_ENDPOINTS=true`.
- ✅ tRPC lambda routers borrados (`58571ecf` — 12 routers).
- ✅ Bandeja SPRINT A store singleton + BroadcastChannel + hooks delegan (`3bcec0be`, `aa0f9cc8`, `2ba08eac`, `dc908e4c`).
- ✅ Web Push VAPID runtime (`60b44231`).
- ✅ Copilot embebido sin iframe + historial api-ia + event_card + métricas.
- ✅ Filtros Copilot end-to-end (postMessage FILTER_VIEW/CLEAR_FILTER + navegación por entidad).
- ✅ Contexto evento CTX-A/B (activeEventId/eventScope/availableEvents en metadata; `/` no envía eventId residual).
- ✅ Magic link activo.
- ✅ Rediseño messages Fase A (A.1..A.6) + vista `/agentes` con sessions reales.
- ✅ **Login `apps/appEventos/pages/login.tsx` usa `SplitLoginPage`** de `@bodasdehoy/auth-ui` ([login.tsx:6,187](../apps/appEventos/pages/login.tsx#L6)) — auditoría cerrada 2026-07-20.
- ✅ **Auto-sugerir provider por dominio** — [`packages/auth-ui/src/LoginForm.tsx:172`](../packages/auth-ui/src/LoginForm.tsx#L172) ya mapea domain → provider.
- ✅ **Lazy shiki/katex/cytoscape** — verificado sin imports directos en `apps/chat-ia/src` (transitive OK), no aplica.
- ✅ **X2(a) Write-guard mutación IA** — flujo `confirm_required` SSE end-to-end: front handler + `ConfirmationCard` en [`CopilotEmbed.tsx:710-712,597,1163-1173`](../apps/appEventos/components/Copilot/CopilotEmbed.tsx#L710); prompt backend obliga confirmación en [`chat.ts:154`](../apps/appEventos/pages/api/copilot/chat.ts#L154). Tipos en [`copilotChat.ts:72,113,196`](../apps/appEventos/services/copilotChat.ts#L72).
- ✅ **B4 Guard notas CRM `CRM_NotesResponse.notes` null** — cerrado en fuente compartida [`useCRMNotes.ts:113`](../packages/shared/src/crm-ui/useCRMNotes.ts#L113) `result?.notes ?? []`. El bug backend api-mcp sigue abierto (`docs/BUG-CRM-NOTES-NON-NULLABLE-2026-07-07.md`), pero front está protegido.
- ⚫ **B5 Rename `/api/lobe/*` → `/api/chat/*`** — descartado. El rename real fue a `/api/history/*` (`a0ec2c32`). Renombrar otra vez no aporta.

---

## 2 · Backlog vivo real (post-auditoría 2026-07-20 en `dev` HEAD `623aaa51`)

> Verificado con `grep -r "from '<dep>'" --exclude-dir=.next` + `find` en la rama `dev` (0 ↑ 0 ↓ vs origin/dev).

Prioridad: **P0** urgente/impacto alto · **P1** valor claro · **P2** oportunista.
Esfuerzo: **S** ≤ ½ día · **M** 1-2 días · **L** > 3 días.

### 2.1 · Limpieza (front, cerrable sin bloqueo backend)

> **HALLAZGO 2026-07-20**: `@lobechat/database` **NO es fantasma** — el sub-package
> `apps/chat-ia/packages/database/` es CÓDIGO VIVO. Consumido por 6 routers
> lambda tRPC: `aiChat.sendMessageInServer`, `memory.recallForQuery`, `agent.*`,
> `generationBatch/Topic`, `apiKey`, `aiModel`. Borrar sin migrar rompe el chat.
> El PLAN-ADELGAZAR se ejecutó **solo a medias**: data-services (message/session/topic/file)
> sí migraron a api-ia, infra-chat-services no.

| # | Objetivo | Prio | Esf | Estado | Detalle |
|---|---|---|---|---|---|
| ~~C1a~~ | ~~Borrar pglite + neondatabase (fantasmas)~~ | ~~P0~~ | — | ❌ **CANCELADO** | No eran fantasmas: viven en el sub-package `@lobechat/database` que sí se usa |
| C1b | Migrar `drizzle-orm` fuera de `src/` | P1 | M | 🟡 parcial | Con C6 desaparecen 1 de 3 imports (`nextAuthUser`); quedan `oidc-provider/adapter` y `import/client.test.ts` |
| C1c | **Migrar 9 routers lambda a api-ia** (aiChat, memory, agent, generation, apiKey, aiModel, **exporter, importer, market**) | P1 | **XL** | 🔴 | Cerrar la migración a medias del PLAN-ADELGAZAR. Solo así se puede quitar `@lobechat/database` + drizzle + pglite del root. **Auditoría 2026-07-20 corrigió de 6 a 9 routers** |
| C2 | Decidir `(main)/discover/` (175 archivos) | P1 | M | 🔴 | **NO está oculto** — layout no gatea, ruta `/discover` accesible en dev; `showMarket=true` default solo oculta sidebar. Decidir producto: borrar completo o gatear con `notFound()` en el layout |
| C3a | Decidir `(main)/knowledge/` (31 archivos) | P1 | S | 🔴 | Gateado en `knowledge/layout.tsx:7-9` pero `knowledge_base=true` default → **hoy es accesible**. Reactivable si api-ia cierra B1 |
| C3b | Decidir `(main)/image/` (63 archivos) | P2 | L | 🔴 | Gateado `!isServerMode` pero `NEXT_PUBLIC_SERVICE_MODE=server` en prod → **hoy es accesible**. Decisión producto |
| C5 | Actualizar 5 líneas obsoletas en `PLAN-COPILOT-MONOREPO.md` | P2 | S | ✅ 2026-07-20 | apps/web→apps/appEventos · packages/copilot-ui→copilot-shared |
| **C6** | **Borrar código muerto identificado en auditoría 2026-07-20** | P0 | S | ✅ 2026-07-20 | 9 archivos, ~1140 líneas: `services/{document,nextAuthUser,user}`, Clerk webhooks (Clerk off), avatar route (0 consumers). Type-check verde |
| **C7** | **Borrar árbol OIDC** | P2 | M | ✅ 2026-07-20 | Stub minimal en `libs/oidc-provider/jwt.ts` (getJWKS/validateOIDCJWT lanzan 401). Borrado: 6 archivos libs + 4 rutas backend + 8 pages oauth + 2 server/services/oidc + limpieza middleware.ts. ~3600 líneas |
| **C8** | **Borrar stubs SSO + UI SSOProvidersList** | P1 | S | ✅ 2026-07-20 | UI `SSOProvidersList` + métodos `getUserSSOProviders`/`unlinkSSOProvider` + imports `AdapterAccount`. ~112 líneas |
| **C9** | **Borrar dead code pglite import service** | P2 | S | ✅ 2026-07-20 | `services/import/client.ts` + `.test.ts` + require condicional. ~1080 líneas |

### 2.2 · Copilot / contexto evento (front puede casi todo)

| # | Objetivo | Prio | Esf | Estado | Detalle |
|---|---|---|---|---|---|
| **X1** | **CTX-C** — `activeEventId` mutable cross-app entre appEventos ↔ chat-ia fullscreen | **P0** | S | ✅ 2026-07-20 | Cookie `bodas_active_event` en `.bodasdehoy.com` desde `EventContext.setEvent()` + hook `useCrossAppActiveEventSync` en chat-ia (Desktop/Mobile layout) lee al montar y en `visibilitychange`. Emite `CustomEvent('chatia:activeEventChanged')` |
| **X2(b)** | **Sticky evento por conversación (MVP client-only)** | P1 | M | ✅ 2026-07-21 | `hooks/useStickyEventPerSession.ts` monitoriza `useSessionStore.activeId`; al cambiar guarda `current_event_id` bajo `chatia:session_event:<sessionId>` (localStorage) y restaura el guardado de la nueva. Emite `chatia:activeEventChanged { source: 'sticky-session' }`. Wired en Desktop+Mobile. Migrar a `session.metadata.eventId` cuando api-ia lo soporte |
| **X2(c)** | **Normalización nombres eventos** | P1 | S | ✅ 2026-07-21 | `utils/normalizeEventName.ts` (NFD + strip acentos + colapsa espacios + lowercase) + `eventNamesMatch(a,b)` + 6 tests verdes |
| X2(d) | Quick-replies "¿cuál evento?" — chips selección | P1 | M | 🔴 | Requiere que appEventos publique `availableEvents` cross-app (más que solo `activeEventId`) + trigger SSE `ambiguous_event` desde api-ia. Sprint γ |
| **X2(e)** | **Chip contexto en header del chat** | P1 | S | ✅ 2026-07-21 | `ChatHeader/ActiveEventChip.tsx` — Tag azul con icono calendario + nombre del evento activo; se refresca vía `chatia:activeEventChanged` + `storage` event. Wired en `Main.tsx` |
| **X3** | **Telemetría de ambigüedad de contexto** | P1 | S | ✅ 2026-07-21 | `utils/copilotTelemetry.ts` `trackContextAmbiguity({reason, route,...})` → console.warn + posthog.capture (`copilot_context_ambiguity`). Integrado en `useCrossAppActiveEventSync` (emite `no_context_at_all` cuando no hay cookie ni localStorage) con flag session-storage anti-ruido |

### 2.3 · Bloqueado backend — solo empujar / defensas front

| # | Objetivo | Prio | Bloqueo | Defensa front temporal |
|---|---|---|---|---|
| ~~B1~~ | ~~Knowledge/RAG — 3 bugs api-ia~~ | — | ⚫ ya no aplica | Front usa `batch-embed-file` + `search` ([services/rag.ts:75,80,91](../apps/chat-ia/src/services/rag.ts#L75)); superficie del bug original no existe. Reabrir solo si backend reporta bugs concretos |
| B2 | Tool `get_event_guests`: recibir `activeEventId`, param `status`, retry cap, propagar error, preguntar con `availableEvents` | **P0** | api-ia | Front ya envía `activeEventId`/`eventScope`/`availableEvents` ([ChatSidebarDirect.tsx:167-182](../apps/appEventos/components/Copilot/ChatSidebarDirect.tsx#L167)); tool corre backend-side. Cubierto lo que puede el front |
| B3 | api-mcp BUG-07 whitelabel keys timeout >15s | P1 | api-mcp | 0 retry/backoff explícito front — añadir si aparece regresión visible |
| ~~B4~~ | ~~Notas CRM null~~ | — | ✅ front cerrado | Ver §1 |
| ~~B5~~ | ~~Rename endpoints api-ia~~ | — | ⚫ descartado | Ver §1 |
| B6 | api-ia P2-P5 (intent routing / EMPTY_RESPONSE fallback / user_id logs / conversation_length) | P1 | api-ia | — |

### 2.4 · Rediseño estratégico (necesita decisión producto ANTES)

| # | Objetivo | Prio | Esf | Bloqueo |
|---|---|---|---|---|
| R1 | Renombrar `/chat` → `/asistente` y `/messages` → `/bandeja` | P2 | L | Decisión producto — impacta URLs y SEO |
| R2 | Modelo CONTACTO cross-canal / roles cross-evento (`linkedContactId`) | P2 | L | Decisión producto + api-mcp |

### 2.5 · Login UX (backlog runtime-only §6, magic link ya activo)

| # | Objetivo | Prio | Esf | Verificación dev HEAD |
|---|---|---|---|---|
| A2 | Turnstile CAPTCHA en OTP WhatsApp | P2 | M | 0 matches `turnstile` |
| A4 | **Account linking Y unlinking ambos rotos** | P1 | M | Auditoría 2026-07-20: `getUserSSOProviders`/`unlinkSSOProvider` son stubs en [`services/user/apiIa.ts:120-127`](../apps/chat-ia/src/services/user/apiIa.ts#L120). UI [SSOProvidersList/index.tsx:31](../apps/chat-ia/src/app/[variants]/(main)/profile/(home)/features/SSOProvidersList/index.tsx#L31) renderiza siempre vacía. Ver también C8 |
| A5 | "Remember device" (skip 2FA) | P2 | M | 0 matches `rememberDevice` |

---

## 3 · Recomendación de ejecución (2-3 sprints)

**Sprint α · Quick wins — ✅ CERRADO 2026-07-20** (rama `tj/feat/sprint-alpha-chat-ia-limpieza`)
- ✅ **C5** — 5 líneas de `PLAN-COPILOT-MONOREPO.md` actualizadas.
- ✅ **C6** — 9 archivos código muerto borrados (~1140 líneas): `services/{document,nextAuthUser,user}`, `api/webhooks/clerk/*`, `webapi/user/avatar/*`. Type-check verde.
- ✅ **X1** — CTX-C: cookie `bodas_active_event` en `.bodasdehoy.com` + hook `useCrossAppActiveEventSync` en Desktop/Mobile de chat-ia.
- ❌ C1a — cancelado (no eran fantasmas).

**Sprint β · ✅ CERRADO 2026-07-21** (misma rama `tj/feat/sprint-alpha-chat-ia-limpieza`, commits `1a3b…5fc7…`)
- ✅ **C7** OIDC — 22 archivos, ~3600 líneas.
- ✅ **C8** SSO stubs + UI — 4 archivos, ~112 líneas.
- ✅ **C9** import pglite dead code — 3 archivos, ~1080 líneas.
- ✅ **X2(c)** normalizeEventName + tests.
- ✅ **X2(e)** ActiveEventChip en ChatHeader.
- ✅ **X2(b)** useStickyEventPerSession (MVP client-only).
- ✅ **X3** trackContextAmbiguity + integrado.
- 🔴 **X2(d)** picker "¿cuál evento?" — aplazado a sprint γ (requiere `availableEvents` cross-app + SSE trigger).

**Sprint γ · Cerrar migración a medias del PLAN-ADELGAZAR (5-10 días)**
- **C1c** — migrar **9 routers lambda** a api-ia (aiChat, memory, agent, generation, apiKey, aiModel, exporter, importer, market). Al cerrar → remove `@lobechat/database` + `drizzle-orm` + `pglite` + `neondatabase` del root.
- **C3a** — borrar `knowledge/` dir (31 archivos).

**Sprint δ · Copilot UX pesado (2-3 días)**
- **X2(b)** — sticky evento por conversación (persistir `eventId` en session/topic metadata).
- **X2(d)** — quick-replies "¿cuál evento?".

**Sprint ε · Decisión producto + limpieza gorda**
- **C2/C3a/C3b** — decidir producto: `discover`/`knowledge`/`image` — borrar completo o gatear con `notFound()` en layout. Los tres son accesibles hoy en dev.
- **B3/B6** — según respuesta backend.

**Congelado hasta decisión producto:** R1 (renombrado URLs), R2 (modelo contacto), A2, A5. A4 ya no está congelado — decidir C8 (borrar UI o implementar completo).

---

## 4 · Cómo trackear

- Cada tarea marcada `[x]` en este archivo cuando esté mergeada a `dev`.
- PRs referencian: `Ref: docs/PLAN-CONSOLIDADO-CHAT-IA-2026-07-20.md#C1`.
- Bloqueos backend viven también en `docs/RESUMEN-PENDIENTES-Y-BLOQUEOS-API-IA.md`
  (o su reemplazo — el actual es de feb-25, obsoleto).

---

## 5 · Planes viejos → mover a `docs/archive/`

Ejecutar cuando este consolidado sea aprobado:

```bash
cd docs
mv PLAN-CHAT-IA-DECISION-ESTRATEGICA.md archive/
mv PLAN-OPCION-A-CHAT-MODULAR.md archive/
mv PLAN-REESTRUCTURACION-CHAT-IA.md archive/
mv PLAN-OPCION-A-FASE1-DETALLE.md archive/         # completado
mv PLAN-CHAT-IA-REDISENO-2026-06-27.code.txt archive/  # Plan A+B hechos, C vive en R1+R2
mv PLAN-ADELGAZAR-CHAT-IA.md archive/              # Fase 2 hecha, resto vive en C1-C3
mv AUDITORIA-MODEL-RUNTIME-2026-06-24.code.txt archive/
mv BRANCH-SUMMARY-runtime-only-api-ia-2026-06-25.code.txt archive/
mv RESUMEN-PENDIENTES-Y-BLOQUEOS-API-IA.md archive/ # feb-25, todo obsoleto
mv INFORME-API-MCP-CONEXION-EVENTOS.md archive/    # may-25 legacy
```

**Se conservan vivos:**
- `PLAN-COPILOT-MONOREPO.md` (marcar §1-12 ✅; paths a actualizar por C5).
- `PLAN-FILTROS-COPILOT.md` (100% hecho, sirve de referencia de patrón).
- `PLAN-MEJORA-IA-ROUTING-Y-CALIDAD.md` (backend api-ia — no borrar, es su TODO).
- `CHECKLIST-PARIDAD-INPUT-CHAT.md` (checklist de regresión, útil).
- `ANALISIS-COPILOT-CONTEXTO-EVENTO-2026-07-03.md` (referencia para X1-X3).
- `BUG-CRM-NOTES-NON-NULLABLE-2026-07-07.md` (bug abierto B4).
- `QA-PROMPT-MEJORAS-SEMANA-2026-07-08.md` (batería QA vigente).

---

## 6 · Duplicaciones detectadas (para no repetir)

| Objetivo | Cubierto por (N planes) | Fusionado en |
|---|---|---|
| Adelgazar chat-ia | ADELGAZAR + REESTRUCTURACION + OPCION-A + OPCION-A-FASE1 + DECISION + AUDITORIA-MODEL-RUNTIME (6) | §2.1 C1-C4 + §1 (lo ya cerrado) |
| Desacople infra LobeChat (drizzle/tRPC/pglite) | ADELGAZAR + OPCION-A-FASE1 + AUDITORIA + BRANCH-SUMMARY (4) | §2.1 C1 (último 20% pendiente) |
| Modularizar chat en packages | REESTRUCTURACION + OPCION-A + COPILOT-MONOREPO (3) | Ya hecho vía `copilot-shared` |
| Reorganización Bandeja (unificar A vs B) | REDISEÑO + BRANCH-SUMMARY (2) | Ya hecho §1 |
| Contexto evento Copilot | FILTROS + CONTEXTO EVENTO (2) | §2.2 X1-X3 |
| Rediseño conceptual (asistente/bandeja/contacto) | REDISEÑO Plan C (1) | §2.4 R1-R2 |
