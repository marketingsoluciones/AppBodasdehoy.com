# Sprint Tests Low-Resource — Plan TRAE-FRONT

> **Generado**: 2026-05-17 por COORD-AppEventos
> **Audiencia**: TRAE-FRONT (ejecutor de tests)
> **Pre-validado**: API-only smoke por COORD antes de enviar (low cost)

## Contexto

Migración cliente AppEventos → api-mcp canonical 100% completada (Sprint 1+2+3, 23 commits pushed a `dev`). Necesitamos validar regresión SIN castigar recursos locales (Playwright RAM/CPU).

## Estrategia mix de tests (low-resource first)

**Pirámide propuesta:**

```
              ╱─────────────╲
             ╱  UI Smoke 5%  ╲     ← Playwright/webkit · solo flows críticos UI
            ╱─────────────────╲
           ╱ Component Jest 25% ╲  ← Jest + RTL en apps/appEventos (sin browser)
          ╱─────────────────────╲
         ╱   API-only smoke 70%  ╲ ← Scripts mjs contra api-mcp + api-ia (Node, sin browser)
        ╱─────────────────────────╲
```

### Reparto por etapa

| Etapa | Framework | Recurso | Cuándo |
|---|---|---|---|
| **0. Pre-flight COORD** | bash + curl + Node | ⭐ trivial | Antes de enviar sprint — yo (COORD) corro `audit_domains.sh` |
| **1. API smoke** | `scripts/run-20-preguntas-api-ia.mjs --set smoke/filters/crud` | ⭐ bajo | Cada commit dev local |
| **2. Component Jest** | `pnpm exec jest` en apps/appEventos | ⭐⭐ medio | Por PR / merge |
| **3. UI smoke crítico** | Playwright webkit `e2e-app/smoke*.spec.ts` (~5 specs) | ⭐⭐⭐ alto | Pre-deploy test |
| **4. UI full regression** | Playwright webkit `e2e-app/*.spec.ts` (103 specs) | ⭐⭐⭐⭐⭐ muy alto | Solo CI dedicado / nightly |

## Tests existentes — inventario

### Jest (apps/appEventos · 7 tests)
```
__tests__/api/chat/messages.test.ts
__tests__/api/copilot/chat-history.test.ts
__tests__/api/copilot/chat.test.ts
__tests__/utils/apiEndpoints.test.ts
services/__tests__/copilotChat.test.ts
utils/__tests__/copilotSharedIntegration.test.ts
utils/__tests__/planLimitFromApiError.test.ts
```
→ **Gap**: cero tests sobre los 8 dominios migrados (Eventos, Invitados, Mesas, etc.).

### Playwright (e2e-app · 103 specs)
Mapeo por dominio (cobertura existente):
- Auth/Login: 13 specs
- Invitados: 8 specs
- Presupuesto/Billing: 7 specs
- Copilot/Chat: 7 specs
- Notificaciones: 6 specs
- Itinerario/Tareas: 5 specs
- Mesas: 3 specs
- Compartir/Permisos: 3 specs
- Smoke/Misc: 9 specs
- Otros (memorias, editor-web, multi-tenant, performance, etc.): 42 specs

### Scripts API-only (low-cost)
- `scripts/run-20-preguntas-api-ia.mjs` con `--set smoke|filters|crud|full` (20 preguntas chatbot)
- `scripts/get-firebase-token-and-run-20.mjs` (auth wrapper)

## Pre-flight COORD ya hecho (smoke api-mcp PROD)

✅ Validado in-vivo con auth Firebase real `bodasdehoy.com@gmail.com`:

```
1. getEventosByUsuario        OK_DATA
2. getEventoById              OK_DATA
3. queryenEvento              OK_DATA
4. getMySubscription          OK_DATA (status:ACTIVE)
5. getSubscriptionPlans       OK_DATA (3 planes)
6. getEmailValid              OK_DATA
7. createEvento (full cycle)  OK_DATA (success:true)
```

→ **Conclusión COORD**: dominios cliente migrados responden correctamente desde api-mcp. Sprint TRAE-FRONT puede asumir backend estable.

## Sprint 1 TRAE-FRONT — Tasks asignadas

### TASK-T1 (CRÍTICA · ~30 min · low resource)
**Validar smoke API-only contra dev local:**
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
bash scripts/with-root-e2e-env.sh dev node scripts/get-firebase-token-and-run-20.mjs --set smoke
bash scripts/with-root-e2e-env.sh dev node scripts/get-firebase-token-and-run-20.mjs --set filters
bash scripts/with-root-e2e-env.sh dev node scripts/get-firebase-token-and-run-20.mjs --set crud
```
**Reportar**: cuántas preguntas verdes / rojas + errores específicos.

### TASK-T2 (CRÍTICA · ~15 min · low resource)
**Ejecutar Jest unit tests (sin browser):**
```bash
cd apps/appEventos && pnpm exec jest --ci 2>&1 | tail -30
```
**Reportar**: pass/fail count + errores.

### TASK-T3 (IMPORTANTE · ~10 min · medio)
**Playwright smoke MÍNIMO (1-2 specs):**
```bash
E2E_HEADLESS=1 E2E_FAST=1 E2E_SKIP_HEALTH=1 npx playwright test --project=webkit e2e-app/smoke.spec.ts e2e-app/login.spec.ts
```
**Reportar**: pass/fail por spec + RAM peak.

### TASK-T4 (LUEGO de T1+T2+T3 verdes · ~1h · alto recurso)
**Playwright dominios migrados (8 specs seleccionadas):**
```bash
E2E_HEADLESS=1 E2E_FAST=1 npx playwright test --project=webkit \
  e2e-app/acciones-crud.spec.ts \
  e2e-app/invitados-menus-crud.spec.ts \
  e2e-app/mesas.spec.ts \
  e2e-app/presupuesto.spec.ts \
  e2e-app/share-event-permissions.spec.ts \
  e2e-app/notificaciones.spec.ts \
  e2e-app/kanban-tareas.spec.ts
```
**Reportar**: pass/fail por spec + RAM peak + screenshots fallos.

## Pregunta a TRAE-FRONT

Respondes en hilo Slack `#coordinacion` cada 5 minutos con avances:

- **¿En qué task estás ahora?**
- **¿Qué bloqueos hay?**
- **¿Qué sigue?**

COORD revisa Slack cada 5min, agrega tasks si surge algo, recibo resultados.

## Pre-validado por COORD (no es necesario re-correr)

- ✅ API smoke 7 endpoints críticos contra api-mcp PROD
- ✅ Dev local 3220 responde (HTTP 200 en rutas calientes)
- ✅ getEmailValid migrado a api-mcp (Fase 3e parcial · commit 4647c1b2)

## Fuera de scope sprint 1 (postponed)

- Refactor `facturacion.tsx` para `getSubscriptionPlans` + `subscribeToPlan` (Fase 3f, ~3h)
- Implementar `getBillingAddress` en api-mcp (depende backend)
- Performance/load tests (no aplica low-resource)
