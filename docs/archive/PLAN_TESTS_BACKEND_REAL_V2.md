# 🧪 Plan Real de Tests al Backend con Datos Reales

**Fecha**: 2026-01-25  
**Objetivo**: Ejecutar tests al backend usando las **1,000 preguntas** y **300-600 acciones** guardadas  
**Backend**: `https://api-ia.bodasdehoy.com` o `http://localhost:8030`

---

## 📊 Recursos Reales Disponibles

### ✅ Datos Confirmados

1. **1,000 preguntas guardadas** en el backend
   - Endpoint: `GET /api/admin/tests/questions`
   - Categorías: `general`, `wedding`, `events`, etc.
   - Dificultades: `easy`, `medium`, `hard`
   - Keywords y respuestas esperadas

2. **300-600 acciones guardadas** en el backend
   - Probablemente en: `/api/admin/tests/actions` o similar
   - Acciones extraídas de respuestas de la IA
   - Usadas para validar comportamiento del sistema

3. **Sistema de TestSuite** (`TestSuite/index.tsx`)
   - Ejecución de tests: `POST /api/admin/tests/run`
   - Estadísticas: `GET /api/admin/tests/stats`
   - Comparación de modelos: `POST /api/admin/tests/compare`
   - Agregar preguntas: `POST /api/admin/tests/questions`

4. **Backend Endpoints Disponibles**:
   - `POST /webapi/chat/auto` - Chat automático
   - `POST /webapi/chat/{provider}` - Chat con provider específico
   - `GET /webapi/models/{provider}` - Lista modelos
   - `GET /health` - Health check

---

## 🔍 Análisis Real del Sistema

### ✅ Lo que SÍ tenemos

1. **TestSuite funcional** en `/admin/test-suite`
   - Carga preguntas desde backend
   - Ejecuta tests con modelos específicos
   - Compara resultados entre modelos

2. **Autenticación configurada**:
   - `buildAuthHeaders()` en `@/utils/authToken`
   - Usa JWT tokens de localStorage
   - Headers: `Authorization: Bearer {token}`

3. **Configuración de Backend**:
   - `EVENTOS_API_CONFIG.BACKEND_URL` o `process.env.NEXT_PUBLIC_BACKEND_URL`
   - Default: `http://localhost:8030`
   - Proxy: `/api/backend` en navegador

### ❌ Lo que FALTA

1. **Tests unitarios no conectan al backend real**
   - `useWeddingWeb.test.ts` usa datos locales
   - No hay tests de integración con backend
   - No hay tests usando las 1,000 preguntas reales

2. **No hay acceso directo a las acciones guardadas**
   - No encuentro endpoint `/api/admin/tests/actions`
   - Necesito verificar cómo se almacenan las acciones

3. **Falta configuración para tests automatizados**
   - No hay `.env.test` con URLs reales
   - No hay scripts para ejecutar tests con datos reales
   - No hay reportes automatizados

---

## 📋 Plan de Acción REAL

### Fase 1: Verificar y Conectar con Backend Real ⏳

#### 1.1 Verificar Endpoints del Backend
- [ ] Probar `GET /api/admin/tests/questions` para obtener las 1,000 preguntas
- [ ] Verificar endpoint de acciones: `/api/admin/tests/actions` o similar
- [ ] Verificar autenticación necesaria con `buildAuthHeaders()`
- [ ] Probar `GET /api/admin/tests/stats` para ver estadísticas

#### 1.2 Configurar Variables de Entorno para Tests
- [ ] Crear `.env.test` con:
  ```env
  NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com
  BACKEND_URL=https://api-ia.bodasdehoy.com
  ```
- [ ] O usar `http://localhost:8030` si el backend está local

#### 1.3 Crear Helper para Tests con Backend Real
- [ ] Crear `test-helpers/backend.ts`:
  ```typescript
  import { buildAuthHeaders } from '@/utils/authToken';
  
  export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
  
  export async function getTestQuestions(limit = 10) {
    const response = await fetch(`${BACKEND_URL}/api/admin/tests/questions?limit=${limit}`, {
      headers: buildAuthHeaders(),
    });
    return response.json();
  }
  
  export async function getTestActions(limit = 10) {
    // Verificar endpoint real
    const response = await fetch(`${BACKEND_URL}/api/admin/tests/actions?limit=${limit}`, {
      headers: buildAuthHeaders(),
    });
    return response.json();
  }
  ```

---

### Fase 2: Crear Tests de Integración REALES ⏳

#### 2.1 Test de Carga de Preguntas Reales
- [ ] Crear `integration/questions.test.ts`:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { getTestQuestions } from '../test-helpers/backend';
  
  describe('Backend - Preguntas Reales', () => {
    it('debe cargar las 1,000 preguntas del backend', async () => {
      const questions = await getTestQuestions(1000);
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(1000);
    });
    
    it('cada pregunta debe tener estructura válida', async () => {
      const questions = await getTestQuestions(10);
      questions.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('difficulty');
      });
    });
  });
  ```

#### 2.2 Test de Ejecución con Preguntas Reales
- [ ] Crear `integration/chat-real.test.ts`:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { getTestQuestions } from '../test-helpers/backend';
  import { buildAuthHeaders } from '@/utils/authToken';
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
  
  describe('Backend - Chat con Preguntas Reales', () => {
    it('debe responder a preguntas reales del backend', async () => {
      const questions = await getTestQuestions(5);
      
      for (const question of questions) {
        const response = await fetch(`${BACKEND_URL}/webapi/chat/auto`, {
          method: 'POST',
          headers: {
            ...buildAuthHeaders(),
            'Content-Type': 'application/json',
            'X-Development': 'bodasdehoy',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: question.question }],
            stream: false,
          }),
        });
        
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.response || data.message).toBeDefined();
      }
    }, 60000); // 60 segundos timeout
  });
  ```

#### 2.3 Test de Acciones Guardadas
- [ ] Crear `integration/actions.test.ts`:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { getTestActions } from '../test-helpers/backend';
  
  describe('Backend - Acciones Guardadas', () => {
    it('debe cargar las 300-600 acciones del backend', async () => {
      const actions = await getTestActions(600);
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThanOrEqual(300);
      expect(actions.length).toBeLessThanOrEqual(600);
    });
  });
  ```

---

### Fase 3: Actualizar Tests Existentes para Usar Datos Reales ⏳

#### 3.1 Actualizar `useWeddingWeb.test.ts`
- [ ] Obtener ID de wedding real del backend
- [ ] Usar datos reales en lugar de datos mock
- [ ] Conectar con `/api/wedding/{id}` real

#### 3.2 Crear Tests de Integración con TestSuite
- [ ] Test que ejecute TestSuite programáticamente
- [ ] Validar que las 1,000 preguntas se ejecuten correctamente
- [ ] Comparar resultados entre modelos

---

### Fase 4: Scripts de Testing Automatizado ⏳

#### 4.1 Script para Ejecutar Tests con Preguntas Reales
- [ ] Crear `scripts/test-backend-real.sh`:
  ```bash
  #!/bin/bash
  BACKEND_URL="${BACKEND_URL:-https://api-ia.bodasdehoy.com}"
  DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
  
  echo "🧪 Ejecutando tests con preguntas reales del backend"
  
  # 1. Health check
  curl -f "${BACKEND_URL}/health" || exit 1
  
  # 2. Obtener preguntas reales (primeras 10)
  echo "📋 Obteniendo preguntas del backend..."
  QUESTIONS=$(curl -s "${BACKEND_URL}/api/admin/tests/questions?limit=10" \
    -H "Authorization: Bearer ${JWT_TOKEN}" | jq -r '.[].question')
  
  # 3. Ejecutar tests
  for question in $QUESTIONS; do
    echo "Testing: $question"
    curl -X POST "${BACKEND_URL}/webapi/chat/auto" \
      -H "Content-Type: application/json" \
      -H "X-Development: ${DEVELOPMENT}" \
      -H "Authorization: Bearer ${JWT_TOKEN}" \
      -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$question\"}],\"stream\":false}"
  done
  ```

#### 4.2 Script para Ejecutar TestSuite Completo
- [ ] Crear `scripts/run-testsuite.sh`:
  ```bash
  #!/bin/bash
  # Ejecutar TestSuite completo con todas las preguntas
  BACKEND_URL="${BACKEND_URL:-https://api-ia.bodasdehoy.com}"
  
  curl -X POST "${BACKEND_URL}/api/admin/tests/run" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -d '{
      "model": "claude-3-5-sonnet-20241022",
      "provider": "anthropic",
      "testIds": []  # Vacío = todas las preguntas
    }'
  ```

---

## 🚀 Implementación Completada

### ✅ Archivos Creados

1. **Helpers de Testing** (`src/test-helpers/backend.ts`)
   - Funciones para obtener preguntas y acciones reales
   - Manejo de errores de DNS/conexión
   - Fallback a URL de producción

2. **Tests de Integración**
   - `integration/questions.test.ts` - Tests con 1,000 preguntas
   - `integration/actions.test.ts` - Tests con 300-600 acciones

3. **Scripts de Testing**
   - `scripts/test-backend-real.sh` - Script automatizado

4. **Documentación**
   - `INSTRUCCIONES_EJECUTAR_TESTS_REALES.md` - Guía completa

### ⚠️ Problema Detectado: DNS en Tests

Los tests de Vitest tienen problemas de DNS cuando se ejecutan desde terminal:
- Error: `ENOTFOUND api-ia.bodasdehoy.com`
- Causa: Entorno de tests (happy-dom) no tiene acceso a DNS con VPN

### ✅ Solución: Usar TestSuite desde UI

**Método Recomendado**: Ejecutar tests desde la interfaz web del TestSuite:
1. Abrir: `https://chat-test.bodasdehoy.com/admin/test-suite`
2. Seleccionar preguntas (o todas las 1,000)
3. Ejecutar tests
4. Ver resultados en tiempo real

**Ventajas**:
- ✅ No requiere configuración de DNS
- ✅ Autenticación ya configurada
- ✅ Interfaz visual
- ✅ Comparación de modelos integrada

### Paso 2: Crear Helpers de Testing

Crear archivo `apps/copilot/src/test-helpers/backend.ts` con funciones para:
- Obtener preguntas reales
- Obtener acciones reales
- Ejecutar tests con datos reales
- Validar respuestas

### Paso 3: Crear Tests de Integración

Crear tests que:
- Usen las 1,000 preguntas reales
- Validan las 300-600 acciones guardadas
- Ejecuten contra el backend real
- Generen reportes

---

## 📊 Métricas a Monitorear

1. **Tasa de Éxito**: % de preguntas que responden correctamente
2. **Tiempo de Respuesta**: Tiempo promedio por pregunta
3. **Acciones Extraídas**: % de respuestas que generan acciones válidas
4. **Errores**: Tipos y frecuencia de errores
5. **Cobertura**: % de preguntas probadas (meta: 100% de las 1,000)

---

## ✅ Checklist de Implementación

- [ ] Verificar endpoints del backend funcionan
- [ ] Crear helpers de testing con datos reales
- [ ] Crear tests de integración con preguntas reales
- [ ] Crear tests de integración con acciones reales
- [ ] Actualizar tests existentes para usar datos reales
- [ ] Crear scripts de testing automatizado
- [ ] Ejecutar tests y validar resultados
- [ ] Generar reportes de resultados

---

## 🔧 Comandos para Ejecutar

```bash
# Ejecutar tests de integración
cd apps/copilot
pnpm test-app integration/

# Ejecutar script de testing
bash scripts/test-backend-real.sh

# Ejecutar TestSuite completo
bash scripts/run-testsuite.sh
```

---

**Próximo Paso**: Verificar endpoints reales y crear helpers de testing
