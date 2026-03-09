import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isLocal =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(baseURL) ||
  baseURL.includes('127.0.0.1') ||
  baseURL.includes('localhost');

/**
 * Smoke: comprueba que la app carga (localhost/127.0.0.1 responde y la página tiene contenido).
 * Si este test falla, el servidor no está listo o la página no pinta.
 */
test.describe('Smoke — la app carga', () => {
  test.setTimeout(90_000);

  test('la raíz / responde y muestra contenido', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('load').catch(() => {});
    await waitForAppReady(page);

    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });

    const hasContent =
      (await page.locator('main, [role="main"], #__next, .font-display').first().isVisible().catch(() => false)) ||
      (await body.textContent()).length > 100;
    expect(hasContent).toBe(true);
  });

  test('el API de health responde ok', async ({ request }) => {
    // En app-test/remoto puede no existir /api/health o devolver otro código; solo exigimos health en local.
    if (!isLocal) {
      test.skip();
      return;
    }
    const res = await request.get('/api/health', { timeout: 15_000 });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data?.ok).toBe(true);
  });
});
