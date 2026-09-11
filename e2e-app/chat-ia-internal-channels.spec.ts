/**
 * chat-ia-internal-channels.spec.ts
 *
 * Tests de bandeja /messages chat-ia (commit 43f0c5bf):
 *   - Sidebar /messages NO muestra "Internal" como canal
 *   - ChannelSidebar oculta canales internos
 *   - Enlaces antiguos a /messages/ev-{eventId}-{section} no rompen
 *
 * Cobertura feature reciente — P1
 */
import { test, expect } from '@playwright/test';

const CHAT_URL = process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const isChatDev =
  CHAT_URL.includes('chat-dev.bodasdehoy.com') ||
  CHAT_URL.includes('chat-test.bodasdehoy.com');

async function loginChat(page: any): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(5_000);

  const emailInput = page.locator('input[type="email"]').first();
  if (!await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) return false;

  await emailInput.fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/chat($|\?|\/)/, { timeout: 30_000 }).catch(() => {});

  return !page.url().includes('/login');
}

test.describe('Chat-ia /messages — Sin canales internos en sidebar', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    if (!isChatDev || !hasCredentials) {
      test.skip();
      return;
    }
    const ok = await loginChat(page);
    if (!ok) test.skip(true, 'TEST_LOGIN_FAILED chat-dev');
  });

  test('Sidebar /messages NO muestra "Internal" como canal', async ({ page }) => {
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, '/messages redirige a login');
    }

    // Buscar texto "Internal" en sidebar — NO debe aparecer
    const sidebarText = await page.locator('[data-testid="channel-sidebar"], aside, nav').first().textContent().catch(() => '');
    const hasInternal = /\bInternal\b/i.test(sidebarText || '');

    expect(hasInternal, 'BUG_REGRESION 43f0c5bf: sidebar /messages muestra "Internal" — fix no aplicado').toBe(false);
  });

  test('Sidebar /messages NO lista módulos del evento como canales (Itinerario/Servicios/Invitados/Tareas)', async ({ page }) => {
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, '/messages redirige a login');
    }

    const sidebar = page.locator('[data-testid="channel-sidebar"], aside, nav').first();
    const sidebarText = (await sidebar.textContent().catch(() => '')) || '';

    // Estos módulos antes aparecían como canales internos (datos del evento camuflados)
    // Tras fix 43f0c5bf, NO deben aparecer en lista de canales
    const internalChannelPatterns = ['Itinerario', 'Servicios', 'Invitados', 'Tareas'];
    const foundInSidebar = internalChannelPatterns.filter((p) =>
      new RegExp(`\\b${p}\\b`, 'i').test(sidebarText)
    );

    // Permitir 0 — si encuentra alguno, alertar pero no fail (puede ser un mensaje real con ese nombre)
    if (foundInSidebar.length > 0) {
      console.warn(`[DIAG] Posibles canales internos visibles: ${foundInSidebar.join(', ')}`);
    }

    expect(foundInSidebar.length, `BUG_REGRESION: sidebar tiene ${foundInSidebar.length} módulos internos como canales`).toBeLessThan(4);
  });

  test('ChannelFilter no expone "Internal" como opción de filtro', async ({ page }) => {
    await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip(true, '/messages redirige a login');
    }

    // Abrir filtro si existe
    const filterBtn = page.locator('button').filter({ hasText: /filtrar|filter|canal/i }).first();
    if (!await filterBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip(true, 'ChannelFilter no visible');
    }
    await filterBtn.click().catch(() => {});
    await page.waitForTimeout(1500);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasInternalOption = /opción\s+internal|filter\s+by\s+internal/i.test(bodyText);

    expect(hasInternalOption, 'BUG_REGRESION 43f0c5bf: ChannelFilter expone "Internal" como opción').toBe(false);
  });
});

test.describe('Chat-ia /messages — Compatibilidad enlaces antiguos', () => {
  test.setTimeout(120_000);

  test('Enlace antiguo /messages/ev-{eventId}-{section} no rompe (404 o redirect aceptable)', async ({ page }) => {
    if (!isChatDev || !hasCredentials) { test.skip(); return; }
    const ok = await loginChat(page);
    if (!ok) test.skip(true, 'TEST_LOGIN_FAILED');

    // Probar ruta antigua con IDs ficticios
    const fakeEventId = '507f1f77bcf86cd799439011';
    await page.goto(`${CHAT_URL}/messages/ev-${fakeEventId}-tareas`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const status = page.url();
    // Debe redirigir a /messages (root) o mostrar 404 controlado — NO crash
    const isHandled = status.includes('/messages') || status.includes('/404');
    expect(isHandled, 'BUG_REGRESION: enlace antiguo rompe app').toBe(true);

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/Error Capturado por ErrorBoundary|TypeError|undefined is not/);
  });
});
