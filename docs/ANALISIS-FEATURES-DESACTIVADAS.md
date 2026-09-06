# Análisis — Features desactivadas por flag (para probar TODO sin perder funcionalidad)

**Fecha:** 2026-06-12 · **Objetivo:** inventario de TODO lo desactivado, su estado real, y plan futuro.
**Contexto:** se desactivaron features por flag el 2026-06-03 "hasta migrar/extraer". El user prueba
todo ahora y NO quiere perder funcionalidad (REGLA 0). Origen: `src/config/featureFlags/schema.ts`.

## Tabla maestra — 8 flags en `false`

| Flag | Qué es | Página/código | Backend | ¿Reactivar funciona? | Plan futuro |
|---|---|---|---|---|---|
| **ai_image** | IA imágenes página `/image` standalone | ✅ existe | ✅ api-ia `/webapi/text-to-image` → **200** | ✅ **SÍ, limpio** | Extraer a visor genérico (cualquier agente IA) |
| **knowledge_base** | Base de conocimiento / RAG documentos | ✅ existe | ⚠️ `chunkRouter` **DESCONECTADO** del router + api-ia RAG con bugs (IA-1) | ❌ **NO** (página sin backend) | Migrar a api-mcp KB (MongoDB Vector Search) — migración a medias |
| **market** | Discover/Marketplace de plugins LobeChat | ✅ existe (175 arch) | hub LobeHub (externo) | ✅ funciona pero es genérico | Marketplace PROPIO de productos del cliente (distinto) |
| **rag_eval** | Evaluación de calidad RAG (dev tool) | parcial | depende del RAG | ❌ (depende de knowledge) | Dev-only, no para usuarios |
| **api_key_manage** | Gestión de API keys propias en settings | settings | — | ⚠️ evaluar | Whitelabel gestiona keys (no usuario) |
| **pin_list** | Fijar/anclar sesiones en sidebar | core | local | ✅ probablemente | UX menor |
| **group_chat** | Chat grupal multi-agente | verificar | — | ⚠️ evaluar | Feature LobeChat avanzada |
| **cloud_promotion** | Banner promo "LobeChat Cloud" | core | — | ❌ NO reactivar | NO aplica (es promo del producto LobeChat original) |

## Detalle por feature

### ✅ ai_image — REACTIVABLE LIMPIO (recomendado probar)
- Página `/image` existe. Backend api-ia `/webapi/text-to-image/{provider}` responde 200.
- `dalle: true` (generar imágenes EN el chat) YA está activo — esto es la página STANDALONE adicional.
- **Reactivar `ai_image: true` → recuperas la página de IA de imágenes.** Bajo riesgo.

### ⚠️ knowledge_base — NO basta reactivar el flag (REGLA 0 en riesgo REAL)
- Página existe PERO `chunkRouter` (RAG nativo tRPC) está DESCONECTADO de `lambda/index.ts`.
- El reemplazo (api-ia `/lobechat-kb/*`) tiene bugs sin resolver (embed/batch — pendientes IA-1..3 ya reportados).
- **Estado: tierra de nadie.** Nativo desconectado + api-ia incompleto = base de conocimiento NO funcional.
- **Para recuperarla de verdad, 2 caminos:**
  1. Re-registrar `chunkRouter` en lambda/index.ts → vuelve el RAG nativo (drizzle/pgvector). Funciona YA pero reintroduce drizzle (lo que se quería quitar).
  2. Esperar a que api-ia arregle el RAG (IA-1) → cablear knowledge a api-ia.
- **Decisión de producto pendiente del user.**

### ✅ market (discover) — reactivable pero es genérico LobeChat
- 175 archivos, se sirve del hub público LobeHub. Funciona pero NO es marketplace del cliente.
- Plan futuro: marketplace PROPIO de productos del cliente (otro desarrollo).
- Reactivar = traer el marketplace genérico de LobeHub (¿lo queréis para probar?).

### Menores
- **pin_list, api_key_manage, group_chat:** features de UX/avanzadas, evaluables individualmente.
- **rag_eval:** dev tool, depende de knowledge_base.
- **cloud_promotion:** NO reactivar — es banner promo del LobeChat original, no aplica.

## Recomendación para "probar todo sin perder funcionalidad"

1. **ai_image → reactivar YA** (backend OK, riesgo bajo). Recuperas IA de imágenes standalone.
2. **knowledge_base → decisión:** ¿recuperar RAG nativo (re-registrar chunkRouter, reintroduce drizzle)
   o esperar api-ia? Es el único con riesgo real de pérdida de funcionalidad.
3. **market → opcional:** reactivar si queréis probar el marketplace genérico mientras se hace el propio.
4. **pin_list/group_chat → probar individualmente** si los usabais.
5. **cloud_promotion → dejar off** (no aplica).
