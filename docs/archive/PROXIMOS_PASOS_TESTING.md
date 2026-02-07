# 🚀 Próximos Pasos: Ejecutar Tests del TestSuite

**Fecha**: 2026-01-26  
**Estado**: TestSuite abierto - Listo para ejecutar tests

---

## ✅ Estado Actual

- ✅ Scripts creados y funcionando
- ✅ TestSuite abierto en navegador
- ✅ Fix de i18n implementado
- ✅ Herramientas de visualización disponibles

---

## 🎯 Pasos para Ejecutar Tests

### Paso 1: Verificar que el TestSuite Cargó Correctamente

**En el navegador que se abrió, verifica**:

✅ **Debes ver**:
- Interfaz web del TestSuite (no solo JSON)
- Tabla con tests
- Contador: "X tests disponibles"
- Botones: "Run Tests", "Reset", "Stop"
- Filtros y estadísticas

❌ **NO debes ver**:
- Solo JSON: `{"message": "Lobe Chat Harbor..."}`
- Marcadores: `error.title` o `error.desc`
- Error 404 o 502

---

### Paso 2: Seleccionar Tests

**Opciones**:

1. **Seleccionar todos los tests**:
   - Click en el checkbox del header de la tabla
   - Esto selecciona todos los tests disponibles

2. **Seleccionar un subconjunto**:
   - Marcar checkboxes individuales de los tests que quieres ejecutar
   - Recomendado: Empezar con 10-20 tests para probar

3. **Filtrar antes de seleccionar**:
   - Usar filtros por categoría o dificultad
   - Luego seleccionar todos los filtrados

---

### Paso 3: Ejecutar Tests

1. **Verificar que hay tests seleccionados**:
   - Debe mostrar "X tests seleccionados" o similar

2. **Click en "Run Tests"**:
   - El botón debe estar habilitado si hay tests seleccionados

3. **Observar el progreso**:
   - Debe aparecer un banner azul: "Ejecutando tests..."
   - Debe mostrar progreso: "Progreso: X / Y"
   - Debe haber un spinner animado

---

### Paso 4: Monitorear Ejecución

**Durante la ejecución**:

- ✅ Ver progreso en tiempo real
- ✅ Ver estado de cada test (running/passed/failed)
- ✅ Ver actualización de estadísticas
- ✅ Ver logs en consola (F12 → Console)

**Si hay problemas**:
- Abrir DevTools (F12)
- Revisar pestaña "Console" para errores
- Revisar pestaña "Network" para requests fallidos

---

### Paso 5: Ver Resultados

**Después de la ejecución**:

1. **Revisar tabla de resultados**:
   - Estado de cada test (passed/failed)
   - Score de cada test
   - Tiempo de ejecución

2. **Revisar estadísticas**:
   - Total de tests ejecutados
   - Tests pasados vs fallidos
   - Promedio de score
   - Promedio de tiempo

3. **Revisar errores** (si hay):
   - Click en tests fallidos para ver detalles
   - Revisar mensajes de error
   - Documentar problemas encontrados

---

## 🔍 Verificación del Estado

### Script de Verificación

```bash
node scripts/verificar-testsuite-estado.mjs
```

Este script verifica:
- ✅ Backend IA responde correctamente
- ✅ Frontend TestSuite responde con HTML (no JSON)
- ✅ No hay errores de i18n detectables

---

## 🐛 Troubleshooting

### Problema: TestSuite muestra solo JSON

**Solución**:
1. Verificar URL exacta: `https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests`
2. Asegurarse de estar en el frontend, no en el backend
3. Verificar autenticación (debes estar logueado)

---

### Problema: Tests no se ejecutan

**Solución**:
1. Verificar que hay tests seleccionados (checkboxes marcados)
2. Verificar backend IA: `node scripts/verificar-testsuite-estado.mjs`
3. Abrir DevTools (F12) → Console → Buscar errores
4. Verificar autenticación y permisos

---

### Problema: Errores de proveedor

**Solución**:
1. Verificar backend IA: `node scripts/verificar-testsuite-estado.mjs`
2. Verificar configuración de proveedores en Settings → LLM
3. Verificar API keys válidas
4. Revisar logs del backend IA

---

### Problema: Marcadores `error.title` o `error.desc`

**Solución**:
1. Verificar que el fix de i18n esté aplicado
2. Reiniciar servidor si es necesario
3. Limpiar caché del navegador
4. Verificar que los cambios estén compilados

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

## ✅ Checklist de Ejecución

### Antes de Ejecutar

- [ ] TestSuite carga correctamente (interfaz visible)
- [ ] No hay errores de i18n (`error.title`, `error.desc`)
- [ ] Backend IA verificado (`node scripts/verificar-testsuite-estado.mjs`)
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

## 🎯 Comandos Útiles

### Verificar Estado

```bash
node scripts/verificar-testsuite-estado.mjs
```

### Abrir TestSuite

```bash
./scripts/abrir-testsuite-url-correcta.sh
```

### Ver Screenshots (con Playwright)

```bash
# Primero instalar Playwright
npx playwright install chromium

# Luego usar
node scripts/abrir-testsuite-playwright.mjs
```

---

## 📚 Documentación Relacionada

1. **`COMO_VER_TESTSUITE_EN_CURSOR.md`** - Guía completa de visualización
2. **`RESUMEN_HERRAMIENTAS_TESTSUITE.md`** - Resumen de herramientas
3. **`ESTADO_ACTUAL_TESTSUITE.md`** - Estado actual
4. **`PROXIMOS_PASOS_TESTING.md`** - Este documento

---

**Estado**: ✅ Listo para ejecutar tests - Sigue los pasos arriba
