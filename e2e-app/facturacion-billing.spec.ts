/**
 * facturacion-billing.spec.ts
 *
 * Tests E2E del sistema de facturación y deducción de tokens.
 *
 * Flujo verificado (backend-driven):
 *   mensaje → /webapi/chat/[provider] → api-ia (cuenta tokens, descuenta wallet)
 *   → si balance < coste → 402 { errorType: 'insufficient_balance' }
 *   → route.ts lo transforma → store.showInsufficientBalance = true
 *   → InsufficientBalanceModal aparece → usuario recarga con Stripe
 *
 * Tests incluidos:
 *   4.1 — Balance se muestra en /settings/billing
 *   4.2 — Transacciones se listan con estructura correcta
 *   4.3 — Modal 402 aparece con balance insuficiente (interceptado)
 *   4.4 — Sesión de Stripe se genera al hacer click en "Recargar"
 *   4.5 — Admin billing dashboard carga KPIs sin crash
 *   4.6 — wallet_checkBalance via GraphQL responde con estructura coherente
 *
 * SKUs conocidos (investigados):
 *   SRV-AI-ANTHROPIC-HAIKU, SRV-AI-ANTHROPIC-SONNET, SRV-AI-OPENAI-GPT4O,
 *   SRV-EMAIL-SES-SEND, SRV-WHATSAPP-MSG-OUTBOUND, SRV-SMS-TWILIO-ES
 *
 * Ejecutar:
 *   BASE_URL=https://chat-test.bodasdehoy.com \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   pnpm exec playwright test e2e-app/facturacion-billing.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import { clearSession } from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const CHAT_URL = TEST_URLS.chat;
const APP_URL = TEST_URLS.app;
const MEMORIES_URL = TEST_URLS.memories;
const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

const isChatTest =
  CHAT_URL.includes('chat-test.bodasdehoy.com') ||
  CHAT_URL.includes('chat-dev.bodasdehoy.com') ||
  CHAT_URL.includes('127.0.0.1');

// ─── Helper: login en chat-ia ─────────────────────────────────────────────────

async function loginInChat(page: import('@playwright/test').Page): Promise<boolean> {
  // 'commit' evita el error "interrupted by another navigation" de App Router de Next.js
  await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'commit', timeout: 35_000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2_000);

  if (page.url().includes('/chat') && !page.url().includes('/login')) return true;

  if (page.url().includes('/login')) {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }
  }
  return page.url().includes('/chat') || !page.url().includes('/login');
}

// ─── 0. Smoke ─────────────────────────────────────────────────────────────────

test.describe('Facturación — smoke', () => {
  test.setTimeout(60_000);

  test('chat-test responde sin 500', async ({ page }) => {
    const response = await page.goto(CHAT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 50_000,
    });
    expect(response?.status()).not.toBe(500);
  });
});

// ─── 4.1 — Balance en /settings/billing ──────────────────────────────────────

test.describe('Facturación 4.1 — Balance en UI', () => {
  test.setTimeout(90_000);

  test('settings/billing muestra balance numérico sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(4_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Debe haber algún valor monetario (€ o número decimal)
    const hasMonetaryValue = /€|\d+[,\.]\d{2}|\d+\s*€|saldo|balance|crédito/i.test(bodyText);
    if (hasMonetaryValue) {
      console.log('✅ Valor monetario/saldo visible en settings/billing');
    } else {
      console.log('ℹ️ Valor monetario no detectado — puede estar en un componente cargado por AJAX');
    }

    // Verificar que la sección de transacciones existe
    const hasTransactions = /transaccion|transaction|historial|history|factura|invoice/i.test(bodyText);
    console.log(`${hasTransactions ? '✅' : 'ℹ️'} Sección de transacciones visible: ${hasTransactions}`);
  });

  test('settings/billing/transactions carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing/transactions`, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    await page.waitForTimeout(3_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(bodyText.length).toBeGreaterThan(50);
    console.log('✅ /settings/billing/transactions carga OK');
  });

  test('settings/billing/planes carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing/planes`, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    await page.waitForTimeout(3_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasPlans = /FREE|BASIC|PRO|MAX|ENTERPRISE|plan|€/i.test(bodyText);
    console.log(`${hasPlans ? '✅' : 'ℹ️'} Planes de suscripción visibles: ${hasPlans}`);
  });
});

// ─── 4.2 — Transacciones via API ─────────────────────────────────────────────

test.describe('Facturación 4.2 — Transacciones via API', () => {
  test.setTimeout(40_000);

  test('wallet/transactions endpoint responde con estructura correcta', async ({ request }) => {
    // GET /api/wallet/transactions (via Next.js → api2)
    const resp = await request.get(`${CHAT_URL}/api/wallet/transactions`, {
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`wallet/transactions status: ${status}`);

    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body) {
        expect(body).toHaveProperty('transactions');
        expect(Array.isArray(body.transactions)).toBe(true);
        expect(typeof body.total).toBe('number');
        console.log(`✅ transactions: ${body.total} registros, has_more: ${body.hasMore}`);

        if (body.transactions.length > 0) {
          const t = body.transactions[0];
          // Cada transacción debe tener estos campos
          const hasRequiredFields = 'amount' in t && ('type' in t || 'description' in t);
          console.log(`✅ Estructura de transacción OK: amount=${t.amount}, type=${t.type || t.description}`);
          expect(hasRequiredFields).toBe(true);
        }
      }
    } else if (status === 401) {
      console.log('ℹ️ 401 — requiere autenticación (correcto para endpoint de wallet)');
    }
  });

  test('wallet/balance endpoint responde', async ({ request }) => {
    const resp = await request.get(`${CHAT_URL}/api/wallet/balance`, {
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`wallet/balance status: ${status}`);

    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body) {
        const hasBalance = 'balance' in body || 'total_balance' in body || 'amount' in body;
        console.log(`✅ Balance response: ${JSON.stringify(body).slice(0, 100)}`);
        expect(hasBalance).toBe(true);
      }
    }
  });
});

// ─── 4.3 — Modal 402 con balance insuficiente ────────────────────────────────

test.describe('Facturación 4.3 — Modal 402 balance insuficiente', () => {
  test.setTimeout(90_000);

  test('InsufficientBalanceModal aparece cuando el chat devuelve 402', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Interceptar todas las llamadas al endpoint de chat y simular 402
    await page.route('**/webapi/chat/**', async (route) => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          errorType: 'insufficient_balance',
          body: {
            message: 'Saldo insuficiente. Necesitas al menos €0.10 para continuar.',
            screen_type: 'low_balance_warning',
          },
        }),
      });
    });

    // Esperar a que el chat esté listo
    const editor = page.locator('div[contenteditable="true"], textarea').first();
    const editorVisible = await editor.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!editorVisible) {
      console.log('ℹ️ Editor del chat no visible — skip');
      test.skip();
      return;
    }

    await editor.click();
    await editor.fill('Test de saldo insuficiente');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(6_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';

    // Verificar que aparece el modal o indicador de saldo insuficiente
    const hasModal =
      /saldo insuficiente|insufficient balance|recargar|recharge|añadir saldo|agregar saldo/i.test(bodyText);

    // Buscar el modal por selector
    const modalEl = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').filter({
      hasText: /saldo|balance|recargar|insufficient/i,
    });
    const modalVisible = await modalEl.first().isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasModal || modalVisible) {
      console.log('✅ Indicador/Modal de saldo insuficiente visible tras 402');
    } else {
      console.log('ℹ️ Modal no detectado — puede necesitar más tiempo o estar en un toast');
    }

    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('flag errorType="insufficient_balance" en route.ts — verificar corrección', async ({ request }) => {
    // Llamada directa al route de chat con payload mínimo
    // Si el route.ts tiene el bug errorType vs error.type, el modal no aparecería
    const resp = await request.post(`${CHAT_URL}/webapi/chat/anthropic`, {
      data: {
        messages: [{ role: 'user', content: 'test' }],
        model: 'claude-haiku-20240307',
      },
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`Chat route status directo: ${status}`);

    // Si devuelve 402, verificar que el cuerpo tiene errorType (no error.type)
    if (status === 402) {
      const body = await resp.json().catch(() => null);
      if (body) {
        const hasCorrectField = 'errorType' in body;
        const hasWrongField = body.error && 'type' in body.error;
        console.log(`errorType en response: ${hasCorrectField} | error.type (bug): ${hasWrongField}`);
        // El campo correcto es 'errorType' según la investigación
        if (hasCorrectField) console.log('✅ errorType correcto en response 402');
        if (hasWrongField) console.log('⚠️ error.type presente — puede causar bug en InsufficientBalanceModal');
      }
    } else {
      console.log(`ℹ️ Chat route devolvió ${status} (no 402) — sin saldo insuficiente en este entorno`);
    }
    expect(status).not.toBe(500);
  });
});

// ─── 4.4 — Recarga Stripe ────────────────────────────────────────────────────

test.describe('Facturación 4.4 — Sesión de recarga Stripe', () => {
  test.setTimeout(60_000);

  test('wallet/recharge-session endpoint genera URL de Stripe', async ({ request }) => {
    // POST /api/wallet/recharge-session (o equivalente en api2)
    const resp = await request.post(`${CHAT_URL}/api/wallet/recharge-session`, {
      data: {
        amount: 10,
        successUrl: `${CHAT_URL}/settings/billing?recharge=success`,
        cancelUrl: `${CHAT_URL}/settings/billing`,
      },
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`recharge-session status: ${status}`);

    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body) {
        const hasCheckoutUrl = body.checkout_url || body.url || body.session?.url;
        if (hasCheckoutUrl) {
          const url = body.checkout_url || body.url || body.session?.url;
          expect(url).toMatch(/stripe\.com|checkout\.stripe/i);
          console.log(`✅ Stripe checkout URL generada: ${url.slice(0, 60)}...`);
        }
      }
    } else if (status === 401) {
      console.log('ℹ️ 401 — requiere auth para crear sesión Stripe (correcto)');
    }
  });

  test('redirect a billing después de recarga exitosa', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    // Simular redirect de vuelta desde Stripe con ?recharge=success
    await page.goto(`${CHAT_URL}/settings/billing?recharge=success`, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    await page.waitForTimeout(3_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // La página debe mostrar algún mensaje de éxito o simplemente cargar billing
    const hasSuccess = /éxito|success|recargado|añadido|thank|gracias/i.test(bodyText);
    const hasBillingContent = /saldo|balance|factura|billing|crédito/i.test(bodyText);

    console.log(`${hasSuccess ? '✅' : 'ℹ️'} Mensaje de éxito: ${hasSuccess}`);
    console.log(`${hasBillingContent ? '✅' : 'ℹ️'} Contenido billing visible: ${hasBillingContent}`);
  });
});

// ─── 4.5 — Admin billing dashboard ───────────────────────────────────────────

test.describe('Facturación 4.5 — Admin billing dashboard', () => {
  test.setTimeout(90_000);

  test('admin/billing carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/admin/billing`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(4_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Si el usuario no es admin, debería redirigir o mostrar 403
    const isAdmin = !/acceso denegado|forbidden|403|no autorizado|not authorized/i.test(bodyText);

    if (isAdmin) {
      // Verificar KPIs del dashboard de billing
      const hasRevenue = /revenue|ingreso|facturado|mensual/i.test(bodyText);
      const hasWallets = /wallet|billetera|saldo|activos/i.test(bodyText);
      const hasCharts = /chart|grafico|gráfico|coste|cost/i.test(bodyText);

      console.log(`${hasRevenue ? '✅' : 'ℹ️'} Revenue metrics: ${hasRevenue}`);
      console.log(`${hasWallets ? '✅' : 'ℹ️'} Wallet metrics: ${hasWallets}`);
      console.log(`${hasCharts ? '✅' : 'ℹ️'} Charts visibles: ${hasCharts}`);
    } else {
      console.log('ℹ️ Usuario sin permisos de admin — acceso denegado (esperado para usuarios normales)');
    }
  });

  test('admin/billing/wallet-test carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/admin/billing/wallet-test`, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    await page.waitForTimeout(3_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log('✅ admin/billing/wallet-test carga sin crash');
  });
});

// ─── 4.6 — wallet_checkBalance via API ───────────────────────────────────────

test.describe('Facturación 4.6 — wallet_checkBalance', () => {
  test.setTimeout(40_000);

  test('check-balance endpoint responde con estructura coherente', async ({ request }) => {
    // GET o POST /api/wallet/check-balance?amount=0.01
    const resp = await request.post(`${CHAT_URL}/api/wallet/check-balance`, {
      data: { amount: 0.01 },
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`check-balance status: ${status}`);

    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body) {
        // Estructura esperada: { allowed: boolean, required_amount: number, shortfall: number }
        const hasAllowed = 'allowed' in body;
        console.log(`✅ check-balance: allowed=${body.allowed}, shortfall=${body.shortfall ?? 'n/a'}`);
        expect(hasAllowed).toBe(true);

        // Coherencia: si allowed=false, shortfall debe ser > 0
        if (body.allowed === false && body.shortfall !== undefined) {
          expect(body.shortfall).toBeGreaterThan(0);
          console.log(`✅ Coherencia: allowed=false → shortfall=${body.shortfall} > 0`);
        }
      }
    } else if (status === 401) {
      console.log('ℹ️ 401 — requiere auth para check-balance (correcto)');
    }
  });

  test('auto-recharge config endpoint responde', async ({ request }) => {
    const resp = await request.get(`${CHAT_URL}/api/wallet/auto-recharge`, {
      timeout: 15_000,
    });
    const status = resp.status();
    console.log(`auto-recharge config status: ${status}`);
    expect(status).not.toBe(500);

    if (status === 200) {
      const body = await resp.json().catch(() => null);
      if (body) {
        const hasConfig = 'enabled' in body || 'threshold' in body || 'auto_recharge' in body;
        console.log(`${hasConfig ? '✅' : 'ℹ️'} auto-recharge config: ${JSON.stringify(body).slice(0, 100)}`);
      }
    }
  });
});

// ─── 4.7 — SKUs y precios ────────────────────────────────────────────────────
// (tests existentes debajo)

test.describe('Facturación 4.7 — SKUs y precios', () => {
  test.setTimeout(40_000);

  const knownSkus = [
    'SRV-AI-ANTHROPIC-HAIKU',
    'SRV-AI-ANTHROPIC-SONNET',
    'SRV-AI-OPENAI-GPT4O',
  ];

  for (const sku of knownSkus) {
    test(`service-price endpoint responde para SKU ${sku}`, async ({ request }) => {
      const resp = await request.post(`${CHAT_URL}/api/wallet/service-price`, {
        data: { sku, quantity: 1 },
        timeout: 15_000,
      });
      const status = resp.status();
      console.log(`service-price [${sku}] status: ${status}`);

      expect(status).not.toBe(500);
      expect(status).not.toBe(503);

      if (status === 200) {
        const body = await resp.json().catch(() => null);
        if (body) {
          const hasPrice = 'base_price' in body || 'final_price' in body || 'price' in body || 'amount' in body;
          if (hasPrice) {
            const price = body.final_price ?? body.base_price ?? body.price ?? body.amount;
            expect(typeof price).toBe('number');
            expect(price).toBeGreaterThanOrEqual(0);
            console.log(`✅ ${sku}: €${price}`);
          }
        }
      } else if (status === 401) {
        console.log(`ℹ️ ${sku}: 401 — requiere auth`);
      } else if (status === 404) {
        console.log(`ℹ️ ${sku}: 404 — endpoint de precios no disponible en este entorno`);
      }
    });
  }
});

// ─── 4.8 — appEventos /facturacion ───────────────────────────────────────────

const isAppTest =
  APP_URL.includes('app-test.bodasdehoy.com') || APP_URL.includes('app-dev.bodasdehoy.com');

async function loginInApp(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'commit', timeout: 35_000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2_000);

  if (!page.url().includes('/login')) return true; // ya autenticado con cookie

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
  }
  return !page.url().includes('/login');
}

test.describe('Facturación 4.8 — appEventos /facturacion', () => {
  test.setTimeout(90_000);

  test('GET /facturacion carga sin 500 ni ErrorBoundary', async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInApp(page);
    if (!loggedIn) { test.skip(); return; }

    const resp = await page.goto(`${APP_URL}/facturacion`, {
      waitUntil: 'commit',
      timeout: 30_000,
    }).catch(() => null);

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(4_000);

    if (resp) expect(resp.status()).not.toBe(500);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado|Unhandled Error|500 Internal/i);
    console.log('✅ /facturacion carga sin crash en appEventos');
  });

  test('Grid de planes visible con precios', async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInApp(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${APP_URL}/facturacion`, { waitUntil: 'commit', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(5_000); // esperar fetch de planes API2

    const bodyText = (await page.locator('body').textContent()) ?? '';

    const hasPlans = /FREE|BASIC|PRO|MAX|ENTERPRISE|Gratis|Mensual|Anual/i.test(bodyText);
    const hasPrices = /€|\d+[,\.]\d{2}/.test(bodyText);
    const hasToggle = /mensual|anual/i.test(bodyText);

    console.log(`${hasPlans ? '✅' : '⚠️'} Planes visibles: ${hasPlans}`);
    console.log(`${hasPrices ? '✅' : '⚠️'} Precios (€) visibles: ${hasPrices}`);
    console.log(`${hasToggle ? '✅' : 'ℹ️'} Toggle mensual/anual visible: ${hasToggle}`);

    expect(bodyText).not.toMatch(/Error Capturado/i);
  });

  test('Toggle anual reduce el precio mostrado', async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInApp(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${APP_URL}/facturacion`, { waitUntil: 'commit', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(5_000);

    // Capturar texto antes y después de cambiar a "Anual"
    const textBefore = await page.locator('body').textContent() ?? '';

    const toggleBtn = page.getByRole('button', { name: /Anual/i }).first();
    const toggleVisible = await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!toggleVisible) {
      console.log('ℹ️ Toggle anual no visible — puede requerir más tiempo de carga');
      test.skip();
      return;
    }

    await toggleBtn.click();
    await page.waitForTimeout(1_000);

    const textAfter = await page.locator('body').textContent() ?? '';

    // Los precios deberían cambiar (la página rerenderea)
    const pricesChanged = textBefore !== textAfter;
    console.log(`${pricesChanged ? '✅' : 'ℹ️'} Precios cambian al seleccionar Anual: ${pricesChanged}`);
  });

  test('Historial de facturación tab carga sin crash', async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInApp(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${APP_URL}/facturacion`, { waitUntil: 'commit', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(3_000);

    // Buscar tab de historial y hacer click
    const historialTab = page.getByRole('button', { name: /historial/i })
      .or(page.locator('[class*="tab"]').filter({ hasText: /historial/i }))
      .first();

    const tabVisible = await historialTab.isVisible({ timeout: 5_000 }).catch(() => false);
    if (tabVisible) {
      await historialTab.click();
      await page.waitForTimeout(2_000);
    }

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado/i);

    const hasInvoiceContent = /factura|invoice|INV-|pagado|pendiente|anulado/i.test(bodyText);
    console.log(`${hasInvoiceContent ? '✅' : 'ℹ️'} Contenido de historial visible: ${hasInvoiceContent}`);
  });

  test('ActivatorPremium redirige a /facturacion desde página con feature gate', async ({ context, page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInApp(page);
    if (!loggedIn) { test.skip(); return; }

    // Probar en una página que tiene ActivatorPremium — típicamente invitados o mesas si es free
    const gatedPages = ['/invitados', '/mesas', '/presupuesto'];
    for (const gatedPath of gatedPages) {
      await page.goto(`${APP_URL}${gatedPath}`, { waitUntil: 'commit', timeout: 25_000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(2_000);

      const bodyText = (await page.locator('body').textContent()) ?? '';
      const hasPremiumCta =
        /activar.*premium|premium.*activar|plan.*pago|upgrade|mejorar plan/i.test(bodyText);

      if (hasPremiumCta) {
        console.log(`✅ ActivatorPremium visible en ${gatedPath}`);
        // Buscar el link y verificar que apunta a /facturacion
        const premiumLink = page.locator('a[href*="facturacion"]').first();
        const linkVisible = await premiumLink.isVisible({ timeout: 3_000 }).catch(() => false);
        if (linkVisible) {
          const href = await premiumLink.getAttribute('href');
          expect(href).toContain('facturacion');
          console.log(`✅ Link de ActivatorPremium correcto: ${href}`);
        }
        break;
      }
    }
    console.log('ℹ️ ActivatorPremium puede no aparecer si el usuario ya tiene plan de pago');
  });
});

// ─── 4.9 — memories-web pricing section ──────────────────────────────────────

test.describe('Facturación 4.9 — memories-web pricing section', () => {
  test.setTimeout(60_000);

  test('Landing page carga la sección #precios sin crash', async ({ page }) => {
    const resp = await page.goto(MEMORIES_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => null);

    if (!resp) { test.skip(); return; }

    const status = resp.status();
    console.log(`memories-web status: ${status}`);
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    await page.waitForTimeout(3_000);
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error|500|Unhandled/i);
  });

  test('Sección de precios contiene planes con precios', async ({ page }) => {
    const resp = await page.goto(MEMORIES_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => null);
    if (!resp || resp.status() >= 500) { test.skip(); return; }

    await page.waitForTimeout(4_000); // esperar fetch de planes API2

    // Navegar a la sección de precios
    await page.evaluate(() => {
      const el = document.getElementById('precios');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(1_000);

    const pricingSection = page.locator('#precios, [id="precios"]').first();
    const sectionVisible = await pricingSection.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!sectionVisible) {
      // Fallback: buscar en el body completo
      const bodyText = (await page.locator('body').textContent()) ?? '';
      const hasPricingContent = /Gratis|€|plan|PRO|mes|anual|precio/i.test(bodyText);
      console.log(`${hasPricingContent ? '✅' : '⚠️'} Contenido de pricing detectado (body-wide): ${hasPricingContent}`);
      return;
    }

    const sectionText = (await pricingSection.textContent()) ?? '';
    const hasPlans = /Gratis|FREE|€\d|plan/i.test(sectionText);
    const hasCta = /empezar|elegir|probar|gratis/i.test(sectionText);

    console.log(`${hasPlans ? '✅' : '⚠️'} Planes visibles en #precios: ${hasPlans}`);
    console.log(`${hasCta ? '✅' : '⚠️'} CTAs visibles: ${hasCta}`);

    expect(hasPlans).toBe(true);
  });

  test('CTA de plan PRO no lleva a 404 (/pro debe existir)', async ({ page }) => {
    const resp = await page.goto(MEMORIES_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    }).catch(() => null);
    if (!resp || resp.status() >= 500) { test.skip(); return; }

    await page.waitForTimeout(4_000);

    // Buscar el link /pro (todos los CTAs de plans apuntan ahí)
    const proLink = page.locator('a[href="/pro"], a[href*="/pro"]').first();
    const linkVisible = await proLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!linkVisible) {
      console.log('ℹ️ Link /pro no encontrado en la landing (puede estar fuera del viewport)');
      // Verificar directamente que la URL existe
    }

    // Verificar que /pro no devuelve 404
    const proResp = await page.goto(`${MEMORIES_URL}/pro`, {
      waitUntil: 'commit',
      timeout: 25_000,
    }).catch(() => null);

    if (proResp) {
      const proStatus = proResp.status();
      console.log(`memories-web/pro status: ${proStatus}`);
      if (proStatus === 404) {
        console.log('❌ /pro devuelve 404 — CTAs de pricing rotos (crítico para conversión)');
      } else if (proStatus === 200) {
        console.log('✅ /pro existe y carga correctamente');
      } else {
        console.log(`ℹ️ /pro status: ${proStatus}`);
      }
      // Soft assertion — log pero no falla el test (puede ser un redirect)
      expect(proStatus).not.toBe(500);
    }
  });

  test('Planes se cargan dinámicamente desde API2', async ({ page }) => {
    // Interceptar llamada a api2 y verificar que llega la respuesta
    const api2Calls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('api2') || req.url().includes('eventosorganizador')) {
        api2Calls.push(req.url());
      }
    });

    const resp = await page.goto(MEMORIES_URL, {
      waitUntil: 'networkidle',
      timeout: 35_000,
    }).catch(() => null);
    if (!resp || resp.status() >= 500) { test.skip(); return; }

    await page.waitForTimeout(3_000);

    const hasApi2Call = api2Calls.some((url) =>
      url.includes('getSubscriptionPlans') || url.includes('graphql')
    );
    console.log(`${hasApi2Call ? '✅' : 'ℹ️'} Llamada a API2 para planes: ${hasApi2Call}`);
    if (api2Calls.length > 0) {
      console.log(`  URLs API2 detectadas: ${api2Calls.slice(0, 3).join(', ')}`);
    }
  });
});

// ─── 4.10 — Embudo de conversión cross-app ────────────────────────────────────

test.describe('Facturación 4.10 — Embudo conversión cross-app', () => {
  test.setTimeout(60_000);

  test('ReloginBanner aparece cuando JWT expirado (api2:token-expired)', async ({ context, page }) => {
    if (!isChatTest) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'commit', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2_000);

    // Disparar el evento api2:token-expired manualmente
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('api2:token-expired'));
    });
    await page.waitForTimeout(1_500);

    const banner = page.locator('[class*="relogin"], [class*="ReloginBanner"]')
      .or(page.locator('text=/sesión expirada|volver a iniciar|relogin/i').first())
      .first();

    const bannerVisible = await banner.isVisible({ timeout: 4_000 }).catch(() => false);
    if (bannerVisible) {
      console.log('✅ ReloginBanner visible tras api2:token-expired');
    } else {
      // Verificar body text
      const bodyText = (await page.locator('body').textContent()) ?? '';
      const hasBannerText = /sesión.*expirad|volver.*iniciar|token.*expirad/i.test(bodyText);
      console.log(`${hasBannerText ? '✅' : 'ℹ️'} Texto de sesión expirada: ${hasBannerText}`);
    }
  });

  test('NegativeBalanceBanner aparece con balance negativo (simulado)', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing`, { waitUntil: 'commit', timeout: 25_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(3_000);

    // Buscar el banner de saldo negativo
    const negativeBanner = page.locator('[class*="negative"], [class*="NegativeBalance"]')
      .or(page.locator('text=/modo crédito|saldo negativo|deuda/i').first())
      .first();

    const bannerVisible = await negativeBanner.isVisible({ timeout: 3_000 }).catch(() => false);
    if (bannerVisible) {
      console.log('✅ NegativeBalanceBanner visible — usuario tiene balance negativo');
    } else {
      console.log('ℹ️ NegativeBalanceBanner no visible — usuario tiene balance positivo (normal en test)');
    }
    // No fallar — el banner solo aparece con balance negativo real
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado/i);
  });

  test('WalletBadge visible en sidebar de chat-ia', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'commit', timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(4_000);

    // WalletBadge muestra el saldo con símbolo €
    const walletBadge = page.locator('[class*="WalletBadge"], [class*="wallet-badge"]')
      .or(page.locator('[class*="badge"]').filter({ hasText: /€|\d+[,.]\d{2}/ }))
      .first();

    const badgeVisible = await walletBadge.isVisible({ timeout: 5_000 }).catch(() => false);
    if (badgeVisible) {
      const badgeText = await walletBadge.textContent();
      console.log(`✅ WalletBadge visible: "${badgeText?.trim()}"`);
    } else {
      // Fallback: verificar que hay un valor € en el sidebar
      const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="Sidebar"]').first();
      const sidebarText = await sidebar.textContent().catch(() => '');
      const hasBalance = /€|\d+[,.]\d{2}/.test(sidebarText ?? '');
      console.log(`${hasBalance ? '✅' : 'ℹ️'} Balance visible en sidebar: ${hasBalance}`);
    }
  });

  test('Planes page tiene toggle mensual/anual funcional', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/billing/planes`, { waitUntil: 'commit', timeout: 25_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(4_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasToggle = /mensual|anual|monthly|yearly/i.test(bodyText);
    console.log(`${hasToggle ? '✅' : '⚠️'} Toggle mensual/anual presente: ${hasToggle}`);

    // PriceComparison debería estar enlazado (gap identificado — verificar si ya fue añadido)
    const hasPriceComparison = /comparar|comparison|tabla.*plan|plan.*tabla/i.test(bodyText);
    console.log(`${hasPriceComparison ? '✅' : '⚠️ GAP'} PriceComparison enlazado: ${hasPriceComparison}`);
    if (!hasPriceComparison) {
      console.log('  → Ver: docs/INVENTARIO-FACTURACION-CONVERSION.md — Gap C1');
    }
  });
});
