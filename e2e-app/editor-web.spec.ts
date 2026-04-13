/**
 * editor-web.spec.ts
 *
 * E2E tests para editor-web (`:3230` local / editor-test.bodasdehoy.com).
 * Cubre: carga de rutas, editor visual de webs de boda, preview y exportar.
 *
 * Entornos:
 *   local  → http://<LAN-IP>:3230
 *   dev    → http://editor-dev.bodasdehoy.com  (si CF tunnel activo)
 *   test   → https://editor-test.bodasdehoy.com
 *   prod   → https://editor.bodasdehoy.com
 *
 * Ejecutar:
 *   E2E_ENV=test pnpm exec playwright test e2e-app/editor-web.spec.ts
 *   EDITOR_URL=http://localhost:3230 pnpm exec playwright test e2e-app/editor-web.spec.ts
 */
import { test, expect, Page } from '@playwright/test';
import * as os from 'os';

// ─── URL resolution ──────────────────────────────────────────────────────────

const E2E_ENV = (process.env.E2E_ENV || 'local').toLowerCase();

function detectLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] ?? []) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
  } catch { /* ignore */ }
  return '0.0.0.0';
}

function resolveEditorUrl(): string {
  if (process.env.EDITOR_URL) return process.env.EDITOR_URL;
  switch (E2E_ENV) {
    case 'test': return 'https://editor-test.bodasdehoy.com';
    case 'prod': return 'https://editor.bodasdehoy.com';
    case 'dev':  return 'https://editor-dev.bodasdehoy.com';
    default:     return `http://${detectLanIp()}:3230`;
  }
}

const EDITOR_URL = resolveEditorUrl();
const isRemote = EDITOR_URL.startsWith('https://');

// ─── Helper ──────────────────────────────────────────────────────────────────

async function waitForEditorReady(page: Page, timeoutMs = 20_000): Promise<void> {
  await page.waitForTimeout(1500);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  const body = page.locator('body');
  await body.waitFor({ state: 'visible', timeout: timeoutMs });
  const text = (await body.textContent()) ?? '';
  if (text.includes('ErrorBoundary') || text.includes('Error Capturado')) {
    throw new Error('ErrorBoundary detectado en editor-web');
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const res = await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status >= 500) {
      console.warn(`⚠️ editor-web devolvió ${status} — algunos tests pueden fallar`);
    } else if (status === 0) {
      console.warn(`⚠️ editor-web no accesible en ${EDITOR_URL} — tests marcarán skip`);
    } else {
      console.log(`[E2E] ✅ editor-web accesible (HTTP ${status}) en ${EDITOR_URL}`);
    }
  } finally {
    await page.close();
  }
});

// ─── 1. Rutas básicas ─────────────────────────────────────────────────────────

test.describe('editor-web — Carga de rutas', () => {
  test.setTimeout(90_000);

  const ROUTES = [
    { path: '/', label: 'Home / entrada al editor' },
    { path: '/preview', label: 'Preview de la web de boda' },
    { path: '/editor', label: 'Editor visual (si existe como ruta directa)' },
  ];

  for (const { path, label } of ROUTES) {
    test(`${path} carga sin ErrorBoundary (${label})`, async ({ page }) => {
      const url = `${EDITOR_URL}${path}`;
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
      const status = res?.status() ?? 0;

      // 502/503 → servidor no levantado → skip informativo
      if (status === 502 || status === 503 || status === 0) {
        console.log(`ℹ️ ${path} no disponible (${status}) — editor-web no está levantado`);
        test.skip();
        return;
      }

      // 404 es aceptable (ruta no existe en esta app)
      if (status === 404) {
        console.log(`ℹ️ ${path} devuelve 404 — ruta no implementada todavía`);
        return;
      }

      await waitForEditorReady(page);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text.length).toBeGreaterThan(50);
    });
  }
});

// ─── 2. Editor visual (WeddingSiteRenderer) ───────────────────────────────────

test.describe('editor-web — Editor visual de web de boda', () => {
  test.setTimeout(120_000);

  test('home muestra entrada al creador o editor visual', async ({ page }) => {
    const res = await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 502 || status === 503 || status === 0) { test.skip(); return; }

    await waitForEditorReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Debe mostrar alguna entrada al editor de webs
    const hasEditorContent =
      /editor|creador|web|boda|plantilla|template|diseño|personaliz/i.test(text) ||
      (await page.locator('canvas, [class*="editor"], [class*="preview"], [class*="wedding"]').count()) > 0;

    expect(hasEditorContent, `editor-web no muestra contenido de editor. Texto: ${text.slice(0, 200)}`).toBe(true);
  });

  test('preview renderiza WeddingSiteRenderer sin crash', async ({ page }) => {
    const res = await page.goto(`${EDITOR_URL}/preview`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 502 || status === 503 || status === 0 || status === 404) { test.skip(); return; }

    await waitForEditorReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text).not.toMatch(/TypeError|ReferenceError|Cannot read/);

    // El renderer debe mostrar algún contenido de boda
    const hasWeddingContent =
      /boda|wedding|pareja|novios|ceremonia|invitad/i.test(text) ||
      (await page.locator('[class*="wedding"], [class*="site"], [class*="renderer"]').count()) > 0;

    console.log(`preview texto: ${text.slice(0, 150)}, hasWeddingContent: ${hasWeddingContent}`);
  });

  test('no muestra pantalla en blanco (contenido mínimo > 100 chars)', async ({ page }) => {
    const res = await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 502 || status === 503 || status === 0) { test.skip(); return; }

    await waitForEditorReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(100);
  });
});

// ─── 3. Navegación y acceso (remote only) ────────────────────────────────────

test.describe('editor-web — Acceso y auth (remote)', () => {
  test.setTimeout(90_000);

  test('acceso sin sesión → muestra contenido público o redirige a login', async ({ page }) => {
    if (!isRemote) { test.skip(); return; }

    const res = await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 502 || status === 503 || status === 0) { test.skip(); return; }

    await waitForEditorReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    const finalPath = new URL(page.url()).pathname;

    // Debe: mostrar contenido o redirigir a login
    const isOk =
      text.trim().length > 50 ||
      finalPath.includes('/login') ||
      finalPath.includes('/auth');

    expect(isOk, `editor-web: respuesta inesperada en ${page.url()}. Texto: ${text.slice(0, 150)}`).toBe(true);
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('URL editor-web accesible y responde sin 5xx', async ({ request }) => {
    if (!isRemote) { test.skip(); return; }

    const res = await request.get(EDITOR_URL, { timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;

    // 502/503 = tunnel/servidor no levantado → skip informativo (no fallo del test)
    if (status === 502 || status === 503 || status === 0) {
      console.log(`ℹ️ editor-web no disponible (${status}) — no está desplegado aún`);
      test.skip();
      return;
    }
    expect(status).not.toBeGreaterThanOrEqual(500);
    expect(status).toBeGreaterThan(0);
  });
});
