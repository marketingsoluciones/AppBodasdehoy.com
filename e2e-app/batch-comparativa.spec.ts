/**
 * batch-comparativa.spec.ts
 *
 * Lanza 3 × misma pregunta a chat-ia:
 *   - Como VISITANTE (anónimo, widget /widget/bodasdehoy)
 *   - Como REGISTRADO (login con credenciales, chat principal)
 *
 * Guarda resultados en:
 *   e2e-app/resultados-batch-YYYY-MM-DD.tsv
 *
 * Columnas TSV:
 *   ID | Entorno | Pregunta | Perfil | Rep | Respuesta (extracto) |
 *   Categoria | Duracion_ms | Tu Valoracion
 *
 * Ejecutar visitante (no necesita credenciales):
 *   E2E_ENV=local PLAYWRIGHT_BROWSER=webkit \
 *     npx playwright test e2e-app/batch-comparativa.spec.ts --grep=visitante
 *
 * Ejecutar registrado:
 *   E2E_ENV=local PLAYWRIGHT_BROWSER=webkit \
 *     TEST_USER_EMAIL=bodasdehoy.com@gmail.com TEST_USER_PASSWORD='lorca2012M*+' \
 *     npx playwright test e2e-app/batch-comparativa.spec.ts --grep=registrado
 *
 * Ejecutar ambos:
 *   E2E_ENV=local PLAYWRIGHT_BROWSER=webkit \
 *     TEST_USER_EMAIL=bodasdehoy.com@gmail.com TEST_USER_PASSWORD='lorca2012M*+' \
 *     npx playwright test e2e-app/batch-comparativa.spec.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from './fixtures';

// ─── Configuración ────────────────────────────────────────────────────────────

const CHAT_URL = TEST_URLS.chat;
const WIDGET_URL = `${CHAT_URL}/widget/bodasdehoy`;
const REPETICIONES = 3;
const TIMEOUT_RESPUESTA = 70_000;
const GOTO_TIMEOUT = 120_000;

const PREGUNTAS: Array<{ id: string; texto: string }> = [
  { id: 'BC01', texto: '¿Cuánto cuesta la app y qué planes de precio tiene?' },
  { id: 'BC02', texto: '¿Qué funciones tiene la app para organizar una boda?' },
  { id: 'BC03', texto: '¿Cuántos invitados tengo en mi boda?' },
];

// ─── TSV output ───────────────────────────────────────────────────────────────

const TSV_DIR = path.resolve(__dirname);
const TSV_FILE = path.join(TSV_DIR, `resultados-batch-${new Date().toISOString().slice(0, 10)}.tsv`);
const TSV_HEADER = ['ID', 'Entorno', 'Pregunta', 'Perfil', 'Rep', 'Respuesta (extracto)', 'Categoria', 'Duracion_ms', 'Tu Valoracion'].join('\t');

function detectarCategoria(respuesta: string): string {
  const r = respuesta.toLowerCase();
  if (!respuesta || respuesta.length < 10) return 'empty';
  if (/error|500|timeout|fallo/.test(r)) return 'error';
  if (/regístr|crear cuenta|iniciar sesión|sin cuenta|login/.test(r)) return 'auth_required';
  if (/plan|básico|pro|max|€|euro|precio|gratis|free/.test(r)) return 'comercial';
  if (/invitado.*\d|\d.*invitado/.test(r)) return 'data_response';
  if (/invitado|presupuesto|mesa|itinerario|servicio/.test(r)) return 'data_response';
  if (/hola|ayud|placer|bienvenid/.test(r)) return 'greeting';
  return 'data_response';
}

function escribirTSV(filas: string[][]): void {
  const existe = fs.existsSync(TSV_FILE);
  const lineas = filas.map((f) => f.join('\t')).join('\n');
  if (!existe) {
    fs.writeFileSync(TSV_FILE, TSV_HEADER + '\n' + lineas + '\n', 'utf-8');
  } else {
    fs.appendFileSync(TSV_FILE, lineas + '\n', 'utf-8');
  }
}

// ─── Navegación ───────────────────────────────────────────────────────────────

async function entrarComoVisitante(page: Page): Promise<boolean> {
  await page.goto(WIDGET_URL, { waitUntil: 'commit', timeout: GOTO_TIMEOUT });
  // LeadForm muestra "Continuar sin registrarme" → clickear para ir al chat
  const skip = page.locator('button').filter({ hasText: /sin registrarme|visitante/i }).first();
  if (await skip.waitFor({ timeout: 30_000 }).then(() => true).catch(() => false)) {
    await skip.click();
  }
  return page.locator('textarea').waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
}

async function entrarComoRegistrado(page: Page): Promise<boolean> {
  if (!TEST_CREDENTIALS.email || !TEST_CREDENTIALS.password) return false;

  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
  await page.waitForTimeout(2500);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) return false;

  await emailInput.fill(TEST_CREDENTIALS.email);
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_CREDENTIALS.password);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(6000);
  return true;
}

// ─── Captura de respuesta ─────────────────────────────────────────────────────

async function enviarPreguntaYCapturar(page: Page, pregunta: string): Promise<{ respuesta: string; ms: number }> {
  const inicio = Date.now();

  // LobeChat usa contenteditable; el widget puede usar textarea — probar ambos
  const inputLobe = page.locator('[contenteditable="true"]').first();
  const inputTextarea = page.locator('textarea').first();
  const isLobe = await inputLobe.isVisible({ timeout: 8_000 }).catch(() => false);
  const isTextarea = !isLobe && await inputTextarea.isVisible({ timeout: 5_000 }).catch(() => false);

  if (!isLobe && !isTextarea) {
    return { respuesta: '[ERROR: input no visible]', ms: Date.now() - inicio };
  }

  try {
    const bodyAntes = (await page.locator('body').textContent() ?? '').length;

    if (isLobe) {
      await inputLobe.click();
      await inputLobe.pressSequentially(pregunta, { delay: 20 });
      await page.keyboard.press('Enter');
    } else {
      await inputTextarea.fill(pregunta);
      await page.waitForTimeout(300);
      await inputTextarea.press('Enter');
    }

    // Esperar que aparezca texto nuevo
    await page.waitForFunction(
      (lenAntes) => (document.body.textContent?.length ?? 0) > lenAntes + 20,
      bodyAntes,
      { timeout: TIMEOUT_RESPUESTA },
    ).catch(() => {});

    await page.waitForTimeout(5000);

    // Selectores LobeChat
    const lobeSelector = [
      '[data-role="assistant"] [class*="markdown"]',
      '[data-role="assistant"] [class*="content"]',
      '[class*="AssistantMessage"] p',
    ].join(', ');
    const lobeBloques = page.locator(lobeSelector);
    const nLobe = await lobeBloques.count().catch(() => 0);
    if (nLobe > 0) {
      const textos: string[] = [];
      const inicio2 = Math.max(0, nLobe - 8);
      for (let i = inicio2; i < nLobe; i++) {
        const t = await lobeBloques.nth(i).textContent().catch(() => '');
        if (t?.trim()) textos.push(t.trim());
      }
      const r = textos.join(' ').trim();
      if (r.length > 15) return { respuesta: r.slice(0, 800), ms: Date.now() - inicio };
    }

    // Fallback body text
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const needle = pregunta.slice(0, 30);
    const idx = (bodyText ?? '').lastIndexOf(needle);
    const texto = idx > -1
      ? (bodyText ?? '').slice(idx + needle.length, idx + needle.length + 600).trim()
      : (bodyText ?? '').slice(-600).trim();
    return { respuesta: texto, ms: Date.now() - inicio };
  } catch (e) {
    // La página puede cerrarse (widget timeout, crash del proceso webkit)
    const msg = e instanceof Error ? e.message : String(e);
    if (/closed|destroyed|detached/i.test(msg)) {
      return { respuesta: '[ERROR: página cerrada mid-test]', ms: Date.now() - inicio };
    }
    throw e;
  }
}

// ─── Colección global de resultados ──────────────────────────────────────────

const todasFilas: string[][] = [];

// ─── TESTS: VISITANTE ─────────────────────────────────────────────────────────

test.describe('Batch Comparativa — visitante', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(TIMEOUT_RESPUESTA * REPETICIONES * PREGUNTAS.length + 120_000);

  test.afterAll(() => {
    if (todasFilas.length > 0) {
      escribirTSV(todasFilas.filter((f) => f[3] === 'visitante'));
      console.log(`\n✅ TSV guardado en: ${TSV_FILE}`);
    }
  });

  for (const pregunta of PREGUNTAS) {
    for (let rep = 1; rep <= REPETICIONES; rep++) {
      const testId = `${pregunta.id}-V${rep}`;
      test(`${testId} — ${pregunta.texto.slice(0, 50)} — visitante rep ${rep}`, async ({ page, context }) => {
        await context.clearCookies();

        const ok = await entrarComoVisitante(page);
        if (!ok) {
          console.log(`⚠️  ${testId}: no se pudo entrar al widget`);
          test.skip();
          return;
        }

        const { respuesta, ms } = await enviarPreguntaYCapturar(page, pregunta.texto);
        const categoria = detectarCategoria(respuesta);
        const extracto = respuesta.replace(/\t|\n/g, ' ').slice(0, 200);

        const fila = [testId, 'widget', pregunta.texto, 'visitante', String(rep), extracto, categoria, String(ms), ''];
        todasFilas.push(fila);

        console.log(`\n${'─'.repeat(70)}`);
        console.log(`🙋 ${testId} | VISITANTE | ${ms}ms | Categoria: ${categoria}`);
        console.log(`   Pregunta : ${pregunta.texto}`);
        console.log(`   Respuesta: ${extracto.slice(0, 180)}${extracto.length > 180 ? '…' : ''}`);

        expect(respuesta.length, `${testId}: respuesta vacía`).toBeGreaterThan(10);
      });
    }
  }
});

// ─── TESTS: REGISTRADO ────────────────────────────────────────────────────────

test.describe('Batch Comparativa — registrado', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(TIMEOUT_RESPUESTA * REPETICIONES * PREGUNTAS.length + 180_000);

  test.afterAll(() => {
    if (todasFilas.length > 0) {
      escribirTSV(todasFilas.filter((f) => f[3] === 'registrado'));
    }
  });

  for (const pregunta of PREGUNTAS) {
    for (let rep = 1; rep <= REPETICIONES; rep++) {
      const testId = `${pregunta.id}-R${rep}`;
      test(`${testId} — ${pregunta.texto.slice(0, 50)} — registrado rep ${rep}`, async ({ page, context }) => {
        if (!TEST_CREDENTIALS.email) { test.skip(); return; }

        await context.clearCookies();

        const ok = await entrarComoRegistrado(page);
        if (!ok) {
          console.log(`⚠️  ${testId}: no se pudo hacer login`);
          test.skip();
          return;
        }

        const { respuesta, ms } = await enviarPreguntaYCapturar(page, pregunta.texto);
        const categoria = detectarCategoria(respuesta);
        const extracto = respuesta.replace(/\t|\n/g, ' ').slice(0, 200);

        const fila = [testId, 'chat-ia', pregunta.texto, 'registrado', String(rep), extracto, categoria, String(ms), ''];
        todasFilas.push(fila);

        console.log(`\n${'─'.repeat(70)}`);
        console.log(`👤 ${testId} | REGISTRADO | ${ms}ms | Categoria: ${categoria}`);
        console.log(`   Pregunta : ${pregunta.texto}`);
        console.log(`   Respuesta: ${extracto.slice(0, 180)}${extracto.length > 180 ? '…' : ''}`);

        expect(respuesta.length, `${testId}: respuesta vacía`).toBeGreaterThan(10);
      });
    }
  }
});
