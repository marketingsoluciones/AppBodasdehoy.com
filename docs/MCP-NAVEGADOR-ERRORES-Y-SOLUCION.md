# MCP: errores del navegador y cómo tener visibilidad y control

Objetivo: **tener visibilidad y control de un solo navegador** (interno de Cursor o externo Chrome), para poder abrir app, hacer login y pruebas.

---

## 1. Qué MCPs de navegador hay

| MCP | Tipo | Qué hace |
|-----|------|----------|
| **chrome-devtools** | Externo | Conecta a un Chrome/Edge ya abierto con `--remote-debugging-port=9222`. El agente controla ese Chrome. |
| **cursor-ide-browser** | Integrado | Navegador dentro de Cursor. El agente navega, hace clic, etc. en pestañas de Cursor. |

Solo necesitas **uno funcionando**. Recomendación: usar **Chrome externo + chrome-devtools** porque suele ser más estable.

---

## 2. Errores que aparecen y causas

### Error: "Tool rejected" / "Timeout waiting for bubble creation" (cursor-ide-browser)

- **Qué es:** Al llamar a `browser_navigate`, `browser_click`, etc., Cursor rechaza la herramienta o hace timeout.
- **Causas típicas:**
  1. **Permisos:** Cursor pide confirmación para “tomar control” del navegador; si no se acepta o hay timeout, la herramienta falla.
  2. **Timeout de MCP:** En versiones recientes (ej. 1.5.1) el timeout por defecto puede ser ~2 minutos; operaciones lentas fallan.
  3. **Herramientas no expuestas al agente:** En algunos entornos el navegador integrado está habilitado en Settings pero las herramientas no se exponen al chat del agente (bug conocido).
- **Qué hacer:**
  1. En Cursor: **Settings → Tools & MCP** y comprobar que **cursor-ide-browser** (o “Browser”) esté **Enabled**.
  2. Al pedir “abre esta URL” o “haz clic aquí”, **aceptar el permiso** cuando Cursor muestre el aviso/burbuja.
  3. Si sigue fallando, **usar Chrome externo + chrome-devtools** (sección 3).

### Error: chrome-devtools no conecta / "selected page has been closed"

- **Qué es:** El MCP chrome-devtools responde pero no hay pestaña válida o Chrome no está en modo depuración.
- **Causas:**
  1. Chrome no se abrió con `--remote-debugging-port=9222`.
  2. Se cerró la pestaña que el MCP tenía seleccionada.
  3. Chrome se cerró y se volvió a abrir sin el flag.
- **Qué hacer:** Ver sección 3 (Chrome con puerto 9222 y comprobar conexión).

### app-test / chat-test no cargan (chrome-error en la pestaña)

- **Causa:** En el entorno del navegador (Cursor o Chrome remoto), esos dominios no resuelven o no son accesibles (DNS, /etc/hosts, red).
- **Solución:** Usar **localhost** para las pruebas: **http://localhost:8080** (web) y **http://localhost:3210** (Copilot). Ver `docs/OBJETIVO-NAVEGADOR-CURSOR.md`.

---

## 3. Solución recomendada: un solo navegador bajo control

### Opción A: Chrome externo + chrome-devtools (recomendada)

Así el agente tiene **visibilidad y control** sobre un Chrome real.

1. **Cerrar todas las ventanas de Chrome** (para que no haya conflicto con el puerto).

2. **Abrir Chrome en modo depuración remota** (macOS):
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```
   En Windows (ruta típica):
   ```bash
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

3. **Comprobar que el puerto responde:**
   ```bash
   curl -s http://127.0.0.1:9222/json/version
   ```
   Debe devolver JSON con `Browser` y `webSocketDebuggerUrl`.

4. **Configurar MCP en Cursor** (`~/.cursor/mcp.json`):
   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "/opt/homebrew/bin/chrome-devtools-mcp",
         "args": ["--browserUrl", "http://127.0.0.1:9222"],
         "enabled": true
       }
     }
   }
   ```
   Si `chrome-devtools-mcp` está en otro sitio, usa la ruta correcta (o `npx` si lo usas por npm).

5. **Reiniciar Cursor** (o desactivar y volver a activar el servidor MCP en Settings → Tools & MCP).

6. **Verificar:** En Settings → Tools & MCP debe aparecer **chrome-devtools** como conectado. A partir de ahí el agente puede usar `list_pages`, `navigate_page`, `take_snapshot`, `click`, etc. sobre ese Chrome.

7. **Para pruebas de la app:** En ese Chrome abre **http://localhost:8080** (con web y Copilot levantados en 8080 y 3210). El agente podrá navegar, hacer login manual si lo haces tú, y ejecutar pruebas en esa misma ventana.

### Opción B: Navegador integrado de Cursor (cursor-ide-browser)

Si quieres usar solo el navegador de Cursor:

1. **Settings → Tools & MCP** → comprobar que el servidor del navegador (p. ej. "Browser" / cursor-ide-browser) esté **Enabled**.
2. **Abrir una pestaña de navegador** en Cursor (vista Browser).
3. Cuando el agente pida navegar o interactuar, **aceptar el permiso** en la burbuja que salga; no cancelar y no dejar que haga timeout.
4. Si sigue "Tool rejected" o timeout, **usar Opción A** (Chrome + chrome-devtools).

---

## 4. Checklist rápido: “tener un navegador bajo control”

- [ ] Elegir **una** opción: Chrome externo (A) o navegador Cursor (B).
- [ ] **Opción A:** Chrome abierto con `--remote-debugging-port=9222`, `curl http://127.0.0.1:9222/json/version` responde OK, `~/.cursor/mcp.json` con chrome-devtools, Cursor reiniciado, chrome-devtools “conectado” en Settings.
- [ ] **Opción B:** Navegador de Cursor habilitado en MCP, pestaña abierta, aceptar permisos cuando el agente actúe.
- [ ] Para pruebas: web en **http://localhost:8080**, Copilot en **http://localhost:3210** (ver `OBJETIVO-NAVEGADOR-CURSOR.md`).

---

## 5. Referencias en el repo

- `docs/BROWSER-MCP-CONFIG.md` – Configuración detallada Chrome DevTools y Browser Tools.
- `docs/CAPACIDADES-BROWSER-MCP.md` – Qué puede hacer el agente cuando MCP está activo.
- `docs/OBJETIVO-NAVEGADOR-CURSOR.md` – Uso de localhost para abrir, login y pruebas sin app-test/chat-test.
