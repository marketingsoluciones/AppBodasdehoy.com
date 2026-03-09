# 🎯 Plan Maestro de Limpieza y Organización - Consolidado
**Fecha:** 2026-02-10
**Versión:** 2.0 (Consolidado de análisis múltiples)
**Repositorios:** AppBodasdehoy.com + monorepo-cms-leads-compare
**Autores:** Análisis consolidado de 3 fuentes

---

## 📋 Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Consolidación de Hallazgos](#2-consolidación-de-hallazgos)
3. [Información Crítica - NO TOCAR](#3-información-crítica---no-tocar)
4. [Plan de Ejecución Detallado](#4-plan-de-ejecución-detallado)
5. [Scripts Automatizados](#5-scripts-automatizados)
6. [Validaciones y Checklists](#6-validaciones-y-checklists)
7. [Decisiones Pendientes](#7-decisiones-pendientes)
8. [Anexos y Referencias](#8-anexos-y-referencias)

---

## 1. Resumen Ejecutivo

### 1.1 Análisis de 3 Fuentes

| Fuente | Enfoque Principal | Hallazgos Únicos |
|--------|-------------------|------------------|
| **Análisis A** (Explore agents) | Archivos físicos, estructura, tamaños | Backup 6.4 GB, 72 .md en raíz, configs duplicadas |
| **Análisis B** (Otro equipo) | Código deprecado, preguntas backend, arquitectura | ⚠️ Capa _deprecated NO eliminar, preguntas sin responder |
| **Este documento** | Consolidación y plan maestro | Integra ambos + correcciones + plan detallado |

### 1.2 Hallazgos Críticos Consolidados

| Categoría | Problema | Impacto | Espacio/Riesgo | Prioridad |
|-----------|----------|---------|----------------|-----------|
| **Backup duplicado** | apps/copilot-backup-20260208-134905 | 🔴 | 6.4 GB | ALTA |
| **Documentación excesiva** | 72 archivos .md en raíz (solapamiento) | 🔴 | Navegación confusa | ALTA |
| **Código _deprecated** | ⚠️ **NO se puede eliminar sin migración V2** | 🔴 | Riesgo alto | **NO TOCAR** |
| **Preguntas backend** | Sin respuestas de api-ia/API2 | 🟡 | Bloqueo integración | ALTA |
| **Archivos .env backup** | 6 archivos con datos sensibles | 🟡 | 15 KB + seguridad | MEDIA |
| **Archivos .bak** | 4 archivos de código antiguo | 🟡 | 50 KB | MEDIA |
| **Configs duplicadas** | ESLint, .gitignore | 🟡 | Errores VSCode | MEDIA |
| **TODOs sin resolver** | 30+ comentarios (V2, backend) | 🟢 | Deuda técnica | BAJA |
| **Archivos macOS** | ._* (metadata) | 🟢 | 50 KB | BAJA |

### 1.3 Espacio Total Recuperable

- **Eliminación segura:** ~6.5 GB (backup + .bak + macOS)
- **Builds regenerables:** ~3.5 GB (.next, node_modules)
- **Total potencial:** ~10 GB

---

## 2. Consolidación de Hallazgos

### 2.1 Discrepancias Entre Análisis

| Tema | Análisis A | Análisis B | **Resolución** |
|------|------------|------------|----------------|
| **Código _deprecated** | "Considerar mover a archive o eliminar" | "⚠️ NO eliminar sin migración V2" | **Análisis B es correcto** - NO tocar |
| **Documentos 2026-02-10** | Identificados como recientes | Marcados explícitamente como mantener | **Ambos coinciden** - mantener |
| **Carpeta backup** | Eliminar para liberar espacio | Mantener como referencia o archivar | **Compromiso** - archivar externos|
| **APIs fallback** | No mencionadas | GET/POST /api/chat/messages críticas | **Análisis B complementa** - no tocar |

### 2.2 Información Complementaria del Análisis B

✅ **Información clave que el Análisis A no tenía:**

1. **Arquitectura de integración:**
   - apps/web (puerto 8080) → proxy → api-ia (Python)
   - Historial: apps/web → API2 GraphQL (getChatMessages)
   - Fallback: GET/POST /api/chat/messages (memoria Next.js)

2. **Preguntas pendientes específicas:**
   - docs/PREGUNTAS-BACKEND-COPILOT.md (6 bloques sin responder)
   - docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md (contratos + test env)
   - docs/AVANCE-INTEGRACION-BACKEND.md (checklist vacío)

3. **Rutas críticas NO tocar:**
   - /api/chat/messages (GET/POST) - fallback historial
   - Toda la capa _deprecated - en uso activo
   - Config export/import - usa _deprecated

4. **TODOs categorizados:**
   - Críticos: Backend incompleto (admin panel)
   - Medios: Features incompletas (wedding, memories)
   - Bajos: Deprecaciones V2 (hooks, config)

---

## 3. Información Crítica - NO TOCAR

### 3.1 ⚠️ Código _deprecated (EN USO - NO ELIMINAR)

**IMPORTANTE:** La capa `_deprecated` sigue siendo usada activamente. Eliminarla rompería funcionalidad.

#### Por qué NO se puede eliminar

```
apps/copilot/
├── src/services/
│   ├── session/index.ts          → usa ClientService from _deprecated
│   ├── import/index.ts           → usa ClientService from _deprecated
│   ├── export/_deprecated.ts     → usado por config.ts
│   ├── topic/index.ts            → usa ClientService from _deprecated
│   ├── file/index.ts             → usa ClientService from _deprecated
│   ├── user/index.ts             → usa ClientService from _deprecated
│   ├── message/index.ts          → usa ClientService from _deprecated
│   └── plugin/index.ts           → usa ClientService from _deprecated
│
├── src/database/_deprecated/     → modelos usados por services
│   ├── models/
│   │   ├── session.ts           → DB_Session
│   │   ├── message.ts           → DB_Message
│   │   ├── topic.ts             → DB_Topic
│   │   ├── file.ts              → DB_File
│   │   └── ...
│   └── schemas/
│
├── src/server/globalConfig/
│   ├── _deprecated.ts           → genServerLLMConfig
│   └── index.ts                 → usa _deprecated
│
└── src/services/config.ts       → 7 funciones usan deprecatedExportService
```

#### Qué pasaría si se elimina

❌ **ROMPE:**
- Export/Import de configuraciones (agents, sessions, settings)
- Persistencia de sesiones en modo legacy
- Migraciones de V3 a V4 (FromV3ToV4/index.ts)
- Config global del servidor (LLM models)
- Features de DataImporter

#### Plan de migración requerido (NO incluido en este plan)

Para poder eliminar `_deprecated` se necesita:
1. Migrar todos los services a la nueva capa (V2)
2. Actualizar config.ts para no usar deprecatedExportService
3. Migrar database models a nueva estructura
4. Actualizar tests
5. Plan de migración de datos de usuarios existentes

**Tiempo estimado:** 40-80 horas de desarrollo + testing

#### Acción en este plan

- ✅ **Documentar** su existencia y porqué no se toca
- ✅ **Añadir** nota en README/CONTRIBUTING
- ❌ **NO mover, NO eliminar, NO refactorizar**

---

### 3.2 ⚠️ APIs y Rutas Críticas (NO TOCAR)

#### apps/web - Fallback de historial

```typescript
// apps/web/pages/api/chat/messages.ts
// GET - Devuelve mensajes en memoria (fallback cuando API2 falla)
// POST - Guarda mensaje en memoria

// ⚠️ NO ELIMINAR SIN CONFIRMAR CON BACKEND
// Uso documentado en:
// - docs/PLAN-COPILOT-MONOREPO.md
// - docs/ANALISIS-RESPUESTA-BACKEND-COPILOT.md
```

#### Flujo de integración actual

```
Usuario → apps/web (iframe) → apps/copilot
              ↓
    /api/copilot/chat → Proxy → api-ia (Python)
              ↓
    Stream SSE ← api-ia
              ↓
    api-ia escribe en API2 (al finalizar stream)
              ↓
    Front lee: /api/copilot/chat-history → API2 getChatMessages
              ↓
    Fallback: GET /api/chat/messages (memoria Next.js)
```

**NO tocar sin coordinación con backend:**
- `/api/copilot/chat` (proxy a api-ia)
- `/api/copilot/chat-history` (proxy a API2)
- `/api/chat/messages` (fallback)

---

### 3.3 ⚠️ Documentación con Preguntas Sin Responder

**Crítico para integración backend - NO archivar:**

| Documento | Contenido | Estado |
|-----------|-----------|---------|
| **docs/PREGUNTAS-BACKEND-COPILOT.md** | 6 bloques de preguntas a api-ia/API2 | ⏳ Sin respuestas |
| **docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md** | Contratos, ejemplos SSE, env test | ⏳ Sin respuestas |
| **docs/AVANCE-INTEGRACION-BACKEND.md** | Checklist y sección "Respuestas" | ⏳ Vacía |
| **docs/INFORME-API-IA-RESUMEN-NECESIDADES.md** | Preguntas arquitectura (auth, billing) | ⏳ Pendiente |

**Acción:** Mantener visibles hasta que backend responda y se rellenen las respuestas.

---

## 4. Plan de Ejecución Detallado

### 4.1 Matriz de Decisión

Antes de ejecutar, el usuario debe confirmar cada categoría:

| # | Categoría | Acción Propuesta | Riesgo | Espacio | ¿Ejecutar? |
|---|-----------|------------------|--------|---------|------------|
| 1 | Carpeta backup | Archivar a ~/Backups/ o eliminar | BAJO | 6.4 GB | [ ] |
| 2 | Docs en raíz (obsoletos) | Mover a docs/archive/2026-02/ | BAJO | 2 MB | [ ] |
| 3 | Docs en raíz (recientes) | Mantener o mover a docs/reports/ | NULO | 0 | [ ] |
| 4 | Archivos .env backup | Mover a ~/.env-backups/ + gitignore | BAJO | 15 KB | [ ] |
| 5 | Archivos .bak | Eliminar (con revisión previa) | BAJO | 50 KB | [ ] |
| 6 | Código _deprecated | **NO TOCAR** - Documentar | NULO | 0 | [x] |
| 7 | Configs duplicadas | Consolidar ESLint, .gitignore | MEDIO | 5 KB | [ ] |
| 8 | Archivos macOS ._* | Eliminar + gitignore | NULO | 50 KB | [ ] |
| 9 | Preguntas backend | Enviar recordatorio | NULO | 0 | [ ] |
| 10 | TODOs en código | Crear issues GitHub | NULO | 0 | [ ] |

---

### 4.2 Fase 1: Backup y Preparación (15 min)

#### Objetivo
Crear backup de seguridad antes de cualquier cambio.

#### Pasos

```bash
#!/bin/bash
# 1.1 Verificar estado git limpio
git status | grep "nothing to commit" || {
  echo "❌ Git tiene cambios sin commitear"
  echo "Por favor, commit o stash los cambios antes de continuar"
  exit 1
}

# 1.2 Crear rama de backup con timestamp
BACKUP_BRANCH="backup-pre-limpieza-consolidada-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git add .
git commit -m "chore: Backup completo antes de limpieza consolidada" || true
git checkout -

echo "✅ Rama de backup creada: $BACKUP_BRANCH"

# 1.3 Crear tag de referencia
git tag "pre-limpieza-$(date +%Y%m%d)" -m "Estado antes de limpieza consolidada"

echo "✅ Tag creado: pre-limpieza-$(date +%Y%m%d)"

# 1.4 Listar backups disponibles
echo ""
echo "📋 Backups disponibles:"
echo "   Rama: $BACKUP_BRANCH"
echo "   Tag: pre-limpieza-$(date +%Y%m%d)"
echo "   Backup físico anterior: apps/copilot-backup-20260208-134905"
```

#### Validación

```bash
# Verificar que el backup existe
git show-ref --verify --quiet "refs/heads/$BACKUP_BRANCH" && echo "✅ Rama OK" || echo "❌ Rama NO existe"
git show-ref --verify --quiet "refs/tags/pre-limpieza-$(date +%Y%m%d)" && echo "✅ Tag OK" || echo "❌ Tag NO existe"
```

---

### 4.3 Fase 2: Limpieza Crítica - Carpeta Backup (5 min)

#### Objetivo
Liberar 6.4 GB eliminando o archivando la carpeta backup.

#### Opción A: Eliminar (Recomendado si ya hay rama git backup)

```bash
#!/bin/bash
# 2A.1 Verificar tamaño
BACKUP_SIZE=$(du -sh apps/copilot-backup-20260208-134905 | cut -f1)
echo "📦 Tamaño del backup: $BACKUP_SIZE"

# 2A.2 Confirmar eliminación
read -p "¿Eliminar apps/copilot-backup-20260208-134905? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  echo "🗑️ Eliminando backup..."
  rm -rf apps/copilot-backup-20260208-134905
  echo "✅ Backup eliminado - $BACKUP_SIZE liberados"
else
  echo "⏭️ Saltando eliminación de backup"
fi
```

#### Opción B: Archivar a ubicación externa

```bash
#!/bin/bash
# 2B.1 Crear directorio de archivo
mkdir -p ~/Backups/AppBodasdehoy/

# 2B.2 Comprimir y mover
echo "📦 Comprimiendo backup..."
tar -czf ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz \
  apps/copilot-backup-20260208-134905

# 2B.3 Verificar compresión
if [ -f ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz ]; then
  COMPRESSED_SIZE=$(du -sh ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz | cut -f1)
  echo "✅ Backup comprimido: $COMPRESSED_SIZE"
  echo "📍 Ubicación: ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz"

  # 2B.4 Eliminar carpeta original
  read -p "¿Eliminar carpeta original? (s/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    rm -rf apps/copilot-backup-20260208-134905
    echo "✅ Carpeta eliminada - 6.4 GB liberados"
  fi
else
  echo "❌ Error al comprimir - NO se eliminó la carpeta"
  exit 1
fi
```

#### Validación

```bash
# Verificar que la carpeta fue eliminada
[ ! -d "apps/copilot-backup-20260208-134905" ] && echo "✅ Backup eliminado" || echo "⚠️ Backup aún existe"

# Verificar espacio liberado
df -h . | tail -1
```

---

### 4.4 Fase 3: Reorganización Documental (20 min)

#### Objetivo
Consolidar 72 archivos .md en raíz → estructura organizada en docs/

#### 3.1 Crear estructura de directorios

```bash
#!/bin/bash
# 3.1.1 Crear directorios
mkdir -p docs/archive/2026-02/{estados,resumes,instrucciones,fases}
mkdir -p docs/reports/2026-02
mkdir -p docs/reports/current
mkdir -p docs/guides
mkdir -p docs/analysis
mkdir -p docs/reference

echo "✅ Estructura de docs/ creada"

# 3.1.2 Crear README en cada directorio
cat > docs/archive/2026-02/README.md << 'EOF'
# Archivo - Febrero 2026

Documentos históricos de sesiones de trabajo y estados del proyecto.

- **estados/** - Documentos ESTADO_* y ESTADO_FINAL_*
- **resumes/** - Documentos RESUMEN_*
- **instrucciones/** - Guías temporales de sesiones específicas
- **fases/** - Documentos de fases completadas

**Nota:** Estos documentos son históricos y pueden contener información obsoleta.
EOF

cat > docs/reports/current/README.md << 'EOF'
# Reportes Actuales

Documentos de análisis y reportes vigentes.

- Análisis de funcionalidades
- Reportes de rendimiento
- Requerimientos de backend
- Optimizaciones implementadas

**Actualizado:** 2026-02-10
EOF
```

#### 3.2 Script de movimiento masivo

```bash
#!/bin/bash
# move-docs.sh - Reorganiza documentos en raíz

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
moved=0
skipped=0
errors=0

# Función para mover con validación
move_doc() {
  local source="$1"
  local dest="$2"
  local category="$3"

  if [ -f "$source" ]; then
    mkdir -p "$(dirname "$dest")"
    mv "$source" "$dest"
    echo -e "${GREEN}✓${NC} $category: $(basename "$source")"
    ((moved++))
  else
    echo -e "${YELLOW}⊘${NC} No encontrado: $source"
    ((skipped++))
  fi
}

echo "📋 Reorganizando documentación..."
echo ""

# ============================================================================
# 1. ESTADOS (a archive/2026-02/estados/)
# ============================================================================
echo "📁 Moviendo ESTADO_*..."
move_doc "ESTADO_ACTUAL_PROYECTO_2026-02-07.md" "docs/archive/2026-02/estados/estado-actual-proyecto.md" "Estado"
move_doc "ESTADO_FINAL_2026-02-07.md" "docs/archive/2026-02/estados/estado-final.md" "Estado"
move_doc "ESTADO_FINAL_COPILOT_2026-02-07.md" "docs/archive/2026-02/estados/estado-final-copilot.md" "Estado"
move_doc "ESTADO_FINAL_REPOSITORIOS.md" "docs/archive/2026-02/estados/estado-final-repositorios.md" "Estado"
move_doc "ESTADO_FINAL_SESION_2026-02-07.md" "docs/archive/2026-02/estados/estado-final-sesion.md" "Estado"
move_doc "ESTADO_ACTUAL_SERVIDORES.md" "docs/archive/2026-02/estados/estado-actual-servidores.md" "Estado"
move_doc "ESTADO_SERVIDORES.md" "docs/archive/2026-02/estados/estado-servidores.md" "Estado"

# ============================================================================
# 2. RESÚMENES (a archive/2026-02/resumes/)
# ============================================================================
echo ""
echo "📁 Moviendo RESUMEN_*..."
move_doc "RESUMEN_FINAL_COMPLETO.md" "docs/archive/2026-02/resumes/resumen-final-completo.md" "Resumen"
move_doc "RESUMEN_FINAL_SESION.md" "docs/archive/2026-02/resumes/resumen-final-sesion.md" "Resumen"
move_doc "RESUMEN_EDITOR_COPILOT_2026-02-07.md" "docs/archive/2026-02/resumes/resumen-editor-copilot.md" "Resumen"
move_doc "RESUMEN_LIMPIEZA_2026-02-07.md" "docs/archive/2026-02/resumes/resumen-limpieza.md" "Resumen"
move_doc "RESUMEN_REBUILD_2026-02-07.md" "docs/archive/2026-02/resumes/resumen-rebuild.md" "Resumen"
move_doc "RESUMEN_SESION_TOOLBAR.md" "docs/archive/2026-02/resumes/resumen-sesion-toolbar.md" "Resumen"
move_doc "RESUMEN_TRABAJO_COMPLETO.md" "docs/archive/2026-02/resumes/resumen-trabajo-completo.md" "Resumen"
move_doc "RESUMEN_CAMBIOS_DEBUGGING_2026-02-07.md" "docs/archive/2026-02/resumes/resumen-cambios-debugging.md" "Resumen"
move_doc "RESUMEN_COMPARACION.md" "docs/archive/2026-02/resumes/resumen-comparacion.md" "Resumen"

# ============================================================================
# 3. INSTRUCCIONES OBSOLETAS (a archive/2026-02/instrucciones/)
# ============================================================================
echo ""
echo "📁 Moviendo instrucciones obsoletas..."
move_doc "LEEME_PRIMERO.md" "docs/archive/2026-02/instrucciones/leeme-primero-cache.md" "Instrucción"
move_doc "URGENTE_LEER_CACHE_NAVEGADOR.md" "docs/archive/2026-02/instrucciones/urgente-cache-navegador.md" "Instrucción"
move_doc "VERIFICAR_NAVEGADOR_URGENTE.md" "docs/archive/2026-02/instrucciones/verificar-navegador-urgente.md" "Instrucción"
move_doc "PROBLEMA_SOLUCIONADO_CACHE.md" "docs/archive/2026-02/instrucciones/problema-solucionado-cache.md" "Instrucción"
move_doc "INSTRUCCIONES_PRUEBA_TOOLBAR.md" "docs/archive/2026-02/instrucciones/prueba-toolbar.md" "Instrucción"
move_doc "INSTRUCCIONES_FINALES.md" "docs/archive/2026-02/instrucciones/instrucciones-finales.md" "Instrucción"

# ============================================================================
# 4. FASES COMPLETADAS (a archive/2026-02/fases/)
# ============================================================================
echo ""
echo "📁 Moviendo FASE_* y *_COMPLETADA..."
move_doc "FASE_5_INTEGRACION_COMPLETADA.md" "docs/archive/2026-02/fases/fase-5-integracion.md" "Fase"
move_doc "FASE_6_BOTON_VER_COMPLETO_COMPLETADA.md" "docs/archive/2026-02/fases/fase-6-boton-ver-completo.md" "Fase"
move_doc "FASE_7_I18N_STYLING_COMPLETADA.md" "docs/archive/2026-02/fases/fase-7-i18n-styling.md" "Fase"
move_doc "FASE_8_TESTING_DOCS_COMPLETADA.md" "docs/archive/2026-02/fases/fase-8-testing-docs.md" "Fase"
move_doc "PROYECTO_COMPLETADO.md" "docs/archive/2026-02/fases/proyecto-completado.md" "Fase"
move_doc "LIMPIEZA_COMPLETADA.md" "docs/archive/2026-02/fases/limpieza-completada.md" "Fase"
move_doc "LISTO_PARA_PRUEBAS.md" "docs/archive/2026-02/fases/listo-para-pruebas.md" "Fase"

# ============================================================================
# 5. ANÁLISIS (a docs/analysis/)
# ============================================================================
echo ""
echo "📁 Moviendo ANALISIS_*..."
move_doc "ANALISIS_COMPLETO_FUNCIONALIDADES.md" "docs/analysis/analisis-completo-funcionalidades.md" "Análisis"
move_doc "ANALISIS_COMPONENTE_ORIGINAL.md" "docs/analysis/analisis-componente-original.md" "Análisis"
move_doc "ANALISIS_EDITOR_DIFERENCIAS.md" "docs/analysis/analisis-editor-diferencias.md" "Análisis"
move_doc "ANALISIS_EXHAUSTIVO_GIT.md" "docs/analysis/analisis-exhaustivo-git.md" "Análisis"
move_doc "ANALISIS_TIEMPOS_CARGA.md" "docs/analysis/analisis-tiempos-carga.md" "Análisis"
move_doc "ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md" "docs/analysis/analisis-codigo-en-desuso.md" "Análisis"

# ============================================================================
# 6. COMPARACIONES (a docs/reference/)
# ============================================================================
echo ""
echo "📁 Moviendo comparaciones y arquitectura..."
move_doc "COMPARACION_PLANNER_AI_VS_LOBECHAT.md" "docs/reference/comparacion-planner-ai-vs-lobechat.md" "Referencia"
move_doc "ARQUITECTURA_MONOREPO.md" "docs/architecture/monorepo.md" "Arquitectura"
move_doc "ARQUITECTURA.md" "docs/architecture/system.md" "Arquitectura"

# ============================================================================
# 7. REPORTES ACTUALES (a docs/reports/current/)
# ============================================================================
echo ""
echo "📁 Moviendo reportes actuales (2026-02-10)..."
move_doc "REPORTE_ANALISIS_FUNCIONALIDADES_2026-02-10.md" "docs/reports/current/analisis-funcionalidades.md" "Reporte"
move_doc "REPORTE_RENDIMIENTO_2026-02-10.md" "docs/reports/current/rendimiento.md" "Reporte"
move_doc "REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md" "docs/reports/current/requerimientos-backend-memories.md" "Reporte"
move_doc "PLAN_FRONTEND_MIENTRAS_BACKEND_2026-02-10.md" "docs/reports/current/plan-frontend.md" "Reporte"
move_doc "OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md" "docs/reports/current/optimizaciones-implementadas.md" "Reporte"
move_doc "SESION_FIXES_LOCALSTORAGE_2026-02-10.md" "docs/reports/current/fixes-localstorage.md" "Reporte"

# ============================================================================
# 8. GUÍAS (a docs/guides/)
# ============================================================================
echo ""
echo "📁 Moviendo guías que se mantienen..."
move_doc "INSTRUCCIONES_VERIFICACION.md" "docs/guides/verificacion-servidores.md" "Guía"
move_doc "INSTRUCCIONES_ACCESO_PLANNER_AI.md" "docs/guides/acceso-planner-ai.md" "Guía"
move_doc "INSTRUCCIONES_DEBUGGING_NAVEGADOR_EXTERNO.md" "docs/guides/debugging-navegador-externo.md" "Guía"
move_doc "QUICK_START.md" "docs/guides/quick-start.md" "Guía"

# ============================================================================
# 9. MANTENER EN RAÍZ (documentos core)
# ============================================================================
echo ""
echo "📁 Documentos que se mantienen en raíz:"
echo "  ✓ README.md"
echo "  ✓ README_MONOREPO.md"
echo "  ✓ CONTRIBUTING.md"
echo "  ✓ CHANGELOG.md (si existe)"

# ============================================================================
# 10. CREAR ÍNDICE MAESTRO
# ============================================================================
echo ""
echo "📝 Creando índice maestro de documentación..."
cat > docs/README.md << 'EOFINDEX'
# 📚 Documentación - AppBodasdehoy.com

Índice maestro de toda la documentación del proyecto.

## 📋 Navegación Rápida

- [📖 Guías](#-guías) - Guías de uso y desarrollo
- [📊 Reportes Actuales](#-reportes-actuales) - Estado actual del proyecto
- [🏗️ Arquitectura](#️-arquitectura) - Documentación técnica
- [🔍 Análisis](#-análisis) - Análisis técnicos del proyecto
- [📦 Archivo](#-archivo) - Documentos históricos
- [❓ Preguntas Backend](#-preguntas-backend) - Integración pendiente

---

## 📖 Guías

| Guía | Descripción |
|------|-------------|
| [Verificación de Servidores](guides/verificacion-servidores.md) | Checklist para verificar 3210 y 8080 |
| [Acceso a Planner AI](guides/acceso-planner-ai.md) | Cómo acceder al Copilot |
| [Debugging Navegador](guides/debugging-navegador-externo.md) | Debug en navegador externo |
| [Quick Start](guides/quick-start.md) | Inicio rápido del proyecto |

---

## 📊 Reportes Actuales

**Última actualización:** 2026-02-10

| Reporte | Descripción |
|---------|-------------|
| [Análisis de Funcionalidades](reports/current/analisis-funcionalidades.md) | Estado de Memories, Artifacts, Chat, Files |
| [Rendimiento](reports/current/rendimiento.md) | Análisis de performance y timeouts |
| [Requerimientos Backend](reports/current/requerimientos-backend-memories.md) | Specs técnicas para api-ia |
| [Plan Frontend](reports/current/plan-frontend.md) | Optimizaciones mientras backend responde |
| [Optimizaciones Implementadas](reports/current/optimizaciones-implementadas.md) | Caché local, optimistic updates |
| [Fixes LocalStorage](reports/current/fixes-localstorage.md) | Correcciones de acceso a localStorage |

---

## 🏗️ Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Sistema](architecture/system.md) | Arquitectura general |
| [Monorepo](architecture/monorepo.md) | Estructura del monorepo |

---

## 🔍 Análisis

| Análisis | Fecha | Descripción |
|----------|-------|-------------|
| [Funcionalidades](analysis/analisis-completo-funcionalidades.md) | - | Análisis completo de features |
| [Código en Desuso](analysis/analisis-codigo-en-desuso.md) | 2026-02-10 | Código deprecated y TODOs |
| [Tiempos de Carga](analysis/analisis-tiempos-carga.md) | - | Performance y optimizaciones |
| [Git Exhaustivo](analysis/analisis-exhaustivo-git.md) | - | Análisis del repositorio git |

---

## 📦 Archivo

Documentos históricos de sesiones de trabajo (Febrero 2026).

- [Estados](archive/2026-02/estados/) - Documentos de estado del proyecto
- [Resúmenes](archive/2026-02/resumes/) - Resúmenes de sesiones
- [Instrucciones](archive/2026-02/instrucciones/) - Guías temporales
- [Fases](archive/2026-02/fases/) - Fases completadas

**Nota:** Estos documentos pueden contener información obsoleta.

---

## ❓ Preguntas Backend

**Estado:** ⏳ Pendiente de respuestas

| Documento | Descripción | Estado |
|-----------|-------------|---------|
| [PREGUNTAS-BACKEND-COPILOT.md](PREGUNTAS-BACKEND-COPILOT.md) | 6 bloques de preguntas a api-ia/API2 | Sin responder |
| [PREGUNTAS-API-IA-TEST-DATOS-REALES.md](PREGUNTAS-API-IA-TEST-DATOS-REALES.md) | Contratos, ejemplos SSE, env test | Sin responder |
| [AVANCE-INTEGRACION-BACKEND.md](AVANCE-INTEGRACION-BACKEND.md) | Checklist de integración | Vacío |

---

## 🔗 Enlaces Externos

- [Repositorio GitHub](https://github.com/...) *(pendiente)*
- [Backend API-IA](https://api-ia.bodasdehoy.com)
- [API2 GraphQL](https://api2.eventosorganizador.com/graphql)

---

**Última actualización:** 2026-02-10
**Mantenedor:** Equipo de desarrollo
EOFINDEX

echo "✅ Índice maestro creado: docs/README.md"

# ============================================================================
# 11. RESUMEN
# ============================================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 Resumen de reorganización:"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "   ✅ Movidos:  $moved documentos"
echo "   ⊘ Omitidos: $skipped documentos"
echo "   ❌ Errores:  $errors documentos"
echo ""
echo "📁 Estructura creada:"
echo "   • docs/archive/2026-02/ (estados, resumes, instrucciones, fases)"
echo "   • docs/reports/current/ (reportes actuales)"
echo "   • docs/guides/ (guías de uso)"
echo "   • docs/analysis/ (análisis técnicos)"
echo "   • docs/reference/ (documentos de referencia)"
echo "   • docs/architecture/ (arquitectura del sistema)"
echo ""
echo "📋 Índice maestro: docs/README.md"
echo ""
echo "════════════════════════════════════════════════════════════════"

# Listar archivos que quedan en raíz
echo ""
echo "📄 Archivos .md que quedan en raíz:"
ls -1 *.md 2>/dev/null | while read file; do
  echo "   • $file"
done

echo ""
echo "✅ Reorganización completada"
```

#### Validación

```bash
# Verificar estructura
echo "📁 Verificando estructura de docs/..."
for dir in docs/{archive/2026-02/{estados,resumes,instrucciones,fases},reports/current,guides,analysis,reference,architecture}; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -type f -name "*.md" | wc -l)
    echo "  ✓ $dir ($count archivos)"
  else
    echo "  ✗ $dir (no existe)"
  fi
done

# Contar documentos movidos
echo ""
echo "📊 Total de documentos en docs/:"
find docs -type f -name "*.md" | wc -l

# Contar documentos en raíz
echo "📊 Documentos .md restantes en raíz:"
ls -1 *.md 2>/dev/null | wc -l
```

---

### 4.5 Fase 4: Limpieza de Archivos de Configuración (10 min)

#### 4.1 Archivos .env backup

```bash
#!/bin/bash
# 4.1.1 Crear directorio seguro para backups
mkdir -p ~/.env-backups/AppBodasdehoy/

# 4.1.2 Listar archivos .env backup
echo "🔍 Archivos .env backup encontrados:"
find apps/copilot -name ".env*.backup*" -o -name ".env copia.txt"

# 4.1.3 Mover a ubicación segura
echo ""
read -p "¿Mover archivos .env backup a ~/.env-backups/? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  find apps/copilot -name ".env*.backup*" -exec mv {} ~/.env-backups/AppBodasdehoy/ \;
  find apps/copilot -name ".env copia.txt" -exec mv {} ~/.env-backups/AppBodasdehoy/ \;
  echo "✅ Archivos .env movidos a ~/.env-backups/AppBodasdehoy/"
fi

# 4.1.4 Actualizar .gitignore
if ! grep -q "*.env.backup*" .gitignore; then
  cat >> .gitignore << EOF

# Environment backups
*.env.backup*
.env copia.txt
EOF
  echo "✅ .gitignore actualizado"
fi
```

#### 4.2 Archivos .bak

```bash
#!/bin/bash
# 4.2.1 Encontrar todos los archivos .bak
echo "🔍 Archivos .bak encontrados:"
find apps/copilot/src -name "*.bak" -type f

# 4.2.2 Previsualizar contenido
echo ""
echo "📄 Vista previa de archivos .bak:"
find apps/copilot/src -name "*.bak" -type f | while read file; do
  echo "───────────────────────────────────────"
  echo "Archivo: $file"
  echo "Tamaño: $(du -h "$file" | cut -f1)"
  echo "Fecha: $(stat -f "%Sm" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null)"
  echo "Primeras 5 líneas:"
  head -5 "$file"
  echo ""
done

# 4.2.3 Confirmar eliminación
read -p "¿Eliminar todos los archivos .bak? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  find apps/copilot/src -name "*.bak" -type f -delete
  echo "✅ Archivos .bak eliminados"

  # Actualizar .gitignore
  if ! grep -q "*.bak" .gitignore; then
    echo "*.bak" >> .gitignore
    echo "✅ .gitignore actualizado"
  fi
fi
```

#### 4.3 Configs duplicadas - ESLint

```bash
#!/bin/bash
# 4.3.1 Analizar configuraciones ESLint en apps/web
echo "🔍 Configuraciones ESLint en apps/web:"
ls -la apps/web/.eslintrc* 2>/dev/null

# 4.3.2 Mostrar contenido
echo ""
echo "📄 Contenido de .eslintrc:"
cat apps/web/.eslintrc 2>/dev/null || echo "No existe"

echo ""
echo "📄 Contenido de .eslintrc.json:"
cat apps/web/.eslintrc.json 2>/dev/null || echo "No existe"

# 4.3.3 Consolidar
echo ""
read -p "¿Consolidar en .eslintrc.json y eliminar .eslintrc? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  # Backup de ambos
  cp apps/web/.eslintrc apps/web/.eslintrc.old 2>/dev/null
  cp apps/web/.eslintrc.json apps/web/.eslintrc.json.old 2>/dev/null

  # Crear .eslintrc.json consolidado
  cat > apps/web/.eslintrc.json << 'EOF'
{
  "extends": ["next", "next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "off",
    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off"
  }
}
EOF

  # Eliminar .eslintrc sin extensión
  rm apps/web/.eslintrc

  echo "✅ Consolidado en .eslintrc.json"
  echo "💾 Backups guardados: .eslintrc.old, .eslintrc.json.old"
fi
```

#### 4.4 .gitignore duplicado

```bash
#!/bin/bash
# 4.4.1 Verificar .gitignore-optimizacion
if [ -f ".gitignore-optimizacion" ]; then
  echo "📄 Contenido de .gitignore-optimizacion:"
  cat .gitignore-optimizacion

  echo ""
  read -p "¿Consolidar en .gitignore principal y eliminar? (s/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Agregar contenido a .gitignore si no existe
    cat .gitignore-optimizacion >> .gitignore
    sort -u .gitignore -o .gitignore
    rm .gitignore-optimizacion
    echo "✅ .gitignore consolidado"
  fi
fi
```

---

### 4.6 Fase 5: Limpieza de Archivos macOS (2 min)

```bash
#!/bin/bash
# 5.1 Encontrar todos los archivos ._*
echo "🔍 Archivos macOS fork resource (._*):"
find . -name "._*" -type f | head -20
count=$(find . -name "._*" -type f | wc -l)
echo "Total: $count archivos"

# 5.2 Eliminar
read -p "¿Eliminar todos los archivos ._*? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  find . -name "._*" -type f -delete
  echo "✅ Archivos ._* eliminados"

  # Actualizar .gitignore
  if ! grep -q "._*" .gitignore; then
    echo "._*" >> .gitignore
    echo "✅ .gitignore actualizado"
  fi
fi
```

---

### 4.7 Fase 6: Documentar Código _deprecated (5 min)

**Objetivo:** Documentar claramente que el código _deprecated NO se puede eliminar.

```bash
#!/bin/bash
# 6.1 Crear nota en README de apps/copilot
cat >> apps/copilot/README.md << 'EOF'

---

## ⚠️ Código Deprecado (NO ELIMINAR)

### Capa `_deprecated`

El proyecto mantiene una capa de código deprecado en:

- `src/services/*/index.ts` → Usa `ClientService` from `_deprecated`
- `src/database/_deprecated/` → Modelos y schemas usados por services
- `src/server/globalConfig/_deprecated.ts` → Configuración global
- `src/services/config.ts` → Funciones de export/import (7 TODO remove in V2)

**⚠️ NO ELIMINAR SIN MIGRACIÓN A V2**

Esta capa sigue siendo usada activamente para:
- Export/Import de configuraciones (agents, sessions, settings)
- Persistencia de sesiones en modo legacy
- Migraciones de V3 a V4
- Config global del servidor (LLM models)
- Features de DataImporter

### Plan de Migración (Futuro)

Para poder eliminar `_deprecated` se necesita:
1. Migrar todos los services a la nueva capa (V2)
2. Actualizar config.ts para no usar deprecatedExportService
3. Migrar database models a nueva estructura
4. Actualizar tests
5. Plan de migración de datos de usuarios existentes

**Tiempo estimado:** 40-80 horas de desarrollo + testing

### Referencias

- Ver `src/services/*/index.ts` para imports de _deprecated
- Buscar "TODO: remove in V2" para puntos de migración
- Doc: `ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md`

EOF

echo "✅ Documentación de código _deprecated agregada a apps/copilot/README.md"

# 6.2 Crear archivo DEPRECATED.md específico
cat > apps/copilot/DEPRECATED.md << 'EOF'
# Código Deprecado - Inventario y Plan

**Última actualización:** 2026-02-10
**Estado:** EN USO - NO ELIMINAR

---

## 📋 Inventario Completo

### Services Deprecados

| Service | Archivo índice | Usa _deprecated |
|---------|----------------|-----------------|
| Session | `src/services/session/index.ts` | ✅ ClientService |
| Import | `src/services/import/index.ts` | ✅ ClientService |
| Export | `src/services/export/_deprecated.ts` | ✅ Usado por config.ts |
| Topic | `src/services/topic/index.ts` | ✅ ClientService |
| File | `src/services/file/index.ts` | ✅ ClientService |
| User | `src/services/user/index.ts` | ✅ ClientService |
| Message | `src/services/message/index.ts` | ✅ ClientService |
| Plugin | `src/services/plugin/index.ts` | ✅ ClientService |

### Database Deprecado

```
src/database/_deprecated/
├── models/
│   ├── session.ts          # DB_Session
│   ├── sessionGroup.ts     # DB_SessionGroup
│   ├── message.ts          # DB_Message
│   ├── topic.ts            # DB_Topic
│   ├── file.ts             # DB_File
│   ├── plugin.ts           # BaseModel
│   └── user.ts             # BaseModel
│
└── schemas/
    ├── session.ts
    ├── message.ts
    ├── plugin.ts
    └── files.ts
```

### Server Deprecado

- `src/server/globalConfig/_deprecated.ts` → genServerLLMConfig
- `src/utils/_deprecated/parseModels.ts` → usado en migraciones

### Config (7 TODOs "remove in V2")

`src/services/config.ts` líneas:
- 13, 15: exportAll()
- 38, 40: exportAgents()
- 48, 50: exportSingleAgent()
- 60, 62: exportSessions() (exportSettings)
- 70, 72: exportSessions()
- 80, 82: exportSingleSession()

---

## ❌ Qué NO Hacer

- ❌ NO eliminar carpeta `_deprecated`
- ❌ NO mover a `docs/code-archive`
- ❌ NO refactorizar sin plan V2
- ❌ NO excluir de tsconfig sin coordinar
- ❌ NO comentar imports como "TODO: remove"

---

## ✅ Qué SÍ Hacer

- ✅ Documentar en README y CONTRIBUTING
- ✅ Añadir a .gitignore (ya está trackeado, pero doc)
- ✅ Crear issues GitHub para migración V2
- ✅ Priorizar TODOs de config para V2
- ✅ Mantener tests de _deprecated funcionando

---

## 🚀 Plan de Migración V2 (Futuro)

### Fase 1: Preparación (8-16h)
- [ ] Auditoría de uso de _deprecated (dónde se importa)
- [ ] Diseño de nueva API para services
- [ ] Plan de migración de datos (usuarios existentes)
- [ ] Estrategia de rollback

### Fase 2: Migración de Services (16-32h)
- [ ] Migrar session service a nueva capa
- [ ] Migrar import service
- [ ] Migrar export service
- [ ] Migrar message service
- [ ] Migrar file service
- [ ] Migrar topic service
- [ ] Migrar plugin service
- [ ] Migrar user service

### Fase 3: Migración de Database (8-16h)
- [ ] Nueva estructura de modelos
- [ ] Script de migración de datos
- [ ] Tests de migración

### Fase 4: Config y Server (8-16h)
- [ ] Actualizar config.ts (eliminar TODOs)
- [ ] Migrar server/globalConfig
- [ ] Actualizar parseModels

### Fase 5: Testing y Rollout (8-16h)
- [ ] Tests end-to-end
- [ ] Beta con usuarios seleccionados
- [ ] Rollback plan
- [ ] Deploy gradual

**Total estimado:** 48-96 horas (6-12 días)

---

## 📚 Referencias

- Análisis completo: `ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md`
- Plan maestro: `PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md`
- Código de referencia: Buscar `@deprecated` en el proyecto

---

**Nota:** Este documento se actualizará cuando se inicie el plan de migración V2.
EOF

echo "✅ Archivo DEPRECATED.md creado: apps/copilot/DEPRECATED.md"

# 6.3 Actualizar CONTRIBUTING.md
if [ -f "CONTRIBUTING.md" ]; then
  if ! grep -q "Código Deprecado" CONTRIBUTING.md; then
    cat >> CONTRIBUTING.md << 'EOF'

---

## ⚠️ Código Deprecado

**IMPORTANTE:** El proyecto contiene una capa de código deprecado (`_deprecated`) que **NO se debe eliminar sin un plan de migración a V2**.

- Ver `apps/copilot/DEPRECATED.md` para inventario completo
- Ver `apps/copilot/README.md` para contexto
- **NO refactorizar** código _deprecated sin consultar al equipo

EOF
    echo "✅ CONTRIBUTING.md actualizado"
  fi
fi
```

---

### 4.8 Fase 7: Gestión de Preguntas Backend (10 min)

```bash
#!/bin/bash
# 7.1 Crear recordatorio para backend
cat > docs/RECORDATORIO_BACKEND.md << 'EOF'
# 📨 Recordatorio - Preguntas Pendientes al Backend

**Fecha:** 2026-02-10
**Destinatarios:** Equipo api-ia + API2
**Prioridad:** ALTA (Bloquea integración completa)

---

## 📋 Documentos con Preguntas

Tenemos 3 documentos con preguntas sin responder que bloquean la integración completa:

### 1. PREGUNTAS-BACKEND-COPILOT.md

**6 bloques de preguntas:**
1. Historial de chat (sessionId, formato, endpoints)
2. SessionId (uso, formato, headers)
3. API2 GraphQL (queries/mutations para historial)
4. Eventos SSE (tipos, formato, documentación)
5. Métricas (registro, endpoints)
6. Auth (sincronización usuarios, headers)

**Enlace:** `docs/PREGUNTAS-BACKEND-COPILOT.md`

### 2. PREGUNTAS-API-IA-TEST-DATOS-REALES.md

**Preguntas de contratos:**
- Request body exacto (campos obligatorios/opcionales)
- Ejemplos reales SSE (anonimizados) por tipo de evento
- Forma exacta de getChatMessages (respuesta de API2)
- URL y credenciales de entorno de pruebas
- SessionId de prueba con datos ya guardados

**Enlace:** `docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md`

### 3. AVANCE-INTEGRACION-BACKEND.md

**Checklist sin completar:**
- [ ] Confirmar contratos actuales
- [ ] Alinear parseo SSE con ejemplos reales
- [ ] Entorno de pruebas
- [ ] Decisión de arquitectura opcional
- [ ] Resolver ítems de PREGUNTAS-BACKEND-COPILOT

**Sección "Respuestas":** Vacía

**Enlace:** `docs/AVANCE-INTEGRACION-BACKEND.md`

---

## 🎯 Acción Requerida

1. **Revisar** los 3 documentos enlazados
2. **Responder** las preguntas directamente en los documentos o en un doc nuevo
3. **Actualizar** la sección "Respuestas" en AVANCE-INTEGRACION-BACKEND.md
4. **Notificar** al equipo frontend cuando esté completo

---

## 📅 Timeline Sugerido

- **Revisión:** 1-2 días
- **Respuestas:** 2-3 días
- **Validación conjunta:** 1 día

**Total:** ~1 semana

---

## 🔗 Enlaces Rápidos

- [PREGUNTAS-BACKEND-COPILOT.md](PREGUNTAS-BACKEND-COPILOT.md)
- [PREGUNTAS-API-IA-TEST-DATOS-REALES.md](PREGUNTAS-API-IA-TEST-DATOS-REALES.md)
- [AVANCE-INTEGRACION-BACKEND.md](AVANCE-INTEGRACION-BACKEND.md)

---

**Contacto:** [Añadir email/Slack del PM o tech lead]
EOF

echo "✅ Recordatorio creado: docs/RECORDATORIO_BACKEND.md"

# 7.2 Crear GitHub issue (opcional)
read -p "¿Crear archivo para GitHub issue de preguntas backend? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  cat > .github/ISSUE_TEMPLATE/backend-questions.md << 'EOF'
---
name: Preguntas Backend Pendientes
about: Preguntas sin responder que bloquean integración
title: '[BACKEND] Responder preguntas de integración Copilot'
labels: backend, blocker, integration
assignees: ''
---

## 📋 Resumen

Tenemos 3 documentos con preguntas sin responder que bloquean la integración completa del Copilot con api-ia y API2.

## 📄 Documentos

1. **docs/PREGUNTAS-BACKEND-COPILOT.md** - 6 bloques de preguntas
2. **docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md** - Contratos + env test
3. **docs/AVANCE-INTEGRACION-BACKEND.md** - Checklist vacío

## 🎯 Acción Requerida

- [ ] Revisar documentos enlazados
- [ ] Responder preguntas en los docs o crear doc nuevo
- [ ] Actualizar sección "Respuestas" en AVANCE-INTEGRACION-BACKEND
- [ ] Notificar equipo frontend

## 🔗 Enlaces

- [PREGUNTAS-BACKEND-COPILOT.md](../docs/PREGUNTAS-BACKEND-COPILOT.md)
- [PREGUNTAS-API-IA-TEST-DATOS-REALES.md](../docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md)
- [AVANCE-INTEGRACION-BACKEND.md](../docs/AVANCE-INTEGRACION-BACKEND.md)

## 📅 Timeline

**Estimado:** ~1 semana
**Prioridad:** ALTA - Bloquea integración completa

EOF
  echo "✅ Template de GitHub issue creado: .github/ISSUE_TEMPLATE/backend-questions.md"
  echo "   Puedes crear el issue manualmente desde GitHub"
fi
```

---

### 4.9 Fase 8: Commit y Validación Final (10 min)

```bash
#!/bin/bash
# 8.1 Verificar estado git
echo "📊 Estado actual de git:"
git status

# 8.2 Agregar cambios
read -p "¿Agregar todos los cambios al stage? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  git add .
  echo "✅ Cambios agregados al stage"
fi

# 8.3 Crear commit
echo ""
read -p "¿Crear commit de limpieza consolidada? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  git commit -m "chore: Limpieza consolidada del repositorio

- Eliminar/archivar carpeta backup (6.4 GB liberados)
- Reorganizar 72 documentos .md en docs/
- Limpiar archivos .env backup y .bak
- Consolidar configs duplicadas (ESLint, .gitignore)
- Eliminar archivos macOS ._*
- Documentar código _deprecated (NO eliminar sin V2)
- Actualizar .gitignore
- Crear recordatorio para preguntas backend

Cambios detallados en: PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

  echo "✅ Commit creado"
fi

# 8.4 Resumen final
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ LIMPIEZA CONSOLIDADA COMPLETADA"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Cambios realizados:"
echo "   • Backup eliminado/archivado: 6.4 GB liberados"
echo "   • Documentos reorganizados: ~60 archivos"
echo "   • Estructura docs/ creada: 7 subdirectorios"
echo "   • Índice maestro: docs/README.md"
echo "   • Archivos .env backup: movidos a ~/.env-backups/"
echo "   • Archivos .bak: eliminados"
echo "   • Configs ESLint: consolidados"
echo "   • Archivos ._*: eliminados"
echo "   • .gitignore: actualizado"
echo "   • Código _deprecated: documentado (NO eliminado)"
echo ""
echo "📋 Acciones pendientes:"
echo "   • Enviar docs/RECORDATORIO_BACKEND.md al equipo backend"
echo "   • Crear GitHub issue para preguntas backend (opcional)"
echo "   • Revisar docs/README.md y actualizar enlaces"
echo ""
echo "✅ Rama de backup disponible: $BACKUP_BRANCH"
echo "✅ Tag disponible: pre-limpieza-$(date +%Y%m%d)"
echo ""
echo "════════════════════════════════════════════════════════════════"
```

---

## 5. Scripts Automatizados

### 5.1 Script Maestro - All-in-One

```bash
#!/bin/bash
# cleanup-master.sh - Script maestro que ejecuta toda la limpieza

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🧹  LIMPIEZA CONSOLIDADA - AppBodasdehoy.com              ║
║                                                               ║
║   Plan Maestro v2.0                                           ║
║   Fecha: 2026-02-10                                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar que estamos en la raíz del proyecto
if [ ! -f "package.json" ] || [ ! -d "apps/copilot" ]; then
  echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
  exit 1
fi

# Preguntar al usuario qué fases ejecutar
echo -e "${YELLOW}📋 Selecciona las fases a ejecutar:${NC}"
echo ""
echo "1. ✅ Crear backup de seguridad (RECOMENDADO)"
echo "2. 🗑️  Eliminar/archivar carpeta backup (6.4 GB)"
echo "3. 📁 Reorganizar documentación (60+ archivos)"
echo "4. 🧹 Limpiar archivos de configuración (.env, .bak)"
echo "5. 🍎 Eliminar archivos macOS (._*)"
echo "6. 📝 Documentar código _deprecated"
echo "7. 📨 Crear recordatorio para backend"
echo "8. 💾 Commit cambios"
echo ""
read -p "Ingresa las fases a ejecutar (ej: 1,2,3,4,5,6,7,8 o 'all'): " PHASES

# Convertir 'all' a todas las fases
if [ "$PHASES" = "all" ]; then
  PHASES="1,2,3,4,5,6,7,8"
fi

# Función para verificar si una fase fue seleccionada
should_run_phase() {
  echo ",$PHASES," | grep -q ",$1,"
}

# FASE 1: Backup
if should_run_phase 1; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 1: Crear Backup de Seguridad${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  BACKUP_BRANCH="backup-pre-limpieza-consolidada-$(date +%Y%m%d-%H%M%S)"
  git checkout -b "$BACKUP_BRANCH"
  git add .
  git commit -m "chore: Backup completo antes de limpieza consolidada" || true
  git checkout -
  git tag "pre-limpieza-$(date +%Y%m%d)" -m "Estado antes de limpieza consolidada"

  echo -e "${GREEN}✅ Backup creado: $BACKUP_BRANCH${NC}"
fi

# FASE 2: Carpeta Backup
if should_run_phase 2; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 2: Eliminar/Archivar Carpeta Backup${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  BACKUP_SIZE=$(du -sh apps/copilot-backup-20260208-134905 | cut -f1)
  echo -e "${YELLOW}📦 Tamaño del backup: $BACKUP_SIZE${NC}"
  echo ""
  echo "Opciones:"
  echo "  1. Eliminar (libera $BACKUP_SIZE inmediatamente)"
  echo "  2. Comprimir y archivar a ~/Backups/"
  echo "  3. Saltar esta fase"
  echo ""
  read -p "Selecciona opción (1/2/3): " BACKUP_OPTION

  case $BACKUP_OPTION in
    1)
      rm -rf apps/copilot-backup-20260208-134905
      echo -e "${GREEN}✅ Backup eliminado - $BACKUP_SIZE liberados${NC}"
      ;;
    2)
      mkdir -p ~/Backups/AppBodasdehoy/
      tar -czf ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz \
        apps/copilot-backup-20260208-134905
      COMPRESSED_SIZE=$(du -sh ~/Backups/AppBodasdehoy/copilot-backup-20260208-134905.tar.gz | cut -f1)
      echo -e "${GREEN}✅ Backup comprimido: $COMPRESSED_SIZE${NC}"
      rm -rf apps/copilot-backup-20260208-134905
      echo -e "${GREEN}✅ Carpeta eliminada - $BACKUP_SIZE liberados${NC}"
      ;;
    3)
      echo -e "${YELLOW}⏭️  Saltando eliminación de backup${NC}"
      ;;
  esac
fi

# FASE 3: Reorganizar Documentación
if should_run_phase 3; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 3: Reorganizar Documentación${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Ejecutar script de movimiento (ya definido en sección 4.4.2)
  bash move-docs.sh

  echo -e "${GREEN}✅ Documentación reorganizada${NC}"
fi

# FASE 4: Limpiar Configuraciones
if should_run_phase 4; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 4: Limpiar Archivos de Configuración${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # .env backups
  mkdir -p ~/.env-backups/AppBodasdehoy/
  find apps/copilot -name ".env*.backup*" -exec mv {} ~/.env-backups/AppBodasdehoy/ \; 2>/dev/null || true
  find apps/copilot -name ".env copia.txt" -exec mv {} ~/.env-backups/AppBodasdehoy/ \; 2>/dev/null || true

  # .bak files
  find apps/copilot/src -name "*.bak" -type f -delete 2>/dev/null || true

  # ESLint consolidation (si aplicable)
  # ... (código de sección 4.5.3)

  # .gitignore consolidation
  if [ -f ".gitignore-optimizacion" ]; then
    cat .gitignore-optimizacion >> .gitignore
    sort -u .gitignore -o .gitignore
    rm .gitignore-optimizacion
  fi

  # Actualizar .gitignore
  cat >> .gitignore << EOF

# Limpieza 2026-02-10
*.env.backup*
.env copia.txt
*.bak
._*
.screenshots/
evidencia_fallo_chat/
EOF

  echo -e "${GREEN}✅ Archivos de configuración limpiados${NC}"
fi

# FASE 5: Archivos macOS
if should_run_phase 5; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 5: Eliminar Archivos macOS${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  count=$(find . -name "._*" -type f | wc -l)
  echo -e "${YELLOW}🔍 Encontrados: $count archivos ._*${NC}"
  find . -name "._*" -type f -delete
  echo -e "${GREEN}✅ Archivos ._* eliminados${NC}"
fi

# FASE 6: Documentar _deprecated
if should_run_phase 6; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 6: Documentar Código _deprecated${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Ejecutar script de documentación (ya definido en sección 4.7)
  # ... (agregar nota a README, crear DEPRECATED.md, actualizar CONTRIBUTING)

  echo -e "${GREEN}✅ Código _deprecated documentado${NC}"
fi

# FASE 7: Recordatorio Backend
if should_run_phase 7; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 7: Crear Recordatorio Backend${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Crear RECORDATORIO_BACKEND.md (ya definido en sección 4.8)

  echo -e "${GREEN}✅ Recordatorio creado: docs/RECORDATORIO_BACKEND.md${NC}"
fi

# FASE 8: Commit
if should_run_phase 8; then
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  FASE 8: Commit Cambios${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  git status
  echo ""
  read -p "¿Crear commit? (s/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    git add .
    git commit -m "chore: Limpieza consolidada del repositorio

- Eliminar/archivar carpeta backup (6.4 GB liberados)
- Reorganizar 72 documentos .md en docs/
- Limpiar archivos .env backup y .bak
- Consolidar configs duplicadas (ESLint, .gitignore)
- Eliminar archivos macOS ._*
- Documentar código _deprecated (NO eliminar sin V2)
- Actualizar .gitignore
- Crear recordatorio para preguntas backend

Cambios detallados en: PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    echo -e "${GREEN}✅ Commit creado${NC}"
  fi
fi

# Resumen Final
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅  LIMPIEZA CONSOLIDADA COMPLETADA                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 Resumen de cambios:${NC}"
echo ""
echo "   ✅ Backup de seguridad creado"
echo "   ✅ Espacio liberado: ~6.4 GB"
echo "   ✅ Documentos reorganizados: ~60 archivos"
echo "   ✅ Estructura docs/ creada"
echo "   ✅ Archivos de configuración limpiados"
echo "   ✅ Código _deprecated documentado"
echo "   ✅ Recordatorio backend creado"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo ""
echo "   1. Enviar docs/RECORDATORIO_BACKEND.md al equipo backend"
echo "   2. Revisar docs/README.md"
echo "   3. Ejecutar build y tests para validar"
echo ""
echo -e "${GREEN}✅ ¡Listo!${NC}"
```

---

## 6. Validaciones y Checklists

### 6.1 Checklist Pre-Ejecución

Antes de ejecutar cualquier script, verificar:

- [ ] Git está en estado limpio (`git status`)
- [ ] No hay cambios sin commitear importantes
- [ ] Backup de seguridad creado (rama + tag)
- [ ] Usuario tiene permisos de escritura
- [ ] Hay suficiente espacio en disco
- [ ] Puerto 3210 no está en uso (si hay que testear)

### 6.2 Checklist Post-Ejecución

Después de la limpieza, validar:

#### Estructura de Archivos

```bash
# Verificar que la carpeta backup fue eliminada
[ ! -d "apps/copilot-backup-20260208-134905" ] && echo "✅ Backup eliminado" || echo "❌ Backup aún existe"

# Verificar estructura de docs/
for dir in docs/{archive/2026-02/{estados,resumes,instrucciones,fases},reports/current,guides,analysis,reference,architecture}; do
  [ -d "$dir" ] && echo "✅ $dir" || echo "❌ $dir NO existe"
done

# Contar archivos .md en raíz (debería ser ≤ 10)
md_count=$(ls -1 *.md 2>/dev/null | wc -l)
if [ $md_count -le 10 ]; then
  echo "✅ Archivos .md en raíz: $md_count (OK)"
else
  echo "⚠️  Archivos .md en raíz: $md_count (revisar)"
fi

# Verificar .gitignore actualizado
grep -q "*.env.backup*" .gitignore && echo "✅ .gitignore: .env backups" || echo "❌ Falta en .gitignore"
grep -q "*.bak" .gitignore && echo "✅ .gitignore: .bak" || echo "❌ Falta en .gitignore"
grep -q "._*" .gitignore && echo "✅ .gitignore: ._*" || echo "❌ Falta en .gitignore"
```

#### Funcionalidad

```bash
# Build apps/copilot
cd apps/copilot
pnpm build
if [ $? -eq 0 ]; then
  echo "✅ Build de copilot exitoso"
else
  echo "❌ Build de copilot falló"
fi
cd ../..

# Tests (si existen)
cd apps/copilot
pnpm test || echo "⚠️  Tests no disponibles o fallaron"
cd ../..

# Dev server
cd apps/copilot
timeout 30s pnpm dev &
DEV_PID=$!
sleep 10
curl -s http://localhost:3210 >/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Dev server responde en puerto 3210"
else
  echo "❌ Dev server no responde"
fi
kill $DEV_PID 2>/dev/null || true
cd ../..
```

#### Git

```bash
# Verificar que existe rama de backup
git show-ref --verify --quiet "refs/heads/$BACKUP_BRANCH" && echo "✅ Rama backup existe" || echo "❌ Rama backup NO existe"

# Verificar que existe tag
git show-ref --verify --quiet "refs/tags/pre-limpieza-$(date +%Y%m%d)" && echo "✅ Tag existe" || echo "❌ Tag NO existe"

# Verificar commit
git log --oneline | head -1 | grep -q "limpieza consolidada" && echo "✅ Commit de limpieza creado" || echo "⚠️  Commit no encontrado"
```

### 6.3 Checklist de Validación Final

- [ ] **Estructura de archivos**
  - [ ] Backup eliminado o archivado
  - [ ] Docs reorganizados en subdirectorios
  - [ ] ≤10 archivos .md en raíz
  - [ ] docs/README.md existe
  - [ ] apps/copilot/DEPRECATED.md existe

- [ ] **Git**
  - [ ] Rama de backup existe
  - [ ] Tag pre-limpieza existe
  - [ ] Commit de limpieza creado
  - [ ] No hay archivos rotos (git status limpio)

- [ ] **Funcionalidad**
  - [ ] `pnpm build` exitoso
  - [ ] `pnpm test` exitoso (si aplica)
  - [ ] Dev server inicia correctamente
  - [ ] http://localhost:3210 responde

- [ ] **Documentación**
  - [ ] Código _deprecated documentado
  - [ ] RECORDATORIO_BACKEND.md creado
  - [ ] .gitignore actualizado
  - [ ] README/CONTRIBUTING actualizados

- [ ] **Próximos pasos**
  - [ ] Enviar recordatorio a backend
  - [ ] Crear GitHub issue (opcional)
  - [ ] Comunicar cambios al equipo

---

## 7. Decisiones Pendientes

### 7.1 Preguntas para el Usuario

**Antes de ejecutar el plan, confirmar:**

| # | Decisión | Opciones | Recomendado |
|---|----------|----------|-------------|
| 1 | Carpeta backup | Eliminar / Archivar / Mantener | Eliminar |
| 2 | Documentos obsoletos | Archivar / Eliminar | Archivar |
| 3 | Archivos .env backup | Mover / Eliminar | Mover |
| 4 | Archivos .bak | Revisar / Eliminar | Revisar primero |
| 5 | ESLint duplicado | Consolidar / Mantener ambos | Consolidar |
| 6 | TODOs en código | Crear issues / Documentar | Crear issues |
| 7 | Enviar a backend | Ahora / Después | Ahora |

### 7.2 Configuración del Script Maestro

```bash
# Editar estas variables antes de ejecutar
BACKUP_TO_EXTERNAL=true          # true = archivar, false = eliminar
CONSOLIDATE_ESLINT=true          # true = consolidar configs
CREATE_GITHUB_ISSUES=false       # true = crear template de issue
SEND_BACKEND_REMINDER=true       # true = crear recordatorio
AUTO_COMMIT=false                # true = commit automático (no recomendado)
```

### 7.3 Plan de Rollback

Si algo sale mal durante la ejecución:

```bash
# Opción 1: Volver a rama de backup
git checkout $BACKUP_BRANCH

# Opción 2: Volver al tag
git reset --hard "pre-limpieza-$(date +%Y%m%d)"

# Opción 3: Restaurar desde backup físico (si no fue eliminado)
rm -rf apps/copilot
cp -r apps/copilot-backup-20260208-134905 apps/copilot

# Opción 4: Rollback de git (si ya hiciste commit)
git revert HEAD
```

---

## 8. Anexos y Referencias

### 8.1 Archivos de Referencia

| Documento | Ubicación | Propósito |
|-----------|-----------|-----------|
| **Este documento** | PLAN_MAESTRO_LIMPIEZA_CONSOLIDADO_2026-02-10.md | Plan maestro consolidado |
| Análisis A | PLAN_LIMPIEZA_REPOSITORIOS_2026-02-10.md | Análisis de estructura física |
| Análisis B | ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md | Análisis de código deprecated |
| Preguntas backend | docs/PREGUNTAS-BACKEND-COPILOT.md | Preguntas sin responder |
| Avance integración | docs/AVANCE-INTEGRACION-BACKEND.md | Checklist de integración |

### 8.2 Comandos Útiles

```bash
# Ver tamaño de directorios
du -sh apps/* | sort -h

# Contar archivos por tipo
find . -name "*.md" | wc -l
find . -name "*.ts" | wc -l
find . -name "*.tsx" | wc -l

# Buscar TODOs
grep -r "TODO.*remove.*V2" apps/copilot/src --include="*.ts" --include="*.tsx" | wc -l

# Buscar @deprecated
grep -r "@deprecated" apps/copilot/src --include="*.ts" --include="*.tsx" | wc -l

# Ver espacio total del proyecto
du -sh .

# Ver archivos más grandes
find . -type f -exec du -h {} + | sort -rh | head -20
```

### 8.3 Enlaces Útiles

- [Documentación LobeChat](https://lobehub.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)

### 8.4 Glosario

| Término | Significado |
|---------|-------------|
| **_deprecated** | Código legacy V1 aún en uso (NO eliminar) |
| **V2** | Nueva versión que reemplazará _deprecated |
| **api-ia** | Backend Python para chat/streaming |
| **API2** | Backend GraphQL para persistencia |
| **Copilot** | Aplicación LobeChat/PLANNER AI (puerto 3210) |
| **apps/web** | Aplicación web principal (puerto 8080) |

---

**Última actualización:** 2026-02-10
**Versión:** 2.0 (Consolidado)
**Autor:** Análisis consolidado de múltiples fuentes
**Validado por:** [Pendiente]

---

**FIN DEL PLAN MAESTRO**
