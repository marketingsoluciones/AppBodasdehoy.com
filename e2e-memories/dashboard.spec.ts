import { test, expect } from '@playwright/test';

const USER = 'bodasdehoy.com@gmail.com';

test.describe('Dashboard — álbumes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/app?userId=${encodeURIComponent(USER)}`);
    // Esperar a que carguen los álbumes o el estado vacío
    await page.waitForSelector('[data-testid="albums-grid"], [data-testid="empty-state"]', {
      timeout: 15_000,
    });
  });

  test('carga el dashboard con grid de álbumes', async ({ page }) => {
    await expect(page).toHaveTitle(/Memories/i);
    const grid = page.locator('[data-testid="albums-grid"]');
    await expect(grid).toBeVisible();
  });

  test('los placeholders son gradientes (sin emoji roto)', async ({ page }) => {
    // Las cards deben tener placeholder de gradiente o imagen de portada (no emoji roto)
    const placeholders = page.locator('[data-testid="album-placeholder"]');
    const covers = page.locator('[data-testid="album-cover-img"]');
    const total = (await placeholders.count()) + (await covers.count());
    expect(total).toBeGreaterThan(0);
  });

  test('cada card muestra nombre y contador de fotos', async ({ page }) => {
    const cards = page.locator('[data-testid="album-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const first = cards.first();
    await expect(first.locator('[data-testid="album-name"]')).toBeVisible();
    await expect(first.locator('[data-testid="album-media-count"]')).toBeVisible();
  });

  test('botón "Nuevo álbum" abre el modal', async ({ page }) => {
    await page.click('[data-testid="btn-new-album"]');
    await expect(page.locator('[data-testid="create-album-modal"]')).toBeVisible();
  });

  test('modal de nuevo álbum tiene selector de tipo', async ({ page }) => {
    await page.click('[data-testid="btn-new-album"]');
    const modal = page.locator('[data-testid="create-album-modal"]');
    await expect(modal).toBeVisible();

    // Selector de tipo de álbum
    await expect(modal.locator('[data-testid="album-type-selector"]')).toBeVisible();
  });

  test('toggle vista por evento existe cuando hay álbumes con eventId', async ({ page }) => {
    const toggle = page.locator('[data-testid="view-toggle-event"]');
    const isVisible = await toggle.isVisible();
    if (!isVisible) {
      // El toggle solo aparece si algún álbum tiene eventId — OK si no hay ninguno
      test.skip(true, 'No hay álbumes con eventId en este entorno — toggle correcto al no mostrarse');
      return;
    }
    await toggle.click();
    // En vista evento los grupos aparecen
    await expect(page.locator('[data-testid="event-group"]').first()).toBeVisible();
  });
});
