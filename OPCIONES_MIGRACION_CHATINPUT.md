# Opciones de Migración ChatInput a Shared

## Análisis Completo

**Total archivos**: 78
**Dependencias externas críticas**: zustand, @lobehub/editor, @lobehub/ui, antd, react-i18next
**Dependencias internas bloqueantes**: 11 stores de copilot, 15 componentes externos, 12 hooks específicos

---

## OPCIÓN A: Sistema de Plugins Completo ⭐ (Recomendada a largo plazo)

### Concepto
Convertir ActionBar en un sistema de plugins donde cada "action" es un plugin registrable.

### Estructura
```typescript
// packages/shared/src/ChatInput/
ChatInputCore
├── Editor ✅
├── TypoBar ✅
├── ActionBar (plugin registry) ✅
└── Plugins API ✅

// apps/copilot/src/plugins/chatInput/
CopilotChatInputPlugins
├── ModelSwitchPlugin
├── FileUploadPlugin
├── KnowledgePlugin
├── ToolsPlugin
└── STTPlugin

// apps/web/src/plugins/chatInput/
WebChatInputPlugins
├── FileUploadPlugin (versión web)
└── BasicActionsPlugin
```

### Ventajas
✅ Máxima reusabilidad
✅ Test friendly
✅ Apps pueden usar solo los plugins que necesiten
✅ Fácil agregar nuevos plugins
✅ Zero coupling entre apps

### Desventajas
❌ Refactor arquitectónico mayor (15-20 horas)
❌ Requiere documentación de API
❌ Curva de aprendizaje para nuevos plugins

### Tiempo Estimado
**33 horas total**
- Preparación: 2h
- Core ChatInput a shared: 8h
- Plugin system: 10h
- Mover plugins copilot: 8h
- Testing & docs: 5h

---

## OPCIÓN B: Dependency Injection ⚡ (Balance)

### Concepto
Mantener la estructura actual pero inyectar dependencias via props/context.

### Estructura
```typescript
// packages/shared/src/ChatInput/
ChatInput (requiere props para todo)

// apps/copilot/src/features/
<ChatInput
  stores={{
    chat: useChatStore(),
    agent: useAgentStore(),
    file: useFileStore(),
    // ... 11 stores
  }}
  components={{
    ModelSelect: CopilotModelSelect,
    KnowledgeModal: CopilotKnowledgeModal,
    // ... 15 componentes
  }}
  hooks={{
    useTokenCount: useCopilotTokenCount,
    // ... 12 hooks
  }}
/>

// apps/web/src/features/
<ChatInput
  stores={{
    chat: useWebChatStore(),
    // versiones web o mocks
  }}
  components={{
    // componentes web o defaults
  }}
/>
```

### Ventajas
✅ Menos refactor que opción A
✅ Mantiene estructura existente
✅ Flexible para diferentes apps

### Desventajas
❌ Props drilling pesado
❌ Interfaz compleja (muchas props)
❌ Boilerplate en cada uso
❌ Coupling implícito (misma API esperada)

### Tiempo Estimado
**18 horas total**
- Props interfaces: 3h
- Mover a shared: 6h
- Adaptar apps/copilot: 4h
- Adaptar apps/web: 3h
- Testing: 2h

---

## OPCIÓN C: Hybrid - Core en Shared 🚀 (Rápida)

### Concepto
Mover SOLO el editor core a shared. ActionBar complejo se queda en cada app.

### Estructura
```typescript
// packages/shared/src/ChatInput/
ChatInputCore
├── Editor (con plugins básicos) ✅
├── TypoBar ✅
├── SendArea ✅
└── Basic ActionBar (solo UI shell) ✅

// apps/copilot/src/features/ChatInput/
CopilotChatInput
├── Usa ChatInputCore de shared
└── ActionBar completo (con todas las actions copilot)

// apps/web/src/components/Copilot/
WebCopilotInput
├── Usa ChatInputCore de shared
└── ActionBar simplificado (solo lo que web necesita)
```

### Ventajas
✅ **RÁPIDO** - Mínimo cambio (6-8 horas)
✅ Funciona inmediatamente
✅ Bajo riesgo
✅ Cada app controla su ActionBar
✅ Compartimos el 60% más importante (editor + typobar)

### Desventajas
❌ ActionBar duplicado entre apps (si ambas lo necesitan)
❌ Menos reusable que opción A
❌ Requiere refactor posterior para llegar a plugin system

### Tiempo Estimado
**8 horas total**
- Core a shared: 3h
- Integration copilot: 2h
- Integration web: 2h
- Testing: 1h

### Qué se Comparte
```
✅ Editor core (@lobehub/editor con todos los plugins)
✅ TypoBar (barra de formato visual)
✅ SendArea (botón enviar + shortcuts)
✅ Store básico (zustand para state del editor)
✅ Types comunes
```

### Qué Queda en Cada App
```
⚠️ ActionBar y sus actions específicas
⚠️ Integraciones con stores propios de cada app
⚠️ Features específicas (Knowledge, Tools, etc.)
```

---

## COMPARACIÓN

| Criterio | Opción A | Opción B | Opción C |
|----------|----------|----------|----------|
| **Tiempo** | 33h | 18h | **8h** ⭐ |
| **Riesgo** | Alto | Medio | **Bajo** ⭐ |
| **Reusabilidad** | **Máxima** ⭐ | Media | Media |
| **Mantenibilidad** | **Alta** ⭐ | Baja | Media |
| **Flexibilidad** | **Máxima** ⭐ | Media | Media |
| **Complejidad** | Alta | Media | **Baja** ⭐ |

---

## RECOMENDACIÓN

### Para AHORA → **Opción C (Hybrid)**

**Por qué:**
1. Funciona en 1 día de trabajo
2. Obtienes el editor completo con toolbar
3. Bajo riesgo de romper copilot existente
4. apps/web puede usar inmediatamente

**Después → Migrar a Opción A**

Una vez funcionando con Opción C, ir gradualmente hacia sistema de plugins:
1. Refactorizar ActionBar a plugin registry
2. Convertir actions existentes a plugins
3. Compartir plugins comunes entre apps

---

## PRÓXIMOS PASOS (Opción C)

### 1. Preparar package.json de shared
```bash
cd packages/shared
pnpm add zustand @lobehub/editor @lobehub/ui antd antd-style react-i18next react-layout-kit lucide-react
```

### 2. Crear estructura en shared
```bash
mkdir -p packages/shared/src/ChatInput/{store,hooks,InputEditor,SendArea,TypoBar}
```

### 3. Copiar archivos core
- types.ts
- store/ (completo)
- hooks/ (completo)
- InputEditor/ (completo)
- SendArea/ (completo)
- TypoBar/ (completo)
- ChatInputProvider.tsx (adaptado)

### 4. Exportar desde shared
```typescript
// packages/shared/src/index.ts
export * from './ChatInput';
```

### 5. Usar en apps/web
```typescript
import { ChatInputCore, TypoBar, SendArea } from '@bodasdehoy/shared';
```

### 6. Mantener ActionBar específico en apps/copilot
(Sin cambios en copilot por ahora)

---

## ¿Cuál prefieres?

- **A**: Sistema completo de plugins (33h, máxima reusabilidad)
- **B**: Dependency injection (18h, balance)
- **C**: Hybrid rápido (8h, funcional ya) ← RECOMENDADA para empezar
