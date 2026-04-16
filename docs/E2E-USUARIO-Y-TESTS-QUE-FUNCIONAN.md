# E2E: Usuario de prueba y tests que han funcionado

Los tests E2E de este repo están pensados para ejecutarse **cuando los subdominios están corriendo** (app-test, chat-test). Con app-test y chat-test activos (y túnel o acceso a esos dominios), las suites documentadas aquí han funcionado bien.

## Las dos cuentas de test (usuario y clave)

Estas son las **dos cuentas** que se usan en los tests E2E. Quedan guardadas aquí y en **`e2e-app/fixtures.ts`**.

| Cuenta | Email | Contraseña | Uso |
|--------|--------|------------|-----|
| **Principal (U1)** | `bodasdehoy.com@gmail.com` | `lorca2012M*+` | Login app-test, Copilot, filtros, CRUD, etc. |
| **Secundaria (U2)** | `test-usuario2@bodasdehoy.com` | `TestBodas2024!` | Tests de 2 usuarios, pareja, auth, chat 2 usuarios. |

- **Variables de entorno:** U1 = `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; U2 = `TEST_USER2_EMAIL` / `TEST_USER2_PASSWORD`.
- **En código:** `TEST_CREDENTIALS` y `TEST_CREDENTIALS_U2` en `e2e-app/fixtures.ts`.

**Nota clave U1:** En algunos scripts de `package.json` se usa `lorca2012M*.` (con **punto** final). Si un test de login falla, probar con la de fixtures (`lorca2012M*+`) o la del script (`lorca2012M*.`).

Para usar **otra cuenta** sin tocar el código:

```bash
TEST_USER_EMAIL=otro@email.com TEST_USER_PASSWORD=otrapass pnpm test:e2e:app:smoke
```

La cuenta debe tener al menos un evento en app-test si los tests necesitan seleccionar evento (invitados, presupuesto, filtros, etc.).

---

## Dónde se define

- **Definición:** `e2e-app/fixtures.ts` → `TEST_CREDENTIALS` (U1) y `TEST_CREDENTIALS_U2` (U2).
- **Uso:** Los specs importan `TEST_CREDENTIALS` y `TEST_URLS` desde `./fixtures`; las variables de entorno `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (y `TEST_USER2_EMAIL` / `TEST_USER2_PASSWORD` para U2) sobrescriben esos valores.

---

## Tests E2E que han funcionado bien

Ejemplos de suites o specs que se han ejecutado con éxito (app-test o local):

### 1. Smoke + home + login + redirect (documentado 2026-03-10)

**Comando:**
```bash
BASE_URL=https://app-test.bodasdehoy.com CI=true PLAYWRIGHT_BROWSER=webkit \
  pnpm exec playwright test e2e-app/smoke.spec.ts e2e-app/home.spec.ts e2e-app/login.spec.ts e2e-app/redirect-login.spec.ts
```

**Resultado típico:** 5 passed, 3 skipped, 0 failed cuando app-test y chat-test responden bien. Si /login devuelve 1033 o "Please enable cookies" (túnel no activo o red), el test de login hace skip y la suite sigue en 4 passed, 4 skipped, 0 failed.  
Ver: `docs/RESULTADOS-PRUEBAS-REALES-2026-03-10.md`.

### 2. Smoke solo (rápido)

```bash
BASE_URL=https://app-test.bodasdehoy.com pnpm exec playwright test e2e-app/smoke.spec.ts
```

Comprueba que la app responde en BASE_URL.

### 3. Preguntas y filtros — smoke

```bash
BASE_URL=https://app-test.bodasdehoy.com pnpm exec playwright test e2e-app/preguntas-filtros-usuario.spec.ts --grep "smoke"
```

Un test que comprueba que BASE_URL responde (login o home) sin ErrorBoundary.

### 4. filter-view (postMessage y banner)

```bash
pnpm test:e2e:app:filter
```

Ejecuta `e2e-app/filter-view.spec.ts`: smoke de rutas, simulación de `FILTER_VIEW`/`CLEAR_FILTER`, botón ✕ del banner. Requiere credenciales y que la cuenta tenga eventos para los tests con login.

### 5. Flujo visual Copilot (confirmación manual por pregunta)

**Comando:**
```bash
pnpm test:e2e:app:visual
```

Ejecuta `e2e-app/flujo-copilot-confirmacion-visual.spec.ts`: login en app-test → selecciona evento (p. ej. "Raúl Isabel") → por cada pregunta envía al Copilot → muestra el resultado en el panel derecho → **hace pause** para que confirmes visualmente → Resume → siguiente pregunta. Requiere app-test y chat-test activos. Credenciales desde `fixtures.ts` (o `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`). Detalle: `docs/E2E-FLUJO-VERIFICACION-VISUAL.md`.

Para ejecutar sin pausas (solo assertions): `E2E_WAIT_FOR_VISUAL_CONFIRMATION=0 pnpm test:e2e:app:visual`.

### 6. Scripts listos del package.json

| Script | Qué ejecuta |
|--------|-------------|
| `pnpm test:e2e:app:smoke` | smoke.spec.ts (headed) |
| `pnpm test:e2e:app:real` | smoke + home + login + redirect (app-test) |
| `pnpm test:e2e:app:filter` | filter-view.spec.ts (app-test, con usuario) |
| `pnpm test:e2e:app:preguntas-filtros` | preguntas-filtros-usuario.spec.ts (app-test) |
| `pnpm test:e2e:app:preguntas-filtros:local` | mismo spec contra http://127.0.0.1:8080 |
| `pnpm test:e2e:app:visual` | flujo Copilot con pause por pregunta (app-test); ver §5 |
| `pnpm test:e2e:app:visual:local` | mismo flujo contra http://127.0.0.1:8080 |

---

## Resumen

- **Requisito:** que los subdominios **app-test** y **chat-test** estén corriendo (túnel o despliegue). Con ellos activos, estos E2E han funcionado bien.
- **Usuario/clave:** definidos en `e2e-app/fixtures.ts` (email: `bodasdehoy.com@gmail.com`, password: `lorca2012M*+`). Override con `TEST_USER_EMAIL` y `TEST_USER_PASSWORD`.
- **Tests que han funcionado:** smoke, home, login, redirect (varios passed); smoke de preguntas-filtros; filter-view; flujo visual Copilot (`test:e2e:app:visual`). Para que pasen más tests (preguntas al Copilot, filtros con evento, flujo visual) la cuenta debe tener al menos un evento en app-test (el visual usa por defecto el evento "Raúl Isabel" si existe).
