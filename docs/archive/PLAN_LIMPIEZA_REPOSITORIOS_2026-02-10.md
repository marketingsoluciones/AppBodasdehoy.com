# 🧹 Plan de Limpieza de Repositorios - Análisis Completo
**Fecha:** 2026-02-10
**Repositorios analizados:**
1. `/Users/juancarlosparra/Projects/AppBodasdehoy.com`
2. `/Volumes/HD MAC BASE/Projects/monorepo-cms-leads-compare`

---

## 📊 Resumen Ejecutivo

### Problemas Críticos Encontrados

| Categoría | Cantidad | Espacio | Impacto |
|-----------|----------|---------|---------|
| **Carpeta backup completa** | 1 | 6.4 GB | 🔴 CRÍTICO |
| **Documentos .md en raíz** | 72 | ~2 MB | 🔴 CRÍTICO |
| **Archivos .env backup** | 6 | 15 KB | 🟡 MEDIO |
| **Archivos .bak** | 4 | 50 KB | 🟡 MEDIO |
| **Código deprecated** | 35 archivos | 212 KB | 🟡 MEDIO |
| **Configs duplicadas** | 8 | 100 KB | 🟡 MEDIO |
| **TODOs sin resolver** | 30+ | N/A | 🟢 BAJO |
| **Archivos macOS `._*`** | 5+ | 50 KB | 🟢 BAJO |

### Espacio Total Recuperable
- **Backup folder:** 6.4 GB
- **Builds (.next):** 3.5 GB (regenerable)
- **Screenshots:** 12 MB
- **Total estimado:** **~10 GB**

---

## 🔴 PRIORIDAD CRÍTICA

### 1. Carpeta Backup Duplicada (6.4 GB)

**Problema:**
```
/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot-backup-20260208-134905/
├── Tamaño: 6.4 GB
├── Contenido: Copia completa de copilot con node_modules
└── Estado git: Modificado (m) pero no trackeado
```

**Impacto:**
- ❌ Duplica código fuente completo
- ❌ Duplica node_modules (8.7 GB)
- ❌ Duplica configuraciones (.env, tsconfig, etc.)
- ❌ Causa errores en VSCode (índices duplicados)
- ❌ Ralentiza búsquedas y git status

**Solución propuesta:**
```bash
# Opción 1: Eliminar completamente (RECOMENDADO)
rm -rf apps/copilot-backup-20260208-134905

# Opción 2: Mover a ubicación externa
mv apps/copilot-backup-20260208-134905 ~/Backups/

# Opción 3: Comprimir y archivar
tar -czf ~/Backups/copilot-backup-20260208.tar.gz apps/copilot-backup-20260208-134905
rm -rf apps/copilot-backup-20260208-134905
```

**Nota:** Ya existe rama git de respaldo: `backup-pre-limpieza-completa-20260209-2113`

✅ **Confirmación requerida:** ¿Eliminar carpeta backup?
- [ ] Sí, eliminar (libera 6.4 GB)
- [ ] Mover a ~/Backups/
- [ ] Comprimir y archivar
- [ ] No tocar

---

### 2. Documentación Excesiva en Raíz (72 archivos .md)

**Problema:**
```
RAÍZ DEL PROYECTO/
├── ESTADO_FINAL_2026-02-07.md
├── ESTADO_ACTUAL_PROYECTO_2026-02-07.md
├── ESTADO_FINAL_COPILOT_2026-02-07.md
├── ESTADO_SERVIDORES.md
├── RESUMEN_FINAL_COMPLETO.md
├── RESUMEN_TRABAJO_COMPLETO.md
├── RESUMEN_EJECUTIVO_MONOREPO.md
├── ... (65 más)
```

**Análisis por categoría:**

#### ESTADO_* (7 documentos) - OBSOLETOS
```
ESTADO_ACTUAL_PROYECTO_2026-02-07.md
ESTADO_ACTUAL_SERVIDORES.md
ESTADO_FINAL_2026-02-07.md
ESTADO_FINAL_COPILOT_2026-02-07.md
ESTADO_FINAL_SESION_2026-02-07.md
ESTADO_FINAL_REPOSITORIOS.md
ESTADO_SERVIDORES.md
```
**Recomendación:** Consolidar en 1 documento `docs/archive/ESTADO_2026-02.md`

#### RESUMEN_* (10 documentos) - DUPLICADOS
```
RESUMEN_FINAL_COMPLETO.md
RESUMEN_FINAL_SESION.md
RESUMEN_TRABAJO_COMPLETO.md
RESUMEN_EJECUTIVO_MONOREPO.md
RESUMEN_CAMBIOS_DEBUGGING_2026-02-07.md
RESUMEN_EDITOR_COPILOT_2026-02-07.md
RESUMEN_SESION_TOOLBAR.md
RESUMEN_REBUILD_2026-02-07.md
RESUMEN_LIMPIEZA_2026-02-07.md
RESUMEN_COMPARACION.md
```
**Recomendación:** Consolidar en 1-2 documentos o mover a `docs/resumes/`

#### ANALISIS_* (6 documentos)
```
ANALISIS_COMPONENTE_ORIGINAL.md
ANALISIS_COMPLETO_FUNCIONALIDADES.md
ANALISIS_DOCUMENTACION_Y_CODIGO_EN_DESUSO_2026-02-10.md
ANALISIS_EDITOR_DIFERENCIAS.md
ANALISIS_EXHAUSTIVO_GIT.md
ANALISIS_TIEMPOS_CARGA.md
```
**Recomendación:** Mover a `docs/analysis/`

#### FASE_* (4 documentos) - COMPLETADOS
```
FASE_5_INTEGRACION_COMPLETADA.md
FASE_6_BOTON_VER_COMPLETO_COMPLETADA.md
FASE_7_I18N_STYLING_COMPLETADA.md
FASE_8_TESTING_DOCS_COMPLETADA.md
```
**Recomendación:** Mover a `docs/archive/fases/` o eliminar (info ya integrada)

#### INSTRUCCIONES_* (7 documentos)
```
INSTRUCCIONES_ACCESO_PLANNER_AI.md
INSTRUCCIONES_DEBUGGING_NAVEGADOR_EXTERNO.md
INSTRUCCIONES_FINALES.md
INSTRUCCIONES_PRUEBA_TOOLBAR.md
INSTRUCCIONES_VERIFICACION.md
LEEME_PRIMERO.md
QUICK_START.md
```
**Recomendación:** Consolidar en `QUICK_START.md` + mover resto a `docs/guides/`

#### Documentos "COMPLETADO" (5)
```
PROYECTO_COMPLETADO.md
LIMPIEZA_COMPLETADA.md
REVERSION_COMPLETADA.md
CONFIRMACION_FINAL_EXITO.md
LISTO_PARA_PRUEBAS.md
```
**Recomendación:** Eliminar (obsoletos, milestones alcanzados)

#### Reportes Recientes - MANTENER (6 documentos)
```
✅ OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md
✅ PLAN_FRONTEND_MIENTRAS_BACKEND_2026-02-10.md
✅ REPORTE_ANALISIS_FUNCIONALIDADES_2026-02-10.md
✅ REPORTE_RENDIMIENTO_2026-02-10.md
✅ REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md
✅ SESION_FIXES_LOCALSTORAGE_2026-02-10.md
```

#### Documentos Core - MANTENER (5)
```
✅ README.md
✅ CONTRIBUTING.md
✅ ARQUITECTURA.md
✅ ARQUITECTURA_MONOREPO.md
✅ CHANGELOG.md
```

**Propuesta de estructura nueva:**
```
/
├── README.md                                    # Principal
├── CONTRIBUTING.md                              # Para contributors
├── QUICK_START.md                              # Inicio rápido
├── CHANGELOG.md                                # Historial de cambios
├── docs/
│   ├── architecture/
│   │   ├── monorepo.md                         # De ARQUITECTURA_MONOREPO.md
│   │   └── system.md                           # De ARQUITECTURA.md
│   ├── reports/
│   │   ├── 2026-02/
│   │   │   ├── optimizaciones-implementadas.md
│   │   │   ├── plan-frontend.md
│   │   │   ├── analisis-funcionalidades.md
│   │   │   ├── rendimiento.md
│   │   │   └── requerimientos-backend.md
│   │   └── README.md                           # Índice de reportes
│   ├── guides/
│   │   ├── acceso-planner-ai.md
│   │   ├── debugging-navegador.md
│   │   └── verificacion.md
│   └── archive/
│       ├── 2026-02/
│       │   ├── estados.md                      # Consolidado ESTADO_*
│       │   ├── resumes.md                      # Consolidado RESUMEN_*
│       │   └── fases.md                        # Consolidado FASE_*
│       └── README.md                           # Índice de archivo
└── apps/copilot/
    └── TEST_FUNCIONALIDADES.md                # Mover a docs/guides/testing.md
```

✅ **Confirmación requerida:** ¿Reorganizar documentación?
- [ ] Sí, reorganizar según propuesta
- [ ] Solo mover archivos obsoletos a docs/archive/
- [ ] Solo eliminar archivos "COMPLETADO"
- [ ] No tocar

---

## 🟡 PRIORIDAD MEDIA

### 3. Archivos .env Backup (6 archivos)

**Ubicación:**
```
apps/copilot/.env.local.backup
apps/copilot/.env.local.backup.20251116_211232
apps/copilot/.env.local.backup.20251209_095137
apps/copilot/.env copia.txt
apps/copilot-backup-20260208-134905/.env.local.backup (duplicado)
apps/copilot-backup-20260208-134905/.env.local.backup.* (duplicados)
```

**Problema:**
- ⚠️ Contienen variables sensibles (API keys, tokens)
- ⚠️ No deberían estar en el repositorio
- ⚠️ Pueden causar confusión sobre qué .env usar

**Solución propuesta:**
```bash
# 1. Verificar .gitignore incluye .env backups
echo "*.env.backup*" >> .gitignore
echo ".env copia.txt" >> .gitignore

# 2. Mover a ubicación segura (OPCIONAL - solo si necesitas conservarlos)
mkdir -p ~/.env-backups/AppBodasdehoy
mv apps/copilot/.env*.backup* ~/.env-backups/AppBodasdehoy/
mv "apps/copilot/.env copia.txt" ~/.env-backups/AppBodasdehoy/

# 3. Eliminar del repositorio
git rm --cached apps/copilot/.env*.backup*
git rm --cached "apps/copilot/.env copia.txt"
```

✅ **Confirmación requerida:** ¿Eliminar backups de .env?
- [ ] Sí, mover a ~/.env-backups/ y eliminar del repo
- [ ] Solo eliminar del repo (no conservar)
- [ ] No tocar

---

### 4. Archivos .bak (4 archivos)

**Ubicación:**
```
apps/copilot/src/app/(backend)/api/auth/identify-user/route.ts.bak
apps/copilot/src/app/[variants]/(main)/admin/training/page.tsx.bak
apps/copilot/src/app/[variants]/(main)/admin/sessions/page.tsx.bak
apps/copilot/src/app/[variants]/(main)/admin/users/page.tsx.bak
```

**Problema:**
- ⚠️ Código antiguo/backup manual
- ⚠️ Confusión sobre qué archivo es el actual
- ⚠️ VSCode puede indexarlos causando errores

**Solución propuesta:**
```bash
# Eliminar archivos .bak
find apps/copilot/src -name "*.bak" -delete

# Agregar a .gitignore
echo "*.bak" >> .gitignore
```

✅ **Confirmación requerida:** ¿Eliminar archivos .bak?
- [ ] Sí, eliminar todos los .bak
- [ ] Revisar contenido antes de eliminar
- [ ] No tocar

---

### 5. Código Deprecated (35 archivos, 212 KB)

**Ubicación:**
```
apps/copilot/src/database/_deprecated/
├── core/
│   ├── db.ts
│   ├── model.ts
│   ├── schemas.ts
│   ├── migrations/
│   └── __tests__/
├── models/
│   ├── sessionGroup.ts
│   ├── topic.ts
│   ├── plugin.ts
│   ├── file.ts
│   ├── message.ts
│   ├── session.ts
│   └── __tests__/
└── schemas/
    ├── plugin.ts
    ├── message.ts
    └── files.ts
```

**Análisis:**
- ✅ Código antiguo de base de datos
- ✅ Ya marcado como `_deprecated`
- ⚠️ Aún incluido en build/índice de VSCode
- ⚠️ Importa dependencias que pueden estar obsoletas

**Opciones:**

**Opción 1: Mover a archive (RECOMENDADO)**
```bash
mkdir -p docs/code-archive/database-v1
mv apps/copilot/src/database/_deprecated docs/code-archive/database-v1/
```

**Opción 2: Eliminar completamente**
```bash
rm -rf apps/copilot/src/database/_deprecated
```

**Opción 3: Mantener pero excluir de build**
```json
// tsconfig.json
{
  "exclude": [
    "src/database/_deprecated/**/*"
  ]
}
```

✅ **Confirmación requerida:** ¿Qué hacer con código deprecated?
- [ ] Mover a docs/code-archive/
- [ ] Eliminar completamente
- [ ] Mantener pero excluir de build (tsconfig.json)
- [ ] No tocar

---

### 6. Configuraciones ESLint Duplicadas

**Problema en apps/web:**
```
apps/web/.eslintrc          (configuración antigua)
apps/web/.eslintrc.json     (configuración actual)
```

**Contenido .eslintrc:**
```json
{
  "extends": ["next", "next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "off",
    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off"
  }
}
```

**Contenido .eslintrc.json:**
```json
{
  "extends": "next/core-web-vitals"
}
```

**Conflicto:** .eslintrc.json es más restrictivo (sin rules personalizadas)

**Solución propuesta:**
```bash
# Opción 1: Usar .eslintrc.json con reglas de .eslintrc
# (Recomendado - formato JSON estándar)
mv apps/web/.eslintrc apps/web/.eslintrc.old
# Luego editar .eslintrc.json para incluir las reglas necesarias

# Opción 2: Usar solo .eslintrc
rm apps/web/.eslintrc.json
```

✅ **Confirmación requerida:** ¿Resolver conflicto ESLint?
- [ ] Consolidar en .eslintrc.json (añadir reglas necesarias)
- [ ] Usar solo .eslintrc (eliminar .json)
- [ ] Revisar manualmente antes de decidir
- [ ] No tocar

---

### 7. Archivo .gitignore Duplicado

**Problema:**
```
.gitignore                    # Principal (funcional)
.gitignore-optimizacion       # Secundario (no usado)
```

**Contenido .gitignore-optimizacion:**
```
# Archivos de optimización y reportes
REPORTE_OPTIMIZACION_*.md
*.optimizacion.md
```

**Solución propuesta:**
```bash
# Consolidar en .gitignore principal
cat .gitignore-optimizacion >> .gitignore
rm .gitignore-optimizacion
```

✅ **Confirmación requerida:** ¿Consolidar .gitignore?
- [ ] Sí, consolidar y eliminar duplicado
- [ ] No tocar

---

## 🟢 PRIORIDAD BAJA

### 8. Archivos macOS Fork Resources

**Problema:**
```
._apps
apps/leads-scrap/._crm-nextjs
apps/leads-scrap/crm-nextjs/._.next
... (5+ archivos)
```

**Descripción:** Archivos de metadatos de macOS (fork resources). Causan problemas en sistemas Linux/Unix.

**Solución:**
```bash
# Eliminar todos los archivos ._*
find . -name "._*" -type f -delete

# Agregar a .gitignore
echo "._*" >> .gitignore
```

✅ **Confirmación requerida:** ¿Eliminar archivos macOS?
- [ ] Sí, eliminar todos los ._*
- [ ] No tocar

---

### 9. TODOs sin Resolver (30+ comentarios)

**Categorías encontradas:**

#### 🔴 Críticos - Backend Incompleto
```typescript
// apps/copilot/src/app/[variants]/(main)/admin/sessions/page.tsx
// TODO: Implementar fetch real desde backend

// apps/copilot/src/app/[variants]/(main)/admin/users/page.tsx
// TODO: Implementar fetch real desde backend

// apps/copilot/src/app/[variants]/(main)/admin/billing/hooks/useBillingData.ts
// TODO: Implementar cuando backend tenga datos por día
```

#### 🟡 Medio - Features Incompletas
```typescript
// apps/copilot/src/app/[variants]/(main)/wedding-creator/page.tsx
// TODO: Implementar en GraphQL

// apps/copilot/src/app/[variants]/(main)/memories/[albumId]/page.tsx
// TODO: Implementar descarga ZIP en backend
// TODO: Agregar selector en el modal
```

#### 🟢 Bajo - Deprecaciones Pendientes
```typescript
// apps/copilot/src/app/(backend)/middleware/auth/index.ts
// TODO: V2 完整移除 client 模式下的 clerk 集成代码

// apps/copilot/src/app/[variants]/(main)/settings/hooks/useCategory.tsx
// TODO: Remove /llm when v2.0

// apps/copilot/src/features/DataImporter/index.tsx
// TODO: remove in V2
```

**Recomendación:**
- Crear issues en GitHub para TODOs críticos
- Marcar deprecaciones con fecha objetivo
- Eliminar TODOs resueltos

✅ **Confirmación requerida:** ¿Crear issues para TODOs?
- [ ] Sí, crear issues para TODOs críticos
- [ ] Solo documentar en ROADMAP.md
- [ ] No tocar

---

### 10. Directorios de Desarrollo

**Screenshots (12 MB):**
```
.screenshots/  (91 directorios)
```
**Uso:** Capturas de pantalla de debugging de Claude Code

**Evidencia (736 KB):**
```
evidencia_fallo_chat/
```
**Uso:** Archivos de debugging de errores pasados

**Solución propuesta:**
```bash
# Mover a ubicación externa
mkdir -p ~/DevArchive/AppBodasdehoy
mv .screenshots ~/DevArchive/AppBodasdehoy/
mv evidencia_fallo_chat ~/DevArchive/AppBodasdehoy/

# Agregar a .gitignore
echo ".screenshots/" >> .gitignore
echo "evidencia_fallo_chat/" >> .gitignore
```

✅ **Confirmación requerida:** ¿Archivar directorios de desarrollo?
- [ ] Sí, mover a ~/DevArchive/
- [ ] Solo agregar a .gitignore (no mover)
- [ ] Eliminar (no conservar)
- [ ] No tocar

---

## 📋 Plan de Ejecución Propuesto

### Fase 1: Limpieza Crítica (Libera 6.4 GB)
```bash
# 1. Eliminar carpeta backup
rm -rf apps/copilot-backup-20260208-134905

# 2. Consolidar ESLint
# (Manual - según elección del usuario)

# 3. Eliminar .env backups
git rm --cached apps/copilot/.env*.backup*
rm apps/copilot/.env*.backup*

# 4. Eliminar archivos .bak
find apps/copilot/src -name "*.bak" -delete
```

### Fase 2: Reorganización Documental (Mejora navegabilidad)
```bash
# 1. Crear estructura de docs
mkdir -p docs/{architecture,reports/2026-02,guides,archive/2026-02}

# 2. Mover documentos core
# (Script específico según confirmación)

# 3. Consolidar documentos obsoletos
# (Script específico según confirmación)
```

### Fase 3: Limpieza de Código (Mejora performance VSCode)
```bash
# 1. Manejar código deprecated
# (Según opción elegida)

# 2. Limpiar archivos macOS
find . -name "._*" -type f -delete

# 3. Actualizar .gitignore
cat >> .gitignore << EOF
*.bak
*.env.backup*
._*
.screenshots/
evidencia_fallo_chat/
EOF
```

### Fase 4: Validación
```bash
# 1. Rebuild para verificar que nada se rompió
cd apps/copilot && pnpm build

# 2. Ejecutar tests
pnpm test

# 3. Verificar git status
git status

# 4. Commit limpieza
git add .
git commit -m "chore: Limpieza de repositorio - eliminar backups y reorganizar docs"
```

---

## ⚠️ Análisis de Riesgos

### Riesgo BAJO - Eliminaciones Seguras
- ✅ Carpeta backup (ya existe rama git de respaldo)
- ✅ Archivos .env backup (datos sensibles de todos modos)
- ✅ Archivos .bak (versiones antiguas)
- ✅ Archivos macOS ._* (metadata)
- ✅ Screenshots (.screenshots/)

### Riesgo MEDIO - Requiere Revisión
- ⚠️ Código deprecated (verificar que no haya imports activos)
- ⚠️ Documentos .md (verificar links rotos después de mover)
- ⚠️ Configs ESLint (puede afectar linting)

### Riesgo NULO - Solo Organización
- ✅ Mover documentos a docs/
- ✅ Consolidar .gitignore
- ✅ Actualizar estructura de carpetas

---

## 🎯 Resultado Esperado

### Antes de Limpieza
```
Repositorio/
├── 72 archivos .md en raíz          ❌
├── apps/copilot-backup-*/  (6.4 GB) ❌
├── *.env.backup* (6 archivos)       ❌
├── *.bak (4 archivos)               ❌
├── _deprecated/ (35 archivos)       ❌
├── Configs duplicadas (8)           ❌
└── Archivos ._* (5+)                ❌

Navegabilidad: ⭐⭐ (2/5)
VSCode errors: 85+ errores TypeScript
Espacio usado: 16.2 GB
```

### Después de Limpieza
```
Repositorio/
├── README.md                        ✅
├── QUICK_START.md                   ✅
├── CONTRIBUTING.md                  ✅
├── docs/                            ✅
│   ├── architecture/                ✅
│   ├── reports/2026-02/             ✅
│   ├── guides/                      ✅
│   └── archive/                     ✅
├── apps/copilot/                    ✅
└── apps/web/                        ✅

Navegabilidad: ⭐⭐⭐⭐⭐ (5/5)
VSCode errors: <20 errores (solo externos)
Espacio usado: 6.8 GB (-9.4 GB)
```

---

## 🚀 Scripts de Limpieza Automatizada

### Script 1: Limpieza Crítica (Safe)
```bash
#!/bin/bash
# cleanup-critical.sh

echo "🧹 Iniciando limpieza crítica..."

# Backup de seguridad
git add .
git commit -m "chore: Backup antes de limpieza"
git branch backup-pre-limpieza-$(date +%Y%m%d-%H%M%S)

# 1. Eliminar carpeta backup
echo "📦 Eliminando carpeta backup (6.4 GB)..."
rm -rf apps/copilot-backup-20260208-134905

# 2. Eliminar archivos .bak
echo "🗑️ Eliminando archivos .bak..."
find apps/copilot/src -name "*.bak" -delete

# 3. Eliminar archivos macOS
echo "🍎 Eliminando archivos macOS fork..."
find . -name "._*" -type f -delete

# 4. Actualizar .gitignore
echo "📝 Actualizando .gitignore..."
cat >> .gitignore << EOF
*.bak
*.env.backup*
._*
.screenshots/
evidencia_fallo_chat/
EOF

echo "✅ Limpieza crítica completada!"
echo "Espacio liberado: ~6.5 GB"
```

### Script 2: Reorganización Documental
```bash
#!/bin/bash
# organize-docs.sh

echo "📚 Reorganizando documentación..."

# Crear estructura
mkdir -p docs/{architecture,reports/2026-02,guides,archive/2026-02}

# Mover documentos core
mv ARQUITECTURA.md docs/architecture/system.md
mv ARQUITECTURA_MONOREPO.md docs/architecture/monorepo.md

# Mover reportes recientes
mv OPTIMIZACIONES_IMPLEMENTADAS_2026-02-10.md docs/reports/2026-02/
mv PLAN_FRONTEND_MIENTRAS_BACKEND_2026-02-10.md docs/reports/2026-02/
mv REPORTE_ANALISIS_FUNCIONALIDADES_2026-02-10.md docs/reports/2026-02/
mv REPORTE_RENDIMIENTO_2026-02-10.md docs/reports/2026-02/
mv REQUERIMIENTOS_BACKEND_MEMORIES_2026-02-10.md docs/reports/2026-02/

# Mover guías
mv INSTRUCCIONES_*.md docs/guides/

# Archivar documentos obsoletos
mv ESTADO_*.md docs/archive/2026-02/
mv RESUMEN_*.md docs/archive/2026-02/
mv FASE_*.md docs/archive/2026-02/
mv *_COMPLETADA.md docs/archive/2026-02/

echo "✅ Documentación reorganizada!"
```

---

## 📝 Checklist de Validación Post-Limpieza

### Tests Funcionales
- [ ] `pnpm build` - Build exitoso
- [ ] `pnpm test` - Tests pasan
- [ ] `pnpm dev` - Servidor inicia correctamente
- [ ] Navegador: http://localhost:3210 - App funciona
- [ ] Memories feature - Funciona correctamente
- [ ] Chat feature - Funciona correctamente

### Validaciones Git
- [ ] `git status` - Sin archivos rotos
- [ ] `git branch` - Existe branch de backup
- [ ] Links en README.md - No hay links rotos
- [ ] Links en docs/ - No hay links rotos

### Performance
- [ ] VSCode - Menos errores TypeScript
- [ ] VSCode - Búsquedas más rápidas
- [ ] Git operations - Más rápidas
- [ ] Espacio en disco - Recuperado ~6-10 GB

---

## 🤝 Solicitud de Confirmación

Por favor, revisa cada sección marcada con ✅ **Confirmación requerida** y responde:

```
CONFIRMACIONES:

1. Carpeta backup (6.4 GB):
   [ ] Eliminar
   [ ] Mover a ~/Backups/
   [ ] Comprimir y archivar
   [ ] No tocar

2. Documentación (72 archivos):
   [ ] Reorganizar según propuesta
   [ ] Solo mover obsoletos a archive/
   [ ] Solo eliminar "COMPLETADO"
   [ ] No tocar

3. Archivos .env backup:
   [ ] Mover a ~/.env-backups/ y eliminar del repo
   [ ] Solo eliminar del repo
   [ ] No tocar

4. Archivos .bak:
   [ ] Eliminar todos
   [ ] Revisar antes de eliminar
   [ ] No tocar

5. Código deprecated:
   [ ] Mover a docs/code-archive/
   [ ] Eliminar completamente
   [ ] Excluir de build (tsconfig.json)
   [ ] No tocar

6. ESLint duplicado:
   [ ] Consolidar en .eslintrc.json
   [ ] Usar solo .eslintrc
   [ ] Revisar manualmente
   [ ] No tocar

7. .gitignore duplicado:
   [ ] Consolidar
   [ ] No tocar

8. Archivos macOS ._*:
   [ ] Eliminar
   [ ] No tocar

9. TODOs sin resolver:
   [ ] Crear issues GitHub
   [ ] Documentar en ROADMAP.md
   [ ] No tocar

10. Directorios desarrollo (.screenshots, evidencia_fallo_chat):
    [ ] Mover a ~/DevArchive/
    [ ] Solo agregar a .gitignore
    [ ] Eliminar
    [ ] No tocar
```

**¿Ejecutar scripts de limpieza automatizada?**
- [ ] Sí, ejecutar todo (cleanup-critical.sh + organize-docs.sh)
- [ ] Solo limpieza crítica (cleanup-critical.sh)
- [ ] Solo reorganizar docs (organize-docs.sh)
- [ ] Manual (sin scripts)

---

**Fecha de análisis:** 2026-02-10
**Analista:** Claude Code
**Repositorios:** AppBodasdehoy.com + monorepo-cms-leads-compare
