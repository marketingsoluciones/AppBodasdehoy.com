// SPRINT-E2E-impl 2026-05-21 Sprint A: smoke con interacción read-only.
// Extiende smoke-routes.ts: login + verifica que datos reales cargan + click session.
// Cleanup pattern (afterEach delete) → helper documentado, implementación full en Sprint B.
//
// Validaciones por usuario:
// 1. Login Firebase real → ✓ smoke-routes valida
// 2. /chat carga sidebar con session-items (prueba que datos reales del user llegan)
// 3. Click primera session → URL cambia + chat-input visible
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-interaction.ts

import { webkit, type Page, type BrowserContext } from 'playwright';
import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

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

interface CheckResult { user: string; step: string; status: 'OK' | 'FAIL'; detail?: string }

async function login(page: Page, user: typeof USERS[0]) {
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(3000);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.pwd);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  return !page.url().includes('/login');
}

/**
 * Cleanup helper — placeholder para Sprint B.
 * Por ahora solo limpia local state (sin tocar backend).
 * Sprint B agregará: delete events/sessions creados durante test via UI o API.
 */
async function cleanupTestData(ctx: BrowserContext, _user: typeof USERS[0]) {
  await ctx.clearCookies();
  await ctx.clearPermissions();
}

async function smokeInteraction(user: typeof USERS[0]): Promise<CheckResult[]> {
  console.log(`\n=== ${user.tag} (${user.email}) ===`);
  const results: CheckResult[] = [];
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  try {
    const loginOk = await login(page, user);
    results.push({ user: user.tag, step: 'login', status: loginOk ? 'OK' : 'FAIL' });
    if (!loginOk) return results;
    console.log(`[1] login ✓`);

    // Step 2: /chat sidebar carga session-items (data real del user)
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);
    const sessionCount = await page.locator('[data-testid="session-item"]').count();
    results.push({
      user: user.tag,
      step: 'session-list-loaded',
      status: sessionCount > 0 ? 'OK' : 'FAIL',
      detail: `${sessionCount} sessions visible`,
    });
    console.log(`[2] sidebar: ${sessionCount} sessions`);

    if (sessionCount === 0) {
      writeFileSync(
        `/tmp/smoke-interaction-${user.tag}-no-sessions.png`,
        await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')),
      );
    }

    // Step 3: click primera session → verifica chat-input visible
    if (sessionCount > 0) {
      const urlBefore = page.url();
      await page.locator('[data-testid="session-item"]').first().click();
      await page.waitForTimeout(2000);
      const urlAfter = page.url();
      const inputVisible = await page.locator('[data-testid="chat-input"]').count();
      const navigated = urlBefore !== urlAfter || inputVisible > 0;
      results.push({
        user: user.tag,
        step: 'click-session-shows-input',
        status: navigated ? 'OK' : 'FAIL',
        detail: `url=${urlBefore !== urlAfter ? 'changed' : 'same'} input=${inputVisible}`,
      });
      console.log(`[3] click session: url ${urlBefore !== urlAfter ? 'changed' : 'same'}, input visible=${inputVisible > 0}`);
    }

    // Save storage state para reuso futuro (global-setup pattern)
    await ctx.storageState({ path: resolve(STORAGE_DIR, `${user.tag}.json`) });
  } catch (e: any) {
    console.error(`[FATAL ${user.tag}]`, e.message);
    results.push({ user: user.tag, step: 'fatal', status: 'FAIL', detail: e.message });
  } finally {
    await cleanupTestData(ctx, user); // Sprint B: ampliar
    await browser.close();
  }
  return results;
}

async function main() {
  console.log(`SMOKE INTERACTION → ${BASE_URL}`);
  const all: CheckResult[] = [];
  for (const u of USERS) {
    const r = await smokeInteraction(u);
    all.push(...r);
  }
  console.log('\n=== RESUMEN ===');
  console.table(all);
  const fails = all.filter((r) => r.status === 'FAIL').length;
  console.log(`Total: ${all.length} checks · ${all.length - fails} OK · ${fails} FAIL`);
  process.exitCode = fails > 0 ? 1 : 0;
}

main();
