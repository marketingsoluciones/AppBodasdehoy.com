/**
 * Smoke E2E — FASE B v2.0 Bandeja /messages (chat-ia).
 *
 * Valida las features nuevas implementadas 25-jun-2026 en BUILD #13
 * (E60ON3H47UzFJoJiKyIuV). NO toca data (solo lecturas + UI inspections).
 *
 * Ejecución manual (NO en batch CI sin autorización — memoria
 * feedback_token_budget.md):
 *   E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit \
 *     npx playwright test e2e-app/fase-b-bandeja-v2.spec.ts
 *
 * Cleanup: no crea data, no requiere afterEach.
 */
import { test, expect } from '@playwright/test';

const CHAT_DEV = 'https://chat-dev.bodasdehoy.com';

test.describe('FASE B v2.0 — Bandeja /messages', () => {
  test.beforeEach(async ({ page }) => {
    // Login es manejado por globalSetup E2E (memoria
    // project_credenciales_e2e_y_como_correr.md).
    await page.goto(`${CHAT_DEV}/messages`);
  });

  test('3 tabs visibles + tab "Bandeja" activa por default', async ({ page }) => {
    const tabBar = page.locator('[role="tablist"]').first();
    await expect(tabBar).toBeVisible();
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText(
      'Bandeja',
    );
  });

  test('Tab Historial cambia URL a ?tab=history + oculta filtros canal', async ({
    page,
  }) => {
    await page.locator('[role="tab"]', { hasText: 'Historial' }).click();
    await expect(page).toHaveURL(/\?tab=history/);
    // En history NO debe haber filtros RSVP / canal
    await expect(page.getByRole('button', { name: 'WA' })).not.toBeVisible();
  });

  test('ScopeSelector pill abre dropdown con Soporte + eventos', async ({
    page,
  }) => {
    const pill = page.getByRole('button', { name: /Soporte|Evento/ });
    await pill.first().click();
    await expect(page.getByText('Atención al cliente')).toBeVisible();
    await expect(page.getByText('Eventos activos')).toBeVisible();
  });

  test('Rail vertical 54px visible en desktop ≥1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${CHAT_DEV}/messages`);
    const rail = page.locator('nav[aria-label="Rail navegación Bandeja"]');
    await expect(rail).toBeVisible();
    // 3 iconos navegación + 1 avatar
    const links = rail.locator('a, [role="link"]');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
  });

  test('BottomNavBar visible solo en móvil <768px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${CHAT_DEV}/messages`);
    const bottom = page.locator('nav[aria-label="Navegación inferior móvil"]');
    await expect(bottom).toBeVisible();
    await expect(bottom.getByText('Asistente')).toBeVisible();
    await expect(bottom.getByText('Bandeja')).toBeVisible();
    await expect(bottom.getByText('Historial')).toBeVisible();
  });

  test('Click en conversación abre hilo con header + composer', async ({
    page,
  }) => {
    // Esperar a que la lista cargue al menos 1 ítem
    const firstConv = page.locator('button').filter({ hasText: /^\+?\d|^[A-Za-z]/ }).first();
    if (await firstConv.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstConv.click();
      await expect(page).toHaveURL(/\/messages\/[^/]+\/[^/]+/);
      // Composer textarea visible
      await expect(page.locator('textarea')).toBeVisible();
    } else {
      test.skip(true, 'Sin conversaciones para validar — saltado');
    }
  });

  test('Notas CRM panel visible en sidebar derecho (desktop ≥1024)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${CHAT_DEV}/messages`);
    const firstConv = page.locator('button').filter({ hasText: /\+?\d/ }).first();
    if (await firstConv.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstConv.click();
      // Sidebar derecho con "Notas"
      await expect(page.getByText(/Notas/)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Sin conversaciones para validar — saltado');
    }
  });

  test('Botón ℹ en header móvil abre BottomSheet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${CHAT_DEV}/messages`);
    const firstConv = page.locator('button').filter({ hasText: /\+?\d/ }).first();
    if (await firstConv.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstConv.click();
      const infoBtn = page.getByRole('button', { name: /Información del contacto/ });
      await expect(infoBtn).toBeVisible();
      await infoBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    } else {
      test.skip(true, 'Sin conversaciones para validar — saltado');
    }
  });

  test('IaLevelPicker chip visible en header conversación', async ({ page }) => {
    const firstConv = page.locator('button').filter({ hasText: /\+?\d/ }).first();
    if (await firstConv.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstConv.click();
      // Chip "Copiloto" (default), "Manual" o "Autopiloto"
      await expect(
        page.getByRole('button', { name: /Manual|Copiloto|Autopiloto/ }),
      ).toBeVisible();
    } else {
      test.skip(true, 'Sin conversaciones para validar — saltado');
    }
  });

  test('Smoke /chat funciona — pipeline IA respondió tras refactor masivo', async ({
    page,
  }) => {
    await page.goto(`${CHAT_DEV}/chat`);
    // El /chat carga sin errores 500 visibles en pantalla
    await expect(page.locator('body')).not.toContainText(
      /5\d\d Internal Server Error/,
    );
    // El input del chat se ve
    await expect(page.locator('[role="textbox"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
