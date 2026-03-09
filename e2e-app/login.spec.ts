import { test, expect } from '@playwright/test';

test.describe('Login (/login)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
  });

  test('muestra la página de login con marca o formulario', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 20_000 });
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasLoginContent =
      /Bodas de Hoy|Iniciar sesión|Registrarse|login|La plataforma/i.test(text);
    expect(hasLoginContent).toBe(true);
  });

  test('no muestra pantalla en blanco', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    expect((await body.textContent())?.length ?? 0).toBeGreaterThan(100);
  });
});
