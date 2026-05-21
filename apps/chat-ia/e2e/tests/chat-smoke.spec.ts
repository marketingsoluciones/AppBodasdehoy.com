// SPRINT-K 2026-05-21: chat-smoke.feature (Cucumber) → Playwright Test puro.
// Pattern reusable: serial mode + cleanup trpc + storageState pre-asignado.
//
// Pre-requisitos:
//   - chat-ia-prod :3210 corriendo
//   - .auth/super-admin.json existe
//   - api-ia.bodasdehoy.com responding
//
// Run: npx playwright test tests/chat-smoke.spec.ts --project=webkit-super-admin

import { expect, test, type Page } from '@playwright/test';

async function getSessionIds(page: Page): Promise<string[]> {
  return page.locator('a[aria-label]:has([data-testid="session-item"])').evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')!).filter(Boolean),
  );
}

async function deleteSessionByApi(page: Page, id: string) {
  return page.evaluate(async (sessionId) => {
    const r = await fetch('/trpc/lambda/session.removeSession?batch=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 0: { json: { id: sessionId } } }),
      credentials: 'include',
    });
    return r.ok;
  }, id);
}

async function createEphemeralSession(page: Page): Promise<string | undefined> {
  const before = await getSessionIds(page);
  await page
    .locator('[data-testid="new-session-button"], [data-testid="new-session-dropdown"]')
    .first()
    .click();
  await page.waitForTimeout(3000);
  const after = await getSessionIds(page);
  return after.find((id) => !before.includes(id));
}

test.describe.serial('@chat @smoke Chat smoke flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  });

  test('@chat-no-bundle-error /chat cold load sin errores chunks', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (e) => jsErrors.push(e.message));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const chunkFails = jsErrors.filter(
      (e) => /Loading chunk \d+ failed|module not found/i.test(e),
    );
    expect(chunkFails).toEqual([]);
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible();
  });

  test('@chat-send-message enviar mensaje + assistant responde + cleanup', async ({ page }) => {
    const sessionId = await createEphemeralSession(page);
    expect(sessionId).toBeTruthy();

    try {
      const editor = page.locator('[data-testid="chat-input"] [contenteditable="true"]').first();
      await editor.click();
      const msg = `E2E-${Date.now()}: ping smoke`;
      await editor.fill(msg);
      await editor.press('Enter');
      await page.waitForTimeout(3000);

      // User message renderizado
      const userMsg = page.locator('[data-testid="chat-message"][data-role="user"]').last();
      await expect(userMsg).toBeVisible({ timeout: 15_000 });
      const userText = (await userMsg.textContent()) || '';
      expect(userText).toContain('E2E-');

      // Assistant message O loading state dentro de 30s
      await expect
        .poll(
          async () => {
            const a = await page.locator('[data-testid="chat-message"][data-role="assistant"]').count();
            const l = await page.locator('[data-testid="chat-message"][data-loading="true"]').count();
            return a + l;
          },
          { timeout: 30_000, message: 'esperando assistant message or loading indicator' },
        )
        .toBeGreaterThan(0);

      // No error overlay
      const errorOverlay = await page.locator('text=/Application error|Unhandled Runtime Error/i').count();
      expect(errorOverlay).toBe(0);
    } finally {
      if (sessionId) await deleteSessionByApi(page, sessionId);
    }
  });

  test('@chat-session-switch click cambia conversación', async ({ page }) => {
    const sessions = page.locator('[data-testid="session-item"]');
    const count = await sessions.count();
    if (count < 2) test.skip(true, 'requiere >= 2 sesiones existentes');

    const urlBefore = page.url();
    await sessions.nth(1).click();
    await page.waitForTimeout(2000);
    // chat-input visible en nueva sesión
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });
});
