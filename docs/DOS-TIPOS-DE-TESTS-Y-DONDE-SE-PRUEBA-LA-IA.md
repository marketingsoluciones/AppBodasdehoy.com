# Dos tipos de tests — y dónde se prueba la IA

Resumen corto: **solo hay dos tipos** de tests en el proyecto. El resto (Jest en appEventos, scripts de batería) son complementos.

---

## 1. Los dos tipos

| Tipo | Herramienta | Dónde está | Qué prueba |
|------|-------------|------------|------------|
| **Vitest** | Vitest | `apps/chat-ia/` (todos los `*.test.ts` / `*.test.tsx`) | Lógica de store, servicios, rutas, modelos — **sin llamar a la IA real**. |
| **E2E** | Playwright | `e2e-app/*.spec.ts` | Navegación, pantallas, login, flujos en navegador — **algunos sí envían mensajes al chat/IA**. |

**Comando rápido:**

- Vitest: `pnpm --filter @bodasdehoy/chat-ia exec vitest run`
- E2E: `pnpm exec playwright test --config=playwright.config.ts` (con `BASE_URL` y opcionalmente `PLAYWRIGHT_BROWSER=webkit`)

---

## 2. Dónde se prueba la IA (preguntas al chat / respuestas)

Esto **no** está en Vitest unitario (ahí todo va con mocks). Está en:

### 2.1 E2E (Playwright) — specs que envían mensajes al chat

| Spec | Qué hace con la IA |
|------|---------------------|
| **chat-ia-flows.spec.ts** | Envía prompts al chat (invitados, presupuesto, tareas, consejos, RAG, Wedding Creator, Memories). Comprueba respuestas y mutaciones en la app. |
| **multi-developer.spec.ts** | Incluye flujo de “IA reasoning” (preguntas sobre evento/módulos). |
| **visitor-limit.spec.ts** | Envía mensajes como visitante; comprueba límite de 3 mensajes. |
| **perfiles-visitante.spec.ts** | Carga chat-ia (chat-test), busca input del chat y envía mensajes. |
| **copilot-chat.spec.ts** | Iframe del copilot, contexto, modal 402. |
| **crud-ia-verificado.spec.ts** | CRUD vía IA y comprobación en UI. |

**Comando ejemplo (chat-ia-flows, los que más “prueban la IA”):**

```bash
BASE_URL=https://app-test.bodasdehoy.com CHAT_URL=https://chat-test.bodasdehoy.com \
  TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
  pnpm exec playwright test --config=playwright.config.ts e2e-app/chat-ia-flows.spec.ts
```

### 2.2 Scripts (no son Vitest ni E2E; son “baterías de preguntas”)

Estos **sí llaman a la IA real** (api-ia) con preguntas fijas y cuentan coherentes/incoherentes:

| Script | Qué hace |
|--------|----------|
| **scripts/run-20-preguntas-api-ia.mjs** | 20 preguntas contra `api-ia.bodasdehoy.com` (batería A). |
| **scripts/run-20-preguntas-api-ia-bateria-b.mjs** | Otras 20 preguntas (batería B). |
| **scripts/run-20-preguntas-api-ia-bateria-c.mjs** | Batería C. |
| **scripts/run-20-preguntas-api-ia-bateria-d.mjs** | Batería D. |
| **scripts/run-20-preguntas-via-proxy.mjs** | Mismas preguntas vía proxy del front (BASE_URL). |
| **apps/appEventos/scripts/test-copilot-battery.js** | Batería vía app (proxy); requiere app en marcha. |

**Comando ejemplo (probar la IA con 20 preguntas):**

```bash
node scripts/run-20-preguntas-api-ia.mjs --json
```

---

## 3. Resumen

- **Tipos de tests:** solo **Vitest** (chat-ia) y **E2E Playwright** (e2e-app). Lo demás (Jest appEventos, scripts) es otro tipo de verificación.
- **“Probar la IA”** está en:
  - **E2E:** sobre todo `e2e-app/chat-ia-flows.spec.ts`, y también multi-developer, visitor-limit, perfiles-visitante, copilot-chat, crud-ia-verificado.
  - **Scripts:** `scripts/run-20-preguntas-api-ia.mjs` (y baterías B/C/D) y, vía front, `run-20-preguntas-via-proxy.mjs` y `apps/appEventos/scripts/test-copilot-battery.js`.

Si quieres **solo** los tests que envían preguntas al chat/IA: ejecuta los specs de la tabla de 2.1 y/o los scripts de 2.2.
