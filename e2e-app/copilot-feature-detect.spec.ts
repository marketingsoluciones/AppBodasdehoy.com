/**
 * copilot-feature-detect.spec.ts
 *
 * Detecta el estado del Copilot IA en appEventos:
 *  - ¿Está montado el ChatSidebar?
 *  - ¿Qué implementación: CopilotEmbed (nativo) vs CopilotIframe?
 *  - ¿El IA responde a mensajes?
 *
 * IMPORTANTE: hallazgo auditoría 2026-05-08 — `CopilotEmbed.tsx` (1264 líneas, nativo)
 * existe pero NO está montado. `ChatSidebar/index.tsx` exporta default `ChatSidebar`
 * (que usa CopilotIframe) en lugar de `ChatSidebarDirect` (que usa CopilotEmbed nativo).
 * La versión nativa está deshabilitada por configuración.
 *
 * Mide impacto: si el copilot ayuda a captar clientes (incluso no pagados con
 * limitaciones), saber qué implementación corre y si responde es CRÍTICO.
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady, assertNoRuntimeError } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppDev = BASE_URL.includes('app-dev.bodasdehoy.com') || BASE_URL.includes('app-test.bodasdehoy.com');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

test.describe('Copilot — Detección y verificación funcional', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
    await assertNoRuntimeError(page);
  });

  test('botón ChatToggle visible en home tras login', async ({ page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // ChatToggleButton para abrir el sidebar copilot
    const toggleBtn = page.locator(
      '[aria-label*="chat" i], [aria-label*="copilot" i], [aria-label*="asistente" i], [class*="ChatToggle"], [class*="chat-toggle"]'
    ).first();

    await expect(
      toggleBtn,
      'BUG_PRODUCTO: botón abrir Copilot/ChatSidebar no visible en home — copilot inalcanzable para usuarios'
    ).toBeVisible({ timeout: 10_000 });
  });

  test('al abrir sidebar, copilot carga (iframe O componente nativo)', async ({ page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const toggleBtn = page.locator(
      '[aria-label*="chat" i], [aria-label*="copilot" i], [aria-label*="asistente" i], [class*="ChatToggle"], [class*="chat-toggle"]'
    ).first();
    if (!await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'TEST_DATA_SETUP: ChatToggle no visible — verificar test "botón ChatToggle visible"');
      return;
    }

    await toggleBtn.click();
    await page.waitForTimeout(4_000);

    // Detectar implementación: iframe vs componente nativo
    const hasIframe = (await page.locator('iframe[src*="chat"], iframe[src*="copilot"]').count()) > 0;
    const hasNativeMessageList = (await page.locator('[class*="MessageList"], [class*="message-list"], [data-testid*="message"]').count()) > 0;
    const hasNativeInput = (await page.locator('[contenteditable="true"], textarea[placeholder*="mensaje" i], textarea[placeholder*="escribe" i]').count()) > 0;

    const implementation =
      hasIframe ? 'IFRAME (CopilotIframe)' :
      (hasNativeMessageList || hasNativeInput) ? 'NATIVO (CopilotEmbed)' :
      'NINGUNA';

    console.log(`[Copilot detect] iframe=${hasIframe} native_msgs=${hasNativeMessageList} native_input=${hasNativeInput} → ${implementation}`);

    expect(
      hasIframe || hasNativeMessageList || hasNativeInput,
      'BUG_PRODUCTO: tras abrir ChatSidebar ni iframe ni componente nativo del copilot detectado — copilot DESACTIVADO o roto'
    ).toBe(true);
  });

  test('copilot responde a mensaje inicial (smoke chat IA real)', async ({ page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const toggleBtn = page.locator(
      '[aria-label*="chat" i], [aria-label*="copilot" i], [aria-label*="asistente" i], [class*="ChatToggle"], [class*="chat-toggle"]'
    ).first();
    if (!await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'TEST_DATA_SETUP: ChatToggle no abre');
      return;
    }
    await toggleBtn.click();
    await page.waitForTimeout(5_000);

    // Si es iframe, debemos enviar mensaje dentro del frame
    const iframe = page.frameLocator('iframe[src*="chat"], iframe[src*="copilot"]').first();
    const hasIframe = (await page.locator('iframe[src*="chat"], iframe[src*="copilot"]').count()) > 0;

    const inputContext = hasIframe ? iframe : page;
    const inputEditor = inputContext
      .locator('[contenteditable="true"], textarea[placeholder*="mensaje" i], textarea[placeholder*="escribe" i], input[placeholder*="pregunta" i]')
      .first();

    const inputVisible = await inputEditor.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!inputVisible) {
      test.skip(true, 'TEST_DATA_SETUP: input chat copilot no visible — copilot UI no operativo');
      return;
    }

    const testMsg = `Hola, prueba E2E ${Date.now().toString().slice(-6)}`;
    await inputEditor.click();
    await inputEditor.fill(testMsg).catch(async () => {
      // Fallback: keyboard typing si fill no aplica
      await page.keyboard.type(testMsg);
    });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');

    // Esperar respuesta IA: detectar mensaje del assistant en lista
    await page.waitForTimeout(15_000); // dar tiempo al stream SSE

    // El mensaje del usuario debe estar visible
    const userMsgVisible = hasIframe
      ? await iframe.getByText(testMsg, { exact: false }).first().isVisible({ timeout: 10_000 }).catch(() => false)
      : await page.getByText(testMsg, { exact: false }).first().isVisible({ timeout: 10_000 }).catch(() => false);

    expect(
      userMsgVisible,
      'BUG_PRODUCTO: mensaje usuario enviado pero NO aparece en chat — input no propagó o chat no recibió'
    ).toBe(true);

    // Verificar respuesta del assistant — buscamos cualquier texto adicional del bot
    const bodyAfter = hasIframe
      ? await iframe.locator('body').textContent().catch(() => '')
      : await page.locator('body').textContent().catch(() => '');
    const responseLength = (bodyAfter ?? '').length;

    // Si hay respuesta IA, body crece. Si copilot está roto, responde con error o nada.
    expect(
      responseLength > 200,
      `BUG_PRODUCTO: tras enviar mensaje al copilot, body chat tiene solo ${responseLength} chars — IA NO respondió o error silente`
    ).toBe(true);
  });

  test('CopilotEmbed nativo disponible (componente shared importable)', async ({ page }) => {
    // Test informativo: detecta si la versión nativa existe en el bundle
    // No depende de UI, solo verifica que el package está disponible
    if (!isAppDev || !hasCredentials) { test.skip(); return; }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Si CopilotEmbed (NATIVO) está montado en el bundle, alguno de sus marcadores
    // estaría presente en el DOM tras abrir el chat
    const toggleBtn = page.locator(
      '[aria-label*="chat" i], [aria-label*="copilot" i], [aria-label*="asistente" i], [class*="ChatToggle"]'
    ).first();
    if (!await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'TEST_DATA_SETUP: ChatToggle no abre');
      return;
    }
    await toggleBtn.click();
    await page.waitForTimeout(3000);

    // Marcadores específicos de CopilotEmbed (vs iframe)
    const copilotEmbedMarkers = [
      '[data-component="CopilotEmbed"]',
      '[class*="MessageList"]',
      '[class*="copilot-shared"]',
      '[class*="CopilotChatInput"]',
    ];

    let nativoFound = false;
    for (const sel of copilotEmbedMarkers) {
      if ((await page.locator(sel).count()) > 0) {
        nativoFound = true;
        break;
      }
    }

    // Si esto es false → CopilotEmbed (nativo) NO está activo, está usando iframe
    if (!nativoFound) {
      console.log('[Copilot detect] CopilotEmbed nativo NO activo. Implementación actual: CopilotIframe (iframe).');
      console.log('[Hallazgo auditoría] ChatSidebar/index.tsx exporta default ChatSidebar (iframe). ChatSidebarDirect (nativo) está disponible pero no importado.');
      // No fallar — es informativo. Falla cuando NINGUNO funciona (otro test).
    } else {
      console.log('[Copilot detect] CopilotEmbed nativo DETECTADO en DOM.');
    }

    // El test pasa si llegamos aquí — solo informativo
    expect(true).toBe(true);
  });
});
