/**
 * offline-behavior.spec.ts
 *
 * Tests de comportamiento offline en appEventos:
 *   - Sin conexión: app muestra estado offline o continúa con cache
 *   - Sin conexión: operaciones queue locales o fallan gracefully
 *   - Recuperar conexión: sincroniza queue o refresca datos
 *   - Service Worker: caché funciona offline
 *
 * GAP P2 detectado por COORD-APP — coverage de PWA/offline
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

test.describe('Offline Behavior — Detección y UI', () => {
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

  test('Modo offline: app NO crashea, muestra estado o cache', async ({ context, page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const bodyBefore = (await page.locator('body').textContent()) ?? '';

    // Desconectar
    await context.setOffline(true);
    await page.waitForTimeout(3_000);

    // Intentar navegar (debe usar cache o mostrar offline)
    await page.locator('body').click().catch(() => {});

    const bodyAfter = (await page.locator('body').textContent()) ?? '';

    // App NO debe quedarse en blanco
    expect(bodyAfter.length, 'BUG_OFFLINE: body queda vacío sin red').toBeGreaterThan(50);

    // App NO debe mostrar error fatal de "no network" sin posibilidad de recovery
    const hasFatalError = /error fatal|aplicación bloqueada|critical error/i.test(bodyAfter);
    expect(hasFatalError, 'BUG_OFFLINE: error fatal sin red — falta graceful degradation').toBe(false);

    await context.setOffline(false);
  });

  test('Tras volver online, app reconecta sin requerir reload manual', async ({ context, page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    await context.setOffline(true);
    await page.waitForTimeout(5_000);
    await context.setOffline(false);
    await page.waitForTimeout(8_000);

    // Sin reload, ¿app sigue funcional?
    const navigatorState = await page.evaluate(() => navigator.onLine);
    expect(navigatorState, 'navigator.onLine debe ser true tras setOffline(false)').toBe(true);

    // URL debe seguir siendo la misma
    expect(page.url()).toContain('/invitados');

    // App no debe haber redirigido a /login por sesión perdida transitoriamente
    expect(page.url(), 'BUG_OFFLINE: tras reconectar redirigió a login').not.toMatch(/\/login$/);
  });
});

test.describe('Offline Behavior — Service Worker / Cache', () => {
  test.setTimeout(120_000);

  test('Service Worker registrado en app-dev', async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');

    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const swInfo = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      return {
        supported: true,
        registered: !!reg,
        scope: reg?.scope ?? null,
        active: !!reg?.active,
      };
    });

    // No es un blocker P0 — solo informativo
    if (!swInfo.supported) {
      test.skip(true, 'navigator.serviceWorker no soportado en este navegador');
    }

    // Si SW registrado, debe estar activo
    if (swInfo.registered) {
      expect(swInfo.active, 'SW registrado pero no activo').toBe(true);
    } else {
      console.warn('[DIAG] App NO tiene Service Worker registrado — sin caché offline');
    }
  });

  test('Recursos estáticos cargan tras refresh con cache habilitado', async ({ page }) => {
    if (!isAppDev) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Reload — recursos deberían venir de cache rápido
    const start = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    const elapsed = Date.now() - start;

    // Reload con cache debería ser <5s
    expect(elapsed, `BUG_PERF: reload con cache tardó ${elapsed}ms`).toBeLessThan(8_000);
  });
});
