# E2E Test Suite — chat-ia

Suite completa Playwright Test + smoke scripts para chat-ia operativa con Firebase real + 3 usuarios.

**Status (2026-05-21 sesión autónoma A→O):**
- **11/11 Playwright Test specs PASS** (sessions, chat-smoke, auth-flow, sso-cross-app, visitor-limits)
- **7 smoke scripts** (login, state, crud, chat-message, memories, sso, auth-state)
- Tiempo total suite: ~1.4 min webkit prod build

---

## 🚀 Setup (primera vez)

### Pre-requisitos
- Node 22+ (Node 25 funciona con warning)
- pnpm 8
- Worktree o repo principal limpio

### 1. Worktree (recomendado para iteración aislada)
```bash
cd "/Volumes/HD MAC BASE/Projects/AppBodasdehoy.com"
git worktree add /tmp/repo-dev origin/dev
cd /tmp/repo-dev && pnpm install --frozen-lockfile
```

### 2. Crear `.env.local` con Firebase real + test users
```bash
cat > /tmp/repo-dev/apps/chat-ia/.env.local <<'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bodasdehoy-1063.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bodasdehoy-1063
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bodasdehoy-1063.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=593952495916
NEXT_PUBLIC_FIREBASE_APP_ID=1:593952495916:web:c63cf15fd16a6796f6f489
NEXT_PUBLIC_API_IA_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_DEVELOPMENT=bodasdehoy
APPEVENTOS_URL=http://localhost:3220

TEST_USER_EMAIL=bodasdehoy.com@gmail.com
TEST_USER_PASSWORD=lorca2012M*+
TEST_USER2_EMAIL=jcc@marketingsoluciones.com
TEST_USER2_PASSWORD=madrid2012M*+
TEST_USER3_EMAIL=jcc@bodasdehoy.com
TEST_USER3_PASSWORD=lorca2012M*+
EOF
```

### 3. Playwright webkit binaries
```bash
cd /tmp/repo-dev/apps/chat-ia/e2e
node node_modules/playwright/cli.js install webkit       # para tsx smokes (playwright 1.58)
npx playwright install webkit                            # para @playwright/test 1.57
```

---

## 🏗️ Servidores requeridos

### chat-ia PROD :3210 (NUNCA dev — chunk failures con webkit)
```bash
cd /tmp/repo-dev/apps/chat-ia
rm -rf .next
NODE_OPTIONS="--max-old-space-size=16384" node_modules/.bin/next build --no-lint
# ~5-7min UNA vez

pm2 start "node_modules/.bin/next start -p 3210 -H 0.0.0.0" --name chat-ia-prod --log /tmp/pm2-chat-ia-prod.log --time
until curl -sf -o /dev/null --max-time 3 http://localhost:3210/; do sleep 2; done && echo "✓"
```

### appEventos DEV :3220 (opcional — solo SSO test)
```bash
cd "/Volumes/HD MAC BASE/Projects/AppBodasdehoy.com"
pm2 start "pnpm dev:web" --name appbodas-dev
# Cold compile ~2-3min
```

---

## ▶️ Ejecutar

### Smoke scripts (Bash + tsx, sin runner formal)
```bash
cd /tmp/repo-dev/apps/chat-ia/e2e
pnpm smoke:scripts
```
Orquesta en serie:
| Script | Valida | Tiempo |
|---|---|---|
| `save-storage-states.ts` | Login 3 users → `.auth/{tag}.json` | ~35s |
| `smoke-with-state.ts` | 3 users skip login + sessions visibles | ~28s |
| `smoke-crud-session.ts` | create UI + delete trpc API | ~25s |
| `smoke-chat-message.ts` | input + Enter + AI responde + cleanup | ~25s |
| `smoke-memories.ts` | /memories + modal CRUD + cancel | ~15s |
| `smoke-auth-state.ts` | cookies + tokens + email match | ~30s |

### Playwright Test (suite formal)
```bash
pnpm pw:test                            # full: 11 tests
pnpm pw:sessions                        # solo sessions spec
npx playwright test tests/auth-flow --project=webkit-super-admin
```

| Spec | Tests | Cobertura |
|---|---|---|
| `sessions.spec.ts` | 3 | create + cleanup, persistence reload, click switch |
| `chat-smoke.spec.ts` | 3 | no chunk errors, send msg + AI, session switch |
| `auth-flow.spec.ts` | 2 | login real Firebase + no runtime errors |
| `sso-cross-app.spec.ts` | 1 | cookie idToken cross-app |
| `visitor-limits.spec.ts` | 2 | visitor /chat load + no Authorization leak |

### CI GitHub Actions
Workflow `.github/workflows/e2e-chat-ia.yml` corre todo en push/PR a dev/master.
Requiere secrets (Settings → Secrets → Actions):
- `E2E_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/STORAGE_BUCKET/MESSAGING_SENDER_ID/APP_ID`
- `E2E_TEST_USER_EMAIL/PASSWORD`, `USER2_*`, `USER3_*`

---

## 🔑 Patterns reusables (Coord Suite Pro playbook adaptado)

### Login real Firebase
```ts
await page.goto('/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);                          // chunks load
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', pwd);
await page.waitForLoadState('networkidle');               // pre-submit
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);                          // Firebase async sync
```

### Storage state reuse (skip login)
```ts
const ctx = await browser.newContext({
  storageState: '.auth/super-admin.json',
});
// ~55% más rápido que login en cada test
```

### Cleanup vía trpc API (UI hover unreliable webkit)
```ts
await page.evaluate(async (id) => {
  await fetch('/trpc/lambda/session.removeSession?batch=1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ 0: { json: { id } } }),
    credentials: 'include',
  });
}, sessionId);
```

### Detectar session por ID (no por count)
```ts
const beforeSet = new Set(await getSessionIds(page));
await clickNewSessionButton();
// Poll para detectar id nuevo (resistente a flaky baseline)
const newId = await poll(() => getSessionIds(page).then((ids) => ids.find((id) => !beforeSet.has(id))));
```

### SSO cross-app (localhost simula prod Domain=.bodasdehoy.com)
```ts
const state = JSON.parse(readFileSync('.auth/super-admin.json', 'utf-8'));
const idToken = state.cookies.find((c) => c.name === 'idTokenV0.1.0');
await ctx.addCookies([{ name: 'idTokenV0.1.0', value: idToken.value, domain: 'localhost', path: '/', sameSite: 'Lax' }]);
await page.goto(APPEVENTOS_URL, { waitUntil: 'domcontentloaded' });  // NO networkidle (socket.io polling)
```

---

## 🏷️ data-testid index

| Componente | Selector | Sprint |
|---|---|---|
| User avatar | `[data-testid="user-avatar"]` | A |
| Session list item | `[data-testid="session-item"]` | A |
| Session active | `[data-active="true"]` | A |
| Chat input wrapper | `[data-testid="chat-input"]` | A |
| New session button | `[data-testid="new-session-button"]` | B |
| New session dropdown | `[data-testid="new-session-dropdown"]` | B |
| Chat message | `[data-testid="chat-message"]` | E |
| Message role | `[data-role="user|assistant|tool"]` | E |
| Message loading | `[data-loading="true|false"]` | E |

Login form (accesibles sin testid):
- `input[name="email"]` / `input[name="password"]` / `button[type="submit"]`

---

## 👥 Test users

| Var | Email | Rol Firebase | Password |
|---|---|---|---|
| TEST_USER | `bodasdehoy.com@gmail.com` | **SUPER ADMIN propietario** (43 eventos) | `lorca2012M*+` |
| TEST_USER2 | `jcc@marketingsoluciones.com` | COLLABORATOR | `madrid2012M*+` |
| TEST_USER3 | `jcc@bodasdehoy.com` | CREATOR/INVITED | `lorca2012M*+` |

**Reglas (memoria proyecto):**
- Super admin libre + **cleanup obligatorio** en afterEach (delete created data)
- NUNCA tocar evento `Boda Isabel & Raúl` (principal del super admin)
- Cuentas independientes — bodasdehoy.com@gmail.com y jcc@bodasdehoy.com son distintos UIDs Firebase

---

## 🔧 Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `Loading chunk N failed` | dev mode + webkit | usar prod build (`next start`) |
| `auth/invalid-api-key` | `.env.local` falta | regenerar con secrets reales |
| `INVALID_PASSWORD` collaborator | pwd era `lorca` | usar `madrid2012M*+` |
| Cold compile timeout | dev mode | prod build resuelve (chunks pre-built) |
| `Executable doesn't exist webkit-2227` | @playwright/test 1.57 needs webkit-2227 | `npx playwright install webkit` |
| `Executable doesn't exist webkit-2248` | playwright 1.58 needs webkit-2248 | `node node_modules/playwright/cli.js install webkit` |
| SSO test skipped | APP_URL=:8000 (api-ia python) | usar `APPEVENTOS_URL=http://localhost:3220` |
| Sessions-create flaky | otro spec dejó state pendiente | usar poll con ID nuevo no count |
| Cancel modal "FAIL" | antd animation no terminó | `:visible` pseudo-selector + 2s wait |
| `networkidle` timeout appEventos | socket.io polling continuo api3-ia NXDOMAIN | usar `domcontentloaded` |

---

## 📚 Histórico Sprints sesión autónoma A→O (2026-05-21)

| Sprint | Entregable | Resultado |
|---|---|---|
| A | smoke-routes + smoke-interaction 3 users 3 rutas | 9/9 OK |
| B | smoke-crud-session create UI + delete trpc | OK |
| C | save-storage-states + world.ts STORAGE_STATE (55% faster) | OK |
| D | npm scripts test:authenticated + smoke:scripts | OK |
| E | smoke-chat-message (input + AI responde + cleanup) | OK |
| F | smoke-memories (modal CRUD + cancel) | 4/4 OK |
| G | playwright.config + sessions.spec.ts puro | 3/3 |
| I | smoke-auth-state (cookies + tokens + email) | 15/15 |
| J | smoke-sso-cross-app + sso-cross-app.spec.ts | 3/3 |
| K | chat-smoke.spec.ts (Cucumber → Playwright) | 3/3 |
| L | CI workflow GitHub Actions actualizado prod build | YAML válido |
| M | auth-flow.spec.ts + visitor-limits.spec.ts | 4/4 |
| O | E2E.md documentación completa | este file |

---

## 🚀 Próximos Sprints (roadmap)

- **Sprint N**: smoke-events.ts — crear evento real via chat-ia AI tool (create_event function-calling)
- **Sprint P**: visitor-message-limit completo (5 msgs + modal "Crea una cuenta")
- **Sprint Q**: auth-token-refresh (60s+ wait flow)
- **Sprint R**: chat-tool-invocation (venue-visualizer renderiza inline)
- **Sprint S**: bundle-size GitHub Action integrado con Sentry alerts
- **Sprint T**: video recording per test failure (Playwright trace viewer)
- **Sprint U**: descomisionar Cucumber legacy (5 features + 5 steps files), eliminar `@cucumber/cucumber` dep
