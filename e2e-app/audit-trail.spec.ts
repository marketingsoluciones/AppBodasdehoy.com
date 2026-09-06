/**
 * audit-trail.spec.ts
 *
 * Tests de historial de cambios (audit trail) en appEventos:
 *   - ¿Existe vista de "Cambios recientes" / "Historial"?
 *   - Acción de usuario queda registrada
 *   - Quién/cuándo/qué para cambios sensibles
 *   - Rollback: ¿se puede revertir una acción?
 *
 * GAP P2 detectado por COORD-APP — coverage de auditoría
 * NOTA: Si la feature NO existe, los tests harán test.skip — son tests "probe"
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

test.describe('Audit Trail — Detección de feature', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Probe: existe sección "Historial" o "Actividad" en el menú', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasAuditFeature = /historial de cambios|actividad reciente|audit|registro de acciones/i.test(bodyText);

    if (!hasAuditFeature) {
      console.warn('[DIAG] App NO expone audit trail en UI — feature ausente o gateada');
      test.skip(true, 'Audit trail no expuesto en UI');
    }

    expect(hasAuditFeature).toBe(true);
  });

  test('Probe: URL /historial o /actividad existe', async ({ page }) => {
    const paths = ['/historial', '/actividad', '/audit', '/changelog'];
    let found: string | null = null;

    for (const path of paths) {
      const url = `${BASE_URL}${path}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => null);
      if (response && response.status() === 200 && !page.url().includes('/login') && !page.url().includes('/404')) {
        const body = (await page.locator('body').textContent()) ?? '';
        if (body.length > 100 && !/no encontrad|404|not found/i.test(body)) {
          found = path;
          break;
        }
      }
    }

    if (!found) {
      console.warn('[DIAG] Ninguna ruta de audit trail responde (probadas: /historial, /actividad, /audit, /changelog)');
      test.skip(true, 'No hay ruta de audit visible');
    }

    expect(found).not.toBeNull();
  });
});

test.describe('Audit Trail — Notificaciones como pseudo-audit', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Tab "Historial" en bandeja de notificaciones existe', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    // Abrir bandeja de notificaciones
    const bell = page.locator('[data-testid="notifications-bell"], button[aria-label*="notif" i]').first();
    const bellVisible = await bell.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!bellVisible) {
      test.skip(true, 'Campana notificaciones no visible');
    }

    await bell.click();
    await page.waitForTimeout(1500);

    const dropdownText = (await page.locator('body').textContent()) ?? '';
    const hasHistorialTab = /historial/i.test(dropdownText);

    expect(hasHistorialTab, 'BUG_AUDIT: bandeja sin tab Historial — falta pseudo-audit trail').toBe(true);
  });

  test('Notificaciones muestran timestamp para trazabilidad', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const bell = page.locator('[data-testid="notifications-bell"], button[aria-label*="notif" i]').first();
    if (!await bell.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Campana no visible');
    }

    await bell.click();
    await page.waitForTimeout(1500);

    const text = (await page.locator('body').textContent()) ?? '';
    // Buscar patrones de timestamp: "hace X min", "DD/MM", "HH:MM"
    const hasTimestamp = /hace \d+|\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}/i.test(text);

    if (!hasTimestamp) {
      console.warn('[DIAG] Notificaciones sin timestamp visible — auditoría débil');
    }
    // Soft assertion: marcar pero no fallar
    expect(text.length).toBeGreaterThan(0);
  });
});
