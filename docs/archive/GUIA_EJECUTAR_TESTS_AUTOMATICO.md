# 🤖 Guía: Ejecutar Tests Automáticamente

**Fecha**: 2026-01-26  
**Objetivo**: Automatizar la ejecución de tests del TestSuite usando Playwright

---

## 🚀 Script de Ejecución Automática

### Script Disponible

**`scripts/ejecutar-tests-automatico.mjs`**

Este script:
- ✅ Abre TestSuite en Chromium automáticamente
- ✅ Selecciona tests (todos o un número específico)
- ✅ Ejecuta tests automáticamente
- ✅ Monitorea progreso en tiempo real
- ✅ Guarda screenshots antes y después
- ✅ Extrae y guarda resultados en JSON
- ✅ Mantiene navegador abierto para revisión manual

---

## 📋 Uso

### Opción 1: Ejecutar Número Específico de Tests

```bash
node scripts/ejecutar-tests-automatico.mjs 10
```

**Ejecuta**: Los primeros 10 tests

---

### Opción 2: Ejecutar Todos los Tests

```bash
node scripts/ejecutar-tests-automatico.mjs --all
```

**Ejecuta**: Todos los tests disponibles

---

### Opción 3: Ejecutar por Defecto (10 tests)

```bash
node scripts/ejecutar-tests-automatico.mjs
```

**Ejecuta**: 10 tests por defecto

---

## ⚙️ Requisitos

### Instalar Playwright

Antes de usar el script, instala Playwright:

```bash
npx playwright install chromium
```

**Tiempo estimado**: 2-5 minutos  
**Tamaño**: ~200 MB

---

## 📊 Qué Hace el Script

### Paso 1: Abrir TestSuite

1. Lanza Chromium visible
2. Navega al TestSuite automáticamente
3. Espera a que cargue completamente

---

### Paso 2: Seleccionar Tests

**Si usas `--all`**:
- Selecciona todos los tests usando el checkbox del header
- O selecciona manualmente todos los checkboxes

**Si especificas un número**:
- Selecciona los primeros N tests
- Ejemplo: `10` selecciona los primeros 10 tests

---

### Paso 3: Ejecutar Tests

1. Busca el botón "Run Tests"
2. Hace click automáticamente
3. Espera a que aparezca el banner de progreso
4. Monitorea el progreso en tiempo real

---

### Paso 4: Monitorear Progreso

El script monitorea:
- ✅ Banner de progreso visible
- ✅ Contador: "X / Y"
- ✅ Estado de ejecución (running/stopped)
- ✅ Tiempo máximo: 5 minutos

**Muestra en consola**:
```
📈 Progreso: 5 / 10
📈 Progreso: 8 / 10
📈 Progreso: 10 / 10
✅ Todos los tests completados
```

---

### Paso 5: Extraer Resultados

Después de la ejecución:
1. Toma screenshot final
2. Extrae resultados de la tabla
3. Cuenta tests pasados/fallidos
4. Guarda resultados en JSON

**Archivos generados**:
- `.screenshots/tests-before-*.png` - Antes de ejecutar
- `.screenshots/tests-after-*.png` - Después de ejecutar
- `.test-results/results-*.json` - Resultados en JSON

---

## 📁 Archivos Generados

### Screenshots

**Ubicación**: `.screenshots/`

- `tests-before-*.png` - Estado antes de ejecutar
- `tests-after-*.png` - Estado después de ejecutar

**Ver en Cursor**:
- Navega a `.screenshots/` en el explorador
- Click en cualquier imagen para previsualizar

---

### Resultados JSON

**Ubicación**: `.test-results/`

**Formato**:
```json
{
  "timestamp": "2026-01-26T12:00:00.000Z",
  "total": 10,
  "passed": 8,
  "failed": 2,
  "results": [
    {
      "status": "passed",
      "score": "85%"
    },
    {
      "status": "failed",
      "score": "45%"
    }
  ]
}
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Probar con Pocos Tests

```bash
# Ejecutar solo 5 tests para probar
node scripts/ejecutar-tests-automatico.mjs 5
```

**Ideal para**: Verificar que todo funciona antes de ejecutar muchos tests

---

### Ejemplo 2: Ejecutar Suite Completa

```bash
# Ejecutar todos los tests disponibles
node scripts/ejecutar-tests-automatico.mjs --all
```

**Ideal para**: Ejecución completa de todos los tests

---

### Ejemplo 3: Ejecución por Defecto

```bash
# Ejecutar 10 tests (por defecto)
node scripts/ejecutar-tests-automatico.mjs
```

**Ideal para**: Ejecución rápida de prueba

---

## 🔍 Monitoreo en Tiempo Real

El script muestra en tiempo real:

```
🚀 Lanzando Chromium...
🌐 Navegando a: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
✅ TestSuite cargado

🔍 Analizando tests disponibles...
   Tests disponibles: 1000

📋 Seleccionando tests...
   ✅ 10 tests seleccionados

▶️  Ejecutando tests...
   ✅ Botón "Run Tests" presionado
   ⏳ Esperando banner de progreso...
   ✅ Banner de progreso visible

📊 Monitoreando ejecución...
   📈 Progreso: 2 / 10
   📈 Progreso: 5 / 10
   📈 Progreso: 8 / 10
   📈 Progreso: 10 / 10
   ✅ Todos los tests completados

📊 Extrayendo resultados...
   ✅ Tests pasados: 8
   ❌ Tests fallidos: 2
   📊 Total: 10
   💾 Resultados guardados: .test-results/results-*.json

✅ Ejecución completada
```

---

## 🐛 Troubleshooting

### Error: "Executable doesn't exist"

**Solución**:
```bash
npx playwright install chromium
```

---

### Error: "No se encontró la tabla de tests"

**Causas posibles**:
- TestSuite no cargó correctamente
- Problema de autenticación
- URL incorrecta

**Solución**:
1. Verificar que el TestSuite carga manualmente
2. Verificar autenticación
3. Verificar URL en `.env.production`

---

### Error: "No se encontró el botón Run Tests"

**Causas posibles**:
- Tests no seleccionados
- Botón deshabilitado
- Interfaz diferente

**Solución**:
1. Verificar que hay tests seleccionados
2. Verificar manualmente en el navegador
3. Revisar screenshot antes de ejecutar

---

### Tests no se ejecutan

**Causas posibles**:
- Backend IA no responde
- Problema de red
- Timeout

**Solución**:
1. Verificar backend IA: `node scripts/verificar-testsuite-estado.mjs`
2. Verificar desde navegador manualmente
3. Revisar logs en consola del navegador (F12)

---

## ✅ Checklist

### Antes de Ejecutar

- [ ] Playwright instalado: `npx playwright install chromium`
- [ ] TestSuite accesible desde navegador
- [ ] Autenticación válida
- [ ] Backend IA funcionando

### Durante la Ejecución

- [ ] Navegador se abre correctamente
- [ ] TestSuite carga
- [ ] Tests se seleccionan
- [ ] Botón "Run Tests" funciona
- [ ] Progreso se muestra

### Después de la Ejecución

- [ ] Screenshots guardados
- [ ] Resultados en JSON
- [ ] Navegador abierto para revisión
- [ ] Resultados verificados

---

## 📚 Scripts Relacionados

1. **`scripts/ejecutar-tests-automatico.mjs`** - Este script (ejecución automática)
2. **`scripts/abrir-testsuite-playwright.mjs`** - Abrir TestSuite interactivo
3. **`scripts/ver-testsuite-cursor.mjs`** - Ver estado rápidamente
4. **`scripts/verificar-testsuite-estado.mjs`** - Verificar estado sin Playwright

---

## 🎯 Próximos Pasos

1. **Instalar Playwright**:
   ```bash
   npx playwright install chromium
   ```

2. **Ejecutar script**:
   ```bash
   node scripts/ejecutar-tests-automatico.mjs 10
   ```

3. **Revisar resultados**:
   - Screenshots en `.screenshots/`
   - Resultados en `.test-results/`
   - Navegador abierto para revisión manual

---

**Estado**: ✅ Script listo - Instala Playwright y ejecuta para automatizar tests
