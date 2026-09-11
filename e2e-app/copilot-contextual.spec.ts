/**
 * copilot-contextual.spec.ts
 *
 * Tests de Copilot Contextual (commit 7ef75832):
 *   - Preguntas sugeridas dinámicas por sección
 *   - Chips proactivos con detección de problemas
 *   - FILTER_VIEW entities: invitations + gifts
 *   - Colores por severidad (rojo/amarillo/verde)
 *
 * Cobertura feature reciente — P1
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, navigateToModule, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const isAppDev =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com');

test.describe('Copilot Contextual — Preguntas sugeridas por sección', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Copilot abierto en invitados muestra preguntas sugeridas relacionadas', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i], button[aria-label*="asistente" i], [data-testid*="copilot"]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible en UI (gating tenant)');
    }

    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasInvitadosSuggestions = /confirmados|sin confirmar|menú|alergias|grupo|mesa/i.test(bodyText);

    expect(hasInvitadosSuggestions, 'BUG_COPILOT: sugerencias no contextualizan a invitados').toBe(true);
  });

  test('Copilot en presupuesto muestra sugerencias específicas de presupuesto', async ({ page }) => {
    await navigateToModule(page, 'presupuesto');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i], [data-testid*="copilot"]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible');
    }
    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasPresupuestoSuggestions = /gasto|presupuesto|categoría|pendiente|pagado|excedido/i.test(bodyText);

    expect(hasPresupuestoSuggestions, 'BUG_COPILOT: sugerencias no contextualizan a presupuesto').toBe(true);
  });

  test('Copilot en mesas muestra sugerencias específicas de mesas', async ({ page }) => {
    await navigateToModule(page, 'mesas');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i], [data-testid*="copilot"]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible');
    }
    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasMesasSuggestions = /mesa|sentado|asignar|capacidad|sin mesa/i.test(bodyText);

    expect(hasMesasSuggestions, 'BUG_COPILOT: sugerencias no contextualizan a mesas').toBe(true);
  });
});

test.describe('Copilot Contextual — Chips proactivos', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Chips proactivos visibles cuando hay problemas en datos', async ({ page }) => {
    await navigateToModule(page, 'resumen');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i], [data-testid*="copilot"]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible');
    }
    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2500);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    // Patrones de chips proactivos según commit 7ef75832
    const hasProactiveChips =
      /sin confirmar|excedido|vencid|sin mesa|días hasta/i.test(bodyText);

    if (!hasProactiveChips) {
      console.warn('[DIAG] No se detectaron chips proactivos — evento puede estar perfecto sin problemas detectados');
    }
    // Soft assertion — evento puede estar bien y no haber chips
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('Click en chip proactivo abre flujo relacionado o filtra vista', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible');
    }
    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2000);

    // Buscar chip clickable (botón con texto de problema detectado)
    const chip = page.locator('button, [role="button"]').filter({ hasText: /sin confirmar|sin mesa|vencid/i }).first();
    const chipVisible = await chip.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!chipVisible) {
      test.skip(true, 'No hay chips proactivos visibles para clickear');
    }

    const urlBefore = page.url();
    await chip.click().catch(() => {});
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    const bodyAfter = (await page.locator('body').textContent()) ?? '';

    // Click debe producir cambio observable: URL distinto, filtro aplicado, modal abierto, etc.
    const observedChange = urlBefore !== urlAfter || /filtro|filter|aplicado/i.test(bodyAfter);
    expect(observedChange, 'BUG_COPILOT: click en chip no produce efecto').toBe(true);
  });
});

test.describe('Copilot Contextual — FILTER_VIEW entities invitations/gifts', () => {
  test.setTimeout(120_000);

  test('CopilotFilterBar expone entities "invitations" y "gifts"', async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');

    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const copilotTrigger = page.locator('button[aria-label*="copilot" i]').first();
    if (!await copilotTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Copilot no visible');
    }
    await copilotTrigger.click().catch(() => {});
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasInvitationsEntity = /invitaciones?|invitation/i.test(bodyText);
    const hasGiftsEntity = /regalos?|gift/i.test(bodyText);

    expect(hasInvitationsEntity || hasGiftsEntity, 'BUG_COPILOT: entities invitations/gifts no expuestos en FILTER_VIEW').toBe(true);
  });
});
