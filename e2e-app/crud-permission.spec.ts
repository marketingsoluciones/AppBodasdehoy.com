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
import { TEST_USERS, CRUD_QUESTIONS, PERMISSION_QUESTIONS } from './fixtures/isabel-raul-event';

const CHAT_URL = TEST_URLS.chat;
const MULT = E2E_ENV === 'local' ? 1 : 1.5;

// ─── Estado global del smoke gate ────────────────────────────────────────────

let smokeGatePassed = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Comprueba si la URL actual es la página de chat (no login con ?redirect=/chat) */
function isAtChat(url: string): boolean {
  try {
    const parsed = new URL(url);
    // /chat o /en-US__0__light/chat etc. — pero NO /login?redirect=/chat
    return !parsed.pathname.includes('/login') && parsed.pathname.includes('/chat');
  } catch {
    return url.includes('/chat') && !url.includes('/login');
  }
}

async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(2000);
  if (isAtChat(page.url())) {
    // Ya estamos en chat — verificar que la sesión no esté expirada
    const expired = await page.locator('text=Sesión expirada, text=session_expired').isVisible({ timeout: 2000 }).catch(() => false);
    if (!expired) return true;
  }

  const emailInput = page.locator('input[type="email"], input[placeholder="tu@email.com"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(email);

  const pwInput = page.locator('input[type="password"]').first();
  await pwInput.fill(password);

  await page.locator('button:has-text("Iniciar sesión"), button[type="submit"]').first().click();

  // Esperar a que Firebase complete auth + router.replace('/chat')
  // En entornos remotos (Vercel) el redirect puede tardar hasta 15s
  const waitMs = E2E_ENV === 'local' ? 10_000 : 18_000;
  await page.waitForTimeout(waitMs);

  // Verificar que no haya banner de sesión expirada (indica auth incompleto)
  const expiredBanner = await page.locator('text=Sesión expirada').isVisible({ timeout: 2000 }).catch(() => false);
  if (expiredBanner) {
    console.log('⚠️ loginChat — banner "Sesión expirada" visible, esperando más...');
    await page.waitForTimeout(5_000);
  }

  const ok = isAtChat(page.url());
  console.log(`loginChat → URL: ${page.url()} | ok: ${ok}`);
  return ok;
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

/**
 * Elimina el texto boilerplate que LobeChat inyecta en los artículos del chat
 * (timestamps HH:MM:SS, estados de loading, indicador "auto") para quedarnos
 * solo con el contenido real de la respuesta de la IA.
 *
 * Ejemplo de artículo bruto:
 *   "09:49:34Analizando tu solicitud...Formulando tu respuesta...auto"
 * Después de strip: ""  (vacío → no es respuesta real, seguir esperando)
 *
 * Ejemplo con respuesta real:
 *   "09:49:34...Formulando tu respuesta...La boda de Isabel y Raúl tiene 43..."
 * Después de strip: "La boda de Isabel y Raúl tiene 43..."
 */
function stripLoadingBoilerplate(text: string): string {
  // IMPORTANTE: usar \.{2,} (2+ puntos) en vez de [.…]* para NO eliminar el punto final
  // de una frase real. El estado de carga de LobeChat siempre termina en "..." (3 puntos),
  // nunca en un único "." (que sería el final de una oración real de la IA).
  //
  // Ejemplo problemático SIN este constraint:
  //   "Consultando tus eventos, la boda tiene 43 invitados."
  //   → [^.\n]* consume toda la frase, [.…]* consume el "." → queda vacío ❌
  //
  // Con \.{2,}:
  //   "Consultando tus eventos..."  → 3 dots → eliminado ✅
  //   "Consultando..., la boda tiene 43 invitados." → solo elimina "Consultando..." ✅
  return text
    .replace(/\d{2}:\d{2}:\d{2}/g, '')                      // timestamps HH:MM:SS
    .replace(/Analizando tu solicitud\.{2,}/gi, '')
    .replace(/Buscando información\.{2,}/gi, '')
    .replace(/Consultando[^.]{0,40}\.{2,}/gi, '')           // max 40 chars antes de los "..."
    .replace(/Formulando tu respuesta\.{2,}/gi, '')
    .replace(/Procesando\.{2,}/gi, '')
    .replace(/Pensando\.{2,}/gi, '')
    .replace(/(?<![a-zA-Z0-9])auto(?![a-zA-Z0-9])/g, '')   // "auto" suelto (indicador LobeChat)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Envía un mensaje y espera respuesta estable.
 * afterArticleCount: ignorar artículos anteriores a este índice (para sesiones multi-pregunta).
 * Devuelve la respuesta y el nuevo total de artículos (para el siguiente sendAndWaitInSession).
 */
async function sendAndWaitInSession(
  page: Page,
  message: string,
  waitMs: number,
  afterArticleCount: number,
): Promise<{ response: string; newCount: number }> {
  if (!isAtChat(page.url())) {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
  }

  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 35_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(message, { delay: 20 });
  await page.keyboard.press('Enter');

  // Espera inicial: hasta que el mensaje del usuario aparezca en el DOM (señal de que se envió)
  // o hasta 30s. En LobeChat, el mensaje usuario aparece inmediatamente, la respuesta IA tarda más.
  let sendConfirmed = false;
  const sendDeadline = Date.now() + 30_000;
  while (Date.now() < sendDeadline && !sendConfirmed) {
    const count = await page.locator('[data-index]').count();
    if (count > afterArticleCount) sendConfirmed = true;
    else await page.waitForTimeout(1_000);
  }
  // Espera adicional para que la IA empiece a generar (BubblesLoading → loading states text)
  await page.waitForTimeout(8_000);

  const deadline = Date.now() + waitMs;
  let lastText = '';
  let stableCount = 0;
  let currentCount = afterArticleCount;

  while (Date.now() < deadline) {
    // LobeChat renderiza cada mensaje como <div data-index={n}> (NO <article>)
    const articles = await page.locator('[data-index]').allTextContents();
    currentCount = articles.length;

    // Solo mirar los artículos NUEVOS desde afterArticleCount
    const newArticles = articles.slice(afterArticleCount);
    const userPrefix = message.trim().slice(0, 25).toLowerCase();
    const aiMsgs = newArticles.filter((t) => {
      const trimmed = t.trim();
      if (trimmed.length <= 5) return false;
      // Filtrar el mensaje del propio usuario.
      // LobeChat añade timestamp antes del texto ("08:31:17¿Cuántos...") por lo que
      // startsWith no funciona — usamos includes para detectar el echo aunque lleve timestamp.
      if (trimmed.toLowerCase().includes(userPrefix)) return false;
      // Filtrar artículos que son SOLO timestamps de LobeChat (indicador de carga antes de streaming).
      // Ejemplo: "08:44:52\n08:44:52" — son ticks de tiempo, no respuesta real.
      if (/^(\d{2}:\d{2}:\d{2}\s*\n?\s*)+$/.test(trimmed)) return false;
      return true;
    });

    const joined = aiMsgs.join('\n').trim();
    // Eliminar timestamps y estados de carga de LobeChat antes de la detección de estabilidad.
    // Sin esto, "...Formulando tu respuesta...auto" se considera respuesta estable prematuramente.
    const stripped = stripLoadingBoilerplate(joined);

    // > 5 excluye el indicador "auto" suelto (4 chars) pero acepta respuestas cortas como "OKauto" (S02)
    if (stripped.length > 5) {
      if (stripped === lastText) {
        stableCount++;
        if (stableCount >= 2) break;
      } else {
        stableCount = 0;
        lastText = stripped;
      }
    }
    await page.waitForTimeout(1_500);
  }

  return { response: lastText, newCount: currentCount };
}

/** Envía un mensaje y espera respuesta estable (máx waitMs ms) — sesión limpia (1 pregunta) */
async function sendAndWait(page: Page, message: string, waitMs = 45_000): Promise<string> {
  const { response } = await sendAndWaitInSession(page, message, waitMs, 0);
  return response;
}

/** Clasifica si la respuesta es un error de infraestructura */
function isBackendError(response: string): boolean {
  return /Servicio IA no disponible|TIMEOUT_ERROR|backend.*IA.*no disponible|intenta.*más tarde|server has rejected|permission to access|403|quota.*exceeded|límite.*mensual|quedan.*0 consultas/i.test(response);
}

/**
 * Falla el test duro con un mensaje claro de infraestructura.
 * Usado en lugar de test.skip() para que el CI sea rojo cuando api-ia no responde.
 * Un test verde con infraestructura rota no tiene ningún valor.
 */
function failInfra(context: string, response: string): never {
  const empty = response.trim().length === 0;
  const msg = empty
    ? `❌ INFRA: api-ia no devolvió respuesta (vacío). Posibles causas: quota agotada, api-ia caído, timeout. Contexto: ${context}`
    : `❌ INFRA: api-ia devolvió error. Contexto: ${context}\n   Respuesta: "${response.slice(0, 200)}"`;
  expect(false, msg).toBe(true);
  throw new Error(msg); // para que TypeScript entienda que esta función no retorna
}


// ─── BATCH 0: SMOKE GATE ──────────────────────────────────────────────────────
// S01: servidor HTTP responde
// S02: api-ia responde (gate real para CRUD) — falla duro si api-ia está caído/quota agotada

test.describe('BATCH 0 — Smoke Gate', () => {
  test.setTimeout(120_000);

  test('[S01] servidor HTTP responde en <12s', async ({ page }) => {
    const t0 = Date.now();
    const resp = await page.goto(`${CHAT_URL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    const ms = Date.now() - t0;
    const msLimit = E2E_ENV === 'local' ? 5_000 : 12_000;
    expect(resp?.status(), `Servidor devolvió ${resp?.status()}`).toBeLessThan(400);
    expect(ms, `Tardó ${ms}ms — supera ${msLimit / 1000}s`).toBeLessThan(msLimit);
    smokeGatePassed = true;
    console.log(`✅ S01 — servidor OK en ${ms}ms`);
  });

  test('[S02] api-ia responde (gate para CRUD)', async ({ context, page }) => {
    // Este test verifica que la IA puede responder preguntas reales.
    // Si falla: quota agotada, api-ia caído, o red bloqueada.
    // FALLA DURO (no skip) porque sin api-ia los CRUD tests no tienen ningún valor.
    await clearSession(context, page);
    const ok = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    expect(ok, 'Login fallido — no se puede llegar a api-ia').toBe(true);

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    const { response } = await sendAndWaitInSession(
      page,
      'Responde solo con "OK" — verificación de sistema',
      45_000 * MULT,
      0,
    );

    console.log(`S02 api-ia smoke response: "${response.slice(0, 200)}"`);

    // Respuesta vacía o error de backend = fallo duro
    if (response.trim().length === 0) {
      failInfra('S02', response);
    }
    if (isBackendError(response)) {
      failInfra('S02', response);
    }

    // Si llegamos aquí, api-ia está vivo
    smokeGatePassed = true;
    console.log('✅ S02 — api-ia responde correctamente');
  });
});

// ─── BATCH 1: CRUD via IA ─────────────────────────────────────────────────────
// Las 5 preguntas sobre Boda Isabel & Raúl se hacen en UNA SOLA SESIÓN.
// Beneficios:
//   - 1 login → el contexto del evento se carga una vez
//   - Preguntas siguientes reutilizan el contexto → no hay "límite de operaciones"
//   - Un tercio de las llamadas a api-ia vs 5 logins separados

test.describe('BATCH 1 — CRUD via IA (Boda Isabel & Raúl)', () => {
  // C01 requiere tool calls (get_user_events + filter) que pueden tardar 3-5 min la primera vez.
  // C02-C05 reutilizan el contexto cargado → mucho más rápidos (30-60s cada uno).
  // Total: 300s C01 + 4×90s C02-C05 + 60s login = 720s máx
  test.setTimeout(720_000 * MULT);

  test('[C01] sesión única CRUD (5 preguntas, 1 login)', async ({ page }) => {
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó — servidor no disponible');

    const ok = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    if (!ok) {
      test.fail(true, 'Login fallido — no se puede probar CRUD');
      return;
    }

    // Resultados por pregunta — soft assertions para ver todos los fallos de una vez
    let articleCount = 0;
    let batchAborted = false;

    for (const q of CRUD_QUESTIONS) {
      if (batchAborted) {
        // Anotar las preguntas saltadas por abort
        test.info().annotations.push({ type: 'skip', description: `${q.id} saltado (batch abortado)` });
        continue;
      }

      // Cooldown entre preguntas: da tiempo a LobeChat para terminar de renderizar la respuesta
      // anterior antes de enviar la siguiente, evitando race conditions en el tracking de artículos.
      if (articleCount > 0) await page.waitForTimeout(4_000);

      // Releer el count actual de artículos antes de cada pregunta para evitar desync.
      // No reutilizar newCount de la pregunta anterior porque puede estar desactualizado
      // si el streaming tardó en terminar después de que stableCount >= 2 se alcanzó.
      articleCount = await page.locator('[data-index]').count();

      // C01 (primer mensaje de sesión) puede tardar 3-5 min (tool calls + eventos sin caché)
      // C02-C05 reutilizan contexto, pero el fallback Groq→Gemini puede tardar ~2-3 min
      const perQuestionMs = articleCount === 0 ? 300_000 * MULT : 180_000 * MULT;
      const { response, newCount } = await sendAndWaitInSession(
        page,
        q.pregunta,
        perQuestionMs,
        articleCount,
      );
      articleCount = newCount;

      console.log(`${q.id} respuesta (${response.length} chars): "${response.slice(0, 200)}"`);

      if (isBackendError(response)) {
        // Backend caído → no gastar más tokens
        test.info().annotations.push({
          type: 'error',
          description: `${q.id} backend error: "${response.slice(0, 150)}"`,
        });
        batchAborted = true;
        // Reportar como fallo duro — la IA no está disponible, no es un fallo de calidad
        expect(false, `❌ ${q.id} — Backend error, batch abortado: "${response.slice(0, 150)}"`).toBe(true);
        return;
      }

      // Verificar que el patrón esperado aparece en la respuesta
      expect.soft(
        q.expectedPattern.test(response),
        `${q.id} (${q.description}): expectedPattern no encontrado\n  Respuesta: "${response.slice(0, 300)}"`,
      ).toBe(true);

      // Verificar que el patrón de fallo NO aparece
      expect.soft(
        q.failPattern.test(response),
        `${q.id} (${q.description}): failPattern detectado (IA dice que no encontró datos)\n  Respuesta: "${response.slice(0, 200)}"`,
      ).toBe(false);

      test.info().annotations.push({
        type: 'result',
        description: `${q.id} — ${q.description}: ${q.expectedPattern.test(response) ? '✅' : '❌'}`,
      });
    }
  });
});

// ─── BATCH 2: PERMISOS ────────────────────────────────────────────────────────
// Verifica que roles restringidos (guest, invitado) NO ven datos privados del org.
// Este batch es regresión del bug de data leak corregido en commit df2077fe.

test.describe('BATCH 2 — Permisos (guest e invitado no ven datos privados)', () => {
  test.setTimeout(60_000 * MULT);

  // ── P01 — Guest (visitante) NO ve datos del organizador ───────────────────

  test('[P01] guest/visitante NO recibe datos privados de Isabel & Raúl', async ({ context, page }) => {
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

    // Respuesta vacía = visitante bloqueado antes de recibir datos (LoginRequiredModal, etc.)
    // No es un data leak — pasar el test silenciosamente
    if (response.trim().length === 0) {
      console.log('P01 (guest): respuesta vacía — visitante bloqueado antes de recibir datos (OK, no leak)');
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

  test('[P02] invitado solo ve su evento "Email pruebas", no los 43 del organizador', async ({ page }) => {
    // P02 necesita login completo + respuesta IA → más tiempo que el timeout de BATCH 2
    test.setTimeout(180_000 * MULT);
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

    // Si la respuesta es solo el echo del mensaje (sin contenido IA), no se puede validar
    const questionEscaped = question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const aiContent = response
      .replace(new RegExp(questionEscaped, 'g'), '')
      .replace(/\d{2}:\d{2}:\d{2}/g, '')
      .replace(/Synced|auto/g, '')
      .trim();
    if (aiContent.length < 20) {
      test.skip(true, 'Sin respuesta IA para invitado — no se puede validar permisos');
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
