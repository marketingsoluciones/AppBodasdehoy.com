# 🧪 Instrucciones para Ejecutar Tests con Datos Reales

**Fecha**: 2026-01-25  
**Datos**: 1,000 preguntas y 300-600 acciones guardadas en el backend

---

## ✅ Método Recomendado: TestSuite desde la UI

### Paso 1: Acceder al TestSuite
1. Abrir navegador con VPN activa
2. Ir a: `https://chat-test.bodasdehoy.com/admin/test-suite`
3. O localmente: `http://localhost:3210/admin/test-suite`

### Paso 2: Ejecutar Tests
1. **Ver preguntas disponibles**: Las 1,000 preguntas se cargan automáticamente
2. **Seleccionar preguntas**:
   - Seleccionar todas (checkbox superior)
   - O seleccionar preguntas específicas
3. **Configurar modelo**:
   - Modelo: `claude-3-5-sonnet-20241022`
   - Provider: `anthropic`
4. **Ejecutar**: Click en "Ejecutar Tests"
5. **Ver resultados**: Los resultados se muestran en tiempo real

### Paso 3: Comparar Modelos (Opcional)
1. Activar "Comparar Modelos"
2. Seleccionar modelos a comparar
3. Ejecutar comparación
4. Ver resultados lado a lado

---

## 🔧 Método Alternativo: Scripts de Terminal

### Requisitos Previos
```bash
# Configurar variables de entorno
export BACKEND_URL="https://api-ia.bodasdehoy.com"
export DEVELOPMENT="bodasdehoy"
export JWT_TOKEN="tu-token-jwt"  # Si es necesario
```

### Ejecutar Script de Testing
```bash
# Desde la raíz del proyecto
bash scripts/test-backend-real.sh
```

**Nota**: Requiere VPN activa y puede requerir autenticación.

---

## 🧪 Método: Tests de Integración (Vitest)

### Configuración
```bash
cd apps/copilot

# Configurar backend
export NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com

# Ejecutar tests
pnpm test-app test-helpers/integration/questions.test.ts
pnpm test-app test-helpers/integration/actions.test.ts
```

### Si hay Problemas de DNS
```bash
# Saltar tests automáticamente
SKIP_BACKEND_TESTS=true pnpm test-app test-helpers/integration/
```

---

## 📊 Endpoints del Backend

### Preguntas (1,000)
```
GET /api/admin/tests/questions
GET /api/admin/tests/questions?limit=10
GET /api/admin/tests/questions?category=wedding
GET /api/admin/tests/questions?difficulty=medium
```

### Acciones (300-600)
```
GET /api/admin/tests/actions  # Verificar endpoint real
GET /api/admin/actions
GET /api/tests/actions
```

### Ejecutar Tests
```
POST /api/admin/tests/run
Body: {
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic",
  "testIds": []  # Vacío = todas las preguntas
}
```

### Estadísticas
```
GET /api/admin/tests/stats
```

---

## 🔍 Verificación Rápida

### 1. Health Check
```bash
curl https://api-ia.bodasdehoy.com/health
```

### 2. Obtener Preguntas (requiere autenticación)
```bash
curl https://api-ia.bodasdehoy.com/api/admin/tests/questions?limit=5 \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 3. Ver Estadísticas
```bash
curl https://api-ia.bodasdehoy.com/api/admin/tests/stats \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

---

## ⚠️ Problemas Comunes

### Error: ENOTFOUND (DNS)
**Causa**: No se puede resolver el dominio  
**Solución**: 
- Activar VPN
- Verificar DNS
- Usar TestSuite desde navegador (mejor opción)

### Error: EPERM (Permisos)
**Causa**: macOS bloquea conexiones de red  
**Solución**:
- Verificar permisos de Terminal/Cursor
- Usar TestSuite desde navegador

### Error: 401/403 (Autenticación)
**Causa**: Falta token JWT  
**Solución**:
- Obtener token desde dev-login
- Configurar `JWT_TOKEN` en variables de entorno
- O usar TestSuite desde navegador (ya tiene autenticación)

---

## ✅ Recomendación Final

**Para testing completo con datos reales**, usa el **TestSuite desde la UI**:
- ✅ No requiere configuración de DNS
- ✅ Ya tiene autenticación configurada
- ✅ Interfaz visual para ver resultados
- ✅ Comparación de modelos integrada
- ✅ Estadísticas en tiempo real

**URL**: `https://chat-test.bodasdehoy.com/admin/test-suite`

---

**Estado**: ✅ Plan implementado, listo para ejecutar desde TestSuite UI
