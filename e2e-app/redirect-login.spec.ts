/**
 * Redirect login: app-test /login debe redirigir a chat-test con redirect= de vuelta a app-test.
 * Solo aplica cuando BASE_URL es app-test (o producción app).
 */
import { test, expect } from '@playwright/test';
import { clearSession } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest = BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

test.describe('Redirect login (app-test → chat-test)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    // Limpiar sesión completa (cookies + localStorage + Firebase IndexedDB)
    await clearSession(context, page);
  });

  test('al ir a /login en app-test, ocurre redirect (no queda en app-test/login)', async ({
    page,
  }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    // goto puede ser interrumpido si el redirect ocurre durante la navegación inicial
    await page
      .goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 })
      .catch(() => {});

    // Esperar resolución de URL final
    await page
      .waitForURL(
        (url) =>
          url.hostname.includes('chat-test.bodasdehoy.com') ||
          url.hostname.includes('chat.bodasdehoy.com') ||
          // Si ya había sesión, chat-test redirige de vuelta a app-test home
          (url.hostname.includes('app-test.bodasdehoy.com') && url.pathname !== '/login'),
        { timeout: 35_000 },
      )
      .catch(() => {});

    const finalUrl = page.url();

    const wentToChatTest =
      finalUrl.includes('chat-test.bodasdehoy.com') ||
      finalUrl.includes('chat.bodasdehoy.com');
    const redirectedBackAuthenticated =
      finalUrl.includes('app-test.bodasdehoy.com') && !finalUrl.includes('/login');

    if (wentToChatTest) {
      // Flujo correcto: fue a chat-test con redirect param
      expect(finalUrl).toContain('redirect=');
      const redirectParam = new URL(finalUrl).searchParams.get('redirect');
      expect(redirectParam).toBeTruthy();
      expect(decodeURIComponent(redirectParam!)).toMatch(/https:\/\/app(-test)?\.bodasdehoy\.com\/?/);
    }

    // Válido si salió de app-test/login (redirect ocurrió)
    expect(wentToChatTest || redirectedBackAuthenticated).toBe(true);
  });

  test('desde home, clic en Iniciar sesión redirige a chat-test', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});

    // Enlace o botón "Iniciar sesión" (guest suele verlo en nav o footer)
    const loginLink = page.getByRole('link', { name: /iniciar sesión/i }).first();
    const visible = await loginLink.isVisible().catch(() => false);
    if (!visible) {
      test.skip();
      return;
    }

    await loginLink.click();

    await page.waitForURL(
      (url) => url.hostname.includes('chat-test.bodasdehoy.com') || url.hostname.includes('chat.bodasdehoy.com'),
      { timeout: 15_000 }
    ).catch(() => {});

    const finalUrl = page.url();
    expect(finalUrl).toMatch(/https:\/\/chat(-test)?\.bodasdehoy\.com\/login/);
    expect(finalUrl).toContain('redirect=');
  });
});
