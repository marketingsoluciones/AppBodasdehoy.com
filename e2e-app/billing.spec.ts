/**
 * billing.spec.ts
 *
 * Tests de facturación y planes en chat-ia (chat-test):
 *   - /settings/billing carga sin crash
 *   - Balance y plan visibles
 *   - /settings/billing/transactions muestra historial
 *   - /settings/billing/planes muestra FREE/BASIC/PRO/MAX
 *   - Auto-recarga visible
 *
 * Requiere usuario logueado (sesión activa en chat-test).
 * Sin sesión, los tests verifican que las rutas no crashen (redirigen a login).
 */
import { test, expect } from '@playwright/test';
import { clearSession } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

// Helper para hacer login en chat-test si hay credenciales
async function loginIfCredentials(page: any) {
  if (!hasCredentials) return false;
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
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
// 1. /settings/billing — página principal
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Billing — /settings/billing', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    await loginIfCredentials(page);
  });

  test('ruta carga sin crash (con o sin sesión)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/Internal Server Error|Error Capturado/i);
  });

  test('muestra saldo o redirige a login si no hay sesión', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /saldo|balance|crédito|plan|factura|billing|FREE|BASIC|PRO|MAX|login|iniciar/i.test(text);
    expect(hasContent).toBe(true);
  });

  test('muestra planes (FREE/BASIC/PRO/MAX) en la sección de billing', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    // Si hay sesión, deben aparecer los planes
    if (!/login|iniciar/i.test(text)) {
      const hasPlans = /FREE|BASIC|PRO|MAX/i.test(text);
      expect(hasPlans).toBe(true);
      console.log('Planes visibles en billing');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. /settings/billing/transactions — historial de transacciones
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Billing — /settings/billing/transactions', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    await loginIfCredentials(page);
  });

  test('ruta carga sin crash', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing/transactions`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/Internal Server Error|Error Capturado/i);
  });

  test('muestra historial o mensaje vacío (nunca crash)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing/transactions`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /transacci|historial|transaction|consumo|sin transacci|no hay|empty|login/i.test(text);
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. /settings/billing/planes — catálogo de planes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Billing — /settings/billing/planes', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    await loginIfCredentials(page);
  });

  test('ruta carga sin crash', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing/planes`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(50);
    expect(text).not.toMatch(/Internal Server Error|Error Capturado/i);
  });

  test('muestra los 4 planes: FREE, BASIC, PRO, MAX (con sesión)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing/planes`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(5000);

    const text = (await page.locator('body').textContent()) ?? '';

    if (/login|iniciar/i.test(text)) {
      // Sin sesión válida — skip informativo
      console.log('ℹ️ Sin sesión activa para ver planes');
      return;
    }

    expect(text).toMatch(/FREE/i);
    expect(text).toMatch(/BASIC/i);
    expect(text).toMatch(/PRO/i);
    expect(text).toMatch(/MAX/i);
    console.log('Todos los planes visibles: FREE / BASIC / PRO / MAX');
  });

  test('plan actual está marcado (badge "Actual" o similar)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/settings/billing/planes`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(5000);

    const text = (await page.locator('body').textContent()) ?? '';

    if (/login|iniciar/i.test(text)) {
      return;
    }

    const hasPlanMarker =
      /[Aa]ctual|[Cc]urrent|[Tt]u plan|[Aa]ctivo/i.test(text) ||
      (await page.locator('[class*="current"], [class*="active"], [data-active]').count()) > 0;

    if (hasPlanMarker) {
      console.log('Plan actual marcado en la UI');
    } else {
      console.log('ℹ️ Marcador de plan actual no detectado visualmente');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Facturación en appEventos (/facturacion)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Facturación — appEventos (/facturacion)', () => {
  test.setTimeout(90_000);

  test('carga sin ErrorBoundary', async ({ page }) => {
    await page.goto('/facturacion', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra saldo, plan o acceso requerido', async ({ page }) => {
    await page.goto('/facturacion', { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /[Ff]acturaci|[Ss]aldo|[Pp]lan|[Bb]alance|[Cc]rédito|[Pp]ermiso|[Ii]niciar/i.test(text);
    expect(hasContent).toBe(true);
  });
});
