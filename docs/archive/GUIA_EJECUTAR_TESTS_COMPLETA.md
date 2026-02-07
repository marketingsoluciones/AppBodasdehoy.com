# 🧪 Guía Completa: Ejecutar Tests Después del Fix i18n

**Fecha**: 2026-01-25  
**Estado**: Fix i18n completado ✅ - Listo para testing

---

## ✅ Estado Actual

### Fixes Implementados

1. ✅ **Fix de error i18n**: ErrorCapture ahora muestra textos legibles
2. ✅ **Fix de error 502**: Fallback automático de chat-test a chat producción
3. ✅ **Logging mejorado**: Mejor diagnóstico de errores de proveedor

### Servicios Verificados

- ✅ chat-test: Funcionando (con fallback automático)
- ✅ app-test: Funcionando según usuario
- ⏳ Backend IA: Necesita verificación

---

## 🚀 Ejecutar Tests - Guía Paso a Paso

### Opción 1: Script Completo (Recomendado) ⚡

**Script**: `scripts/ejecutar-testsuite-completo.sh`

**Qué hace**:
1. ✅ Verifica configuración
2. ✅ Verifica backend IA
3. ✅ Verifica conectividad con TestSuite
4. ✅ Abre TestSuite en navegador
5. ✅ Proporciona instrucciones detalladas

**Ejecutar**:
```bash
./scripts/ejecutar-testsuite-completo.sh
```

---

### Opción 2: Scripts Individuales

#### A. Verificar Backend IA

```bash
node scripts/verificar-backend-ia.mjs
```

**Qué verifica**:
- Conectividad con `api-ia.bodasdehoy.com`
- Endpoint de salud (si existe)
- Configuración de variables de entorno

---

#### B. Abrir TestSuite

```bash
./scripts/abrir-testsuite.sh
```

**Qué hace**:
- Detecta URL automáticamente
- Verifica conectividad
- Abre TestSuite en navegador

---

#### C. Diagnosticar Errores de Proveedor

```bash
node scripts/diagnosticar-error-proveedor.mjs
```

**Qué verifica**:
- Estado de chat-test y app-test
- Estado de backend IA
- Configuración de proveedores

---

### Opción 3: Manual desde Navegador

**Pasos**:

1. **Abrir TestSuite**:
   ```
   https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
   ```
   O si chat-test no funciona:
   ```
   https://chat.bodasdehoy.com/bodasdehoy/admin/tests
   ```

2. **Verificar que carga correctamente**:
   - ✅ Debe mostrar tabla de tests
   - ✅ Debe mostrar contador: "X tests disponibles"
   - ✅ NO debe mostrar "error.title" o "error.desc"

3. **Seleccionar tests**:
   - Marcar checkboxes de los tests que quieres ejecutar
   - Puedes seleccionar todos o un subconjunto

4. **Ejecutar tests**:
   - Click en botón "Run Tests"
   - Observar progreso en banner azul
   - Ver resultados en tabla

5. **Verificar resultados**:
   - Estado de cada test (passed/failed)
   - Detalles de errores si hay
   - Estadísticas finales

---

## 🔍 Verificaciones Previas

### 1. Verificar Fix de i18n

**Antes de ejecutar tests, verifica que el fix funciona**:

1. Abrir cualquier página que pueda tener error
2. Si aparece ErrorCapture, verificar que muestre:
   - ✅ "Se ha producido un problema en la página.." (no `error.title`)
   - ✅ "Inténtalo de nuevo más tarde..." (no `error.desc`)
   - ✅ "Reintentar" (no `error.retry`)
   - ✅ "Volver a la página de inicio" (no `error.backHome`)

**Si ves marcadores sin resolver**: El fix no está aplicado o no se recompiló

---

### 2. Verificar Backend IA

**Ejecutar**:
```bash
node scripts/verificar-backend-ia.mjs
```

**Resultado esperado**:
- ✅ HTTP 200 - Backend IA responde correctamente
- ✅ Endpoint de salud disponible (si existe)

**Si hay problemas**:
- ⚠️ Verificar desde navegador: `https://api-ia.bodasdehoy.com`
- ⚠️ Verificar logs del servidor
- ⚠️ Verificar configuración de proveedores

---

### 3. Verificar Conectividad

**Desde navegador** (no terminal con VPN):
- Abrir: `https://chat-test.bodasdehoy.com`
- Abrir: `https://api-ia.bodasdehoy.com`

**Si no funcionan desde terminal pero sí desde navegador**:
- ✅ Es normal (problema de VPN/DNS en terminal)
- ✅ El navegador puede resolver DNS correctamente

---

## 📊 Tests Disponibles

### Tests de Preguntas

- **Cantidad**: ~1,000 preguntas
- **Endpoint**: `/api/admin/tests/questions`
- **Propósito**: Validar respuestas del modelo de IA

### Tests de Acciones

- **Cantidad**: ~300-600 acciones
- **Endpoint**: `/api/admin/tests/actions`
- **Propósito**: Validar ejecución de acciones

---

## 🐛 Troubleshooting

### Problema: TestSuite no carga

**Síntomas**:
- Página en blanco
- Error 502
- Muestra "error.title" o "error.desc"

**Soluciones**:
1. Verificar que el servidor esté corriendo
2. Verificar autenticación (debes estar logueado)
3. Verificar VPN (puede estar bloqueando)
4. Probar con chat producción: `https://chat.bodasdehoy.com/bodasdehoy/admin/tests`

---

### Problema: Tests no se ejecutan

**Síntomas**:
- Tests seleccionados pero no ejecutan
- Banner de progreso no aparece
- No hay resultados

**Soluciones**:
1. Verificar backend IA: `node scripts/verificar-backend-ia.mjs`
2. Abrir DevTools (F12) → Console → Buscar errores
3. Verificar que hay tests seleccionados (checkboxes marcados)
4. Verificar autenticación y permisos

---

### Problema: Errores de proveedor

**Síntomas**:
- Tests fallan con error de proveedor
- Mensajes sobre API keys inválidas
- Backend IA no responde

**Soluciones**:
1. Verificar backend IA: `node scripts/verificar-backend-ia.mjs`
2. Verificar configuración de proveedores en Settings → LLM
3. Verificar API keys válidas
4. Revisar logs del backend IA

---

## ✅ Checklist de Ejecución

### Antes de Ejecutar Tests

- [ ] Fix de i18n verificado (no aparecen marcadores sin resolver)
- [ ] Backend IA verificado (`node scripts/verificar-backend-ia.mjs`)
- [ ] TestSuite carga correctamente
- [ ] Autenticación válida
- [ ] Tests visibles en la tabla

### Durante la Ejecución

- [ ] Tests seleccionados correctamente
- [ ] Banner de progreso aparece
- [ ] Progreso se actualiza correctamente
- [ ] No hay errores en Console (F12)

### Después de la Ejecución

- [ ] Resultados visibles en tabla
- [ ] Estadísticas finales correctas
- [ ] Errores documentados (si hay)
- [ ] Screenshots tomados (si es necesario)

---

## 🎯 Próximos Pasos Después de Ejecutar Tests

1. **Analizar resultados**:
   - Revisar qué tests pasaron/fallaron
   - Identificar patrones en errores
   - Documentar problemas encontrados

2. **Corregir problemas**:
   - Si hay errores de proveedor: Verificar configuración
   - Si hay errores de i18n: Verificar que el fix esté aplicado
   - Si hay errores de red: Verificar conectividad

3. **Optimizar**:
   - Mejorar tests que fallan frecuentemente
   - Agregar más tests si es necesario
   - Mejorar manejo de errores

---

## 📚 Scripts Disponibles

1. **`scripts/ejecutar-testsuite-completo.sh`** - Script completo (recomendado)
2. **`scripts/abrir-testsuite.sh`** - Solo abrir TestSuite
3. **`scripts/verificar-backend-ia.mjs`** - Verificar backend IA
4. **`scripts/diagnosticar-error-proveedor.mjs`** - Diagnóstico completo
5. **`scripts/verificar-chat-test.sh`** - Verificar chat-test y app-test

---

## 🚀 Comando Rápido

**Para ejecutar todo de una vez**:
```bash
./scripts/ejecutar-testsuite-completo.sh
```

Este script:
- ✅ Verifica backend IA
- ✅ Verifica conectividad
- ✅ Abre TestSuite
- ✅ Proporciona instrucciones

---

**Estado**: ✅ Listo para ejecutar tests - Usa el script completo o sigue la guía manual
