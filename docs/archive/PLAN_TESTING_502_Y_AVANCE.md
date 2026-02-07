# 🧪 Plan de Testing: Manejo de 502 y Avance con Tests Reales

**Fecha**: 2026-01-25  
**Objetivo**: Mejorar manejo de 502 Bad Gateway y avanzar con testing usando datos reales

---

## 🔍 Análisis del Problema 502

### Causas Identificadas

1. **Cloudflare → Origen**: Servidor de origen no responde
2. **DNS**: Problemas de resolución (ENOTFOUND)
3. **VPN**: Ruteo diferente puede causar 502
4. **Timeout**: Servidor tarda demasiado (>100s)
5. **Firewall**: Bloquea conexiones de Cloudflare

### Estado Actual del Código

**Archivo**: `apps/web/components/Copilot/CopilotIframe.tsx`
- ✅ Maneja error 502 básico
- ✅ Muestra mensaje al usuario
- ⚠️ No tiene fallback automático
- ⚠️ No detecta tipo de error específico

---

## 🛠️ Mejoras Propuestas para Manejo de 502

### 1. Detección Mejorada de Errores

```typescript
// Detectar tipo específico de error
const detectErrorType = (error: any): 'dns' | '502' | 'timeout' | 'network' => {
  if (error?.code === 'ENOTFOUND' || error?.message?.includes('Could not resolve')) {
    return 'dns';
  }
  if (error?.status === 502 || error?.message?.includes('502')) {
    return '502';
  }
  if (error?.code === 'ETIMEDOUT' || error?.name === 'TimeoutError') {
    return 'timeout';
  }
  return 'network';
};
```

### 2. Fallback Automático

```typescript
// Si chat-test falla, intentar chat producción
const fallbackUrls = [
  'https://chat-test.bodasdehoy.com',
  'https://chat.bodasdehoy.com',  // Fallback a producción
];
```

### 3. Retry con Backoff Exponencial

```typescript
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### 4. Health Check Proactivo

```typescript
// Verificar salud del backend antes de cargar iframe
const checkBackendHealth = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
};
```

---

## 🧪 Plan de Testing con Datos Reales

### Fase 1: Testing del Manejo de 502 ⏳

#### 1.1 Test de Detección de Errores
- [ ] Crear test que simule error DNS
- [ ] Crear test que simule error 502
- [ ] Crear test que simule timeout
- [ ] Validar que se detecta correctamente el tipo de error

#### 1.2 Test de Fallback
- [ ] Test que verifica fallback a chat producción
- [ ] Test que verifica orden de URLs de fallback
- [ ] Test que valida que fallback funciona correctamente

#### 1.3 Test de Retry
- [ ] Test que valida retry con backoff
- [ ] Test que valida número máximo de reintentos
- [ ] Test que valida que falla después de max retries

### Fase 2: Testing con Preguntas Reales ⏳

#### 2.1 Usar TestSuite UI (Recomendado)
- [ ] Acceder a `/admin/test-suite`
- [ ] Cargar las 1,000 preguntas
- [ ] Ejecutar tests con diferentes modelos
- [ ] Validar resultados

#### 2.2 Tests de Integración Mejorados
- [ ] Mejorar manejo de errores DNS en tests
- [ ] Agregar retry automático en tests
- [ ] Validar que tests funcionan con VPN activa

### Fase 3: Testing de Acciones ⏳

#### 3.1 Verificar Endpoint de Acciones
- [ ] Probar `/api/admin/tests/actions`
- [ ] Probar `/api/admin/actions`
- [ ] Validar estructura de datos
- [ ] Crear tests con acciones reales

---

## 📋 Implementación Inmediata

### Paso 1: Mejorar Manejo de 502 en CopilotIframe

**Archivo**: `apps/web/components/Copilot/CopilotIframe.tsx`

**Cambios**:
1. Agregar detección de tipo de error
2. Implementar fallback automático
3. Agregar retry con backoff
4. Mejorar mensajes de error

### Paso 2: Crear Tests para Manejo de 502

**Archivo**: `apps/web/components/Copilot/__tests__/CopilotIframe.test.tsx`

**Tests**:
- Test de detección de error DNS
- Test de detección de error 502
- Test de fallback automático
- Test de retry

### Paso 3: Ejecutar Tests con Datos Reales

**Usar TestSuite UI**:
1. Abrir: `https://chat-test.bodasdehoy.com/admin/test-suite`
2. Ejecutar tests con las 1,000 preguntas
3. Validar resultados

---

## ✅ Checklist de Implementación

- [ ] Mejorar detección de errores en CopilotIframe
- [ ] Implementar fallback automático
- [ ] Agregar retry con backoff
- [ ] Crear tests para manejo de 502
- [ ] Ejecutar tests con datos reales desde TestSuite UI
- [ ] Validar que las 1,000 preguntas funcionan
- [ ] Verificar endpoint de las 300-600 acciones

---

## 🚀 Próximos Pasos

1. **AHORA**: Mejorar manejo de 502 en código
2. **Luego**: Crear tests para validar manejo de errores
3. **Después**: Ejecutar tests con datos reales desde TestSuite UI
4. **Finalmente**: Documentar resultados y mejoras

---

**Estado**: ⏳ En progreso - Mejorando manejo de 502 y avanzando con testing
