# ✅ Resumen: Ejecutar Tests en Navegador

**Fecha**: 2026-01-25  
**Estado**: ✅ Scripts creados y listos para ejecutar

---

## 🚀 Scripts Creados

### 1. Script Principal: `test-navegador-playwright.mjs`

**Ubicación**: `scripts/test-navegador-playwright.mjs`

**Uso**:
```bash
# Ejecutar 5 tests
node scripts/test-navegador-playwright.mjs

# Ejecutar N tests específicos
node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 10

# Desde localhost
node scripts/test-navegador-playwright.mjs http://localhost:3210/bodasdehoy/admin/tests 20
```

**Qué hace**:
1. ✅ Abre navegador Chromium automáticamente
2. ✅ Navega al TestSuite
3. ✅ Espera a que carguen los tests
4. ✅ Selecciona los primeros N tests
5. ✅ Hace click en "Run Tests"
6. ✅ Monitorea el progreso en tiempo real
7. ✅ Toma screenshot del resultado final
8. ✅ Muestra estadísticas completas

### 2. Script Bash Alternativo: `ejecutar-tests-navegador.sh`

**Ubicación**: `scripts/ejecutar-tests-navegador.sh`

**Uso**:
```bash
./scripts/ejecutar-tests-navegador.sh [url] [num-tests]
```

---

## 📋 Requisitos

### Playwright Instalado

```bash
cd apps/copilot
npx playwright install chromium
```

### Node.js

Se requiere Node.js >= 18.0.0 (tienes v24.9.0 ✅)

---

## 🎯 Ejemplo de Ejecución

```bash
# Ejecutar 5 tests
node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 5
```

**Salida esperada**:
```
🧪 Ejecutando tests en navegador...
📍 URL: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
📊 Tests a ejecutar: 5

🌐 Abriendo: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
⏳ Esperando a que cargue el TestSuite...
✅ TestSuite cargado
📋 Tests disponibles: 1000
✅ Seleccionando los primeros 5 tests...
✅ 5 tests seleccionados

🚀 Ejecutando tests...
✅ Botón "Run Tests" presionado

⏳ Esperando a que inicien los tests...
✅ Tests iniciados

📊 Monitoreando progreso...
   Progreso: 1 / 5
   Progreso: 2 / 5
   ...
   Progreso: 5 / 5

✅ Tests completados

📸 Tomando screenshot del resultado...
✅ Screenshot guardado en: /tmp/testsuite-result.png

📊 Resultados finales:
   Estadísticas: 4/5 passed (80%)
   Passed: 4
   Failed: 1
   Total: 5
```

---

## 📸 Screenshots Automáticos

Los scripts guardan screenshots automáticamente:

- `/tmp/testsuite-result.png` - Resultado final de los tests
- `/tmp/testsuite-no-tests.png` - Si no hay tests disponibles
- `/tmp/testsuite-error.png` - Si hay un error durante la ejecución

---

## 🔍 Monitoreo en Tiempo Real

El script monitorea:
- ✅ Carga del TestSuite
- ✅ Número de tests disponibles
- ✅ Selección de tests
- ✅ Inicio de ejecución
- ✅ Progreso (actualizado cada segundo)
- ✅ Finalización
- ✅ Resultados finales (passed/failed/total)

---

## ⚙️ Configuración

### Cambiar URL

```bash
node scripts/test-navegador-playwright.mjs http://localhost:3210/bodasdehoy/admin/tests
```

### Cambiar Número de Tests

```bash
node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 100
```

### Modo Headless (sin ventana)

Edita el script y cambia:
```javascript
browser = await chromium.launch({ 
  headless: true, // Cambiar a true
});
```

---

## 🐛 Solución de Problemas

### Error: "Executable doesn't exist"

**Solución**:
```bash
cd apps/copilot
npx playwright install chromium
```

### Error: "No hay tests disponibles"

**Causas**:
1. Backend no está corriendo
2. No hay autenticación válida
3. No hay tests en la base de datos

**Solución**:
- Verifica backend: `curl http://localhost:8030/api/admin/tests/questions`
- Verifica autenticación en el navegador
- Verifica que haya tests en la base de datos

### Error: "No se encontró el botón Run Tests"

**Causas**:
1. Tests no están seleccionados
2. Botón tiene otro texto

**Solución**:
- Verifica que los checkboxes estén marcados
- Revisa el screenshot en `/tmp/testsuite-error.png`

---

## ✅ Checklist

- [x] Scripts creados
- [x] Playwright disponible en `apps/copilot`
- [ ] Playwright browsers instalados (`npx playwright install chromium`)
- [ ] Backend corriendo
- [ ] Autenticación válida
- [ ] Tests disponibles en backend

---

## 🎬 Próximos Pasos

1. **Instalar Playwright browsers**:
   ```bash
   cd apps/copilot
   npx playwright install chromium
   ```

2. **Ejecutar tests**:
   ```bash
   node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 5
   ```

3. **Ver resultados**:
   - Observa el navegador abierto
   - Revisa el screenshot en `/tmp/testsuite-result.png`
   - Lee los resultados en la consola

---

**Estado**: ✅ Scripts listos, instalando Playwright browsers para ejecutar
