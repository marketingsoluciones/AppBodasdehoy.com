# E2E Copilot: quién hace qué

**Todo lo necesario es cosa del agente** (levantar, comprobar, escribir preguntas). **Tú solo confirmas** cuando ves la pregunta y la respuesta en pantalla. Editar preguntas o código es cosa del agente.

---

## Comandos que ejecutas tú (desde la raíz del repo)

```bash
# Lista fija de preguntas
pnpm e2e:copilot:autonomo

# Batería desde archivo (e2e-app/copilot-questions-ejemplo.txt)
pnpm e2e:copilot:bateria
```

En la terminal verás `[E2E] Pregunta 2/5: ...` y `[E2E] Confirmar en el chat: Pregunta 2/5`; usa eso para confirmar aquí ("ok", "la 2 falló", etc.).

Requisito: `pnpm verificar:entornos` en verde. Si falla: `docs/RUNBOOK-APP-TEST-CHAT-TEST.md`.

---

## Ver el navegador y el test del Copilot (ventana que se abre)

Desde la raíz del repo (**en tu terminal**, no desde el agente; Playwright suele fallar en el entorno del agente):

```bash
pnpm exec playwright install webkit
pnpm e2e:copilot:autonomo
```

Se abre **una ventana de WebKit**. En cada pausa pulsas **Resume** en Playwright; en el chat de Cursor confirmas si esa pregunta está ok. Solo se usa WebKit (Chromium está prohibido en este proyecto).

---

## Ver la app en el navegador de Cursor (panel integrado)

Playwright abre su propia ventana (WebKit). Si quieres ver **la app** en el panel de Cursor: en Cursor, **View > Simple Browser** (o Command Palette: "Simple Browser: Show") y entra en **https://app-test.bodasdehoy.com**. Eso no ejecuta tests; solo abre la URL en el panel.
