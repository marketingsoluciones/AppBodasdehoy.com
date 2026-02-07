# 🧪 Ejecutar Tests en Navegador

**Fecha**: 2026-01-25  
**Objetivo**: Ejecutar tests del TestSuite automáticamente desde el navegador

---

## 🚀 Formas de Ejecutar Tests en Navegador

### Opción 1: Script con Playwright (Recomendado)

```bash
# Ejecutar 10 tests
node scripts/test-navegador-playwright.mjs

# Ejecutar N tests específicos
node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 50

# Ejecutar desde localhost
node scripts/test-navegador-playwright.mjs http://localhost:3210/bodasdehoy/admin/tests 20
```

**Qué hace**:
1. ✅ Abre el navegador automáticamente
2. ✅ Navega al TestSuite
3. ✅ Espera a que carguen los tests
4. ✅ Selecciona los primeros N tests
5. ✅ Hace click en "Run Tests"
6. ✅ Monitorea el progreso
7. ✅ Toma screenshot del resultado
8. ✅ Muestra estadísticas finales

### Opción 2: Script Bash con Playwright

```bash
./scripts/ejecutar-tests-navegador.sh [url] [num-tests]
```

### Opción 3: Manual desde Navegador

1. Abre el TestSuite:
   ```
   https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
   ```

2. Selecciona los tests que quieres ejecutar (checkbox)

3. Haz click en "Run Tests"

4. Observa el progreso en el banner azul

---

## 📋 Requisitos

### Playwright

Si Playwright no está instalado:

```bash
# Instalar Playwright
cd apps/copilot
npm install -D playwright

# O instalar globalmente
npm install -g playwright
npx playwright install chromium
```

### Node.js

Se requiere Node.js >= 18.0.0

```bash
node --version
```

---

## 🎯 Ejemplo de Uso

### Ejecutar 10 Tests

```bash
node scripts/test-navegador-playwright.mjs
```

**Salida esperada**:
```
🧪 Ejecutando tests en navegador...
📍 URL: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
📊 Tests a ejecutar: 10

🌐 Abriendo: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
⏳ Esperando a que cargue el TestSuite...
✅ TestSuite cargado
📋 Tests disponibles: 1000
✅ Seleccionando los primeros 10 tests...
✅ 10 tests seleccionados

🚀 Ejecutando tests...
✅ Botón "Run Tests" presionado

⏳ Esperando a que inicien los tests...
✅ Tests iniciados

📊 Monitoreando progreso...
   Progreso: 1 / 10
   Progreso: 2 / 10
   ...
   Progreso: 10 / 10

✅ Tests completados

📸 Tomando screenshot del resultado...
✅ Screenshot guardado en: /tmp/testsuite-result.png

📊 Resultados finales:
   Estadísticas: 8/10 passed (80%)
   Passed: 8
   Failed: 2
   Total: 10
```

---

## 📸 Screenshots

Los scripts guardan screenshots automáticamente:

- `/tmp/testsuite-result.png` - Resultado final
- `/tmp/testsuite-no-tests.png` - Si no hay tests disponibles
- `/tmp/testsuite-error.png` - Si hay un error

---

## 🔍 Monitoreo en Tiempo Real

El script monitorea:
- ✅ Carga del TestSuite
- ✅ Selección de tests
- ✅ Inicio de ejecución
- ✅ Progreso (cada segundo)
- ✅ Finalización
- ✅ Resultados finales

---

## ⚙️ Configuración

### Cambiar URL

Edita el script o pasa como argumento:
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

### Error: "Playwright no está disponible"

**Solución**:
```bash
cd apps/copilot
npm install -D playwright
npx playwright install chromium
```

### Error: "No hay tests disponibles"

**Causas**:
1. Backend no está corriendo
2. No hay autenticación válida
3. No hay tests en la base de datos

**Solución**:
- Verifica que el backend esté corriendo
- Verifica autenticación en el navegador
- Verifica que haya tests: `curl http://localhost:8030/api/admin/tests/questions`

### Error: "No se encontró el botón Run Tests"

**Causas**:
1. Tests no están seleccionados
2. Botón tiene otro texto

**Solución**:
- Verifica que los checkboxes estén marcados
- Revisa el screenshot en `/tmp/testsuite-error.png`

---

## ✅ Checklist

- [ ] Playwright instalado
- [ ] Node.js >= 18.0.0
- [ ] Backend corriendo
- [ ] Autenticación válida
- [ ] Tests disponibles en backend

---

**Estado**: ✅ Scripts creados, listo para ejecutar tests en navegador
