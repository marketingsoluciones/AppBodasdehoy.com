# 🚀 Siguientes Pasos: Verificación y Testing

**Fecha**: 2026-01-25  
**Estado**: Fix i18n completado ✅ - Listo para verificación y testing

---

## ✅ Paso 1: Verificar que el Fix de i18n Funciona

### Objetivo
Confirmar que `ErrorCapture` ya no muestra marcadores sin resolver (`error.title`, `error.desc`)

### Acciones

1. **Abrir cualquier página que pueda tener error**:
   - Puede ser una página que no existe (404)
   - O forzar un error para probar

2. **Verificar que los mensajes son legibles**:
   - ✅ Debe mostrar: "Se ha producido un problema en la página.."
   - ✅ Debe mostrar: "Inténtalo de nuevo más tarde, o regresa al mundo conocido"
   - ✅ Debe mostrar: "Reintentar" y "Volver a la página de inicio"
   - ❌ NO debe mostrar: `error.title`, `error.desc`, `error.retry`, `error.backHome`

3. **Si ves marcadores sin resolver**:
   - Reiniciar el servidor de desarrollo
   - Limpiar caché del navegador
   - Verificar que los cambios están aplicados

---

## ✅ Paso 2: Acceder al TestSuite UI Correctamente

### Objetivo
Asegurarse de que accedes al frontend del TestSuite, no al backend

### URL Correcta

**Frontend (TestSuite UI)**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

**O si chat-test da 502**:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/tests
```

### Qué Deberías Ver

✅ **Interfaz del TestSuite**:
- Header con "Test Suite" o similar
- Tabla con columnas: Checkbox, Question, Category, Difficulty, Status, Score, Time
- Botones: "Run Tests", "Reset", "Stop"
- Filtros: Por categoría, dificultad, búsqueda
- Contador: "X tests disponibles"
- Estadísticas: Total, Passed, Failed, Pending

❌ **NO deberías ver**:
- JSON del backend (`{"message": "Lobe Chat Harbor..."}`)
- Página en blanco
- Error 502 sin fallback
- Marcadores `error.title` o `error.desc`

### Script para Abrir Automáticamente

```bash
./scripts/abrir-testsuite-url-correcta.sh
```

Este script:
- ✅ Detecta la URL correcta automáticamente
- ✅ Verifica conectividad
- ✅ Abre el navegador con la URL correcta
- ✅ Proporciona instrucciones claras

---

## ✅ Paso 3: Verificar Backend IA

### Objetivo
Confirmar que el backend de IA está funcionando antes de ejecutar tests

### Script de Verificación

```bash
node scripts/verificar-backend-ia.mjs
```

### Resultado Esperado

✅ **Backend funcionando**:
- HTTP 200 o respuesta válida
- Endpoint accesible
- Sin errores de conexión

❌ **Si hay problemas**:
- Verificar que `api-ia.bodasdehoy.com` esté funcionando
- Verificar configuración de proveedores
- Revisar logs del backend

---

## ✅ Paso 4: Ejecutar Tests desde TestSuite UI

### Objetivo
Ejecutar los tests de preguntas y acciones para validar el sistema

### Pasos Detallados

1. **Abrir TestSuite**:
   ```bash
   ./scripts/abrir-testsuite-url-correcta.sh
   ```

2. **Verificar que carga correctamente**:
   - ✅ Tabla visible con tests
   - ✅ Contador muestra "X tests disponibles"
   - ✅ No hay errores en consola (F12)

3. **Seleccionar tests**:
   - Marcar checkboxes de los tests que quieres ejecutar
   - Puedes seleccionar todos o un subconjunto
   - Recomendado: Empezar con 10-20 tests para probar

4. **Ejecutar tests**:
   - Click en botón **"Run Tests"**
   - Observar:
     - 🚀 Banner azul: "Ejecutando tests..."
     - 📊 Progreso: "Progreso: X / Y"
     - ⏳ Spinner animado

5. **Monitorear ejecución**:
   - Ver progreso en tiempo real
   - Verificar que los tests se ejecutan correctamente
   - Observar resultados en la tabla

6. **Verificar resultados**:
   - Estado de cada test (passed/failed)
   - Score y tiempo de ejecución
   - Estadísticas finales
   - Detalles de errores si hay

---

## ✅ Paso 5: Verificar Resultados y Diagnosticar Problemas

### Objetivo
Analizar los resultados y corregir cualquier problema encontrado

### Checklist de Verificación

- [ ] Tests ejecutados correctamente
- [ ] Resultados visibles en tabla
- [ ] Estadísticas finales correctas
- [ ] No hay errores de proveedor
- [ ] No hay errores de i18n (marcadores sin resolver)
- [ ] No hay errores de red (502, timeout, etc.)

### Si Hay Problemas

#### Problema: Tests no se ejecutan
- Verificar backend IA: `node scripts/verificar-backend-ia.mjs`
- Abrir DevTools (F12) → Console → Buscar errores
- Verificar autenticación y permisos

#### Problema: Errores de proveedor
- Verificar configuración de proveedores en Settings → LLM
- Verificar API keys válidas
- Revisar logs del backend IA

#### Problema: Errores de i18n
- Verificar que el fix esté aplicado
- Reiniciar servidor si es necesario
- Limpiar caché del navegador

#### Problema: Errores de red (502, timeout)
- Verificar conectividad: `node scripts/verificar-backend-ia.mjs`
- Verificar VPN (puede estar bloqueando)
- Probar con chat producción si chat-test falla

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

## 🎯 Comandos Rápidos

### Verificación Completa (Recomendado)

```bash
# Script completo que verifica todo y abre TestSuite
./scripts/ejecutar-testsuite-completo.sh
```

### Pasos Individuales

```bash
# 1. Verificar backend IA
node scripts/verificar-backend-ia.mjs

# 2. Abrir TestSuite con URL correcta
./scripts/abrir-testsuite-url-correcta.sh

# 3. Diagnosticar problemas (si hay)
node scripts/diagnosticar-error-proveedor.mjs
```

---

## ✅ Checklist de Ejecución

### Antes de Ejecutar Tests

- [ ] Fix de i18n verificado (no aparecen marcadores sin resolver)
- [ ] Backend IA verificado (`node scripts/verificar-backend-ia.mjs`)
- [ ] TestSuite carga correctamente (interfaz visible, no JSON)
- [ ] Autenticación válida (estás logueado)
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

## 🚀 Próximos Pasos Después de Ejecutar Tests

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
2. **`scripts/abrir-testsuite-url-correcta.sh`** - Abrir TestSuite con URL correcta
3. **`scripts/verificar-backend-ia.mjs`** - Verificar backend IA
4. **`scripts/diagnosticar-error-proveedor.mjs`** - Diagnóstico completo

---

## 🎯 Acción Inmediata

**Ejecutar este comando ahora**:
```bash
./scripts/ejecutar-testsuite-completo.sh
```

Este script:
- ✅ Verifica backend IA
- ✅ Verifica conectividad
- ✅ Abre TestSuite con URL correcta
- ✅ Proporciona instrucciones detalladas

---

**Estado**: ✅ Listo para ejecutar - Sigue los pasos en orden o usa el script completo
