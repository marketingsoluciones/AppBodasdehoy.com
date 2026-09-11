// SPRINT-E 2026-05-21: smoke chat-input → send message → verify rendering.
// Crea sesión efímera, envía mensaje, verifica user msg + assistant loading,
// cleanup via trpc API.
//
// Pre-requisito: save-storage-states.ts ejecutado.
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-chat-message.ts

import { webkit, type Page } from 'playwright';
import { resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');
const USER_TAG = process.env.USER_TAG || 'super-admin';
const TEST_MSG = `E2E-${Date.now()}: ping`;

async function getSessionIds(page: Page): Promise<string[]> {
  return page.locator('a[aria-label]:has([data-testid="session-item"])').evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')!).filter(Boolean),
  );
}

async function deleteSession(page: Page, id: string) {
  await page.evaluate(async (sessionId) => {
    await fetch('/trpc/lambda/session.removeSession?batch=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 0: { json: { id: sessionId } } }),
      credentials: 'include',
    });
  }, id);
}

async function main() {
  const statePath = resolve(STORAGE_DIR, `${USER_TAG}.json`);
  if (!existsSync(statePath)) {
    console.error(`❌ Missing ${statePath} — run save-storage-states.ts first`);
    process.exitCode = 1;
    return;
  }

  console.log(`SMOKE CHAT MESSAGE → ${USER_TAG} · "${TEST_MSG}"`);
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });
  const page = await ctx.newPage();
  let newSessionId: string | undefined;

  try {
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    const idsBefore = await getSessionIds(page);
    console.log(`[1] sessions BEFORE: ${idsBefore.length}`);

    console.log(`[2] crear nueva sesión efímera`);
    await page.locator('[data-testid="new-session-button"], [data-testid="new-session-dropdown"]').first().click();
    await page.waitForTimeout(3000);

    const idsAfter = await getSessionIds(page);
    newSessionId = idsAfter.find((id) => !idsBefore.includes(id));
    console.log(`    new session: ${newSessionId}`);

    if (!newSessionId) {
      console.error('    ✗ no new session created');
      process.exitCode = 1;
      return;
    }

    console.log(`[3] enfocar chat-input + escribir mensaje`);
    const chatInputContainer = page.locator('[data-testid="chat-input"]');
    await chatInputContainer.waitFor({ state: 'visible', timeout: 15_000 });
    const editor = chatInputContainer.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.waitForTimeout(500);
    await editor.fill(TEST_MSG);
    await page.waitForTimeout(500);

    console.log(`[4] Enter para enviar`);
    await editor.press('Enter');
    await page.waitForTimeout(3000);

    console.log(`[5] verificar user message renderizado`);
    const userMessages = page.locator('[data-testid="chat-message"][data-role="user"]');
    const userCount = await userMessages.count();
    const userMsgText = userCount > 0
      ? await userMessages.last().textContent().then((t) => (t || '').slice(0, 100))
      : '';
    const userOk = userMsgText.includes('E2E-');
    console.log(`    user messages: ${userCount}, last="${userMsgText}" → ${userOk ? '✓' : '✗'}`);

    console.log(`[6] esperar respuesta o loading del assistant (max 60s)`);
    const tWait = Date.now();
    let assistantOk = false;
    while (Date.now() - tWait < 60_000) {
      const assistantCount = await page.locator('[data-testid="chat-message"][data-role="assistant"]').count();
      const loadingCount = await page.locator('[data-testid="chat-message"][data-loading="true"]').count();
      if (assistantCount > 0 || loadingCount > 0) {
        assistantOk = true;
        console.log(`    assistant: count=${assistantCount} loading=${loadingCount} en ${((Date.now() - tWait) / 1000).toFixed(1)}s ✓`);
        break;
      }
      await page.waitForTimeout(1500);
    }
    if (!assistantOk) {
      console.log(`    ✗ no assistant message ni loading indicator en 60s`);
      writeFileSync(`/tmp/smoke-chat-${USER_TAG}-no-assistant.png`, await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));
    }

    console.log(`\n=== RESUMEN ${USER_TAG} ===`);
    console.log(`  create session: ✓`);
    console.log(`  user message rendered: ${userOk ? '✓' : '✗'}`);
    console.log(`  assistant responding: ${assistantOk ? '✓' : '✗'}`);
    process.exitCode = userOk && assistantOk ? 0 : 1;
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    process.exitCode = 1;
  } finally {
    if (newSessionId) {
      console.log(`[cleanup] delete session ${newSessionId}`);
      await deleteSession(page, newSessionId).catch((e) => console.log(`    cleanup err: ${e.message}`));
    }
    await browser.close();
  }
}

main();
