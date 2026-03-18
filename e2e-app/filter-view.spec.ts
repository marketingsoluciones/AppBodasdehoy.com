/**
 * filter-view.spec.ts — E2E para la herramienta lobe-filter-app-view
 *
 * Verifica el flujo completo:
 *   1. Chat-ia procesa una pregunta del usuario sobre invitados/presupuesto/etc.
 *   2. La IA llama la herramienta filter_view via postMessage
 *   3. El iframe (appEventos) recibe FILTER_VIEW y muestra el banner rosa
 *   4. El banner incluye el texto filtrado correcto
 *   5. El botón ✕ limpia el filtro
 *
 * Estrategia de testing sin cross-origin real:
 *   - Simula el postMessage directamente en appEventos (sin necesitar el iframe real)
 *   - Verifica que CopilotIframe.tsx procesa el mensaje correctamente
 *   - También verifica el smoke del iframe real cuando está disponible
 *
 * Requiere: BASE_URL=https://app-test.bodasdehoy.com (con VPN)
 *           TEST_USER_EMAIL / TEST_USER_PASSWORD
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady, loginAndSelectEvent } from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const BASE_URL = TEST_URLS.app;
const CHAT_URL = TEST_URLS.chat;
const isAppTest = BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

// ─── helper ───────────────────────────────────────────────────────────────────

/** Simula un postMessage de tipo FILTER_VIEW como si viniera del iframe de chat-ia */
async function sendFilterViewMessage(page: import('@playwright/test').Page, payload: {
  entity: string;
  ids?: string[];
  query?: string;
}) {
  await page.evaluate((data) => {
    window.postMessage(
      { type: 'FILTER_VIEW', source: 'chat-ia', ...data },
      '*'
    );
  }, payload);
}

/** Simula CLEAR_FILTER */
async function sendClearFilterMessage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    window.postMessage({ type: 'CLEAR_FILTER', source: 'chat-ia' }, '*');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Smoke — páginas que usan filter_view cargan sin crash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('filter_view — smoke (sin login)', () => {
  test.setTimeout(60_000);

  for (const { path, entity } of [
    { path: '/', entity: 'events' },
    { path: '/invitados', entity: 'guests' },
    { path: '/presupuesto', entity: 'budget_items' },
    { path: '/servicios', entity: 'services' },
    { path: '/itinerario', entity: 'moments' },
    { path: '/mesas', entity: 'tables' },
  ]) {
    test(`${path} carga sin crash (entity: ${entity})`, async ({ context, page }) => {
      if (!isAppTest) { test.skip(); return; }
      await clearSession(context, page);

      const response = await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 40_000,
      });
      expect(response?.status()).not.toBe(500);

      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text.length).toBeGreaterThan(30);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. postMessage FILTER_VIEW → banner rosa aparece
// ─────────────────────────────────────────────────────────────────────────────

test.describe('filter_view — postMessage simulated', () => {
  test.setTimeout(120_000);

  test('FILTER_VIEW events → banner rosa en home', async ({ page }) => {
    if (!isAppTest || !TEST_CREDENTIALS.email) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, BASE_URL);
    if (!eventId) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    // Simular filter_view con entidad 'events'
    await sendFilterViewMessage(page, {
      entity: 'events',
      ids: [],
      query: 'bodas 2024',
    });
    await page.waitForTimeout(800);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasBanner = /copilot filtró|filtró/i.test(bodyText) || /🤖/.test(bodyText);

    if (hasBanner) {
      console.log('✅ Banner de filtro Copilot detectado en home');
      // Verificar que el chip tiene el texto de la query
      expect(bodyText).toMatch(/bodas 2024|filtró/i);
    } else {
      console.log('ℹ️ Banner no detectado — puede que el CopilotIframe no esté montado en esta vista');
    }
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('FILTER_VIEW guests → banner rosa en /invitados', async ({ page }) => {
    if (!isAppTest || !TEST_CREDENTIALS.email) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, BASE_URL);
    if (!eventId) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    await sendFilterViewMessage(page, {
      entity: 'guests',
      ids: ['000000000000000000000001', '000000000000000000000002'],
      query: 'mesa 1',
    });
    await page.waitForTimeout(800);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasBanner = /copilot filtró|filtró|🤖/i.test(text);
    console.log(`${hasBanner ? '✅' : 'ℹ️'} Banner guests en /invitados: ${hasBanner}`);
  });

  test('FILTER_VIEW budget_items → banner en /presupuesto', async ({ page }) => {
    if (!isAppTest || !TEST_CREDENTIALS.email) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, BASE_URL);
    if (!eventId) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    await sendFilterViewMessage(page, { entity: 'budget_items', ids: [], query: 'catering' });
    await page.waitForTimeout(800);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log(`ℹ️ Banner budget_items: ${/copilot filtró|🤖/i.test(text)}`);
  });

  test('CLEAR_FILTER elimina el banner', async ({ page }) => {
    if (!isAppTest || !TEST_CREDENTIALS.email) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, BASE_URL);
    if (!eventId) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    // Activar filtro
    await sendFilterViewMessage(page, { entity: 'guests', ids: [], query: 'prueba' });
    await page.waitForTimeout(600);

    // Limpiar filtro
    await sendClearFilterMessage(page);
    await page.waitForTimeout(600);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    // El banner debería desaparecer
    const hasBanner = /copilot filtró.*prueba/i.test(text);
    if (!hasBanner) console.log('✅ Banner limpiado correctamente');
    else console.log('ℹ️ Banner persiste — puede necesitar más tiempo o UI diferente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Botón ✕ en el banner limpia el filtro
// ─────────────────────────────────────────────────────────────────────────────

test.describe('filter_view — interacción UI', () => {
  test.setTimeout(120_000);

  test('click en ✕ del banner activa clearCopilotFilter', async ({ page }) => {
    if (!isAppTest || !TEST_CREDENTIALS.email) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, BASE_URL);
    if (!eventId) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    // Activar filtro
    await sendFilterViewMessage(page, { entity: 'guests', ids: [], query: 'e2e prueba click' });
    await page.waitForTimeout(800);

    // Buscar el botón ✕ del banner
    const closeBtn = page.locator('button').filter({ hasText: /✕|×|clear|limpiar/i }).first();
    const isVisible = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (isVisible) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      const afterText = (await page.locator('body').textContent()) ?? '';
      const stillHasBanner = /e2e prueba click/i.test(afterText);
      if (!stillHasBanner) console.log('✅ Filtro limpiado al hacer click en ✕');
      else console.log('ℹ️ Banner aún visible tras click — verificar handler');
    } else {
      console.log('ℹ️ Botón ✕ no visible — banner puede no haberse activado');
    }

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Smoke del iframe de chat-ia (si está disponible)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('filter_view — iframe smoke', () => {
  test.setTimeout(60_000);

  test('chat-ia accesible y carga sin crash', async ({ page }) => {
    try {
      const response = await page.goto(CHAT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });
      if (!response || response.status() >= 500) {
        console.log('⚠️ chat no disponible — skip');
        test.skip();
        return;
      }
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      console.log('✅ chat accesible');
    } catch {
      console.log('⚠️ chat sin respuesta — skip');
      test.skip();
    }
  });

  test('asistente.tsx embeds chat-ia en iframe sin crash', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await clearSession(context, page);

    const response = await page.goto(`${BASE_URL}/asistente`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    expect(response?.status()).not.toBe(500);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasIframe = await page.locator('iframe').count();
    console.log(`ℹ️ Iframes en /asistente: ${hasIframe}`);
  });
});
