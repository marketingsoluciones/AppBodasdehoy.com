# Informe detallado para análisis por otro equipo

**Título:** Análisis de documentación, código en desuso, preguntas pendientes y estructura del monorepo AppBodasdehoy.com  
**Fecha:** 2026-02-10  
**Versión:** 1.0  
**Alcance:** Repositorio completo (raíz, docs/, apps/copilot, apps/copilot-backup-20260208-134905, apps/web)  
**Objetivo:** Entregar a otro equipo un documento autocontenido para que puedan auditar, priorizar y ejecutar acciones sin depender de conocimiento previo del repo.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contexto del proyecto y estructura](#2-contexto-del-proyecto-y-estructura)
3. [Inventario completo de documentación](#3-inventario-completo-de-documentación)
4. [Inventario detallado de código deprecado o en desuso](#4-inventario-detallado-de-código-deprecado-o-en-desuso)
5. [Preguntas pendientes de backend (texto de referencia)](#5-preguntas-pendientes-de-backend-texto-de-referencia)
6. [Rutas y APIs relevantes](#6-rutas-y-apis-relevantes)
7. [Acciones recomendadas (priorizadas)](#7-acciones-recomendadas-priorizadas)
8. [Anexos](#8-anexos)

---

## 1. Resumen ejecutivo

| Categoría | Resumen | Impacto |
|-----------|--------|---------|
| **Documentación** | Más de 60 archivos .md en la raíz del proyecto con solapamiento (múltiples ESTADO_*, RESUMEN_*, INSTRUCCIONES_* de sesiones pasadas). docs/archive contiene ~50 documentos históricos. docs/ contiene ~24 documentos vivos de integración y operación. | Riesgo de confusión sobre qué doc es la fuente de verdad; recomendable consolidar o archivar por criterio y fecha. |
| **Código deprecado** | En apps/copilot existe una capa completa `_deprecated` en services (session, import, export, topic, file, user, message, plugin), database, server/globalConfig y utils. Además hay ~50+ apariciones de `@deprecated` o `TODO: remove in V2` en código y paquetes. Esta capa sigue en uso por compatibilidad (edición “deprecada” / V1). | No se puede eliminar sin una migración planificada a V2; eliminar sin migrar rompería export/import, config y sesiones en modo legacy. |
| **Preguntas pendientes** | Tres documentos concentran las preguntas al backend: PREGUNTAS-BACKEND-COPILOT.md (6 bloques), PREGUNTAS-API-IA-TEST-DATOS-REALES.md (contratos + entorno de pruebas), AVANCE-INTEGRACION-BACKEND.md (checklist y pasos). La sección "Respuestas" en AVANCE está vacía. | La integración con api-ia y API2 no está totalmente cerrada; hay dependencia de respuestas del equipo de backend para ajustar contratos, SSE y tests. |
| **Repositorio backup** | apps/copilot-backup-20260208-134905 es una copia de seguridad de apps/copilot (febrero 2026). No se ejecuta como aplicación; se usa solo como referencia para restaurar apps/copilot si fuera necesario. | No es un “segundo repositorio” activo; el código duplicado allí refleja el mismo estado deprecado que copilot. |

---

## 2. Contexto del proyecto y estructura

### 2.1 Monorepo

- **Raíz:** AppBodasdehoy.com (pnpm workspace).
- **Aplicaciones relevantes:**
  - **apps/web:** Aplicación web principal (Next.js); puerto 8080 en desarrollo. Incluye el sidebar del Copilot (iframe a apps/copilot).
  - **apps/copilot:** Aplicación LobeChat/PLANNER AI (Next.js); puerto 3210. Incluye Memories, Artifacts, chat, files, knowledge base.
  - **apps/copilot-backup-20260208-134905:** Copia de seguridad de apps/copilot; no tiene scripts de arranque propios en el monorepo.
- **Backends externos referenciados:**
  - **api-ia** (Python): chat en vivo, streaming SSE, y según lo indicado, escritura de mensajes en API2 al finalizar el stream.
  - **API2** (GraphQL, api2.eventosorganizador.com): entre otros, persistencia de historial de chat; el front lee con `getChatMessages`.

### 2.2 Rutas de integración Copilot (resumen)

- El usuario abre el Copilot desde apps/web (sidebar) → se carga un iframe que apunta a apps/copilot (ej. http://localhost:3210).
- Chat: apps/web expone proxy `/api/copilot/chat` → api-ia (POST /webapi/chat/auto).
- Historial: front llama a `/api/copilot/chat-history` (apps/web) → proxy a API2 `getChatMessages`. Si falla, hay fallback a GET/POST `/api/chat/messages` (store en memoria en Next.js).

---

## 3. Inventario completo de documentación

### 3.1 Documentos en la raíz del proyecto

Todos los archivos .md listados a continuación están en la raíz (misma carpeta que package.json, pnpm-workspace.yaml).

#### 3.1.1 Recomendación: ARCHIVAR o unificar (estado/resumen de sesiones antiguas)

| Archivo | Fecha implícita | Recomendación |
|---------|------------------|---------------|
| ESTADO_ACTUAL_PROYECTO_2026-02-07.md | 2026-02-07 | Archivar en docs/archive/ o docs/archive/estado-sesiones-2026-02/ |
| ESTADO_FINAL_2026-02-07.md | 2026-02-07 | Idem |
| ESTADO_FINAL_COPILOT_2026-02-07.md | 2026-02-07 | Idem |
| ESTADO_FINAL_REPOSITORIOS.md | - | Idem |
| ESTADO_FINAL_SESION_2026-02-07.md | 2026-02-07 | Idem |
| ESTADO_ACTUAL_SERVIDORES.md | - | Idem |
| ESTADO_SERVIDORES.md | - | Idem |
| RESUMEN_FINAL_COMPLETO.md | - | Idem |
| RESUMEN_FINAL_SESION.md | - | Idem |
| RESUMEN_EDITOR_COPILOT_2026-02-07.md | 2026-02-07 | Idem |
| RESUMEN_LIMPIEZA_2026-02-07.md | 2026-02-07 | Idem |
| RESUMEN_REBUILD_2026-02-07.md | 2026-02-07 | Idem |
| RESUMEN_SESION_TOOLBAR.md | - | Idem |
| RESUMEN_TRABAJO_COMPLETO.md | - | Idem |
| RESUMEN_CAMBIOS_DEBUGGING_2026-02-07.md | 2026-02-07 | Idem |
| FIX_LOGIN_Y_MENU_2026-02-07.md | 2026-02-07 | Idem |
| LISTO_PARA_PRUEBAS.md | - | Idem |
| PLAN_PRUEBAS_COPILOT_2026-02-07.md | 2026-02-07 | Idem |

#### 3.1.2 Recomendación: REVISAR vigencia (instrucciones / caché / navegador)

| Archivo | Contenido breve | Recomendación |
|---------|------------------|---------------|
| LEEME_PRIMERO.md | Solución caché iframe Copilot; hard refresh | Revisar si el problema de caché sigue existiendo tras la reversión; si no, archivar o marcar como histórico. |
| INSTRUCCIONES_VERIFICACION.md | Checklist de verificación de servidores 3210 y 8080, sidebar, botón "Ver completo" | **Mantener** como checklist oficial de QA si se usa. |
| INSTRUCCIONES_ACCESO_PLANNER_AI.md | Acceso a PLANNER AI | Revisar si sigue en uso. |
| INSTRUCCIONES_DEBUGGING_NAVEGADOR_EXTERNO.md | Debug en navegador externo | Revisar si sigue en uso. |
| INSTRUCCIONES_PRUEBA_TOOLBAR.md | Pruebas de toolbar | Revisar si sigue en uso. |
| INSTRUCCIONES_FINALES.md | Instrucciones finales varias | Revisar si sigue en uso. |
| URGENTE_LEER_CACHE_NAVEGADOR.md | Urgencia caché navegador | Posiblemente obsoleto; archivar o eliminar si ya no aplica. |
| VERIFICAR_NAVEGADOR_URGENTE.md | Verificación navegador | Idem. |
| PROBLEMA_SOLUCIONADO_CACHE.md | Problema de caché resuelto | Idem. |

#### 3.1.3 Recomendación: MANTENER como referencia (análisis / comparación / arquitectura)

| Archivo | Contenido breve |
|---------|------------------|
| ANALISIS_COMPLETO_FUNCIONALIDADES.md | Análisis de funcionalidades |
| ANALISIS_COMPONENTE_ORIGINAL.md | Análisis componente original |
| ANALISIS_EDITOR_DIFERENCIAS.md | Diferencias de editor |
| ANALISIS_EXHAUSTIVO_GIT.md | Análisis git y limpieza |
| ANALISIS_TIEMPOS_CARGA.md | Tiempos de carga |
| COMPARACION_PLANNER_AI_VS_LOBECHAT.md | Comparación Planner AI vs LobeChat |
| RESUMEN_COMPARACION.md | Resumen comparación |
| ARQUITECTURA_MONOREPO.md | Arquitectura del monorepo |
| ARQUITECTURA.md | Arquitectura general |
| LIMPIEZA_COMPLETADA.md | Limpieza completada (restauración desde backup) |
| PLAN_LIMPIEZA_COMPLETA.md | Plan de limpieza |
| SITUACION_COPILOT_GITHUB.md | Situación Copilot y GitHub |
| REVERSION_COMPLETADA.md | Reversión de integración LobeChat en apps/web (commit f7bac18) |

Opcional: mover estos a docs/ o docs/referencia/ para dejar la raíz más limpia.

#### 3.1.4 Recomendación: MANTENER como documentación reciente (2026-02-10)

| Archivo | Contenido breve |
|---------|------------------|
| REPORTE_ANALISIS_FUNCIONALIDADES_2026-02-10.md | Estado de funcionalidades (Memories, Artifacts, etc.) |
| REPORTE_RENDIMIENTO_2026-02-10.md | Rendimiento |
| REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md | Requerimientos técnicos backend para Memories (timeout, etc.) |
| PLAN_FRONTEND_MIENTRAS_BACKEND_2026-02-10.md | Plan frontend mientras backend responde |
| OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md | Optimizaciones implementadas |
| SESION_FIXES_LOCALSTORAGE_2026-02-10.md | Correcciones localStorage |
| ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md | Análisis previo doc/código en desuso |

#### 3.1.5 Otros en raíz (fases, confirmaciones, toolbar, etc.)

| Archivo | Nota |
|---------|------|
| ACTUALIZACION_TODOS_LOS_BOTONES.md | Fase/confirmación |
| CHECKLIST_VISUAL_COPILOT.md | Checklist visual |
| COMPONENTE_COMPARTIDO_EXITO.md | Confirmación componente |
| CONFIRMACION_FINAL_EXITO.md | Confirmación |
| COPILOT_ACTUALIZADO.md | Estado Copilot |
| COPILOT_COMPLETO_LATERAL_IZQUIERDO.md | Sidebar |
| EXPLICACION_COPILOT_SIDEBAR.md | Explicación sidebar |
| EXPLICACION_PROBLEMA_TOOLBAR.md | Problema toolbar |
| FASE_5_INTEGRACION_COMPLETADA.md | Fase 5 |
| FASE_6_BOTON_VER_COMPLETO_COMPLETADA.md | Fase 6 |
| FASE_7_I18N_STYLING_COMPLETADA.md | Fase 7 |
| FASE_8_TESTING_DOCS_COMPLETADA.md | Fase 8 |
| PROYECTO_COMPLETADO.md | Proyecto completado |
| RESPUESTA_COMPONENTE_ORIGINAL.md | Respuesta componente |
| REUTILIZAR_COMPONENTES_COPILOT.md | Reutilización componentes |
| TOOLBAR_AGREGADO.md | Toolbar |
| VERIFICACION_CHATINPUT_COMPARTIDO.md | Verificación ChatInput |
| README.md, README_MONOREPO.md, CONTRIBUTING.md, QUICK_START.md | Documentación de proyecto; **mantener**. |

El equipo que analice puede decidir cuáles de los “Otros” pasan a archive o se fusionan en un único “Estado y fases”.

---

### 3.2 Documentos en docs/ (excluyendo subcarpetas archive, reports, etc.)

Ruta base: `docs/`

| Archivo | Propósito | Recomendación |
|---------|-----------|---------------|
| PREGUNTAS-BACKEND-COPILOT.md | Preguntas al backend (api-ia / API2): historial, sessionId, API2, SSE, métricas, auth. | **Mantener.** Fuente de verdad de preguntas; rellenar o enlazar respuestas cuando lleguen. |
| PREGUNTAS-API-IA-TEST-DATOS-REALES.md | Contratos actuales (chat, SSE, getChatMessages) y peticiones de ejemplos reales y entorno de pruebas. | **Mantener.** Complemento de PREGUNTAS-BACKEND-COPILOT. |
| AVANCE-INTEGRACION-BACKEND.md | Resumen de estado, próximos pasos, checklist y sección "Respuestas" (vacía). | **Mantener.** Actualizar checklists y "Respuestas" cuando backend responda. |
| PLAN-COPILOT-MONOREPO.md | Plan de integración Copilot en el monorepo (flujos, quién guarda/lee historial, fallback). | **Mantener.** Referencia de arquitectura. |
| MONOREPO-INTEGRACION-COPILOT.md | Integración monorepo Copilot. | Mantener. |
| MONOREPO-APP-TEST-CHAT-TEST.md | App-test y chat-test en monorepo. | Mantener si aplica. |
| ANALISIS-RESPUESTA-BACKEND-COPILOT.md | Análisis de respuesta backend (dejar de persistir en Next, fallback). | Mantener. |
| ANALISIS-USO-API2-Y-APIS.md | Uso de API2 y apis. | Mantener. |
| LISTADO-LLAMADAS-API2-AUDITORIA.md | Auditoría de llamadas API2. | Mantener. |
| INFORME_APIS_APPBODASDEHOY.md | Informe APIs. | Mantener. |
| INFORME-API-IA-RESUMEN-NECESIDADES.md | Resumen necesidades api-ia (incluye preguntas de arquitectura). | Mantener. |
| INFORME-BACKEND-API-IA-IMPLEMENTAR.md | Qué implementar en backend api-ia. | Mantener. |
| ESTADO-COPILOT-RESUMEN.md | Estado Copilot resumido. | Revisar vigencia. |
| DESPLIEGUE-APP-TEST-COPILOT.md | Despliegue app-test y Copilot. | Mantener si aplica. |
| LOCAL-DOMINIOS-APP-TEST-CHAT-TEST.md | Dominios locales. | Mantener si aplica. |
| POR-QUE-APP-TEST-Y-CHAT-TEST-ESTAN-EN-EL-MISMO-MONOREPO.md | Justificación estructura. | Mantener. |
| APP-TEST-Y-CHAT-TEST-502.md | Problemas 502. | Mantener para diagnóstico. |
| ANALISIS-502-VPN.md | Análisis 502/VPN. | Mantener. |
| COPILOT-CHAT-TEST-NO-CARGA.md | Copilot/chat-test no carga. | Mantener. |
| PROBAR-SIN-NAVEGADOR.md | Cómo probar sin navegador (curl, etc.). | Mantener. |
| DIAGNOSTICO_502.md | Diagnóstico 502. | Mantener. |
| README.md | Índice o introducción de docs. | Mantener. |
| verificar-funciona.md | Verificación de que funciona. | Revisar vigencia. |
| BROWSER-MCP-CONFIG.md, CAPACIDADES-BROWSER-MCP.md | Browser MCP. | Mantener si se usa MCP. |
| EMAIL_PROVEEDOR.md | Email proveedor. | Mantener si aplica. |

---

### 3.3 Documentos en apps/copilot y apps/copilot-backup

| Ruta | Propósito | Recomendación |
|------|-----------|---------------|
| apps/copilot/TEST_FUNCIONALIDADES.md | Checklist de pruebas (Memories, Artifacts, Chat, Files, Knowledge Base). | **Mantener** como guía de QA. |
| apps/copilot/INSTRUCCIONES_LEVANTAR_PLAYGROUND.md | Cómo levantar el playground. | Mantener si el playground se usa. |
| apps/copilot-backup-20260208-134905/... | Espejo de documentación y código de copilot en fecha de backup. | No mantener como doc “viva”; el backup es solo para restauración. |

---

### 3.4 docs/archive

- Contiene ~50 archivos .md de estado, resúmenes, planes y diagnósticos antiguos.
- **Recomendación:** No eliminar; usar como historial. Si se hace limpieza masiva en raíz, los movidos pueden ir a docs/archive/ o a una subcarpeta con fecha (ej. docs/archive/estado-sesiones-2026-02/).

---

## 4. Inventario detallado de código deprecado o en desuso

Todas las rutas son relativas a **apps/copilot** salvo indicación contraria. El mismo patrón existe en **apps/copilot-backup-20260208-134905** (mismos paths bajo ese directorio).

### 4.1 Services: índice que usa DeprecatedService

Cada uno de estos `index.ts` exporta o delega en un `ClientService` que viene de `_deprecated`. No eliminar sin migrar a la implementación no deprecada.

| Archivo | Línea | Código / Comentario |
|---------|-------|----------------------|
| src/services/session/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/import/index.ts | 1 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/topic/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/file/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/user/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/message/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |
| src/services/plugin/index.ts | 3 | `import { ClientService as DeprecatedService } from './_deprecated';` |

### 4.2 Services: implementación _deprecated y tests

| Archivo | Líneas (ref) | Nota |
|---------|----------------|------|
| src/services/session/_deprecated.ts | 1-7 | Imports de database/_deprecated (SessionModel, SessionGroupModel, UserModel). |
| src/services/session/_deprecated.test.ts | 3-4, 8, 13, 36 | Imports y mocks de _deprecated. |
| src/services/import/_deprecated.ts | 1-4 | MessageModel, SessionModel, SessionGroupModel, TopicModel. |
| src/services/export/_deprecated.ts | 73, 153 | Comentario `@deprecated` en métodos. |
| src/services/topic/_deprecated.ts | 1 | TopicModel. |
| src/services/topic/_deprecated.test.ts | 3-4, 7, 11 | Imports y mock _deprecated. |
| src/services/file/_deprecated.ts | 1 | FileModel. |
| src/services/file/_deprecated.test.ts | 3-4, 10, 18 | Imports y mock. |
| src/services/user/_deprecated.ts | 3-5 | MessageModel, SessionModel, UserModel. |
| src/services/user/_deprecated.test.ts | 4, 8, 10 | Imports y mock. |
| src/services/message/_deprecated.ts | 13-15 | FileModel, MessageModel, DB_Message. |
| src/services/message/_deprecated.test.ts | 11, 13, 18 | Imports y mock. |
| src/services/plugin/_deprecated.ts | 4 | PluginModel. |
| src/services/plugin/_deprecated.test.ts | 5-6, 9, 16 | Imports y mock. |

### 4.3 config.ts y export deprecado

| Archivo | Líneas | Comentario / Uso |
|---------|--------|-------------------|
| src/services/config.ts | 9 | `import { configService as deprecatedExportService } from './export/_deprecated';` |
| src/services/config.ts | 13, 15 | `// TODO: remove this in V2` + `deprecatedExportService.exportAll()` |
| src/services/config.ts | 38, 40 | `// TODO: remove this in V2` + `deprecatedExportService.exportAgents()` |
| src/services/config.ts | 48, 50 | `// TODO: remove this in V2` + `deprecatedExportService.exportSingleAgent(agentId)` |
| src/services/config.ts | 60, 62 | `// TODO: remove this in V2` + `deprecatedExportService.exportSessions()` |
| src/services/config.ts | 70, 72 | `// TODO: remove this in V2` + `deprecatedExportService.exportSessions()` (exportSettings) |
| src/services/config.ts | 80, 82 | `// TODO: remove this in V2` + `deprecatedExportService.exportSingleSession(sessionId)` |

### 4.4 Database _deprecated

| Archivo | Nota |
|---------|------|
| src/database/_deprecated/models/session.ts | BaseModel, DB_Session. |
| src/database/_deprecated/models/sessionGroup.ts | BaseModel, schemas sessionGroup. |
| src/database/_deprecated/models/message.ts | BaseModel, DB_Message; comentario `@deprecated` en bloque. |
| src/database/_deprecated/models/topic.ts | TopicModel, DB_Topic. |
| src/database/_deprecated/models/file.ts | DB_File. |
| src/database/_deprecated/models/plugin.ts | BaseModel. |
| src/database/_deprecated/models/user.ts | BaseModel. |
| src/database/_deprecated/schemas/user.ts | AgentSchema desde session. |
| src/database/_deprecated/models/__DEBUG.ts | Imports de core y schemas. |
| src/database/_deprecated/models/__tests__/*.ts | Tests que usan modelos y schemas _deprecated. |

### 4.5 Server y utils deprecados

| Archivo | Líneas | Comentario / Uso |
|---------|--------|-------------------|
| src/server/globalConfig/index.ts | 13 | `import { genServerLLMConfig } from './_deprecated';` |
| src/server/globalConfig/_deprecated.ts | 6 | `import { extractEnabledModels, transformToChatModelCards } from '@/utils/_deprecated/parseModels';` |
| src/server/globalConfig/_deprecated.test.ts | 3, 41 | Import y mock de _deprecated y parseModels. |
| src/migrations/FromV3ToV4/index.ts | 2 | `import { transformToChatModelCards } from '@/utils/_deprecated/parseModels';` |

### 4.6 Store y otros usos de _deprecated

| Archivo | Línea | Comentario / Uso |
|---------|-------|-------------------|
| src/store/user/slices/common/action.test.ts | 7 | `import { ClientService } from '@/services/user/_deprecated';` |
| src/features/DataImporter/index.tsx | 12, 24 | Import desde `@/services/import/_deprecated` y `./_deprecated`. |
| src/features/DataImporter/index.tsx | 161 | `// TODO: remove in V2` |
| src/features/DataImporter/_deprecated.ts | 10 | `@deprecated` en bloque. |
| src/app/[variants]/(main)/chat/features/Migration/UpgradeButton.tsx | 5 | `import { ClientService } from '@/services/import/_deprecated';` |
| src/app/[variants]/(main)/(mobile)/me/data/features/Category.tsx | 8 | `import { configService } from '@/services/export/_deprecated';` |
| packages/database/src/repositories/dataImporter/deprecated/index.ts | 3 | `import { ImportResult } from '@/services/import/_deprecated';` |

### 4.7 TODOs “remove in V2” o “remove in V2.0” (sin contar config.ts ya listado)

| Archivo | Línea | Texto |
|---------|-------|--------|
| src/store/chat/slices/topic/action.ts | 378 | `// TODO: Need to remove because server service don't need to call it` |
| src/store/chat/slices/plugin/action.ts | 59 | `* @deprecated V1 method` |
| src/services/session/server.ts | 22 | `// TODO: remove any` |
| src/services/session/type.ts | 24, 32, 71 | `* @deprecated` (en tipos) |
| src/services/models.ts | 30 | `// TODO: remove this condition in V2.0` |
| src/services/_header.ts | 14, 22 | `* @deprecated` y `// TODO: remove this condition in V2.0` |
| src/services/_auth.ts | 44, 46, 48, 50, 62, 77 | `/** @deprecated */` (varios campos); 164: `// TODO: remove this condition in V2.0` |
| src/services/chat/helper.ts | 11, 28, 67 | `// TODO: remove isDeprecatedEdition condition in V2.0` / `// TODO: remove this condition in V2.0` |
| src/hooks/useModelSupportVision.ts | 9 | `// TODO: remove this in V2.0` |
| src/hooks/useModelContextWindowTokens.ts | 9 | Idem |
| src/hooks/useModelSupportToolUse.ts | 9 | Idem |
| src/hooks/useModelSupportReasoning.ts | 9 | Idem |
| src/hooks/useModelSupportFiles.ts | 9 | Idem |
| src/hooks/useModelHasContextWindowToken.ts | 13 | Idem |
| src/hooks/_header.ts | 7 | `* @deprecated` |
| src/components/InvalidAPIKey/APIKeyForm/useApiKey.ts | 21 | `// TODO: remove this in V2` |
| src/helpers/isCanUseFC.ts | 7 | `// TODO: remove isDeprecatedEdition condition in V2.0` |
| src/server/routers/lambda/message.ts | 77, 82 | `// TODO: it will be removed in V2` (x2) |
| src/locales/default/error.ts | 136 | `* @deprecated` |
| src/envs/file.ts | 18 | `* @deprecated` (NEXT_PUBLIC_S3_DOMAIN) |
| src/types/wedding-web.ts | 92 | `/** @deprecated Use heroImageUrl instead */` |
| src/tools/web-browsing/Render/PageContent/index.tsx | 46 | `// TODO: Remove this in v2 as it's deprecated` |
| src/config/modelProviders/perplexity.ts | 27 | Comentario sobre deprecation on 02-22 |
| src/config/modelProviders/index.ts | 71 | `* @deprecated` |
| src/server/routers/edge/index.ts | 2 | `* @deprecated` |

### 4.8 Paquetes internos (packages bajo apps/copilot)

| Archivo | Línea | Nota |
|---------|-------|------|
| packages/types/src/fetch.ts | 18 | `@deprecated` |
| packages/types/src/openai/chat.ts | 47 | `@deprecated` |
| packages/types/src/tool/index.ts | 15, 19 | TODO remove type; `@deprecated` |
| packages/types/src/tool/tool.ts | 11 | `@deprecated` |
| packages/types/src/serverConfig.ts | 31, 36 | `@deprecated` |
| packages/types/src/llm.ts | 86, 95, 103, 113, 130, 144, 149 | Varios `@deprecated` |
| packages/types/src/user/settings/keyVaults.ts | 15 | `@deprecated` |
| packages/types/src/message/ui/chat.ts | 63 | `@deprecated` |
| packages/model-runtime/src/types/error.ts | 39 | `@deprecated` |
| packages/database/src/models/message.ts | 479 | `// TODO: remove this when the client is updated` |
| packages/const/src/fetch.ts | 14 | `@deprecated` |
| packages/context-engine/src/tools/utils.ts | 9 | `@deprecated Use ToolNameResolver.generate() instead` |
| apps/desktop/src/main/services/fileSrv.ts | 50 | `@deprecated 仅用于向后兼容...` |
| apps/desktop/src/main/modules/fileSearch/impl/macOS.ts | 263, 344 | `@deprecated` (dos bloques) |

---

## 5. Preguntas pendientes de backend (texto de referencia)

Para que el equipo que analice pueda enviar o contrastar con backend, se incluye un resumen de dónde están las preguntas y qué piden. Los textos completos están en los archivos indicados.

### 5.1 docs/PREGUNTAS-BACKEND-COPILOT.md

Documento para enviar al equipo de backend (api-ia / API2). Resumen por bloque:

1. **Historial de chat**
   - ¿api-ia ya persiste mensajes por sessionId o userId?
   - Si sí: ¿qué endpoint usar para obtener historial y en qué formato (id, role, content, createdAt)?
   - Si sí: ¿hay que enviar cada mensaje a algún endpoint o el backend ya los guarda al procesar la petición?
   - Si no: ¿está previsto? Mientras tanto el front usa GET/POST /api/chat/messages (Next.js) en memoria.

2. **SessionId**
   - ¿api-ia usa ya el sessionId (o equivalente) para agrupar mensajes o contexto?
   - ¿Hay que enviar sessionId en algún header o campo concreto (nombre y formato)?

3. **API2 / GraphQL**
   - ¿Existe en API2 alguna query o mutación para leer/guardar historial de mensajes del Copilot?
   - Si existe: nombre de la operación, argumentos y formato de respuesta.

4. **Eventos SSE**
   - ¿api-ia envía ya en el stream eventos como tool_result, progress, tool_start, etc.?
   - Si sí: ¿hay documentación o lista de tipos y formato de `data`?
   - Si no: ¿está previsto?

5. **Métricas**
   - ¿api-ia registra ya métricas de uso (mensajes, errores, latencia)?
   - Si sí: ¿hay que llamar a algún endpoint desde el front?
   - Si no: ¿el front debe reportar a algún endpoint o solo logs en front?

6. **Auth**
   - ¿Los usuarios Firebase (o IdP de la web) se sincronizan con la BD de api-ia o hay que crearlos/actualizarlos por otro proceso?
   - ¿Basta con Bearer + headers actuales (X-Development, etc.) para que api-ia asocie la conversación?

**Resumen de lo que hace hoy el front (según el doc):** Chat vía POST /api/copilot/chat (proxy a api-ia); historial con GET /api/chat/messages (memoria) y POST para guardar; sessionId tipo user_<uid> o guest_<id>.

### 5.2 docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md

- **1. Contratos actuales**
  - Request: POST /webapi/chat/auto (headers, body con messages, stream, metadata). **Pregunta:** ¿Algún campo más obligatorio o formato distinto (ej. metadata.sessionId)?
  - SSE: tipos event_card, usage, reasoning, tool_result, etc. **Pregunta:** 1–2 ejemplos reales (anonimizados) por tipo.
  - Historial: getChatMessages en API2 (api-ia escribe ahí). **Pregunta:** Confirmar forma exacta de la respuesta (id, role, content, createdAt, ISO). **Opcional:** ¿Preferís que el front solo hable con api-ia y api-ia exponga algo tipo GET /webapi/chat/history?

- **2. Entorno de pruebas**
  1. ¿Existe URL de api-ia solo para pruebas (staging/test) y qué credenciales (JWT, API key)?
  2. ¿Podéis facilitar un sessionId de prueba con mensajes ya guardados en API2?
  3. ¿Hay usuario/JWT de test para automatización sin tocar producción?

### 5.3 docs/AVANCE-INTEGRACION-BACKEND.md

- **Tabla de estado:** Chat en vivo ✅; Historial ⏳ (confirmar forma); SessionId ✅ (confirmar uso en api-ia); SSE ⏳ (ejemplos reales); Métricas ❓; Auth ❓; Tests con datos reales ❌.
- **Próximos pasos:** (1) Confirmar contratos, (2) Alinear parseo SSE con ejemplos reales, (3) Entorno de pruebas, (4) Decisión arquitectura opcional, (5) Resolver ítems de PREGUNTAS-BACKEND-COPILOT.
- **Checklist integración front:** Ajustar body/headers si api-ia indica; reemplazar persistencia en memoria por API2 o endpoint api-ia; validar parseo SSE; config env test; test de integración opcional.
- **Sección "Respuestas (rellenar cuando backend responda)":** Actualmente vacía.

---

## 6. Rutas y APIs relevantes

### 6.1 apps/web (Next.js)

| Ruta o API | Método | Descripción |
|------------|--------|-------------|
| /api/copilot/chat | POST | Proxy al backend api-ia (POST /webapi/chat/auto). Body: messages, stream, metadata (sessionId, userId, pageContext, etc.). |
| /api/copilot/chat-history | GET | Proxy a API2 GraphQL getChatMessages(sessionId, limit). Query params: sessionId, limit. |
| /api/chat/messages | GET | Devuelve mensajes guardados en memoria (Next.js). Query: sessionId. Uso: fallback cuando chat-history falla o no tiene datos. |
| /api/chat/messages | POST | Guarda mensaje en memoria (Next.js). Uso: persistencia local cuando no hay backend; según doc no debería usarse para no duplicar si api-ia ya escribe en API2. |

Implementación de referencia:
- Proxy chat: lógica en apps/web relacionada con /api/copilot/chat.
- Historial y fallback: apps/web/services/copilotChat.ts (getChatHistory intenta chat-history y luego fallback a /api/chat/messages); apps/web/pages/api/chat/messages.ts (GET/POST).

### 6.2 apps/copilot (LobeChat / PLANNER AI)

- Puerto por defecto en dev: 3210.
- Rutas de producto: /chat, /memories, /files, /knowledge, etc. (ver apps/copilot/TEST_FUNCIONALIDADES.md).
- Backend de referencia: https://api-ia.bodasdehoy.com (health, memories, etc.).

### 6.3 Backends externos

- **api-ia (Python):** Base URL según env (ej. api-ia.bodasdehoy.com). Endpoints: /health, POST /webapi/chat/auto, /api/auth/identify-user, /api/memories/*.
- **API2 (GraphQL):** api2.eventosorganizador.com. Query usada para historial: getChatMessages(sessionId, limit).

---

## 7. Acciones recomendadas (priorizadas)

### Prioridad alta (evitar errores y cerrar dependencias)

1. **Preguntas backend**
   - Enviar o recordar al equipo de backend los documentos docs/PREGUNTAS-BACKEND-COPILOT.md y docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md.
   - Cuando respondan: rellenar la sección "Respuestas" en docs/AVANCE-INTEGRACION-BACKEND.md y actualizar checklists; opcionalmente crear un doc "Respuestas Backend" o un resumen en PREGUNTAS-BACKEND-COPILOT.

2. **Código _deprecated**
   - No eliminar la capa _deprecated (services, database, server/globalConfig, utils) hasta tener migración a V2.
   - Documentar en CONTRIBUTING o README de apps/copilot la existencia de la capa _deprecated y el plan V2 (para que quien toque export/import/config no borre por error).

3. **Rutas de historial en apps/web**
   - No eliminar GET/POST /api/chat/messages sin acuerdo con backend; están documentadas como fallback cuando API2 no está disponible o no devuelve datos.

### Prioridad media (orden y claridad)

4. **Documentación en raíz**
   - Mover a docs/archive/ (o docs/archive/estado-sesiones-2026-02/) los documentos de estado/resumen de sesiones antiguas (lista en sección 3.1.1).
   - Revisar vigencia de LEEME_PRIMERO, URGENTE_LEER_CACHE_NAVEGADOR, VERIFICAR_NAVEGADOR_URGENTE, PROBLEMA_SOLUCIONADO_CACHE; archivar o marcar como históricos si el problema de caché ya no aplica.
   - Mantener INSTRUCCIONES_VERIFICACION.md como checklist oficial de QA de servidores 3210/8080.

5. **Un solo punto de verdad para “estado actual”**
   - Crear un único documento "Estado actual" (o usar uno existente) que enlace a docs recientes (2026-02-10) y a docs de integración (PREGUNTAS-*, AVANCE-INTEGRACION-BACKEND, PLAN-COPILOT-MONOREPO), para que el equipo sepa dónde mirar.

### Prioridad baja (limpieza progresiva)

6. **TODOs V2 en código**
   - Ir cerrando TODOs "remove in V2" a medida que se migren flujos (config export, session, import, etc.); no hacer limpieza masiva sin plan de migración.

7. **Backup**
   - Dejar claro en README o docs que apps/copilot-backup-20260208-134905 es solo copia de seguridad para restauración. Si en el futuro se deja de usar, valorar eliminarlo del árbol y conservar un tag o tarball.

---

## 8. Anexos

### 8.1 Glosario breve

| Término | Significado en este informe |
|--------|-----------------------------|
| api-ia | Backend de IA (Python); chat en vivo, streaming SSE, escritura de mensajes en API2 al finalizar stream. |
| API2 | Servicio GraphQL (api2.eventosorganizador.com); persistencia de historial; el front lee con getChatMessages. |
| Copilot | Producto LobeChat/PLANNER AI embebido en apps/web (iframe a apps/copilot). |
| apps/copilot | Aplicación que corre en puerto 3210 (LobeChat/PLANNER AI). |
| apps/copilot-backup-20260208-134905 | Copia de seguridad de apps/copilot; no se ejecuta como app. |
| _deprecated | Carpeta o archivo con sufijo _deprecated; capa legacy (V1) aún usada por isDeprecatedEdition / flujos no migrados. |
| V2 | Versión o edición “nueva”; objetivo de migración para poder retirar _deprecated. |

### 8.2 Rutas de archivos clave (referencia rápida)

| Tema | Archivos |
|------|----------|
| Preguntas al backend | docs/PREGUNTAS-BACKEND-COPILOT.md, docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md |
| Avance integración | docs/AVANCE-INTEGRACION-BACKEND.md |
| Plan Copilot monorepo | docs/PLAN-COPILOT-MONOREPO.md |
| Verificación servidores | INSTRUCCIONES_VERIFICACION.md (raíz) |
| Reversión iframe/Copilot | REVERSION_COMPLETADA.md (raíz) |
| Requerimientos Memories backend | REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md (raíz) |
| Tests funcionalidades copilot | apps/copilot/TEST_FUNCIONALIDADES.md |
| Config que usa export deprecado | apps/copilot/src/services/config.ts |
| Índices de services deprecados | apps/copilot/src/services/{session,import,topic,file,user,message,plugin}/index.ts |
| Database deprecada | apps/copilot/src/database/_deprecated/ |
| GlobalConfig deprecado | apps/copilot/src/server/globalConfig/_deprecated.ts, index.ts |
| Parseo modelos deprecado | apps/copilot/src/utils/_deprecated/parseModels.ts (referido desde globalConfig y migraciones) |
| Chat historial y fallback (web) | apps/web/services/copilotChat.ts, apps/web/pages/api/chat/messages.ts |

### 8.3 Contacto y siguiente revisión

- Este informe es un snapshot a fecha 2026-02-10. Se recomienda que el equipo que lo analice indique en el mismo doc o en un adjunto: responsable, fecha de revisión y decisiones tomadas (qué se archivó, qué se envió a backend, qué se pospone).
- Para ampliar el análisis de código deprecado se puede buscar en el repo: `_deprecated`, `@deprecated`, `TODO: remove in V2`, `TODO: remove this in V2.0`.

---

*Fin del informe.*
