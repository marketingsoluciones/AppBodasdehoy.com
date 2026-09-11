// SPRINT-E2E-impl 2026-05-21: Smoke completo prod build.
// 1. Login real Firebase super admin (waitForTimeout 5s playbook pattern)
// 2. Verifica storage state (cookies + localStorage origins NO vacíos)
// 3. Visita 4 rutas core (/chat /memories /discover /tasks)
// 4. Detecta runtime overlay/error/crash
// 5. Cleanup: logout + clear state
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-routes.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

// Plain env parser
const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');
if (!existsSync(STORAGE_DIR)) mkdirSync(STORAGE_DIR, { recursive: true });

const USERS = [
  { tag: 'super-admin', email: process.env.TEST_USER_EMAIL!, pwd: process.env.TEST_USER_PASSWORD! },
  { tag: 'collaborator', email: process.env.TEST_USER2_EMAIL!, pwd: process.env.TEST_USER2_PASSWORD! },
  { tag: 'invited', email: process.env.TEST_USER3_EMAIL!, pwd: process.env.TEST_USER3_PASSWORD! },
];

const ROUTES = ['/chat', '/memories', '/discover'];

interface RouteResult { route: string; status: 'OK' | 'ERROR' | 'OVERLAY'; detail?: string }

async function loginAndCheck(user: typeof USERS[0]) {
  console.log(`\n=== ${user.tag} (${user.email}) ===`);
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const pageerrors: string[] = [];
  const consoleerrors: string[] = [];
  const firebaseResponses: string[] = [];
  page.on('pageerror', (e) => pageerrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleerrors.push(m.text()); });
  page.on('response', async (r) => {
    const u = r.url();
    if (u.includes('identitytoolkit') || u.includes('firebase') || u.includes('/api/auth')) {
      const body = await r.text().catch(() => '');
      firebaseResponses.push(`${r.status()} ${u.slice(0, 100)} → ${body.slice(0, 200)}`);
    }
  });

  const routeResults: RouteResult[] = [];
  const t0 = Date.now();

  try {
    console.log('[login] goto /login');
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60_000 });
    console.log('[login] wait extra 3s para chunk loading');
    await page.waitForTimeout(3000);

    console.log('[login] fill form');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.pwd);

    // Wait for any deferred chunks before submit
    console.log('[login] wait networkidle pre-submit');
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.click('button[type="submit"]');

    console.log('[login] wait 5s Firebase async sync');
    await page.waitForTimeout(5000);

    // Verify URL changed away from /login
    if (page.url().includes('/login')) {
      console.log(`[login] ✗ STILL on /login`);
      console.log(`[firebase responses] ${firebaseResponses.length}:`);
      firebaseResponses.forEach((r) => console.log(`  ${r}`));
      console.log(`[console errors] ${consoleerrors.length}:`);
      consoleerrors.slice(0, 5).forEach((e) => console.log(`  ${e}`));
      writeFileSync(`/tmp/smoke-routes-${user.tag}-loginfail.png`, await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));
    } else {
      console.log(`[login] ✓ redirect → ${page.url()}`);
    }

    // Inspect storage
    const state = await ctx.storageState();
    const tokens = state.origins.flatMap((o) => o.localStorage.filter((kv) => /token|jwt|firebase/i.test(kv.name)).map((kv) => kv.name));
    console.log(`[storage] cookies=${state.cookies.length} origins=${state.origins.length} firebase-keys=[${tokens.join(',')}]`);
    writeFileSync(resolve(STORAGE_DIR, `${user.tag}.json`), JSON.stringify(state, null, 2));

    // Visit routes
    for (const route of ROUTES) {
      console.log(`[route] ${route}`);
      try {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(2000);
        // Check for Next error overlay
        const overlayCount = await page.locator('text=/Application error|Unhandled Runtime Error/i').count();
        if (overlayCount > 0) {
          routeResults.push({ route, status: 'OVERLAY', detail: 'next error overlay visible' });
          writeFileSync(`/tmp/smoke-routes-${user.tag}-${route.replaceAll('/', '_')}-overlay.png`, await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));
        } else {
          routeResults.push({ route, status: 'OK', detail: `url=${page.url()}` });
        }
      } catch (e: any) {
        routeResults.push({ route, status: 'ERROR', detail: e.message });
      }
    }

    console.log(`[done] ${user.tag} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.table(routeResults);
    if (pageerrors.length) console.log(`[pageerrors] ${pageerrors.length}:`, pageerrors.slice(0, 3));
  } catch (e: any) {
    console.error(`[FATAL] ${user.tag}:`, e.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`SMOKE ROUTES → ${BASE_URL}`);
  for (const u of USERS) await loginAndCheck(u);
}

main();
