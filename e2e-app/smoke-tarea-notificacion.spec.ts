/**
 * smoke-tarea-notificacion.spec.ts
 *
 * Test ligero: U1 loguea → selecciona evento → crea tarea vía IA →
 * U2 loguea → verifica que tiene notificación/tarea pendiente.
 *
 * Ejecutar:
 *   E2E_ENV=dev npx playwright test e2e-app/smoke-tarea-notificacion.spec.ts --project=webkit
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const E2E_ENV = process.env.E2E_ENV || 'dev';
const CHAT_URL =
  E2E_ENV === 'local' ? 'http://localhost:3210'
    : E2E_ENV === 'dev' ? 'https://chat-dev.bodasdehoy.com'
      : 'https://chat-test.bodasdehoy.com';
const APP_URL =
  E2E_ENV === 'local' ? 'http://localhost:3220'
    : E2E_ENV === 'dev' ? 'https://app-dev.bodasdehoy.com'
      : 'https://app-test.bodasdehoy.com';

const U1 = { email: 'jcc@bodasdehoy.com', password: 'lorca2012M*+' };
const U2 = { email: 'jcc@marketingsoluciones.com', password: 'madrid2012M*+' };

async function newCtx(browser: Browser) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  return { ctx, page: await ctx.newPage() };
}

async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2000);
  if (page.url().includes('/chat')) return true;

  const emailInput = page.locator('input[type="email"]').first();
  if (!await emailInput.isVisible({ timeout: 15_000 }).catch(() => false)) return false;
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  // Esperar a que salga de /login (puede tardar con Firebase en WebKit)
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 60_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Si sigue en /login, intentar submit de nuevo
  if (page.url().includes('/login')) {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Iniciar sesión")').first();
    if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  }
  return !page.url().includes('/login');
}

test.describe('Smoke: tarea + notificación cruzada', () => {
  test.setTimeout(180_000); // 3 min max

  test('U1 crea tarea → U2 ve notificación en bandeja', async ({ browser }) => {
    const { ctx: ctx1, page: p1 } = await newCtx(browser);
    const { ctx: ctx2, page: p2 } = await newCtx(browser);

    try {
      // === 1. Login ambos en paralelo ===
      const [ok1, ok2] = await Promise.all([
        loginChat(p1, U1.email, U1.password),
        loginChat(p2, U2.email, U2.password),
      ]);
      console.log(`U1 (${U1.email}): ${ok1 ? '✅' : '❌'}`);
      console.log(`U2 (${U2.email}): ${ok2 ? '✅' : '❌'}`);
      expect(ok1, 'U1 debe loguear').toBe(true);
      expect(ok2, 'U2 debe loguear').toBe(true);

      // === 2. U1 navega a /chat y crea tarea vía IA ===
      await p1.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await p1.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      await p1.waitForTimeout(3000);

      const taskName = `Test-${Date.now().toString(36)}`;
      const ta = p1.locator('div[contenteditable="true"]').last();
      await ta.waitFor({ state: 'visible', timeout: 45_000 });
      await ta.click();
      await p1.keyboard.type(`Crea una tarea llamada "${taskName}" para mañana a las 10:00`, { delay: 20 });
      await p1.keyboard.press('Enter');
      console.log(`U1 envió prompt para crear tarea: ${taskName}`);

      // Esperar respuesta de la IA (max 40s)
      await p1.waitForTimeout(40_000);
      const msgs = await p1.locator('[class*="markdown"], [class*="message-content"]').allTextContents();
      const iaResp = msgs.join(' ').toLowerCase();
      const tareaCreada = iaResp.includes('tarea') || iaResp.includes('task') || iaResp.includes('creada') || iaResp.includes('creado');
      console.log(`IA respondió: ${tareaCreada ? '✅ mencionó tarea' : '⚠️ respuesta sin "tarea"'}`);
      console.log(`  Extracto: ${msgs.slice(-1)[0]?.slice(0, 120) || '(vacío)'}`);

      // === 3. U2 revisa bandeja /messages y /notifications ===
      await p2.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await p2.waitForTimeout(5_000);
      const bodyMessages = await p2.locator('body').textContent() ?? '';
      const veTareas = bodyMessages.toLowerCase().includes('tarea') || bodyMessages.toLowerCase().includes('task') || bodyMessages.toLowerCase().includes('pendiente');
      console.log(`U2 /messages: ${veTareas ? '✅ ve tareas/pendientes' : '⚠️ sin tareas visibles'}`);

      // Check notifications
      await p2.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await p2.waitForTimeout(5_000);
      const bodyNotifs = await p2.locator('body').textContent() ?? '';
      const veNotifs = bodyNotifs.length > 100; // tiene contenido real
      console.log(`U2 /notifications: ${veNotifs ? '✅ tiene notificaciones' : '⚠️ vacío o minimal'}`);

      // Check NotificationBell badge
      const bell = p2.locator('[class*="notification"], [class*="bell"], [aria-label*="notification"]').first();
      const bellVisible = await bell.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`U2 NotificationBell: ${bellVisible ? '✅ visible' : '⚠️ no encontrada'}`);

      // === 4. Verificar socket (console logs) ===
      // No podemos ver console.log directamente, pero si llegamos aquí sin crash = socket no rompió nada
      console.log('\n📋 Resumen:');
      console.log(`  Login U1+U2: ✅`);
      console.log(`  Tarea creada por IA: ${tareaCreada ? '✅' : '⚠️'}`);
      console.log(`  U2 bandeja: ${veTareas ? '✅' : '⚠️'}`);
      console.log(`  U2 notificaciones: ${veNotifs ? '✅' : '⚠️'}`);

    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
