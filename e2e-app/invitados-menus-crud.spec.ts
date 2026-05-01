import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady } from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const BASE_URL = TEST_URLS.app;
const TEST_EMAIL = TEST_CREDENTIALS.email;
const TEST_PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

function uniqueSuffix(): string {
  return `${Date.now()}`;
}

test.describe('Invitados + Menús — CRUD básico', () => {
  test.setTimeout(240_000);

  test('crear menú → usarlo en invitado → editar invitado → borrar invitado → borrar menú', async ({ context, page }) => {
    if (!hasCredentials) {
      test.skip();
      return;
    }
    if (BASE_URL.includes('app.bodasdehoy.com') && !BASE_URL.includes('-dev.') && !BASE_URL.includes('-test.')) {
      test.skip();
      return;
    }

    await clearSession(context, page);

    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    expect(eventId).not.toBeNull();

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForAppReady(page, 25_000);

    const suffix = uniqueSuffix();
    const menuName = `menu-e2e-${suffix}`;
    const groupName = `grupo-e2e-${suffix}`;
    const guestName = `E2E Invitado ${suffix}`;
    const editedGuestName = `${guestName} edit`;
    const guestEmail = `e2e-invitado-${suffix}@bodasdehoy-test.com`;
    const guestPhone = `+34${`6${suffix.slice(-8).padStart(8, '0')}`}`;

    const openMenuModal = async () => {
      const btn = page.locator('button').filter({ hasText: /^(menú|menu)$/i }).first();
      await btn.click({ timeout: 15_000 });
      await expect(page.locator('#close')).toBeVisible({ timeout: 15_000 });
    };

    const closeLeftModal = async () => {
      const close = page.locator('#close');
      if (await close.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await close.click({ force: true });
      }
      await page.waitForTimeout(800);
    };

    await openMenuModal();
    const leftModal = page.locator('#close').locator('..');
    await leftModal.getByRole('textbox').first().fill(menuName);
    await expect(leftModal.getByRole('textbox').first()).toHaveValue(menuName);
    await leftModal.getByRole('button', { name: /crear menú/i }).click();
    await page.waitForTimeout(1500);
    await closeLeftModal();

    const openGroupModal = async () => {
      const btn = page.locator('button').filter({ hasText: /^grupo$/i }).first();
      await btn.click({ timeout: 15_000 });
      await expect(page.locator('#close')).toBeVisible({ timeout: 15_000 });
    };

    await openGroupModal();
    const leftModalGroup = page.locator('#close').locator('..');
    await leftModalGroup.getByRole('textbox').first().fill(groupName);
    await expect(leftModalGroup.getByRole('textbox').first()).toHaveValue(groupName);
    await leftModalGroup.getByRole('button', { name: /crear grupo/i }).click();
    await page.waitForTimeout(1500);
    await closeLeftModal();

    const openCreateGuestModal = async () => {
      const btn = page.locator('button').filter({ hasText: /^(invitados|guests)$/i }).first();
      await btn.click({ timeout: 15_000 });
      await expect(page.locator('#close')).toBeVisible({ timeout: 15_000 });
    };

    await openCreateGuestModal();
    const leftModalGuest = page.locator('#close').locator('..');
    await leftModalGuest.locator('input[name="telefono"]').fill(guestPhone);
    await leftModalGuest.locator('input[name="nombre"]').fill(guestName);
    await leftModalGuest.locator('input[name="correo"]').fill(guestEmail);

    const roleSelect = leftModalGuest.locator('select[name="rol"]').first();
    await expect(roleSelect.locator(`option[value="${groupName.toLowerCase()}"]`)).toHaveCount(1, { timeout: 15_000 });
    await roleSelect.selectOption({ value: groupName.toLowerCase() });

    const menuSelect = leftModalGuest.locator('select[name="nombre_menu"]').first();
    await expect(
      menuSelect.locator(`option[value="${menuName.toLowerCase()}"]`)
    ).toHaveCount(1, { timeout: 15_000 });
    await menuSelect.selectOption({ value: menuName.toLowerCase() });

    await leftModalGuest.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    const guestRow = page.locator('tr').filter({ hasText: guestName }).first();
    await expect(guestRow).toBeVisible({ timeout: 30_000 });

    const openRowActions = async (rowText: string) => {
      const row = page.locator('tr').filter({ hasText: rowText }).first();
      await expect(row).toBeVisible({ timeout: 20_000 });
      const dots = row.locator('span.cursor-pointer').filter({ has: page.locator('svg') }).first();
      await dots.click({ timeout: 10_000 });
      await page.waitForTimeout(600);
    };

    await openRowActions(guestName);
    await page.locator('li').filter({ hasText: /editar/i }).first().click();
    await expect(page.locator('button[type="submit"]').filter({ hasText: /guardar|save/i })).toBeVisible({ timeout: 15_000 });
    await page.locator('input[name="nombre"]').last().fill(editedGuestName);
    await page.locator('button[type="submit"]').filter({ hasText: /guardar|save/i }).first().click();
    await page.waitForTimeout(2500);

    await expect(page.locator('tr').filter({ hasText: editedGuestName }).first()).toBeVisible({ timeout: 30_000 });

    await openRowActions(editedGuestName);
    await page.locator('li').filter({ hasText: /borrar/i }).first().click();
    await page.locator('button').filter({ hasText: /elimin/i }).first().click();
    await expect(page.locator('tr').filter({ hasText: editedGuestName }).first()).toHaveCount(0, { timeout: 30_000 });

    await openMenuModal();
    const menuRow = page.locator('span', { hasText: menuName }).locator('..').locator('..');
    await menuRow.locator('div.cursor-pointer').first().click();
    await page.waitForTimeout(1200);
    await expect(page.locator('span', { hasText: menuName })).toHaveCount(0);
    await closeLeftModal();
  });
});
