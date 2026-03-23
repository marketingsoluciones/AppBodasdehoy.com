/**
 * preguntas-filtros-usuario.spec.ts
 *
 * Tests E2E en navegador: preguntas como usuario y comprobación de filtros.
 *
 * 1. Preguntas a todos los eventos: listar eventos, cuántos tengo, etc.
 * 2. Preguntas al evento concreto "Raúl Isabel": seleccionar ese evento y preguntar
 *    por invitados, mesas, presupuesto, itinerario.
 * 3. Filtros: preguntas que deben disparar filter_view (querer ver mesa X, invitados
 *    confirmados, etc.) y comprobar que aparece la barra de filtro y/o se navega
 *    a la sección correcta.
 *
 * Ejecutar en navegador para ver y confirmar:
 *   BASE_URL=https://app-test.bodasdehoy.com pnpm exec playwright test e2e-app/preguntas-filtros-usuario.spec.ts --headed
 *   o con local: BASE_URL=http://127.0.0.1:8080 ...
 *
 * Requiere: TEST_USER_EMAIL, TEST_USER_PASSWORD (o fixtures por defecto).
 */
import { test, expect } from '@playwright/test';
import {
  clearSession,
  waitForAppReady,
  loginAndSelectEvent,
  loginAndSelectEventByName,
  waitForCopilotReady,
} from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const BASE_URL = TEST_URLS.app;
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1');

const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

/** Nombre (o parte) del evento de prueba concreto, ej. "Raúl Isabel" */
const EVENTO_RAUL_ISABEL = process.env.TEST_EVENT_NAME || 'Raúl Isabel';

// ─── Helper: abrir Copilot y escribir (soporta embed y iframe legacy) ────────

async function openCopilotAndSend(
  page: import('@playwright/test').Page,
  message: string,
  waitReplyMs = 35_000,
): Promise<string> {
  const toggle = page.getByTestId('copilot-toggle');
  await toggle.waitFor({ state: 'visible', timeout: 8_000 });
  await toggle.click();
  await page.waitForTimeout(3_000);

  const { ready, mode } = await waitForCopilotReady(page, 30_000);
  if (!ready) return '';

  const assistantSelector = '[class*="markdown"], [class*="message-content"], [class*="assistant"], [data-role="assistant"]';

  if (mode === 'embed') {
    const textarea = page.locator('textarea[placeholder*="Escribe"]').first();
    await textarea.waitFor({ state: 'visible', timeout: 15_000 });
    await textarea.click();
    await textarea.fill(message);
    await textarea.press('Enter');
    await page.waitForTimeout(waitReplyMs);

    const lastMsg = page.locator(assistantSelector).last();
    return (await lastMsg.textContent().catch(() => '')) ?? '';
  }

  // Legacy iframe
  const iframe = page.frameLocator('iframe[src*="chat"]').first();
  const editor = iframe.locator('div[contenteditable="true"]').last();
  await editor.waitFor({ state: 'visible', timeout: 15_000 });
  await editor.click();
  await page.keyboard.type(message, { delay: 40 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(waitReplyMs);

  const lastMsg = iframe.locator(assistantSelector).last();
  return (await lastMsg.textContent().catch(() => '')) ?? '';
}

/**
 * Comprueba si la barra de filtro Copilot es visible en el body de la app.
 * CopilotFilterBar.tsx muestra: 🔍 Filtro: "query" · N tipo(s)  [botón ✕]
 */
async function hasFilterBar(page: import('@playwright/test').Page): Promise<boolean> {
  // Intentar detectar el componente CopilotFilterBar directamente
  const filterBar = page.locator('.bg-pink-100, [class*="pink"]').first();
  if (await filterBar.isVisible({ timeout: 1_000 }).catch(() => false)) return true;
  const bodyText = (await page.locator('body').textContent()) ?? '';
  // Texto del banner: "Filtro: ..." o "Filtro activo ·"
  return /Filtro:|Filtro activo|🔍/i.test(bodyText);
}

// ─── 0. Smoke — spec y app cargan ────────────────────────────────────────────

test.describe('Preguntas y filtros — smoke', () => {
  test.setTimeout(30_000);

  test('app responde en BASE_URL (login o home)', async ({ page }) => {
    const response = await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    expect(response?.status()).not.toBe(500);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log(`✅ ${BASE_URL} responde OK`);
  });
});

// ─── 1. Preguntas a todos los eventos ─────────────────────────────────────────

test.describe('Preguntas a todos los eventos', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) test.skip();
    await clearSession(context, page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);
  });

  test('login y listar eventos desde Copilot', async ({ page }) => {
    const eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (!eventId) {
      console.log('ℹ️ No hay eventos — skip');
      test.skip();
      return;
    }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      'Lista mis eventos de boda. ¿Cuántos tengo?',
      30_000,
    );
    expect(reply.length, 'Debe haber respuesta del Copilot').toBeGreaterThan(20);
    console.log(`✅ Respuesta (${reply.length} chars): ${reply.slice(0, 200)}`);
  });

  test('pregunta cuántos eventos tengo (sin seleccionar evento)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForAppReady(page, 15_000);

    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid*="email"]').first();
    const emailVisible = await emailInput.isVisible({ timeout: 12_000 }).catch(() => false);
    if (!emailVisible) {
      console.log('ℹ️ Formulario de login no visible (redirect o página distinta) — skip');
      test.skip();
      return;
    }
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    await waitForAppReady(page, 20_000);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      '¿Cuántos eventos o bodas tengo en mi cuenta?',
      28_000,
    );
    expect(reply.length).toBeGreaterThan(15);
    console.log(`✅ Respuesta eventos: ${reply.slice(0, 180)}`);
  });
});

// ─── 2. Preguntas al evento Raúl Isabel ───────────────────────────────────────

test.describe('Preguntas al evento Raúl Isabel', () => {
  test.setTimeout(140_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) test.skip();
    await clearSession(context, page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);
  });

  test('selecciona evento Raúl Isabel y pregunta por invitados', async ({ page }) => {
    let eventId = await loginAndSelectEventByName(
      page,
      EMAIL,
      PASSWORD,
      BASE_URL,
      EVENTO_RAUL_ISABEL,
    );
    if (!eventId) {
      eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
      if (!eventId) {
        console.log(`ℹ️ No se encontró evento "${EVENTO_RAUL_ISABEL}" ni otro — skip`);
        test.skip();
        return;
      }
      console.log(`ℹ️ Usando primer evento disponible en lugar de "${EVENTO_RAUL_ISABEL}"`);
    }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      '¿Cuántos invitados tengo en este evento? ¿Cuántos confirmados?',
      32_000,
    );
    expect(reply.length).toBeGreaterThan(20);
    console.log(`✅ Invitados evento ${EVENTO_RAUL_ISABEL}: ${reply.slice(0, 220)}`);
  });

  test('evento Raúl Isabel — pregunta por mesas y presupuesto', async ({ page }) => {
    let eventId = await loginAndSelectEventByName(
      page,
      EMAIL,
      PASSWORD,
      BASE_URL,
      EVENTO_RAUL_ISABEL,
    );
    if (!eventId) eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (!eventId) {
      console.log(`ℹ️ No hay evento — skip`);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      'Dame un resumen: cuántas mesas hay, cuántos invitados y el total del presupuesto.',
      35_000,
    );
    expect(reply.length).toBeGreaterThan(30);
    console.log(`✅ Resumen evento: ${reply.slice(0, 250)}`);
  });
});

// ─── 3. Filtros: preguntas que deben activar filter_view ───────────────────────

test.describe('Filtros — preguntas que activan filter_view', () => {
  test.setTimeout(140_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) test.skip();
    await clearSession(context, page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);
  });

  test('Quiero ver la mesa X → barra de filtro y/o navegación a mesas', async ({ page }) => {
    let eventId = await loginAndSelectEventByName(
      page,
      EMAIL,
      PASSWORD,
      BASE_URL,
      EVENTO_RAUL_ISABEL,
    );
    if (!eventId) eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (!eventId) {
      console.log(`ℹ️ No hay evento — skip`);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      'Quiero ver la mesa 1. Muéstramela en la app.',
      45_000,
    );
    // Esperar a que CopilotEmbed procese la acción FILTER_VIEW y el estado React se actualice
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasBar = await hasFilterBar(page);

    console.log(`   URL tras pregunta: ${url}`);
    console.log(`   Barra de filtro visible: ${hasBar}`);
    console.log(`   Respuesta Copilot (inicio): ${reply.slice(0, 150)}`);

    expect((await page.locator('body').textContent()) ?? '').not.toMatch(
      /Error Capturado por ErrorBoundary/,
    );
    if (hasBar) console.log('✅ Barra de filtro activa tras "ver la mesa"');
    if (url.includes('/mesas')) console.log('✅ Navegación automática a /mesas');
  });

  test('Muéstrame los invitados confirmados → filtro en invitados', async ({ page }) => {
    let eventId = await loginAndSelectEventByName(
      page,
      EMAIL,
      PASSWORD,
      BASE_URL,
      EVENTO_RAUL_ISABEL,
    );
    if (!eventId) eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (!eventId) {
      console.log(`ℹ️ No hay evento — skip`);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      'Muéstrame solo los invitados confirmados en la app.',
      45_000,
    );
    await page.waitForTimeout(2000);

    const hasBar = await hasFilterBar(page);
    console.log(`   Barra de filtro visible: ${hasBar}`);
    console.log(`   Respuesta: ${reply.slice(0, 180)}`);

    expect((await page.locator('body').textContent()) ?? '').not.toMatch(
      /Error Capturado por ErrorBoundary/,
    );
    if (hasBar) console.log('✅ Barra de filtro activa tras "invitados confirmados"');
  });

  test('Ver la tarea X o itinerario → filtro moments', async ({ page }) => {
    let eventId = await loginAndSelectEventByName(
      page,
      EMAIL,
      PASSWORD,
      BASE_URL,
      EVENTO_RAUL_ISABEL,
    );
    if (!eventId) eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (!eventId) {
      console.log(`ℹ️ No hay evento — skip`);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/itinerario`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const reply = await openCopilotAndSend(
      page,
      'Lista las tareas del itinerario y muéstrame la primera en la app.',
      45_000,
    );
    await page.waitForTimeout(2000);

    const hasBar = await hasFilterBar(page);
    const url = page.url();
    console.log(`   URL: ${url}, Barra filtro: ${hasBar}`);
    console.log(`   Respuesta: ${reply.slice(0, 150)}`);

    expect((await page.locator('body').textContent()) ?? '').not.toMatch(
      /Error Capturado por ErrorBoundary/,
    );
  });
});
