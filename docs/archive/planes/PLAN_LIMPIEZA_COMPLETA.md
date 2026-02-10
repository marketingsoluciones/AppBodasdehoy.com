# 🧹 Plan de Limpieza Completa - Restauración de Versiones Correctas

**Fecha**: 2026-02-09 21:15
**Objetivo**: Eliminar todo lo relacionado con copilot problemático y restaurar versiones correctas

---

## 🎯 DESCUBRIMIENTO CRÍTICO

### ✅ VERSIÓN CORRECTA DE apps/copilot ENCONTRADA

**Ubicación**: `apps/copilot-backup-20260208-134905/`
**Package Name**: `@bodasdehoy/copilot` v1.0.1
**Descripción**: "PLANNER AI - Sistema inteligente para gestión de bodas y celebraciones con inteligencia artificial"

### Características de la Versión Correcta:

**Integración con api-ia.bodasdehoy.com**:
```typescript
// Encontrado en múltiples archivos del backup:
const DEFAULT_BACKEND_URL = 'https://api-ia.bodasdehoy.com';
```

**Features Personalizadas**:
- ✅ **EventosAutoAuth**: Autenticación personalizada para eventos
- ✅ **CopilotBridgeListener**: Integración con apps/web
- ✅ **FirebaseAuth**: Autenticación Firebase
- ✅ **Artifacts**: Creación de páginas web y contenido
- ✅ **FileManager**: Gestión de archivos
- ✅ **MCP**: Model Context Protocol
- ✅ **DevPanel**: Panel de desarrollo
- ✅ **GuestWelcomeMessage**: Mensaje de bienvenida personalizado
- ✅ **Memories**: Sistema de memoria (Dots Memories module)
- ✅ **Portal**: Portal personalizado

**Puerto Correcto**: 3210

---

## ❌ VERSIÓN INCORRECTA ACTUAL

**Package Name**: `@eventosorganizador/planner-ai` v1.0.0
**Rama**: `main` (rama upstream de LobeChat original)
**Problema**: Es LobeChat vanilla sin personalizaciones de bodasdehoy

**NO tiene**:
- ❌ Integración con api-ia.bodasdehoy.com
- ❌ EventosAutoAuth
- ❌ CopilotBridgeListener
- ❌ Personalizaciones de bodasdehoy

---

## 📋 PLAN DE EJECUCIÓN

### FASE 1: Backup y Preparación ✅

```bash
# 1.1 Crear backup de estado actual
git branch backup-pre-limpieza-completa-$(date +%Y%m%d-%H%M)
git add -A
git commit -m "backup: Estado antes de limpieza completa"

# 1.2 Verificar estado
git status
```

### FASE 2: Eliminar 50+ Archivos Problemáticos de apps/web

#### 2.1 Componentes Duplicados (15 archivos)
```bash
cd apps/web/components/Copilot
rm -f CopilotChat.tsx
rm -f CopilotChatNative.tsx
rm -f CopilotHeader.tsx
rm -f CopilotInputEditor.tsx
rm -f CopilotInputEditorAdvanced.tsx
rm -f CopilotInputEditorIframe.tsx
rm -f CopilotPreview.tsx
rm -f CopilotResizer.tsx
rm -f CopilotSplitLayout.tsx
rm -f EnrichedEventRenderer.tsx
rm -f EventCard.tsx
rm -f SimpleMarkdown.tsx
rm -f index.ts
rm -f EDITOR_STATUS.md
rm -rf __tests__
cd ../../..
```

#### 2.2 Paquete Duplicado
```bash
rm -rf packages/copilot-ui
```

#### 2.3 Tests Experimentales
```bash
rm -rf apps/web/pages/api/copilot/__tests__
rm -f apps/web/utils/__tests__/copilotMetrics.test.ts
```

#### 2.4 Páginas Experimentales
```bash
cd apps/web/pages
rm -f test-simple.tsx
rm -f test-editor.tsx
rm -f test-lobehub-editor.tsx
rm -f copilot.tsx
cd ../../..
```

#### 2.5 Scripts de Testing (50+ archivos .mjs)
```bash
rm -f abrir-copilot-sidebar.mjs
rm -f abrir-y-mostrar-copilot.mjs
rm -f captura-actual.mjs
rm -f capture-browser-errors.mjs
rm -f capture-console-errors.mjs
rm -f capture-copilot-now.mjs
rm -f check-console-errors.mjs
rm -f check-editor-simple.mjs
rm -f check-editor.mjs
rm -f check-loaded-files.mjs
rm -f check-service-workers.mjs
rm -f clean-navigate.mjs
rm -f click-event-and-verify.mjs
rm -f close-modal-and-open-copilot.mjs
rm -f complete-event-creation.mjs
rm -f complete-event-with-timezone.mjs
rm -f create-event-and-open-copilot.mjs
rm -f create-event-properly.mjs
rm -f debug-copilot-sidebar.mjs
rm -f debug-frontend.mjs
rm -f debug-user-data.mjs
rm -f debug-user-state.mjs
rm -f final-copilot-verification.mjs
rm -f find-copilot-panel.mjs
rm -f find-timezone-input.mjs
rm -f force-clear-cache-cdp.mjs
rm -f force-hard-refresh.mjs
rm -f force-refresh-browser.mjs
rm -f get-console-errors.mjs
rm -f inspect-button-code.mjs
rm -f inspect-copilot-dom.mjs
rm -f inspect-copilot-editor.mjs
rm -f inspect-copilot.mjs
rm -f inspect-current-copilot.mjs
rm -f inspect-editor-actual.mjs
rm -f inspect-servicio-actual.mjs
rm -f navigate-and-inspect.mjs
rm -f navigate-directly-to-evento.mjs
rm -f navigate-to-localhost.mjs
rm -f open-copilot-and-verify.mjs
rm -f quick-inspect.mjs
rm -f quick-screenshot.mjs
rm -f save-and-open-copilot.mjs
rm -f screenshot-copilot-editor.mjs
rm -f simple-reload.mjs
rm -f take-current-screenshot.mjs
rm -f take-screenshot.mjs
rm -f test-automatizado-final.mjs
rm -f test-button-simple.mjs
rm -f test-capture-logs.mjs
rm -f test-copilot-con-login.mjs
rm -f test-copilot-editor.mjs
rm -f test-copilot-full-flow.mjs
rm -f test-copilot-link.mjs
rm -f test-copilot-page-direct.mjs
rm -f test-copilot-standalone.mjs
rm -f test-crear-evento-completo.mjs
rm -f test-crear-evento-y-copilot.mjs
rm -f test-editor-check.mjs
rm -f test-editor-in-event.mjs
rm -f test-editor-plugins.mjs
rm -f test-editor-simple.mjs
rm -f test-editor-with-errors.mjs
rm -f test-final.mjs
rm -f test-login-automated.mjs
rm -f test-login-clean.mjs
rm -f test-login-debug.mjs
rm -f test-login-incognito.mjs
rm -f test-navigation-copilot.mjs
rm -f test-page-editor.mjs
rm -f test-ver-completo.mjs
rm -f test-visual-copilot.mjs
rm -f test-with-popup-enabled.mjs
rm -f use-keyboard-shortcut-copilot.mjs
rm -f ver-copilot-completo.mjs
```

#### 2.6 Capturas de Pantalla (50+ archivos .png)
```bash
rm -f *.png
```

#### 2.7 Archivos JSON de Debug
```bash
rm -f console-logs.json
rm -f debug-report.json
rm -f debug-body.html
rm -f copilot-inspection-result.txt
```

#### 2.8 Documentación Problemática (30+ archivos .md)
```bash
rm -f ACCESO_LOBECHAT_REAL.md
rm -f ANALISIS_VERSIONES_COPILOT.md
rm -f COMO_USAR_COPILOT.md
rm -f DIAGNOSTICO_ARQUITECTURA_COPILOT.md
rm -f DIAGNOSTICO_REDIRECT_LOGIN_*.md
rm -f ESTADO_FINAL_INTEGRACION.md
rm -f GUIA_ACCESO_COPILOT.md
rm -f GUIA_PRUEBAS_MANUALES.md
rm -f GUIA_VERIFICACION_VISUAL.md
rm -f INTEGRACION_API_IA.md
rm -f MEJORAS_COMPLETADAS.md
rm -f OPCIONES_MIGRACION_CHATINPUT.md
rm -f REINICIAR_COPILOT.md
rm -f RESULTADOS_TESTS_CHAT.md
rm -f RESUMEN_EJECUTIVO_COPILOT.md
rm -f RESUMEN_INTEGRACION_MONOREPO.md
rm -f SESION_*_*.md
rm -f SOLUCION_EDITOR_COPILOT.md
rm -f SOLUCION_FINAL_COPILOT.md
rm -f ANALISIS_PROBLEMA_EDITOR.md
rm -f CAPTURA-COPILOT-ACTUAL.png
```

#### 2.9 Scripts de Shell
```bash
rm -f test-chat-api.sh
rm -f verificar-proyecto.sh
```

### FASE 3: Eliminar apps/copilot Actual (Versión Incorrecta)

```bash
# 3.1 Detener servidor si está corriendo
lsof -ti:3210 | xargs kill -9 2>/dev/null

# 3.2 Eliminar directorio completo
rm -rf apps/copilot

# 3.3 Verificar eliminación
ls -la apps/ | grep copilot
# Debe mostrar solo: copilot-backup-20260208-134905
```

### FASE 4: Restaurar apps/copilot desde Backup (Versión Correcta)

```bash
# 4.1 Copiar backup como apps/copilot
cp -r apps/copilot-backup-20260208-134905 apps/copilot

# 4.2 Verificar package.json
cat apps/copilot/package.json | grep -A 5 "name\|version\|description"

# Debe mostrar:
# "name": "@bodasdehoy/copilot",
# "version": "1.0.1",
# "description": "PLANNER AI - Sistema inteligente..."

# 4.3 Verificar puerto
grep '"dev"' apps/copilot/package.json
# Debe mostrar: "dev": "next dev -H localhost -p 3210"
```

### FASE 5: Restaurar apps/web a Versión Limpia (f509f55)

```bash
# 5.1 Restaurar archivos clave
git checkout f509f55 -- apps/web/components/Copilot/CopilotIframe.tsx
git checkout f509f55 -- apps/web/components/Copilot/CopilotPrewarmer.tsx
git checkout f509f55 -- apps/web/components/Copilot/pageContextExtractor.ts
git checkout f509f55 -- apps/web/components/ChatSidebar/ChatSidebar.tsx

# 5.2 Verificar que solo quedan archivos esenciales
ls apps/web/components/Copilot/
# Debe mostrar SOLO:
# - CopilotIframe.tsx
# - CopilotPrewarmer.tsx
# - pageContextExtractor.ts
```

### FASE 6: Limpiar Dependencias

```bash
# 6.1 Limpiar builds
rm -rf apps/web/.next
rm -rf apps/copilot/.next
rm -rf apps/web/node_modules/.cache
rm -rf apps/copilot/node_modules/.cache

# 6.2 Limpiar node_modules de apps/copilot
rm -rf apps/copilot/node_modules

# 6.3 Reinstalar dependencias
pnpm install
```

### FASE 7: Verificar y Arrancar Servidores

```bash
# 7.1 Arrancar apps/copilot (puerto 3210)
cd apps/copilot
pnpm dev
# Esperar: ✓ Ready in X.Xs - Local: http://localhost:3210

# 7.2 En otra terminal, arrancar apps/web (puerto 8080)
cd apps/web
pnpm dev
# Esperar: ✓ Ready in X.Xs - Local: http://localhost:8080
```

### FASE 8: Verificación Manual

#### 8.1 Verificar apps/copilot (localhost:3210)
**Debe mostrar**:
- ✅ PLANNER AI (versión personalizada)
- ✅ Integración con api-ia.bodasdehoy.com
- ✅ EventosAutoAuth funcionando
- ✅ Artifacts disponibles
- ✅ FileManager operativo
- ✅ Memories system activo

**NO debe mostrar**:
- ❌ LobeChat vanilla
- ❌ Elementos genéricos sin personalizar

#### 8.2 Verificar apps/web (localhost:8080)
**Debe mostrar**:
- ✅ Botón Copilot en esquina superior derecha
- ✅ Sidebar con iframe a localhost:3210
- ✅ **UN SOLO menú de bodasdehoy**
- ✅ **UN SOLO menú de usuario**
- ✅ Chat funcionando

**NO debe mostrar**:
- ❌ Duplicación de menús
- ❌ Bucles infinitos
- ❌ Componentes rotos

### FASE 9: Commit Final

```bash
# 9.1 Ver cambios
git status
git diff --stat

# 9.2 Commit descriptivo
git add -A
git commit -m "cleanup: Limpieza completa - Eliminar integraciones problemáticas y restaurar versiones correctas

Problemas eliminados:
- 50+ archivos problemáticos de apps/web
- Componentes duplicados (15 archivos)
- Paquete copilot-ui completo
- Scripts de testing (.mjs)
- Capturas de pantalla (.png)
- Documentación problemática (.md)

Apps/copilot:
- Eliminada versión incorrecta (LobeChat vanilla)
- Restaurada versión correcta (@bodasdehoy/copilot v1.0.1)
- Con api-ia.bodasdehoy.com
- Con EventosAutoAuth, Artifacts, Memories

Apps/web:
- Restaurada a f509f55 (arquitectura simple)
- Solo 3 archivos en Copilot/
- Integración vía iframe

Resultado:
- Arquitectura limpia y simple
- Versiones correctas restauradas
- Sin duplicación de código
- Sin duplicación de interfaz

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📊 RESUMEN DE CAMBIOS

### Archivos Eliminados
| Categoría | Cantidad | Ubicación |
|-----------|----------|-----------|
| Componentes duplicados | 15 | apps/web/components/Copilot/ |
| Paquete copilot-ui | 1 dir | packages/copilot-ui/ |
| Tests | 5 | apps/web/**/__tests__/ |
| Páginas experimentales | 4 | apps/web/pages/ |
| Scripts .mjs | 50+ | raíz del proyecto |
| Capturas .png | 50+ | raíz del proyecto |
| Docs problemáticos | 30+ | raíz del proyecto |
| **TOTAL** | **150+** | **Múltiples ubicaciones** |

### Directorios Restaurados/Reemplazados
| Directorio | Acción | Versión |
|------------|--------|---------|
| apps/copilot | REEMPLAZADO | @bodasdehoy/copilot v1.0.1 |
| apps/web/components/Copilot/ | LIMPIADO | Solo 3 archivos |

---

## ✅ RESULTADO FINAL ESPERADO

### Arquitectura Correcta

```
┌─────────────────────────────────────────────┐
│ apps/web (puerto 8080)                      │
│ - SOLO 3 archivos en Copilot/              │
│ - CopilotIframe.tsx (simple)                │
│ - CopilotPrewarmer.tsx                      │
│ - pageContextExtractor.ts                   │
│                                             │
│ ChatSidebar → CopilotIframe → iframe       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ apps/copilot (puerto 3210)                  │
│ @bodasdehoy/copilot v1.0.1                  │
│ PLANNER AI - Versión personalizada          │
│                                             │
│ ✅ api-ia.bodasdehoy.com                    │
│ ✅ EventosAutoAuth                          │
│ ✅ CopilotBridgeListener                    │
│ ✅ FirebaseAuth                             │
│ ✅ Artifacts (creación páginas web)         │
│ ✅ FileManager                              │
│ ✅ Memories system                          │
│ ✅ MCP                                      │
│ ✅ DevPanel                                 │
└─────────────────────────────────────────────┘
```

### Métricas de Limpieza

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Archivos problemáticos | 150+ | 0 | **-100%** |
| Líneas código duplicado | ~4,000 | 0 | **-100%** |
| Componentes Copilot/ | 18 | 3 | **-83%** |
| Paquetes duplicados | 1 | 0 | **-100%** |
| Scripts testing | 50+ | 0 | **-100%** |
| Docs problemáticos | 30+ | 0 | **-100%** |

---

## 🎯 CHECKLIST DE VALIDACIÓN

### Pre-Limpieza
- [ ] Backup creado
- [ ] Estado actual commitado
- [ ] Plan revisado

### Post-Limpieza
- [ ] 150+ archivos eliminados
- [ ] apps/copilot reemplazado con versión correcta
- [ ] apps/web/components/Copilot/ tiene solo 3 archivos
- [ ] Dependencias reinstaladas

### Verificación Funcional
- [ ] apps/copilot (3210) muestra PLANNER AI personalizado
- [ ] apps/web (8080) muestra sidebar con iframe
- [ ] NO hay duplicación de menús
- [ ] Chat funciona correctamente
- [ ] EventosAutoAuth operativo
- [ ] Artifacts disponibles
- [ ] Memories funcionando

---

**Generado por**: Claude Sonnet 4.5
**Fecha**: 2026-02-09 21:15
**Estado**: Listo para ejecución
