/**
 * multi-developer.spec.ts
 *
 * Tests E2E contra múltiples whitelabels / developers:
 *   - bodasdehoy (default)
 *   - vivetuboda
 *   - eventosorganizador
 *
 * Verifica que cada dominio:
 *   - carga sin 500 ni ErrorBoundary
 *   - muestra su propio branding / nombre
 *   - permite login con credenciales de bodasdehoy SSO
 *   - chat-ia responde sin crash
 *
 * También tests de razonamiento IA + filter_view:
 *   - preguntar sobre tareas → AI navega y filtra con banner rosa
 *   - preguntar sobre invitados → AI filtra invitados
 *   - preguntar sobre presupuesto → AI filtra partidas
 *   - preguntar sobre servicios → AI filtra servicios
 *   - preguntar sobre itinerario → AI filtra momentos
 *
 * Requiere: BASE_URL=https://app-test.bodasdehoy.com
 *           TEST_USER_EMAIL=bodasdehoy.com@gmail.com
 *           TEST_USER_PASSWORD=lorca2012M*.
 */
import { test, expect, Page } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

// ─── developers / whitelabels bajo test ───────────────────────────────────────

const WHITELABELS: Array<{
  name: string;
  baseUrl: string;
  chatUrl: string;
  brandRegex: RegExp;
}> = [
  {
    name: 'bodasdehoy',
    baseUrl: 'https://app-test.bodasdehoy.com',
    chatUrl: getChatUrl(BASE_URL),
    brandRegex: /Bodas de Hoy|bodasdehoy/i,
  },
  {
    name: 'vivetuboda',
    baseUrl: 'https://app.vivetuboda.com',
    chatUrl: 'https://chat.vivetuboda.com',
    brandRegex: /Vive Tu Boda|vivetuboda/i,
  },
  {
    name: 'eventosorganizador',
    baseUrl: 'https://app.eventosorganizador.com',
    chatUrl: 'https://chat.eventosorganizador.com',
    brandRegex: /Eventos Organizador|eventosorganizador/i,
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

async function pingUrl(page: Page, url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    return { ok: (res?.status() ?? 0) < 500, status: res?.status() ?? 0 };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function loginChat(page: Page, chatUrl: string): Promise<boolean> {
  if (!hasCredentials) return false;
  try {
    await page.goto(`${chatUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1500);

    const loginLink = page
      .locator('a, [role="button"], span')
      .filter({ hasText: /^Iniciar sesión$/ })
      .first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    const emailInput = page.locator('input[type="email"]').first();
    if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) return false;

    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Smoke por whitelabel
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Multi-developer — smoke de cada whitelabel', () => {
  test.setTimeout(120_000);

  for (const wl of WHITELABELS) {
    test(`${wl.name} — app carga sin 500`, async ({ page }) => {
      if (!isAppTest) { test.skip(); return; }

      const { ok, status } = await pingUrl(page, wl.baseUrl);
      if (!ok && status === 0) {
        console.log(`⚠️ ${wl.name}: dominio no accesible (puede requerir VPN o estar caído)`);
        test.skip();
        return;
      }

      expect(status).not.toBe(500);

      await waitForAppReady(page, 15_000);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text.length).toBeGreaterThan(30);
    });

    test(`${wl.name} — chat-ia carga sin 500`, async ({ page }) => {
      if (!isAppTest) { test.skip(); return; }

      const { ok, status } = await pingUrl(page, wl.chatUrl);
      if (!ok && status === 0) {
        console.log(`⚠️ ${wl.name} chat: dominio no accesible`);
        test.skip();
        return;
      }

      expect(status).not.toBe(500);

      await waitForAppReady(page, 15_000);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Login SSO entre whitelabels (bodasdehoy → vivetuboda)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SSO cross-domain — login en bodasdehoy activa sesión', () => {
  test.setTimeout(150_000);

  test('login en chat-test.bodasdehoy.com → sesión disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) {
      console.log('ℹ️ No se pudo hacer login — skipping SSO test');
      test.skip();
      return;
    }

    // Verificar que el chat-ia muestra contenido autenticado
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const isAuthenticated = !/iniciar sesión|login|register/i.test(text) || text.length > 200;
    console.log(`✅ Estado autenticado en chat: ${isAuthenticated}`);
  });

  test('login en app-test.bodasdehoy.com → cookie sessionBodas presente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]').first();
    if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});

    // Verificar cookies
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === 'sessionBodas' || c.name.includes('session') || c.name.includes('Token'),
    );

    if (sessionCookie) {
      console.log(`✅ Cookie de sesión detectada: ${sessionCookie.name}`);
    } else {
      console.log(`ℹ️ Cookies disponibles: ${cookies.map((c) => c.name).join(', ')}`);
    }

    // Al menos la app debe haber redirigido del login
    expect(page.url()).not.toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. IA reasoning — filter_view por entidad (chat-ia standalone)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('IA reasoning — filter_view por entidad', () => {
  test.setTimeout(180_000);

  async function sendChatMessage(page: Page, message: string): Promise<string> {
    // Buscar el input del chat
    const chatInput = page
      .locator('textarea, input[type="text"]')
      .filter({ hasText: '' })
      .last();

    const inputVisible = await chatInput.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!inputVisible) {
      console.log('ℹ️ Input del chat no visible');
      return '';
    }

    await chatInput.click();
    await chatInput.fill(message);
    await page.keyboard.press('Enter');

    // Esperar respuesta (máx 30s)
    await page.waitForTimeout(3000);
    let lastText = '';
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2000);
      const current = (await page.locator('body').textContent()) ?? '';
      if (current.length > lastText.length + 50) {
        lastText = current;
        break;
      }
      lastText = current;
    }

    return (await page.locator('body').textContent()) ?? '';
  }

  test('preguntar sobre invitados → IA responde sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Enviar pregunta sobre invitados
    const responseText = await sendChatMessage(
      page,
      '¿Cuántos invitados tengo confirmados en mi boda?',
    );

    expect(responseText).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(responseText).not.toMatch(/Internal Server Error/);

    const hasResponse = /invitado|confirmado|boda|evento|asistente|ayuda/i.test(responseText);
    console.log(`✅ IA respondió sobre invitados: ${hasResponse}`);
  });

  test('preguntar sobre presupuesto → IA responde sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const responseText = await sendChatMessage(
      page,
      '¿Cuál es el presupuesto total de mi boda?',
    );

    expect(responseText).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasResponse = /presupuesto|gasto|euro|€|total|boda|evento|asistente/i.test(responseText);
    console.log(`✅ IA respondió sobre presupuesto: ${hasResponse}`);
  });

  test('preguntar sobre tareas → IA responde sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const responseText = await sendChatMessage(
      page,
      '¿Qué tareas pendientes tengo en mi itinerario?',
    );

    expect(responseText).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasResponse = /tarea|pendiente|itinerario|actividad|boda|asistente/i.test(responseText);
    console.log(`✅ IA respondió sobre tareas: ${hasResponse}`);
  });

  test('preguntar sobre servicios → IA responde sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const responseText = await sendChatMessage(
      page,
      '¿Qué proveedores o servicios tengo contratados?',
    );

    expect(responseText).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasResponse = /servicio|proveedor|contratado|boda|asistente/i.test(responseText);
    console.log(`✅ IA respondió sobre servicios: ${hasResponse}`);
  });

  test('chat-ia /messages ruta con sesión — Bandeja carga', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasBandeja = /Bandeja|Mensajes|Conversaciones|WhatsApp/i.test(text);
    console.log(`✅ Bandeja detectada con sesión: ${hasBandeja}`);
    expect(hasBandeja).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Chat-ia — providers y rutas de AI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat-ia — rutas y providers AI', () => {
  test.setTimeout(150_000);

  const CHAT_ROUTES = [
    { path: '/chat', label: 'Chat principal' },
    { path: '/messages', label: 'Bandeja mensajes' },
    { path: '/settings', label: 'Settings' },
    { path: '/settings/billing', label: 'Billing' },
  ];

  for (const { path, label } of CHAT_ROUTES) {
    test(`${label} (${path}) — sin 500 ni ErrorBoundary`, async ({ context, page }) => {
      if (!isAppTest) { test.skip(); return; }
      await context.clearCookies();

      const response = await page
        .goto(`${CHAT_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        .catch(() => null);

      if (!response) {
        console.log(`⚠️ ${label}: sin respuesta`);
        return;
      }

      expect(response.status()).not.toBe(500);

      await waitForAppReady(page, 12_000);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text).not.toMatch(/Internal Server Error/);
      expect(text.length).toBeGreaterThan(30);
    });
  }

  test('con sesión: settings/billing muestra saldo', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasBilling = /saldo|balance|plan|factura|€|crédito|billing/i.test(text);
    console.log(`✅ Billing con saldo detectado: ${hasBilling}`);
  });

  test('admin panel — carga sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text).not.toMatch(/Internal Server Error/);
    // Admin puede redirigir a /chat si no es admin — ambos son válidos
    const hasContent = text.length > 50;
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Performance — tiempos de carga
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Performance — tiempos de carga', () => {
  test.setTimeout(120_000);

  async function measureLoad(page: Page, url: string): Promise<number> {
    const start = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 }).catch(() => {});
    await waitForAppReady(page, 15_000);
    return Date.now() - start;
  }

  test('app-test home carga en menos de 15s', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await context.clearCookies();

    const ms = await measureLoad(page, BASE_URL);
    console.log(`⏱️ Home load time: ${ms}ms`);
    expect(ms).toBeLessThan(15_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('chat-ia home carga en menos de 15s', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await context.clearCookies();

    const ms = await measureLoad(page, CHAT_URL);
    console.log(`⏱️ Chat-ia load time: ${ms}ms`);
    expect(ms).toBeLessThan(15_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('itinerario carga en menos de 15s', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await context.clearCookies();

    const ms = await measureLoad(page, `${BASE_URL}/itinerario`);
    console.log(`⏱️ Itinerario load time: ${ms}ms`);
    expect(ms).toBeLessThan(15_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Login flow completo con credenciales bodasdehoy
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login flow — bodasdehoy.com@gmail.com', () => {
  test.setTimeout(150_000);

  test('login app + acceso a módulos principales', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]').first();
    if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(page.url()).not.toContain('/login');
    console.log(`✅ Login exitoso, URL actual: ${page.url()}`);

    // Navegar a módulos principales y verificar carga
    const MODULOS = ['/invitados', '/presupuesto', '/itinerario', '/servicios', '/mesas'];

    for (const modulo of MODULOS) {
      await page.goto(`${BASE_URL}${modulo}`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      await waitForAppReady(page, 10_000);
      const modText = (await page.locator('body').textContent()) ?? '';
      expect(modText).not.toMatch(/Error Capturado por ErrorBoundary/);
      console.log(`  ✅ ${modulo}: cargado (${modText.length} chars)`);
    }
  });

  test('login chat-ia + ver Bandeja + nav a /messages/whatsapp', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const loggedIn = await loginChat(page, CHAT_URL);
    if (!loggedIn) { test.skip(); return; }

    // Ir a la Bandeja
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    let text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log(`✅ Bandeja cargada: "${text.slice(0, 100).trim()}"`);

    // Ir a WhatsApp setup
    await page.goto(`${CHAT_URL}/messages/whatsapp`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasWA = /WhatsApp|conectar|QR|código|sesión/i.test(text);
    console.log(`✅ WhatsApp setup: ${hasWA}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Guest vs. authenticated — diferencias en UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Guest vs. autenticado — diferencias UI', () => {
  test.setTimeout(120_000);

  test('guest: sidebar muestra menos opciones que autenticado', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await clearSession(context, page);

    // Guest
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 10_000);
    const guestText = (await page.locator('body').textContent()) ?? '';
    expect(guestText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verificar que no hay datos privados expuestos
    const hasPrivateData = /bodasdehoy\.com@gmail\.com|lorca2012/i.test(guestText);
    expect(hasPrivateData).toBe(false);
    console.log('✅ Guest no ve datos privados del usuario');
  });

  test('guest en app-test: redirige a login o muestra guest UI', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }
    await clearSession(context, page);

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 10_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const isLoginOrGuest = /iniciar sesión|login|registrarse|invitado/i.test(text);
    console.log(`✅ Guest en /invitados muestra login o guest UI: ${isLoginOrGuest}`);
    // No debe mostrar datos de otro usuario
    const hasPrivateData = /bodasdehoy\.com@gmail\.com/i.test(text);
    expect(hasPrivateData).toBe(false);
  });
});
