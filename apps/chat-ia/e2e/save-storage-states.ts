// SPRINT-E2E-impl 2026-05-21 Sprint C: pre-cache storage states.
// Login una vez por user, guarda .auth/{tag}.json para reuso en specs.
// Pattern Coord Suite Pro playbook — evita re-login 20s por spec.
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx save-storage-states.ts
// Then specs: new browser context with `storageState: '.auth/super-admin.json'`

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

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

async function saveStateFor(user: typeof USERS[0]) {
  const tStart = Date.now();
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.pwd);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    if (page.url().includes('/login')) {
      console.error(`❌ ${user.tag} login failed — still on /login`);
      process.exitCode = 1;
      return;
    }

    const out = resolve(STORAGE_DIR, `${user.tag}.json`);
    await ctx.storageState({ path: out });
    const state = JSON.parse(readFileSync(out, 'utf-8'));
    const ms = Date.now() - tStart;
    console.log(
      `✓ ${user.tag.padEnd(13)} ${user.email.padEnd(36)} cookies=${state.cookies.length} origins=${state.origins.length} (${ms}ms)`,
    );
  } catch (e: any) {
    console.error(`❌ ${user.tag}:`, e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`SAVE STORAGE STATES → ${STORAGE_DIR}`);
  for (const u of USERS) await saveStateFor(u);
  console.log('\nDone. Use in specs:');
  console.log(`  const ctx = await browser.newContext({ storageState: '.auth/super-admin.json' });`);
  console.log('Refresh cada ~50min (Firebase JWT TTL 60min).');
}

main();
