# Configuración de Browser MCP para Cursor y Claude Code

> **Si las herramientas fallan (timeout, "Tool rejected", sin control del navegador):** ver **[MCP-NAVEGADOR-ERRORES-Y-SOLUCION.md](./MCP-NAVEGADOR-ERRORES-Y-SOLUCION.md)** para diagnóstico y tener visibilidad y control de un solo navegador.

## 📊 Análisis de Alternativas

### ✅ Mejor Opción: Chrome DevTools MCP

**Ventajas:**
- ✅ Ya está funcionando (puerto 9222 activo)
- ✅ Oficial y estable
- ✅ No requiere extensión adicional
- ✅ Compatible con Cursor
- ✅ Funciona con cualquier navegador Chromium

**Configuración:**
```json
{
  "chrome-devtools": {
    "command": "/opt/homebrew/bin/chrome-devtools-mcp",
    "args": ["--browserUrl", "http://127.0.0.1:9222"],
    "enabled": true
  }
}
```

**Requisitos:**
- Chrome/Edge corriendo con: `--remote-debugging-port=9222`
- Comando: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`

### 🔄 Alternativa: Browser Tools MCP

**Ventajas:**
- ✅ Compatible con Cursor y Claude Code
- ✅ Más funciones (clics, formularios, etc.)
- ✅ Comunidad activa

**Desventajas:**
- ⚠️ Requiere extensión del navegador
- ⚠️ Configuración más compleja

**Configuración:**
```json
{
  "browser-tools-mcp": {
    "command": "npx",
    "args": ["-y", "@agentdeskai/browser-tools-mcp@latest"],
    "enabled": true
  }
}
```

## 🚀 Configuración Actual (Optimizada)

Tu archivo `~/.cursor/mcp.json` está configurado con:

1. **Chrome DevTools MCP** (PRINCIPAL) - Funcionando ✅
2. **Browser Tools MCP** (BACKUP) - Disponible como alternativa

## 📝 Instrucciones de Uso

### Para Cursor:

1. **Asegúrate de que Chrome esté corriendo con DevTools:**
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```

2. **Reinicia Cursor** para que cargue los servidores MCP

3. **Verifica en Cursor:**
   - Settings → Tools & MCP
   - Deberías ver "chrome-devtools" como conectado

4. **Prueba con comandos como:**
   - "Navega a https://example.com"
   - "Toma una captura de pantalla"
   - "Muestra los errores de la consola"

### Para Claude Code:

Claude Code usa el mismo archivo de configuración MCP. La configuración actual debería funcionar también.

**Ubicación del archivo MCP para Claude Code:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- O puede usar el mismo `~/.cursor/mcp.json` si está configurado

**Configuración recomendada para Claude Code:**
```json
{
  "mcpServers": {
    "browser-tools-mcp": {
      "command": "npx",
      "args": ["-y", "@agentdeskai/browser-tools-mcp@latest"],
      "enabled": true
    }
  }
}
```

## 🔧 Solución de Problemas

### Chrome DevTools no funciona:

1. Verifica que Chrome esté corriendo:
   ```bash
   curl http://127.0.0.1:9222/json/version
   ```

2. Si no responde, reinicia Chrome con:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```

### Browser Tools MCP no funciona:

1. Instala la extensión del navegador (si es necesaria)
2. Verifica que el servidor esté corriendo:
   ```bash
   npx @agentdeskai/browser-tools-mcp@latest
   ```

3. Revisa los logs en Cursor para ver errores

## 📊 Comparativa Final

| Característica | Chrome DevTools MCP | Browser Tools MCP |
|----------------|---------------------|-------------------|
| Facilidad de setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Estabilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Funciones disponibles | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Compatibilidad Cursor | ✅ Excelente | ✅ Buena |
| Compatibilidad Claude Code | ⚠️ Limitada | ✅ Excelente |
| Requiere extensión | ❌ No | ✅ Sí |

## ✅ Recomendación Final

**Para Cursor:** Usa **Chrome DevTools MCP** (ya configurado y funcionando)

**Para Claude Code:** Usa **Browser Tools MCP** (mejor compatibilidad)

**Para ambos:** Mantén ambas configuraciones activas como respaldo

## 🔗 Recursos

- [Documentación MCP de Cursor](https://docs.cursor.com/context/model-context-protocol)
- [Browser Tools MCP en npm](https://www.npmjs.com/package/@agentdeskai/browser-tools-mcp)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
