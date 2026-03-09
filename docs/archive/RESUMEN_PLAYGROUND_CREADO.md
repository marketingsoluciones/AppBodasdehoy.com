# ✅ Playground Creado - Test en Tiempo Real

## 🎮 Componente Creado

He creado un **Playground completo** que muestra en tiempo real cómo la IA escribe y analiza las respuestas de las 1000 preguntas.

### 📁 Archivos Creados

1. **`apps/copilot/src/features/DevPanel/Playground/index.tsx`**
   - Componente principal del Playground
   - Muestra streaming en tiempo real
   - Análisis automático de respuestas

2. **`apps/copilot/src/app/[variants]/(main)/admin/playground/page.tsx`**
   - Página Next.js para el Playground
   - Carga dinámica del componente

3. **`apps/web/COMO_USAR_PLAYGROUND.md`**
   - Documentación completa de uso

## 🚀 Funcionalidades Implementadas

### ✅ Streaming en Tiempo Real
- Ves cómo la IA escribe palabra por palabra
- Cursor parpadeante mientras escribe
- Actualización instantánea de cada token

### ✅ Selección de Preguntas
- Carga automática de las primeras 100 preguntas
- Selección múltiple con checkboxes
- Visualización clara de preguntas seleccionadas

### ✅ Ejecución de Tests
- Ejecuta todas las preguntas seleccionadas
- Muestra progreso: "Pregunta 3/10"
- Botón para detener en cualquier momento

### ✅ Análisis Automático
- Compara respuesta con la esperada
- Calcula score (0-100)
- Detecta keywords encontradas
- Muestra si pasó o falló
- Tiempo de ejecución

## 📍 Cómo Acceder

### URL del Playground:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/playground
```

O si está local:
```
http://localhost:3210/bodasdehoy/admin/playground
```

### Desde el Menú:
1. Ve a `/admin` en el copilot
2. Busca **"🎮 Playground - Tiempo Real"** en el menú lateral
3. Haz clic para abrir

## 🎯 Características Visuales

### Panel Izquierdo
- Lista de preguntas (scrollable)
- Checkboxes para seleccionar
- Información de categoría y dificultad
- Resaltado verde cuando está seleccionada

### Panel Derecho
- Resultados en tiempo real
- Streaming visible mientras la IA escribe
- Análisis completo al terminar
- Estados visuales (azul=ejecutando, verde=pasó, rojo=falló)

### Barra Superior
- Selector de Modelo (Claude, GPT-4, Gemini)
- Selector de Provider (Anthropic, OpenAI, Google)
- Botón "Ejecutar Seleccionadas"
- Botón "Detener" (cuando está ejecutando)
- Botón "Limpiar" resultados

## 💡 Cómo Funciona

1. **Carga Preguntas**: Al abrir, carga las primeras 100 preguntas del backend
2. **Selección**: Haz clic en las preguntas que quieres probar
3. **Ejecución**: Click en "Ejecutar Seleccionadas"
4. **Streaming**: Observa cómo la IA escribe en tiempo real
5. **Análisis**: Al terminar, se muestra el análisis automático

## 🔍 Análisis Automático

El análisis incluye:
- **Score (0-100)**: 
  - 40% por keywords encontradas
  - 60% por similitud de texto
- **Pasa si**: Score >= 70
- **Keywords**: Muestra cuántas keywords se encontraron
- **Razón**: Explica por qué pasó o falló
- **Tiempo**: Tiempo de ejecución en milisegundos

## 📊 Ejemplo Visual

```
┌─────────────────────────────────────────┐
│ 🎮 Playground - Test en Tiempo Real    │
├─────────────────────────────────────────┤
│ Modelo: [Claude 3.5] Provider: [Anthropic] │
│ [▶️ Ejecutar] [⏹️ Detener] [🔄 Limpiar] │
├──────────────────┬──────────────────────┤
│ Preguntas        │ Resultados           │
│                  │                      │
│ ☑ Pregunta 1     │ ✍️ La IA está...    │
│ ☑ Pregunta 2     │ "Para organizar..." │
│ ☐ Pregunta 3     │ [texto aparece]     │
│                  │ ✅ Análisis: PASÓ   │
│                  │ Score: 85/100       │
└──────────────────┴──────────────────────┘
```

## 🎨 Estados Visuales

- **🔵 Azul claro**: Ejecutando (la IA está escribiendo)
- **🟢 Verde claro**: Completado y pasó el test
- **🔴 Rojo claro**: Completado pero falló el test
- **⚪ Blanco**: Pendiente o sin ejecutar

## ⚙️ Configuración Técnica

### Backend
- Usa `EVENTOS_API_CONFIG.BACKEND_URL`
- Endpoint: `/api/admin/tests/questions` (GET)
- Endpoint: `/webapi/chat/auto` (POST con streaming)

### Streaming
- Usa `fetchSSE` de `@/utils/fetch`
- Recibe tokens en tiempo real
- Actualiza UI instantáneamente

## ✅ Listo para Usar

El Playground está **completamente funcional** y listo para:
- ✅ Ver la IA escribir en tiempo real
- ✅ Probar las 1000 preguntas
- ✅ Analizar respuestas automáticamente
- ✅ Comparar diferentes modelos

## 🚀 Próximos Pasos

1. **Abrir el Playground**: `/admin/playground`
2. **Seleccionar algunas preguntas**
3. **Ejecutar y observar** cómo la IA escribe
4. **Revisar el análisis** de cada respuesta

---

**¡Ya puedes ver cómo la IA escribe en tiempo real!** 🎉
