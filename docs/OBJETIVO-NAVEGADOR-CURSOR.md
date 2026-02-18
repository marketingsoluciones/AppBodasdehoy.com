# Objetivo: abrir, loguearse y hacer pruebas desde el navegador de Cursor

## Problema

**app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** no cargan en el navegador MCP de Cursor (chrome-error). Esos dominios dependen de DNS /etc/hosts o Cloudflare y no están disponibles en el entorno del agente.

## Solución

Usar **localhost con puertos** para que el agente pueda abrir la app, hacer login y ejecutar pruebas.

| Rol        | URL                      | Puerto |
|-----------|---------------------------|--------|
| Web (login, test-preguntas) | **http://localhost:8080** | 8080   |
| Copilot (chat, TestSuite)   | **http://localhost:3210** | 3210   |

## Requisitos

1. **Web levantada** en el puerto 8080:
   ```bash
   cd apps/web && npm run dev
   # o: npm run dev:local  (escucha en 0.0.0.0:8080)
   ```

2. **Copilot levantado** en el puerto 3210:
   ```bash
   cd apps/copilot && pnpm dev
   ```

3. El agente debe **navegar siempre a**:
   - **http://localhost:8080** para la web (login, test-preguntas, panel con Copilot en iframe).
   - **http://localhost:3210** solo si abre el Copilot o TestSuite en una pestaña aparte.

## Comportamiento del código

- Si abres la web en **localhost:8080**, el iframe del Copilot, los enlaces de test-preguntas y el botón “Abrir en nueva pestaña” usan **localhost:3210** automáticamente (sin app-test/chat-test).
- Firebase acepta **localhost** en Authorized domains, así que el login funciona en localhost.

## Pasos para el agente

1. Comprobar que 8080 y 3210 responden (o pedir al usuario que levante web y Copilot).
2. Navegar a **http://localhost:8080** (p. ej. `/` o `/test-preguntas`).
3. Si hace falta login: el usuario puede hacerlo manualmente en esa misma página (evitar intentos rápidos para no provocar bloqueos de Firebase).
4. Para pruebas: usar la página **http://localhost:8080/test-preguntas** o abrir el Copilot en el panel lateral (iframe en localhost:3210).
5. Para tests de preguntas sin navegador: `pnpm test:preguntas` o `node scripts/trabajar-con-1000-preguntas.mjs test N`.

## Resumen

- **No usar** app-test.bodasdehoy.com ni chat-test.bodasdehoy.com en el navegador de Cursor.
- **Usar** http://localhost:8080 (web) y http://localhost:3210 (Copilot) para abrir, loguearse y hacer pruebas.
