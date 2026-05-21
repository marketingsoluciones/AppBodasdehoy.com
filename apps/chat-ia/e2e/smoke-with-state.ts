// SPRINT-C 2026-05-21: smoke USANDO storageState pre-saved.
// Demuestra speedup: skip login (~20s) → directo a /chat.
// Pre-requisito: ejecutar save-storage-states.ts antes.
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-with-state.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');

const TAGS = ['super-admin', 'collaborator', 'invited'];

async function checkWithState(tag: string) {
  const statePath = resolve(STORAGE_DIR, `${tag}.json`);
  if (!existsSync(statePath)) {
    console.error(`❌ ${tag}: ${statePath} missing — run save-storage-states.ts first`);
    return;
  }
  const tStart = Date.now();
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });
  const page = await ctx.newPage();
  try {
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const onChat = page.url().includes('/chat') && !page.url().includes('/login');
    const sessionCount = await page.locator('[data-testid="session-item"]').count();
    const inputCount = await page.locator('[data-testid="chat-input"]').count();
    const ms = Date.now() - tStart;
    console.log(
      `${onChat && sessionCount > 0 ? '✓' : '✗'} ${tag.padEnd(13)} url=${page.url().slice(BASE_URL.length)} sessions=${sessionCount} input=${inputCount} (${ms}ms)`,
    );
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`SMOKE WITH STORAGE STATE → ${BASE_URL}`);
  for (const t of TAGS) await checkWithState(t);
}

main();
