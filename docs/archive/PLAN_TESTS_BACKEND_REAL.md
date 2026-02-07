# 🧪 Plan Completo de Tests al Backend con Datos Reales

**Fecha**: 2026-01-25  
**Objetivo**: Ejecutar tests al backend usando las **1,000 preguntas** y **300-600 acciones** guardadas  
**Backend**: `https://api-ia.bodasdehoy.com` o `http://localhost:8030`

> ⚠️ **ACTUALIZADO**: Números corregidos - 1,000 preguntas (no 16,000) y 300-600 acciones

---

## 📊 Análisis del Sistema Actual

### ✅ Recursos Disponibles

1. **1,000 preguntas guardadas** en el backend
   - Endpoint: `/api/admin/tests/questions`
   - Categorías: `general`, `wedding`, `events`, etc.
   - Dificultades: `easy`, `medium`, `hard`
   - Keywords y respuestas esperadas

2. **Sistema de TestSuite** (`TestSuite/index.tsx`)
   - Ejecución de tests: `/api/admin/tests/run`
   - Estadísticas: `/api/admin/tests/stats`
   - Comparación de modelos: `/api/admin/tests/compare`
   - Agregar preguntas: `/api/admin/tests/questions` (POST)

3. **Backend Endpoints Disponibles**:
   - `POST /webapi/chat/auto` - Chat automático
   - `POST /webapi/chat/{provider}` - Chat con provider específico
   - `GET /webapi/models/{provider}` - Lista modelos
   - `GET /health` - Health check

---

## 🔍 Análisis de lo que Falta

### ❌ Problemas Detectados

1. **Tests de Frontend no conectan al backend real**
   - Los tests de `useWeddingWeb` usan `/api/wedding/{id}` pero necesitan:
     - URL del backend real configurada
     - ID de wedding real para testing
     - Autenticación si es necesaria

2. **Falta integración entre TestSuite y tests unitarios**
   - TestSuite ejecuta tests en el backend
   - Tests unitarios deberían usar datos reales del backend
   - No hay conexión entre ambos sistemas

3. **Falta configuración de datos reales para tests**
   - No hay IDs reales de weddings para testing
   - No hay configuración de autenticación para tests
   - No hay variables de entorno para testing con datos reales

---

## 📋 Plan de Acción

### Fase 1: Configuración de Tests con Datos Reales ⏳

#### 1.1 Configurar Backend URL para Tests
- [ ] Crear archivo `.env.test` con:
  ```env
  NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com
  BACKEND_URL=https://api-ia.bodasdehoy.com
  NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
  ```

#### 1.2 Obtener IDs Reales para Testing
- [ ] Consultar al backend: `GET /api/admin/tests/questions` para obtener las 1,000 preguntas reales
- [ ] Obtener un ID de wedding real del sistema (si existe endpoint)
- [ ] Crear archivo `test-data.json` con:
  ```json
  {
    "realWeddingId": "wedding-id-real-del-sistema",
    "realUserId": "user-id-real",
    "realEventId": "event-id-real",
    "testQuestions": ["pregunta1", "pregunta2", ...]
  }
  ```

#### 1.3 Configurar Autenticación para Tests
- [ ] Verificar si los endpoints requieren autenticación
- [ ] Si es necesario, configurar headers de autenticación en tests
- [ ] Crear función helper `buildAuthHeaders()` para tests

---

### Fase 2: Actualizar Tests para Usar Datos Reales ⏳

#### 2.1 Actualizar `useWeddingWeb.test.ts`
- [ ] Configurar URL del backend real desde variables de entorno
- [ ] Usar ID de wedding real en tests que requieren `weddingId`
- [ ] Actualizar timeouts para conexiones reales (10-15 segundos)
- [ ] Agregar manejo de errores para cuando el backend no esté disponible

#### 2.2 Actualizar `WeddingSiteRenderer.test.tsx`
- [ ] Cargar datos reales de wedding desde el backend
- [ ] Usar datos reales en lugar de `mockWedding`
- [ ] Mantener tests de renderizado pero con datos reales

#### 2.3 Crear Tests de Integración con Backend
- [ ] Crear `integration/wedding-api.test.ts`:
  - Test: Cargar wedding real desde backend
  - Test: Guardar wedding real al backend
  - Test: Validar respuesta del backend
- [ ] Crear `integration/chat-api.test.ts`:
  - Test: Enviar mensaje real al chat
  - Test: Validar respuesta del chat
  - Test: Validar acciones extraídas

---

### Fase 3: Ejecutar Tests con Preguntas Reales ⏳

#### 3.1 Usar TestSuite para Ejecutar Tests
- [ ] Acceder a TestSuite en la UI: `/admin/test-suite`
- [ ] Seleccionar preguntas reales de las 1,000 disponibles
- [ ] Ejecutar tests con diferentes modelos:
  - `claude-3-5-sonnet-20241022`
  - `gpt-4`
  - `gemini-pro`
- [ ] Comparar resultados entre modelos

#### 3.2 Crear Script de Testing Automatizado
- [ ] Crear `scripts/test-backend-real.sh`:
  ```bash
  #!/bin/bash
  # Ejecutar tests usando preguntas reales del backend
  
  BACKEND_URL="${BACKEND_URL:-https://api-ia.bodasdehoy.com}"
  DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
  
  # 1. Health check
  curl -f "${BACKEND_URL}/health" || exit 1
  
  # 2. Obtener preguntas reales
  QUESTIONS=$(curl -s "${BACKEND_URL}/api/admin/tests/questions" | jq -r '.[:10] | .[].question')
  
  # 3. Ejecutar tests con cada pregunta
  for question in $QUESTIONS; do
    echo "Testing: $question"
    curl -X POST "${BACKEND_URL}/webapi/chat/auto" \
      -H "Content-Type: application/json" \
      -H "X-Development: ${DEVELOPMENT}" \
      -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$question\"}],\"stream\":false}"
  done
  ```

#### 3.3 Integrar Tests en CI/CD
- [ ] Crear workflow de GitHub Actions para ejecutar tests con datos reales
- [ ] Configurar secrets para URLs y autenticación
- [ ] Ejecutar tests automáticamente en cada PR

---

### Fase 4: Validación y Reportes ⏳

#### 4.1 Crear Reportes de Tests
- [ ] Generar reporte HTML con resultados de tests
- [ ] Incluir métricas:
  - Tasa de éxito por pregunta
  - Tiempo de respuesta promedio
  - Errores encontrados
  - Comparación entre modelos

#### 4.2 Validar Resultados
- [ ] Comparar respuestas esperadas vs reales
- [ ] Identificar preguntas que fallan consistentemente
- [ ] Crear issues para problemas encontrados

---

## 🛠️ Implementación Inmediata

### Paso 1: Obtener Información Real del Backend

**Necesito que me proporciones**:

1. **URL del Backend para Tests**:
   - ¿Usar `https://api-ia.bodasdehoy.com` o `http://localhost:8030`?
   - ¿Requiere VPN activa?

2. **ID de Wedding Real**:
   - ¿Tienes un ID de wedding real que pueda usar para testing?
   - ¿O debo crear uno nuevo para testing?

3. **Autenticación**:
   - ¿Los endpoints `/api/wedding/*` requieren autenticación?
   - ¿Qué headers necesito enviar?

4. **Preguntas y Acciones Reales**:
   - ✅ Endpoint confirmado: `GET /api/admin/tests/questions` (1,000 preguntas)
   - ⏳ Endpoint de acciones: Verificar `/api/admin/tests/actions` o similar (300-600 acciones)
   - ✅ Autenticación: Usar `buildAuthHeaders()` con JWT token

---

### Paso 2: Crear Configuración de Tests

Una vez que tengas la información, crearé:

1. **`.env.test`** - Variables de entorno para tests
2. **`test-data.json`** - Datos reales para usar en tests
3. **`test-helpers.ts`** - Funciones helper para tests con datos reales
4. **Scripts de testing** - Scripts para ejecutar tests automáticamente

---

## 📊 Métricas a Monitorear

1. **Tasa de Éxito**: % de tests que pasan
2. **Tiempo de Respuesta**: Tiempo promedio de respuesta del backend
3. **Errores**: Tipos y frecuencia de errores
4. **Cobertura**: % de endpoints y funcionalidades probadas

---

## ✅ Checklist Final

- [ ] Backend URL configurada
- [ ] IDs reales obtenidos
- [ ] Autenticación configurada (si es necesaria)
- [ ] Tests actualizados para usar datos reales
- [ ] Scripts de testing creados
- [ ] Tests ejecutados exitosamente
- [ ] Reportes generados
- [ ] Problemas identificados y documentados

---

## 🚀 Próximos Pasos

1. **AHORA**: Obtener información real del backend (URLs, IDs, autenticación)
2. **Luego**: Configurar tests para usar datos reales
3. **Después**: Ejecutar tests y generar reportes
4. **Finalmente**: Analizar resultados y corregir problemas

---

**¿Qué información necesitas que te pida específicamente para avanzar?**
