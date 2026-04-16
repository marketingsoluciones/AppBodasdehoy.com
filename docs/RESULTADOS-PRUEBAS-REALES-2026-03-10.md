# Resultados pruebas reales — 2026-03-10

Ejecución contra entornos reales (app-test, api-ia) hasta que todos los tests pasen o se omitan de forma controlada.

**Última verificación:** Vitest 3.233 passed / 155 skipped · appEventos 46 passed · Batería 20 → 20/20 coherentes.

---

## 1. Chat-ia Vitest (completo)

```bash
pnpm --filter @bodasdehoy/chat-ia exec vitest run
```

| Concepto | Cantidad |
|----------|----------|
| **Archivos de test** | 299 (285 ejecutados, 14 skipped) |
| **Tests totales** | **3.388** |
| **Tests que pasan** | **3.233** |
| **Tests omitidos** | 155 (integration/backend/entorno) |
| **Tests fallidos** | 0 |
| Duración | ~4 min |

Los 15 tests de **Message Router Integration** se omiten por defecto (requieren red para `getTestDB()`). Para ejecutarlos (con red):  
`RUN_INTEGRATION_TESTS=1 pnpm --filter @bodasdehoy/chat-ia exec vitest run src/server/routers/lambda/__tests__/integration/message.integration.test.ts`  
→ **15 passed, 1 skipped** cuando hay red.

### Solo store (subset)

```bash
pnpm --filter @bodasdehoy/chat-ia exec vitest run "src/store"
```

| Resultado |
|-----------|
| 94 archivos, 1272 tests pasaron, 1 skipped (~94 s) |

---

## 2. appEventos (Jest)

```bash
pnpm test:web
```

| Resultado |
|-----------|
| **8** suites, **46** tests pasaron |
| Duración ~3 s |

---

## 3. E2E (Playwright, WebKit, BASE_URL=app-test)

```bash
BASE_URL=https://app-test.bodasdehoy.com CI=true PLAYWRIGHT_BROWSER=webkit \
  pnpm exec playwright test e2e-app/smoke.spec.ts e2e-app/home.spec.ts e2e-app/login.spec.ts e2e-app/redirect-login.spec.ts
```

| Resultado |
|-----------|
| **5** passed, **3** skipped, **0** failed |
| Exit code **0** |

- **Skips:** 2 redirect-login (cuando chat-test no responde) + 1 smoke/health (solo local). Cuando chat-test responde 200, los redirect pueden ejecutarse (requiere WebKit instalado: `pnpm exec playwright install webkit`).
- Cambio en código: en `redirect-login.spec.ts` se comprueba si chat-test responde (`isChatTestReachable`); si no, se omiten los dos tests de redirect para que la suite no falle.

---

## 4. Batería 20 preguntas (api-ia real)

```bash
node scripts/run-20-preguntas-api-ia.mjs --json
```

| Resultado |
|-----------|
| **20/20** coherentes (HTTP 200) |
| JSON: `resultados-20-preguntas-2026-03-10.json` |

---

## Resumen

| Suite | Pasados | Omitidos | Fallos | Total |
|-------|---------|----------|--------|-------|
| **Vitest chat-ia** | **3.233** | 155 | 0 | **3.388** |
| appEventos | 46 | 0 | 0 | 46 |
| E2E (smoke+home+login+redirect) | 5 | 3 | 0 |
| Batería 20 preguntas | 20 | 0 | 0 |

**Todos los tests que se ejecutan pasan.** Los omitidos son esperados (health solo local, redirect cuando chat-test no está disponible).

---

## Cómo repetir

- **Store:** `pnpm --filter @bodasdehoy/chat-ia exec vitest run "src/store"`
- **appEventos:** `pnpm test:web`
- **E2E (pruebas reales app-test):** `BASE_URL=https://app-test.bodasdehoy.com CI=true PLAYWRIGHT_BROWSER=webkit pnpm exec playwright test --config=playwright.config.ts e2e-app/smoke.spec.ts e2e-app/home.spec.ts e2e-app/login.spec.ts e2e-app/redirect-login.spec.ts`
- **Batería 20:** `node scripts/run-20-preguntas-api-ia.mjs --json`
