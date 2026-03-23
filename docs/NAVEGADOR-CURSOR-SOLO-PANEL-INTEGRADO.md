# Abrir app-test y chat-test solo en el navegador de Cursor (panel integrado)

**Objetivo:** Que cuando pidas abrir las URLs de app-test y chat-test, se abran **en el panel de navegador dentro de Cursor**, no en Chrome u otra ventana externa. Sirve para probar login, sesión y flujos en el mismo contexto.

---

## Por qué a veces se abre en Chrome

Cursor puede usar **dos orígenes** para las herramientas de navegador que usa el agente:

| Origen | Dónde abre | Cómo se configura |
|--------|------------|--------------------|
| **Navegador integrado de Cursor** | Pestaña/panel **dentro** de Cursor (Simple Browser / Browser Tab) | Settings > Tools & MCP > **Browser Automation** = **"Browser Tab"** |
| **MCP Playwright** (ej. servidor `"browser"` en mcp.json) | Ventana **externa** (Chromium/WebKit/Chrome) | `.cursor/mcp.json` → entrada `"browser"` con `@playwright/mcp` |

Si tienes el MCP de Playwright configurado, las llamadas a `browser_navigate`, `browser_tabs`, etc. las atiende ese servidor y **abre siempre una ventana externa**. El agente no puede elegir “abrir en Cursor” vs “abrir en Chrome”; lo decide la configuración.

---

## Cómo conseguir “solo navegador de Cursor”

### 1. Usar el panel integrado (Browser Tab)

1. Abre **Cursor Settings** (Cmd+,).
2. Ve a **Tools & MCP** (o **Features** / **Browser** según versión).
3. Busca **Browser Automation**.
4. Selecciona **"Browser Tab"** (o equivalente que indique “navegador en pestaña dentro de Cursor”), no “External” ni “System browser”.

Así, cuando Cursor use su propio flujo de navegador (por ejemplo el cursor-ide-browser), las páginas se abrirán en el panel de Cursor.

### 2. Evitar que el agente use Playwright (ventana externa)

Si quieres que **solo** se use el navegador de Cursor y nunca Chrome/WebKit:

- Abre **`.cursor/mcp.json`** (en tu usuario o en el proyecto).
- **Comenta o elimina** la entrada del servidor `"browser"` que usa Playwright, por ejemplo:

  ```json
  {
    "mcpServers": {
      "browser": {
        "command": "/opt/homebrew/bin/node",
        "args": [
          ".../node_modules/@playwright/mcp/cli.js",
          "--browser",
          "webkit"
        ]
      }
    }
  }
  ```

  Quita todo el bloque `"browser": { ... }` (o coméntalo) y guarda.

- Reinicia Cursor (o recarga la ventana).
- A partir de ahí, si Cursor ofrece herramientas de navegador propias (cursor-ide-browser), el agente usará esas y las páginas se abrirán en el **panel de Cursor**.

**Nota:** Si quitas el MCP "browser", comprueba que en Cursor sigan apareciendo herramientas de navegador cuando uses el agente; en algunas versiones dependen de “Browser Automation” = Browser Tab.

### 3. Resumen rápido

- **Quieres abrir solo en navegador de Cursor:**  
  Browser Automation = **Browser Tab** y, si sigue abriendo en Chrome, **quitar el MCP "browser" (Playwright)** de `mcp.json`.
- **Quieres seguir usando Playwright** (por ejemplo para E2E o scripts):  
  Mantén el MCP "browser"; entonces las herramientas del agente seguirán abriendo ventana externa. Para probar “en Cursor” tendrás que abrir las URLs a mano en la pestaña de Cursor o usar solo cuando no tengas el MCP Playwright activo.

---

## URLs a abrir (sin puerto)

Siempre con el reverse proxy (túnel activo + servicios 8080/3210):

- **https://app-test.bodasdehoy.com**
- **https://chat-test.bodasdehoy.com**

Referencias: `.cursor/rules/app-test-chat-test.mdc`, `docs/RUNBOOK-APP-TEST-CHAT-TEST.md`.
