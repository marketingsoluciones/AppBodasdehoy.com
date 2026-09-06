// SPRINT-N 2026-05-21: smoke tool invocation (LLM determinism handling).
// Verifica que el chat puede invocar tools y renderizar UI inline.
// Pattern: pedir algo CLARO que requiera tool (venues) → wait for tool render O
// assistant response (LLM puede o invocar tool o responder con texto).
//
// Tolerancia LLM: asserts loose — confirma "algo respondió", no asume tool invoked.

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

test.describe.serial('@tools Tool invocation smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  });

  test('@tool-message-receives-response chat puede invocar tools o responder texto', async ({ page }) => {
    // Crear session efímera
    const beforeSet = new Set(await getSessionIds(page));
    await page
      .locator('[data-testid="new-session-button"], [data-testid="new-session-dropdown"]')
      .first()
      .click();

    let newId: string | undefined;
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const ids = await getSessionIds(page);
      newId = ids.find((id) => !beforeSet.has(id));
      if (newId) break;
      await page.waitForTimeout(500);
    }
    expect(newId).toBeTruthy();

    try {
      // Enviar mensaje explicito para venues (debe invocar lobe-venue-visualizer
      // O responder con texto sobre venues — ambos aceptados)
      const editor = page.locator('[data-testid="chat-input"] [contenteditable="true"]').first();
      await editor.click();
      await editor.fill('Muéstrame 3 ideas de venues elegantes para una boda íntima');
      await editor.press('Enter');
      await page.waitForTimeout(5000);

      // Verify user message renderizado
      const userMsg = page.locator('[data-testid="chat-message"][data-role="user"]').last();
      await expect(userMsg).toBeVisible({ timeout: 15_000 });

      // Wait hasta 60s por respuesta assistant (cualquier indicador)
      await expect
        .poll(
          async () => {
            const assistantCount = await page.locator('[data-testid="chat-message"][data-role="assistant"]').count();
            const loadingCount = await page.locator('[data-testid="chat-message"][data-loading="true"]').count();
            const toolCount = await page.locator('[data-testid="chat-message"][data-role="tool"]').count();
            return assistantCount + loadingCount + toolCount;
          },
          { timeout: 60_000, message: 'assistant/tool response or loading indicator' },
        )
        .toBeGreaterThan(0);

      // No error overlay
      const errorOverlay = await page.locator('text=/Application error|Unhandled Runtime Error/i').count();
      expect(errorOverlay).toBe(0);
    } finally {
      if (newId) await deleteSessionByApi(page, newId);
    }
  });
});
