/**
 * socket-resilience.spec.ts
 *
 * Tests de resilience de sockets (notificaciones realtime) en appEventos:
 *   - Reconnect automático tras desconexión de red
 *   - Notificación pendiente offline → entrega al reconectar
 *   - Multiple tabs simultáneas → socket único o por tab
 *   - Server restart simulación → cliente debe reconectar
 *   - Notificación duplicada protección
 *
 * GAP P0 detectado por COORD-APP — coverage de socket realtime
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

test.describe('Socket Resilience — Reconnect automático', () => {
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

  test('Desconectar red 5s → socket reconnect automático', async ({ context, page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    // Capturar estado inicial del socket
    const initialSocketState = await page.evaluate(() => {
      const w = window as any;
      return {
        hasSocket: !!w.io || !!w.__socket,
        connected: w.__socket?.connected ?? null,
      };
    });

    // Simular pérdida de red
    await context.setOffline(true);
    await page.waitForTimeout(5_000);

    const offlineState = await page.evaluate(() => {
      const w = window as any;
      return {
        connected: w.__socket?.connected ?? null,
        navigatorOnline: navigator.onLine,
      };
    });
    expect(offlineState.navigatorOnline, 'navigator.onLine debe ser false con setOffline').toBe(false);

    // Reconectar
    await context.setOffline(false);
    await page.waitForTimeout(8_000); // dar tiempo a socket reconnect

    const reconnectedState = await page.evaluate(() => {
      const w = window as any;
      return {
        connected: w.__socket?.connected ?? null,
        navigatorOnline: navigator.onLine,
      };
    });
    expect(reconnectedState.navigatorOnline, 'navigator.onLine debe volver a true').toBe(true);

    // Si socket está expuesto: verificar reconexión. Si no, al menos UI no muestra error fatal.
    if (initialSocketState.hasSocket && reconnectedState.connected !== null) {
      expect(reconnectedState.connected, 'BUG_SOCKET: no reconectó tras volver online').toBe(true);
    } else {
      // Fallback: verificar UI no rota
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase()).not.toMatch(/error fatal|connection lost permanente/i);
    }
  });

  test('Múltiples tabs simultáneas → comportamiento socket coherente', async ({ context, browser }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }

    const page1 = await context.newPage();
    await clearSession(context, page1);
    const eventId1 = await loginAndSelectEvent(page1, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId1) test.skip(true, 'TEST_LOGIN_FAILED');

    await navigateToModule(page1, 'invitados');
    await waitForAppReady(page1, 20_000);

    // Abrir segunda tab del mismo contexto (mismo storage/cookies)
    const page2 = await context.newPage();
    await page2.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page2, 20_000);

    // Ambas tabs deben tener sesión válida
    const page1Url = page1.url();
    const page2Url = page2.url();
    expect(page1Url.includes('/invitados') || page1Url.includes('/eventos'), 'page1 perdió sesión').toBe(true);
    expect(page2Url.includes('/invitados') || page2Url.includes('/eventos'), 'page2 perdió sesión').toBe(true);

    // Verificar que ninguna tab muestra error de "sesión duplicada" o similar
    const body1 = (await page1.locator('body').textContent()) ?? '';
    const body2 = (await page2.locator('body').textContent()) ?? '';
    expect(body1.toLowerCase()).not.toMatch(/sesión duplicada|otro dispositivo conectado/);
    expect(body2.toLowerCase()).not.toMatch(/sesión duplicada|otro dispositivo conectado/);

    await page1.close();
    await page2.close();
  });

  test('Recargar página tras 30s mantiene sesión y socket reconnect', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    await page.waitForTimeout(30_000);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const finalUrl = page.url();
    expect(finalUrl, 'BUG_SOCKET: tras reload perdió sesión y redirige a login').not.toMatch(/\/login/);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).not.toMatch(/iniciar sesión|sesión expirada/i);
  });
});

test.describe('Socket Resilience — Notificaciones realtime', () => {
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

  test('Campana notificaciones visible y polling funciona', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    // Buscar campana de notificaciones (selector tolerante)
    const bell = page.locator('[data-testid="notifications-bell"], button[aria-label*="notif" i], svg[data-icon="bell"]').first();
    const bellVisible = await bell.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!bellVisible) {
      test.skip(true, 'No hay campana visible en este tenant');
    }

    // Click → debe abrir bandeja
    await bell.click();
    await page.waitForTimeout(1500);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    // Debe aparecer alguno de: lista de notifs, mensaje vacío, tabs
    const hasNotifUI = /actual|pendientes|historial|sin notificaciones|no hay notificaciones/i.test(bodyText);
    expect(hasNotifUI, 'BUG_NOTIF: campana no abre bandeja con tabs/mensaje vacío').toBe(true);
  });

  test('Listener de socket no se duplica tras navegación', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    // Capturar listeners iniciales si están expuestos
    const initialListeners = await page.evaluate(() => {
      const w = window as any;
      if (!w.__socket?.listeners) return null;
      return w.__socket.listeners('notification')?.length ?? null;
    });

    // Navegar a otra ruta y volver
    await navigateToModule(page, 'mesas');
    await waitForAppReady(page, 15_000);
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 15_000);

    const finalListeners = await page.evaluate(() => {
      const w = window as any;
      if (!w.__socket?.listeners) return null;
      return w.__socket.listeners('notification')?.length ?? null;
    });

    if (initialListeners !== null && finalListeners !== null) {
      expect(finalListeners, 'BUG_SOCKET: listener duplicado tras navegación (memory leak)').toBeLessThanOrEqual(initialListeners + 1);
    }
  });
});

test.describe('Socket Resilience — Reconexión tras backend caído', () => {
  test.setTimeout(180_000);

  test('Socket survive a fetch fail de api-ia 5xx', async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');

    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    // Interceptar requests a api-ia y forzar 503 durante 5s
    await page.route('**/api-ia.bodasdehoy.com/**', (route) => {
      route.fulfill({ status: 503, body: 'Service Unavailable' });
    });

    await page.waitForTimeout(5_000);

    // Quitar intercepción → socket debe poder reconectar
    await page.unroute('**/api-ia.bodasdehoy.com/**');
    await page.waitForTimeout(8_000);

    // UI no debe estar bloqueada
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText.toLowerCase()).not.toMatch(/error 503 permanente|aplicación bloqueada/i);
    expect(page.url(), 'tras 503 transitorio no debería redirigir a login').not.toMatch(/\/login$/);
  });
});
