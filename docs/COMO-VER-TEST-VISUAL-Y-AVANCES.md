# Cómo ver el test visual y que funcione en tu pantalla

**Objetivo del flujo:** El agente es **autónomo** (hace todo hasta dejar la pantalla con la pregunta lanzada al Copilot desde la app de bodas y la respuesta). El **usuario solo interviene** para confirmar si lo que ve en pantalla y la respuesta son adecuados a esa pregunta.

Para **ver** la ventana del navegador (login, preguntas, respuestas), a veces hay que ejecutar el test **en tu terminal**: el agente deja el entorno listo; si la ventana no se abre desde el agente, tú lanzas el comando y en cada pausa confirmas si lo que ves y la respuesta son adecuados a la pregunta.

---

## 1. Requisitos

- **Entorno OK:** `pnpm verificar:entornos` debe salir ✅. Si no:
  - Terminal 1: `pnpm dev:levantar`
  - Terminal 2: `./scripts/iniciar-tunnel.sh`
- **Navegador Playwright:** `pnpm exec playwright install webkit` (una vez).
- **Cuenta con evento:** El test usa por defecto **U1** (`bodasdehoy.com@gmail.com` / `lorca2012M*+`). Esa cuenta debe tener **al menos un evento** en app-test. Si no, crea uno entrando en https://app-test.bodasdehoy.com o usa **U2** más adelante: `TEST_USER_EMAIL=test-usuario2@bodasdehoy.com TEST_USER_PASSWORD='TestBodas2024!'` (las dos cuentas están en `docs/E2E-USUARIO-Y-TESTS-QUE-FUNCIONAN.md`).

---

## 2. Comando para ver el flujo (con pausas para certificar)

En **tu terminal**:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
pnpm test:e2e:app:visual
```

- Se abrirá una ventana **WebKit**.
- El test hará: login → seleccionar evento (p. ej. "Raúl Isabel") → por cada pregunta: enviar al Copilot → esperar respuesta → **pause**.
- En cada pausa verás la pantalla con la respuesta; **certifica** si es correcta y en la barra de Playwright pulsa **Resume** para seguir.

---

## 3. Navegador: solo WebKit (Chromium prohibido)

En este proyecto los E2E usan **WebKit**; **Chromium está prohibido**. Si WebKit no abre o falla, instala/repáralo con `pnpm exec playwright install webkit` y asegúrate de ejecutar el comando en tu terminal (no desde el agente). Para otros tests o más adelante recuerda que hay **dos cuentas** (U1 y U2) documentadas en `docs/E2E-USUARIO-Y-TESTS-QUE-FUNCIONAN.md`.

---

## 4. Ejecutar sin pausas (solo comprobar que el flujo termina)

```bash
E2E_WAIT_FOR_VISUAL_CONFIRMATION=0 pnpm test:e2e:app:visual
```

No se abrirá pausa; el test correrá hasta el final (o hasta fallo por falta de evento, etc.). Útil para ver en la terminal que login, evento y preguntas se ejecutan.

---

## 5. Resumen de avances (qué está hecho)

- **Test:** `e2e-app/flujo-copilot-confirmacion-visual.spec.ts` — login, evento, 5 preguntas al Copilot, comprobación de panel derecho, pausa por pregunta.
- **Comando:** `pnpm test:e2e:app:visual` (BASE_URL=app-test, credenciales en `e2e-app/fixtures.ts`).
- **Docs:** `docs/E2E-FLUJO-VERIFICACION-VISUAL.md`, `docs/E2E-USUARIO-Y-TESTS-QUE-FUNCIONAN.md` (las dos cuentas), regla `.cursor/rules/app-test-chat-test.mdc` (agente ejecuta, usuario certifica).
- **Entorno:** Cuando `pnpm verificar:entornos` da OK, app-test y chat-test están listos para este test.
- **Limitación:** Para **ver** la ventana y certificar, el comando debe ejecutarse en **tu** terminal; desde el agente el navegador no se muestra en tu pantalla.
