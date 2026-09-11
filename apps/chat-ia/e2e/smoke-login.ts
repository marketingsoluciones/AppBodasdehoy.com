// SPRINT-E2E-impl 2026-05-21: Smoke login real Firebase (super admin).
// Pattern Coord Suite Pro: waitForTimeout 5s post-login para Firebase async sync.
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-login.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';

// Plain env parser (evitar dep dotenv que rompe workspace pnpm)
const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';
const STORAGE_DIR = resolve(__dirname, '.auth');

async function main() {
  if (!EMAIL || !PASSWORD) throw new Error('TEST_USER_EMAIL/PASSWORD missing en .env.local');
  console.log(`[smoke] login ${EMAIL} → ${BASE_URL}`);

  if (!existsSync(STORAGE_DIR)) mkdirSync(STORAGE_DIR, { recursive: true });

  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('favicon')) {
      console.log(`[${r.status()}] ${r.url()}`);
    }
  });

  const t0 = Date.now();
  try {
    console.log('[1] goto /login');
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
    console.log(`    title="${await page.title()}" url=${page.url()}`);
    writeFileSync('/tmp/smoke-login-01-login-page.png', await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));

    console.log('[2] fill email + password');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    console.log('[3] click submit');
    await page.click('button[type="submit"]');

    console.log('[4] wait 5s para Firebase async sync (playbook pattern)');
    await page.waitForTimeout(5000);

    console.log('[5] esperar redirect /chat o capturar estado actual');
    try {
      await page.waitForURL(/\/(chat|home|dashboard)/, { timeout: 30_000 });
      console.log(`    ✓ redirect → ${page.url()}`);
    } catch {
      console.log(`    ✗ NO redirect — url=${page.url()}`);
    }

    writeFileSync('/tmp/smoke-login-02-after-submit.png', await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));

    console.log('[6] guardar storage state');
    const statePath = resolve(STORAGE_DIR, 'super-admin.json');
    await ctx.storageState({ path: statePath });
    console.log(`    storageState → ${statePath}`);

    console.log(`[done] ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    writeFileSync('/tmp/smoke-login-FATAL.png', await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')).catch(() => Buffer.from('')));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
