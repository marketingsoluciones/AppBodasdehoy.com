import { test, expect } from '@playwright/test';

test.describe('Home (/)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
  });

  test('muestra el trigger de perfil o contenido principal', async ({ page }) => {
    const profileTrigger = page.getByTestId('profile-menu-trigger');
    const hasProfile = await profileTrigger.isVisible().catch(() => false);
    if (hasProfile) {
      await expect(profileTrigger).toBeVisible();
      return;
    }
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    const text = await body.textContent();
    const hasContent =
      /crear|evento|organiz|Mis eventos|Resumen|Invitados|Presupuesto|Iniciar sesión/i.test(text ?? '') ||
      (text?.length ?? 0) > 200;
    expect(hasContent).toBe(true);
  });

  test('no muestra pantalla de error del ErrorBoundary', async ({ page }) => {
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});
