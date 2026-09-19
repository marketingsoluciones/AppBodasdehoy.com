# E2E Base Scaffold — Sprint Pre-Q (red de seguridad)

Creados 5 specs Cucumber+Playwright para **red de seguridad** antes de Sprint-Q profundo (eliminar `packages/model-runtime/` físico).

## Specs creados (SPRINT-E2E-1 a E2E-5)

| Spec | Cobertura |
|---|---|
| `auth-flow.feature` | Firebase login + SSO redirect + token refresh + logout |
| `chat-smoke.feature` | Send message + streaming + tools + error handling + cold load |
| `sessions.feature` | Create + rename + delete + persistence + search |
| `visitor-limits.feature` | Message cap + commercial prompt + guest daily cap + no-leak |
| `sso-cross-app.feature` | chat-ia ↔ appEventos session sync (cookie + localStorage) |

## Estado actual

- **Specs**: 25 scenarios documentados
- **Steps implementations**: ⬜ pendiente — `src/steps/*.ts` debe crear matching code
- **CI integration**: ⬜ pendiente — añadir a `.github/workflows/e2e.yml`
- **Ejecución**: ⬜ pendiente — primer run en CI + corrección flaky tests

## Tiempo estimado para 100% E2E

| Tarea | Horas |
|---|---|
| Implementar `steps/*.ts` para 25 scenarios | 6-8h |
| Setup Playwright config (webkit per memoria) | 1h |
| GlobalSetup con seed user via UI | 1h |
| Primer run + fix flaky scenarios | 3-4h |
| CI workflow integration | 1h |
| **TOTAL** | **12-15h** |

## Por qué Cucumber+Playwright

- chat-ia ya tiene infrastructure (`e2e/` con Cucumber+Playwright)
- Specs en plain English → product team puede revisar
- Tags `@auth @smoke @chat` permiten run subsets

## Memoria de proyecto aplicada

- ✅ Tests E2E SOLO via UI (NUNCA pedir seed api-mcp/api-ia)
- ✅ Detectar runtime errors via `assertNoRuntimeError(page)` helper
- ✅ Playwright webkit (NO chromium per memoria)
- ✅ Baterías 1-3 specs + cleanup entre runs

## Próximo paso

Sprint dedicado E2E implementation (12-15h):
1. Implementar `steps/auth.ts`, `steps/chat.ts`, etc
2. Setup `support/world.ts` con Playwright Browser context
3. Crear `support/seed-user.ts` que crea test user via UI signup
4. Ejecutar suite + fix flaky tests
5. Integrar en `.github/workflows/e2e.yml`
6. **Una vez E2E green → Sprint-Q profundo desbloqueado**
