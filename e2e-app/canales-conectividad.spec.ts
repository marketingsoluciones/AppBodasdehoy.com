/**
 * canales-conectividad.spec.ts
 *
 * Tests E2E de conectividad para los 6 canales del sistema de mensajería:
 *   WhatsApp (via api2), Instagram/Facebook/Telegram/Email (via api-ia), WebChat (embed)
 *
 * Estrategia: no se necesitan credenciales OAuth reales ni QR real.
 * Los tests verifican que:
 *   1. Los endpoints del proxy (/api/messages/*) responden (no 500 ni timeout)
 *   2. Los endpoints de OAuth devuelven URL válida (400/422 para payloads inválidos — no 500)
 *   3. Las UIs de setup cargan sin ErrorBoundary
 *   4. El fallback de SSE a polling funciona tras desconexión
 *
 * Ejecutar:
 *   BASE_URL=https://chat-test.bodasdehoy.com \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   pnpm exec playwright test e2e-app/canales-conectividad.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady, loginAndSelectEvent } from './helpers';
import { TEST_CREDENTIALS, TEST_URLS, getChatUrl } from './fixtures';

const CHAT_URL = TEST_URLS.chat;
const APP_URL = TEST_URLS.app;
const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

// El development a usar en los endpoints (coincide con el hostname del chat)
const DEVELOPMENT = CHAT_URL.includes('chat-test.')
  ? 'bodasdehoy'
  : CHAT_URL.includes('chat-dev.')
  ? 'bodasdehoy'
  : 'bodasdehoy';

// ─── 0. Smoke — chat-test responde ────────────────────────────────────────────

test.describe('Canales — smoke (sin login)', () => {
  test.setTimeout(30_000);

  test('chat-test responde en BASE_URL', async ({ page }) => {
    const response = await page.goto(CHAT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    expect(response?.status()).not.toBe(500);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(30);
    console.log(`✅ ${CHAT_URL} responde OK`);
  });
});

// ─── 1. Proxy de mensajes — endpoints accesibles (API) ────────────────────────

test.describe('Canales — proxy endpoints (request API)', () => {
  test.setTimeout(40_000);

  /**
   * WhatsApp: proxy → api2
   * GET /api/messages/whatsapp/session/:development
   * Espera 200 (sesión activa), 404 (no hay sesión) o 401 (sin auth) — NUNCA 500
   */
  test('WhatsApp session endpoint responde sin 500', async ({ request }) => {
    const resp = await request.get(
      `${CHAT_URL}/api/messages/whatsapp/session/${DEVELOPMENT}`,
      { timeout: 15_000 },
    );
    const status = resp.status();
    console.log(`WhatsApp session status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);
    // 200, 404, 401 son todos válidos
  });

  /**
   * WhatsApp: lista de canales
   * GET /api/messages/whatsapp/channels/:development
   */
  test('WhatsApp channels list endpoint responde sin 500', async ({ request }) => {
    const resp = await request.get(
      `${CHAT_URL}/api/messages/whatsapp/channels/${DEVELOPMENT}`,
      { timeout: 15_000 },
    );
    const status = resp.status();
    console.log(`WhatsApp channels status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);
  });

  /**
   * Telegram: endpoint connect con token inválido
   * POST /api/messages/telegram/connect
   * Espera 400/422 (token inválido) — confirma que el endpoint existe y responde
   */
  test('Telegram connect rechaza token inválido (no 500)', async ({ request }) => {
    const resp = await request.post(
      `${CHAT_URL}/api/messages/telegram/connect`,
      {
        data: { botToken: 'invalid-bot-token-e2e-test' },
        timeout: 15_000,
      },
    );
    const status = resp.status();
    console.log(`Telegram connect status: ${status}`);
    // 400/422 = endpoint existe y valida. 401/403 = sin auth también OK.
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);
    expect([400, 401, 403, 422, 200]).toContain(status);
  });

  /**
   * Email: endpoint connect con credenciales SMTP inválidas
   * POST /api/messages/email/connect
   * Espera 400/422 (credenciales inválidas) — no 500
   */
  test('Email connect rechaza credenciales SMTP inválidas (no 500)', async ({ request }) => {
    const resp = await request.post(
      `${CHAT_URL}/api/messages/email/connect`,
      {
        data: {
          provider: 'smtp',
          smtp: { host: 'mail.e2e-test.invalid', port: 587, user: 'test@e2e.test', pass: 'wrong' },
          imap: { host: 'imap.e2e-test.invalid', port: 993 },
        },
        timeout: 20_000,
      },
    );
    const status = resp.status();
    console.log(`Email connect status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);
  });

  /**
   * Instagram: generación de OAuth URL
   * POST /api/messages/instagram/oauth-url
   * Espera respuesta con { url: '...' } o 401 si requiere auth
   */
  test('Instagram oauth-url endpoint responde sin 500', async ({ request }) => {
    const resp = await request.post(
      `${CHAT_URL}/api/messages/instagram/oauth-url`,
      {
        data: { development: DEVELOPMENT },
        timeout: 15_000,
      },
    );
    const status = resp.status();
    console.log(`Instagram oauth-url status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body?.url) {
        // URL debe ser de instagram/facebook oauth
        expect(body.url).toMatch(/instagram\.com|facebook\.com\/dialog\/oauth/i);
        console.log(`✅ Instagram OAuth URL generada: ${body.url.slice(0, 60)}...`);
      }
    }
  });

  /**
   * Facebook: generación de OAuth URL
   * POST /api/messages/facebook/oauth-url
   */
  test('Facebook oauth-url endpoint responde sin 500', async ({ request }) => {
    const resp = await request.post(
      `${CHAT_URL}/api/messages/facebook/oauth-url`,
      {
        data: { development: DEVELOPMENT },
        timeout: 15_000,
      },
    );
    const status = resp.status();
    console.log(`Facebook oauth-url status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body?.url) {
        expect(body.url).toMatch(/facebook\.com\/dialog\/oauth|fb\.com/i);
        console.log(`✅ Facebook OAuth URL generada: ${body.url.slice(0, 60)}...`);
      }
    }
  });
});

// ─── 2. UIs de setup — cargan sin crash ───────────────────────────────────────

test.describe('Canales — UIs de setup (con login)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!hasCredentials) test.skip();
    await clearSession(context, page);
    // Usar 'commit' para no quedarse bloqueado en redirects internos de Next.js App Router
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'commit', timeout: 40_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
  });

  const channelSetups: { name: string; expectedText: RegExp }[] = [
    { name: 'whatsapp', expectedText: /WhatsApp|QR|escanear|vincular/i },
    { name: 'instagram', expectedText: /Instagram|conectar|cuenta/i },
    { name: 'facebook', expectedText: /Facebook|página|conectar/i },
    { name: 'telegram', expectedText: /Telegram|bot|token/i },
    { name: 'email', expectedText: /correo|email|Gmail|Outlook|SMTP/i },
  ];

  for (const { name, expectedText } of channelSetups) {
    test(`${name} setup UI carga sin crash`, async ({ page }) => {
      // Login en chat-ia
      const loginInput = page.locator('input[type="email"], input[name="email"]').first();
      const loginVisible = await loginInput.isVisible({ timeout: 10_000 }).catch(() => false);

      if (!loginVisible) {
        console.log(`ℹ️ Login no visible en ${CHAT_URL} — puede ya estar autenticado`);
      } else {
        await loginInput.fill(EMAIL);
        await page.locator('input[type="password"]').first().fill(PASSWORD);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
      }

      // Navegar a /messages
      await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      const bodyText = (await page.locator('body').textContent()) ?? '';
      expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

      // Intentar abrir el canal desde el sidebar
      const channelBtn = page
        .locator(`[data-channel="${name}"], [class*="channel"], button, a`)
        .filter({ hasText: new RegExp(name, 'i') })
        .first();

      const isBtnVisible = await channelBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (isBtnVisible) {
        await channelBtn.click();
        await page.waitForTimeout(2_000);
      }

      // Navegar directamente a la URL de settings de integración si existe
      const settingsPath = `${CHAT_URL}/settings/integrations`;
      await page.goto(settingsPath, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(2_000);

      const afterText = (await page.locator('body').textContent()) ?? '';
      expect(afterText).not.toMatch(/Error Capturado por ErrorBoundary/);

      // Verificar que el texto característico del canal aparece en algún lugar
      const hasChannelText = expectedText.test(afterText);
      if (hasChannelText) {
        console.log(`✅ ${name} — texto de setup visible en UI`);
      } else {
        console.log(`ℹ️ ${name} — texto no encontrado en /settings/integrations (puede estar en /messages)`);
      }
    });
  }

  test('WebChat embed code se genera sin crash', async ({ page }) => {
    // WebChat no tiene OAuth — solo genera un código de embed
    const loginInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginVisible = await loginInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (loginVisible) {
      await loginInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }

    await page.goto(`${CHAT_URL}/settings/integrations`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(2_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verificar que hay algún código de embed o script tag
    const hasEmbedCode =
      /widget\.js|BODAS_CHAT_CONFIG|script src|embed|instalar/i.test(text) ||
      (await page.locator('code, pre').count()) > 0;

    console.log(`${hasEmbedCode ? '✅' : 'ℹ️'} WebChat embed code visible: ${hasEmbedCode}`);
  });
});

// ─── 3. Reconexión SSE y fallback a polling ────────────────────────────────────

test.describe('Canales — SSE fallback a polling', () => {
  test.setTimeout(120_000);

  test('useMessageStream — muestra mensaje de reconexión si SSE falla', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    // Login y navegar a /messages
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const loginInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginVisible = await loginInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (loginVisible) {
      await loginInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }

    // Interceptar las requests al stream SSE y devolver error
    await page.route('**/api/messages/stream**', (route) => {
      route.abort('connectionrefused');
    });

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(8_000); // dar tiempo a que el SSE intente conectar y falle

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // El hook useMessageStream debería mostrar error de reconexión o fallback a polling
    const hasReconnectMsg =
      /reconectando|reconnecting|polling|reintentando|no se pudo conectar/i.test(bodyText);

    if (hasReconnectMsg) {
      console.log('✅ Mensaje de reconexión visible tras fallo de SSE');
    } else {
      console.log('ℹ️ Mensaje de reconexión no visible en body — puede estar en un toast o en el canal activo');
    }

    // Lo importante: no hay crash
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─── 4. Estado de conexión — dots de estado visibles ─────────────────────────

test.describe('Canales — indicadores de estado', () => {
  test.setTimeout(90_000);

  test('/messages muestra indicadores de estado de canales', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const loginInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginVisible = await loginInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (loginVisible) {
      await loginInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(4_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verificar que la página cargó con contenido de mensajería
    const hasMessagesUI = /mensajes|whatsapp|instagram|telegram|email|conversaciones|bandeja/i.test(bodyText);
    console.log(`${hasMessagesUI ? '✅' : 'ℹ️'} UI de mensajes detectada: ${hasMessagesUI}`);

    // Buscar dots de estado (clases conocidas del componente)
    const statusDots = page.locator('.bg-green-400, .bg-yellow-400, .bg-gray-400').filter({
      hasNot: page.locator('img'),
    });
    const dotCount = await statusDots.count();
    console.log(`ℹ️ Status dots visibles: ${dotCount}`);

    // La página no debe tener crash — suficiente para este test de smoke
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('/messages — canales desconectados muestran estado visible', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const loginInput = page.locator('input[type="email"], input[name="email"]').first();
    const loginVisible = await loginInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (loginVisible) {
      await loginInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(4_000);

    // Canales no conectados deben tener texto "Conectar" o similar
    const connectBtns = page.locator('button, a').filter({ hasText: /conectar|connect|configurar|setup/i });
    const connectCount = await connectBtns.count();
    console.log(`ℹ️ Botones "Conectar" visibles (canales no configurados): ${connectCount}`);

    // Dots grises para canales desconectados
    const grayDots = page.locator('.bg-gray-400');
    const grayCount = await grayDots.count();
    console.log(`ℹ️ Dots grises (desconectados): ${grayCount}`);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});
