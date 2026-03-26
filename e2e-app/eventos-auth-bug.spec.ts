/**
 * eventos-auth-bug.spec.ts
 * Bug: api-ia responde "sesión expirada" al preguntar por eventos estando logueado.
 * pnpm exec playwright test e2e-app/eventos-auth-bug.spec.ts --headed
 */
import { test, expect, Page } from '@playwright/test';
import { TEST_CREDENTIALS, TEST_URLS, E2E_ENV } from './fixtures';
import { clearSession } from './helpers';
import { chatWithValidation, classifyResponse, detectToolsInDOM } from './response-validator';

const CHAT_URL = TEST_URLS.chat;
const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);
const LOAD_MUL = E2E_ENV === 'local' ? 1 : 2;
const AUTH_BUG = /sesi[oó]n\s+(ha\s+)?expirad|session.?expired|inicia\s+sesi[oó]n\s+para\s+continuar/i;

async function loginChat(page: Page): Promise<boolean> {
  if (!hasCredentials) return false;
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 * LOAD_MUL });
  await page.waitForTimeout(1200 * LOAD_MUL);
  if (page.url().includes('/chat')) return true;
  const ei = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  await ei.waitFor({ state: 'visible', timeout: 20_000 });
  await ei.click(); await page.keyboard.press('Meta+A'); await page.keyboard.type(EMAIL, { delay: 20 });
  const pi = page.locator('input[type="password"], input[placeholder*="Contraseña" i]').first();
  await pi.click(); await page.keyboard.press('Meta+A'); await page.keyboard.type(PASSWORD, { delay: 20 });
  await page.locator('button:has-text("Iniciar sesión"), button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const jwt = localStorage.getItem('api2_jwt_token') || localStorage.getItem('jwt_token');
    if (jwt) document.cookie = `api2_jwt=${encodeURIComponent(jwt)}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
  });
  return !page.url().includes('/login');
}

async function goChat(page: Page) {
  await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.locator('div[contenteditable="true"]').last().waitFor({ state: 'visible', timeout: 20_000 });
}

async function ask(page: Page, text: string, waitMs = 90_000): Promise<string> {
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 20_000 });
  await ta.click(); await page.keyboard.press('Meta+A'); await page.keyboard.press('Backspace');
  await page.keyboard.type(text, { delay: 25 }); await page.keyboard.press('Enter');
  const deadline = Date.now() + waitMs; let last = ''; await page.waitForTimeout(5_000);
  const WEL = [/I am your.*assistant/i, /How can I assist/i, /Soy tu asistente/i];
  while (Date.now() < deadline) {
    const arts = await page.locator('article').allTextContents();
    const msgs = arts.filter(t => { const s=t.trim(); return s.length>5 && !text.startsWith(s.slice(0,30)) && !(WEL.some(p=>p.test(s))&&s.length<250); });
    const j = msgs.join('\n').trim();
    if (j.length > 10 && j === last) break; last = j; await page.waitForTimeout(2_000);
  }
  return last;
}

// 1. GUEST
test.describe('1. Guest — eventos sin sesión', () => {
  test.setTimeout(120_000);
  test.beforeEach(async ({ page, context }) => { await clearSession(context, page); });

  test('guest "qué eventos tengo" → no datos reales', async ({ page }) => {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 }).catch(() => {});
    await page.waitForTimeout(3_000);
    const vis = await page.locator('div[contenteditable="true"]').last().isVisible({ timeout: 15_000 }).catch(() => false);
    if (!vis) { test.skip(); return; }
    const r = await ask(page, 'Qué eventos tengo para el próximo año', 60_000);
    console.log(`[Guest] ${r.slice(0, 300)}`);
    expect(/\d+\s*evento|boda\s+de|fecha.*\d{4}/i.test(r), 'Guest NO debe ver datos reales').toBe(false);
  });
});

// 2. LOGUEADO — "sesión expirada" es BUG
test.describe('2. Logueado — eventos (bug auth)', () => {
  test.setTimeout(150_000);
  test.beforeEach(async ({ page }) => { if (!hasCredentials) test.skip(); const ok = await loginChat(page); if (!ok) test.skip(); });

  test('logueado "eventos próximo año" → NO auth error', async ({ page }) => {
    await goChat(page);
    const jwt = await page.evaluate(() => localStorage.getItem('api2_jwt_token') || localStorage.getItem('jwt_token'));
    expect(jwt, 'JWT debe existir').toBeTruthy();
    const r = await ask(page, 'Qué eventos tengo para el próximo año', 90_000);
    console.log(`[Logueado] ${r.slice(0, 500)}`);
    if (AUTH_BUG.test(r)) console.error('🐛 BUG: api-ia dice "sesión expirada" estando logueado');
    expect(AUTH_BUG.test(r), `BUG auth: ${r.slice(0, 300)}`).toBe(false);
  });

  test('logueado "cuáles son mis eventos" → no pide login', async ({ page }) => {
    await goChat(page);
    const result = await chatWithValidation(page, '¿Cuáles son mis eventos? Muéstrame la lista.', {
      expectedCategory: ['tool_executed', 'data_response', 'needs_event', 'tool_failed'],
      forbiddenPatterns: ['sesión.*expirad', 'session.?expired', 'inicia sesión para continuar'],
      description: 'Logueado: listar eventos no debe pedir auth',
    }, 90_000);
    console.log(result.message);
    expect(result.passed, result.message).toBe(true);
  });
});

// 3. LOGUEADO + EVENTO
test.describe('3. Logueado + evento — datos reales', () => {
  test.setTimeout(180_000);
  test.beforeEach(async ({ page }) => { if (!hasCredentials) test.skip(); const ok = await loginChat(page); if (!ok) test.skip(); });

  test('logueado+evento: "eventos próximo año" → datos', async ({ page }) => {
    // Seleccionar evento via chat (pedir que liste eventos primero)
    await goChat(page);
    const setup = await ask(page, 'Lista mis eventos', 60_000);
    console.log(`[+evento setup] ${setup.slice(0, 200)}`);

    const r = await ask(page, 'Qué eventos tengo para el próximo año', 90_000);
    console.log(`[+evento] ${r.slice(0, 500)}`);
    expect(AUTH_BUG.test(r), `BUG con evento: ${r.slice(0,300)}`).toBe(false);
    expect(r.length > 30, 'Respuesta no vacía').toBe(true);
  });

  test('logueado+evento: "invitados" → NO sesión expirada', async ({ page }) => {
    await goChat(page);
    const r = await ask(page, '¿Cuántos invitados tengo confirmados?', 60_000);
    console.log(`[+evento invitados] ${r.slice(0, 400)}`);
    // Lo crítico: NO debe pedir auth estando logueado
    expect(AUTH_BUG.test(r), `BUG auth en invitados: ${r.slice(0, 300)}`).toBe(false);
    // Si api-ia falla por timeout es otro bug (ya reportado), pero no es auth
    const tools = await detectToolsInDOM(page);
    const cat = classifyResponse(r, tools);
    expect(cat !== 'auth_required', `No debe ser auth_required, fue: ${cat}`).toBe(true);
  });
});

// 4. DIAGNÓSTICO JWT
test.describe('4. Diagnóstico JWT', () => {
  test.setTimeout(90_000);

  test('JWT presente tras login', async ({ page }) => {
    if (!hasCredentials) test.skip();
    if (!(await loginChat(page))) test.skip();
    const jwt = await page.evaluate(() => ({
      cache: localStorage.getItem('jwt_token_cache'), direct: localStorage.getItem('jwt_token'), firebase: localStorage.getItem('api2_jwt_token'),
    }));
    console.log(`[JWT] cache:${!!jwt.cache} direct:${!!jwt.direct} firebase:${!!jwt.firebase}`);
    expect(!!(jwt.cache||jwt.direct||jwt.firebase), 'JWT debe existir').toBe(true);
    const cookies = await page.context().cookies();
    console.log(`[Cookies] ${cookies.filter(c=>/jwt|auth|token/i.test(c.name)).map(c=>c.name).join(', ')}`);
  });

  test('JWT no desaparece durante pregunta', async ({ page }) => {
    if (!hasCredentials) test.skip();
    if (!(await loginChat(page))) test.skip();
    await goChat(page);
    const before = await page.evaluate(() => localStorage.getItem('api2_jwt_token') || localStorage.getItem('jwt_token'));
    await ask(page, 'Qué eventos tengo para el próximo año', 90_000);
    const after = await page.evaluate(() => localStorage.getItem('api2_jwt_token') || localStorage.getItem('jwt_token'));
    if (before && !after) console.error('🐛 JWT desapareció durante la pregunta!');
    expect(after, 'JWT no debe desaparecer').toBeTruthy();
  });
});
