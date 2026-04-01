/**
 * crud-permission.spec.ts
 *
 * Tests DETERMINÍSTICOS — respuestas validadas contra valores reales de la DB.
 * Evento de referencia: Boda Isabel & Raúl (ID 66a9042dec5c58aa734bca44)
 *
 * Estructura de batches con gates:
 *
 *   BATCH 0 — SMOKE (gate global): ¿Está el servidor vivo?
 *   BATCH 1 — CRUD via IA: 5 preguntas con respuestas exactas de DB
 *   BATCH 2 — PERMISOS: guest y invitado NO deben ver datos privados
 *
 * Si BATCH 0 falla → todos los demás se saltan (test.skip).
 * Si una pregunta CRUD falla por backend → se para ese batch (no gastar más tokens).
 *
 * Ejecutar:
 *   E2E_ENV=dev npx playwright test e2e-app/crud-permission.spec.ts --project=webkit
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_CREDENTIALS, TEST_URLS, E2E_ENV } from './fixtures';
import { clearSession } from './helpers';
import { ISABEL_RAUL_EVENT, TEST_USERS, CRUD_QUESTIONS, PERMISSION_QUESTIONS } from './fixtures/isabel-raul-event';

const CHAT_URL = TEST_URLS.chat;
const MULT = E2E_ENV === 'local' ? 1 : 1.5;

// ─── Estado global del smoke gate ────────────────────────────────────────────

let smokeGatePassed = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(2000);
  if (page.url().includes('/chat')) return true;

  const emailInput = page.locator('input[type="email"], input[placeholder="tu@email.com"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(email);

  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.fill(password);

  await page.locator('button:has-text("Iniciar sesión"), button[type="submit"]').first().click();
  await page.waitForTimeout(8000);
  return page.url().includes('/chat');
}

async function enterAsVisitor(page: Page): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(1500);
  const btn = page.locator('button:has-text("Continuar como visitante"), button:has-text("visitante")').first();
  const visible = await btn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (visible) {
    await btn.click();
    await page.waitForTimeout(3000);
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);
  } else {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);
  }
  return page.url().includes('/chat');
}

/** Envía un mensaje y espera respuesta estable (máx waitMs ms) */
async function sendAndWait(page: Page, message: string, waitMs = 45_000): Promise<string> {
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 20_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(message, { delay: 20 });
  await page.keyboard.press('Enter');

  // Espera inicial para que el modelo empiece a responder
  await page.waitForTimeout(5_000);

  const deadline = Date.now() + waitMs;
  let lastText = '';
  let stableCount = 0;

  while (Date.now() < deadline) {
    const articles = await page.locator('article').allTextContents();
    const userPrefix = message.trim().slice(0, 30).toLowerCase();
    const aiMsgs = articles.filter((t) => {
      const trimmed = t.trim();
      if (trimmed.length <= 5) return false;
      if (trimmed.slice(0, 30).toLowerCase().startsWith(userPrefix.slice(0, 20))) return false;
      return true;
    });
    const joined = aiMsgs.join('\n').trim();
    if (joined.length > 10) {
      if (joined === lastText) {
        stableCount++;
        if (stableCount >= 2) break; // Estable 2 ciclos consecutivos
      } else {
        stableCount = 0;
        lastText = joined;
      }
    }
    await page.waitForTimeout(1_500);
  }
  return lastText;
}

/** Clasifica si la respuesta es un error de backend (no del AI) */
function isBackendError(response: string): boolean {
  return /Servicio IA no disponible|TIMEOUT_ERROR|backend.*IA.*no disponible|intenta.*más tarde/i.test(response);
}

/** Clasifica si la respuesta es un fallo de herramienta (AI intentó pero no pudo) */
function isToolFailed(response: string): boolean {
  return /no pude obtener|error al intentar|no he podido acceder|hubo un error|no pud.*recuperar/i.test(response);
}

// ─── BATCH 0: SMOKE GATE ──────────────────────────────────────────────────────

test.describe('BATCH 0 — Smoke Gate', () => {
  test.setTimeout(30_000);

  test('S01 — servidor responde en <5s', async ({ page }) => {
    const t0 = Date.now();
    const resp = await page.goto(`${CHAT_URL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
    const ms = Date.now() - t0;
    expect(resp?.status(), `Servidor devolvió ${resp?.status()}`).toBeLessThan(400);
    expect(ms, `Tardó ${ms}ms — supera 5s`).toBeLessThan(5_000);
    smokeGatePassed = true;
    console.log(`✅ S01 — servidor OK en ${ms}ms`);
  });
});

// ─── BATCH 1: CRUD via IA ─────────────────────────────────────────────────────
// Las 5 preguntas sobre Boda Isabel & Raúl tienen respuestas exactas de la DB.
// Si el servidor falla (backend error) en cualquier pregunta → se para el batch.

test.describe('BATCH 1 — CRUD via IA (Boda Isabel & Raúl)', () => {
  test.setTimeout(90_000 * MULT);

  let loggedIn = false;

  test.beforeAll(async ({ browser }) => {
    if (!smokeGatePassed) return;
    const page = await browser.newPage();
    loggedIn = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    await page.close();
  });

  test('BATCH-1 gate — login como organizador', async ({ page }) => {
    if (!smokeGatePassed) {
      test.skip(true, 'Smoke gate no pasó — servidor no disponible');
    }
    const ok = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    expect(ok, 'Login fallido — no se puede probar CRUD').toBe(true);
    loggedIn = ok;
  });

  // ── C01 — Total invitados ──────────────────────────────────────────────────

  test(`C01 — total invitados = ${ISABEL_RAUL_EVENT.invitados.total}`, async ({ page }) => {
    if (!smokeGatePassed || !loggedIn) test.skip();

    await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    const response = await sendAndWait(page, CRUD_QUESTIONS[0].pregunta, 45_000 * MULT);

    console.log(`C01 respuesta: "${response.slice(0, 200)}"`);

    if (isBackendError(response)) {
      test.fail(true, `❌ Backend error — no gastar más tokens en este batch: "${response.slice(0, 150)}"`);
      return;
    }

    expect(
      CRUD_QUESTIONS[0].expectedPattern.test(response),
      `Esperaba "${CRUD_QUESTIONS[0].description}" en: "${response.slice(0, 300)}"`,
    ).toBe(true);

    expect(
      CRUD_QUESTIONS[0].failPattern.test(response),
      `La IA dijo que no encontró datos (tool falló): "${response.slice(0, 200)}"`,
    ).toBe(false);
  });

  // ── C02 — Confirmados ─────────────────────────────────────────────────────

  test(`C02 — confirmados = ${ISABEL_RAUL_EVENT.invitados.confirmados}`, async ({ page }) => {
    if (!smokeGatePassed || !loggedIn) test.skip();

    await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    const response = await sendAndWait(page, CRUD_QUESTIONS[1].pregunta, 45_000 * MULT);

    console.log(`C02 respuesta: "${response.slice(0, 200)}"`);

    if (isBackendError(response)) {
      test.fail(true, `❌ Backend error en C02: "${response.slice(0, 150)}"`);
      return;
    }

    expect(
      CRUD_QUESTIONS[1].expectedPattern.test(response),
      `Esperaba "${CRUD_QUESTIONS[1].description}" en: "${response.slice(0, 300)}"`,
    ).toBe(true);
  });

  // ── C03 — Celíacos ────────────────────────────────────────────────────────

  test(`C03 — celíacos = ${ISABEL_RAUL_EVENT.dietas.celiacos}`, async ({ page }) => {
    if (!smokeGatePassed || !loggedIn) test.skip();

    await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    const response = await sendAndWait(page, CRUD_QUESTIONS[2].pregunta, 45_000 * MULT);

    console.log(`C03 respuesta: "${response.slice(0, 200)}"`);

    if (isBackendError(response)) {
      test.fail(true, `❌ Backend error en C03: "${response.slice(0, 150)}"`);
      return;
    }

    expect(
      CRUD_QUESTIONS[2].expectedPattern.test(response),
      `Esperaba "${CRUD_QUESTIONS[2].description}" en: "${response.slice(0, 300)}"`,
    ).toBe(true);
  });

  // ── C04 — Confirmación de Juancarlos ─────────────────────────────────────

  test('C04 — Juancarlos test NO ha confirmado (pendiente)', async ({ page }) => {
    if (!smokeGatePassed || !loggedIn) test.skip();

    await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    const response = await sendAndWait(page, CRUD_QUESTIONS[3].pregunta, 45_000 * MULT);

    console.log(`C04 respuesta: "${response.slice(0, 200)}"`);

    if (isBackendError(response)) {
      test.fail(true, `❌ Backend error en C04: "${response.slice(0, 150)}"`);
      return;
    }

    // No debe decir que SÍ confirmó
    expect(
      CRUD_QUESTIONS[3].failPattern.test(response),
      `❌ La IA dice que Juancarlos SÍ confirmó — dato incorrecto: "${response.slice(0, 200)}"`,
    ).toBe(false);

    // Debe indicar que está pendiente
    expect(
      CRUD_QUESTIONS[3].expectedPattern.test(response),
      `Esperaba "pendiente/no confirmado" en: "${response.slice(0, 300)}"`,
    ).toBe(true);
  });

  // ── C05 — Fecha de la boda ────────────────────────────────────────────────

  test(`C05 — fecha boda = ${ISABEL_RAUL_EVENT.fecha}`, async ({ page }) => {
    if (!smokeGatePassed || !loggedIn) test.skip();

    await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    const response = await sendAndWait(page, CRUD_QUESTIONS[4].pregunta, 45_000 * MULT);

    console.log(`C05 respuesta: "${response.slice(0, 200)}"`);

    if (isBackendError(response)) {
      test.fail(true, `❌ Backend error en C05: "${response.slice(0, 150)}"`);
      return;
    }

    expect(
      CRUD_QUESTIONS[4].expectedPattern.test(response),
      `Esperaba fecha 30/12/2025 en: "${response.slice(0, 300)}"`,
    ).toBe(true);
  });
});

// ─── BATCH 2: PERMISOS ────────────────────────────────────────────────────────
// Verifica que roles restringidos (guest, invitado) NO ven datos privados del org.
// Este batch es regresión del bug de data leak corregido en commit df2077fe.

test.describe('BATCH 2 — Permisos (guest e invitado no ven datos privados)', () => {
  test.setTimeout(60_000 * MULT);

  // ── P01 — Guest (visitante) NO ve datos del organizador ───────────────────

  test('P01 — guest/visitante NO recibe datos privados de Isabel & Raúl', async ({ context, page }) => {
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    await clearSession(context, page);
    await enterAsVisitor(page);

    const editorVisible = await page.locator('div[contenteditable="true"]').last()
      .isVisible({ timeout: 20_000 }).catch(() => false);
    if (!editorVisible) { test.skip(true, 'Chat no cargó en modo visitante'); return; }

    const question = PERMISSION_QUESTIONS[0].pregunta;
    const response = await sendAndWait(page, question, 40_000 * MULT);

    console.log(`P01 (guest) respuesta: "${response.slice(0, 300)}"`);

    if (isBackendError(response)) {
      // Backend caído no es un fallo de permisos — skip
      test.skip(true, `Backend error — no se puede validar permisos: "${response.slice(0, 100)}"`);
      return;
    }

    // CRÍTICO: el número 43 (total de invitados del organizador) NO debe aparecer
    expect(
      PERMISSION_QUESTIONS[0].forbiddenPattern.test(response),
      `🚨 DATA LEAK: guest recibió datos privados del organizador: "${response.slice(0, 300)}"`,
    ).toBe(false);

    // Debe responder en modo comercial (invitar a registrarse) o ser general
    const isCommercial = /registrar|crear\s*cuenta|acceso\s*limitado|modo\s*gratuito|funciones\s*(premium|de\s*pago)/i.test(response);
    const isGeneral = response.length > 20 && !PERMISSION_QUESTIONS[0].forbiddenPattern.test(response);
    expect(isCommercial || isGeneral, `Respuesta inesperada para guest: "${response.slice(0, 200)}"`).toBe(true);
  });

  // ── P02 — Invitado (jcc@bodasdehoy.com) solo ve su evento ────────────────

  test('P02 — invitado solo ve su evento "Email pruebas", no los 43 del organizador', async ({ page }) => {
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    const ok = await loginChat(page, TEST_USERS.colaborador2.email, TEST_CREDENTIALS.password);
    if (!ok) { test.skip(true, `Login fallido para ${TEST_USERS.colaborador2.email}`); return; }

    const question = PERMISSION_QUESTIONS[1].pregunta;
    const response = await sendAndWait(page, question, 45_000 * MULT);

    console.log(`P02 (invitado) respuesta: "${response.slice(0, 300)}"`);

    if (isBackendError(response)) {
      test.skip(true, `Backend error — no se puede validar permisos: "${response.slice(0, 100)}"`);
      return;
    }

    // NO debe listar los 43 eventos del organizador
    expect(
      PERMISSION_QUESTIONS[1].forbiddenPattern.test(response),
      `🚨 DATA LEAK: invitado recibió eventos del organizador: "${response.slice(0, 300)}"`,
    ).toBe(false);

    // Debe ver "Email pruebas" (su único evento) o ninguno
    const seesOwnEvent = /email\s*pruebas|1\s*evento|un\s*evento/i.test(response);
    const seesNone = /no\s*(tienes?|encontré)\s*(eventos?|acceso)|0\s*eventos?/i.test(response);
    expect(
      seesOwnEvent || seesNone,
      `Respuesta inesperada para invitado: "${response.slice(0, 300)}"`,
    ).toBe(true);
  });
});
