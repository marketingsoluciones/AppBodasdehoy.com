# 🖥️ Cómo Ver el TestSuite en Cursor usando Playwright

**Fecha**: 2026-01-25  
**Objetivo**: Visualizar y interactuar con el TestSuite directamente desde Cursor usando Playwright y Chromium

---

## ✅ Herramientas Disponibles

### 1. Scripts de Playwright

#### A. Abrir TestSuite Visible (Interactivo)

**Script**: `scripts/abrir-testsuite-playwright.mjs`

**Características**:
- ✅ Abre Chromium visible (headless: false) - puedes verlo e interactuar
- ✅ Toma screenshots automáticamente
- ✅ Lee contenido del DOM
- ✅ Intercepta requests/responses
- ✅ Captura console logs
- ✅ Guarda screenshots en `.screenshots/`

**Uso**:
```bash
node scripts/abrir-testsuite-playwright.mjs
```

**Qué hace**:
1. Detecta automáticamente la URL del TestSuite desde `.env.production`
2. Lanza Chromium en modo visible
3. Navega al TestSuite
4. Analiza el contenido (tabla, botones, contador)
5. Toma screenshot completo
6. Mantiene el navegador abierto para interacción
7. Guarda estado en `.testsuite-state.json`

**Screenshots guardados en**: `.screenshots/testsuite-YYYY-MM-DDTHH-MM-SS.png`

---

#### B. Visualizar TestSuite desde Cursor (Headless)

**Script**: `scripts/ver-testsuite-cursor.mjs`

**Características**:
- ✅ Modo headless (rápido, sin abrir navegador)
- ✅ Extrae información del DOM
- ✅ Toma screenshot completo
- ✅ Verifica errores de i18n
- ✅ Muestra información en terminal

**Uso**:
```bash
node scripts/ver-testsuite-cursor.mjs
```

**Qué hace**:
1. Abre TestSuite en modo headless
2. Extrae información (tabla, botones, contador)
3. Verifica que no haya errores de i18n
4. Toma screenshot completo
5. Muestra información en JSON
6. Guarda screenshot para visualización en Cursor

**Ideal para**: Ver el estado del TestSuite rápidamente sin abrir navegador

---

### 2. Script Existente: Browser Control

**Script**: `scripts/browser-control.ts`

**Características**:
- ✅ Control completo del navegador
- ✅ Comandos: open, screenshot, click, type, scroll, eval
- ✅ Mantiene sesión del navegador
- ✅ Logs de consola

**Uso**:
```bash
# Abrir URL
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests

# Tomar screenshot
npx ts-node scripts/browser-control.ts screenshot

# Ver logs de consola
npx ts-node scripts/browser-control.ts console 50

# Hacer click en elemento
npx ts-node scripts/browser-control.ts click "button:has-text('Run Tests')"

# Evaluar JavaScript
npx ts-node scripts/browser-control.ts eval "document.querySelector('table')?.rows.length"
```

---

### 3. Herramientas MCP del Navegador

**Estado**: Configurado pero requiere reiniciar Cursor

**Servidores MCP disponibles**:
- ✅ `chrome-devtools` - Chrome DevTools Protocol
- ✅ `browser-tools-mcp` - Browser Tools MCP

**Para activar**:
1. Reiniciar Cursor completamente
2. Verificar en Settings → Tools & MCP que los servidores estén conectados
3. Usar comandos MCP para interactuar con el navegador

**Capacidades MCP**:
- Ver pestañas abiertas
- Navegar a URLs
- Tomar screenshots
- Ejecutar JavaScript
- Ver console logs
- Interactuar con el DOM

---

## 🚀 Flujo de Trabajo Recomendado

### Opción 1: Visualización Rápida (Headless)

```bash
# Ver estado del TestSuite rápidamente
node scripts/ver-testsuite-cursor.mjs

# Ver screenshot en Cursor
# Abre: .screenshots/testsuite-view-*.png
```

**Ventajas**:
- ✅ Rápido (no abre navegador)
- ✅ Perfecto para verificar estado
- ✅ Screenshot disponible en Cursor

---

### Opción 2: Interacción Completa (Visible)

```bash
# Abrir TestSuite en navegador visible
node scripts/abrir-testsuite-playwright.mjs

# El navegador se abre y puedes:
# - Ver la interfaz completa
# - Interactuar con los tests
# - Ejecutar tests manualmente
# - Ver resultados en tiempo real
```

**Ventajas**:
- ✅ Navegador visible e interactivo
- ✅ Puedes ejecutar tests manualmente
- ✅ Ver resultados en tiempo real
- ✅ Screenshots automáticos

---

### Opción 3: Control Avanzado (Browser Control)

```bash
# Abrir TestSuite
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests

# Tomar screenshot
npx ts-node scripts/browser-control.ts screenshot

# Ver logs
npx ts-node scripts/browser-control.ts console 50

# Interactuar programáticamente
npx ts-node scripts/browser-control.ts click "button:has-text('Run Tests')"
```

**Ventajas**:
- ✅ Control programático completo
- ✅ Automatización de acciones
- ✅ Logs detallados
- ✅ Sesión persistente

---

## 📸 Ver Screenshots en Cursor

Los screenshots se guardan en `.screenshots/`:

1. **Abrir en Cursor**:
   - Click derecho en `.screenshots/testsuite-*.png`
   - Seleccionar "Open Preview" o "Reveal in Finder"

2. **Ver desde terminal**:
   ```bash
   # macOS
   open .screenshots/testsuite-*.png
   
   # O listar todos
   ls -la .screenshots/
   ```

3. **Ver en Cursor directamente**:
   - Usa el explorador de archivos de Cursor
   - Navega a `.screenshots/`
   - Click en cualquier imagen para previsualizar

---

## 🔍 Verificar Estado del TestSuite

### Información Extraída Automáticamente

Los scripts extraen automáticamente:

- ✅ **URL actual**: Dónde está el TestSuite
- ✅ **Título de la página**: Confirmación de carga
- ✅ **Tabla de tests**: Si existe y cuántas filas tiene
- ✅ **Checkboxes**: Cuántos hay disponibles
- ✅ **Botones**: Qué botones están disponibles
- ✅ **Contador de tests**: "X tests disponibles"
- ✅ **Errores de i18n**: Si hay marcadores sin resolver
- ✅ **Estadísticas**: Elementos de estadísticas encontrados

### Ejemplo de Salida

```json
{
  "title": "Test Suite - Bodas de hoy",
  "url": "https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests",
  "hasTable": true,
  "tableRows": 1000,
  "checkboxes": 1001,
  "buttons": ["Run Tests", "Reset", "Stop", "Add Test"],
  "hasRunButton": true,
  "hasResetButton": true
}
```

---

## 🎯 Casos de Uso

### 1. Verificar que el TestSuite Carga Correctamente

```bash
node scripts/ver-testsuite-cursor.mjs
```

**Verifica**:
- ✅ URL correcta
- ✅ Tabla visible
- ✅ Botones disponibles
- ✅ Sin errores de i18n

---

### 2. Ejecutar Tests Interactivamente

```bash
node scripts/abrir-testsuite-playwright.mjs
```

**Luego en el navegador**:
1. Seleccionar tests (checkboxes)
2. Click en "Run Tests"
3. Observar progreso
4. Ver resultados

---

### 3. Automatizar Ejecución de Tests

```bash
# Abrir TestSuite
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests

# Esperar a que cargue
npx ts-node scripts/browser-control.ts eval "document.querySelector('table') !== null"

# Seleccionar todos los tests
npx ts-node scripts/browser-control.ts eval "document.querySelectorAll('input[type=\"checkbox\"]').forEach(cb => cb.click())"

# Click en Run Tests
npx ts-node scripts/browser-control.ts click "button:has-text('Run Tests')"

# Tomar screenshot del progreso
npx ts-node scripts/browser-control.ts screenshot progress.png
```

---

## 🐛 Troubleshooting

### Problema: Playwright no encuentra Chromium

**Solución**:
```bash
npx playwright install chromium
```

---

### Problema: Screenshots no se guardan

**Verificar**:
```bash
# Verificar que el directorio existe
ls -la .screenshots/

# Crear manualmente si no existe
mkdir -p .screenshots/
```

---

### Problema: TestSuite no carga

**Verificar**:
1. URL correcta en `.env.production`
2. Autenticación válida
3. Servidor funcionando
4. VPN no bloqueando

---

### Problema: MCP no funciona

**Solución**:
1. Reiniciar Cursor completamente
2. Verificar en Settings → Tools & MCP
3. Verificar que Chrome esté corriendo con `--remote-debugging-port=9222`

---

## 📚 Scripts Disponibles

| Script | Propósito | Modo | Interactivo |
|--------|-----------|------|-------------|
| `abrir-testsuite-playwright.mjs` | Abrir TestSuite visible | Visible | ✅ Sí |
| `ver-testsuite-cursor.mjs` | Ver estado rápidamente | Headless | ❌ No |
| `browser-control.ts` | Control avanzado | Visible | ✅ Sí |
| `abrir-testsuite-url-correcta.sh` | Abrir en navegador del sistema | Sistema | ✅ Sí |

---

## ✅ Checklist de Uso

### Para Visualización Rápida

- [ ] Ejecutar `node scripts/ver-testsuite-cursor.mjs`
- [ ] Verificar screenshot en `.screenshots/`
- [ ] Revisar información extraída en terminal
- [ ] Verificar que no hay errores de i18n

### Para Interacción Completa

- [ ] Ejecutar `node scripts/abrir-testsuite-playwright.mjs`
- [ ] Verificar que el navegador se abre
- [ ] Verificar que el TestSuite carga correctamente
- [ ] Interactuar con el TestSuite manualmente
- [ ] Verificar screenshots automáticos

### Para Automatización

- [ ] Usar `browser-control.ts` para comandos específicos
- [ ] Crear scripts personalizados según necesidades
- [ ] Integrar con CI/CD si es necesario

---

**Estado**: ✅ Listo para usar - Elige el método que mejor se adapte a tus necesidades
