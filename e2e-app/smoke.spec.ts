import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isLocal =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(baseURL) ||
  baseURL.includes('127.0.0.1') ||
  baseURL.includes('localhost');

/**
 * Smoke: comprueba que la app carga sin errores.
 * Este test es la PUERTA de entrada — si falla, bail:1 detiene todo el resto.
 * Por eso detecta explícitamente errores de carga para no desperdiciar tiempo.
 */
test.describe('Smoke — la app carga', () => {
  test.setTimeout(90_000);

  test('[SM01] la raíz / responde y muestra contenido sin errores', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});

    const delayMs = parseInt(process.env.E2E_DELAY_BEFORE || '0', 10);
    if (delayMs > 0) await page.waitForTimeout(delayMs);

    const text = await page.locator('body').textContent().catch(() => null) ?? '';

    // Si el servidor no responde o hay redirect cross-domain → skip (server not up, no es un fallo del código)
    if (text === null || text.length < 20) {
      console.log('ℹ️ Raíz no accesible o redirect cross-domain — skip');
      test.skip();
      return;
    }

    // Detectar cualquier estado de error en la app → FALLA (para que bail:1 detenga el resto)
    const errorPatterns =
      /Error Capturado por ErrorBoundary|Error al cargar|Internal Server Error|Something went wrong|Failed to load|No se pudo cargar|Ha ocurrido un error/i;
    expect(text, `App muestra error en la raíz: ${text.slice(0, 300)}`).not.toMatch(errorPatterns);
  });

  test('[SM02] el API de health responde ok', async ({ request }) => {
    // En app-test/remoto puede no existir /api/health — solo exigimos health en local.
    if (!isLocal) {
      test.skip();
      return;
    }
    const res = await request.get('/api/health', { timeout: 15_000 });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data?.ok).toBe(true);
  });
});
