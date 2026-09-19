# Reporte de bugs — RAG api-ia (knowledge base / embeddings)

**Fecha:** 2026-06-11
**Reporta:** COORD-AppEventos
**Contexto:** Auditoría de paridad antes de migrar el RAG nativo de chat-ia a api-ia.
Resultado: el flujo subir→vectorizar→**guardar**→buscar está ROTO en "guardar".
**Bloquea:** migración del RAG de chat-ia (no se puede borrar el nativo hasta que api-ia tenga paridad).
**Método:** curl real contra `https://api-ia.bodasdehoy.com` con header `X-Development: bodasdehoy`.

---

## Tabla resumen — quién resuelve cada bug

| # | Endpoint | Síntoma | DRI técnico | Por qué |
|---|---|---|---|---|
| 1 | `POST /api/lobechat-kb/embed` | 500 "Error guardando embedding en ChromaDB" | **API-IA** | Server-side: el guardado en el vector store (ChromaDB) falla. Front envía el body correcto. |
| 2 | `POST /api/lobechat-kb/batch-embed` | 422 contrato (espera array, recibe objeto) | **API-IA + FRONT** (contrato) | Desajuste de contrato. Hay que decidir el contrato canónico y alinear UN lado. |
| 3 | `POST /api/lobechat-kb/query-embedding` | 500 "Error generando embedding" (3/3) | **API-IA** | Server-side: generación de embedding falla. (No lo usa chat-ia hoy, pero está roto.) |

---

## BUG 1 — `/embed` no guarda en ChromaDB  →  DRI: **API-IA**

**Severidad:** 🔴 ALTA — bloquea crear embeddings nuevos. Lo usa chat-ia (`lobechatKBMiddleware.ts:83`).

**Reproducción (front envía body CORRECTO, falla en server):**
```bash
curl -X POST https://api-ia.bodasdehoy.com/api/lobechat-kb/embed \
  -H "Content-Type: application/json" -H "X-Development: bodasdehoy" \
  -d '{"text":"El catering para la boda incluye menu de 3 platos","user_id":"smoke-test","file_id":"smoke-file-1"}'
```
**Respuesta:**
```json
{"detail":{"error":"internal_error","message":"Error guardando embedding en ChromaDB","trace_id":"trc_15646feae4b4"}}
```
**Diagnóstico:** el body cumple el schema `EmbedRequest` (text/user_id/file_id, todos required, enviados). El error es **al guardar en ChromaDB** → problema de servidor: conexión a ChromaDB, colección no creada para el tenant `bodasdehoy`, o permisos del vector store.
**Qué necesitamos de API-IA:** revisar logs con `trc_15646feae4b4`, confirmar estado de ChromaDB (¿levantado? ¿colección bodasdehoy existe?) y arreglar el guardado.

---

## BUG 2 — `/batch-embed` contrato array vs objeto  →  DRI: **API-IA + FRONT (decidir contrato)**

**Severidad:** 🟠 MEDIA — bloquea la vectorización en lote. Lo usa chat-ia (`rag.ts:73`).

**El desajuste:**
- **api-ia espera (OpenAPI):** un **array** → `[{ "text": str, "user_id": str, "file_id": str, "metadata": ... }]` (type: array of `EmbedRequest`, campos `text/user_id/file_id` required).
- **chat-ia envía (`rag.ts:73`):** un **objeto** → `{ "file_id": id, "user_id": userId }` — sin array y **sin `text`**.

**Reproducción:**
```bash
curl -X POST https://api-ia.bodasdehoy.com/api/lobechat-kb/batch-embed \
  -H "Content-Type: application/json" -H "X-Development: bodasdehoy" \
  -d '{"file_id":"smoke-file-1","user_id":"smoke-test"}'
```
**Respuesta:**
```json
{"detail":[{"type":"list_type","loc":["body"],"msg":"Input should be a valid list",...}]}
```
**Decisión necesaria (entre API-IA y FRONT):**
- **Opción A** (cambia FRONT): chat-ia debe construir el array de chunks `[{text,user_id,file_id}]` por cada chunk del archivo y enviarlo. Pero `rag.ts:73` hoy NO tiene los textos de los chunks, solo el `file_id` → implicaría que el front lea/chunkee el archivo (¿de dónde saca los textos?).
- **Opción B** (cambia API-IA): exponer un `/batch-embed` que reciba `{file_id, user_id}` y que api-ia internamente lea los chunks del archivo y los vectorice (el front solo dispara la tarea por file_id).
- **Recomendación COORD:** Opción B — el front no debería conocer el chunking; api-ia ya tiene el archivo (vía `/files/*`). Confirmar con API-IA.

---

## BUG 3 — `/query-embedding` falla al generar embedding  →  DRI: **API-IA**

**Severidad:** 🟡 BAJA-MEDIA — chat-ia NO lo usa hoy (usa `/search`), pero está roto y conviene arreglarlo.

**Reproducción (falla 3/3):**
```bash
curl -X POST https://api-ia.bodasdehoy.com/api/lobechat-kb/query-embedding \
  -H "Content-Type: application/json" -H "X-Development: bodasdehoy" \
  -d '{"query":"flores para boda en jardin"}'
```
**Respuesta:**
```json
{"detail":{"error":"internal_error","message":"Error generando embedding","trace_id":"trc_b6d95ca8bb50"}}
```
Traces: `trc_b6d95ca8bb50`, `trc_844a0d4c53b3`, `trc_ac90d6a4f0bd`.
**Nota:** `/webapi/embeddings` (genérico) SÍ funciona y `/search` SÍ genera embedding interno (dims 1024). O sea, el motor de embeddings funciona por otra ruta — `/query-embedding` usa un code path que falla. **Para API-IA:** revisar por qué `/query-embedding` falla cuando `/search` (que también embebe) no.

---

## Lo que SÍ funciona (paridad parcial, verificado)
- ✅ `POST /api/lobechat-kb/search` → 200, `success:true`, dims 1024. Lo usa `rag.ts:78,89`.
- ✅ `POST /webapi/embeddings` → 200, vector real de floats.
- ✅ `GET /api/files/health`, `GET /api/lobechat-kb/stats/{user}` → 200.

## Conclusión
- **NO migrar el RAG nativo de chat-ia hasta que BUG 1 y BUG 2 estén resueltos y re-probados.**
- BUG 1 y 3 = 100% API-IA (server). BUG 2 = decisión de contrato API-IA ↔ FRONT (recomendado B).
- Cuando API-IA confirme fix → COORD re-ejecuta este smoke; si 3/3 verde → se procede a migrar.
