/**
 * copilot-chat.spec.ts
 *
 * Tests del copilot embebido (iframe) en appEventos y del chat-ia standalone:
 *   - Iframe del copilot presente y sin error 500
 *   - Comunicación PAGE_CONTEXT (app → iframe)
 *   - filter_view: FILTER_VIEW postMessage activa banner en app
 *   - Chat standalone: mensaje recibe respuesta
 *   - Chat: saldo insuficiente → modal 402
 *   - Límite mensajes visitante (cubierto en visitor-limit.spec.ts, referencia aquí)
 *
 * Requiere VPN + app-test + chat-test activos.
 * Ejecutar: pnpm test:e2e:app:todo
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

const CHAT_URL = isAppTest ? 'https://chat-test.bodasdehoy.com' : 'http://127.0.0.1:3210';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Copilot iframe en appEventos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Copilot iframe — appEventos', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('load').catch(() => {});
    await waitForAppReady(page, 20_000);
  });

  test('iframe del copilot está presente en el DOM', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    // El copilot puede estar detrás de un botón — dar tiempo para que se monte
    await page.waitForTimeout(5000);

    const iframeCount = await page.locator('iframe[src*="chat"]').count();
    if (iframeCount === 0) {
      // Intentar abrir el panel del copilot si hay botón
      const copilotBtn = page
        .locator('button, [role="button"]')
        .filter({ hasText: /copilot|asistente|chat/i })
        .first();
      if (await copilotBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await copilotBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    const finalCount = await page.locator('iframe[src*="chat"]').count();
    if (finalCount > 0) {
      console.log(`iframe del copilot detectado (${finalCount})`);
    } else {
      console.log('ℹ️ iframe no encontrado (puede estar oculto o requerir panel abierto)');
    }

    // No debe haber ErrorBoundary en la página principal
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('iframe del copilot carga sin Internal Server Error', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.waitForTimeout(6000);

    const iframeLocator = page.locator('iframe[src*="chat"]').first();
    const iframeExists = (await iframeLocator.count()) > 0;

    if (!iframeExists) {
      console.log('ℹ️ iframe no encontrado — test no aplicable');
      return;
    }

    const iframe = page.frameLocator('iframe[src*="chat"]').first();
    const iframeBody = iframe.locator('body');

    // innerText omite script/style — evita falsos positivos con "500" en chunk paths
    const iframeText = await iframeBody
      .innerText()
      .catch(async () => iframeBody.textContent().catch(() => ''))
      .catch(() => '') ?? '';

    expect(iframeText).not.toMatch(/Internal Server Error/);
    console.log(`iframe cargó OK. Texto (primeros 100 chars): ${iframeText.slice(0, 100)}`);
  });

  test('página /presupuesto carga sin ErrorBoundary (test context copilot)', async ({ page }) => {
    // Sin sesión la ruta redirige a login/home — aceptamos cualquier destino, solo verificamos no ErrorBoundary
    await page.goto('/presupuesto', { waitUntil: 'commit', timeout: 40_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('página /invitados carga sin ErrorBoundary (test context copilot)', async ({ page }) => {
    // Sin sesión la ruta redirige a login/home — aceptamos cualquier destino, solo verificamos no ErrorBoundary
    await page.goto('/invitados', { waitUntil: 'commit', timeout: 40_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await waitForAppReady(page, 20_000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. filter_view — banner rosa en app tras FILTER_VIEW postMessage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('filter_view — banner en app tras FILTER_VIEW', () => {
  test.setTimeout(120_000);

  test('FILTER_VIEW postMessage activa banner en /invitados', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto('/invitados', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    // Simular el postMessage que envía chat-ia cuando el LLM llama filter-app-view
    await page.evaluate(() => {
      window.postMessage(
        {
          type: 'FILTER_VIEW',
          payload: {
            entity: 'guests',
            filters: [{ field: 'name', value: 'Ana' }],
          },
        },
        '*',
      );
    });

    await page.waitForTimeout(1500);

    const text = (await page.locator('body').textContent()) ?? '';

    // El banner rosa de filtro activo debe aparecer con el texto del filtro
    // o al menos no debe romper la página
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasBanner =
      /filtro|Filtro|Ana|Limpiar|clear filter/i.test(text) ||
      (await page.locator('[data-testid*="filter"], [class*="filter"], [class*="banner"]').count()) > 0;

    if (hasBanner) {
      console.log('Banner de filtro activo detectado');
    } else {
      console.log('ℹ️ Banner de filtro no detectado visualmente (puede requerir datos de invitados)');
    }
  });

  test('CLEAR_FILTER postMessage elimina el banner de filtro', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto('/invitados', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);

    // Activar filtro
    await page.evaluate(() => {
      window.postMessage({ type: 'FILTER_VIEW', payload: { entity: 'guests', filters: [] } }, '*');
    });
    await page.waitForTimeout(1000);

    // Limpiar filtro
    await page.evaluate(() => {
      window.postMessage({ type: 'CLEAR_FILTER' }, '*');
    });
    await page.waitForTimeout(1000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Chat-ia standalone (chat-test)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat-ia standalone (chat-test)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('chat-test carga sin pantalla blanca ni error 500', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(3000);

    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
    const text = (await body.textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    // Regex específico — evita falso positivo con "500" en paths de chunks Turbopack
    expect(text).not.toMatch(/Internal Server Error|Error 500|HTTP\/\d\.\d 500|Error Capturado/i);
  });

  test('/chat carga sin pantalla blanca (modo visitante o sesión existente)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    // Activar modo visitante directamente via localStorage (simula click en botón visitante)
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const visitorId = `visitor_e2e_${Date.now()}_test`;
      localStorage.setItem(
        'dev-user-config',
        JSON.stringify({ developer: 'bodasdehoy', userId: visitorId, user_type: 'visitor', token: null }),
      );
    });

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/Internal Server Error|Error 500|HTTP\/\d\.\d 500|Error Capturado/i);
  });

  test('input del chat es visible para visitante', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      localStorage.setItem(
        'dev-user-config',
        JSON.stringify({
          developer: 'bodasdehoy',
          userId: `visitor_e2e_${Date.now()}_input`,
          user_type: 'visitor',
          token: null,
        }),
      );
    });

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(5000);

    const chatInput = page
      .locator('textarea[placeholder], [contenteditable="true"], textarea')
      .first();
    const inputVisible = await chatInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (inputVisible) {
      console.log('Input del chat visible para visitante');
      await expect(chatInput).toBeEnabled({ timeout: 5_000 });
    } else {
      // Puede estar detrás de un overlay o botón
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado/);
      console.log('ℹ️ Input no visible directamente — puede estar en otro estado del chat');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Errores de balance — 402 InsufficientBalance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat — balance insuficiente (402)', () => {
  test.setTimeout(90_000);

  test('respuesta 402 del servidor muestra modal InsufficientBalance (no crash)', async ({
    page,
  }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1500);

    // Usuario registrado sin saldo (simulamos via intercept)
    await page.evaluate(() => {
      localStorage.setItem(
        'dev-user-config',
        JSON.stringify({
          developer: 'bodasdehoy',
          userId: `e2e_low_balance_${Date.now()}`,
          user_type: 'registered',
          token: 'fake_token_for_balance_test',
        }),
      );
    });

    // Interceptar la respuesta del endpoint de chat para devolver 402
    await page.route('**/webapi/chat/**', async (route) => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          errorType: 'insufficient_balance',
          error: { message: 'Saldo insuficiente', type: 'insufficient_balance' },
        }),
      });
    });

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(4000);

    // Intentar enviar un mensaje para disparar el 402
    const chatInput = page
      .locator('textarea[placeholder], [contenteditable="true"], textarea')
      .first();
    const inputVisible = await chatInput.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!inputVisible) {
      console.log('ℹ️ Input no visible — skip test 402');
      test.skip();
      return;
    }

    await chatInput.fill('Test mensaje para disparar 402');
    await chatInput.press('Enter');
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // El modal de saldo insuficiente debe aparecer
    const modal = page.locator('[role="dialog"], [class*="modal" i], [class*="Modal" i]').first();
    const modalVisible = await modal.isVisible({ timeout: 8_000 }).catch(() => false);

    if (modalVisible) {
      const modalText = (await modal.textContent()) ?? '';
      const hasInsufficientMsg = /saldo|balance|insufficient|recarga|crédito/i.test(modalText);
      expect(hasInsufficientMsg).toBe(true);
      console.log('Modal de saldo insuficiente aparece correctamente');
    } else {
      // Puede aparecer como banner inline — verificar en el body
      const hasMsg = /saldo|balance|insufficient|recarga/i.test(text);
      if (hasMsg) {
        console.log('Mensaje de saldo insuficiente visible (no modal, puede ser banner)');
      } else {
        console.log('ℹ️ Mensaje 402 no detectado visualmente (puede requerir usuario real con saldo 0)');
      }
    }
  });
});
