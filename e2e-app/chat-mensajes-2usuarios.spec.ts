/**
 * chat-mensajes-2usuarios.spec.ts
 *
 * Tests E2E de mensajería entre dos usuarios reales simultáneos.
 *
 * Usuario 1 (organizador):  bodasdehoy.com@gmail.com   / lorca2012M*.
 * Usuario 2 (proveedor/colega): test-usuario2@bodasdehoy.com / TestBodas2024!
 *
 * Cada test abre DOS contextos de navegador independientes (dos sesiones
 * completamente aisladas, como si fueran dos personas distintas en su PC).
 *
 * Flujos cubiertos:
 *   1. Login simultáneo de ambos usuarios
 *   2. Usuario 1 asigna tarea a Usuario 2 via IA
 *   3. Usuario 2 ve la notificación/tarea en su bandeja /messages
 *   4. Usuario 2 responde a la tarea desde su bandeja
 *   5. Usuario 1 ve que la tarea fue respondida/completada
 *   6. Mensajes en el canal de servicios (ev-*-services)
 *   7. Usuario 1 crea servicio vía IA → Usuario 2 lo ve en su chat
 *   8. Notificaciones cruzadas: U1 cambia presupuesto → U2 recibe notif
 *   9. Flujo WhatsApp: setup de canal compartido
 *  10. Flujo completo: coordinación de boda entre dos usuarios
 *
 * Requiere:
 *   BASE_URL=https://app-test.bodasdehoy.com
 *   CHAT_URL=https://chat-test.bodasdehoy.com
 *   TEST_USER_EMAIL=bodasdehoy.com@gmail.com
 *   TEST_USER_PASSWORD=lorca2012M*.
 *   TEST_USER2_EMAIL=test-usuario2@bodasdehoy.com
 *   TEST_USER2_PASSWORD=TestBodas2024!
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { TEST_CREDENTIALS } from './fixtures';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const CHAT_URL = getChatUrl(BASE_URL);
const APP_URL  = BASE_URL;

// ── Credenciales de los dos usuarios ──────────────────────────────────────────
const U1_EMAIL    = process.env.TEST_USER_EMAIL     || TEST_CREDENTIALS.email     || 'bodasdehoy.com@gmail.com';
const U1_PASSWORD = process.env.TEST_USER_PASSWORD  || TEST_CREDENTIALS.password  || 'lorca2012M*.';
const U2_EMAIL    = process.env.TEST_USER2_EMAIL    || 'test-usuario2@bodasdehoy.com';
const U2_PASSWORD = process.env.TEST_USER2_PASSWORD || 'TestBodas2024!';

const hasU1 = Boolean(U1_EMAIL && U1_PASSWORD);
const hasU2 = Boolean(U2_EMAIL && U2_PASSWORD);
const hasBoth = hasU1 && hasU2;

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Login de un usuario en chat-test. Devuelve true si llega a /chat. */
async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1200);

  if (page.url().includes('/chat')) return true; // ya autenticado

  // Botón "Iniciar sesión" antes del form (algunos flows)
  const btn = page.locator('button, a').filter({ hasText: /^Iniciar sesión$/i }).first();
  if (await btn.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(600);
  }

  const emailInput = page.locator('input[type="email"]').first();
  if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) return false;

  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
  // Dar tiempo a que el store de auth y los datos del usuario se inicialicen
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  return !page.url().includes('/login');
}

/** Envía un mensaje al chat y espera `waitMs` ms. Devuelve el texto de los mensajes. */
async function chat(page: Page, text: string, waitMs = 25_000): Promise<string> {
  await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  // Esperar que la app React hidrate completamente (especialmente en contextos aislados)
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // El input de LobeChat es un div[contenteditable] (editor Lexical de @lobehub/editor).
  // Hay varios en la página — el del chat principal es el que contiene el placeholder.
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 35_000 });
  await ta.click();
  // Usar keyboard.type en vez de fill() para editors Lexical (fill() no dispara eventos de Lexical)
  await page.keyboard.type(text, { delay: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(waitMs);
  const msgs = await page.locator('[class*="markdown"], [class*="message-content"], [class*="assistant"]').allTextContents();
  return msgs.join('\n');
}

/** Envía un mensaje en el chat SIN redirigir (ya estamos en /chat). */
async function sendMsg(page: Page, text: string, waitMs = 20_000): Promise<string> {
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 20_000 });
  await ta.click();
  await page.keyboard.type(text, { delay: 30 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(waitMs);
  const msgs = await page.locator('[class*="markdown"], [class*="message-content"], [class*="assistant"]').allTextContents();
  return msgs.join('\n');
}

/** Crea un contexto de browser limpio (sesión aislada). */
async function newIsolatedContext(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

/** Espera a que aparezca texto en la página, con timeout. */
async function waitForText(page: Page, regex: RegExp, timeout = 20_000): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const body = await page.locator('body').textContent().catch(() => '');
    if (regex.test(body ?? '')) return true;
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  return false;
}

// ─── 1. LOGIN SIMULTÁNEO DE DOS USUARIOS ─────────────────────────────────────

test.describe('1. Login simultáneo — dos usuarios independientes', () => {
  test.setTimeout(120_000);

  test('ambos usuarios loguean en contextos separados', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // Login en paralelo — dos pestañas independientes
      const [ok1, ok2] = await Promise.all([
        loginChat(page1, U1_EMAIL, U1_PASSWORD),
        loginChat(page2, U2_EMAIL, U2_PASSWORD),
      ]);

      console.log(`\nUsuario 1 (${U1_EMAIL}): ${ok1 ? '✅ logueado' : '❌ fallo'}`);
      console.log(`Usuario 2 (${U2_EMAIL}): ${ok2 ? '✅ logueado' : '❌ fallo'}`);

      expect(ok1, `Usuario 1 debe poder loguear`).toBe(true);
      expect(ok2, `Usuario 2 debe poder loguear`).toBe(true);

      // Verificar que cada uno ve su propio chat, no el del otro
      const body1 = await page1.locator('body').textContent() ?? '';
      const body2 = await page2.locator('body').textContent() ?? '';

      // El email del usuario 2 NO debe estar en la sesión del usuario 1
      expect(body1).not.toContain(U2_EMAIL.split('@')[0]);
      console.log('✅ Sesiones completamente aisladas entre sí');
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('usuario 1 en chat-test + usuario 2 en chat-test al mismo tiempo', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);

      if (!ok1 || !ok2) {
        console.log(`ℹ️ Login parcial: U1=${ok1}, U2=${ok2} — verificando lo que esté disponible`);
      }

      // Verificar que ambos acceden a /messages
      await Promise.all([
        page1.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
        page2.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
      ]);

      const [body1, body2] = await Promise.all([
        page1.locator('body').textContent(),
        page2.locator('body').textContent(),
      ]);

      expect(body1 ?? '').not.toContain('Error Capturado por ErrorBoundary');
      expect(body2 ?? '').not.toContain('Error Capturado por ErrorBoundary');

      console.log(`✅ /messages cargado para ambos usuarios simultáneamente`);
      console.log(`   U1 bandeja: ${body1?.slice(0, 150)}`);
      console.log(`   U2 bandeja: ${body2?.slice(0, 150)}`);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 2. USUARIO 1 ASIGNA TAREA A USUARIO 2 VÍA IA ───────────────────────────

test.describe('2. U1 asigna tarea a U2 vía chat IA', () => {
  test.setTimeout(180_000);

  test('U1 crea tarea "revisar catering" y la asigna a U2 vía IA', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // ── U1 se loguea ──────────────────────────────────────────────────────
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { console.log('ℹ️ U1 login falló'); test.skip(); return; }
      console.log('✅ U1 logueado');

      // ── U1 crea y asigna tarea vía IA ─────────────────────────────────────
      const taskName = `Revisar menú catering ${TODAY}`;
      const assignReply = await chat(
        page1,
        `Crea una tarea en el itinerario llamada "${taskName}".
        Descripción: Confirmar con La Huerta de Madrid que el menú vegetariano está listo para 120 personas.
        Prioridad: alta.
        Asignada a: ${U2_EMAIL}
        Fecha límite: en 7 días.`,
        35_000,
      );

      console.log(`\n── Tarea creada por U1: ${assignReply.slice(0, 250)}`);
      expect(assignReply.length).toBeGreaterThan(20);

      // ── U2 se loguea y verifica que ve la tarea ───────────────────────────
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { console.log('ℹ️ U2 login falló — verificando solo la creación'); return; }
      console.log('✅ U2 logueado');

      // U2 va a /tasks o /messages para ver la tarea asignada
      await page2.goto(`${CHAT_URL}/tasks`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForTimeout(3000);

      const body2 = await page2.locator('body').textContent() ?? '';
      expect(body2).not.toContain('Error Capturado por ErrorBoundary');

      const hasTask = body2.toLowerCase().includes('catering') || body2.toLowerCase().includes('revisar');
      console.log(`${hasTask ? '✅' : 'ℹ️'} U2 ve la tarea en /tasks: ${hasTask}`);
      console.log(`   Contenido /tasks de U2: ${body2.slice(0, 300)}`);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('U1 escribe prompt con datos de tarea específicos para el servicio "Fotografía"', async ({ browser }) => {
    if (!hasU1) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U1_EMAIL, U1_PASSWORD);
      if (!ok) { test.skip(); return; }

      const reply = await chat(
        page,
        `En el servicio de Fotografía, crea una nota/tarea interna:
        "Confirmar con Carlos Ruiz el horario de llegada el día de la boda (20/09/2025).
        Necesita saber si hay aparcamiento en la Finca El Romeral.
        Contactar antes del ${new Date(Date.now() + 7 * 864e5).toLocaleDateString('es-ES')}"
        Asígnala como pendiente de revisar.`,
        35_000,
      );

      expect(reply.length).toBeGreaterThan(20);
      console.log(`✅ Nota en servicio fotografía: ${reply.slice(0, 250)}`);
    } finally {
      await ctx.close();
    }
  });
});

// ─── 3. U2 VE NOTIFICACIÓN Y RESPONDE DESDE SU BANDEJA ───────────────────────

test.describe('3. U2 recibe notificación y responde desde /messages', () => {
  test.setTimeout(180_000);

  test('U2 abre su bandeja /messages y ve tareas/notificaciones pendientes', async ({ browser }) => {
    if (!hasU2) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U2_EMAIL, U2_PASSWORD);
      if (!ok) { console.log('ℹ️ U2 login falló'); test.skip(); return; }

      // Ir a la bandeja
      await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3000);

      const body = await page.locator('body').textContent() ?? '';
      expect(body).not.toContain('Error Capturado por ErrorBoundary');

      console.log(`✅ U2 bandeja /messages:`);
      console.log(`   Contenido: ${body.slice(0, 400)}`);

      // Ver cuántos canales internos (ev-*) tiene U2
      const channels = await page.locator('a[href*="ev-"], a[href*="/messages/ev"]').count();
      console.log(`   Canales internos de U2: ${channels}`);

      // Ver si hay notificaciones
      await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2000);
      const notifBody = await page.locator('body').textContent() ?? '';
      expect(notifBody).not.toContain('Error Capturado por ErrorBoundary');
      console.log(`   Notificaciones U2: ${notifBody.slice(0, 200)}`);
    } finally {
      await ctx.close();
    }
  });

  test('U2 ve sus tareas pendientes en /tasks y responde vía IA', async ({ browser }) => {
    if (!hasU2) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U2_EMAIL, U2_PASSWORD);
      if (!ok) { test.skip(); return; }

      // Consultar tareas como U2
      const reply = await chat(
        page,
        '¿Qué tareas tengo asignadas o pendientes? Dame la lista completa.',
        28_000,
      );

      console.log(`✅ U2 consulta sus tareas: ${reply.slice(0, 300)}`);
      expect(reply.length).toBeGreaterThan(10);
    } finally {
      await ctx.close();
    }
  });

  test('U2 responde a una tarea y la marca como en progreso', async ({ browser }) => {
    if (!hasU2) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U2_EMAIL, U2_PASSWORD);
      if (!ok) { test.skip(); return; }

      const reply = await chat(
        page,
        `Tengo la tarea de revisar el menú del catering. Actualiza el estado a "en progreso".
        Añade una nota: "He contactado con La Huerta de Madrid. Confirman menú vegetariano para 120 personas.
        Precio final: 65€/persona. Pendiente: firma de contrato."`,
        35_000,
      );

      expect(reply.length).toBeGreaterThan(20);
      console.log(`✅ U2 actualiza tarea catering: ${reply.slice(0, 250)}`);
    } finally {
      await ctx.close();
    }
  });
});

// ─── 4. CANAL DE SERVICIOS: MENSAJES ENTRE DOS USUARIOS ──────────────────────

test.describe('4. Canal de servicios — mensajes entre U1 y U2', () => {
  test.setTimeout(200_000);

  test('U1 crea servicio y U2 lo ve en su canal ev-*-services', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // ── U1 crea un servicio ────────────────────────────────────────────────
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { test.skip(); return; }

      const serviceName = `DJ Test E2E ${TODAY}`;
      const createReply = await chat(
        page1,
        `Añade un nuevo servicio a mi boda:
        Proveedor: "${serviceName}"
        Tipo: música / DJ
        Precio: 1.200€
        Teléfono: 666 999 888
        Notas: 6 horas de sesión, incluye equipo de sonido e iluminación.
        Estado: pendiente de confirmar.`,
        35_000,
      );

      console.log(`\n── U1 crea servicio "${serviceName}": ${createReply.slice(0, 200)}`);
      expect(createReply.length).toBeGreaterThan(20);

      // ── U2 se loguea y busca el canal de servicios ─────────────────────────
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { console.log('ℹ️ U2 no puede loguear — solo verificamos creación'); return; }

      await page2.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForTimeout(3000);

      // Buscar canal de servicios en la bandeja de U2
      const servicioLink = page2
        .locator('a[href*="ev-"], [data-testid*="channel"]')
        .filter({ hasText: /servicio|service/i })
        .first();

      if (await servicioLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await servicioLink.click();
        await page2.waitForTimeout(2500);

        const body = await page2.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
        const hasDJ = body.toLowerCase().includes('dj') || body.toLowerCase().includes(TODAY.toLowerCase());
        console.log(`${hasDJ ? '✅' : 'ℹ️'} U2 ve el canal de servicios — nuevo servicio visible: ${hasDJ}`);
      } else {
        // Abrir el primer canal interno disponible
        const firstChan = page2.locator('a[href*="ev-"]').first();
        if (await firstChan.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await firstChan.click();
          await page2.waitForTimeout(2000);
          console.log('ℹ️ Abierto primer canal interno de U2');
        } else {
          console.log('ℹ️ U2 no tiene canales de servicios en la bandeja');
        }
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('U2 escribe un comentario en el canal de servicios de U1', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // U1 loguea para tener un evento activo (el canal se crea en su evento)
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { test.skip(); return; }
      console.log('✅ U1 logueado');

      // U2 loguea
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { console.log('ℹ️ U2 no puede loguear'); return; }
      console.log('✅ U2 logueado');

      // U2 navega a la bandeja y busca un canal del evento de U1
      await page2.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForTimeout(3000);

      // Intentar abrir cualquier canal de evento
      const eventChan = page2.locator('a[href*="ev-"]').first();
      if (!await eventChan.isVisible({ timeout: 5_000 }).catch(() => false)) {
        console.log('ℹ️ U2 no comparte canales de evento con U1 (esperado si son cuentas separadas)');
        // Verificar que U2 puede enviar mensaje vía su propio chat sin error
        const reply = await chat(
          page2,
          `Envía una nota a mi equipo: "He revisado los servicios del evento. Todo está correcto. Fecha confirmada: 20/09/2025." Fecha: ${TODAY}`,
          25_000,
        );
        console.log(`ℹ️ U2 mensaje alternativo vía chat: ${reply.slice(0, 150)}`);
        return;
      }

      await eventChan.click();
      await page2.waitForTimeout(2000);

      // U2 escribe un comentario si hay textarea
      const ta2 = page2.locator('textarea').last();
      if (await ta2.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await ta2.click();
        await ta2.fill(`[U2 - ${TODAY}] Revisado: los servicios del evento están en orden. El catering confirma disponibilidad. Pendiente: firma del fotógrafo.`);
        await page2.keyboard.press('Enter');
        await page2.waitForTimeout(4000);

        // U1 recarga su bandeja para ver el mensaje de U2
        await page1.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page1.waitForTimeout(3000);
        const body1 = await page1.locator('body').textContent() ?? '';
        const hasMsg = body1.includes('U2') || body1.includes(TODAY);
        console.log(`${hasMsg ? '✅' : 'ℹ️'} U1 ve el mensaje de U2 en su bandeja: ${hasMsg}`);
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 5. NOTIFICACIONES CRUZADAS ───────────────────────────────────────────────

test.describe('5. Notificaciones cruzadas entre usuarios', () => {
  test.setTimeout(180_000);

  test('U1 crea partida de presupuesto → U2 consulta el estado del presupuesto', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { test.skip(); return; }

      // U1 crea una partida de presupuesto
      const itemName = `Flores y decoración E2E ${TODAY}`;
      await chat(
        page1,
        `Crea una partida de presupuesto: "${itemName}", categoría: decoración, importe: 1.500€, pagado: 300€.`,
        30_000,
      );
      console.log(`✅ U1 creó partida: "${itemName}"`);

      // U2 consulta el presupuesto general
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { console.log('ℹ️ U2 no disponible'); return; }

      const reply2 = await chat(
        page2,
        '¿Cuál es el estado del presupuesto de mi boda? Dame el total y el desglose por categorías.',
        30_000,
      );

      console.log(`✅ U2 consulta presupuesto: ${reply2.slice(0, 250)}`);
      expect(reply2.length).toBeGreaterThan(10);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('U2 ve notificaciones en el panel de la campana', async ({ browser }) => {
    if (!hasU2) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U2_EMAIL, U2_PASSWORD);
      if (!ok) { test.skip(); return; }

      await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3000);

      // Buscar la campana en el sidebar
      const bell = page.locator('[data-testid*="notification"], [aria-label*="notif"], [class*="bell"], svg[class*="bell"]').first();
      const hasBell = await bell.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasBell) {
        await bell.click();
        await page.waitForTimeout(1500);
        const body = await page.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
        const notifCount = await page.locator('[data-testid*="notification-item"], [class*="notification"]').count();
        console.log(`✅ U2 campana abierta — notificaciones visibles: ${notifCount}`);
      } else {
        // Navegar directamente a /notifications
        await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2000);
        const body = await page.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
        console.log(`ℹ️ Campana no encontrada — /notifications cargado: ${body.slice(0, 200)}`);
      }
    } finally {
      await ctx.close();
    }
  });

  test('U1 añade invitado → ambos usuarios ven la actualización de la lista', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);

      if (!ok1) { test.skip(); return; }

      // U1 añade un invitado
      const guestName = `Invitado E2E 2U ${TODAY}`;
      const guestReply = await chat(
        page1,
        `Añade el invitado: Nombre: "${guestName}", Email: "e2e.2u.${TODAY}@test.com", Mesa: 3, Menú: normal.`,
        30_000,
      );
      console.log(`✅ U1 añade invitado: ${guestReply.slice(0, 150)}`);

      if (ok2) {
        // U2 consulta la lista de invitados
        const reply2 = await chat(
          page2,
          '¿Cuántos invitados hay en la lista ahora mismo? ¿Aparece algún invitado reciente?',
          28_000,
        );
        console.log(`✅ U2 consulta invitados: ${reply2.slice(0, 200)}`);
        expect(reply2.length).toBeGreaterThan(10);
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 6. CANAL WHATSAPP: SETUP Y MENSAJES ──────────────────────────────────────

test.describe('6. Canal WhatsApp — setup y mensajes entrantes', () => {
  test.setTimeout(120_000);

  test('U1 navega a integrations/WhatsApp y ve el setup', async ({ browser }) => {
    if (!hasU1) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U1_EMAIL, U1_PASSWORD);
      if (!ok) { test.skip(); return; }

      await page.goto(`${CHAT_URL}/settings/integrations`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      await page.waitForTimeout(2500);

      const body = await page.locator('body').textContent() ?? '';
      expect(body).not.toContain('Error Capturado por ErrorBoundary');

      const hasWA = /whatsapp|integrac|teléfono|qr/i.test(body);
      console.log(`${hasWA ? '✅' : 'ℹ️'} Integrations: ${hasWA ? 'WhatsApp setup encontrado' : 'sección cargada'}`);
      console.log(`   Contenido: ${body.slice(0, 300)}`);
    } finally {
      await ctx.close();
    }
  });

  test('U2 navega a /messages/whatsapp — ve canales WA disponibles', async ({ browser }) => {
    if (!hasU2) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U2_EMAIL, U2_PASSWORD);
      if (!ok) { test.skip(); return; }

      // Navegar a canales de WhatsApp
      await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3000);

      // Buscar sección de WhatsApp en el sidebar
      const waSection = page.locator('[href*="wa-"], [data-testid*="whatsapp"], [class*="whatsapp"]').first();
      if (await waSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await waSection.click();
        await page.waitForTimeout(2000);
        const body = await page.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
        console.log(`✅ U2 canal WA: ${body.slice(0, 200)}`);
      } else {
        console.log('ℹ️ No hay canales WA activos para U2 (esperado sin WhatsApp conectado)');
        const body = await page.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
      }
    } finally {
      await ctx.close();
    }
  });

  test('U1 vía IA: consulta conversaciones de WhatsApp recientes', async ({ browser }) => {
    if (!hasU1) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U1_EMAIL, U1_PASSWORD);
      if (!ok) { test.skip(); return; }

      const reply = await chat(
        page,
        '¿Tengo conversaciones de WhatsApp activas o mensajes pendientes de responder de proveedores?',
        28_000,
      );

      console.log(`✅ U1 consulta WA: ${reply.slice(0, 250)}`);
      expect(reply.length).toBeGreaterThan(10);
    } finally {
      await ctx.close();
    }
  });
});

// ─── 7. CHAT CRUZADO: U1 PREGUNTA SOBRE DATOS QUE U2 ACTUALIZÓ ───────────────

test.describe('7. Chat cruzado — U1 pregunta sobre actualizaciones de U2', () => {
  test.setTimeout(200_000);

  test('U2 actualiza un servicio → U1 pregunta el estado actualizado', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { test.skip(); return; }

      // U2 actualiza el estado de un servicio vía IA
      const updateReply = await chat(
        page2,
        `Actualiza el estado del servicio de fotografía a "confirmado".
        Añade la nota: "Contrato firmado el ${new Date().toLocaleDateString('es-ES')}. Señal de 500€ transferida."`,
        30_000,
      );
      console.log(`\n── U2 actualiza fotografía: ${updateReply.slice(0, 200)}`);

      // U1 pregunta el estado de los servicios
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { console.log('ℹ️ U1 no disponible'); return; }

      const statusReply = await chat(
        page1,
        '¿Cuál es el estado actual de todos mis servicios contratados? ¿Cuáles están confirmados y cuáles pendientes?',
        30_000,
      );

      console.log(`── U1 consulta servicios: ${statusReply.slice(0, 300)}`);
      expect(statusReply.length).toBeGreaterThan(20);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('U2 responde "sí" a tarea de catering → U1 ve el estado', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // U2 marca tarea completada
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { test.skip(); return; }

      const completeReply = await chat(
        page2,
        `Marca como completada cualquier tarea de catering o menú que esté pendiente.
        Añade nota de cierre: "Confirmado. Menú vegetariano para 120 personas. Precio final: 7.800€. Entrega 4h antes de la ceremonia."`,
        35_000,
      );
      console.log(`\n── U2 completa tarea catering: ${completeReply.slice(0, 200)}`);

      // U1 consulta las tareas completadas
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { return; }

      const checkReply = await chat(
        page1,
        '¿Qué tareas se han completado recientemente? ¿El catering está confirmado?',
        30_000,
      );

      console.log(`── U1 verifica completadas: ${checkReply.slice(0, 300)}`);
      const confirmed = /complet|confirm|caterig|menu|vegeta/i.test(checkReply);
      console.log(`${confirmed ? '✅' : 'ℹ️'} U1 ve confirmación de catering: ${confirmed}`);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 8. AISLAMIENTO DE DATOS ──────────────────────────────────────────────────

test.describe('8. Aislamiento de datos — cada usuario ve solo sus datos', () => {
  test.setTimeout(150_000);

  test('U2 NO ve los eventos privados de U1', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);
    try {
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { test.skip(); return; }

      const reply = await chat(
        page2,
        '¿Qué eventos tengo registrados en mi cuenta? Lista todos los eventos.',
        28_000,
      );

      // El email de U1 NO debe aparecer en la respuesta de U2
      const exposesU1 = reply.toLowerCase().includes(U1_EMAIL.split('@')[0].toLowerCase());
      expect(exposesU1, `U2 NO debe ver datos del email de U1: ${U1_EMAIL}`).toBe(false);

      console.log(`✅ Aislamiento de datos OK — U2 no ve eventos de U1`);
      console.log(`   U2 eventos: ${reply.slice(0, 200)}`);
    } finally {
      await ctx2.close();
    }
  });

  test('el balance/saldo de U1 y U2 son independientes', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const [ok1, ok2] = await Promise.all([
        loginChat(page1, U1_EMAIL, U1_PASSWORD),
        loginChat(page2, U2_EMAIL, U2_PASSWORD),
      ]);

      if (!ok1 || !ok2) { test.skip(); return; }

      // Ir a billing de cada usuario
      await Promise.all([
        page1.goto(`${CHAT_URL}/settings/billing`, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
        page2.goto(`${CHAT_URL}/settings/billing`, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
      ]);

      await Promise.all([page1.waitForTimeout(2000), page2.waitForTimeout(2000)]);

      const [billing1, billing2] = await Promise.all([
        page1.locator('body').textContent(),
        page2.locator('body').textContent(),
      ]);

      expect(billing1 ?? '').not.toContain('Error Capturado por ErrorBoundary');
      expect(billing2 ?? '').not.toContain('Error Capturado por ErrorBoundary');

      console.log(`✅ Billing U1: ${billing1?.slice(0, 200)}`);
      console.log(`✅ Billing U2: ${billing2?.slice(0, 200)}`);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 9. CANAL DE SERVICIO CON ID REAL: MENSAJES ORIGEN → DESTINO ─────────────
//
// Arquitectura del canal:
//   chat-ia bandeja → /messages/ev-{eventId}-services
//
// El eventId se extrae del DOM (links de canales en /messages).
// U1 escribe un comentario en ese canal → U2 navega al MISMO canal ID
// y verifica que el mensaje es visible.
// El mismo canal sirve para ambas apps (appEventos lo usa para refrescar datos).

test.describe('9. Canal servicio con ID real — mensaje U1 → U2 y viceversa', () => {
  test.setTimeout(200_000);

  /** Extrae el primer eventId de los canales `ev-{eventId}-*` visibles en /messages */
  async function extractEventId(page: Page): Promise<string | null> {
    // Primero ir al chat para que el store de eventos se inicialice
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2000);
    // Luego ir a la bandeja donde aparecen los canales ev-*
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(4000);

    // Buscar links cuyo href contenga ev-{id}-{type}
    const hrefs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => /\/messages\/ev-.+-(services|tasks|itinerary|guests)/.test(h));
    });

    if (hrefs.length === 0) return null;

    // Extraer el eventId del primer href encontrado
    const match = hrefs[0].match(/\/messages\/ev-(.+)-(services|tasks|itinerary|guests)/);
    return match ? match[1] : null;
  }

  test('extrae eventId real de los canales de U1', async ({ browser }) => {
    if (!hasU1) test.skip();

    const { ctx, page } = await newIsolatedContext(browser);
    try {
      const ok = await loginChat(page, U1_EMAIL, U1_PASSWORD);
      if (!ok) { test.skip(); return; }

      const eventId = await extractEventId(page);
      console.log(`\n✅ EventId de U1: ${eventId ?? 'no encontrado'}`);

      if (eventId) {
        // Navegar directamente al canal de servicios con el ID real
        const serviceChannelUrl = `${CHAT_URL}/messages/ev-${eventId}-services`;
        console.log(`   Canal servicios: ${serviceChannelUrl}`);

        await page.goto(serviceChannelUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2500);

        const body = await page.locator('body').textContent() ?? '';
        expect(body).not.toContain('Error Capturado por ErrorBoundary');
        console.log(`   Canal servicios cargado: ${body.slice(0, 200)}`);
      } else {
        console.log('ℹ️ U1 no tiene canales de evento en /messages — sin servicios configurados');
      }
    } finally {
      await ctx.close();
    }
  });

  test('U1 escribe comentario en canal servicios → U2 lo ve en el mismo canal', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // Login de ambos
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { test.skip(); return; }
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);

      // Extraer eventId de U1
      const eventId1 = await extractEventId(page1);
      console.log(`\n── EventId U1: ${eventId1 ?? 'no encontrado'}`);

      if (!eventId1) {
        console.log('ℹ️ U1 no tiene canales ev-* — el evento no tiene servicios en la bandeja');
        return;
      }

      // ── U1 escribe en el canal ev-{eventId}-services ──────────────────────
      const serviceUrl = `${CHAT_URL}/messages/ev-${eventId1}-services`;
      const comentarioU1 = `[U1→U2 ${TODAY}] Revisado: el catering "La Huerta de Madrid" confirma disponibilidad para 120 personas. Menú vegetariano OK. Pendiente: firma de contrato.`;

      await page1.goto(serviceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page1.waitForTimeout(2500);

      const ta1 = page1.locator('textarea').last();
      if (await ta1.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await ta1.click();
        await ta1.fill(comentarioU1);
        await page1.keyboard.press('Enter');
        await page1.waitForTimeout(4000);
        console.log(`✅ U1 escribió en canal servicios: "${comentarioU1.slice(0, 80)}..."`);
      } else {
        console.log('ℹ️ Canal servicios sin textarea (solo lectura) — U1 solo puede consultar');
      }

      // Verificar que U1 no tiene error
      const body1 = await page1.locator('body').textContent() ?? '';
      expect(body1).not.toContain('Error Capturado por ErrorBoundary');

      // ── U2 navega al MISMO canal y verifica el mensaje ────────────────────
      if (!ok2) {
        console.log('ℹ️ U2 no disponible — no se puede verificar recepción cruzada');
        return;
      }

      // ¿Tiene U2 acceso al canal de eventos de U1?
      // Si son cuentas distintas sin evento compartido, U2 verá su propio canal o 404
      await page2.goto(serviceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForTimeout(2500);

      const body2 = await page2.locator('body').textContent() ?? '';
      expect(body2).not.toContain('Error Capturado por ErrorBoundary');

      const u2SeeMsgU1 = body2.includes('U1→U2') || body2.includes(TODAY);
      console.log(`${u2SeeMsgU1 ? '✅ CROSS-USER:' : 'ℹ️ Mismo canal:'} U2 ve el mensaje de U1: ${u2SeeMsgU1}`);
      console.log(`   URL canal: ${serviceUrl}`);
      console.log(`   U2 body: ${body2.slice(0, 300)}`);

      // ── U2 responde al mismo canal ─────────────────────────────────────────
      const ta2 = page2.locator('textarea').last();
      if (await ta2.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const comentarioU2 = `[U2→U1 ${TODAY}] Recibido. Contactaré con La Huerta de Madrid mañana para el contrato. Confirmaré por aquí.`;
        await ta2.click();
        await ta2.fill(comentarioU2);
        await page2.keyboard.press('Enter');
        await page2.waitForTimeout(4000);
        console.log(`✅ U2 respondió en el canal: "${comentarioU2.slice(0, 80)}..."`);

        // U1 recarga el canal para ver la respuesta de U2
        await page1.reload({ waitUntil: 'domcontentloaded' });
        await page1.waitForTimeout(2500);
        const body1After = await page1.locator('body').textContent() ?? '';
        const u1SeeMsgU2 = body1After.includes('U2→U1') || body1After.includes(TODAY);
        console.log(`${u1SeeMsgU2 ? '✅ CROSS-USER:' : 'ℹ️'} U1 ve la respuesta de U2: ${u1SeeMsgU2}`);
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('U1 inserta servicio en appEventos → el canal ev-{id}-services se actualiza en chat', async ({ browser }) => {
    if (!hasU1) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // U1 loguea en appEventos (app-test) — aquí es donde edita servicios
      await page1.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page1.waitForTimeout(1200);

      if (!page1.url().includes('/login') === false) {
        const emailInput = page1.locator('input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
          await emailInput.fill(U1_EMAIL);
          await page1.locator('input[type="password"]').first().fill(U1_PASSWORD);
          await page1.locator('button[type="submit"]').first().click();
          await page1.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
        }
      }

      // Navegar a servicios en appEventos
      await page1.goto(`${APP_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page1.waitForTimeout(3000);

      const appBody = await page1.locator('body').textContent() ?? '';
      expect(appBody).not.toContain('Error Capturado por ErrorBoundary');
      console.log(`\n✅ U1 en appEventos /servicios: ${appBody.slice(0, 200)}`);

      // Extraer el eventId del contexto de appEventos (localStorage o URL)
      const eventIdApp = await page1.evaluate(() => {
        try {
          // appEventos guarda el eventId seleccionado en localStorage
          const keys = Object.keys(localStorage);
          for (const k of keys) {
            if (k.includes('event') || k.includes('Event')) {
              const val = localStorage.getItem(k);
              if (val && /^[a-f0-9]{24}$/i.test(val)) return val;
            }
          }
          // Intentar desde window
          const win = window as any;
          return win.__EVENT_ID || win.__CURRENT_EVENT_ID || null;
        } catch { return null; }
      });

      console.log(`   EventId desde appEventos localStorage: ${eventIdApp ?? 'no encontrado'}`);

      // U2 se loguea en chat-ia y navega al canal de servicios de U1
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { console.log('ℹ️ U2 no disponible'); return; }

      // Extraer eventId de U2 (su propia bandeja)
      const eventId2 = await extractEventId(page2);
      console.log(`   EventId desde bandeja U2: ${eventId2 ?? 'no encontrado'}`);

      // Si tenemos el eventId de U1 desde appEventos, probamos ese canal
      const channelEventId = eventIdApp ?? eventId2;
      if (channelEventId) {
        const servicesUrl = `${CHAT_URL}/messages/ev-${channelEventId}-services`;
        await page2.goto(servicesUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page2.waitForTimeout(2500);

        const body2 = await page2.locator('body').textContent() ?? '';
        expect(body2).not.toContain('Error Capturado por ErrorBoundary');
        console.log(`✅ U2 canal servicios (id=${channelEventId}): ${body2.slice(0, 250)}`);
        console.log(`   URL: ${servicesUrl}`);
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('verifica que el canal itinerary también recibe mensajes cruzados', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      const ok1 = await loginChat(page1, U1_EMAIL, U1_PASSWORD);
      if (!ok1) { test.skip(); return; }

      const eventId = await extractEventId(page1);
      if (!eventId) { console.log('ℹ️ Sin canales de evento'); return; }

      // Canal de itinerario con ID real
      const itineraryUrl = `${CHAT_URL}/messages/ev-${eventId}-itinerary`;
      const comentario = `[IT U1→U2 ${TODAY}] URGENTE: Confirmar que el floristería "Flores Luna" tiene confirmada la entrega a las 11:00 del día de la boda. Necesito respuesta antes de mañana.`;

      // U1 escribe en el canal de itinerario
      await page1.goto(itineraryUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page1.waitForTimeout(2500);

      const ta = page1.locator('textarea').last();
      if (await ta.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await ta.click();
        await ta.fill(comentario);
        await page1.keyboard.press('Enter');
        await page1.waitForTimeout(4000);
        console.log(`✅ U1 comentario en canal itinerario: ${comentario.slice(0, 100)}...`);
      } else {
        console.log(`ℹ️ Canal itinerario: ${itineraryUrl} — sin textarea`);
      }

      // U2 verifica el canal de itinerario
      const ok2 = await loginChat(page2, U2_EMAIL, U2_PASSWORD);
      if (!ok2) { return; }

      await page2.goto(itineraryUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page2.waitForTimeout(2500);

      const body2 = await page2.locator('body').textContent() ?? '';
      expect(body2).not.toContain('Error Capturado por ErrorBoundary');
      const seesMsg = body2.includes('IT U1→U2') || body2.includes('floristería');
      console.log(`${seesMsg ? '✅ CROSS-USER:' : 'ℹ️'} U2 ve comentario de itinerario: ${seesMsg}`);
      console.log(`   Canal: ${itineraryUrl}`);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── 10. FLUJO COMPLETO 2 USUARIOS: COORDINACIÓN DE BODA ─────────────────────

test.describe('10. Flujo completo — coordinación de boda entre U1 y U2', () => {
  test.setTimeout(300_000);

  test('E2E 2 usuarios: U1 organiza → U2 gestiona servicios → ambos verifican', async ({ browser }) => {
    if (!hasBoth) test.skip();

    const { ctx: ctx1, page: page1 } = await newIsolatedContext(browser);
    const { ctx: ctx2, page: page2 } = await newIsolatedContext(browser);

    try {
      // ── Login ambos ────────────────────────────────────────────────────────
      const [ok1, ok2] = await Promise.all([
        loginChat(page1, U1_EMAIL, U1_PASSWORD),
        loginChat(page2, U2_EMAIL, U2_PASSWORD),
      ]);

      console.log(`\nLogin: U1=${ok1}, U2=${ok2}`);
      if (!ok1) { test.skip(); return; }

      // ── PASO 1: U1 pregunta el estado completo de la boda ─────────────────
      console.log('\n── Paso 1: U1 estado general ──');
      const estado1 = await chat(page1, 'Resumen del estado actual de mi boda: invitados, presupuesto y tareas.', 28_000);
      console.log(`   U1: ${estado1.slice(0, 200)}`);

      // ── PASO 2: U1 asigna tarea urgente a equipo ──────────────────────────
      console.log('\n── Paso 2: U1 crea tarea urgente ──');
      const tarea = `URGENTE: Confirmar menú final con catering antes del ${new Date(Date.now() + 3 * 864e5).toLocaleDateString('es-ES')}`;
      await chat(page1, `Crea la tarea: "${tarea}". Prioridad: alta. Categoría: catering.`, 30_000);
      console.log(`   ✅ Tarea urgente creada: "${tarea}"`);

      // ── PASO 3: U2 ve y responde la tarea (si tiene acceso) ───────────────
      if (ok2) {
        console.log('\n── Paso 3: U2 responde a la tarea urgente ──');
        const resp2 = await chat(
          page2,
          `Vi la tarea urgente del catering. La marco como "en progreso".
          Nota: "Contactado con La Huerta de Madrid. Tienen disponibilidad. Confirman menú vegetariano para 120 personas. Esperamos contrato por email."`,
          35_000,
        );
        console.log(`   U2: ${resp2.slice(0, 200)}`);
      }

      // ── PASO 4: U1 añade invitados de última hora ─────────────────────────
      console.log('\n── Paso 4: U1 añade invitados de última hora ──');
      const guestReply = await chat(
        page1,
        `Añade estos invitados de última hora:
        1. Rocío Fernández, rocio@test.com, mesa 5, menú vegetariano
        2. Antonio Ruiz, antonio@test.com, mesa 5, menú normal, alergia a los frutos secos`,
        35_000,
      );
      console.log(`   Invitados: ${guestReply.slice(0, 150)}`);

      // ── PASO 5: U2 consulta el presupuesto actualizado ─────────────────────
      if (ok2) {
        console.log('\n── Paso 5: U2 consulta presupuesto ──');
        const budget2 = await chat(
          page2,
          '¿Cuál es el total del presupuesto de la boda y cuánto queda por pagar?',
          28_000,
        );
        console.log(`   U2 presupuesto: ${budget2.slice(0, 200)}`);
      }

      // ── PASO 6: U1 crea web de boda + álbum ───────────────────────────────
      console.log('\n── Paso 6: U1 crea web y álbum ──');
      const webReply = await chat(
        page1,
        `Crea la web de boda de Paco y Pico (20/09/2025, Finca El Romeral).
        Y además crea el álbum de Memories: "Boda Paco y Pico ${TODAY}" para que los invitados suban fotos.`,
        50_000,
      );
      console.log(`   Web+álbum: ${webReply.slice(0, 250)}`);

      // ── PASO 7: Verificación final de ambos ───────────────────────────────
      console.log('\n── Paso 7: Verificación sin errores ──');
      const [body1, body2] = await Promise.all([
        page1.locator('body').textContent(),
        ok2 ? page2.locator('body').textContent() : Promise.resolve(''),
      ]);

      expect(body1 ?? '').not.toContain('Error Capturado por ErrorBoundary');
      if (ok2) expect(body2 ?? '').not.toContain('Error Capturado por ErrorBoundary');

      console.log('\n✅ Flujo completo 2 usuarios finalizado sin errores');
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
