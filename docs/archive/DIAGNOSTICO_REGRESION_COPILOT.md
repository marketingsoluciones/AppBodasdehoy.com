# 🚨 Diagnóstico: Regresión en Funcionalidad del Copilot

**Fecha**: 2026-02-04
**Severidad**: CRÍTICA
**Tipo**: REGRESIÓN (perdieron funcionalidad que ya tenían)

---

## 🎯 El Problema Principal

El copilot está cargando en **modo MINIMAL**, lo que **OCULTA funcionalidades** que deberían estar disponibles.

---

## 📍 Ubicación del Código Problemático

### 1. `/apps/web/components/Copilot/CopilotIframe.tsx` (líneas 93-97)

```typescript
// Modo embebido: oculta navegación lateral del copilot y deja solo conversación + input.
params.set('embed', '1');
// Redundancia para compatibilidad (algunas rutas/layouts leen estos flags)
params.set('embedded', '1');
params.set('minimal', '1');  // ❌ ESTE ES EL PROBLEMA
```

### 2. `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/_layout/Desktop/index.tsx` (líneas 28-32, 40-82)

```typescript
const isEmbed =
  isInIframe ||
  searchParams?.get('embed') === '1' ||
  searchParams?.get('embedded') === '1' ||
  searchParams?.get('minimal') === '1';  // ✅ Lee el parámetro

// Cuando isEmbed = true, OCULTA estas features:
{!isEmbed && !isFullscreen && <ChatHeader />}  // ❌ NO se muestra el header

{!isEmbed && !isFullscreen && (
  <>
    <Portal>
      <Suspense fallback={null}>{portal}</Suspense>  // ❌ NO se muestra el portal
    </Portal>
    <TopicPanel>{topic}</TopicPanel>  // ❌ NO se muestra el panel de tópicos
  </>
)}
```

---

## 🔥 Qué se Está Ocultando

Cuando `minimal=1` está activo, se OCULTAN:

| Componente | Función | Impacto |
|------------|---------|---------|
| **ChatHeader** | Header del chat con opciones | No se pueden ver opciones del chat |
| **Portal** | Panel lateral (probablemente para mostrar info del evento) | **NO SE PUEDE VER INFO DEL EVENTO EN LADO DERECHO** ⬅️ ESTO ES LO QUE BUSCABAS |
| **TopicPanel** | Panel de temas/tópicos conversacionales | No se puede gestionar contexto |

---

## 💡 Por Qué Las Respuestas No Tienen Sentido

### Problema 1: Sin Contexto Visual
Sin el `Portal` (panel lateral), el usuario **NO puede ver**:
- Estado actual del evento
- Listado de invitados en tiempo real
- Filtros rápidos
- Acciones directas

**Resultado**: El copilot responde con texto plano porque el panel visual está OCULTO.

### Problema 2: Sin ChatHeader
Sin el `ChatHeader`, el usuario **NO tiene acceso a**:
- Configuraciones del chat
- Historial de sesiones
- Opciones avanzadas
- Herramientas del editor

**Resultado**: Funcionalidad limitada en el input de texto.

### Problema 3: Sin TopicPanel
Sin el `TopicPanel`, el copilot **NO mantiene contexto** porque:
- No hay panel para mostrar el tema activo
- No hay gestión de contexto conversacional
- El copilot "olvida" de qué estaban hablando

**Resultado**: Cuando dices "pero te he pedido un listado", el copilot no recuerda que estaban hablando de INVITADOS.

---

## 🎯 La Solución

### Opción A: Desactivar Modo Minimal (RECOMENDADO)

**Archivo**: `/apps/web/components/Copilot/CopilotIframe.tsx`

**Línea 97**: COMENTAR o ELIMINAR
```typescript
// ❌ ANTES (modo minimal - OCULTA features)
params.set('minimal', '1');

// ✅ DESPUÉS (modo completo - MUESTRA todas las features)
// params.set('minimal', '1');  // Comentado para recuperar funcionalidad completa
```

**O mejor**:
```typescript
// Solo embed (oculta navegación principal pero MANTIENE panel lateral)
params.set('embed', '1');
// params.set('embedded', '1');  // Redundante, eliminar
// params.set('minimal', '1');  // ELIMINAR - esto es lo que oculta todo
```

---

### Opción B: Crear Modo "Embed Completo" (alternativa)

Si necesitan modo embed PERO con panel lateral, modificar el layout:

**Archivo**: `/apps/copilot/src/app/[variants]/(main)/chat/(workspace)/_layout/Desktop/index.tsx`

```typescript
// Separar modos: embed vs minimal
const isEmbed =
  isInIframe ||
  searchParams?.get('embed') === '1' ||
  searchParams?.get('embedded') === '1';

const isMinimal = searchParams?.get('minimal') === '1';

// Ocultar header solo en embed (ok)
{!isEmbed && !isFullscreen && <ChatHeader />}

// PERO mantener portal/topicpanel a menos que sea MINIMAL
{!isMinimal && !isFullscreen && (
  <>
    <Portal>
      <Suspense fallback={null}>{portal}</Suspense>  // ✅ Se muestra el portal
    </Portal>
    <TopicPanel>{topic}</TopicPanel>  // ✅ Se muestra el panel
  </>
)}
```

**Resultado**: Con `embed=1` (sin minimal), tendrías:
- ❌ Sin navegación principal (ok, está embebido)
- ✅ CON panel lateral derecho (info del evento, listados)
- ✅ CON panel de tópicos (contexto conversacional)
- ✅ Funcionalidad COMPLETA del editor de texto

---

## 📊 Comparativa: Minimal vs Completo

| Feature | Con `minimal=1` | Sin `minimal` |
|---------|----------------|---------------|
| **Panel lateral derecho** | ❌ Oculto | ✅ Visible |
| **Listados de invitados visuales** | ❌ Solo texto | ✅ Panel interactivo |
| **Estado del evento visible** | ❌ No | ✅ Sí |
| **Contexto conversacional** | ❌ Limitado | ✅ Completo |
| **Opciones del editor** | ❌ Básicas | ✅ Todas |
| **Header del chat** | ❌ Oculto | ✅ Visible |

---

## 🔧 Pasos para Resolver

### Paso 1: Editar CopilotIframe.tsx

```bash
# Abrir el archivo
code /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/components/Copilot/CopilotIframe.tsx
```

**Línea 97**: Comentar o eliminar
```typescript
// params.set('minimal', '1');
```

### Paso 2: Reiniciar Frontend

```bash
launchctl kickstart -k gui/$(id -u)/com.bodasdehoy.app-test
```

### Paso 3: Limpiar Cache del Navegador

```
Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows)
```

### Paso 4: Probar de Nuevo

1. Abrir https://app-test.bodasdehoy.com
2. Abrir chat copilot
3. Verificar que AHORA SÍ aparece:
   - ✅ Panel lateral derecho
   - ✅ Más opciones en el editor de texto
   - ✅ Contexto conversacional funciona

---

## 🤔 Por Qué Pasó Esto

**Teoría más probable**:

Alguien agregó `minimal=1` pensando que era necesario para el modo embed, pero NO sabían que eso OCULTARÍA funcionalidades clave.

**Posible causa**:
- Commit reciente que "optimizó" el iframe
- Intento de reducir complejidad del embed
- Copia/paste de ejemplo de LobeChat docs

**Evidencia**:
Tu comentario: *"esto ya lo teníamos resuelto y algo ha pasado que hemos regresado a algo más antiguo"*

---

## ✅ Checklist de Verificación Post-Fix

Después de aplicar el fix, verificar:

- [ ] Panel lateral derecho es VISIBLE
- [ ] Se puede ver el estado del evento
- [ ] Se pueden ver listados de invitados en el panel
- [ ] Editor de texto tiene todas las opciones (attach, emojis, etc.)
- [ ] El copilot mantiene contexto ("listado" = invitados, no eventos)
- [ ] Las respuestas tienen sentido y son concisas

---

## 🎯 Solución Inmediata (1 minuto)

**ELIMINAR UNA LÍNEA**:

```diff
// apps/web/components/Copilot/CopilotIframe.tsx línea 97
  params.set('embed', '1');
- params.set('minimal', '1');
```

Guarda, reinicia, listo. ✅

---

**Estado**: 🔴 CRÍTICO - Funcionalidad clave oculta
**Prioridad**: INMEDIATA
**Tiempo estimado de fix**: 1 minuto
**Impacto**: Alto (recupera funcionalidad completa del copilot)
