# Informe de Infraestructura IA — chat-ia + api-ia
**Fecha**: 2026-03-22
**Proyecto**: AppBodasdehoy / chat-ia
**Entorno**: localhost:3210 → api-ia.bodasdehoy.com

---

## 1. RESUMEN EJECUTIVO

La infraestructura de IA en chat-ia tiene **código completo** para RAG, re-ranker, memory recall, agentes y knowledge bases. Sin embargo, la conexión con api-ia está **parcialmente rota**: algunos endpoints no existen y otros fallan internamente.

| Componente | Código chat-ia | Endpoint api-ia | Estado real |
|---|---|---|---|
| Chat IA (streaming) | ✅ Completo | ✅ Funciona | **OPERATIVO** (intermitente) |
| Tools (eventos, filtros, venue) | ✅ Completo | ✅ Funciona via auto | **OPERATIVO** |
| KB Embed (generar embeddings) | ✅ Completo | ✅ Existe (422 sin params) | **PARCIAL** |
| KB Search (búsqueda semántica) | ✅ Completo | ❌ Error interno (500) | **ROTO** |
| KB Query-Embedding (1024-dim) | ✅ Completo | ❌ 404 Not Found | **NO DESPLEGADO** |
| Memory Recall (contexto usuario) | ✅ Completo | ❌ 404 Not Found | **NO DESPLEGADO** |
| Memory Extract (extraer memorias) | ✅ Completo | ❌ 404 Not Found | **NO DESPLEGADO** |
| Re-ranker (Cohere) | ✅ Completo | N/A (directo a Cohere) | **DESHABILITADO** (sin COHERE_API_KEY) |
| Unstructured (chunking docs) | ✅ Completo | N/A (directo a Unstructured) | **DESHABILITADO** (sin API key) |
| RAG Evaluation | ✅ Completo | N/A (local) | **DESHABILITADO** (sin KB funcional) |

---

## 2. BUG CRÍTICO EN api-ia: AUTO_ROUTING_ERROR

### Error reproducido durante E2E tests

```
503 AUTO_ROUTING_ERROR
"Error en auto-routing y no hay providers disponibles: name 'invitados' is not defined"
```

### Detalles

- **Tipo**: Python `NameError` — la variable `invitados` no existe en el scope de auto-routing
- **Causa probable**: El código de auto-routing evalúa contenido del mensaje como código Python (posible `eval()` o similar)
- **Frecuencia**: Intermitente — funciona con requests individuales, falla bajo carga rápida
- **Patrón**: Los errores llegan siempre en **pares** con <1ms de diferencia (2 sub-requests internos por request)
- **Impacto**: Prompts que requieren tools de datos (invitados, presupuesto, tareas) fallan intermitentemente

### Trace IDs para debugging

| Timestamp | trace_id |
|---|---|
| 2026-03-22T18:05:28.191 | 3b251ecf |
| 2026-03-22T18:05:28.192 | 26b06a1d |
| 2026-03-22T18:06:39.820 | 6c843357 |
| 2026-03-22T18:07:28.590 | 92024e34 |
| 2026-03-22T18:08:26.608 | aadf825b |
| 2026-03-22T18:16:32.204 | a4a2e58c |
| 2026-03-22T18:20:18.941 | d719b511 |

### Otro error relacionado

```
500 JSONDecodeError_ERROR
"Expecting value: line 1 column 1 (char 0)"
trace_id: 9c291c27
```

---

## 3. ENDPOINTS DE api-ia — ESTADO ACTUAL

### ✅ Funcionando

| Endpoint | Status | Notas |
|---|---|---|
| `POST /webapi/chat/auto` | 200 (intermitente 503) | Chat streaming funciona cuando no hay AUTO_ROUTING_ERROR |
| `POST /webapi/chat/anthropic` | 200 | Funciona siempre |
| `POST /webapi/chat/openai` | 403 | API key expirada en whitelabel config |
| `POST /webapi/chat/google` | 404 | Modelo gemini-2.0-flash deprecated |

### ⚠️ Parcialmente desplegado

| Endpoint | Status HTTP | Respuesta |
|---|---|---|
| `POST /api/lobechat-kb/embed` | 422 | Existe pero requiere `user_id` + `file_id` (validación Pydantic) |
| `POST /api/lobechat-kb/search` | 500 | Existe pero falla: `"Error generando embedding de la query"` (trace: trc_96084b1ba293) |

### ❌ No desplegado (404)

| Endpoint | Usado por | Impacto |
|---|---|---|
| `POST /api/lobechat-kb/query-embedding` | Memory Recall (1024-dim vectors) | Sin esto no hay recall de memorias del usuario |
| `POST /api/memory/extract` | Memory Extractor | Sin esto no se extraen memorias de conversaciones |

---

## 4. TOOLS IMPLEMENTADOS EN chat-ia

### 4.1 lobe-eventos ✅ COMPLETO Y OPERATIVO

| API | Función | Estado |
|---|---|---|
| `list_events` | Lista eventos del usuario | ✅ Funciona (via GraphQL → api2) |
| `get_event_detail` | Detalle completo de evento | ✅ Funciona |
| `get_event_budget` | Desglose de presupuesto | ✅ Funciona |

**Archivos**:
- Manifest: `src/tools/eventos/index.ts`
- Render: `src/tools/eventos/Render/index.tsx`
- Service: `src/services/api2/eventosTools.ts`
- Store: `src/store/chat/slices/builtinTool/actions/eventos.ts`

### 4.2 lobe-filter-app-view ✅ COMPLETO Y OPERATIVO

| API | Función | Estado |
|---|---|---|
| `filter_view` | Filtra vista en appEventos (postMessage) | ✅ Funciona |

**Entidades soportadas**: events, guests, tables, budget_items, services, moments

**Archivos**:
- Manifest: `src/tools/filter-app-view/index.ts`
- Store: `src/store/chat/slices/builtinTool/actions/filterAppView.ts`

**Nota**: api-ia traduce `filter_view` → `lobe-filter-app-view____filter_view____builtin` (ver BUILTIN_TOOL_MAP en route.ts)

### 4.3 lobe-floor-plan-editor ✅ COMPLETO Y OPERATIVO

| API | Función | Estado |
|---|---|---|
| `open_floor_plan_editor` | Abre editor de plano via postMessage | ✅ Funciona |
| `suggest_table_config` | Genera SVG preview de configuración de mesas | ✅ Funciona |

**Tipos de mesa**: redonda, cuadrada, imperial, podio, militar, bancos
**Genera SVG** usando `@bodasdehoy/shared` utilities (`generateTableSVG`, `tableToDataURL`)

**Archivos**:
- Manifest: `src/tools/floor-plan-editor/index.ts`
- Render: `src/tools/floor-plan-editor/Render/index.tsx`
- Store: `src/store/chat/slices/builtinTool/actions/floorPlanEditor.ts`

### 4.4 lobe-venue-visualizer ✅ COMPLETO Y OPERATIVO

| API | Función | Estado |
|---|---|---|
| `visualize_venue` | Genera visualizaciones fotorrealistas de venues con IA | ✅ Funciona |

**Room types**: salon-banquetes, jardin, terraza, iglesia, restaurante, finca, rooftop
**Estilos**: romantico, rustico-boho, minimalista, glamour, jardin-floral, industrial, mediterraneo, tropical
**Genera hasta 4 variaciones en paralelo**

**Archivos**:
- Manifest: `src/tools/venue-visualizer/index.ts`
- Render: `src/tools/venue-visualizer/Render/index.tsx`
- Service: `src/services/venueImageService.ts`
- Store: `src/store/chat/slices/builtinTool/actions/venueVisualizer.ts`

### 4.5 Otros tools integrados

| Tool | Tipo | Estado |
|---|---|---|
| lobe-web-browsing | Búsqueda web | ✅ Activo (hidden) |
| lobe-artifacts | Render de artefactos | ✅ Activo |
| lobe-dalle | Generación de imágenes | ✅ Activo |
| lobe-code-interpreter | Ejecución Python | ✅ Activo |
| lobe-local-system | Sistema de archivos | ⚠️ Solo desktop |

---

## 5. INFRAESTRUCTURA RAG — ANÁLISIS DETALLADO

### 5.1 Pipeline completo (código listo, parcialmente conectado)

```
[Usuario sube archivo]
       ↓
[Unstructured API → chunking]  ❌ Sin UNSTRUCTURED_API_KEY
       ↓
[lobechat-kb/embed → embeddings]  ⚠️ Endpoint existe pero búsqueda rota
       ↓
[Vector storage en api-ia]  ⚠️ Sin query-embedding endpoint
       ↓
[Búsqueda semántica + Cohere rerank]  ❌ Sin COHERE_API_KEY
       ↓
[Chunks inyectados en system prompt]  ✅ Código listo
```

### 5.2 Knowledge Base Management

- **UI completa**: crear, editar, eliminar knowledge bases
- **Accesible desde**: sidebar → Knowledge tab
- **Archivos subidos**: se guardan en DB (metadata) pero **no se procesan** (sin chunking/embedding activo)

### 5.3 Agent ↔ Knowledge Base

- **Vinculación**: agentes pueden tener knowledge bases y archivos asignados
- **UI**: Settings → Agent → Knowledge tab
- **Estado**: La vinculación funciona pero los KB no tienen embeddings activos

### 5.4 RAG Evaluation

- **Sistema completo**: datasets, records, evaluations, JSONL import
- **UI**: dentro de Knowledge Base detail
- **Estado**: Sin embeddings funcionales, no puede ejecutar evaluaciones reales

### 5.5 Memory System

- **Extraction**: `src/server/services/memoryRecall/extractor.ts`
  - Se dispara automáticamente al resumir conversaciones
  - Categorías: preference, identity, fact
  - **Bloqueado**: endpoint `/api/memory/extract` no existe en api-ia (404)

- **Recall**: `src/server/services/memoryRecall/index.ts`
  - Busca en 3 tablas: user_memories, preferences, identities
  - Usa embeddings 1024-dim para similarity search
  - **Bloqueado**: endpoint `/api/lobechat-kb/query-embedding` no existe en api-ia (404)

- **UI de gestión**: **NO EXISTE** — las memorias son invisibles al usuario

---

## 6. VARIABLES DE ENTORNO FALTANTES

| Variable | Propósito | Impacto si falta |
|---|---|---|
| `COHERE_API_KEY` | Re-ranking de resultados RAG | Re-ranker deshabilitado, resultados menos relevantes |
| `UNSTRUCTURED_API_KEY` | Chunking de documentos | No se pueden procesar archivos para RAG |
| `UNSTRUCTURED_SERVER_URL` | URL del servicio Unstructured | Usa URL por defecto (puede no existir) |

---

## 7. ACCIONES REQUERIDAS POR EQUIPO api-ia

### Prioridad ALTA (bloquea funcionalidad core)

1. **Corregir AUTO_ROUTING_ERROR** (`name 'invitados' is not defined`)
   - Revisar si auto-routing usa `eval()` sobre contenido del mensaje
   - Trace IDs proporcionados arriba para debugging
   - Impacto: Chat con datos de eventos falla intermitentemente

2. **Corregir /api/lobechat-kb/search** (500 Internal Error)
   - Error: "Error generando embedding de la query"
   - trace_id: trc_96084b1ba293
   - Impacto: Búsqueda semántica en knowledge bases no funciona

3. **Renovar API key OpenAI** en whitelabel config de bodasdehoy
   - Actualmente devuelve 403
   - Anthropic funciona como fallback pero OpenAI es el provider principal

### Prioridad MEDIA (funcionalidad nueva bloqueada)

4. **Desplegar endpoint `/api/lobechat-kb/query-embedding`**
   - Requerido para: Memory Recall (generar embeddings 1024-dim de queries)
   - Parámetros esperados: `{ text: string }` → `{ embedding: number[] }`

5. **Desplegar endpoint `/api/memory/extract`**
   - Requerido para: Extracción automática de memorias de conversaciones
   - Parámetros esperados: `{ summary: string, user_id: string }` → `{ memories: [...] }`

6. **Actualizar modelo Google/Gemini** (`gemini-2.0-flash` deprecated → 404)

### Prioridad BAJA (mejora de calidad)

7. **Configurar COHERE_API_KEY** en el entorno de chat-ia
   - Mejora la relevancia de resultados RAG con re-ranking
   - Modelo: `rerank-v3.5` (multilingual)

8. **Configurar UNSTRUCTURED_API_KEY** en el entorno de chat-ia
   - Permite procesar PDFs, DOCX y otros documentos para RAG

---

## 8. RESUMEN DE ESTADO GENERAL

### Lo que FUNCIONA ahora:
- ✅ Chat IA con provider "auto" → respuestas reales con datos de eventos
- ✅ Tools de bodas (eventos, filtros, plano mesas, venue visualizer)
- ✅ Web browsing, DALLE, code interpreter
- ✅ Proxy con X-Support-Key para autenticación dinámica por whitelabel
- ✅ SSE streaming con transformación de formatos

### Lo que está IMPLEMENTADO pero NO FUNCIONA:
- ⚠️ RAG / Knowledge Bases (código listo, endpoints api-ia rotos/inexistentes)
- ⚠️ Memory Recall (código listo, endpoint 404)
- ⚠️ Memory Extraction (código listo, endpoint 404)
- ⚠️ Re-ranker Cohere (código listo, sin API key)
- ⚠️ Document chunking (código listo, sin API key)
- ⚠️ RAG Evaluation (código listo, depende de KB funcional)

### Lo que NO EXISTE:
- ❌ UI de gestión de memorias del usuario
- ❌ Debug/preview de RAG results en la UI
