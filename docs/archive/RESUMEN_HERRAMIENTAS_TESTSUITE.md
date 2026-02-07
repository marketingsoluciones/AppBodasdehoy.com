# 🛠️ Resumen: Herramientas para Ver TestSuite en Cursor

**Fecha**: 2026-01-25  
**Estado**: ✅ Herramientas creadas y listas para usar

---

## ✅ Lo que se ha Creado

### 1. Scripts de Playwright

#### A. `scripts/abrir-testsuite-playwright.mjs` ⭐ RECOMENDADO

**Para qué sirve**: Abrir TestSuite en Chromium visible para verlo e interactuar

**Características**:
- ✅ Abre navegador visible (headless: false)
- ✅ Detecta URL automáticamente desde `.env.production`
- ✅ Toma screenshots automáticamente
- ✅ Intercepta requests/responses para debugging
- ✅ Captura console logs
- ✅ Analiza contenido del DOM
- ✅ Guarda estado en `.testsuite-state.json`
- ✅ Screenshots en `.screenshots/`

**Uso**:
```bash
node scripts/abrir-testsuite-playwright.mjs
```

**Ideal para**: Ver el TestSuite completo e interactuar manualmente

---

#### B. `scripts/ver-testsuite-cursor.mjs`

**Para qué sirve**: Ver estado del TestSuite rápidamente sin abrir navegador

**Características**:
- ✅ Modo headless (rápido)
- ✅ Extrae información del DOM
- ✅ Verifica errores de i18n
- ✅ Toma screenshot completo
- ✅ Muestra información en JSON

**Uso**:
```bash
node scripts/ver-testsuite-cursor.mjs
```

**Ideal para**: Verificación rápida del estado sin abrir navegador

---

### 2. Scripts Existentes Mejorados

#### A. `scripts/browser-control.ts`

**Ya existía**, pero ahora documentado para uso con TestSuite:

**Comandos útiles**:
```bash
# Abrir TestSuite
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests

# Tomar screenshot
npx ts-node scripts/browser-control.ts screenshot

# Ver logs de consola
npx ts-node scripts/browser-control.ts console 50

# Hacer click en botón
npx ts-node scripts/browser-control.ts click "button:has-text('Run Tests')"

# Evaluar JavaScript
npx ts-node scripts/browser-control.ts eval "document.querySelector('table')?.rows.length"
```

---

### 3. Herramientas MCP del Navegador

**Estado**: Configurado pero requiere reiniciar Cursor

**Servidores disponibles**:
- ✅ `chrome-devtools` - Chrome DevTools Protocol
- ✅ `browser-tools-mcp` - Browser Tools MCP

**Para activar**:
1. Reiniciar Cursor completamente
2. Settings → Tools & MCP
3. Verificar que los servidores estén conectados

**Capacidades**:
- Ver pestañas abiertas
- Navegar a URLs
- Tomar screenshots
- Ejecutar JavaScript
- Ver console logs
- Interactuar con el DOM

---

## 🚀 Cómo Usar Ahora

### Opción 1: Ver TestSuite Visible (Recomendado para primera vez)

```bash
node scripts/abrir-testsuite-playwright.mjs
```

**Qué pasa**:
1. Se abre Chromium visible
2. Navega al TestSuite automáticamente
3. Analiza el contenido
4. Toma screenshot
5. Mantiene el navegador abierto para interacción

**Puedes**:
- ✅ Ver la interfaz completa
- ✅ Interactuar con los tests
- ✅ Ejecutar tests manualmente
- ✅ Ver resultados en tiempo real

---

### Opción 2: Ver Estado Rápidamente

```bash
node scripts/ver-testsuite-cursor.mjs
```

**Qué pasa**:
1. Abre TestSuite en modo headless
2. Extrae información
3. Toma screenshot
4. Muestra información en terminal
5. Cierra el navegador

**Ideal para**: Verificación rápida sin abrir navegador

---

### Opción 3: Control Avanzado

```bash
# Abrir TestSuite
npx ts-node scripts/browser-control.ts open https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests

# Luego usar comandos según necesites
npx ts-node scripts/browser-control.ts screenshot
npx ts-node scripts/browser-control.ts console 50
```

---

## 📸 Ver Screenshots en Cursor

Los screenshots se guardan automáticamente en `.screenshots/`:

1. **En Cursor**:
   - Navega a `.screenshots/` en el explorador
   - Click en cualquier imagen para previsualizar
   - O click derecho → "Open Preview"

2. **Desde terminal**:
   ```bash
   # Ver último screenshot
   ls -lt .screenshots/ | head -2
   
   # Abrir en macOS
   open .screenshots/testsuite-*.png
   ```

---

## 🔍 Información que se Extrae Automáticamente

Los scripts analizan y muestran:

- ✅ **URL actual**: Dónde está el TestSuite
- ✅ **Título**: Confirmación de carga
- ✅ **Tabla**: Si existe y cuántas filas
- ✅ **Checkboxes**: Cuántos hay disponibles
- ✅ **Botones**: Qué botones están disponibles
- ✅ **Contador**: "X tests disponibles"
- ✅ **Errores i18n**: Si hay marcadores sin resolver
- ✅ **Estadísticas**: Elementos encontrados

---

## 📚 Documentación Creada

1. **`COMO_VER_TESTSUITE_EN_CURSOR.md`** - Guía completa de uso
2. **`RESUMEN_HERRAMIENTAS_TESTSUITE.md`** - Este resumen
3. **Scripts ejecutables** con permisos configurados

---

## ✅ Checklist de Uso

### Para Ver TestSuite por Primera Vez

- [ ] Ejecutar `node scripts/abrir-testsuite-playwright.mjs`
- [ ] Verificar que el navegador se abre
- [ ] Verificar que el TestSuite carga correctamente
- [ ] Revisar screenshot en `.screenshots/`
- [ ] Interactuar con el TestSuite manualmente

### Para Verificación Rápida

- [ ] Ejecutar `node scripts/ver-testsuite-cursor.mjs`
- [ ] Revisar información extraída en terminal
- [ ] Verificar screenshot en `.screenshots/`
- [ ] Verificar que no hay errores de i18n

### Para Automatización

- [ ] Usar `browser-control.ts` para comandos específicos
- [ ] Crear scripts personalizados según necesidades
- [ ] Integrar con workflows de testing

---

## 🎯 Próximos Pasos

1. **Ejecutar el script ahora**:
   ```bash
   node scripts/abrir-testsuite-playwright.mjs
   ```

2. **Verificar que funciona**:
   - El navegador se abre
   - El TestSuite carga
   - Los screenshots se guardan

3. **Interactuar con el TestSuite**:
   - Seleccionar tests
   - Ejecutar tests
   - Ver resultados

4. **Usar MCP (opcional)**:
   - Reiniciar Cursor
   - Activar servidores MCP
   - Usar comandos MCP para interacción avanzada

---

## 🐛 Troubleshooting

### Playwright no encuentra Chromium

```bash
npx playwright install chromium
```

### Screenshots no se guardan

```bash
mkdir -p .screenshots/
```

### TestSuite no carga

- Verificar URL en `.env.production`
- Verificar autenticación
- Verificar VPN

---

**Estado**: ✅ Todo listo - Ejecuta `node scripts/abrir-testsuite-playwright.mjs` para empezar
