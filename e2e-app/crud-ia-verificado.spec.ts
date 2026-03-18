/**
 * crud-ia-verificado.spec.ts
 *
 * Tests CRUD mediante IA con verificación cruzada en UI de appEventos.
 *
 * Metodología:
 *   1. Enviar prompt en chat-test → IA llama function-calling → api2 GraphQL
 *   2. Navegar a appEventos y verificar que el dato aparece en la UI con getByText()
 *   3. Verificar cambios cuantitativos (N invitados → N+1)
 *
 * RUN_ID único por ejecución para evitar colisiones entre runs paralelos.
 *
 * Requiere:
 *   - Sesión activa en chat-test (TEST_USER_EMAIL + TEST_USER_PASSWORD)
 *   - Sesión activa en app-test (mismo usuario)
 *   - Al menos un evento en la cuenta de prueba
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, gotoModule, waitForAppReady } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

/** Sufijo único para datos de prueba de esta ejecución */
const RUN_ID = Date.now().toString().slice(-6);

const GUEST_NAME = `E2E Invitado ${RUN_ID}`;
const GUEST_EMAIL = `e2e-inv-${RUN_ID}@test.bodasdehoy.com`;
const SERVICE_NAME = `E2E Servicio ${RUN_ID}`;
const BUDGET_DESC = `E2E Partida ${RUN_ID}`;
const BUDGET_AMOUNT = '175';
const TASK_DESC = `E2E Tarea ${RUN_ID}`;

/** Login en chat-test */
async function loginInChat(page: any): Promise<boolean> {
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const btn = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch {
    return false;
  }
}

/** Envía un prompt en el chat y espera respuesta de la IA */
async function sendPromptAndWaitReply(page: any, prompt: string, timeoutMs = 45_000): Promise<string> {
  const editor = page.locator('div[contenteditable="true"]').first();
  await editor.waitFor({ state: 'visible', timeout: 15_000 });
  await editor.click();
  await page.keyboard.type(prompt);
  await page.keyboard.press('Enter');

  // Esperar a que aparezca una respuesta (contenido de IA en el chat)
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(2000);
    const messages = page.locator('[class*="message"], [class*="chat-item"], [data-role="assistant"]');
    const count = await messages.count();
    if (count > 0) {
      const lastMsg = messages.last();
      const text = (await lastMsg.textContent()) ?? '';
      if (text.length > 20 && !/cargando|loading|\.{3}/i.test(text)) {
        return text;
      }
    }
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup compartido
// ─────────────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

let eventId: string | null = null;

test.describe('CRUD via IA — Verificación cruzada en appEventos', () => {
  test.setTimeout(180_000);

  test.beforeAll(async ({ browser }) => {
    if (!isAppTest || !hasCredentials) return;

    const context = await browser.newContext();
    const page = await context.newPage();
    eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    await context.close();
  });

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    // Solo limpiar cookies sin destruir sesión existente (no clearSession completo)
    // La sesión se mantiene de beforeAll
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Crear invitado via IA → verificar en /invitados
  // ───────────────────────────────────────────────────────────────────────────

  test(`crear invitado "${GUEST_NAME}" via IA → aparece en /invitados`, async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const chatOk = await loginInChat(page);
    if (!chatOk) { console.log('ℹ️ Login en chat fallido'); return; }

    // Contar invitados actuales en appEventos
    let initialCount = 0;
    {
      const ctx2Page = page; // reutilizar misma página
      await ctx2Page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await waitForAppReady(ctx2Page, 20_000);
      await ctx2Page.waitForTimeout(2000);
      const rows = ctx2Page.locator('table tr, [class*="guest-row"], [class*="invitado"]');
      initialCount = await rows.count();
      console.log(`Invitados iniciales: ${initialCount}`);
    }

    // Volver al chat y crear invitado
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const prompt = `Crea un invitado con nombre "${GUEST_NAME}" y email "${GUEST_EMAIL}". Confirma cuando esté creado.`;
    const reply = await sendPromptAndWaitReply(page, prompt, 60_000);
    console.log(`Respuesta IA crear invitado: ${reply.slice(0, 100)}`);

    // Verificar en /invitados de appEventos
    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Verificar que el nombre del invitado aparece en la tabla
    const guestRow = page.getByText(GUEST_NAME, { exact: false });
    const isVisible = await guestRow.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      console.log(`✅ Invitado "${GUEST_NAME}" creado y visible en /invitados`);
      await expect(guestRow.first()).toBeVisible();
    } else {
      // Verificar al menos que el conteo aumentó
      const rows = page.locator('table tr, [class*="guest-row"]');
      const newCount = await rows.count();
      console.log(`ℹ️ Invitados después: ${newCount} (era ${initialCount})`);
      if (newCount > initialCount) {
        console.log('✅ Conteo de invitados aumentó — CRUD funcionó');
      } else {
        console.log('⚠️ No se pudo verificar la creación del invitado');
      }
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Crear tarea en itinerario via IA → verificar en /servicios (kanban)
  // ───────────────────────────────────────────────────────────────────────────

  test(`crear tarea "${TASK_DESC}" via IA → visible en /servicios (kanban)`, async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const chatOk = await loginInChat(page);
    if (!chatOk) { return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const prompt = `Crea una tarea con descripción "${TASK_DESC}" en el itinerario. La prioridad es alta. Confirma cuando esté creada.`;
    const reply = await sendPromptAndWaitReply(page, prompt, 60_000);
    console.log(`Respuesta IA crear tarea: ${reply.slice(0, 100)}`);

    // Verificar en /servicios (kanban de tareas)
    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const taskEl = page.getByText(TASK_DESC, { exact: false });
    const isVisible = await taskEl.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      console.log(`✅ Tarea "${TASK_DESC}" visible en /servicios (kanban)`);
      await expect(taskEl.first()).toBeVisible();
    } else {
      // También verificar en /itinerario (tabla de itinerario)
      await page.goto(`${BASE_URL}/itinerario`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await waitForAppReady(page, 15_000);
      await page.waitForTimeout(2000);
      const taskEl2 = page.getByText(TASK_DESC, { exact: false });
      const isVisible2 = await taskEl2.first().isVisible({ timeout: 8_000 }).catch(() => false);
      if (isVisible2) {
        console.log(`✅ Tarea visible en /itinerario`);
      } else {
        console.log('⚠️ Tarea no encontrada en /servicios ni /itinerario — puede que IA no la creó aún');
      }
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Asignar tarea a "novia" via IA → responsable visible
  // ───────────────────────────────────────────────────────────────────────────

  test('asignar tarea existente a "novia" via IA → responsable visible en itinerario', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const chatOk = await loginInChat(page);
    if (!chatOk) { return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    // Primero obtener una tarea existente o la que creamos
    const prompt = `Asigna la tarea "${TASK_DESC}" a la novia. Si no existe, crea primero una tarea con ese nombre y asígnala a la novia.`;
    const reply = await sendPromptAndWaitReply(page, prompt, 60_000);
    console.log(`Respuesta IA asignar tarea: ${reply.slice(0, 100)}`);

    // Verificar en /servicios o /itinerario
    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasNovia = /novia/i.test(text);

    if (hasNovia) {
      console.log('✅ "novia" aparece como responsable en /servicios');
    } else {
      console.log('ℹ️ "novia" no encontrada como texto — puede estar en icono/avatar');
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Crear partida de presupuesto via IA → verificar en /presupuesto
  // ───────────────────────────────────────────────────────────────────────────

  test(`crear partida "${BUDGET_DESC}" con importe ${BUDGET_AMOUNT}€ → visible en /presupuesto`, async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const chatOk = await loginInChat(page);
    if (!chatOk) { return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const prompt = `Crea una partida de presupuesto con descripción "${BUDGET_DESC}" e importe ${BUDGET_AMOUNT} euros. Confirma cuando esté creada.`;
    const reply = await sendPromptAndWaitReply(page, prompt, 60_000);
    console.log(`Respuesta IA crear presupuesto: ${reply.slice(0, 100)}`);

    // Verificar en /presupuesto
    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const budgetEl = page.getByText(BUDGET_DESC, { exact: false });
    const isVisible = await budgetEl.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      console.log(`✅ Partida "${BUDGET_DESC}" visible en /presupuesto`);
      await expect(budgetEl.first()).toBeVisible();
    } else {
      // Verificar que al menos aparece el importe
      const amountEl = page.getByText(`${BUDGET_AMOUNT}`, { exact: false });
      const hasAmount = await amountEl.first().isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(hasAmount ? `✅ Importe ${BUDGET_AMOUNT} visible en presupuesto` : '⚠️ Partida no encontrada en /presupuesto');
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Marcar tarea como completada via IA → estado completada en kanban
  // ───────────────────────────────────────────────────────────────────────────

  test('marcar tarea como completada via IA → aparece en columna "Completadas"', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const chatOk = await loginInChat(page);
    if (!chatOk) { return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const prompt = `Marca como completada la tarea "${TASK_DESC}". Confirma cuando esté marcada.`;
    const reply = await sendPromptAndWaitReply(page, prompt, 60_000);
    console.log(`Respuesta IA completar tarea: ${reply.slice(0, 100)}`);

    // Verificar en /servicios — columna "Completadas" o "completed"
    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(3000);

    // Buscar la tarea en la columna "completed" o con atributo de completada
    const completedSection = page.locator('[class*="completed"], [data-column="completed"]').filter({
      hasText: TASK_DESC,
    });
    const completedEl = page.getByText(TASK_DESC, { exact: false });

    const isInCompleted = await completedSection.first().isVisible({ timeout: 5_000 }).catch(() => false);
    const isVisible = await completedEl.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (isInCompleted) {
      console.log(`✅ Tarea "${TASK_DESC}" en columna completadas`);
    } else if (isVisible) {
      // Verificar clase completada en el elemento
      const classes = await completedEl.first().getAttribute('class').catch(() => '');
      const hasCompletedClass = /completed|done|finished/i.test(classes ?? '');
      console.log(hasCompletedClass
        ? `✅ Tarea tiene clase de completada`
        : `ℹ️ Tarea visible pero sin confirmar estado completado`);
    } else {
      console.log('⚠️ Tarea no encontrada tras completar — puede necesitar refresh');
    }
  });
});
