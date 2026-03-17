import { test, expect } from '@playwright/test';

const USER = 'bodasdehoy.com@gmail.com';

test.describe('Detalle de álbum', () => {
  test.beforeEach(async ({ page }) => {
    // Ir al dashboard y abrir el primer álbum
    await page.goto(`/app?userId=${encodeURIComponent(USER)}`);
    await page.waitForSelector('[data-testid="album-card"]', { timeout: 15_000 });
    await page.locator('[data-testid="album-card"]').first().click();
    await page.waitForSelector('[data-testid="album-detail"]', { timeout: 15_000 });
  });

  test('muestra el nombre del álbum y botón subir fotos', async ({ page }) => {
    await expect(page.locator('[data-testid="album-detail-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-upload"]')).toBeVisible();
  });

  test('botón compartir abre ShareModal', async ({ page }) => {
    await page.click('[data-testid="btn-share"]');
    const modal = page.locator('[data-testid="share-modal"]');
    await expect(modal).toBeVisible();
    // Esperar a que el modal termine de cargar (enlace o error — no pantalla en blanco)
    await page.waitForFunction(() => {
      const link = document.querySelector('[data-testid="share-link"]');
      const err = document.querySelector('[data-testid="share-error"]');
      return link !== null || err !== null;
    }, { timeout: 12_000 });
    const hasLink = await modal.locator('[data-testid="share-link"]').isVisible();
    const hasError = await modal.locator('[data-testid="share-error"]').isVisible();
    expect(hasLink || hasError).toBe(true);
  });

  test('hover sobre foto muestra botón "Usar como portada"', async ({ page }) => {
    const photos = page.locator('[data-testid="photo-item"]');
    const count = await photos.count();
    if (count === 0) {
      test.skip(); // Sin fotos no podemos testear cover
      return;
    }
    await photos.first().hover();
    await expect(page.locator('[data-testid="btn-set-cover"]').first()).toBeVisible();
  });

  test('"Usar como portada" actualiza la portada', async ({ page }) => {
    const photos = page.locator('[data-testid="photo-item"]');
    if ((await photos.count()) === 0) {
      test.skip();
      return;
    }
    await photos.first().hover();
    await page.locator('[data-testid="btn-set-cover"]').first().click();
    // Toast de confirmación
    await expect(page.locator('text=Portada actualizada')).toBeVisible({ timeout: 5_000 });
  });
});
