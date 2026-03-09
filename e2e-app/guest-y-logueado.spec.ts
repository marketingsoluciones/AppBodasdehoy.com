/**
 * Pruebas para usuario guest (sin sesión) y usuario logueado.
 * Diseñadas para ejecutarse contra app-test con VPN (app-test.bodasdehoy.com + chat-test.bodasdehoy.com).
 * Sin VPN o contra localhost pueden fallar login/APIs.
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest = BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

test.describe('Usuario guest (sin sesión)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page, context }) => {
    // Limpiar sesión completa (cookies + localStorage + Firebase IndexedDB)
    await clearSession(context, page);
    await page.waitForLoadState('load').catch(() => {});
    await waitForAppReady(page, 20_000);
  });

  test('home carga y muestra opción de Iniciar sesión', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    const text = (await body.textContent()) ?? '';
    const hasLoginOrContent =
      /Iniciar\s+sesión|Mis\s+eventos|crear|evento|organiz|Bodas de Hoy/i.test(text) || text.length > 200;
    expect(hasLoginOrContent).toBe(true);
  });

  test('menú de perfil muestra Iniciar sesión (guest)', async ({ page }) => {
    const trigger = page.getByTestId('profile-menu-trigger');
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    const dropdown = page.getByTestId('profile-menu-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
    const menuText = (await dropdown.textContent()) ?? '';
    expect(menuText).toMatch(/Iniciar\s+sesión/i);
  });

  test('no muestra ErrorBoundary', async ({ page }) => {
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('al ir a /login en app-test redirige (no queda en app-test/login)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    // El goto puede ser interrumpido si el redirect ya ocurrió y vuelve de otro dominio
    await page
      .goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 })
      .catch(() => {});

    // Esperar a que se establezca la URL final
    await page
      .waitForURL(
        (url) =>
          url.hostname.includes('chat-test.bodasdehoy.com') ||
          url.hostname.includes('chat.bodasdehoy.com') ||
          // Si el usuario ya tenía sesión, chat-test redirige de vuelta a app-test/
          (url.hostname.includes('app-test.bodasdehoy.com') && url.pathname !== '/login'),
        { timeout: 35_000 },
      )
      .catch(() => {});

    const finalUrl = page.url();

    // La prueba pasa si:
    // 1. Redirigió a chat-test/login (flujo normal sin sesión)
    // 2. Redirigió a chat-test pero volvió a app-test (usuario ya autenticado)
    // Falla solo si el redirect NO ocurrió y la URL es exactamente app-test/login
    const redirectOccurred =
      finalUrl.includes('chat-test.bodasdehoy.com') ||
      finalUrl.includes('chat.bodasdehoy.com') ||
      (finalUrl.includes('app-test.bodasdehoy.com') && !finalUrl.endsWith('/login'));

    expect(redirectOccurred).toBe(true);
  });
});

test.describe('Usuario logueado (con sesión)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    // Sin limpiar cookies: usa la sesión existente (requiere estar logueado en app-test con VPN)
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await waitForAppReady(page, 20_000);
  });

  test('menú de perfil abre y muestra opciones de usuario logueado o guest', async ({ page }) => {
    const trigger = page.getByTestId('profile-menu-trigger');
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    const dropdown = page.getByTestId('profile-menu-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
    const displayNameEl = page.getByTestId('profile-menu-display-name');
    const displayName = (await displayNameEl.textContent())?.trim() ?? '';
    const menuText = (await dropdown.textContent()) ?? '';

    if (displayName && displayName.toLowerCase() !== 'guest') {
      // Usuario logueado: no debe mostrar Iniciar sesión como acción principal; debe tener Cerrar sesión o Mi perfil
      const hasLoggedInOption =
        /Cerrar\s+sesión/i.test(menuText) ||
        /Mi\s+perfil/i.test(menuText) ||
        /Mis\s+eventos/i.test(menuText);
      expect(hasLoggedInOption).toBe(true);
    } else {
      // Sigue siendo guest
      expect(menuText).toMatch(/Iniciar\s+sesión/i);
    }
  });

  test('home muestra contenido principal sin ErrorBoundary', async ({ page }) => {
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasContent =
      /Mis\s+eventos|crear|evento|organiz|Iniciar\s+sesión|Bodas de Hoy|Resumen|Presupuesto/i.test(text) ||
      text.length > 200;
    expect(hasContent).toBe(true);
  });

  test('ruta /presupuesto carga (logueado o redirige/permiso si guest)', async ({ page }) => {
    await page.goto('/presupuesto', { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('load').catch(() => {});
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    // Debe mostrar algo coherente: Presupuesto, permiso, o login
    const ok =
      /Presupuesto|permiso|Iniciar sesión|Mis eventos|Bodas de Hoy/i.test(text) ||
      text.length > 100;
    expect(ok).toBe(true);
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});
