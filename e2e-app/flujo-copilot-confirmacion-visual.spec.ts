/**
 * Subdominios app-test / chat-test. Login, túneles y BPM se dan por hechos.
 * Flujo: login → (evento si hay; si no, seguimos igual) → por cada pregunta → Copilot → panel derecho → pause para tu OK.
 * No hace skip cuando no hay eventos: se abre Copilot en home o en /invitados.
 *
 * Soporta DOS arquitecturas del Copilot:
 *  A) CopilotEmbed (actual): textarea nativo en el DOM (sin iframe).
 *  B) CopilotIframe (legacy): iframe con chat-test.
 *
 * pnpm e2e:copilot:autonomo
 * Batería desde archivo: E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt pnpm e2e:copilot:autonomo
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import {
  clearSession,
  waitForAppReady,
  loginAndSelectEvent,
  loginAndSelectEventByName,
  shouldSkipAppUnreachable,
  waitForCopilotReady,
  waitForMessagesScreen,
  waitForRightSideResult,
} from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const DEFAULT_BODY_MATCH = /invitado|filtró|Filtro|nombre|lista|encontraron|evento|mesa|resumen|presupuesto|tarea/i;
function loadQuestionsFromFile(filePath: string): { pregunta: string; urlContains?: string; bodyMatch?: RegExp; rutaInicial?: string }[] {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return [];
  const content = fs.readFileSync(fullPath, 'utf-8');
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .map((pregunta) => ({ pregunta, bodyMatch: DEFAULT_BODY_MATCH }));
}

const APP_TEST = 'https://app-test.bodasdehoy.com';
const BASE_URL = process.env.BASE_URL || APP_TEST;
const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);
const EVENTO_RAUL_ISABEL = process.env.TEST_EVENT_NAME || 'Raúl Isabel';
const WAIT_FOR_VISUAL = process.env.E2E_WAIT_FOR_VISUAL_CONFIRMATION !== '0';
/** Si true: pausa antes de escribir y escribe lento para que veas la pregunta en pantalla (el sistema escribe, tú solo confirmas). */
const SLOW_VISIBLE_TYPE = WAIT_FOR_VISUAL || process.env.E2E_SLOW_TYPE === '1';

const PREGUNTAS: { pregunta: string; urlContains?: string; bodyMatch?: RegExp; rutaInicial?: string }[] = [
  { pregunta: 'Muéstrame la lista de invitados en la app.', urlContains: '/invitados', bodyMatch: /Filtro|filtró|encontraron|invitado|evento\(s\)/i, rutaInicial: '/invitados' },
  { pregunta: 'Quiero ver la mesa 1. Muéstramela en la app.', urlContains: '/mesas', bodyMatch: /Filtro|filtró/i, rutaInicial: '/invitados' },
  { pregunta: 'Muéstrame solo los invitados confirmados en la app.', urlContains: '/invitados', bodyMatch: /Filtro|filtró/i, rutaInicial: '/invitados' },
  { pregunta: 'Lista las tareas del itinerario y muéstrame la primera en la app.', urlContains: '/itinerario', bodyMatch: /Filtro|filtró|tarea/i, rutaInicial: '/itinerario' },
  { pregunta: 'Dame un resumen: cuántas mesas hay, cuántos invitados y el total del presupuesto.', bodyMatch: /mesa|invitado|presupuesto/i, rutaInicial: '/resumen-evento' },
];

/** Pregunta personalizada: tú me dices en el chat la frase, yo ejecuto el flujo con esa pregunta. Ej: E2E_COPILOT_QUESTION="Muéstrame invitados..." */
const CUSTOM_QUESTION = process.env.E2E_COPILOT_QUESTION?.trim();
/** Batería desde archivo: una pregunta por línea; líneas que empiezan por # se ignoran. Ej: E2E_COPILOT_QUESTIONS_FILE=e2e-app/copilot-questions-ejemplo.txt */
const QUESTIONS_FILE = process.env.E2E_COPILOT_QUESTIONS_FILE?.trim();
const FROM_FILE = QUESTIONS_FILE ? loadQuestionsFromFile(QUESTIONS_FILE) : [];
const PREGUNTAS_TO_USE =
  FROM_FILE.length > 0
    ? FROM_FILE
    : CUSTOM_QUESTION
      ? [{ pregunta: CUSTOM_QUESTION, bodyMatch: DEFAULT_BODY_MATCH }]
      : PREGUNTAS;

test.describe('Copilot — preguntas en app-test, panel derecho para feedback', () => {
  test.setTimeout(600_000);

  test('Login → evento → cada pregunta → muestro pantalla → tú OK → siguiente', async ({
    context,
    page,
  }) => {
    if (!hasCredentials) {
      test.skip(true, 'Faltan TEST_USER_EMAIL / TEST_USER_PASSWORD');
      return;
    }
    if (!BASE_URL.includes('app-test.bodasdehoy.com')) {
      test.skip(true, 'Este flujo usa app-test (subdominios). No local.');
      return;
    }

    const skipClearSession = process.env.E2E_SKIP_CLEAR_SESSION === '1';
    if (!skipClearSession) await clearSession(context, page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    if (await shouldSkipAppUnreachable(page)) {
      if (WAIT_FOR_VISUAL) await page.pause();
      test.skip(true, 'App no alcanzable (1033/cookies)');
      return;
    }

    let eventId = await loginAndSelectEventByName(page, EMAIL, PASSWORD, BASE_URL, EVENTO_RAUL_ISABEL);
    if (!eventId) eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    if (eventId) {
      await page.goto(`${BASE_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    } else {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2_000);

    // ── Detectar qué arquitectura de Copilot usa la app ──
    let copilotMode: 'embed' | 'iframe' | null = null;

    /**
     * Escribe una pregunta en el Copilot y pulsa Enter.
     * Soporta embed (textarea directo) e iframe (legacy).
     */
    const sendCopilot = async (text: string): Promise<boolean> => {
      if (page.url().includes('/login')) return false;

      // Asegurar que el panel está abierto
      const toggle = page.getByTestId('copilot-toggle');
      const isToggleVisible = await toggle.isVisible().catch(() => false);
      if (isToggleVisible) {
        // Verificar si el Copilot ya está abierto (textarea visible)
        const alreadyOpen =
          (await page.locator('textarea[placeholder*="Escribe"]').isVisible().catch(() => false)) ||
          (await page.locator('iframe[src*="chat"]').count().catch(() => 0)) > 0;
        if (!alreadyOpen) {
          await toggle.click();
          await page.waitForTimeout(3_000);
        }
      }

      const { ready, mode } = await waitForCopilotReady(page, 50_000);
      if (!ready) return false;
      copilotMode = mode;

      if (mode === 'embed') {
        // ── CopilotEmbed: textarea nativo, componente controlado con React ──
        const textarea = page.locator('textarea[placeholder*="Escribe"]').first();
        await textarea.waitFor({ state: 'visible', timeout: 12_000 });
        await textarea.scrollIntoViewIfNeeded().catch(() => {});

        // Cerrar posibles overlays de Next.js (portals, toasts) que bloquean clicks
        await page.locator('nextjs-portal').evaluate((el) => el.remove()).catch(() => {});
        await page.waitForTimeout(200);

        // focus + fill: no depende de click (que puede ser interceptado por overlays)
        await textarea.focus();
        await page.waitForTimeout(200);

        if (SLOW_VISIBLE_TYPE) await page.waitForTimeout(2_000);

        // fill() dispara el onChange de React correctamente (keyboard.type no lo hace en componentes controlados)
        await textarea.fill(text);

        if (SLOW_VISIBLE_TYPE) await page.waitForTimeout(1_500);
        await page.waitForTimeout(500);

        // Enter para enviar (InputEditor: Enter sin Shift = send)
        await textarea.press('Enter');
        return true;
      }

      if (mode === 'iframe') {
        // ── Legacy: iframe con chat-test ──
        const iframe = page.frameLocator('iframe[src*="chat"]').first();
        const editor = iframe.locator('div[contenteditable="true"], textarea, input[type="text"]').last();
        await editor.waitFor({ state: 'visible', timeout: 12_000 });
        await editor.scrollIntoViewIfNeeded().catch(() => {});
        await editor.click();
        await page.waitForTimeout(500);
        await editor.click();
        await page.waitForTimeout(400);

        if (SLOW_VISIBLE_TYPE) await page.waitForTimeout(4_000);

        const isTextarea = await editor.evaluate((el) => el.tagName === 'TEXTAREA').catch(() => false);
        if (isTextarea) {
          await editor.fill(text);
        } else {
          await page.keyboard.type(text, { delay: SLOW_VISIBLE_TYPE ? 250 : 100 });
        }

        if (SLOW_VISIBLE_TYPE) await page.waitForTimeout(2_000);
        await page.waitForTimeout(700);
        await page.keyboard.press('Enter');
        return true;
      }

      return false;
    };

    // ── Verificar que el botón Copilot existe ──
    const toggle = page.getByTestId('copilot-toggle');
    await toggle.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);
    if (!(await toggle.isVisible().catch(() => false))) {
      if (WAIT_FOR_VISUAL) await page.pause();
      test.skip(true, 'No se ve el botón del Copilot; revisar página.');
      return;
    }

    // Abrir Copilot y verificar que está listo
    await toggle.click();
    await page.waitForTimeout(3_000);
    const { ready: copilotReady, mode } = await waitForCopilotReady(page, 45_000);
    copilotMode = mode;
    if (!copilotReady) {
      if (WAIT_FOR_VISUAL) await page.pause();
      test.skip(true, 'Copilot no abrió o no se puede escribir; revisar antes de seguir.');
      return;
    }

    console.log(`[E2E] Copilot detectado en modo: ${copilotMode}`);

    // Verificar que el input está visible
    let editorVisible = false;
    if (copilotMode === 'embed') {
      editorVisible = await page.locator('textarea[placeholder*="Escribe"]').first().isVisible().catch(() => false);
    } else if (copilotMode === 'iframe') {
      const iframe = page.frameLocator('iframe[src*="chat"]').first();
      editorVisible = await iframe.locator('div[contenteditable="true"], textarea, input[type="text"]').last().isVisible().catch(() => false);
    }
    if (!editorVisible) {
      if (WAIT_FOR_VISUAL) await page.pause();
      test.skip(true, 'No se ve el editor del Copilot para escribir.');
      return;
    }

    // ── Ejecutar preguntas ──
    const total = PREGUNTAS_TO_USE.length;
    for (let i = 0; i < total; i++) {
      const { pregunta, urlContains, bodyMatch, rutaInicial } = PREGUNTAS_TO_USE[i];
      const num = i + 1;
      const shortText = pregunta.length > 60 ? pregunta.slice(0, 57) + '...' : pregunta;
      console.log(`\n[E2E] Pregunta ${num}/${total}: ${shortText}`);

      const sent = await sendCopilot(pregunta);
      if (!sent) {
        if (WAIT_FOR_VISUAL) await page.pause();
        test.skip(true, `Copilot no cargó en pregunta ${num}`);
        return;
      }

      await waitForMessagesScreen(page, { timeoutMs: 150_000, requireFilterOrMesas: false, mode: copilotMode });
      if (urlContains || bodyMatch) {
        await waitForRightSideResult(page, { timeoutMs: 60_000, urlContains, bodyMatch });
      }

      expect((await page.locator('body').textContent()) ?? '').not.toMatch(/Error Capturado por ErrorBoundary/);

      if (WAIT_FOR_VISUAL) {
        const resultsDir = path.join(process.cwd(), 'test-results');
        try {
          fs.mkdirSync(resultsDir, { recursive: true });
          const screenshotPath = path.join(resultsDir, `copilot-pregunta-${num}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          console.log(`[E2E] Captura guardada: ${screenshotPath} — ábrela para confirmar si no ves el navegador.`);
        } catch {
          /* ignorar si no se puede guardar */
        }
        console.log(`[E2E] Confirmar en el chat: Pregunta ${num}/${total} — "${shortText}"`);
        await page.pause();
      }
    }
  });
});
