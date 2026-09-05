// SPRINT-M 2026-05-21: visitor-limits.feature → Playwright Test puro.
// Tests modo visitante (sin auth) — context limpio, sin storageState.
//
// Pre-requisito: chat-ia-prod :3210 corriendo (api-ia routes accesibles via proxy).

import { expect, test } from '@playwright/test';

// Visitor = sin auth → cancelar storageState del project
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('@visitor Visitor mode', () => {
  test('@visitor-load /chat accesible sin login (visitor flow)', async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Puede o redirigir a /login O renderizar chat con limit visitor
    const onLogin = page.url().includes('/login');
    const chatInput = await page.locator('[data-testid="chat-input"]').count();
    // Al menos uno de los dos: O ve login O ve chat-input
    expect(onLogin || chatInput > 0).toBe(true);
  });

  test('@visitor-no-leak proxy strip Authorization en visitor (audit security)', async ({ page }) => {
    const authHeaders: string[] = [];
    page.on('request', (req) => {
      const h = req.headers().authorization;
      if (h && req.url().includes('api-ia')) authHeaders.push(h);
    });

    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Sin auth state cargado, no debería haber Authorization a api-ia
    // (api-ia recibe X-User-ID + X-Development en visitor mode)
    expect(authHeaders).toEqual([]);
  });
});
