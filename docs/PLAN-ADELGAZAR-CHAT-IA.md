# Plan — Adelgazar chat-ia delegando a api-ia + borrar redundantes

**Fecha:** 2026-06-10
**Objetivo:** Reducir los ~21k módulos de chat-ia para acelerar compilación, SIN perder funcionalidad.
**Principio (REGLA 0 — INNEGOCIABLE):** mantener compatibilidad y NO perder funcionalidad.
Solo se mueve una feature cuando hay AUDITORÍA + PRUEBA REAL de que su backend (api-ia) la cubre
end-to-end. Si api-ia NO lo cubre → NO se toca. "Nadie la importa en el código" NO es prueba de
cobertura. Adelgazar = mover backend a api-ia con paridad verificada; nunca = borrar feature viva.

## ⚠️ Corrección de rumbo (2026-06-11) — lección aprendida
- Se intentó borrar 90 archivos de discover por "0 imports externos". REVERTIDO.
- AUDITORÍA real: discover (catálogo assistants/models/providers) se sirve del hub público
  **`@lobehub/market-sdk` / `lambdaClient.market.*`** — api-ia NO lo cubre. Borrarlo = PERDER
  funcionalidad (galería de descubrimiento). → **discover se CONSERVA.**
- Regla reforzada: antes de tocar un módulo, AUDITAR que api-ia tenga paridad y PROBARLO (curl real).

---

## Idea de fondo (la arquitectura que el user planteó)

> "Separar funcionalidad como app independiente + protocolo entre ellas."

**Hallazgo clave:** la "app independiente" y el "protocolo" **YA EXISTEN**:
- **app independiente de IA = `api-ia`** (`https://api-ia.bodasdehoy.com`, viva, `/health` 200).
- **protocolo entre apps = la API REST de api-ia** (OpenAPI, JSON/HTTP). No hay que inventarlo.

Por tanto NO se crea una app nueva. chat-ia adelgaza **delegando** a api-ia lo que hoy
implementa de forma nativa (RAG, embeddings, files, parse) y **borrando** lo genérico sin uso.

```
ANTES:  chat-ia  ── RAG nativo (drizzle/pglite/embeddings local) ── 21k módulos
DESPUÉS: chat-ia ── fetch REST ──▶ api-ia (RAG/embeddings/files/storage ya desplegado)
```

---

## Inventario — qué hay y qué se hace con cada cosa

| Módulo chat-ia | Archivos | Acción | ¿api-ia tiene paridad? (AUDITADO) |
|---|---|---|---|
| `(main)/discover/` | 175 | ✅ **CONSERVAR** | ❌ NO — se sirve de market-sdk LobeHub. Borrar = perder feature. NO tocar. |
| `(main)/knowledge/` | 31 | 🔀 **Migrar backend a api-ia** SOLO tras probar paridad | ✅ `/api/lobechat-kb/embed`, `/query-embedding`, `/search` (probar E2E antes) |
| `(main)/files/` | 7 | 🔀 **Migrar backend a api-ia** SOLO tras probar paridad | ✅ `/api/files/*`, `/webapi/files/parse`, `/api/storage/*` (probar antes) |
| `(main)/image/` | 63 | ❓ **EVALUAR con user** | parcial: `/webapi/text-to-image/{provider}`. Confirmar uso (venues) antes de nada |
| `server/routers/lambda/chunk.ts` | 1 | 🔀 redirigir a api-ia tras paridad | ✅ `/api/lobechat-kb/files/{file_id}/chunks` |
| `server/routers/async/ragEval.ts` | 1 | ⏸️ revisar si se usa | — (no borrar sin confirmar que no se usa) |
| `memories/`, `wedding/`, `wedding-creator/`, `tasks/`, `messages/` | — | ✅ **NO TOCAR** | DOMINIO BODA — el core del producto |

**Cambio de enfoque:** NO hay "candidatos a borrar". Hay **candidatos a MIGRAR backend** (knowledge,
files) donde api-ia tiene paridad auditada. La UI y la feature se CONSERVAN; solo cambia de dónde
saca los datos (de RAG nativo drizzle/pglite → a REST api-ia). Cero pérdida de funcionalidad.
El adelgazamiento viene de eliminar el RAG nativo duplicado (drizzle/pglite/embeddings local)
DESPUÉS de que la UI funcione 100% contra api-ia, no antes.

---

## Endpoints de api-ia disponibles (el "protocolo", verificado 2026-06-10)

Knowledge Base / RAG:
- `POST /api/lobechat-kb/embed` · `/batch-embed` — vectorizar documentos
- `POST /api/lobechat-kb/query-embedding` · `/search` — búsqueda semántica
- `GET  /api/lobechat-kb/files/{file_id}/chunks` — chunks de un archivo
- `GET  /api/lobechat-kb/stats/{user_id}` — estadísticas KB
- `POST /api/admin/kb/import/file/` · `/import/json/` — importar a KB
- `/api/kb/sync/batch` · `/sync/document` — sincronización

Files / Storage:
- `POST /api/files/upload` · `GET /api/files/list` · `/api/files/{file_id}`
- `POST /webapi/files/parse` — parsear PDF/docx
- `POST /webapi/embeddings` — embeddings genéricos
- `/api/storage/r2/*` · `/api/storage/events/{event_id}/*` — R2 + storage por evento

chat-ia YA tiene servicios cableados a esto: `services/rag.ts`, `services/lobechatKBMiddleware.ts`,
`services/api-ia.ts`, `services/api-ia.mappers.ts`. **La migración está empezada, falta cerrarla
y borrar el código nativo duplicado.**

---

## Orden de ejecución (seguro, bloque a bloque — NO todo de golpe)

### Fase 0 — Red de seguridad (antes de borrar nada)
1. Confirmar build actual OK (ya está: `BUILD_ID` existe).
2. Smoke manual: `/chat`, `/knowledge`, subir un archivo, una búsqueda RAG. Anotar qué funciona HOY.
3. Branch dedicada `tj/refactor/adelgazar-chat-ia`.

### Fase 1 — BORRAR discover (impacto alto, riesgo MEDIO — REVISADO 2026-06-10)
**⚠️ HALLAZGO al investigar: discover NO está aislado.** El sistema MCP/PluginStore
(que SÍ se usa para las builtin tools del chat) importa ~6 componentes desde dentro de
`(main)/discover/`:
- `discover/features/Title`
- `discover/(detail)/features/MakedownRender`
- `discover/(list)/mcp/features/List` (4 arch.)
Y el `@/store/discover` + `@/types/discover` + `@/services/discover` (market-sdk LobeHub)
los usa el PluginStore/MCP. Esos NO se pueden borrar sin romper MCP.

Desglose de discover (175 arch.):
- `(detail)/` 93 arch. — fichas marketplace público (assistants/models/providers) → **BORRABLE**
- `(list)/` 53 arch. — listados marketplace → **BORRABLE salvo `(list)/mcp/features/List`**
- `components/`+`features/`+`_layout/` 25 arch. — mixto (Title/MakedownRender los usa MCP)

**Plan correcto de Fase 1 (2 sub-pasos):**
1. **1a — Mover los ~6 componentes compartidos** que usa MCP fuera de discover
   (ej. a `src/features/MCPShared/`) y repuntar los imports del PluginStore/MCP.
2. **1b — Borrar el resto de discover** (marketplace público: ~93+53 arch. de detail/list
   genéricos que nadie importa, solo se accedían por URL `/discover`).
- Verificar tras cada sub-paso: build OK, `/chat` carga, PluginStore/MCP funciona, sin imports rotos.
- **Ganancia esperada: ~6-10% menos módulos** (algo menos de lo estimado, por conservar lo de MCP).
- **Riesgo:** romper instalación de plugins/MCP si el desenredo queda incompleto → smoke obligatorio.

### Fase 2 — DELEGAR files a api-ia
- Repuntar UI de `(main)/files/` a los servicios api-ia (`/api/files/*`).
- Borrar `server/routers/lambda/file.ts` + `async/file.ts` (tRPC nativo) una vez cableado.
- Verificar: subir/listar/parsear archivo vía api-ia funciona.

### Fase 3 — DELEGAR knowledge/RAG a api-ia
- Cablear UI `(main)/knowledge/` 100% a `/api/lobechat-kb/*` (parte ya hecha vía `rag.ts`).
- Borrar `server/routers/lambda/chunk.ts` + `async/ragEval.ts` + RAG nativo (drizzle/pglite).
- Verificar: subir doc → embed → buscar → responde con contexto. Billing api-ia registra el uso.
- **Ganancia: elimina drizzle/pglite RAG (dependencias pesadas).**

### Fase 4 — EVALUAR image
- Decidir con el user: ¿la generación de imágenes se usa para venues/diseño?
  - SÍ → delegar a api-ia (`venueImageService.ts` ya existe).
  - NO → borrar `(main)/image/` (63 arch., 7.174 LOC).

### Fase 5 — Cierre
- `pnpm build` final, medir módulos antes/después.
- Smoke completo de las features conservadas.
- Actualizar memoria con el nuevo número de módulos.

---

## Lo que NO se toca (dominio boda — el core del producto)
- `memories/` (álbumes), `wedding/` + `wedding-creator/` (webs de boda), `tasks/`,
  `messages/` (inbox), `notifications/`, `settings/`, el chat en sí.
- La integración con appEventos (CopilotEmbed, postMessage).

---

## Riesgos y mitigación
- **Riesgo:** borrar algo que una feature boda importe indirectamente.
  **Mitigación:** cada fase: build + smoke ANTES de pasar a la siguiente. Una fase = un commit reversible.
- **Riesgo:** api-ia REST no cubre un caso de uso que el RAG nativo sí.
  **Mitigación:** Fase 0 documenta qué funciona hoy; si api-ia no lo cubre → se reporta a backend, NO se borra.
- **SSH a api-ia roto** (config apunta a `api3-ia` NXDOMAIN) → no se necesita; se trabaja contra la API REST viva.

---

## 🔴 AUDITORÍA DE PARIDAD RAG (2026-06-11) — api-ia NO tiene paridad, BLOQUEADO

Prueba real con curl (X-Development: bodasdehoy) de los endpoints que chat-ia USA:

| Endpoint api-ia | Resultado | Lo usa chat-ia |
|---|---|---|
| `POST /api/lobechat-kb/search` | ✅ 200 (success, dims 1024) | sí — `rag.ts:78,89` |
| `POST /webapi/embeddings` | ✅ 200 (vector real) | indirecto |
| `POST /api/lobechat-kb/query-embedding` | ❌ 500 "Error generando embedding" (trc_b6d95ca8bb50, trc_844a0d4c53b3, trc_ac90d6a4f0bd) | no |
| `POST /api/lobechat-kb/embed` | ❌ 500 "Error guardando embedding en ChromaDB" (trc_15646feae4b4) | **SÍ** — `lobechatKBMiddleware.ts:83` |
| `POST /api/lobechat-kb/batch-embed` | ❌ 422 contrato: espera `list` en body, no `{file_id,user_id}` | **SÍ** — `rag.ts:73` |

**Conclusión:** el flujo subir→vectorizar→**guardar**→buscar está ROTO en el paso de guardar
(`/embed` falla en ChromaDB; `/batch-embed` tiene desajuste de contrato con `rag.ts:73`).
La búsqueda funciona sobre datos existentes, pero NO se pueden crear embeddings nuevos.

**DECISIÓN: NO migrar el RAG nativo de chat-ia. Migrar ahora = romper RAG en producción.**
**Acción correcta = reportar 3 bugs a backend api-ia (traces arriba), esperar fix + reprueba, ENTONCES migrar.**

### Bugs a reportar a api-ia
1. `/api/lobechat-kb/embed` → 500 "Error guardando embedding en ChromaDB" (trc_15646feae4b4). Bloquea creación de embeddings (lo usa chat-ia).
2. `/api/lobechat-kb/batch-embed` → 422, espera `list` pero `rag.ts:73` envía `{file_id,user_id}`. Desajuste de contrato — confirmar quién se alinea.
3. `/api/lobechat-kb/query-embedding` → 500 "Error generando embedding" (3/3). No lo usa chat-ia hoy pero está roto.

## Resumen ejecutivo
- **La mejor forma (más óptima) = DELEGAR a api-ia + BORRAR discover.** No crear app nueva.
- api-ia ya es la "app de IA independiente" con el RAG/embeddings/files desplegados.
- El "protocolo entre apps" ya existe = API REST de api-ia.
- Ejecutar en 5 fases, bloque a bloque, con build+smoke entre cada una.
- Ganancia total estimada: **~25-30% menos módulos** → compilación dev más rápida y menos RAM.
