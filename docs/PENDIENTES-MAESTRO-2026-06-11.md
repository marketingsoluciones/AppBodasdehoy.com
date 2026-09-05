# 📋 PENDIENTES MAESTRO — sesión 2026-06-11

Documento único con TODO lo pendiente, por frente. Para retomar sin perder contexto.

---

## 🟢 MÍO (FRONT-AppEventos) — puedo hacerlo sin esperar a nadie

| # | Tarea | Estado | Dónde |
|---|---|---|---|
| M1 | **Push branch `tj/refactor/adelgazar-chat-ia`** (7 commits sin upstream) | ⚠️ PENDIENTE — proteger trabajo | `git push -u origin tj/refactor/adelgazar-chat-ia` |
| M2 | Rebuild chat-ia + verificar que los cambios `rag.ts`/`generation.ts` no rompen en prod | pendiente | `pnpm build` chat-ia → next start → smoke /chat |
| M3 | Smoke RAG fase 2 (file_id puro) | LISTO para ejecutar cuando api-ia confirme lookup R2 | `scripts/smoke-rag-fase2.sh <file_id> <user_id>` |

## 🔴 DE API-IA — necesito que respondan/arreglen (5 pendientes)

Doc completo: `docs/backend-asks/slack-ready/PENDIENTES-PARA-API-IA.code.txt` (enviado Slack ts 1781160446 + update 1781161649)

| # | Pendiente | Sev | Qué pido |
|---|---|---|---|
| IA-1 | batch-embed-file con file_id PURO (sin file_url/text) | 🟡 | ¿resuelven URL en R2 por file_id? confirmar lookup → les paso file_id real |
| IA-2 | `/chat/structured` 502 (base_url Groq) | 🔴 | ¿desplegado el fix de 3 líneas? |
| IA-3 | Billing en `/chat/structured` (bypass 4 módulos) | 🔴 | ¿integrado? toda feature IA debe facturar |
| IA-4 | files: endpoint `register-metadata` (sin re-subir binario) | 🟡 | exponer POST /api/files/register-metadata → devuelve file_id canónico |
| IA-5 | image: endpoint `/status` de generation | 🟢 | ¿GET /image/generations/{id}/status o derivar del GET? |

## 🔴 DE API-MCP — necesito que respondan/arreglen (3 pendientes)

Doc completo: `docs/backend-asks/slack-ready/PENDIENTES-PARA-API-MCP.code.txt` (enviado Slack ts 1781160447)

| # | Pendiente | Sev | Qué pido |
|---|---|---|---|
| MCP-1 | P0 conexión MongoDB eventos flapping (desde 28-may) | 🔴 | fix reconexión Mongoose — BLOQUEADOR #1 |
| MCP-2 | Cat C: 8 ops faltantes para apagar apiapp | 🟡 | pagos boda, getAllBusinesses/Products, generatePdf, getGeoInfo, getPlanSpaceSelect, getPsTemplate, getItinerario, updateTasksOrder |
| MCP-3 | `removerInvitado` no-op (`.id`→`._id`) | 🟡 | fix de 1 línea (Slack ts 1779920471) |

## 🟡 DE CRM (Suite-CRM Pro) — NO es mío, solo vigilar (compartimos api-ia)

api-ia les pidió arreglar 3 bugs de auth en `/crm/knowledge-base` (development con .com,
x-user-role hardcoded, proxy sin reenviar headers). **NO lo toco** (otro repo).
Nota: chat-ia/appbodas YA está limpio de esos bugs (normaliza X-Development sin .com).

---

## ✅ YA HECHO esta sesión (para no repetir)

- RAG chat-ia migrado a api-ia 3/3 (embed/batch-embed-file/search) — verificado curl Qdrant, cableado.
- files migrado (list/metadata/remove) — verificado.
- image + venue-visualizer: CONSERVADOS (valor boda, api-ia tiene interior-render/virtual-staging/etc).
- discover: CONSERVADO (api-ia no lo cubre, borrarlo perdería funcionalidad).
- `deleteGeneration` des-stubeado → endpoint real api-ia (test 17/17 verde). Recupera borrado.
- Auditorías de paridad documentadas: `docs/PLAN-ADELGAZAR-CHAT-IA.md`.
- `dev` avanzado a inbox-fase1 (46 commits) + pusheado a origin (sesión previa).
- Entorno dev: chat-ia + appEventos en next start (build prod), chat-dev/app-dev 200.

## 🎯 PRINCIPIO QUE GOBIERNA TODO (no olvidar)
- **NO perder funcionalidad. Mantener compatibilidad.** Auditar + probar (curl real) ANTES de migrar/borrar.
- "Nadie lo importa" NO es prueba de cobertura. Solo se mueve backend con paridad verificada.
- El adelgazamiento REAL (quitar drizzle/pglite RAG nativo) está BLOQUEADO hasta cerrar pendientes api-ia.

## ➡️ SIGUIENTE PASO cuando retomes
1. Push branch (M1) para proteger los 7 commits.
2. Esperar respuestas backend (IA-1..5, MCP-1..3) — están en Slack.
3. Cuando api-ia confirme IA-1 → correr smoke-rag-fase2.sh → cerrar RAG 100%.
4. Cuando api-ia haga IA-4 (register-metadata) → des-passthrough createFile (files 100%).
