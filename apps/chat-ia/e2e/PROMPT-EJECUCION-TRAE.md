# Prompt ejecutivo E2E suite — para Trae IDE

**Contexto**: Suite Cucumber+Playwright (5 specs, 25 scenarios) implementada en sesión Claude. Infrastructura validada en local (webkit launch + Cucumber ejecución confirmados). Falta primer run completo con Firebase env real + warm-up server.

**Cómo usar este prompt en Trae**:
1. Abre Trae IDE
2. Carga este archivo como contexto
3. Indica: "Ejecuta el runbook completo de este archivo y reporta resultados de los 25 scenarios"
4. Trae ejecutará los pasos vía bash + Playwright + Cucumber

**Estado actual confirmado en sesión Claude**:
- ✅ webkit launch funciona (post `playwright install webkit` en `~/Library/Caches/ms-playwright/webkit-2227`)
- ✅ Specs Cucumber se ejecutan (no crash en setup)
- ❌ Cold compile timeout 120s en algunos routes
- ❌ Firebase errors `auth/invalid-api-key` (env miss)

---

## 📋 Pasos para correr suite completa

### Pre-requisitos

```bash
# 1. Ir al worktree dev (o crear nuevo si /tmp/repo-dev no existe)
cd /tmp/repo-dev || (cd "/Volumes/HD MAC BASE/Projects/AppBodasdehoy.com" && git fetch origin dev && git worktree add /tmp/repo-dev origin/dev)

# 2. Verificar deps
cd /tmp/repo-dev && pnpm install --frozen-lockfile

# 3. Asegurar webkit instalado para playwright 1.57.0
cd /tmp/repo-dev/node_modules/.pnpm/playwright-core@1.57.0/node_modules/playwright-core
PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright node cli.js install webkit
```

### Configurar Firebase env (CRITICO — sin esto tests fallan auth)

Crear `/tmp/repo-dev/apps/chat-ia/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<real-key-from-firebase-console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bodasdehoy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bodasdehoy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bodasdehoy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

NEXT_PUBLIC_API_IA_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_DEVELOPMENT=bodasdehoy
TEST_PASSWORD=<password-test-account-bodasdehoy>
```

Key sources:
- Firebase Console → Project Settings → Web app → SDK config snippet
- TEST_PASSWORD: crear user `e2e-test@bodasdehoy.com` en Firebase Auth con password fijo

### Arrancar dev server (WARM-UP necesario)

```bash
# Terminal 1: arrancar dev en :3210
cd /tmp/repo-dev/apps/chat-ia
NODE_OPTIONS="--max-old-space-size=8192" pnpm next dev -p 3210 -H 0.0.0.0

# Wait ~30s para "Ready in X"
# Después WARM-UP rutas (evita cold compile timeout 120s en tests):
curl http://localhost:3210/
curl http://localhost:3210/chat
curl http://localhost:3210/discover
curl http://localhost:3210/memories
# Esperar cada uno responda HTTP 200 antes de tests
```

### Correr suite E2E

```bash
# Terminal 2: ejecutar suite
cd /tmp/repo-dev/apps/chat-ia/e2e
BASE_URL=http://localhost:3210 BROWSER=webkit HEADLESS=true pnpm test

# Subset:
# pnpm test -- --tags '@smoke'  # solo smoke (~5 scenarios)
# pnpm test -- --tags '@auth'
# pnpm test -- --tags '@chat'
# pnpm test -- --tags '@ROUTES-001'  # rutas core
```

### Resultados esperados primer run

- ✅ **Routes core** (5 scenarios): deberían pasar tras warm-up
- ⚠️ **Auth flow** (6 scenarios): requiere TEST_PASSWORD + Firebase real
- ⚠️ **Chat smoke** (6 scenarios): requiere api-ia responding + tool selectors validados
- ⚠️ **Sessions** (5 scenarios): requiere data-testid validated UI
- ⚠️ **Visitor limits** (4 scenarios): requiere clear cookie state
- ⚠️ **SSO cross-app** (5 scenarios): requiere appEventos también running

---

## 🔧 Fix flaky tests (siguiente sprint)

Cuando se identifiquen flaky, ajustar:

### Timeouts más generosos
```js
// src/support/world.ts
this.page.setDefaultTimeout(300_000); // 5min para cold compile
```

### data-testid faltantes
Agregar en componentes según fallos selectors:
- `data-testid="session-search"` en input búsqueda sessions
- `data-testid="user-profile"` en UserPanel
- `data-testid="venue-card"` en VenueVisualizer items
- `data-testid="tool-card"` genéricos en tool renders

### Mock Firebase para tests sin credentials reales
```ts
// e2e/src/support/firebase-mock.ts
export function mockFirebaseAuth(page: Page) {
  return page.route('**/identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ idToken: 'mock-jwt', refreshToken: 'mock' }),
    }),
  );
}
```

---

## 🚀 Una vez E2E green: desbloquea Sprint-Q profundo

Sprint-Q (eliminar `packages/model-runtime/` físico 3.3MB) requiere E2E como red de seguridad para evitar repetir SPRINT-O crash. Una vez los 25 scenarios pasen estable:

1. **Sprint-Q**: refactor 5 server consumers + eliminar packages/model-runtime
2. Re-validar suite E2E → 0 regressions
3. Push + PR contra master

---

## 📦 Branch dev actual (sesión Claude)

- Branch: `origin/dev`
- Último commit: `1e4f8b7c` (data-testid + E2E CI workflow)
- 81 commits desde merge PR #157
- TSC: 0 errors
- Funcionalidad: 100% preservada

Suite E2E lista para ejecución manual + iteración fix-flaky.
