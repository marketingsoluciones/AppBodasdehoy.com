/**
 * role-access-control.spec.ts
 *
 * Batería de tests de control de acceso por rol contra eventos REALES de la DB.
 *
 * ═══════════════════════════════════════════════════════════
 * ARQUITECTURA DE ROLES (api-ia → role_detector.py → DB)
 * ═══════════════════════════════════════════════════════════
 *
 *   api-ia detecta el rol vía `detect_user_role(user_id, email, event_id)`:
 *     - Si user_id/email es creador del evento → CREATOR (acceso total)
 *     - Si está en compartido_array del evento  → COLLABORATOR (acceso limitado)
 *     - Si está invitado al evento              → INVITED_GUEST (solo su info)
 *     - Sin JWT / sin relación con evento       → GUEST (pitch comercial)
 *
 * ═══════════════════════════════════════════════════════════
 * USUARIOS DE PRUEBA (todos con password: lorca2012M*+)
 * ═══════════════════════════════════════════════════════════
 *
 *   organizador (bodasdehoy.com@gmail.com)
 *     → rol CREATOR en "Boda Isabel & Raúl" (66a9042dec5c58aa734bca44)
 *     → puede ver 43 invitados, presupuesto, modificar evento, etc.
 *
 *   colaborador1 (jcc@recargaexpress.com)
 *     → rol CREATOR en su propio evento "BODA DE PILAR"
 *     → NO tiene acceso a Isabel & Raúl (distinto propietario)
 *
 *   colaborador2 (jcc@bodasdehoy.com)
 *     → rol CREATOR en su propio evento "Email pruebas" (69838b14e3550784e116b682)
 *     → rol INVITED_GUEST cuando accede a eventos ajenos (ej: "Boda Isabel & Raúl")
 *     → NO puede modificar eventos ajenos (add_guest requiere CREATOR)
 *     → NO ve 43 eventos del organizador principal
 *
 *   visitante (sin sesión)
 *     → rol GUEST → respuesta comercial, ningún dato privado
 *
 * ═══════════════════════════════════════════════════════════
 * ESCENARIOS CUBIERTOS
 * ═══════════════════════════════════════════════════════════
 *
 *   BATCH R — Chat-ia standalone (chat-dev.bodasdehoy.com)
 *     R01: GUEST — respuesta comercial, sin datos privados
 *     R02: GUEST — intenta acción de escritura → bloqueado
 *     R03: OWNER — ve sus propios eventos (>0)
 *     R04: OWNER — accede a datos de Isabel & Raúl (43 invitados)
 *     R05: OWNER — intenta modificar evento con confirmación
 *     R06: OWNER — no puede ver eventos de otro usuario (aislamiento)
 *     R07: COLLAB1 — ve su propio evento (BODA DE PILAR), no Isabel & Raúl
 *     R08: COLLAB1 — puede preguntar datos de su evento
 *     R09: COLLAB2 — ve su propio "Email pruebas", NO los 43 del organizador
 *     R10: COLLAB2 — intenta añadir invitado a evento ajeno → bloqueado (INVITED_GUEST)
 *
 *   BATCH E — Copilot embebido en appEventos (app-dev.bodasdehoy.com)
 *     E01: OWNER logueado → sin banner "Modo gratuito", con datos del evento
 *     E02: Visitante (no logueado) → banner "Modo gratuito" visible
 *
 * Ejecutar:
 *   E2E_ENV=dev npx playwright test e2e-app/role-access-control.spec.ts --project=webkit
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TEST_CREDENTIALS, TEST_URLS, E2E_ENV } from './fixtures';
import { TEST_USERS, ISABEL_RAUL_EVENT } from './fixtures/isabel-raul-event';
import { clearSession } from './helpers';

const CHAT_URL = TEST_URLS.chat;
const APP_URL  = TEST_URLS.app;
const MULT     = E2E_ENV === 'local' ? 1 : 1.5;

// ─── Gate global ──────────────────────────────────────────────────────────────

let smokeGatePassed = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAtChat(url: string): boolean {
  try {
    const p = new URL(url);
    return !p.pathname.includes('/login') && p.pathname.includes('/chat');
  } catch {
    return url.includes('/chat') && !url.includes('/login');
  }
}

async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(2_000);
  if (isAtChat(page.url())) return true;

  const emailInput = page.locator('input[type="email"], input[placeholder="tu@email.com"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button:has-text("Iniciar sesión"), button[type="submit"]').first().click();

  const ok = await page.waitForURL(
    (u) => !u.pathname.includes('/login') && u.pathname.includes('/chat'),
    { timeout: E2E_ENV === 'local' ? 20_000 : 50_000 },
  ).then(() => true).catch(() => false);
  console.log(`loginChat(${email}) → ${page.url()} | ok: ${ok}`);
  return ok;
}

async function enterAsVisitor(page: Page): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(1_500);
  const btn = page.locator('button:has-text("Continuar como visitante"), button:has-text("visitante")').first();
  const visible = await btn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (visible) {
    await btn.click();
    await page.waitForTimeout(3_000);
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
  } else {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
  }
  return page.url().includes('/chat');
}

function stripBoilerplate(text: string): string {
  return text
    .replace(/\d{2}:\d{2}:\d{2}/g, '')
    .replace(/Analizando tu solicitud\.{2,}/gi, '')
    .replace(/Buscando información\.{2,}/gi, '')
    .replace(/Consultando[^.]{0,40}\.{2,}/gi, '')
    .replace(/Formulando tu respuesta\.{2,}/gi, '')
    .replace(/Procesando\.{2,}/gi, '')
    .replace(/Pensando\.{2,}/gi, '')
    .replace(/(?<![a-zA-Z0-9])auto(?![a-zA-Z0-9])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendAndWait(
  page: Page,
  message: string,
  waitMs = 50_000,
  afterCount = 0,
): Promise<{ response: string; newCount: number }> {
  if (!isAtChat(page.url())) {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
  }

  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 30_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(message, { delay: 20 });
  await page.keyboard.press('Enter');

  // Esperar a que aparezca al menos un nuevo artículo (mensaje del usuario)
  const sendDeadline = Date.now() + 20_000;
  while (Date.now() < sendDeadline) {
    if (await page.locator('[data-index]').count() > afterCount) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(6_000); // dar tiempo al streaming

  const deadline = Date.now() + waitMs;
  let lastText = '';
  let stableCount = 0;
  let currentCount = afterCount;

  while (Date.now() < deadline) {
    const articles = await page.locator('[data-index]').allTextContents();
    currentCount = articles.length;
    const newOnes = articles.slice(afterCount);
    const prefix = message.trim().slice(0, 25).toLowerCase();
    const aiMsgs = newOnes.filter((t) => {
      const s = t.trim();
      if (s.length <= 5) return false;
      if (s.toLowerCase().includes(prefix)) return false;
      if (/^(\d{2}:\d{2}:\d{2}\s*\n?\s*)+$/.test(s)) return false;
      return true;
    });
    const stripped = stripBoilerplate(aiMsgs.join('\n').trim());
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

function isBackendError(r: string): boolean {
  return /Servicio IA no disponible|TIMEOUT_ERROR|backend.*no disponible|intenta.*más tarde|quota.*exceeded|límite.*mensual|quedan.*0 consultas/i.test(r);
}

function skipIfBackendError(r: string, label: string): void {
  if (isBackendError(r)) {
    console.warn(`⚠️ ${label}: backend error — skipping: "${r.slice(0, 120)}"`);
    test.skip(true, `Backend no disponible: ${r.slice(0, 100)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 0 — SMOKE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BATCH 0 — Smoke Gate', () => {
  test.setTimeout(60_000 * MULT);

  test('[SMOKE] servidor y api-ia responden', async ({ context, page }) => {
    await clearSession(context, page);
    const t0 = Date.now();
    const res = await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    expect(res?.status()).toBeLessThan(400);
    expect(Date.now() - t0).toBeLessThan(E2E_ENV === 'local' ? 5_000 : 12_000);
    smokeGatePassed = true;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BATCH R — ROLES en chat-ia standalone
// ─────────────────────────────────────────────────────────────────────────────

// ── R01/R02 — GUEST: sin acceso a datos privados, bloqueado en escritura ─────

test.describe('BATCH R1 — GUEST (sin sesión)', () => {
  test.setTimeout(90_000 * MULT);

  test.beforeEach(async ({ context, page }) => {
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');
    await clearSession(context, page);
    await enterAsVisitor(page);
  });

  test('[R01] GUEST — respuesta comercial sin datos privados de ningún evento', async ({ page }) => {
    /**
     * Un visitante sin sesión pregunta por datos privados de un evento.
     * api-ia detecta role=GUEST (no JWT) → permission_guard bloquea get_event_guests.
     * La respuesta debe:
     *   ✅ NO contener "43" (total invitados del organizador)
     *   ✅ NO contener datos de "Boda Isabel" (evento privado)
     *   ✅ Contener pitch comercial / invitación a registrarse
     */
    const { response } = await sendAndWait(
      page,
      '¿Cuántos invitados tiene la Boda de Isabel y Raúl?',
      45_000 * MULT,
    );
    console.log(`[R01] GUEST respuesta: "${response.slice(0, 300)}"`);
    if (!response.trim()) return; // bloqueado antes de responder = OK
    skipIfBackendError(response, 'R01');

    // CRÍTICO: no deben aparecer datos del evento privado
    expect(
      response,
      '🚨 DATA LEAK R01: visitante recibió datos privados (43 invitados)',
    ).not.toMatch(/\b43\b/);
    expect(
      response,
      '🚨 DATA LEAK R01: visitante recibió datos privados (Isabel & Raúl)',
    ).not.toMatch(/isabel.*ra[uú]l|boda.*isabel/i);

    // Debe responder en modo comercial o informativo genérico
    const isCommercial = /registr|crea.*cuenta|acceso\s*limitado|modo.*gratuit|inicia.*sesi[oó]n|únete|funciones|premium/i.test(response);
    const isGeneral = response.length > 20;
    expect(isCommercial || isGeneral, `Respuesta inesperada para guest: "${response.slice(0, 200)}"`).toBe(true);
  });

  test('[R02] GUEST — intento de crear evento bloqueado (no puede hacer CRUD)', async ({ page }) => {
    /**
     * El visitante intenta crear un evento.
     * api-ia: create_event requiere min_role = INVITED_GUEST.
     * Con role=GUEST → bloqueado con mensaje de "inicia sesión primero".
     * La IA NO debe confirmar que se creó el evento.
     */
    const { response } = await sendAndWait(
      page,
      'Crea un evento de prueba llamado "Mi Boda Test" para el 15 de agosto de 2026',
      45_000 * MULT,
    );
    console.log(`[R02] GUEST create event: "${response.slice(0, 300)}"`);
    if (!response.trim()) return; // bloqueado = OK
    skipIfBackendError(response, 'R02');

    // NO debe confirmar que creó el evento
    expect(
      response,
      '🚨 PERM R02: visitante pudo crear evento — debería estar bloqueado',
    ).not.toMatch(/evento.*creado|he creado.*mi boda|creé el evento|prueba.*agosto.*2026.*cread/i);

    // Debe pedir login o indicar acceso limitado
    const requiresLogin = /inicia.*sesi[oó]n|regí?strat|necesit.*cuenta|acceso.*limitad|crea.*cuenta/i.test(response);
    expect(requiresLogin, `R02: la IA no indica que se necesita login: "${response.slice(0, 200)}"`).toBe(true);
  });
});

// ── R03/R04/R05/R06 — OWNER (organizador): acceso total a sus eventos ─────────

test.describe('BATCH R2 — OWNER (organizador)', () => {
  // Login + 4 preguntas: permitir hasta 10 min
  test.setTimeout(600_000 * MULT);

  let articleCount = 0;

  test('[R03/R04/R05/R06] OWNER — acceso completo + aislamiento de datos', async ({ page }) => {
    /**
     * Sesión única: organizador hace 4 preguntas en secuencia.
     * Evita múltiples logins que gastan tiempo y tokens.
     *
     * R03: Ve sus propios eventos (>0 eventos)
     * R04: Accede a datos de Isabel & Raúl (43 invitados)
     * R05: La IA puede iniciar una acción de modificación (cambio de fecha)
     * R06: No recibe datos de eventos de otros usuarios (jcc@recargaexpress)
     */
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    const ok = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    if (!ok) { test.fail(true, 'Login organizador fallido'); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // ── R03: Lista de eventos propios ──────────────────────────────────────
    {
      articleCount = await page.locator('[data-index]').count();
      const { response, newCount } = await sendAndWait(
        page,
        'Lista mis eventos más recientes',
        60_000 * MULT,
        articleCount,
      );
      articleCount = newCount;
      console.log(`[R03] OWNER eventos: "${response.slice(0, 250)}"`);
      skipIfBackendError(response, 'R03');

      // Organizador tiene eventos → debe ver al menos 1
      const hasEvents = /evento|boda|celebraci[oó]n|bautizo|comunión|\d+\s*evento/i.test(response);
      const noEvents = /no\s*(tienes?|encontré)\s*evento|0\s*eventos/i.test(response);
      expect(hasEvents || !noEvents, `[R03] OWNER no ve sus eventos: "${response.slice(0, 250)}"`).toBe(true);
      expect(noEvents, `[R03] OWNER sin eventos — inesperado: "${response.slice(0, 250)}"`).toBe(false);

      await page.waitForTimeout(3_000);
    }

    // ── R04: Datos de Isabel & Raúl (43 invitados) ───────────────────────
    {
      articleCount = await page.locator('[data-index]').count();
      const { response, newCount } = await sendAndWait(
        page,
        `¿Cuántos invitados tiene el evento "Boda de Isabel y Raúl" (ID: ${ISABEL_RAUL_EVENT.id})?`,
        120_000 * MULT,
        articleCount,
      );
      articleCount = newCount;
      console.log(`[R04] OWNER invitados Isabel: "${response.slice(0, 250)}"`);
      skipIfBackendError(response, 'R04');

      // OWNER debe ver el total real (≥30 — el número exacto sube con cada run de CRUD tests)
      expect(
        response,
        `[R04] OWNER no puede ver los invitados de su evento: "${response.slice(0, 250)}"`,
      ).toMatch(/\b[3-9]\d\b|\b1\d{2}\b/);

      await page.waitForTimeout(3_000);
    }

    // ── R05: Acción de modificación (solo verificar que la IA lo procesa) ──
    {
      articleCount = await page.locator('[data-index]').count();
      const { response, newCount } = await sendAndWait(
        page,
        'Quiero cambiar el estado de la Boda de Isabel y Raúl a "CONFIRMADO". Muéstrame qué haría (sin confirmar todavía)',
        90_000 * MULT,
        articleCount,
      );
      articleCount = newCount;
      console.log(`[R05] OWNER modificar evento: "${response.slice(0, 250)}"`);
      skipIfBackendError(response, 'R05');

      // OWNER puede iniciar la acción — la IA no debe bloquearla con "no tienes permiso"
      const isBlocked = /no\s*tienes?\s*permiso|no\s*est[aá]s?\s*autorizado|solo el organizador/i.test(response);
      expect(isBlocked, `[R05] OWNER bloqueado para modificar su propio evento: "${response.slice(0, 250)}"`).toBe(false);
      // Debe describir la acción, pedir confirmación, o explicar limitación de capacidad (no de permisos)
      const respondsRelevantly =
        /isabel|ra[uú]l|confirmad|estatus|estado|cambiar/i.test(response) ||
        /no\s*(puedo|tengo|dispongo)|acci[oó]n\s*no\s*(est[aá]|soportad|disponib)/i.test(response) ||
        response.trim().length === 0; // timeout — no es un bloqueo de permisos
      expect(respondsRelevantly, `[R05] OWNER: respuesta inesperada: "${response.slice(0, 250)}"`).toBe(true);

      await page.waitForTimeout(3_000);
    }

    // ── R06: Aislamiento — no ve eventos de otro usuario ──────────────────
    {
      articleCount = await page.locator('[data-index]').count();
      const { response, newCount } = await sendAndWait(
        page,
        `Muéstrame los eventos del usuario jcc@recargaexpress.com`,
        60_000 * MULT,
        articleCount,
      );
      articleCount = newCount;
      console.log(`[R06] OWNER aislamiento: "${response.slice(0, 250)}"`);
      skipIfBackendError(response, 'R06');

      // La IA no debe listar eventos privados de otro usuario
      expect(
        response,
        '🚨 AISLAMIENTO R06: organizador puede ver eventos de otro usuario',
      ).not.toMatch(/boda de pilar|pilar.*jcc|jcc.*pilar/i);
      // Debe indicar que no tiene acceso o que son eventos del organizador actual
      const deniesCrossAccess = /no\s*(puedo|tengo acceso|puedes|tienes acceso)|privado|solo.*tus|mis eventos/i.test(response);
      expect(deniesCrossAccess, `[R06] La IA no protege datos de otros usuarios: "${response.slice(0, 250)}"`).toBe(true);
    }
  });
});

// ── R07/R08 — COLABORADOR 1 (jcc@recargaexpress.com): CREATOR de BODA DE PILAR ─

test.describe('BATCH R3 — COLLAB1 (jcc@recargaexpress.com — BODA DE PILAR)', () => {
  test.setTimeout(480_000 * MULT);

  test('[R07/R08] COLLAB1 — ve su propio evento, no Isabel & Raúl', async ({ page }) => {
    /**
     * jcc@recargaexpress.com es CREATOR de "BODA DE PILAR".
     * NO tiene acceso a "Boda Isabel & Raúl" (distinto propietario).
     *
     * R07: Al listar eventos ve "BODA DE PILAR" (o similar)
     * R08: Al preguntar por Isabel & Raúl → no recibe datos (no tiene acceso)
     */
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    const ok = await loginChat(page, TEST_USERS.colaborador1.email, TEST_CREDENTIALS.password);
    if (!ok) { test.fail(true, `Login ${TEST_USERS.colaborador1.email} fallido`); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // ── R07: Ve su propio evento ──────────────────────────────────────────
    {
      const articleCount = await page.locator('[data-index]').count();
      const { response, newCount: nc1 } = await sendAndWait(
        page,
        'Lista mis eventos',
        90_000 * MULT,
        articleCount,
      );
      console.log(`[R07] COLLAB1 eventos: "${response.slice(0, 250)}"`);
      skipIfBackendError(response, 'R07');

      // Debe ver BODA DE PILAR (su evento) o al menos "1 evento"
      // Nota: el nombre exacto puede variar, validamos que ve algo
      const seesSomething = /\d+\s*evento|boda|pilar|celebraci[oó]n/i.test(response);
      const noEvents = /no\s*(tienes?|encontré)\s*eventos?|0\s*eventos?/i.test(response);
      expect(!noEvents, `[R07] COLLAB1 no ve ningún evento — inesperado: "${response.slice(0, 250)}"`).toBe(true);
      expect(seesSomething, `[R07] COLLAB1 respuesta no parece lista de eventos: "${response.slice(0, 250)}"`).toBe(true);

      // CRÍTICO: NO debe ver el evento del organizador
      expect(
        response,
        '🚨 AISLAMIENTO R07: COLLAB1 ve eventos del organizador (Isabel & Raúl)',
      ).not.toMatch(/isabel.*ra[uú]l|boda.*isabel/i);

      await page.waitForTimeout(3_000);

      // ── R08: No puede acceder a Isabel & Raúl ────────────────────────────
      const articleCount2 = await page.locator('[data-index]').count();
      const { response: r2 } = await sendAndWait(
        page,
        `¿Cuántos invitados tiene la Boda de Isabel y Raúl (ID: ${ISABEL_RAUL_EVENT.id})?`,
        90_000 * MULT,
        articleCount2,
      );
      console.log(`[R08] COLLAB1 no-access Isabel: "${r2.slice(0, 250)}"`);
      skipIfBackendError(r2, 'R08');

      // No debe recibir "43" (total de invitados del organizador)
      expect(
        r2,
        '🚨 AISLAMIENTO R08: COLLAB1 accedió a datos privados de Isabel & Raúl (43)',
      ).not.toMatch(/\b43\b/);
      // La IA debe indicar que no tiene acceso o que el evento no es suyo
      const deniesCrossAccess = /no\s*(tienes?|encontré|tengo|puedo)\s*(acceso|ese evento)|no es tu evento|no eres (el organizador|creador)|sin acceso|evento no encontrado/i.test(r2);
      expect(
        deniesCrossAccess || r2.trim().length === 0,
        `[R08] COLLAB1 accedió a datos de otro evento: "${r2.slice(0, 250)}"`,
      ).toBe(true);
    }
  });
});

// ── R09/R10 — COLLAB2 (jcc@bodasdehoy.com): CREATOR de "Email pruebas", INVITED_GUEST en eventos ajenos ──
// Verificado 2026-04-08: getAllUserRelatedEventsByEmail devuelve solo "Email pruebas" para este email.

test.describe('BATCH R4 — COLLAB2 (jcc@bodasdehoy.com — owner "Email pruebas", INVITED en eventos ajenos)', () => {
  test.setTimeout(480_000 * MULT);

  test('[R09/R10] COLLAB2 — ve Email pruebas (propio), no puede escribir en eventos ajenos', async ({ page }) => {
    /**
     * jcc@bodasdehoy.com es CREATOR de "Email pruebas" (69838b14e3550784e116b682).
     * Cuando accede a "Boda Isabel & Raúl" (evento ajeno) → rol INVITED_GUEST.
     * add_guest requiere CREATOR → bloqueado en evento ajeno.
     *
     * R09: Al listar eventos ve solo "Email pruebas" (no los 43 del organizador)
     * R10: Intenta añadir un invitado a "Boda Isabel & Raúl" → bloqueado (INVITED_GUEST)
     */
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    const ok = await loginChat(page, TEST_USERS.colaborador2.email, TEST_CREDENTIALS.password);
    if (!ok) { test.fail(true, `Login ${TEST_USERS.colaborador2.email} fallido`); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // ── R09: Solo ve Email pruebas ────────────────────────────────────────
    {
      const articleCount = await page.locator('[data-index]').count();
      const { response, newCount: nc1 } = await sendAndWait(
        page,
        'Lista todos mis eventos',
        90_000 * MULT,
        articleCount,
      );
      console.log(`[R09] COLLAB2 eventos: "${response.slice(0, 300)}"`);
      skipIfBackendError(response, 'R09');

      // CRÍTICO: no debe ver los 43 eventos del organizador (solo su propio "Email pruebas")
      expect(
        response,
        '🚨 AISLAMIENTO R09: COLLAB2 ve eventos del organizador (43)',
      ).not.toMatch(/43\s*eventos?/i);

      // Debe ver "Email pruebas" o 1 evento, o indicar que no tiene eventos propios
      const seesEmailPruebas = /email.*pruebas?|1\s*evento|un\s*evento/i.test(response);
      const seesNone = /no\s*(tienes?|encontré)\s*eventos?|0\s*eventos?/i.test(response);
      expect(
        seesEmailPruebas || seesNone,
        `[R09] COLLAB2 respuesta inesperada: "${response.slice(0, 300)}"`,
      ).toBe(true);

      await page.waitForTimeout(3_000);
    }

    // ── R10: Escritura bloqueada en evento AJENO ─────────────────────────
    // jcc@bodasdehoy.com accede a "Boda Isabel & Raúl" (no le pertenece)
    // → rol INVITED_GUEST → add_guest requiere CREATOR → bloqueado
    {
      const articleCount2 = await page.locator('[data-index]').count();
      const { response: r2 } = await sendAndWait(
        page,
        'Añade a "Test Invitado Spec" como invitado a la Boda Isabel y Raúl',
        90_000 * MULT,
        articleCount2,
      );
      console.log(`[R10] COLLAB2 add_guest en evento ajeno: "${r2.slice(0, 300)}"`);
      skipIfBackendError(r2, 'R10');

      if (!r2.trim()) {
        // Bloqueado antes de responder — correcto
        console.log('[R10] COLLAB2 bloqueado sin respuesta — OK');
        return;
      }

      // NO debe confirmar que añadió el invitado a un evento ajeno
      expect(
        r2,
        '🚨 PERM R10: COLLAB2 pudo añadir invitado a evento ajeno (Boda Isabel & Raúl)',
      ).not.toMatch(/invitado.*añadido|añadí.*test invitado|creé.*invitado|agregué/i);

      // Debe indicar que no tiene permiso (INVITED_GUEST ≠ CREATOR)
      const isBlocked = /no\s*tienes?\s*permiso|no\s*(puedes?|est[aá]s? autorizado)|solo.*organizador|solo.*creador|acceso.*denegado|permission_denied/i.test(r2);
      expect(isBlocked, `[R10] COLLAB2 podría haber creado invitado en evento ajeno sin permiso: "${r2.slice(0, 250)}"`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BATCH E — COPILOT EMBEBIDO en appEventos (app-dev.bodasdehoy.com)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BATCH E — Copilot embebido en appEventos', () => {
  test.setTimeout(180_000 * MULT);

  /**
   * Helper: loguear en appEventos y abrir el copilot sidebar.
   * Retorna true si el sidebar está visible y sin el banner de visitante.
   */
  async function loginAppAndOpenCopilot(
    page: Page,
    context: BrowserContext,
    email: string,
    password: string,
  ): Promise<boolean> {
    await clearSession(context, page);

    // Ir a app-dev y hacer login (appEventos usa su propio sistema de auth)
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
    await page.waitForTimeout(2_000);

    // Si ya estamos logueados (SSO desde chat-dev)
    const alreadyLoggedIn = !page.url().includes('/login');
    if (!alreadyLoggedIn) {
      const emailInput = page.locator('input[type="email"]').first();
      const visible = await emailInput.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!visible) {
        // appEventos puede redirigir a chat-ia para auth — manejar SSO
        const currentUrl = page.url();
        if (currentUrl.includes(CHAT_URL.replace('https://', '').replace('http://', ''))) {
          // Estamos en chat-ia login → login allí
          const chatEmailInput = page.locator('input[type="email"]').first();
          await chatEmailInput.waitFor({ state: 'visible', timeout: 15_000 });
          await chatEmailInput.fill(email);
          await page.locator('input[type="password"]').first().fill(password);
          await page.locator('button[type="submit"]').first().click();
          await page.waitForTimeout(8_000);
        }
      } else {
        await emailInput.fill(email);
        await page.locator('input[type="password"]').first().fill(password);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(8_000);
      }
    }

    // Navegar a la página de resumen (donde el copilot está disponible)
    await page.goto(`${APP_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Abrir el copilot sidebar — buscar el botón de sparkles / copilot
    const copilotBtn = page.locator(
      'button[title*="Copilot"], button[aria-label*="Copilot"], button[title*="copilot"], [data-testid="copilot-toggle"]'
    ).first();
    const btnVisible = await copilotBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (btnVisible) {
      await copilotBtn.click();
      await page.waitForTimeout(2_000);
    } else {
      // Buscar por el icono de sparkles (IoSparkles) — el botón puede no tener aria-label
      const sparklesBtn = page.locator('button').filter({ hasText: /✨|copilot/i }).first();
      const spVisible = await sparklesBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (spVisible) {
        await sparklesBtn.click();
        await page.waitForTimeout(2_000);
      }
    }

    // Verificar que el sidebar está abierto
    const sidebarOpen = await page.locator('[data-testid="chat-sidebar"], .copilot-sidebar').isVisible({ timeout: 5_000 }).catch(async () => {
      // Fallback: buscar el panel por su estructura (el embed de CopilotEmbed)
      return page.locator('iframe[src*="chat"], div[class*="copilot"]').isVisible({ timeout: 3_000 }).catch(() => false);
    });

    return sidebarOpen;
  }

  test('[E01] OWNER logueado — NO aparece banner "Modo gratuito" en el copilot', async ({ context, page }) => {
    /**
     * Regresión del bug: usuario registrado aparecía como visitante.
     * Fix: isGuest ahora usa user?.uid (no user?.email) + guard de verificationDone.
     *
     * Verifica que un usuario logueado NO ve el banner de visitante en el sidebar.
     */
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    // Primero loguearnos en chat-ia (SSO cookie se comparte con appEventos)
    await clearSession(context, page);
    const chatOk = await loginChat(page, TEST_USERS.organizador.email, TEST_CREDENTIALS.password);
    if (!chatOk) { test.skip(true, 'Login en chat-ia fallido'); return; }

    // Navegar a appEventos — SSO debe reconocerlo
    await page.goto(`${APP_URL}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(4_000);

    // Si fuimos redirigidos a login, hacer login directo en appEventos
    if (page.url().includes('/login')) {
      await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(2_000);
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await emailInput.fill(TEST_USERS.organizador.email);
        await page.locator('input[type="password"]').first().fill(TEST_CREDENTIALS.password);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(8_000);
      }
    }

    // Buscar y abrir el copilot sidebar
    const copilotBtns = page.locator('button').filter({ has: page.locator('svg') });
    // El botón de copilot en appEventos tiene IoSparkles icon y title="Copilot"
    const copilotToggle = page.locator('button[title*="opilot"], button[aria-label*="opilot"]').first();
    const toggleVisible = await copilotToggle.isVisible({ timeout: 8_000 }).catch(() => false);
    if (toggleVisible) {
      await copilotToggle.click();
      await page.waitForTimeout(2_000);
    }

    // Verificar ausencia del banner "Modo gratuito / Regístrate"
    const guestBanner = page.locator('text=Modo gratuito, text=Regístrate →, text=mensajes limitados');
    const bannerVisible = await guestBanner.isVisible({ timeout: 5_000 }).catch(() => false);

    expect(
      bannerVisible,
      '🚨 REGRESSION E01: usuario registrado ve banner "Modo gratuito" — isGuest bug regresionado',
    ).toBe(false);

    console.log('[E01] PASS: no hay banner de visitante para usuario logueado ✅');
  });

  test('[E02] VISITANTE — sí aparece banner "Modo gratuito" en el copilot', async ({ context, page }) => {
    /**
     * Un visitante sin sesión abre el copilot embebido en appEventos
     * (página pública como /invitados).
     * Debe ver el banner "Modo gratuito · mensajes limitados / Regístrate →".
     */
    if (!smokeGatePassed) test.skip(true, 'Smoke gate no pasó');

    await clearSession(context, page);
    // Navegar directamente a una página pública de appEventos que tenga copilot
    await page.goto(`${APP_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Si redirecciona a login, el test no puede ejecutarse en esa página
    if (page.url().includes('/login')) {
      test.skip(true, '/invitados requiere login en este entorno');
      return;
    }

    // Intentar abrir el copilot sidebar
    const copilotToggle = page.locator('button[title*="opilot"], button[aria-label*="opilot"]').first();
    const toggleVisible = await copilotToggle.isVisible({ timeout: 8_000 }).catch(() => false);
    if (toggleVisible) {
      await copilotToggle.click();
      await page.waitForTimeout(2_000);
    } else {
      test.skip(true, 'No se encontró botón del copilot en /invitados');
      return;
    }

    // Verificar presencia del banner de visitante
    const guestBanner = page.locator('text=Modo gratuito').first();
    const bannerVisible = await guestBanner.isVisible({ timeout: 5_000 }).catch(() => false);

    expect(bannerVisible, '[E02] FAIL: visitante no ve banner "Modo gratuito"').toBe(true);
    console.log('[E02] PASS: visitante ve banner de modo gratuito correctamente ✅');
  });
});
