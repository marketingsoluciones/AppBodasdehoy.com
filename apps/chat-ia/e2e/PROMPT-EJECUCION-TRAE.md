# Prompt ejecutivo E2E suite — para Trae IDE

**Estado actualizado 2026-05-21 (sesión Claude autónoma)**: Suite operativa con Firebase real, 6 sprints completados (A→F), patrón validado contra 3 usuarios reales.

**Cómo usar en Trae**:
1. Abre Trae IDE
2. Carga este archivo como contexto
3. Indica: `Ejecuta pnpm smoke:scripts en apps/chat-ia/e2e y reporta resultados`
4. Trae ejecutará vía bash el suite completo

---

## ✅ Estado actual confirmado

| Sprint | Validación | Status |
|---|---|---|
| A | Login Firebase real 3 usuarios + 3 rutas core | ✓ 9/9 |
| B | CRUD session (create UI + delete trpc API) | ✓ |
| C | storageState reuse (55% más rápido) | ✓ |
| D | Cucumber world.ts soporta STORAGE_STATE env | ✓ |
| E | Chat input → send → user msg + assistant loading | ⚙️ (build pendiente) |
| F | Memories CRUD modal interaction | ⚙️ |

---

## 🚀 Setup inicial (solo primera vez)

### 1. Worktree + deps
```bash
# Si no existe worktree dev:
cd "/Volumes/HD MAC BASE/Projects/AppBodasdehoy.com"
git worktree add /tmp/repo-dev origin/dev
cd /tmp/repo-dev && pnpm install --frozen-lockfile
```

### 2. Firebase env real (.env.local)
Crear `/tmp/repo-dev/apps/chat-ia/.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bodasdehoy-1063.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bodasdehoy-1063
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bodasdehoy-1063.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=593952495916
NEXT_PUBLIC_FIREBASE_APP_ID=1:593952495916:web:c63cf15fd16a6796f6f489
NEXT_PUBLIC_API_IA_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_DEVELOPMENT=bodasdehoy

TEST_USER_EMAIL=bodasdehoy.com@gmail.com
TEST_USER_PASSWORD=lorca2012M*+
TEST_USER2_EMAIL=jcc@marketingsoluciones.com
TEST_USER2_PASSWORD=madrid2012M*+
TEST_USER3_EMAIL=jcc@bodasdehoy.com
TEST_USER3_PASSWORD=lorca2012M*+
```

### 3. Playwright webkit
```bash
cd /tmp/repo-dev/apps/chat-ia/e2e
node node_modules/playwright/cli.js install webkit
```

---

## 🏗️ Build chat-ia en modo prod (CRÍTICO)

Dev mode (`next dev`) + webkit = chunk lazy loading fail → suite inestable. Build prod resuelve.

```bash
cd /tmp/repo-dev/apps/chat-ia
rm -rf .next
NODE_OPTIONS="--max-old-space-size=16384" node_modules/.bin/next build --no-lint
# ~5-7min
```

---

## ▶️ Arrancar dev server :3210 (pm2)

```bash
pm2 stop chat-ia-dev chat-ia-prod 2>/dev/null
cd /tmp/repo-dev/apps/chat-ia
pm2 start "node_modules/.bin/next start -p 3210 -H 0.0.0.0" --name chat-ia-prod --log /tmp/pm2-chat-ia-prod.log --time
# Wait until ready (puede tardar ~10s con build prod):
until curl -sf -o /dev/null --max-time 3 http://localhost:3210/; do sleep 2; done
echo "✓ :3210 ready"
```

---

## 🧪 Correr suite completa de smokes

```bash
cd /tmp/repo-dev/apps/chat-ia/e2e
pnpm smoke:scripts
# Ejecuta en serie:
# 1. save-storage-states.ts (login 3 users → .auth/{tag}.json) ~35s
# 2. smoke-with-state.ts (sanity 3 users skip login) ~28s
# 3. smoke-crud-session.ts (create + delete via trpc API) ~30s
# 4. smoke-chat-message.ts (input → send → assistant loading) ~60s
# 5. smoke-memories.ts (modal CRUD verify + cancel) ~25s
```

### Subset Cucumber autenticado (cuando specs migrados)
```bash
pnpm test:authenticated  # save-states + cucumber STORAGE_STATE @sessions
```

---

## 🔑 Pattern ganador (Coord Suite Pro playbook adaptado)

**Login Firebase real**:
```ts
await page.goto('/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);                              // chunks carga
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', pwd);
await page.waitForLoadState('networkidle');                   // pre-submit
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);                              // Firebase async sync
```

**Reuso storageState**:
```ts
const ctx = await browser.newContext({
  storageState: '.auth/super-admin.json',                     // skip login
  baseURL: 'http://localhost:3210',
});
```

**Cleanup via trpc API** (UI hover unreliable webkit):
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

---

## 🏷️ data-testid agregados (Sprint A→F)

| Componente | Selector | Uso |
|---|---|---|
| User avatar | `[data-testid="user-avatar"]` | Login verify |
| Session list item | `[data-testid="session-item"]` | Count + click |
| Session active | `[data-active="true"]` | Verify selección |
| New session button | `[data-testid="new-session-button"]` | Create flow |
| New session dropdown | `[data-testid="new-session-dropdown"]` | Group chat variant |
| Chat input wrapper | `[data-testid="chat-input"]` | Locate editor |
| Chat message | `[data-testid="chat-message"]` | Verify renderizado |
| Message role | `[data-role="user"]` / `[data-role="assistant"]` | Distinguir |
| Message loading | `[data-loading="true"]` | Assistant pending |

Login form selectors (sin testid, accesibles):
- Email: `input[name="email"]`
- Password: `input[name="password"]`
- Submit: `button[type="submit"]`

---

## 👥 Test users disponibles (.env.local)

| Var | Email | Rol | Password |
|---|---|---|---|
| TEST_USER | bodasdehoy.com@gmail.com | **SUPER ADMIN** (43 eventos, "Boda Isabel & Raúl") | `lorca2012M*+` |
| TEST_USER2 | jcc@marketingsoluciones.com | COLLABORATOR | `madrid2012M*+` |
| TEST_USER3 | jcc@bodasdehoy.com | CREATOR/INVITED | `lorca2012M*+` |

**Regla**: super admin libre + cleanup obligatorio. NUNCA tocar evento "Boda Isabel & Raúl".

---

## 🔧 Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `Loading chunk N failed` | dev mode + webkit | usar prod build (`next start`) |
| `auth/invalid-api-key` | `.env.local` falta | copiar Firebase env real |
| `INVALID_PASSWORD` collaborator | pwd era `lorca`, debe ser `madrid` | corregir TEST_USER2_PASSWORD |
| Cold compile timeout | dev mode | prod build resuelve (chunks pre-built) |
| `Executable doesn't exist webkit-XXXX` | Playwright version mismatch | `node node_modules/playwright/cli.js install webkit` |

---

## 📦 Sprints siguientes (roadmap)

- **Sprint G**: convertir Cucumber legacy → Playwright Test `.spec.ts` directo (eliminar tech debt)
- **Sprint H**: CRUD memorias album completo con cleanup via UI (delete confirm modal)
- **Sprint I**: CRUD evento via chat-ia tool function-calling (LLM determinism handling)
- **Sprint J**: Cross-app SSO chat-ia ↔ appEventos
- **Sprint K**: GitHub Actions CI workflow real (workflow ya commiteado en .github/workflows/e2e-chat-ia.yml)
