# Test Helpers - Tests con Datos Reales del Backend

## 📋 Descripción

Helpers y tests de integración para ejecutar tests usando las **1,000 preguntas** y **300-600 acciones** guardadas en el backend real.

## 🚀 Uso

### Opción 1: Ejecutar desde Navegador (Recomendado)

Los tests de integración requieren conexión real al backend. La mejor forma es usar el **TestSuite** desde la UI:

1. Abrir: `https://chat-test.bodasdehoy.com/admin/test-suite`
2. Seleccionar preguntas (o todas las 1,000)
3. Ejecutar tests
4. Ver resultados en tiempo real

### Opción 2: Ejecutar Tests de Integración (Requiere VPN)

```bash
cd apps/copilot

# Configurar URL del backend
export NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com

# Ejecutar tests
pnpm test-app test-helpers/integration/

# O saltar tests si hay problemas de DNS
SKIP_BACKEND_TESTS=true pnpm test-app test-helpers/integration/
```

### Opción 3: Usar Helpers en Tests Existentes

```typescript
import { getTestQuestions, runTestWithQuestion } from '@/test-helpers/backend';

describe('Mi Test', () => {
  it('debe usar pregunta real', async () => {
    const questions = await getTestQuestions(1);
    const result = await runTestWithQuestion(questions[0]);
    expect(result.success).toBe(true);
  });
});
```

## 📁 Archivos

- `backend.ts` - Helpers para conectar con backend real
- `integration/questions.test.ts` - Tests con las 1,000 preguntas
- `integration/actions.test.ts` - Tests con las 300-600 acciones

## ⚠️ Notas Importantes

- Los tests requieren **VPN activa** para acceder al backend
- Pueden requerir **autenticación** (JWT token)
- Si hay problemas de DNS, los tests se saltan automáticamente
- Para testing completo, usar el TestSuite desde la UI

## 🔧 Configuración

Variables de entorno:
- `NEXT_PUBLIC_BACKEND_URL` - URL del backend (default: `https://api-ia.bodasdehoy.com`)
- `SKIP_BACKEND_TESTS` - Saltar tests si hay problemas de conexión
