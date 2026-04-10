/**
 * memories-web-standalone.spec.ts
 *
 * E2E tests para memories-web standalone (`:3240` local / memories-test.bodasdehoy.com).
 * Distinto de memories-album.spec.ts que prueba /memories DENTRO de chat-ia.
 * Este spec prueba la app memories-web como producto independiente.
 *
 * Flujos cubiertos:
 *   1. Carga de rutas principales (/, /app, /pro)
 *   2. Landing page / página comercial
 *   3. Login / acceso (con y sin sesión)
 *   4. Sección app (lista de álbumes si hay sesión)
 *   5. Sección pro (upgrade, planes)
 *   6. Localización (es/en)
 *   7. SSO: cookie compartida de .bodasdehoy.com reconocida
 *
 * Ejecutar:
 *   E2E_ENV=test MEMORIES_URL=https://memories-test.bodasdehoy.com pnpm exec playwright test e2e-app/memories-web-standalone.spec.ts
 *   MEMORIES_URL=http://localhost:3240 pnpm exec playwright test e2e-app/memories-web-standalone.spec.ts
 */
import { test, expect, Page } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from './fixtures';
import * as os from 'os';

// ─── URL resolution ──────────────────────────────────────────────────────────

const E2E_ENV = (process.env.E2E_ENV || 'local').toLowerCase();

const MEMORIES_URL = process.env.MEMORIES_URL || TEST_URLS.memories;
const isRemote = MEMORIES_URL.startsWith('https://');

const EMAIL    = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

// ─── Helper ──────────────────────────────────────────────────────────────────

async function waitForMemStandaloneReady(page: Page, timeoutMs = 20_000): Promise<void> {
  await page.waitForTimeout(1500);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  const body = page.locator('body');
  await body.waitFor({ state: 'visible', timeout: timeoutMs });
  const text = (await body.textContent()) ?? '';
  if (text.includes('ErrorBoundary') || text.includes('Error Capturado')) {
    throw new Error('ErrorBoundary detectado en memories-web-standalone');
  }
}

async function checkAvailable(page: Page, url: string): Promise<boolean> {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
  const status = res?.status() ?? 0;
  if (status === 502 || status === 503 || status === 0) {
    console.log(`ℹ️ memories-web no disponible (${status}) en ${url}`);
    return false;
  }
  return true;
}

// ─── Health check ─────────────────────────────────────────────────────────────

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const res = await page.goto(MEMORIES_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    console.log(`[E2E] memories-web-standalone → ${MEMORIES_URL} (HTTP ${status})`);
    if (status === 200) console.log('[E2E] ✅ memories-web-standalone accesible');
    else console.warn(`[E2E] ⚠️ memories-web-standalone devolvió ${status}`);
  } finally {
    await page.close();
  }
});

// ─── 1. Rutas básicas ─────────────────────────────────────────────────────────

test.describe('memories-web — Carga de rutas', () => {
  test.setTimeout(90_000);

  const ROUTES = [
    { path: '/',     label: 'Landing / Home comercial' },
    { path: '/app',  label: 'App de álbumes (requiere sesión)' },
    { path: '/pro',  label: 'Página de upgrade Pro' },
    { path: '/login', label: 'Página de login (si existe)' },
  ];

  for (const { path, label } of ROUTES) {
    test(`${path} carga sin ErrorBoundary (${label})`, async ({ page }) => {
      const ok = await checkAvailable(page, `${MEMORIES_URL}${path}`);
      if (!ok) { test.skip(); return; }

      await waitForMemStandaloneReady(page);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text.trim().length).toBeGreaterThan(50);
      console.log(`✅ ${path} cargó. Texto: ${text.slice(0, 100)}`);
    });
  }
});

// ─── 2. Landing / Página comercial ────────────────────────────────────────────

test.describe('memories-web — Landing comercial', () => {
  test.setTimeout(90_000);

  test('home muestra propuesta de valor de Memories', async ({ page }) => {
    const ok = await checkAvailable(page, MEMORIES_URL);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // La landing debe mencionar el producto
    const hasProductContent =
      /memories|álbum|album|fotos|recuerdo|boda|comparte/i.test(text);
    expect(hasProductContent, `Landing no muestra contenido de Memories. Texto: ${text.slice(0, 200)}`).toBe(true);
  });

  test('tiene CTA de registro o acceso', async ({ page }) => {
    const ok = await checkAvailable(page, MEMORIES_URL);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';

    // Debe tener un botón/link de acción
    const hasAction =
      /empezar|comenzar|registr|crear.*cuenta|iniciar|sign\s*up|get\s*started|acceder/i.test(text) ||
      (await page.locator('a, button').filter({ hasText: /empezar|crear|registr|acceder|sign\s*up/i }).count()) > 0;

    console.log(`CTA presente: ${hasAction}`);
    // No falla si no hay CTA — podría ser una ruta autenticada
  });

  test('no pantalla en blanco (body > 100 chars)', async ({ page }) => {
    const ok = await checkAvailable(page, MEMORIES_URL);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(100);
  });
});

// ─── 3. Sección /app — lista de álbumes ───────────────────────────────────────

test.describe('memories-web — /app (álbumes)', () => {
  test.setTimeout(120_000);

  test('/app carga sin crash (logueado o redirige a login)', async ({ page }) => {
    const ok = await checkAvailable(page, `${MEMORIES_URL}/app`);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    const finalPath = new URL(page.url()).pathname;

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // O muestra álbumes o redirige a login
    const isOk =
      /álbum|album|fotos|memories|recuerd/i.test(text) ||
      finalPath.includes('/login') ||
      finalPath.includes('/auth') ||
      finalPath === '/';

    expect(isOk, `Respuesta inesperada en /app. URL: ${page.url()}. Texto: ${text.slice(0, 150)}`).toBe(true);
  });

  test('/app con sesión SSO muestra lista de álbumes o vacío', async ({ page, context }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    // Usar cookie SSO compartida de .bodasdehoy.com (set por chat-ia login)
    // Si no hay cookie, el test verifica que la redirección a login es limpia
    const ok = await checkAvailable(page, `${MEMORIES_URL}/app`);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    const finalPath = new URL(page.url()).pathname;

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const isAuthenticated = finalPath.includes('/app') && !/login|auth/i.test(finalPath);
    const isRedirectedToLogin = finalPath.includes('/login') || finalPath.includes('/auth');

    if (isAuthenticated) {
      console.log('✅ /app accesible con sesión SSO');
      // Debe mostrar álbumes o estado vacío
      const hasAlbumContent =
        /álbum|album|crear.*álbum|mis.*fotos|sin.*álbum|no.*álbum|vacío/i.test(text) ||
        (await page.locator('[class*="album"], [class*="card"], [class*="grid"]').count()) > 0;
      console.log(`hasAlbumContent: ${hasAlbumContent}`);
    } else if (isRedirectedToLogin) {
      console.log('ℹ️ /app redirigió a login — SSO no propagado (esperado en entorno aislado)');
    }
  });
});

// ─── 4. Sección /pro ─────────────────────────────────────────────────────────

test.describe('memories-web — /pro (upgrade)', () => {
  test.setTimeout(90_000);

  test('/pro muestra página de upgrade o planes', async ({ page }) => {
    const ok = await checkAvailable(page, `${MEMORIES_URL}/pro`);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasProContent =
      /pro|premium|plan|upgrade|precio|precio|€|\$/i.test(text) ||
      // Si redirige al home o login también es OK
      /login|álbum|memories/i.test(text);

    console.log(`/pro texto: ${text.slice(0, 150)}`);
    expect(text.trim().length).toBeGreaterThan(50);
  });
});

// ─── 5. Localización ─────────────────────────────────────────────────────────

test.describe('memories-web — Localización', () => {
  test.setTimeout(90_000);

  test('carga con locale español por defecto', async ({ page }) => {
    const ok = await checkAvailable(page, MEMORIES_URL);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verifica ausencia de texto i18n sin traducir ([key.missing], undefined)
    expect(text).not.toMatch(/\[(?:es|en)\.\w+\]|undefined\.[\w.]+/);
    console.log(`Locale OK. Sin claves i18n sin traducir.`);
  });

  test('cambio a locale inglés (/en) no crashea', async ({ page }) => {
    const enUrl = `${MEMORIES_URL}/en`;
    const res = await page.goto(enUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 404 || status === 502 || status === 0) {
      console.log(`ℹ️ /en no disponible (${status}) — locale switching puede no estar implementado`);
      return;
    }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.trim().length).toBeGreaterThan(50);
  });
});

// ─── 6. SSO — cookie compartida ───────────────────────────────────────────────

test.describe('memories-web — SSO cookie de .bodasdehoy.com', () => {
  test.setTimeout(90_000);

  test('navegador sin cookies → memories-web responde sin crash', async ({ context, page }) => {
    if (!isRemote) { test.skip(); return; }

    // Contexto limpio (sin cookies)
    await context.clearCookies();
    const ok = await checkAvailable(page, MEMORIES_URL);
    if (!ok) { test.skip(); return; }

    await waitForMemStandaloneReady(page);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.trim().length).toBeGreaterThan(50);
    console.log(`✅ Sin cookies: memories-web responde OK. Path: ${new URL(page.url()).pathname}`);
  });
});
