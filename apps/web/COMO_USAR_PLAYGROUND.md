# 🎮 Cómo Usar el Playground - Test en Tiempo Real

## 📍 Acceso

El Playground está disponible en:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/playground
```

O si está local:
```
http://localhost:3210/bodasdehoy/admin/playground
```

## 🚀 Funcionalidades

### 1. Ver la IA Escribir en Tiempo Real
- ✅ **Streaming en vivo**: Ves cómo la IA escribe palabra por palabra
- ✅ **Cursor parpadeante**: Indica que está escribiendo
- ✅ **Actualización instantánea**: Cada token se muestra inmediatamente

### 2. Seleccionar Preguntas
- ✅ Carga automáticamente las primeras 100 preguntas del backend
- ✅ Selecciona múltiples preguntas con checkboxes
- ✅ Filtra por categoría y dificultad (desde el backend)

### 3. Ejecutar Tests
- ✅ Ejecuta todas las preguntas seleccionadas
- ✅ Muestra progreso: "Pregunta 3/10"
- ✅ Puedes detener en cualquier momento

### 4. Análisis Automático
- ✅ Compara respuesta con la esperada
- ✅ Calcula score (0-100)
- ✅ Detecta keywords
- ✅ Muestra si pasó o falló
- ✅ Tiempo de ejecución

## 📋 Pasos para Usar

### Paso 1: Acceder al Playground
1. Navega a `/admin/playground` en el copilot
2. Espera a que carguen las preguntas (aparece "Cargando preguntas...")

### Paso 2: Configurar Modelo
- Selecciona el **Modelo** (Claude, GPT-4, Gemini)
- Selecciona el **Provider** (Anthropic, OpenAI, Google)

### Paso 3: Seleccionar Preguntas
- Haz clic en las preguntas que quieres probar
- Se marcan en verde cuando están seleccionadas
- Puedes seleccionar múltiples

### Paso 4: Ejecutar
1. Haz clic en **"Ejecutar Seleccionadas"**
2. Observa cómo:
   - La IA escribe en tiempo real (panel derecho)
   - Aparece el texto palabra por palabra
   - Se muestra el análisis automático al terminar

### Paso 5: Ver Resultados
Cada resultado muestra:
- ✅ **Pregunta**: La pregunta que se hizo
- ✅ **Respuesta de la IA**: El texto completo que generó
- ✅ **Análisis**: 
  - Score (0-100)
  - Si pasó o falló
  - Keywords encontradas
  - Razón del resultado
  - Tiempo de ejecución

## 🎯 Características Especiales

### Streaming en Vivo
```
✍️ La IA está escribiendo...
Hola, estoy aquí para ayudarte con...
[texto aparece palabra por palabra]
▊ [cursor parpadeante]
```

### Análisis Inteligente
- **Score por Keywords**: 40% del score
- **Score por Similitud**: 60% del score
- **Pasa si**: Score >= 70

### Estados Visuales
- 🔵 **Azul**: Ejecutando (la IA está escribiendo)
- 🟢 **Verde**: Completado y pasó
- 🔴 **Rojo**: Completado pero falló
- ⚪ **Blanco**: Pendiente

## 💡 Tips

1. **Empieza con pocas preguntas**: Prueba con 3-5 preguntas primero
2. **Observa el streaming**: Es fascinante ver cómo la IA piensa
3. **Revisa el análisis**: Entiende por qué pasó o falló
4. **Compara modelos**: Cambia el modelo y ejecuta las mismas preguntas

## 🔧 Configuración Técnica

### Backend URL
El Playground usa:
- `EVENTOS_API_CONFIG.BACKEND_URL` o
- `http://localhost:8030` por defecto

### Endpoints Usados
- `GET /api/admin/tests/questions` - Cargar preguntas
- `POST /webapi/chat/auto` - Enviar pregunta con streaming

### Streaming
Usa `fetchSSE` de `@lobechat/utils/fetch` para:
- Recibir tokens en tiempo real
- Mostrar texto mientras se genera
- Actualizar UI instantáneamente

## 📊 Ejemplo de Uso

1. **Abrir Playground**: `/admin/playground`
2. **Seleccionar 3 preguntas** sobre "boda"
3. **Ejecutar** y observar:
   ```
   Pregunta 1/3: "¿Cómo organizar una boda?"
   ✍️ La IA está escribiendo...
   "Para organizar una boda, primero necesitas..."
   [texto aparece en tiempo real]
   ✅ Análisis: PASÓ (Score: 85/100)
   ```
4. **Ver resultados** con análisis completo

## 🎨 Interfaz

- **Panel Izquierdo**: Lista de preguntas (scrollable)
- **Panel Derecho**: Resultados en tiempo real (scrollable)
- **Barra Superior**: Configuración y controles

## ⚠️ Notas

- El Playground carga las primeras 100 preguntas por defecto
- Puedes seleccionar todas o solo algunas
- El análisis es automático y se muestra al terminar cada pregunta
- Puedes detener la ejecución en cualquier momento

---

**¡Disfruta viendo cómo la IA escribe en tiempo real!** 🚀
