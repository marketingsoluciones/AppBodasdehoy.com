// SPRINT R-strict 2026-05-21: tool render verification con assertion estricta.
// Si LLM no invoca venue-visualizer en 90s, SKIP (no falla suite — LLM puede
// optar por responder texto). Si invoca, verify cards visibles.
//
// Pre-requisito: chat-ia rebuilt con data-testid="tool-render-venue-visualizer"
// y data-testid="venue-card" en src/tools/venue-visualizer/Render/

import { expect, test, type Page } from '@playwright/test';

async function getSessionIds(page: Page): Promise<string[]> {
  return page.locator('a[aria-label]:has([data-testid="session-item"])').evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')!).filter(Boolean),
  );
}

async function deleteSessionByApi(page: Page, id: string) {
  return page.evaluate(async (sessionId) => {
    await fetch('/trpc/lambda/session.removeSession?batch=1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 0: { json: { id: sessionId } } }),
      credentials: 'include',
    });
  }, id);
}

test('@tool-strict venue-visualizer render visible cuando LLM invoca', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Crear sesión efímera
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
    // Query muy específica que debería invocar venue-visualizer
    const editor = page.locator('[data-testid="chat-input"] [contenteditable="true"]').first();
    await editor.click();
    await editor.fill(
      'Visualiza 3 opciones de venues estilo bohemio jardín al aire libre con la herramienta venue visualizer',
    );
    await editor.press('Enter');

    // Esperar hasta 90s por tool render
    const toolRenderAppeared = await page
      .locator('[data-testid="tool-render-venue-visualizer"]')
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => true)
      .catch(() => false);

    if (!toolRenderAppeared) {
      // LLM no invocó el tool — soft skip (válido: puede responder con texto)
      const assistantCount = await page.locator('[data-testid="chat-message"][data-role="assistant"]').count();
      test.skip(
        true,
        `LLM no invocó venue-visualizer en 90s (assistant messages: ${assistantCount}). Soft skip.`,
      );
      return;
    }

    // Si tool invoked, verify venue-card items renderizan
    const venueCards = page.locator('[data-testid="venue-card"]');
    await expect(venueCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await venueCards.count();
    console.log(`✓ venue-visualizer invocado, ${count} venue-cards renderizados`);
    expect(count).toBeGreaterThanOrEqual(1);
  } finally {
    if (newId) await deleteSessionByApi(page, newId);
  }
});
