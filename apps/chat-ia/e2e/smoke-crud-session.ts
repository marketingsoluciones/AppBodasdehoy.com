// SPRINT-B 2026-05-21: smoke CRUD session con cleanup pattern real.
// Demuestra: create → verify → delete → verify-cleanup.
// Cumple memory/feedback_e2e_super_admin_cleanup.md (super admin libre + cleanup obligatorio).
//
// Pre-requisito: save-storage-states.ts ejecutado.
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-crud-session.ts

import { webkit, type Page } from 'playwright';
import { resolve } from 'path';
import { existsSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');
const USER_TAG = process.env.USER_TAG || 'super-admin';

async function countSessions(page: Page): Promise<number> {
  return page.locator('[data-testid="session-item"]').count();
}

async function clickNewSession(page: Page) {
  // Selector dual: feature-flag enableGroupChat decide cuál de los dos botones aparece
  const btn = page.locator(
    '[data-testid="new-session-button"], [data-testid="new-session-dropdown"]',
  );
  await btn.first().waitFor({ state: 'visible', timeout: 10_000 });
  await btn.first().click();
}

async function getSessionIds(page: Page): Promise<string[]> {
  // Cada session-item está dentro de un Link <a aria-label={id}>
  return page.locator('a[aria-label]:has([data-testid="session-item"])').evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')!).filter(Boolean),
  );
}

async function deleteSessionByApi(page: Page, sessionId: string): Promise<{ ok: boolean; status: number; body: string }> {
  // Cleanup via trpc HTTP API (ahooks useHover incompatible con webkit → UI flow inestable).
  // Memory feedback_e2e_super_admin_cleanup.md permite "delete via API o navegación UI".
  return page.evaluate(async (id) => {
    const body = { 0: { json: { id } } };
    const r = await fetch(`/trpc/lambda/session.removeSession?batch=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return { ok: r.ok, status: r.status, body: (await r.text()).slice(0, 200) };
  }, sessionId);
}

async function main() {
  const statePath = resolve(STORAGE_DIR, `${USER_TAG}.json`);
  if (!existsSync(statePath)) {
    console.error(`❌ Missing ${statePath} — run save-storage-states.ts first`);
    process.exitCode = 1;
    return;
  }

  console.log(`SMOKE CRUD SESSION → ${USER_TAG}`);
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  try {
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const idsBefore = await getSessionIds(page);
    const before = idsBefore.length;
    console.log(`[1] sessions BEFORE: ${before}`);

    console.log(`[2] click new-session button`);
    await clickNewSession(page);
    await page.waitForTimeout(3000);

    const idsAfterCreate = await getSessionIds(page);
    const afterCreate = idsAfterCreate.length;
    console.log(`[3] sessions AFTER create: ${afterCreate} (expected ${before + 1})`);
    const createOk = afterCreate === before + 1;
    console.log(`    create result: ${createOk ? '✓' : '✗'}`);

    // ID del NUEVO session (no estaba antes)
    const newSessionId = idsAfterCreate.find((id) => !idsBefore.includes(id));
    console.log(`    new session id: ${newSessionId}`);

    console.log(`[4] CLEANUP: delete vía trpc API`);
    if (!newSessionId) {
      console.log(`    no new session id detected — skipping`);
    } else {
      const result = await deleteSessionByApi(page, newSessionId);
      console.log(`    api response: status=${result.status} ok=${result.ok}`);
      if (!result.ok) console.log(`    body: ${result.body}`);
      // Reload para que UI refleje
      await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(2000);
    }

    const afterDelete = (await getSessionIds(page)).length;
    console.log(`[5] sessions AFTER delete: ${afterDelete} (expected ${before})`);
    const cleanupOk = afterDelete === before;
    console.log(`    cleanup result: ${cleanupOk ? '✓' : '✗'}`);

    console.log(`\n=== RESUMEN ${USER_TAG} ===`);
    console.log(`  create: ${createOk ? '✓' : '✗'}`);
    console.log(`  cleanup: ${cleanupOk ? '✓' : '✗'}`);
    process.exitCode = createOk && cleanupOk ? 0 : 1;
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
