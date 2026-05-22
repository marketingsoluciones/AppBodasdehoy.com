// Dual storage states — login a chat-ia (3210) Y appEventos (3220) en el MISMO context.
// Resuelve hallazgo SSO incompleto del commit 240585cd: cookie transfer no equivale a auth real.
//
// Output: .auth/super-admin-dual.json + .auth/invited-dual.json (+ collaborator si creds OK)
//   - cookies para localhost:3210 (chat-ia) Y localhost:3220 (appEventos)
//   - origins[] con localStorage de ambos dominios
//
// Run: cd apps/chat-ia/e2e && set -a && source ../../../.env.e2e.dev && set +a && npx tsx save-storage-states-dual.ts

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

const CHAT_URL = process.env.CHAT_URL || 'http://localhost:3210';
const APPEVENTOS_URL = process.env.APPEVENTOS_URL || 'http://localhost:3220';
const STORAGE_DIR = resolve(__dirname, '.auth');
if (!existsSync(STORAGE_DIR)) mkdirSync(STORAGE_DIR, { recursive: true });

const USERS = [
  { tag: 'super-admin', email: process.env.TEST_USER_EMAIL!, pwd: process.env.TEST_USER_PASSWORD! },
  { tag: 'collaborator', email: process.env.TEST_USER2_EMAIL!, pwd: process.env.TEST_USER2_PASSWORD! },
  { tag: 'invited', email: process.env.TEST_USER3_EMAIL!, pwd: process.env.TEST_USER3_PASSWORD! },
];

async function loginChatIA(page: any, email: string, pwd: string) {
  await page.goto(CHAT_URL + '/login', { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(3000);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pwd);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  if (page.url().includes('/login')) {
    throw new Error(`chat-ia login failed — still on /login`);
  }
}

async function loginAppEventos(page: any, email: string, pwd: string) {
  // /login renderiza SplitLoginPage de @bodasdehoy/auth-ui (mismo que chat-ia)
  // Inputs: input[name="email"] + input[name="password"]
  await page.goto(APPEVENTOS_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(4000);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pwd);
  await page.click('button[type="submit"]');
  // Esperar redirect — super-admin puede tardar más (api-ia user_uid lookup)
  // Poll cada 2s hasta 60s máximo
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);
    if (!page.url().includes('/login')) return;
  }
  throw new Error(`appEventos login failed — still on /login after 60s`);
}

async function saveDualFor(user: typeof USERS[0]) {
  const tStart = Date.now();
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    console.log(`[${user.tag}] login chat-ia ...`);
    await loginChatIA(page, user.email, user.pwd);
    console.log(`[${user.tag}] login appEventos ...`);
    await loginAppEventos(page, user.email, user.pwd);

    const out = resolve(STORAGE_DIR, `${user.tag}-dual.json`);
    await ctx.storageState({ path: out });
    const state = JSON.parse(readFileSync(out, 'utf-8'));
    const ms = Date.now() - tStart;
    console.log(`✓ ${user.tag.padEnd(13)} ${user.email.padEnd(35)} cookies=${state.cookies.length} origins=${state.origins.length} (${ms}ms)`);
  } catch (e: any) {
    console.error(`❌ ${user.tag}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await ctx.close();
    await browser.close();
  }
}

(async () => {
  console.log(`SAVE DUAL STATES → ${STORAGE_DIR}`);
  const okChat = await fetch(CHAT_URL).then((r) => r.ok).catch(() => false);
  const okApp = await fetch(APPEVENTOS_URL).then((r) => r.ok).catch(() => false);
  console.log(`pre-flight: chat-ia=${okChat} appEventos=${okApp}`);
  if (!okChat || !okApp) {
    console.error(`❌ ambos servers requeridos (chat-ia :3210, appEventos :3220)`);
    process.exit(1);
  }
  for (const u of USERS) {
    if (!u.email || !u.pwd) {
      console.log(`(skipping ${u.tag} — missing creds)`);
      continue;
    }
    await saveDualFor(u);
  }
  console.log('\nDone. Use:');
  console.log("  const ctx = await browser.newContext({ storageState: '.auth/super-admin-dual.json' });");
  console.log('Storage state incluye origins de :3210 Y :3220.');
})();
