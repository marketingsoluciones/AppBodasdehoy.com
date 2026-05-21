// SPRINT-G 2026-05-21: sessions CRUD spec en Playwright Test puro.
// Reemplaza sessions.feature (Cucumber). Pattern reusable.
//
// Pre-requisitos:
// 1. chat-ia-prod corriendo en :3210
// 2. .auth/super-admin.json existe (npx tsx save-storage-states.ts)
//
// Run: npx playwright test tests/sessions.spec.ts --project=webkit-super-admin

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

test.describe.serial('@sessions Session management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  });

  test('@sessions-create create new session', async ({ page }) => {
    // Reload + wait estabilizar (otros tests pueden estar sincronizando con backend)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const idsBefore = new Set(await getSessionIds(page));

    await page
      .locator('[data-testid="new-session-button"], [data-testid="new-session-dropdown"]')
      .first()
      .click();

    // Poll para detectar al menos UN id nuevo (no asume count exacto)
    let newId: string | undefined;
    await expect
      .poll(
        async () => {
          const idsNow = await getSessionIds(page);
          newId = idsNow.find((id) => !idsBefore.has(id));
          return newId;
        },
        { timeout: 15_000, message: 'esperando nuevo session id en sidebar' },
      )
      .toBeTruthy();

    expect(newId).toBeDefined();
    // Cleanup obligatorio (memory: feedback_e2e_super_admin_cleanup.md)
    if (newId) await deleteSessionByApi(page, newId);
  });

  test('@sessions-persistence sessions persist after reload', async ({ page }) => {
    const idsBefore = await getSessionIds(page);
    expect(idsBefore.length).toBeGreaterThan(0);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(4000); // sessions list rehidratación async desde backend

    const idsAfter = await getSessionIds(page);
    // Count match exact (no add/remove durante reload)
    expect(idsAfter.length).toBe(idsBefore.length);
    // Todos los ids previos siguen presentes (orden puede variar)
    const beforeSet = new Set(idsBefore);
    const missing = idsAfter.filter((id) => !beforeSet.has(id));
    expect(missing).toEqual([]);
  });

  test('@sessions-click first session opens chat-input', async ({ page }) => {
    const sessions = page.locator('[data-testid="session-item"]');
    await expect(sessions.first()).toBeVisible();
    await sessions.first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });
});
