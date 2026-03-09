# 🔧 Solución: Editor del Copilot Muy Reducido

**Fecha**: 2026-02-04
**Problema**: El editor del copilot muestra solo 8-10 iconos básicos en vez de las 15+ funcionalidades de LobeChat completo

---

## 🔍 Análisis del Problema

### Editor Actual (Reducido)
Tu screenshot muestra solo:
- 🔗 Link
- 🌐 Algo de red
- T (Texto)
- 📎 Attach
- 📚 Knowledge
- ⚙️ Config
- 🎤 Voice
- Más...

### Editor Completo de LobeChat
Debería tener:
1. **model** - Selector de modelo IA
2. **search** - Búsqueda en conversación
3. **typo** - Corrección tipográfica
4. **fileUpload** - Subir archivos
5. **knowledgeBase** - Base de conocimientos
6. **tools** - Herramientas/Plugins
7. **params** - Parámetros del modelo
8. **history** - Historial de conversación
9. **stt** - Speech-to-text
10. **clear** - Limpiar conversación
11. **mainToken** - Contador de tokens
12. **saveTopic** - Guardar tema

---

## 🎯 Causa Raíz

El problema NO es que el código esté malo. El problema es:

### 1. **Colapso Automático por Ancho**

**Archivo**: `/apps/copilot/src/features/ChatInput/ActionBar/index.tsx` (línea 58)

```typescript
<ChatInputActions
  collapseOffset={mobile ? 48 : 80}  // ❌ Si el ancho < 80px, colapsa acciones
  defaultGroupCollapse={true}         // ❌ Grupos colapsados por defecto
  groupCollapse={!expandInputActionbar}
  items={items}
/>
```

**Qué hace**:
- Si el contenedor tiene < 80px de ancho disponible, las acciones se agrupan en "Más..."
- Los grupos de acciones (`['params', 'history', 'stt', 'clear']`) se colapsan por defecto

**Resultado**: Solo se ven las primeras 4-5 acciones, el resto está en el menú "Más..."

### 2. **Iframe Angosto**

Si el iframe del copilot es angosto (por ejemplo 400px), y el input ocupa todo el ancho, el espacio disponible para las acciones es muy poco.

```
┌────────────────────────────────────────┐
│ [IconoIcono IconoIcono Icono...][Send]│  ← Solo caben 5 iconos + "Más"
└────────────────────────────────────────┘
```

### 3. **Modo Mobile Detectado**

Si el sistema detecta que está en mobile (por ancho de ventana), usa configuración mobile:

```typescript
// Mobile leftActions (más reducido)
const leftActions: ActionKeys[] = [
  'model',
  'search',
  'fileUpload',
  'knowledgeBase',
  'tools',
  ['params', 'history', 'stt', 'clear'],
  'mainToken',
];
```

vs

```typescript
// Desktop leftActions (completo)
const leftActions: ActionKeys[] = [
  'model',
  'search',
  'typo',            // ← Mobile no tiene esto
  'fileUpload',
  'knowledgeBase',
  'tools',
  '---',             // ← Separador solo en desktop
  ['params', 'history', 'stt', 'clear'],
  'mainToken',
];
```

---

## ✅ Soluciones

### Solución 1: Aumentar Ancho del Iframe (MÁS FÁCIL)

**Archivo**: `/apps/web/components/ChatSidebar/ChatSidebar.tsx`

Busca el ancho del ChatSidebar y auméntalo:

```typescript
// ANTES (ejemplo)
<div style={{ width: '360px' }}>  // ❌ Muy angosto

// DESPUÉS
<div style={{ width: '500px' }}>  // ✅ Más ancho = más iconos visibles
```

**Resultado**: Con más ancho, caben más iconos sin colapsar.

---

### Solución 2: Desactivar Colapso Automático

**Archivo**: `/apps/copilot/src/features/ChatInput/ActionBar/index.tsx`

**Modificar línea 58-64**:

```typescript
// ANTES
<ChatInputActions
  collapseOffset={mobile ? 48 : 80}       // ❌ Colapsa si < 80px
  defaultGroupCollapse={true}              // ❌ Grupos colapsados
  groupCollapse={!expandInputActionbar}
  items={items}
  onGroupCollapseChange={(v) => {
    toggleExpandInputActionbar(!v);
  }}
/>

// DESPUÉS
<ChatInputActions
  collapseOffset={0}                       // ✅ NUNCA colapsar
  defaultGroupCollapse={false}             // ✅ Grupos expandidos siempre
  groupCollapse={false}                    // ✅ Forzar expansión
  items={items}
  onGroupCollapseChange={(v) => {
    // No hacer nada
  }}
/>
```

**Resultado**: Todas las acciones se muestran siempre, en 2-3 filas si es necesario.

---

### Solución 3: Forzar Modo Desktop (RECOMENDADO)

**Archivo**: `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx`

**Modificar línea 10**:

```typescript
// ANTES
const Input = mobile ? MobileChatInput : DesktopChatInput;

// DESPUÉS
const Input = DesktopChatInput;  // ✅ SIEMPRE usar versión desktop (completa)
```

**Resultado**: Usa siempre el editor completo, nunca la versión mobile reducida.

---

### Solución 4: Modificar leftActions para Embed (ESPECÍFICA)

**Archivo**: `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx`

**Añadir lógica condicional**:

```typescript
// Detectar si está en embed
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

// Si está en iframe, usar acciones expandidas (sin agrupar)
const leftActions: ActionKeys[] = isInIframe ? [
  'model',
  'search',
  'typo',
  'fileUpload',
  'knowledgeBase',
  'tools',
  'params',      // ✅ Individual, no agrupado
  'history',     // ✅ Individual, no agrupado
  'stt',         // ✅ Individual, no agrupado
  'clear',       // ✅ Individual, no agrupado
  'mainToken',
] : [
  // Configuración normal para uso standalone
  'model',
  'search',
  'typo',
  'fileUpload',
  'knowledgeBase',
  'tools',
  '---',
  ['params', 'history', 'stt', 'clear'],  // Agrupados
  'mainToken',
];
```

**Resultado**: En modo embed, todas las acciones se muestran individualmente (no agrupadas).

---

## 🎯 Recomendación: Solución Combinada

**Aplicar las 3 primeras soluciones**:

### 1. Aumentar ancho del ChatSidebar
```typescript
// apps/web/components/ChatSidebar/ChatSidebar.tsx
width: '500px'  // En vez de 360px
```

### 2. Desactivar colapso automático
```typescript
// apps/copilot/src/features/ChatInput/ActionBar/index.tsx
collapseOffset={0}
defaultGroupCollapse={false}
groupCollapse={false}
```

### 3. Forzar modo desktop
```typescript
// apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx
const Input = DesktopChatInput;  // SIEMPRE desktop
```

---

## 🧪 Testing

Después de aplicar los cambios:

1. **Reiniciar frontend**:
```bash
launchctl kickstart -k gui/$(id -u)/com.bodasdehoy.app-test
```

2. **Limpiar cache del navegador**: `Cmd+Shift+R`

3. **Verificar**:
- ✅ El editor muestra más iconos
- ✅ Los grupos ('params', 'history', 'stt', 'clear') se muestran individualmente
- ✅ No hay menú "Más..." o al menos tiene menos items

---

## 📊 Comparativa

| Configuración | Iconos Visibles | Colapso | Resultado |
|---------------|----------------|---------|-----------|
| **Actual** | 5-8 | Sí | ❌ Muy reducido |
| **Con Solución 1** | 8-10 | Sí | 🟡 Mejor pero limitado |
| **Con Solución 2** | 12+ | No | ✅ Completo |
| **Con Solución 3** | 12+ | No | ✅ Completo |
| **Combinado (1+2+3)** | 15+ | No | ✅✅ ÓPTIMO |

---

## ⚠️ Nota Importante

El problema NO es regresión de código (el código está bien). Es un problema de **espacio disponible** y **configuración de colapso**.

LobeChat está diseñado para colapsar acciones automáticamente cuando el espacio es limitado (responsive design). Esto es BUENO para mobile, pero MALO para tu caso donde quieres el editor completo en el iframe.

---

## 🔗 Archivos Clave

1. `/apps/web/components/ChatSidebar/ChatSidebar.tsx` - Ancho del sidebar
2. `/apps/copilot/src/features/ChatInput/ActionBar/index.tsx` - Configuración de colapso
3. `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/Desktop/ClassicChat.tsx` - Definición de acciones
4. `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx` - Selector mobile/desktop

---

**Estado**: ✅ **IMPLEMENTADO** - Esperando testing
**Prioridad**: Alta (UX degradada)
**Fecha implementación**: 2026-02-04

## 📋 Cambios Aplicados

### 1. ✅ Aumentado ancho del ChatSidebar
**Archivo**: [apps/web/components/ChatSidebar/ChatSidebar.tsx](apps/web/components/ChatSidebar/ChatSidebar.tsx:19)
```typescript
const MIN_WIDTH = 500; // De 360 → 500px
```

### 2. ✅ Desactivado auto-colapso de acciones
**Archivo**: [apps/copilot/src/features/ChatInput/ActionBar/index.tsx](apps/copilot/src/features/ChatInput/ActionBar/index.tsx:58-66)
```typescript
collapseOffset={0}              // De 80 → 0 (nunca colapsar)
defaultGroupCollapse={false}    // De true → false
groupCollapse={false}           // De !expandInputActionbar → false
```

### 3. ✅ Forzado modo Desktop siempre
**Archivo**: [apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx](apps/copilot/src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx:10)
```typescript
const Input = DesktopChatInput; // SIEMPRE desktop, nunca mobile
```

## 🧪 Próximos Pasos

1. **Reiniciar servicios**:
```bash
# Reiniciar copilot
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot && npm run build

# Reiniciar frontend
launchctl kickstart -k gui/$(id -u)/com.bodasdehoy.app-test
```

2. **Limpiar cache del navegador**: `Cmd+Shift+R`

3. **Verificar resultado**:
   - ✅ El sidebar del chat debería ser más ancho (500px)
   - ✅ Todas las acciones del editor deberían estar visibles
   - ✅ Los botones agrupados (params, history, stt, clear) deberían mostrarse individualmente
   - ✅ El editor debería tener 15+ iconos de funcionalidad
