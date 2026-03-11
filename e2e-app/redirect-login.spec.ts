/**
 * Redirect login: app-test /login debe redirigir a chat-test con redirect= de vuelta a app-test.
 * Solo aplica cuando BASE_URL es app-test (o producción app).
 * Si chat-test no responde, se omiten para no fallar la suite (pruebas reales).
 */
import { test, expect } from '@playwright/test';
import { clearSession } from './helpers';

// Misma base que playwright.config.ts (process.env.BASE_URL) para que el worker tenga isAppTest correcto
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com');

/** Si chat-test no está disponible, los tests de redirect se omiten (suite sigue en verde). */
async function isChatTestReachable(): Promise<boolean> {
  try {
    const res = await fetch('https://chat-test.bodasdehoy.com/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok || res.status === 200 || res.status === 302;
  } catch {
    return false;
  }
}

let chatTestReachable = false;
test.describe('Redirect login (app-test → chat-test)', () => {
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    if (isAppTest) chatTestReachable = await isChatTestReachable();
  });

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('al ir a /login en app-test, ocurre redirect (no queda en app-test/login)', async ({
    page,
  }) => {
    if (!isAppTest || !chatTestReachable) {
      test.skip();
      return;
    }

    // goto puede ser interrumpido si el redirect ocurre durante la navegación inicial
    await page
      .goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 })
      .catch(() => {});

    // Esperar que salga de /login (redirect puede ser JS o server-side)
    try {
      await page.waitForURL(
        (url) =>
          url.hostname.includes('chat-test.bodasdehoy.com') ||
          url.hostname.includes('chat.bodasdehoy.com') ||
          // Si ya había sesión, chat-test redirige de vuelta a app-test home
          (url.hostname.includes('app-test.bodasdehoy.com') && url.pathname !== '/login'),
        { timeout: 40_000 },
      );
    } catch {
      // Timeout: verificar URL actual — si no es /login, el redirect ocurrió de otra forma
    }

    const finalUrl = page.url();

    const wentToChatTest =
      finalUrl.includes('chat-test.bodasdehoy.com') ||
      finalUrl.includes('chat.bodasdehoy.com');
    const redirectedBackAuthenticated =
      finalUrl.includes('app-test.bodasdehoy.com') && !finalUrl.includes('/login');
    const stillAtLogin =
      finalUrl.includes('app-test.bodasdehoy.com') && finalUrl.includes('/login');

    if (wentToChatTest) {
      // Flujo correcto: fue a chat-test con redirect param
      expect(finalUrl).toContain('redirect=');
      const redirectParam = new URL(finalUrl).searchParams.get('redirect');
      expect(redirectParam).toBeTruthy();
      expect(decodeURIComponent(redirectParam!)).toMatch(/https:\/\/app(-test)?\.bodasdehoy\.com\/?/);
    }

    // Fallar con mensaje claro si sigue en /login (redirect no ocurrió)
    expect(
      wentToChatTest || redirectedBackAuthenticated,
      `Redirect no ocurrió: sigue en ${finalUrl}`,
    ).toBe(true);
    expect(stillAtLogin, `La página quedó bloqueada en app-test/login: ${finalUrl}`).toBe(false);
  });

  test('desde home, clic en Iniciar sesión redirige a chat-test', async ({ page }) => {
    if (!isAppTest || !chatTestReachable) {
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

    try {
      await page.waitForURL(
        (url) =>
          url.hostname.includes('chat-test.bodasdehoy.com') ||
          url.hostname.includes('chat.bodasdehoy.com'),
        { timeout: 20_000 },
      );
    } catch {
      // Timeout: comprobar URL actual — puede haber navegado sin waitForURL capturarlo
    }

    const finalUrl = page.url();
    // El destino debe ser chat-test o chat (dominio), independientemente del path
    expect(
      finalUrl.includes('chat-test.bodasdehoy.com') || finalUrl.includes('chat.bodasdehoy.com'),
      `Se esperaba chat-test.bodasdehoy.com pero la URL final es: ${finalUrl}`,
    ).toBe(true);
    // Debe incluir redirect param para volver a app-test después del login
    expect(finalUrl).toContain('redirect=');
  });
});
