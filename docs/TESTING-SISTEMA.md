# Sistema de testing

Punto de entrada para entender y ejecutar todo el testing del monorepo (app-eventos, chat-ia, E2E con app-test/chat-test).

---

## Flujo Copilot — hacemos los tests juntos

1. **El agente hace todo:** levanta servicios, comprueba entornos, abre el navegador, escribe la pregunta en el Copilot y muestra el resultado. No hace falta que ejecutes tú en la terminal.
2. **Tú solo respondes aquí en el chat:** si el resultado es correcto, o si hay que mejorar la respuesta de la IA o la funcionalidad. El agente pregunta tras cada pregunta: "¿Está correcto o qué hay que mejorar?"
3. Si no ves el navegador cuando el agente ejecuta, se guarda una captura en `test-results/copilot-pregunta-1.png` (y 2, 3…); ábrela para confirmar. O el agente te puede pedir que ejecutes tú el comando una vez para verlo en vivo.

**Si algo falla:** el agente usa `pnpm verificar:entornos` y `docs/RUNBOOK-APP-TEST-CHAT-TEST.md`. Si necesitas ejecutar tú: `pnpm e2e:copilot:autonomo` o `pnpm e2e:copilot:bateria`. Para **recuperar la última conversación** (no borrar sesión): `E2E_SKIP_CLEAR_SESSION=1 pnpm e2e:copilot:autonomo`.

**Si no ves avances en la app:** los cambios del repo (banner, historial, etc.) solo se ven tras **recompilar y desplegar** app-eventos (y chat-ia si usas iframe). Ver `docs/COPILOT-COMPORTAMIENTO-ESPERADO.md` (despliegue, no-todo-es-filtro, recuperar conversación).

---

## Resumen en 3 capas

| Capa | Qué | Comando principal |
|------|-----|-------------------|
| **1. Entornos** | app-test y chat-test responden (HTTP) | `pnpm verificar:entornos` |
| **2. Unit / front** | Jest en appEventos (componentes, API, utils) | `pnpm test:web` |
| **3. E2E** | Playwright: smoke, login, Copilot, filtros, etc. | Ver tabla abajo |

---

## Un comando para comprobar el sistema

Comprueba que los entornos están bien y que el smoke E2E pasa (opcional, según env):

```bash
pnpm test:sistema
```

- Ejecuta **verificación** de app-test y chat-test.
- Si `CI=true` o `TEST_SISTEMA_E2E=1`, además lanza el **smoke E2E** contra app-test (headless).
- Si algo falla, ver `docs/RUNBOOK-APP-TEST-CHAT-TEST.md` para entornos.

---

## Comandos por capa

### Entornos (antes de E2E)

```bash
pnpm verificar:entornos          # Solo comprobar app-test + chat-test
pnpm dev:levantar                # Levantar app 8080 + chat 3210 (+ túnel si existe)
```

### Unit / front

```bash
pnpm test:web                   # Tests de appEventos (Jest)
pnpm test:front                 # Solo componentes (Jest)
```

### E2E (Playwright) — app-test recomendado

Todos usan **WebKit** y **app-test** por defecto (sin puertos en URL). Credenciales: `e2e-app/fixtures.ts`.

| Objetivo | Comando |
|----------|---------|
| **Comprobar sistema (entornos + smoke)** | `pnpm test:sistema` |
| **Smoke solo** (app carga) | `pnpm test:e2e:app:smoke` |
| **Login + home + redirect** | `pnpm test:e2e:app:real` |
| **Copilot: flujo completo con pausas** (tú confirmas cada pregunta) | `pnpm e2e:copilot:autonomo` |
| **Copilot: una sola pregunta que tú indicas** | `E2E_COPILOT_QUESTION="Tu pregunta" pnpm e2e:copilot:autonomo` |
| **Copilot: batería desde archivo** (una por línea, pausa para confirmar cada una) | `E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt pnpm e2e:copilot:autonomo` |
| **Copilot: mismo flujo sin levantar servicios** | `pnpm test:e2e:app:visual` |
| **Filtros Copilot** (invitados, mesas) | `pnpm test:e2e:app:filter` |
| **Preguntas y filtros** | `pnpm test:e2e:app:preguntas-filtros` |
| **Lista de specs** (depurar) | `pnpm test:e2e:app:ui` |
| **CI (list reporter, headless)** | `pnpm verify:e2e` |

### E2E Copilot — flujo estándar

El flujo que deja “montado” el testing del Copilot es:

1. **Un solo navegador.**  
2. **Verificar/levantar** app-test y chat-test.  
3. **Login** → (evento si hay; si no, seguimos) → **abrir Copilot** → **enviar preguntas** → resultado a la derecha → **pausa para que confirmes** en Cursor.

Comando:

```bash
pnpm e2e:copilot:autonomo
```

Detalle: `docs/E2E-COPILOT-ESTANDAR.md`, `e2e-app/flujo-copilot-confirmacion-visual.spec.ts`.

---

## Dónde está cada cosa

| Qué | Dónde |
|-----|--------|
| Config Playwright | `playwright.config.ts` (raíz) |
| Specs E2E | `e2e-app/*.spec.ts` |
| Helpers E2E (login, Copilot) | `e2e-app/helpers.ts` |
| Credenciales E2E | `e2e-app/fixtures.ts` |
| Verificación entornos | `scripts/verificar-app-test-chat-test.sh` |
| Script Copilot autónomo | `scripts/e2e-copilot-autonomo.sh` |
| Runbook app-test/chat-test | `docs/RUNBOOK-APP-TEST-CHAT-TEST.md` |
| Estado E2E y comandos | `docs/ESTADO-E2E-Y-HERRAMIENTAS.md` |

---

## Requisitos

- **Entornos:** `/etc/hosts` con `app-test.bodasdehoy.com` y `chat-test.bodasdehoy.com` → `127.0.0.1`; servicios en 8080 y 3210; túnel (cloudflared) si usas HTTPS sin nginx local.
- **Playwright:** `pnpm test:e2e:app:install` (instala WebKit).
- **Variables:** para E2E con usuario, `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` (por defecto en fixtures); para app-test, `BASE_URL=https://app-test.bodasdehoy.com`.

---

## Avances recientes

- **Sistema de testing:** un comando (`pnpm test:sistema`) y doc único (`docs/TESTING-SISTEMA.md`).
- **Copilot con contexto:** el embed envía historial de conversación (`messageHistory`) para que la IA mantenga contexto entre preguntas.
- **Recuperar o nueva conversación:** si hay historial, el Copilot muestra banner "Continuar con esta" / "Nueva conversación".
- **E2E Copilot:** pregunta personalizada con `E2E_COPILOT_QUESTION="..."; escritura visible (pausa + tecleo lento) cuando `E2E_WAIT_FOR_VISUAL_CONFIRMATION=1`.
- **Modelo razonador:** el proxy envía `X-Prefer-Reasoning-Model` y `prefer_reasoning_model`; falta implementar en api-ia (Python).

---

## Próximos pasos (cuando quieras avanzar)

| Opción | Acción |
|--------|--------|
| **Probar más preguntas** | `E2E_COPILOT_QUESTION="Tu frase" pnpm e2e:copilot:autonomo` y confirmar en el chat. |
| **Backend api-ia** | En el repo de api-ia: leer header/body "prefer_reasoning_model" y enrutar al modelo más razonador (`docs/API-IA-MODELO-RAZONADOR.md`). |
| **Batería de preguntas** | Ya disponible: `E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt` (una pregunta por línea; # = comentario). |
| **Copilot iframe** | Si usas LobeChat en iframe: valorar ofrecer "Recuperar / Nueva conversación" también ahí (postMessage o UI del chat). |
