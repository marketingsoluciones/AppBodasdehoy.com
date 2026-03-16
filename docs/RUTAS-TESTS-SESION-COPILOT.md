# Rutas y contexto de los últimos tests (sesión Copilot / Cursor)

Documento para explicar a otra IA qué archivos y comandos se usan en los tests de Copilot y sistema de testing de esta sesión.

---

## 1. Tests E2E Copilot (los que hemos tocado)

| Ruta | Qué es |
|------|--------|
| **e2e-app/flujo-copilot-confirmacion-visual.spec.ts** | Spec principal: login → home/resumen-evento → abrir Copilot → escribir pregunta(s) → pausa para confirmar. Soporta `E2E_COPILOT_QUESTION`, `E2E_COPILOT_QUESTIONS_FILE`, `E2E_SKIP_CLEAR_SESSION`, `SLOW_VISIBLE_TYPE`. |
| **e2e-app/helpers.ts** | Helpers E2E: `waitForCopilotIframeReady` (acepta `div[contenteditable="true"]`, `textarea`, `input[type="text"]` para el input del Copilot). |
| **e2e-app/copilot-questions-ejemplo.txt** | Archivo de batería de preguntas (una por línea; `#` = comentario). Se usa con `E2E_COPILOT_QUESTIONS_FILE`. |
| **e2e-app/fixtures.ts** | Credenciales E2E (login). |
| **e2e-app/LEEME-EJECUTAR-Y-VER.md** | Resumen de comandos y flujo “solo confirmas tú”. |

Otros specs E2E del repo (no modificados en esta sesión): `e2e-app/login.spec.ts`, `e2e-app/copilot-chat.spec.ts`, `e2e-app/preguntas-filtros-usuario.spec.ts`, `e2e-app/smoke.spec.ts`, etc.

---

## 2. Scripts que lanzan los tests

| Ruta | Qué hace |
|------|----------|
| **scripts/e2e-copilot-autonomo.sh** | Verifica app-test + chat-test; si ok, lanza Playwright con `flujo-copilot-confirmacion-visual.spec.ts` (un navegador, pausas para confirmar). |
| **scripts/testing-sistema.sh** | Verificación de entornos; si `CI=true` o `TEST_SISTEMA_E2E=1`, además smoke E2E. |

---

## 3. App-eventos (proxy Copilot, embed, API)

| Ruta | Qué es |
|------|--------|
| **apps/appEventos/pages/api/copilot/chat.ts** | API proxy al backend de IA: `buildSystemPrompt` (instrucción “mostrar en el chat cuando no se pueda en pantalla”), header `X-Prefer-Reasoning-Model`, `prefer_reasoning_model` en body. |
| **apps/appEventos/services/copilotChat.ts** | Servicio de chat: `sendChatMessage` con `messageHistory` opcional (historial para conversación continua). |
| **apps/appEventos/components/Copilot/CopilotEmbed.tsx** | Embed del Copilot: banner “Tienes una conversación anterior” con “Continuar con esta” / “Nueva conversación”; en `handleSend` construye `messageHistory` y lo pasa a `sendChatMessage`. |

---

## 4. Documentación de referencia

| Ruta | Contenido |
|------|-----------|
| **docs/TESTING-SISTEMA.md** | Doc única del sistema de testing: capas (entornos, unit, E2E), comandos, flujo “hacemos los tests juntos”. |
| **docs/E2E-COPILOT-ESTANDAR.md** | Flujo E2E Copilot estándar: una pregunta, batería desde archivo, recuperar conversación, variables de entorno. |
| **docs/COPILOT-COMPORTAMIENTO-ESPERADO.md** | Comportamiento esperado: pantalla por defecto (eventos), no todo es filtro (listar en chat si no se puede en pantalla), recuperar conversación, ver avances (desplegar). |
| **docs/API-IA-MODELO-RAZONADOR.md** | Contrato para api-ia (Python): leer `X-Prefer-Reasoning-Model` / `prefer_reasoning_model` y enrutar al modelo razonador. |
| **docs/RUNBOOK-APP-TEST-CHAT-TEST.md** | Runbook cuando fallan app-test o chat-test (entornos, túnel, puertos). |

---

## 5. Regla Cursor (entornos y E2E)

| Ruta | Contenido |
|------|-----------|
| **.cursor/rules/app-test-chat-test.mdc** | Usar siempre app-test y chat-test (no localhost solo); URLs sin puerto; flujo “hacemos los tests juntos”; si falla, runbook; no dedicar mucho tiempo a infra. |

---

## 6. Comandos principales (desde raíz del repo)

```bash
# Verificar entornos (app-test + chat-test)
pnpm verificar:entornos

# Sistema: entornos + opcional smoke E2E (CI=true o TEST_SISTEMA_E2E=1)
pnpm test:sistema

# Copilot: flujo completo con pausas para confirmar cada pregunta
pnpm e2e:copilot:autonomo

# Copilot: una sola pregunta
E2E_COPILOT_QUESTION="Tu pregunta aquí" pnpm e2e:copilot:autonomo

# Copilot: batería desde archivo
E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt pnpm e2e:copilot:autonomo

# No borrar sesión (recuperar conversación anterior)
E2E_SKIP_CLEAR_SESSION=1 pnpm e2e:copilot:autonomo

# Flujo visual sin levantar servicios (usa app-test ya desplegado)
pnpm test:e2e:app:visual
```

Definidos en **package.json** (raíz): `test:sistema`, `e2e:copilot:autonomo`, `e2e:copilot:bateria`, `test:e2e:app:visual`, etc.

---

## 7. Variables de entorno usadas en E2E Copilot

| Variable | Uso |
|----------|-----|
| **BASE_URL** | URL de la app (p. ej. `https://app-test.bodasdehoy.com`). |
| **CHAT_URL** | URL del chat/Copilot si se usa externo (p. ej. `https://chat-test.bodasdehoy.com`). |
| **E2E_COPILOT_QUESTION** | Una sola pregunta; el test la escribe en el Copilot. |
| **E2E_COPILOT_QUESTIONS_FILE** | Archivo con una pregunta por línea (batería). |
| **E2E_SKIP_CLEAR_SESSION** | Si `1`, no se borra la sesión (para probar recuperar conversación). |
| **SLOW_VISIBLE_TYPE** | Si definida, pausa antes de escribir y tecleo más lento (para ver la pregunta en pantalla). |
| **E2E_HEADED** / **E2E_WAIT_FOR_VISUAL_CONFIRMATION** | Para ver el navegador y pausar para confirmación visual. |

---

## 8. Cambio de arquitectura: de iframe a CopilotEmbed

**Antes:** el Copilot se cargaba como `<iframe src=”chat-test...”>` (CopilotIframe). Los tests usaban `page.frameLocator('iframe[src*=”chat”]')`.

**Ahora:** el Copilot es un componente React nativo (`ChatSidebarDirect` → `CopilotEmbed` → `InputEditor` → `<textarea>`). No hay iframe. Los tests deben usar `page.locator('textarea[placeholder*=”Escribe”]')` y `.fill()` (componente controlado de React).

Todos los specs E2E han sido actualizados para **detectar automáticamente** qué modo usa la app (embed vs iframe legacy) y actuar en consecuencia. Ver `waitForCopilotReady()` en `helpers.ts`.

**Links markdown → navegación automática:** `CopilotEmbed.tsx` ahora intercepta clicks en links internos (`/invitados?eventId=X`) y hace `router.push()` en vez de recargar. Conecta las respuestas del Copilot con el panel derecho.

---

## 9. Resumen en una frase para otra IA

En esta sesión se ha trabajado en: **(1)** sistema de testing unificado (entornos + E2E + doc en `docs/TESTING-SISTEMA.md`); **(2)** E2E del Copilot con flujo “el agente escribe la pregunta, el usuario solo confirma” (`e2e-app/flujo-copilot-confirmacion-visual.spec.ts` + `scripts/e2e-copilot-autonomo.sh`); **(3)** soporte de pregunta única (`E2E_COPILOT_QUESTION`) y batería desde archivo (`E2E_COPILOT_QUESTIONS_FILE`); **(4)** banner “Recuperar conversación / Nueva conversación” e historial en el embed (`CopilotEmbed.tsx`, `copilotChat.ts`); **(5)** system prompt del proxy mejorado: criterios claros para cuándo filtrar (usuario pide “muéstrame en la app”) vs responder en el chat (resumen, estadísticas, listados); **(6)** migración de tests E2E de iframe a embed — `waitForCopilotReady()` detecta automáticamente embed (textarea) o iframe (legacy), todos los specs actualizados; **(7)** interceptación de links markdown en `CopilotEmbed.tsx` para navegar con `router.push()` al panel derecho. Las rutas clave están en este documento; la doc de flujo y comandos está en `docs/TESTING-SISTEMA.md` y `docs/E2E-COPILOT-ESTANDAR.md`.
