import { test, expect } from '@playwright/test';

test.describe('Presupuesto (/presupuesto)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/presupuesto', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
  });

  test('la ruta carga sin pantalla en blanco ni ErrorBoundary', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 20_000 });
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra contenido esperado: Presupuesto, permiso o login', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    const text = (await body.textContent()) ?? '';
    const hasExpectedContent =
      /Presupuesto/i.test(text) ||
      /No tienes permiso|permiso para este módulo/i.test(text) ||
      /Iniciar sesión|login|Mis eventos|My Events/i.test(text);
    expect(hasExpectedContent).toBe(true);
  });
});
