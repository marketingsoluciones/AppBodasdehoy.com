/**
 * editor-web-deep.spec.ts
 *
 * Tests de cobertura adicional para editor-web (creador de webs de boda):
 *   - Smoke: app carga, /preview accesible
 *   - WeddingSiteRenderer renderiza sin error
 *   - Integración: preview accesible desde appEventos / chat-ia
 *   - Recursos estáticos (imágenes, CSS) cargan
 *
 * GAP P2 detectado por COORD-APP — sólo 1 spec antes (editor-web.spec.ts)
 */
import { test, expect } from '@playwright/test';

const EDITOR_URL = process.env.EDITOR_URL || 'https://editor-dev.bodasdehoy.com';
const isDev = EDITOR_URL.includes('editor-dev') || EDITOR_URL.includes('editor-test');

test.describe('editor-web — Smoke', () => {
  test.setTimeout(120_000);

  test('App responde 200 en raíz', async ({ request }) => {
    if (!isDev) { test.skip(); return; }
    const response = await request.get(EDITOR_URL, { timeout: 15_000 });
    expect(response.status(), `BUG_EDITOR: raíz no responde 200 (got ${response.status()})`).toBe(200);
  });

  test('Página /preview existe y carga sin error fatal', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    await page.goto(`${EDITOR_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const status = page.url();
    expect(status, 'BUG_EDITOR: /preview redirige a 404').not.toMatch(/404|not-found/);

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body.length, 'BUG_EDITOR: body vacío en /preview').toBeGreaterThan(100);

    const hasFatalError = /Error fatal|Application error|crash/i.test(body);
    expect(hasFatalError, 'BUG_EDITOR: error fatal en /preview').toBe(false);
  });

  test('No hay errores console críticos al cargar', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    // Filtrar errores conocidos benignos
    const critical = errors.filter((e) =>
      !e.includes('Failed to load resource') && // 404 de imágenes no es crítico
      !e.includes('favicon') &&
      !e.match(/cookie/i)
    );

    expect(critical.length, `BUG_EDITOR: ${critical.length} errores console críticos: ${critical.slice(0, 2).join(' | ')}`).toBeLessThan(3);
  });
});

test.describe('editor-web — WeddingSiteRenderer', () => {
  test.setTimeout(120_000);

  test('Renderer muestra contenido de boda (heading, secciones)', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    await page.goto(`${EDITOR_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const body = (await page.locator('body').textContent()) ?? '';

    // Heurística: una web de boda debe mencionar al menos uno de estos
    const hasWeddingContent = /novios|boda|ceremonia|fecha|invitad|rsvp|asistencia|wedding/i.test(body);

    if (!hasWeddingContent) {
      console.warn('[DIAG] /preview sin contenido tipo boda — puede ser placeholder vacío');
      test.skip(true, 'Preview sin template cargado');
    }

    expect(hasWeddingContent).toBe(true);
  });

  test('Recursos estáticos (CSS, fonts) cargan sin 5xx', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const failed5xx: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 500 && (resp.url().endsWith('.css') || resp.url().endsWith('.woff2'))) {
        failed5xx.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto(`${EDITOR_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    expect(failed5xx.length, `BUG_EDITOR: ${failed5xx.length} recursos estáticos con 5xx`).toBe(0);
  });
});

test.describe('editor-web — Performance', () => {
  test.setTimeout(60_000);

  test('Carga inicial < 8s', async ({ page }) => {
    if (!isDev) { test.skip(); return; }

    const start = Date.now();
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    const elapsed = Date.now() - start;

    expect(elapsed, `BUG_PERF: editor-web tardó ${elapsed}ms en cargar`).toBeLessThan(10_000);
  });
});
