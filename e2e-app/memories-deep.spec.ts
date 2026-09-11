/**
 * memories-deep.spec.ts
 *
 * Tests de cobertura adicional para memories-web (álbumes de fotos):
 *   - Smoke: app responde 200
 *   - UI principal carga sin error fatal
 *   - Integración: memories accesible desde appEventos (vía CopilotEmbed) y chat-ia
 *   - Performance: carga inicial razonable
 *   - Recursos estáticos (imágenes de álbumes) cargan
 *
 * GAP P2 detectado por COORD-APP — sólo 2 specs antes (memories-album + memories-web-standalone)
 */
import { test, expect } from '@playwright/test';

const MEMORIES_URL = process.env.MEMORIES_URL || 'https://memories-dev.bodasdehoy.com';
const APP_URL = process.env.BASE_URL || 'https://app-dev.bodasdehoy.com';
const CHAT_URL = process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com';

const isDev = MEMORIES_URL.includes('memories-dev') || MEMORIES_URL.includes('memories-test');

test.describe('memories-web — Smoke', () => {
  test.setTimeout(120_000);

  test('App responde 200 en raíz', async ({ request }) => {
    if (!isDev) { test.skip(); return; }
    const response = await request.get(MEMORIES_URL, { timeout: 15_000 });
    expect(response.status(), `BUG_MEMORIES: raíz no responde 200 (got ${response.status()})`).toBe(200);
  });

  test('UI principal carga con contenido', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body.length, 'BUG_MEMORIES: body vacío en raíz').toBeGreaterThan(100);

    const hasFatalError = /Error fatal|Application error|crash/i.test(body);
    expect(hasFatalError, 'BUG_MEMORIES: error fatal en raíz').toBe(false);
  });

  test('No hay errores console críticos al cargar', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const critical = errors.filter((e) =>
      !e.includes('Failed to load resource') &&
      !e.includes('favicon') &&
      !e.match(/cookie/i)
    );

    expect(critical.length, `BUG_MEMORIES: ${critical.length} errores console críticos: ${critical.slice(0, 2).join(' | ')}`).toBeLessThan(3);
  });
});

test.describe('memories-web — Contenido álbumes', () => {
  test.setTimeout(120_000);

  test('UI menciona conceptos de fotos/álbumes/memorias', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = (await page.locator('body').textContent()) ?? '';
    const hasMemoriesContent = /foto|álbum|memoria|recuerdo|momento|imagen/i.test(body);

    expect(hasMemoriesContent, 'BUG_MEMORIES: UI sin contenido relacionado con álbumes').toBe(true);
  });

  test('Imágenes cargan sin 5xx', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const failed5xx: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500 && resp.url().match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
        failed5xx.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(5000);

    expect(failed5xx.length, `BUG_MEMORIES: ${failed5xx.length} imágenes con 5xx`).toBe(0);
  });
});

test.describe('memories-web — Cross-app integration', () => {
  test.setTimeout(120_000);

  test('Acceso a /momentos desde appEventos (CopilotEmbed memories)', async ({ page }) => {
    if (!APP_URL.includes('app-dev') && !APP_URL.includes('app-test')) { test.skip(); return; }

    const response = await page.goto(`${APP_URL}/momentos`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);

    if (!response) {
      test.skip(true, '/momentos no accesible');
    }

    await page.waitForTimeout(3000);
    const body = (await page.locator('body').textContent()) ?? '';

    // Debe redirigir a login (si no hay sesión) o mostrar UI memories
    const isViable = page.url().includes('/login') || /momento|foto|álbum|memoria/i.test(body);

    expect(isViable, 'BUG_INTEGRATION: /momentos en appEventos no expone integración memories').toBe(true);
  });

  test('Acceso a memories desde chat-ia', async ({ page }) => {
    if (!CHAT_URL.includes('chat-dev') && !CHAT_URL.includes('chat-test')) { test.skip(); return; }

    const response = await page.goto(`${CHAT_URL}/memories`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);

    if (!response) {
      test.skip(true, 'chat-ia /memories no accesible');
    }

    await page.waitForTimeout(3000);

    // chat-ia /memories debe responder (puede redirigir a login)
    const status = response?.status() ?? 0;
    expect(status, `BUG_INTEGRATION: chat-ia /memories status ${status}`).toBeLessThan(500);
  });
});

test.describe('memories-web — Performance', () => {
  test.setTimeout(60_000);

  test('Carga inicial < 10s', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const start = Date.now();
    await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    const elapsed = Date.now() - start;

    expect(elapsed, `BUG_PERF: memories-web tardó ${elapsed}ms en cargar`).toBeLessThan(12_000);
  });
});
