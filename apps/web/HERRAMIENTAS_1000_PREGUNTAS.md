# 🛠️ Herramientas para Trabajar con las 1000 Preguntas

## 📋 Resumen

Tienes **1,000 preguntas** guardadas en el backend que puedes usar para:
- ✅ Testing del sistema de chat
- ✅ Validación de respuestas de IA
- ✅ Comparación entre modelos
- ✅ Análisis de rendimiento

## 🚀 Script Creado

He creado un script completo en: `scripts/trabajar-con-1000-preguntas.mjs`

### Uso del Script

```bash
# Ver todas las opciones
node scripts/trabajar-con-1000-preguntas.mjs

# Listar primeras 20 preguntas
node scripts/trabajar-con-1000-preguntas.mjs listar 20

# Buscar preguntas por texto
node scripts/trabajar-con-1000-preguntas.mjs buscar "boda"

# Filtrar por categoría
node scripts/trabajar-con-1000-preguntas.mjs categoria wedding

# Filtrar por dificultad
node scripts/trabajar-con-1000-preguntas.mjs dificultad easy

# Ver estadísticas
node scripts/trabajar-con-1000-preguntas.mjs estadisticas

# Exportar todas a JSON
node scripts/trabajar-con-1000-preguntas.mjs exportar

# Ejecutar tests con 50 preguntas
node scripts/trabajar-con-1000-preguntas.mjs test 50
```

## 📍 Endpoints del Backend

### Obtener Preguntas
```
GET https://api-ia.bodasdehoy.com/api/admin/tests/questions
```

**Parámetros:**
- `limit`: Número de preguntas (ej: `?limit=100`)
- `category`: Filtrar por categoría (ej: `?category=wedding`)
- `difficulty`: Filtrar por dificultad (ej: `?difficulty=easy`)
- `search`: Buscar por texto (ej: `?search=boda`)

**Ejemplo:**
```bash
curl "https://api-ia.bodasdehoy.com/api/admin/tests/questions?limit=10&category=wedding"
```

### Ejecutar Tests
```
POST https://api-ia.bodasdehoy.com/api/admin/tests/run
```

**Body:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic",
  "testIds": [] // Vacío = todas las preguntas
}
```

### Ver Estadísticas
```
GET https://api-ia.bodasdehoy.com/api/admin/tests/stats
```

## 🎯 TestSuite en la UI

También puedes usar el TestSuite visual:

1. **Abrir TestSuite:**
   - Navega a: `https://chat-test.bodasdehoy.com/bodasdehoy/admin/test-suite`
   - O si está local: `http://localhost:3210/bodasdehoy/admin/test-suite`

2. **Funcionalidades:**
   - ✅ Ver todas las 1,000 preguntas
   - ✅ Filtrar por categoría/dificultad
   - ✅ Seleccionar preguntas específicas
   - ✅ Ejecutar tests con diferentes modelos
   - ✅ Comparar resultados entre modelos
   - ✅ Ver estadísticas detalladas
   - ✅ Agregar nuevas preguntas

## 📊 Estructura de una Pregunta

```typescript
interface TestQuestion {
  id: string;
  question: string;
  category: string;        // 'general', 'wedding', 'events', etc.
  difficulty: string;      // 'easy', 'medium', 'hard'
  keywords: string[];     // Palabras clave
  expectedResponse: string; // Respuesta esperada
  status?: string;        // 'passed', 'failed', 'pending'
  score?: number;         // Puntuación (0-100)
  executionTime?: number; // Tiempo de ejecución en ms
}
```

## 🔧 Configuración

El script usa estas variables de entorno:

```bash
# Backend URL (default: https://api-ia.bodasdehoy.com)
export BACKEND_URL=https://api-ia.bodasdehoy.com

# Development (default: bodasdehoy)
export DEVELOPMENT=bodasdehoy
```

## 💡 Ejemplos de Uso

### 1. Analizar todas las preguntas
```bash
node scripts/trabajar-con-1000-preguntas.mjs estadisticas
```

### 2. Encontrar preguntas sobre presupuesto
```bash
node scripts/trabajar-con-1000-preguntas.mjs buscar "presupuesto"
```

### 3. Testear solo preguntas fáciles
```bash
node scripts/trabajar-con-1000-preguntas.mjs dificultad easy
node scripts/trabajar-con-1000-preguntas.mjs test 20
```

### 4. Exportar para análisis externo
```bash
node scripts/trabajar-con-1000-preguntas.mjs exportar
# Crea: preguntas-export-2026-01-26.json
```

## 🧪 Testing Automatizado

### Ejecutar tests con todas las preguntas
```bash
# Test con 100 preguntas
node scripts/trabajar-con-1000-preguntas.mjs test 100

# El script mostrará:
# - Preguntas probadas
# - Tiempo de respuesta
# - Tasa de éxito
# - Errores encontrados
```

### Integrar en CI/CD
```bash
# En tu pipeline
BACKEND_URL=https://api-ia.bodasdehoy.com \
node scripts/trabajar-con-1000-preguntas.mjs test 50
```

## 📝 Notas

- Las preguntas están almacenadas en el backend
- Puedes agregar nuevas preguntas desde el TestSuite UI
- El script maneja errores de conexión automáticamente
- Los resultados se pueden exportar para análisis posterior

## 🚀 Próximos Pasos

1. **Probar el script:**
   ```bash
   node scripts/trabajar-con-1000-preguntas.mjs estadisticas
   ```

2. **Explorar preguntas:**
   ```bash
   node scripts/trabajar-con-1000-preguntas.mjs listar 50
   ```

3. **Ejecutar tests:**
   ```bash
   node scripts/trabajar-con-1000-preguntas.mjs test 20
   ```

4. **Usar TestSuite UI:**
   - Abrir en navegador y explorar visualmente
