/**
 * batch-comparativa.spec.ts
 *
 * Lote de 3 repeticiones × 3 preguntas × 2 perfiles (visitante + registrado).
 *
 * Qué mide cada pregunta:
 *   Q1: "¿Cuánto cuesta la app y qué planes tiene?"
 *       → visitante: pitch comercial / plan gratuito
 *       → registrado: detalles de precio real y plan actual
 *
 *   Q2: "¿Qué funciones tiene la app para bodas?"
 *       → visitante: marketing con CTA de registro
 *       → registrado: funciones técnicas profundas
 *
 *   Q3: "¿Cuántos invitados tengo en mi boda?"
 *       → visitante: no tiene datos, empuja al registro
 *       → registrado: llama a api-ia y devuelve número real
 *
 * Cómo correr:
 *   # Solo visitante (sin credenciales):
 *   E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit npx playwright test e2e-app/batch-comparativa.spec.ts
 *
 *   # Visitante + registrado:
 *   E2E_ENV=dev TEST_USER_EMAIL=... TEST_USER_PASSWORD=... PLAYWRIGHT_BROWSER=webkit \
 *     npx playwright test e2e-app/batch-comparativa.spec.ts
 *
 * Resultados: se imprimen en consola (redirigir a .json si se desea).
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from './fixtures';

// ─── Configuración ───────────────────────────────────────────────────────────

const CHAT_URL = TEST_URLS.chat;
const REPETICIONES = 3;
const TIMEOUT_RESPUESTA = 60_000; // ms por mensaje

const PREGUNTAS = [
  {
    id: 'Q1_precios',
    texto: '¿Cuánto cuesta la app y qué planes de precio tiene?',
    esperado_visitante: /gratis|plan|registro|cuenta|precio|free/i,
    esperado_registrado: /plan|básico|pro|max|€|euro|precio/i,
  },
  {
    id: 'Q2_funciones',
    texto: '¿Qué funciones tiene la app para organizar una boda?',
    esperado_visitante: /invitados|presupuesto|mesas|registr|cuenta/i,
    esperado_registrado: /invitados|presupuesto|mesas|itinerario|servicios/i,
  },
  {
    id: 'Q3_invitados',
    texto: '¿Cuántos invitados tengo en mi boda?',
    esperado_visitante: /registr|cuenta|acceder|información|no tengo acceso/i,
    esperado_registrado: /invitado|\d+|evento|lista/i,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MensajeResult {
  pregunta: string;
  repeticion: number;
  perfil: 'visitante' | 'registrado';
  respuesta: string;
  duracion_ms: number;
  cumple_esperado: boolean;
  error?: string;
}

async function limpiarSesion(context: BrowserContext, page: Page): Promise<void> {
  await context.clearCookies();
  try {
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* */ }
      try { sessionStorage.clear(); } catch { /* */ }
    }).catch(() => {});
  } catch { /* */ }
  await context.clearCookies();
}

async function entrarComoVisitante(page: Page): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await page.waitForTimeout(2500);

  const btn = page.locator('button').filter({
    hasText: /visitante|sin cuenta|continuar sin|invitado/i,
  }).first();

  const visible = await btn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (!visible) {
    // Puede que ya esté en chat como visitante (tenía ID guardado)
    const inChat =
      (await page.locator('textarea, [contenteditable="true"]').count()) > 0;
    console.log(inChat ? '  → ya en chat como visitante' : '  → botón visitante no encontrado');
    return inChat;
  }

  await btn.click();
  await page.waitForTimeout(2000);
  return true;
}

async function entrarComoRegistrado(page: Page): Promise<boolean> {
  if (!TEST_CREDENTIALS.email || !TEST_CREDENTIALS.password) return false;

  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
    console.log('  → formulario de login no encontrado');
    return false;
  }

  await emailInput.fill(TEST_CREDENTIALS.email);
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_CREDENTIALS.password);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  return true;
}

async function enviarPreguntaYCapturar(
  page: Page,
  pregunta: string,
): Promise<{ respuesta: string; duracion_ms: number }> {
  const inicio = Date.now();

  // Localizar textarea del chat
  const input = page
    .locator('textarea[placeholder], [contenteditable="true"], textarea')
    .first();

  if (!await input.isVisible({ timeout: 15_000 }).catch(() => false)) {
    throw new Error('Input de chat no visible');
  }

  // Contar mensajes actuales antes de enviar
  const antesCount = await page.locator(
    '[data-role="assistant"], [class*="assistant"], [class*="AssistantMessage"]',
  ).count();

  await input.fill(pregunta);
  await page.waitForTimeout(300);
  await input.press('Enter');

  // Esperar a que aparezca UNA respuesta nueva del asistente
  await page.waitForFunction(
    (antes) => {
      const sels = [
        '[data-role="assistant"]',
        '[class*="assistant"]',
        '[class*="AssistantMessage"]',
        '[class*="lobe-chat-message"]',
      ];
      for (const sel of sels) {
        const els = document.querySelectorAll(sel);
        if (els.length > antes) return true;
      }
      return false;
    },
    antesCount,
    { timeout: TIMEOUT_RESPUESTA },
  ).catch(() => {});

  // Esperar un poco más para que el streaming termine
  await page.waitForTimeout(3000);

  // Extraer el último mensaje del asistente
  const mensajesAsistente = page.locator(
    '[data-role="assistant"] [class*="content"], [class*="AssistantMessage"] p, [class*="markdown"] p',
  );
  const count = await mensajesAsistente.count();

  let respuesta = '';
  if (count > 0) {
    respuesta = (await mensajesAsistente.nth(count - 1).textContent()) ?? '';
  }

  // Fallback: leer el body completo y extraer el último bloque de texto relevante
  if (respuesta.trim().length < 20) {
    const bodyText = (await page.locator('body').textContent()) ?? '';
    // Buscar la última respuesta del asistente (suele estar al final del DOM)
    const partes = bodyText.split(pregunta.slice(0, 30));
    respuesta = partes[partes.length - 1]?.trim().slice(0, 600) ?? bodyText.slice(-600);
  }

  return {
    respuesta: respuesta.trim().slice(0, 800),
    duracion_ms: Date.now() - inicio,
  };
}

function imprimirResumen(resultados: MensajeResult[]): void {
  const total = resultados.length;
  const ok = resultados.filter((r) => r.cumple_esperado).length;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`RESUMEN BATCH: ${ok}/${total} respuestas cumplen patrón esperado`);
  console.log(JSON.stringify(resultados, null, 2));
}

// ─── TESTS: VISITANTE ─────────────────────────────────────────────────────────

test.describe('Batch Comparativa — Visitante (anónimo)', () => {
  test.setTimeout(TIMEOUT_RESPUESTA * REPETICIONES * PREGUNTAS.length + 120_000);

  const resultados: MensajeResult[] = [];

  test.afterAll(() => {
    if (resultados.length > 0) imprimirResumen(resultados);
  });

  for (const pregunta of PREGUNTAS) {
    for (let rep = 1; rep <= REPETICIONES; rep++) {
      test(`${pregunta.id} — rep ${rep}/${REPETICIONES} — visitante`, async ({
        page,
        context,
      }) => {
        await limpiarSesion(context, page);

        const ok = await entrarComoVisitante(page);
        if (!ok) {
          console.log(`⚠️  ${pregunta.id} rep ${rep}: no se pudo entrar como visitante`);
          test.skip();
          return;
        }

        let respuesta = '';
        let duracion_ms = 0;
        let error: string | undefined;

        try {
          const result = await enviarPreguntaYCapturar(page, pregunta.texto);
          respuesta = result.respuesta;
          duracion_ms = result.duracion_ms;
        } catch (e: unknown) {
          error = e instanceof Error ? e.message : String(e);
          console.error(`  ✗ error: ${error}`);
        }

        const cumple = pregunta.esperado_visitante.test(respuesta);

        const resultado: MensajeResult = {
          pregunta: pregunta.texto,
          repeticion: rep,
          perfil: 'visitante',
          respuesta,
          duracion_ms,
          cumple_esperado: cumple,
          ...(error ? { error } : {}),
        };

        resultados.push(resultado);

        console.log(`\n${'─'.repeat(60)}`);
        console.log(`🙋 ${pregunta.id} | Rep ${rep} | VISITANTE`);
        console.log(`  Pregunta : ${pregunta.texto}`);
        console.log(`  Respuesta: ${respuesta.slice(0, 200)}${respuesta.length > 200 ? '…' : ''}`);
        console.log(`  Duración : ${duracion_ms}ms`);
        console.log(`  Patrón OK: ${cumple ? '✅' : '⚠️ NO COINCIDE'}`);

        expect(respuesta.length).toBeGreaterThan(10);
      });
    }
  }
});

// ─── TESTS: REGISTRADO ────────────────────────────────────────────────────────

test.describe('Batch Comparativa — Usuario Registrado', () => {
  test.setTimeout(TIMEOUT_RESPUESTA * REPETICIONES * PREGUNTAS.length + 180_000);

  const resultados: MensajeResult[] = [];

  test.afterAll(() => {
    if (resultados.length > 0) imprimirResumen(resultados);
  });

  test.beforeAll(async () => {
    if (!TEST_CREDENTIALS.email) {
      console.log('⏭  Sin TEST_USER_EMAIL — tests de registrado omitidos');
    }
  });

  for (const pregunta of PREGUNTAS) {
    for (let rep = 1; rep <= REPETICIONES; rep++) {
      test(`${pregunta.id} — rep ${rep}/${REPETICIONES} — registrado`, async ({
        page,
        context,
      }) => {
        if (!TEST_CREDENTIALS.email) {
          test.skip();
          return;
        }

        await limpiarSesion(context, page);

        const ok = await entrarComoRegistrado(page);
        if (!ok) {
          console.log(`⚠️  ${pregunta.id} rep ${rep}: no se pudo hacer login`);
          test.skip();
          return;
        }

        let respuesta = '';
        let duracion_ms = 0;
        let error: string | undefined;

        try {
          const result = await enviarPreguntaYCapturar(page, pregunta.texto);
          respuesta = result.respuesta;
          duracion_ms = result.duracion_ms;
        } catch (e: unknown) {
          error = e instanceof Error ? e.message : String(e);
          console.error(`  ✗ error: ${error}`);
        }

        const cumple = pregunta.esperado_registrado.test(respuesta);

        const resultado: MensajeResult = {
          pregunta: pregunta.texto,
          repeticion: rep,
          perfil: 'registrado',
          respuesta,
          duracion_ms,
          cumple_esperado: cumple,
          ...(error ? { error } : {}),
        };

        resultados.push(resultado);

        console.log(`\n${'─'.repeat(60)}`);
        console.log(`👤 ${pregunta.id} | Rep ${rep} | REGISTRADO`);
        console.log(`  Pregunta : ${pregunta.texto}`);
        console.log(`  Respuesta: ${respuesta.slice(0, 200)}${respuesta.length > 200 ? '…' : ''}`);
        console.log(`  Duración : ${duracion_ms}ms`);
        console.log(`  Patrón OK: ${cumple ? '✅' : '⚠️ NO COINCIDE'}`);

        expect(respuesta.length).toBeGreaterThan(10);
      });
    }
  }
});
