# Análisis: Documentación, Código en Desuso y Preguntas Pendientes

**Fecha**: 2026-02-10  
**Alcance**: Repositorio principal AppBodasdehoy.com + apps/copilot + apps/copilot-backup-20260208-134905  
**Objetivo**: Detectar funcionalidades/código en desuso, documentación obsoleta o redundante, y preguntas sin resolver en ambos repositorios.

---

## 1. Resumen ejecutivo

| Categoría | Hallazgos |
|-----------|-----------|
| **Documentación redundante/obsoleta** | ~50+ archivos .md en raíz con solapamiento (ESTADO_*, RESUMEN_*, INSTRUCCIONES_*); docs/archive con 50+ docs históricos |
| **Código deprecado (apps/copilot)** | Capa `_deprecated` en services (session, import, export, topic, file, user, message, plugin), database, server/globalConfig; varios TODO "remove in V2" |
| **Preguntas pendientes** | docs/PREGUNTAS-BACKEND-COPILOT.md y docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md sin respuestas formales; checklist en docs/AVANCE-INTEGRACION-BACKEND.md sin completar |
| **Repositorio backup** | apps/copilot-backup-20260208-134905 es **solo referencia** para restaurar copilot; no se ejecuta. Misma estructura deprecada que copilot. |

---

## 2. Documentación en desuso o redundante

### 2.1 Raíz del proyecto – Documentos que se solapan

Muchos archivos en la raíz son **estado/resumen de sesiones pasadas** y pueden consolidarse o archivarse:

**Estado / Resumen (candidatos a archivar o unificar):**
- `ESTADO_ACTUAL_PROYECTO_2026-02-07.md`
- `ESTADO_FINAL_2026-02-07.md`
- `ESTADO_FINAL_COPILOT_2026-02-07.md`
- `ESTADO_FINAL_REPOSITORIOS.md`
- `ESTADO_FINAL_SESION_2026-02-07.md`
- `ESTADO_ACTUAL_SERVIDORES.md`
- `ESTADO_SERVIDORES.md`
- `RESUMEN_FINAL_COMPLETO.md`
- `RESUMEN_FINAL_SESION.md`
- `RESUMEN_EDITOR_COPILOT_2026-02-07.md`
- `RESUMEN_LIMPIEZA_2026-02-07.md`
- `RESUMEN_REBUILD_2026-02-07.md`
- `RESUMEN_SESION_TOOLBAR.md`
- `RESUMEN_TRABAJO_COMPLETO.md`
- `RESUMEN_CAMBIOS_DEBUGGING_2026-02-07.md`
- `FIX_LOGIN_Y_MENU_2026-02-07.md`
- `LISTO_PARA_PRUEBAS.md`
- `PLAN_PRUEBAS_COPILOT_2026-02-07.md`

**Instrucciones / Verificación (revisar si siguen vigentes):**
- `LEEME_PRIMERO.md` – Cache iframe; puede quedar obsoleto si ya no hay problema de caché.
- `INSTRUCCIONES_VERIFICACION.md` – Checklist servidores 3210/8080; **mantener** si se usa para QA.
- `INSTRUCCIONES_ACCESO_PLANNER_AI.md`, `INSTRUCCIONES_DEBUGGING_NAVEGADOR_EXTERNO.md`, `INSTRUCCIONES_PRUEBA_TOOLBAR.md`, `INSTRUCCIONES_FINALES.md` – Revisar cuáles siguen en uso.

**Cache / Navegador (posiblemente obsoletos tras reversión):**
- `URGENTE_LEER_CACHE_NAVEGADOR.md`
- `VERIFICAR_NAVEGADOR_URGENTE.md`
- `PROBLEMA_SOLUCIONADO_CACHE.md`

**Análisis / Comparación (referencia, no borrar; valorar mover a docs/):**
- `ANALISIS_COMPLETO_FUNCIONALIDADES.md`, `ANALISIS_COMPONENTE_ORIGINAL.md`, `ANALISIS_EDITOR_DIFERENCIAS.md`, `ANALISIS_EXHAUSTIVO_GIT.md`, `ANALISIS_TIEMPOS_CARGA.md`
- `COMPARACION_PLANNER_AI_VS_LOBECHAT.md`, `RESUMEN_COMPARACION.md`

**Documentos recientes (2026-02-10) – mantener como referencia actual:**
- `REPORTE_ANALISIS_FUNCIONALIDADES_2026-02-10.md`
- `REPORTE_RENDIMIENTO_2026-02-10.md`
- `REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md`
- `PLAN_FRONTEND_MIENTRAS_BACKEND_2026-02-10.md`
- `OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md`
- `SESION_FIXES_LOCALSTORAGE_2026-02-10.md`
- `REVERSION_COMPLETADA.md` – Referencia de la reversión; mantener.

### 2.2 docs/ y docs/archive

- **docs/** – Contiene los documentos **vivos** de integración backend (PREGUNTAS-*, AVANCE-INTEGRACION-BACKEND, PLAN-COPILOT-MONOREPO, etc.). Mantener y actualizar cuando backend responda.
- **docs/archive/** – ~50 archivos de estado/resumen/planes antiguos. Ya están archivados; no eliminar, usar como historial.

### 2.3 apps/copilot y apps/copilot-backup

- **apps/copilot/TEST_FUNCIONALIDADES.md** – Checklist de pruebas de Memories, Artifacts, etc. **Mantener** como guía de QA.
- **apps/copilot/INSTRUCCIONES_LEVANTAR_PLAYGROUND.md** – Mantener si el playground se usa.
- **apps/copilot-backup-20260208-134905** – No es un “segundo repo” activo; es **copia de seguridad** para restaurar `apps/copilot`. La documentación y el código duplicado aquí no se ejecutan; solo se referencian en PLAN_LIMPIEZA_COMPLETA, LIMPIEZA_COMPLETADA, SITUACION_COPILOT_GITHUB, etc.

---

## 3. Código en desuso o deprecado (apps/copilot y copilot-backup)

### 3.1 Capa _deprecated (todavía en uso por compatibilidad)

El proyecto mantiene una capa **deprecada** que sigue siendo referenciada desde los índices de services. No se puede borrar sin migrar a la nueva capa (V2).

**Services que exportan DeprecatedService y siguen usándose:**
- `src/services/session/index.ts` → ClientService desde `_deprecated`
- `src/services/import/index.ts` → idem
- `src/services/export/_deprecated.ts` – usado desde `config.ts` (TODO remove in V2)
- `src/services/topic/index.ts` → idem
- `src/services/file/index.ts` → idem
- `src/services/user/index.ts` → idem
- `src/services/message/index.ts` → idem
- `src/services/plugin/index.ts` → idem

**Database:**
- `src/database/_deprecated/` – modelos y schemas usados por los services deprecados (session, message, topic, file, plugin, user, sessionGroup).

**Server / utilidades:**
- `src/server/globalConfig/_deprecated.ts` – `genServerLLMConfig`; usado desde `server/globalConfig/index.ts`.
- `src/utils/_deprecated/parseModels.ts` – usado en migraciones (FromV3ToV4) y en `server/globalConfig/_deprecated.ts`.

**Config:**
- `src/services/config.ts` – varios `TODO: remove this in V2` que llaman a `deprecatedExportService` (export agents, sessions, etc.).

**Recomendación:** No eliminar estos archivos hasta tener la migración a V2. Sí se puede:
- Añadir en el README o en CONTRIBUTING una nota sobre “capa _deprecated y plan V2”.
- Ir cerrando progresivamente los TODOs de V2 en cuanto se migre cada flujo.

### 3.2 Otros TODOs y @deprecated en código

- **Chat/store:** `src/store/chat/slices/topic/action.ts` – TODO “Need to remove because server service don't need to call it”.
- **Plugin:** `src/store/chat/slices/plugin/action.ts` – método marcado `@deprecated V1 method`.
- **Lambda:** `src/server/routers/lambda/message.ts` – “TODO it will be removed in V2” (x2).
- **Hooks:** Varios `TODO: remove this in V2.0` en `useModelSupportVision`, `useModelContextWindowTokens`, `useModelSupportFiles`, `useModelHasContextWindowTokens`, `useModelSupportToolUse`, `useModelSupportReasoning`.
- **Types:** `src/types/wedding-web.ts` – campo con `@deprecated Use heroImageUrl instead`.
- **Web browsing:** `src/tools/web-browsing/Render/PageContent/index.tsx` – “TODO: Remove this in v2 as it's deprecated”.
- **Auth/env:** `src/services/_auth.ts`, `src/envs/file.ts` – variables/env deprecados (documentados en tests).
- **Perplexity:** `src/config/modelProviders/perplexity.ts` – comentario “deprecated on 02-22”.

### 3.3 Funcionalidad específica del proyecto (bodasdehoy)

- **weddingChatService** – Referenciado en `store/chat/slices/aiChat/initialState.ts` (copilot y backup).
- **useWeddingWebGraphQL** – Usado en copilot y backup.
- **wedding-creator** – Ruta `wedding-creator/page.tsx` en ambos.
- **ChatInput/StoreUpdater** – Uso de contexto wedding; en uso.

Nada de esto está “en desuso”; son integraciones activas.

### 3.4 apps/web – Rutas y servicios de chat

- **GET/POST `/api/chat/messages`** – Siguen en uso como **fallback** cuando `/api/copilot/chat-history` (API2) falla o no devuelve datos. Documentado en docs/PLAN-COPILOT-MONOREPO y docs/ANALISIS-RESPUESTA-BACKEND-COPILOT. No eliminar sin decidir con backend.

---

## 4. Preguntas y documentación de preguntas pendientes

### 4.1 Documentos que son listas de preguntas

- **docs/PREGUNTAS-BACKEND-COPILOT.md**  
  Preguntas al backend (api-ia / API2): historial, sessionId, API2 queries/mutations, SSE, métricas, auth. **Sin respuestas formales** en el repo; hay que rellenar cuando backend responda.

- **docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md**  
  Preguntas para api-ia: contrato del body de chat, ejemplos reales SSE, forma de `getChatMessages`, URL/credenciales de test, sessionId de prueba. **Pendiente de respuesta.**

- **docs/INFORME-API-IA-RESUMEN-NECESIDADES.md**  
  Incluye preguntas de arquitectura (quién expone auth/billing/wallet, login, etc.). **Pendiente.**

### 4.2 Checklist sin completar

- **docs/AVANCE-INTEGRACION-BACKEND.md**  
  - Checklist “Confirmar contratos actuales”, “Alinear parseo SSE”, “Entorno de pruebas”, “Decisión de arquitectura”, “Otros (PREGUNTAS-BACKEND-COPILOT)” con items sin marcar.
  - Sección “Respuestas (rellenar cuando backend responda)” vacía.

**Recomendación:** Cuando backend responda, actualizar AVANCE-INTEGRACION-BACKEND y, si aplica, añadir un breve “Respuestas recibidas” en PREGUNTAS-BACKEND-COPILOT o en un doc único de “Respuestas Backend”.

---

## 5. Repositorios: copilot vs copilot-backup

- **apps/copilot** – Es la **app activa** (puerto 3210, LobeChat/PLANNER AI). Toda la documentación y el código “en uso” se refieren a este directorio.
- **apps/copilot-backup-20260208-134905** – **Solo backup** (feb 2026). Se usa para:
  - Restaurar `apps/copilot` si algo sale mal (según LIMPIEZA_COMPLETADA, SITUACION_COPILOT_GITHUB, PLAN_LIMPIEZA_COMPLETA).
  - No se ejecuta como segundo repo; no tiene scripts ni despliegue propio en el monorepo.
- El **código deprecado** en backup es **el mismo patrón** que en copilot (mismos `_deprecated`, mismos services). No hay “código extra en desuso” solo en backup; es espejo de una fecha pasada.

---

## 6. Acciones recomendadas

### 6.1 Documentación

1. **Consolidar o archivar** en `docs/archive/` (o en una subcarpeta `docs/archive/estado-sesiones-2026-02/`) los ESTADO_*, RESUMEN_*, FIX_*, LISTO_PARA_PRUEBAS, PLAN_PRUEBAS_* de sesiones antiguas (p. ej. 2026-02-07), dejando en raíz solo un **ESTADO_ACTUAL.md** o enlazando a docs/.
2. **Revisar** LEEME_PRIMERO, URGENTE_LEER_CACHE_NAVEGADOR, VERIFICAR_NAVEGADOR_URGENTE, PROBLEMA_SOLUCIONADO_CACHE; si el problema de caché está resuelto, mover a archive o marcar como “histórico”.
3. **Mantener** INSTRUCCIONES_VERIFICACION.md como checklist oficial de verificación de servidores.
4. **Centralizar** en docs/ los documentos de integración (PREGUNTAS-*, AVANCE-INTEGRACION-BACKEND, PLAN-COPILOT-MONOREPO) y referenciarlos desde el README o desde un docs/README.md.

### 6.2 Código

1. **No eliminar** la capa `_deprecated` ni los services que la usan hasta tener migración V2.
2. **Documentar** en CONTRIBUTING o en README del copilot el uso de la capa deprecada y el plan V2.
3. **Priorizar** para V2 los TODOs que afectan a config (export/sessions/agents) y a server (lambda message, globalConfig).

### 6.3 Preguntas pendientes

1. **Enviar o recordar** al backend las preguntas de PREGUNTAS-BACKEND-COPILOT y PREGUNTAS-API-IA-TEST-DATOS-REALES.
2. **Rellenar** la sección “Respuestas” en docs/AVANCE-INTEGRACION-BACKEND.md cuando lleguen respuestas.
3. **Actualizar** PREGUNTAS-BACKEND-COPILOT (o un doc “Respuestas Backend”) con un resumen de lo acordado, para no depender solo de memoria o correos.

### 6.4 Backup

1. **Dejar claro** en README o en docs que `apps/copilot-backup-20260208-134905` es solo copia de seguridad para restauración, no un segundo producto.
2. Opcional: en el futuro, si se deja de usar el backup, eliminarlo del árbol y guardar un tag o tarball en lugar del directorio completo (según ANALISIS_EXHAUSTIVO_GIT ya se había valorado `rm -rf apps/copilot-backup-*` en algún plan de limpieza).

---

## 7. Referencia rápida de archivos clave

| Tema | Archivos |
|------|----------|
| Preguntas al backend | docs/PREGUNTAS-BACKEND-COPILOT.md, docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md |
| Avance integración | docs/AVANCE-INTEGRACION-BACKEND.md |
| Plan Copilot monorepo | docs/PLAN-COPILOT-MONOREPO.md |
| Verificación servidores | INSTRUCCIONES_VERIFICACION.md |
| Reversión iframe/copilot | REVERSION_COMPLETADA.md |
| Memories backend | REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md |
| Tests funcionalidades copilot | apps/copilot/TEST_FUNCIONALIDADES.md |
| Código deprecado | services/*/index.ts + *_deprecated.ts, database/_deprecated, server/globalConfig/_deprecated.ts |

---

*Fin del análisis.*
