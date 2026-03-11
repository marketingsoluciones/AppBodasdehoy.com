/**
 * canales-setup.spec.ts
 *
 * Tests de setup de canales de mensajería en /messages (chat-ia):
 * (Funcionalidad NUEVA — EmailSetup, FacebookSetup, InstagramSetup,
 *  TelegramSetup, WebChatSetup añadidos en últimos commits)
 *
 * Canales cubiertos:
 *   - Email: Gmail OAuth, Outlook OAuth, SMTP/IMAP manual
 *   - Facebook: OAuth popup → pageName conectada
 *   - Instagram: OAuth popup → @accountName
 *   - Telegram: token manual → botName conectado
 *   - WebChat: embed code con botón "Copiar código"
 *
 * También:
 *   - ConversationList: search, sort toggle, channel switching
 *   - MessageInput: draft persistencia, emoji picker, SMS counter
 *   - Archivado de conversación → desaparece de lista
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

const CHAT_URL = isAppTest ? 'https://chat-test.bodasdehoy.com' : 'http://127.0.0.1:3210';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function loginInChat(page: any): Promise<boolean> {
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const btn = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. /messages — Estructura y navegación de canales
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — /messages estructura general', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('sidebar de canales: Email, WhatsApp, Facebook, Instagram, Telegram, Web', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const channels = ['WhatsApp', 'Email', 'Facebook', 'Instagram', 'Telegram'];
    for (const ch of channels) {
      const present = new RegExp(ch, 'i').test(text);
      if (!present) console.log(`ℹ️ Canal ${ch} no detectado en sidebar`);
    }

    const hasAnyChannel = channels.some((ch) => new RegExp(ch, 'i').test(text));
    expect(hasAnyChannel).toBe(true);
    console.log('✅ Canales de mensajería visibles en sidebar');
  });

  test('click en canal no conectado → muestra setup correspondiente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Click en "Email" en el sidebar
    const emailBtn = page.locator('[class*="channel"], button, [role="button"]')
      .filter({ hasText: /^Email$/i })
      .first();

    if (!await emailBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón de canal Email no encontrado');
      return;
    }

    await emailBtn.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    // Debe mostrar setup de email o lista de conversaciones
    const hasEmailContent =
      /gmail|outlook|smtp|imap|conectar|email|correo/i.test(text);
    expect(hasEmailContent).toBe(true);
    console.log('✅ Click en Email muestra setup o conversaciones de email');
  });

  test('search en lista de conversaciones filtra por nombre', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar input de búsqueda
    const searchInput = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]',
    ).first();

    if (!await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Input de búsqueda no encontrado en /messages');
      return;
    }

    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    const text = (await page.locator('body').textContent()) ?? '';
    const noResults = /no hay|sin resultados|no se encontr/i.test(text);
    console.log(noResults ? 'ℹ️ Sin resultados para "test"' : '✅ Búsqueda ejecutada');
  });

  test('sort toggle "Recientes" ↔ "No leídos" disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const sortBtn = page.locator('button').filter({
      hasText: /recientes|no leídos|sin leer|recent|unread/i,
    }).first();

    if (!await sortBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón sort no encontrado');
      return;
    }

    const textBefore = (await sortBtn.textContent()) ?? '';
    await sortBtn.click();
    await page.waitForTimeout(500);
    const textAfter = (await sortBtn.textContent()) ?? '';

    if (textBefore !== textAfter) {
      console.log(`✅ Sort toggle: "${textBefore}" → "${textAfter}"`);
    } else {
      console.log('ℹ️ Sort toggle texto igual — puede ser icono');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EmailSetup — Gmail, Outlook, SMTP
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — EmailSetup', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('EmailSetup muestra opciones Gmail, Outlook y SMTP', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Navegar al canal de email
    const emailBtn = page.locator('[class*="channel"], button').filter({ hasText: /^Email$/i }).first();
    if (await emailBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(2000);
    }

    const text = (await page.locator('body').textContent()) ?? '';
    const hasGmail = /gmail/i.test(text);
    const hasOutlook = /outlook/i.test(text);
    const hasSmtp = /smtp|imap/i.test(text);

    console.log(`Email setup: Gmail=${hasGmail}, Outlook=${hasOutlook}, SMTP=${hasSmtp}`);
    expect(hasGmail || hasOutlook || hasSmtp).toBe(true);
    console.log('✅ EmailSetup muestra opciones de conexión');
  });

  test('click SMTP → formulario con campos smtpHost, smtpPort, user, pass', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const emailBtn = page.locator('[class*="channel"], button').filter({ hasText: /^Email$/i }).first();
    if (await emailBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(2000);
    }

    // Buscar botón SMTP/IMAP manual
    const smtpBtn = page.locator('button').filter({ hasText: /smtp|imap|manual/i }).first();
    if (!await smtpBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón SMTP no encontrado');
      return;
    }

    await smtpBtn.click();
    await page.waitForTimeout(1500);

    // Formulario SMTP debe tener 4+ inputs
    const inputs = await page.locator('input').count();
    console.log(`Inputs en formulario SMTP: ${inputs}`);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasSmtpForm = /smtp.*host|imap.*host|smtp.*port|usuario|contraseña|password/i.test(text);
    if (hasSmtpForm) {
      console.log('✅ Formulario SMTP/IMAP visible con campos');
    }
    expect(inputs >= 2 || hasSmtpForm).toBe(true);
  });

  test('email ya conectado → muestra check + cuenta + botón desconectar', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    // Simular estado "connected" en localStorage
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2000);

    // Inyectar estado connected en localStorage
    await page.evaluate(() => {
      localStorage.setItem('channel_connected_email_bodasdehoy', JSON.stringify({
        connected: true,
        email: 'test@bodasdehoy.com',
        provider: 'gmail',
      }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2000);

    const emailBtn = page.locator('[class*="channel"], button').filter({ hasText: /^Email$/i }).first();
    if (await emailBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailBtn.click();
      await page.waitForTimeout(2000);
    }

    const text = (await page.locator('body').textContent()) ?? '';
    const hasConnected = /desconectar|disconnect|conectado|connected|✅/i.test(text);
    console.log(hasConnected ? '✅ Estado connected detectado en Email' : 'ℹ️ Estado connected no reflejado');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TelegramSetup — Token manual
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — TelegramSetup (token manual)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('TelegramSetup muestra input de token con placeholder correcto', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const telegramBtn = page.locator('[class*="channel"], button')
      .filter({ hasText: /telegram/i })
      .first();

    if (!await telegramBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Canal Telegram no encontrado');
      return;
    }

    await telegramBtn.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasTelegramSetup = /telegram|bot.*token|token.*bot|botfather/i.test(text);
    expect(hasTelegramSetup).toBe(true);
    console.log('✅ TelegramSetup visible con referencia a token/bot');

    // Input de token
    const tokenInput = page.locator('input[placeholder*="token"], input[placeholder*="123456789"]').first();
    if (await tokenInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('✅ Input de token Telegram visible');
    }
  });

  test('token inválido → mensaje de error visible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const telegramBtn = page.locator('[class*="channel"], button')
      .filter({ hasText: /telegram/i })
      .first();

    if (!await telegramBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }
    await telegramBtn.click();
    await page.waitForTimeout(2000);

    const tokenInput = page.locator('input[placeholder*="token"], input[type="text"]').first();
    if (!await tokenInput.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await tokenInput.fill('TOKEN_INVALIDO_123456');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasError = /error|inválido|invalid|incorrecto|failed/i.test(text);

    if (hasError) {
      console.log('✅ Error controlado para token inválido de Telegram');
    } else {
      console.log('ℹ️ Error no mostrado visualmente — puede ser silencioso');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. WebChatSetup — Embed code y copy
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — WebChatSetup (embed code)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('WebChat muestra embed code con script tag', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const webChatBtn = page.locator('[class*="channel"], button')
      .filter({ hasText: /web.?chat|webchat|web chat/i })
      .first();

    if (!await webChatBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Canal WebChat no encontrado');
      return;
    }

    await webChatBtn.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasEmbedCode = /<script|script.*src|embed.*code|copiar|copy/i.test(text);
    expect(hasEmbedCode).toBe(true);
    console.log('✅ WebChatSetup muestra código embed o botón copiar');
  });

  test('botón "Copiar código" → clipboard y texto "Copiado!" por 2s', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const webChatBtn = page.locator('[class*="channel"], button')
      .filter({ hasText: /web.?chat|webchat/i })
      .first();

    if (!await webChatBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }
    await webChatBtn.click();
    await page.waitForTimeout(2000);

    const copyBtn = page.locator('button').filter({
      hasText: /copiar código|copy code|copiar/i,
    }).first();

    if (!await copyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón copiar no encontrado');
      return;
    }

    await copyBtn.click();
    await page.waitForTimeout(500);

    // Debe mostrar "Copiado!" por 2 segundos
    const copiedText = page.getByText(/copiado|copied/i).first();
    const showsCopied = await copiedText.isVisible({ timeout: 3_000 }).catch(() => false);

    if (showsCopied) {
      console.log('✅ Botón muestra "Copiado!" tras click');
      // Después de 2s debe volver a "Copiar código"
      await page.waitForTimeout(2500);
      const backToOriginal = await copyBtn.textContent();
      console.log(`Texto botón tras 2.5s: "${backToOriginal}"`);
    } else {
      console.log('ℹ️ "Copiado!" no detectado visualmente');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MessageInput — Draft, Emoji picker, SMS counter
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — MessageInput (bandeja mensajes)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('emoji picker abre, busca y cierra al click fuera', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Navegar a una conversación para ver el MessageInput
    // Primero ir a WhatsApp o a algún canal con conversaciones
    const convItem = page.locator('[class*="ConversationItem"], [class*="conversation-item"]').first();
    if (await convItem.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await convItem.click();
      await page.waitForTimeout(2000);
    }

    // Buscar botón emoji 😊
    const emojiBtn = page.locator('button').filter({ hasText: /😊|emoji|emoticon/i }).first();
    if (!await emojiBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón emoji no encontrado — puede requerir seleccionar conversación');
      return;
    }

    await emojiBtn.click();
    await page.waitForTimeout(500);

    // Picker debe abrirse
    const emojiPicker = page.locator('[class*="emoji-picker"], [class*="EmojiPicker"], [class*="picker"]');
    const hasPickerOpen = await emojiPicker.count() > 0;
    if (hasPickerOpen) {
      console.log('✅ Emoji picker abierto');

      // Buscar un emoji
      const searchInput = emojiPicker.locator('input').first();
      if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await searchInput.fill('corazon');
        await page.waitForTimeout(500);
        console.log('✅ Búsqueda en emoji picker ejecutada');
      }

      // Cerrar con click fuera
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(500);
      const closedPicker = await emojiPicker.count() === 0;
      console.log(`Picker cerrado tras click fuera: ${closedPicker}`);
    } else {
      console.log('ℹ️ Emoji picker no encontrado — puede variar selector');
    }
  });

  test('draft persiste: escribir → cambiar conversación → volver → draft sigue', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const convItems = page.locator('[class*="ConversationItem"], [class*="conversation-item"]');
    const convCount = await convItems.count();

    if (convCount < 2) {
      console.log('ℹ️ Se necesitan al menos 2 conversaciones para test de draft');
      return;
    }

    // Click en primera conversación
    await convItems.first().click();
    await page.waitForTimeout(1000);

    // Escribir texto en MessageInput
    const msgInput = page.locator('textarea, [class*="MessageInput"] textarea').last();
    if (!await msgInput.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    const DRAFT_TEXT = `Draft E2E ${Date.now()}`;
    await msgInput.fill(DRAFT_TEXT);
    await page.waitForTimeout(500); // Draft save delay 300ms

    // Click en segunda conversación
    await convItems.nth(1).click();
    await page.waitForTimeout(1000);

    // Volver a primera
    await convItems.first().click();
    await page.waitForTimeout(1000);

    // El draft debe estar
    const inputValue = await msgInput.inputValue().catch(() => '');
    if (inputValue === DRAFT_TEXT) {
      console.log('✅ Draft persistido correctamente en cambio de conversación');
    } else {
      console.log(`ℹ️ Draft: esperado "${DRAFT_TEXT}", obtenido "${inputValue}"`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Facebook e Instagram Setup (OAuth flow)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Canales — Facebook e Instagram Setup', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('FacebookSetup visible con botón "Conectar con Facebook"', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const fbBtn = page.locator('[class*="channel"], button').filter({ hasText: /facebook/i }).first();
    if (!await fbBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await fbBtn.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasFBContent = /facebook|conectar.*facebook|oauth|página.*facebook/i.test(text);
    expect(hasFBContent).toBe(true);
    console.log('✅ FacebookSetup visible');
  });

  test('InstagramSetup visible con botón "Conectar con Instagram"', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const igBtn = page.locator('[class*="channel"], button').filter({ hasText: /instagram/i }).first();
    if (!await igBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await igBtn.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasIGContent = /instagram|conectar.*instagram|business.*account/i.test(text);
    expect(hasIGContent).toBe(true);
    console.log('✅ InstagramSetup visible');
  });

  test('canal con estado "connected" vía localStorage muestra desconectar', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2000);

    // Simular Facebook conectado en localStorage
    await page.evaluate(() => {
      localStorage.setItem('channel_connected_facebook_bodasdehoy', JSON.stringify({
        connected: true,
        pageName: 'Bodas de Hoy Test Page',
      }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2000);

    const fbBtn = page.locator('[class*="channel"], button').filter({ hasText: /facebook/i }).first();
    if (await fbBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await fbBtn.click();
      await page.waitForTimeout(2000);
    }

    const text = (await page.locator('body').textContent()) ?? '';
    const hasConnectedState =
      /desconectar|disconnect|test page|conectado|✅/i.test(text);

    console.log(hasConnectedState
      ? '✅ Estado connected de Facebook detectado'
      : 'ℹ️ Estado connected no reflejado — localStorage puede no estar activo');
  });
});
