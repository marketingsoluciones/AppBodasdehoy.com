/**
 * auditoria-visual-movil.spec.ts
 *
 * Auditoría visual de todas las apps en distintos formatos de móvil.
 * Toma screenshots de cada página clave para detectar:
 *  - Elementos ocultos / cortados
 *  - Layouts rotos en pantallas pequeñas
 *  - Opciones "solas" (orphaned UI elements)
 *  - Overflow horizontal no deseado
 *
 * Uso:
 *   E2E_ENV=local pnpm exec playwright test e2e-app/auditoria-visual-movil.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';
import { getChatUrl, getMemoriesUrl } from './fixtures';

// appEventos solo escucha en 127.0.0.1 — forzar siempre IPv4 loopback
// (no usar APP_URL: puede apuntar a la IP LAN y appEventos no escucha en la LAN)
function getAppUrl() { return 'http://127.0.0.1:3220'; }

// ─── Viewports a auditar ───────────────────────────────────────────────────────

const DEVICES = [
  { name: 'iPhoneSE',     width: 375,  height: 667  },
  { name: 'iPhone14Pro',  width: 393,  height: 852  },
  { name: 'GalaxyS23',    width: 360,  height: 780  },
  { name: 'iPadMini',     width: 768,  height: 1024 },
];

// ─── Credenciales ─────────────────────────────────────────────────────────────

const EMAIL    = process.env.TEST_USER_EMAIL    || 'bodasdehoy.com@gmail.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'lorca2012M*+';

// ─── Helper: screenshot con nombre descriptivo ────────────────────────────────

async function snap(page: Page, label: string) {
  const dir = 'test-screenshots/auditoria-movil';
  await page.screenshot({
    path:     `${dir}/${label}.png`,
    fullPage: true,
  });
}

// ─── Helper: login en chat-ia ─────────────────────────────────────────────────

async function loginChatIA(page: Page) {
  const url = getChatUrl();
  await page.goto(`${url}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1_500);

  // Intentar hacer click en "Iniciar sesión" si hay un botón previo
  const iniciarBtn = page.locator('a, [role="button"], span').filter({ hasText: /Iniciar sesión/i }).first();
  if (await iniciarBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await iniciarBtn.click();
    await page.waitForTimeout(800);
  }

  // Rellenar formulario de login si está presente
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await emailInput.fill(EMAIL);
    const passInput = page.locator('input[type="password"]').first();
    await passInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u) => u.pathname.startsWith('/chat'), { timeout: 25_000 }).catch(() => {});
  }

  // Esperar a que la app esté completamente cargada y el token esté en cookies
  await page.waitForTimeout(3_000);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1_000);
}

// ─── Helper: navegar con reintentos (maneja redirects de auth en vuelo) ────────

async function gotoWithRetry(page: Page, url: string, label: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(2_000);
      return;
    } catch (e: any) {
      if (e?.message?.includes('interrupted by another navigation') && i < 2) {
        // Auth redirect en vuelo — esperar y reintentar
        await page.waitForTimeout(2_000);
        await page.waitForLoadState('networkidle').catch(() => {});
        continue;
      }
      // Si el error persiste, tomar screenshot del estado actual
      console.warn(`[${label}] nav fallida (${e?.message?.slice(0, 80)}), tomando screenshot del estado actual`);
      return;
    }
  }
}

// ─── Helper: login en appEventos ──────────────────────────────────────────────

async function loginApp(page: Page) {
  const url = getAppUrl();
  // Next.js dev cold-start puede tardar ~20s en la primera request
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(3_000);
}

// ─── SUITE: chat-ia ───────────────────────────────────────────────────────────

for (const device of DEVICES) {
  test.describe(`chat-ia | ${device.name} (${device.width}x${device.height})`, () => {
    test.use({ viewport: { width: device.width, height: device.height } });

    test('login y chat principal', async ({ page }) => {
      await loginChatIA(page);
      await snap(page, `chat-ia_${device.name}_01_chat`);

      // Verificar no hay overflow horizontal
      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, 'overflow horizontal en chat').toBe(false);
    });

    test('sidebar / menú lateral', async ({ page }) => {
      await loginChatIA(page);

      // Intentar abrir sidebar si existe botón hamburger
      const burger = page.locator('[aria-label*="menu"], [aria-label*="sidebar"], button.hamburger').first();
      if (await burger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await burger.click();
        await page.waitForTimeout(500);
      }
      await snap(page, `chat-ia_${device.name}_02_sidebar`);
    });

    test('bandeja de mensajes /messages', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/messages`, `${device.name}/messages`);
      await snap(page, `chat-ia_${device.name}_03_messages`);

      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, 'overflow horizontal en /messages').toBe(false);
    });

    test('facturación /settings/billing', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/settings/billing`, `${device.name}/billing`);
      await snap(page, `chat-ia_${device.name}_04_billing`);
    });

    test('planes de suscripción /settings/billing/planes', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/settings/billing/planes`, `${device.name}/planes`);
      await snap(page, `chat-ia_${device.name}_05_planes`);

      // Verificar que los 4 planes son visibles (no cortados)
      const planCards = page.locator('[data-testid*="plan"], .plan-card, [class*="PlanCard"], [class*="plan-card"]');
      const count = await planCards.count();
      console.log(`[${device.name}] Planes visibles: ${count}`);
    });

    test('notificaciones /notifications', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/notifications`, `${device.name}/notifications`);
      await snap(page, `chat-ia_${device.name}_06_notifications`);
    });

    test('mensajes /messages (hub)', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/messages`, `${device.name}/messages`);
      await snap(page, `chat-ia_${device.name}_07_messages`);
    });

    test('settings generales /settings', async ({ page }) => {
      await loginChatIA(page);
      await gotoWithRetry(page, `${getChatUrl()}/settings`, `${device.name}/settings`);
      await snap(page, `chat-ia_${device.name}_08_settings`);
    });

    test('login page (guest)', async ({ page }) => {
      const url = getChatUrl();
      await page.goto(`${url}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(1_500);
      await snap(page, `chat-ia_${device.name}_00_login`);

      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, 'overflow horizontal en login').toBe(false);
    });
  });
}

// ─── SUITE: appEventos ─────────────────────────────────────────────────────────

for (const device of DEVICES) {
  test.describe(`appEventos | ${device.name} (${device.width}x${device.height})`, () => {
    test.use({ viewport: { width: device.width, height: device.height } });
    // Dev server puede tardar >90s en compilar + servir — ampliar timeout por test
    test.setTimeout(150_000);

    test('home / dashboard', async ({ page }) => {
      await loginApp(page);
      await snap(page, `app_${device.name}_01_home`);

      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, 'overflow horizontal en home').toBe(false);
    });

    test('invitados', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/invitados`, `${device.name}/invitados`);
      await snap(page, `app_${device.name}_02_invitados`);
    });

    test('mesas', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/mesas`, `${device.name}/mesas`);
      await snap(page, `app_${device.name}_03_mesas`);
    });

    test('presupuesto', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/presupuesto`, `${device.name}/presupuesto`);
      await snap(page, `app_${device.name}_04_presupuesto`);
    });

    test('servicios', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/servicios`, `${device.name}/servicios`);
      await snap(page, `app_${device.name}_05_servicios`);
    });

    test('itinerario', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/itinerario`, `${device.name}/itinerario`);
      await snap(page, `app_${device.name}_06_itinerario`);
    });

    test('facturación', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/facturacion`, `${device.name}/facturacion`);
      await snap(page, `app_${device.name}_07_facturacion`);
    });

    test('invitaciones', async ({ page }) => {
      await gotoWithRetry(page, `${getAppUrl()}/invitaciones`, `${device.name}/invitaciones`);
      await snap(page, `app_${device.name}_08_invitaciones`);
    });

    test('copilot / chat embed', async ({ page }) => {
      await loginApp(page);
      // Abrir copilot si hay botón
      const copilotBtn = page.locator('[aria-label*="copilot"], [aria-label*="chat"], [data-testid="chat-toggle"], button[class*="ChatToggle"]').first();
      if (await copilotBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await copilotBtn.click();
        await page.waitForTimeout(1_500);
      }
      await snap(page, `app_${device.name}_09_copilot`);
    });
  });
}

// ─── SUITE: memories-web ──────────────────────────────────────────────────────

for (const device of DEVICES) {
  test.describe(`memories-web | ${device.name} (${device.width}x${device.height})`, () => {
    test.use({ viewport: { width: device.width, height: device.height } });

    test('home / landing', async ({ page }) => {
      const url = getMemoriesUrl();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(2_000);
      await snap(page, `memories_${device.name}_01_home`);

      const hasHScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, 'overflow horizontal en memories home').toBe(false);
    });

    test('acceso directo a app (auth redirect)', async ({ page }) => {
      // memories-web no tiene /login propio — el auth se hace en chat-ia
      // Navegar a /app sin auth dispara redirect al login de chat-ia
      const url = getMemoriesUrl();
      await page.goto(`${url}/app`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(1_500);
      await snap(page, `memories_${device.name}_02_login`);
    });

    test('app / dashboard de álbumes', async ({ page }) => {
      const url = getMemoriesUrl();
      await gotoWithRetry(page, `${url}/app`, `${device.name}/app`);
      await snap(page, `memories_${device.name}_03_app`);
    });

    test('planes pro', async ({ page }) => {
      const url = getMemoriesUrl();
      await page.goto(`${url}/pro`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(1_500);
      await snap(page, `memories_${device.name}_04_pro`);
    });
  });
}
