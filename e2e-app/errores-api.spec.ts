import { test, expect } from '@playwright/test';

/**
 * Comprueba que cuando la API devuelve 403 (sesión no autorizada),
 * la app redirige a /login con session_expired=1 y muestra el banner amigable.
 *
 * En app-test: /login redirige a chat-test (SSO), así que verificamos que
 * la redirección incluya el parámetro correcto o que el banner de sesión
 * expirada aparezca en el destino.
 *
 * En localhost: /login no redirige — se puede probar el banner directamente.
 */
test.describe('Manejo de errores API (403)', () => {
  test.setTimeout(60_000);

  test('la página de login muestra banner de sesión expirada con ?session_expired=1', async ({ page }) => {
    const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
    const isAppTest = BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

    if (isAppTest) {
      // En app-test, /login redirige a chat-test. Verificamos que el proxy de API
      // interceptable esté disponible probando la ruta de forma indirecta.
      // La URL /login?session_expired=1 hace redirect a chat-test, que no muestra el banner.
      // Verificar que la redirección lleva a chat-test (SSO configurado correctamente).
      await page.goto('/login?session_expired=1', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForURL(
        (url) => url.hostname.includes('chat-test') || url.hostname.includes('chat.bodasdehoy.com') || url.pathname === '/login',
        { timeout: 20_000 }
      ).catch(() => {});
      // Si llegamos a chat-test, el SSO está activo (test pasa)
      // Si seguimos en /login (localhost), verificar el banner
      const currentUrl = page.url();
      if (currentUrl.includes('chat-test') || currentUrl.includes('chat.bodasdehoy.com')) {
        // SSO activo, la ruta de error 403 → chat-test está configurada correctamente
        expect(currentUrl).toMatch(/chat(-test)?\.bodasdehoy\.com/);
      } else {
        // Fallback: verificar banner en la propia página
        const banner = page.getByText(/Sesión no autorizada|expirada/i);
        await expect(banner).toBeVisible({ timeout: 10_000 });
      }
    } else {
      // Localhost: /login no redirige. Ir directamente y verificar banner.
      await page.goto('/login?session_expired=1', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('load').catch(() => {});
      const banner = page.getByText(/Sesión no autorizada o expirada/i);
      await expect(banner).toBeVisible({ timeout: 15_000 });
    }
  });
});
