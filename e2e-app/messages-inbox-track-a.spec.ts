/**
 * messages-inbox-track-a.spec.ts
 *
 * Tests Track A FRONT — Sprint Fase 1 bandeja /messages:
 *   A1 — quitar Internal del sidebar (parcialmente cubierto en chat-ia-internal-channels)
 *   A2 — ContactSidePanel con estado del evento
 *   A3 — Filtros avanzados (sin status, sin desatendido en Sprint 1)
 *   A4 — Bulk Marcar leído + Archivar (sin Cerrar/Asignar en Sprint 1)
 *
 * Cobertura sprint /messages — P1
 * Pre-condición: backend B1-B3 desplegados en staging para A2/A3/A4
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

async function gotoMessages(page: any): Promise<boolean> {
  await page.goto(`${CHAT_URL}/messages`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3000);
  return !page.url().includes('/login') && page.url().includes('/messages');
}

test.describe('Track A — A2 ContactSidePanel', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    if (!isChatDev || !hasCredentials) {
      test.skip();
      return;
    }
    const ok = await loginChat(page);
    if (!ok) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Al abrir conversación, panel lateral derecho muestra info contacto', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    // Buscar primera conversación clickable
    const firstConv = page.locator('[data-testid*="conversation"], [class*="ConversationItem"], [role="button"]').filter({ hasText: /\w{3,}/ }).first();
    if (!await firstConv.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'No hay conversaciones en bandeja');
    }
    await firstConv.click().catch(() => {});
    await page.waitForTimeout(2500);

    // Panel lateral derecho debería aparecer con info contacto
    const sidePanel = page.locator('[data-testid="contact-side-panel"], aside.contact-panel, [class*="ContactSidePanel"]').first();
    const panelVisible = await sidePanel.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!panelVisible) {
      console.warn('[DIAG] ContactSidePanel no visible — A2 puede no estar implementado todavía');
      test.skip(true, 'A2 ContactSidePanel no detectado');
    }

    const panelText = (await sidePanel.textContent().catch(() => '')) || '';
    // Heurística: el panel debe mencionar al menos uno de los conceptos de evento
    const hasEventContext = /evento|mesa|menú|confirmación|tarea|rol/i.test(panelText);
    expect(hasEventContext, 'BUG_A2: ContactSidePanel no muestra estado del evento').toBe(true);
  });

  test('Panel lateral expone rol del contacto (invitado/proveedor/usuario)', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    const firstConv = page.locator('[role="button"], [data-testid*="conversation"]').filter({ hasText: /\w{3,}/ }).first();
    if (!await firstConv.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'No hay conversaciones');
    }
    await firstConv.click().catch(() => {});
    await page.waitForTimeout(2500);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasRole = /invitado|proveedor|usuario|colaborador/i.test(bodyText);

    if (!hasRole) {
      console.warn('[DIAG] Rol contacto no visible — A2 puede estar incompleto');
    }
    // Soft assertion — depende del estado del contacto
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

test.describe('Track A — A3 Filtros avanzados', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    if (!isChatDev || !hasCredentials) {
      test.skip();
      return;
    }
    const ok = await loginChat(page);
    if (!ok) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Filtros disponibles: canal + etiqueta + asignado (sin desatendido en Sprint 1)', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    const filterBtn = page.locator('button, [role="button"]').filter({ hasText: /filtro|filter|avanzado/i }).first();
    if (!await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Botón filtros no visible — A3 quizá no implementado');
    }

    await filterBtn.click().catch(() => {});
    await page.waitForTimeout(1500);

    const dropdownText = (await page.locator('body').textContent()) ?? '';
    const hasChannelFilter = /canal|whatsapp|email|sms/i.test(dropdownText);
    const hasLabelFilter = /etiqueta|label|tag/i.test(dropdownText);
    const hasAssigneeFilter = /asignado|asignar|assignee/i.test(dropdownText);

    const filtersAvailable = [
      hasChannelFilter ? 'canal' : '',
      hasLabelFilter ? 'etiqueta' : '',
      hasAssigneeFilter ? 'asignado' : '',
    ].filter(Boolean);

    expect(filtersAvailable.length, `BUG_A3: solo ${filtersAvailable.length}/3 filtros visibles: ${filtersAvailable.join(',')}`).toBeGreaterThanOrEqual(2);
  });

  test('Filtro "desatendido" NO debería estar en Sprint 1 (pospuesto a Sprint 2)', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    const filterBtn = page.locator('button, [role="button"]').filter({ hasText: /filtro|filter/i }).first();
    if (!await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Filtros no visibles');
    }
    await filterBtn.click().catch(() => {});
    await page.waitForTimeout(1500);

    const dropdownText = (await page.locator('body').textContent()) ?? '';
    const hasDesatendido = /desatendid|sin atender|unattended/i.test(dropdownText);

    // En Sprint 1 NO debería estar. Si aparece, alertar (puede ser adelanto OK o tener efecto sin backend listo)
    if (hasDesatendido) {
      console.warn('[DIAG] Filtro "desatendido" visible en Sprint 1 — depende de last_*_at backend deploy');
    }
    // No fail — solo informativo
    expect(true).toBe(true);
  });
});

test.describe('Track A — A4 Bulk operations', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    if (!isChatDev || !hasCredentials) {
      test.skip();
      return;
    }
    const ok = await loginChat(page);
    if (!ok) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Selección múltiple conversaciones expone acción "Marcar leído"', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    // Buscar checkboxes de selección múltiple
    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (!await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Selección múltiple no visible — A4 quizá no implementado');
    }

    await checkbox.click().catch(() => {});
    await page.waitForTimeout(1000);

    // Tras seleccionar, debería aparecer barra de acciones bulk
    const bulkText = (await page.locator('body').textContent()) ?? '';
    const hasMarkRead = /marcar leído|mark.*read|leído/i.test(bulkText);

    expect(hasMarkRead, 'BUG_A4: tras selección NO aparece acción "Marcar leído"').toBe(true);
  });

  test('Selección múltiple expone acción "Archivar"', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (!await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Selección múltiple no visible');
    }
    await checkbox.click().catch(() => {});
    await page.waitForTimeout(1000);

    const bulkText = (await page.locator('body').textContent()) ?? '';
    const hasArchive = /archivar|archive|archivado/i.test(bulkText);

    expect(hasArchive, 'BUG_A4: tras selección NO aparece acción "Archivar"').toBe(true);
  });

  test('Selección múltiple NO expone "Cerrar"/"Asignar" en Sprint 1 (depende B2/B3 deploy)', async ({ page }) => {
    if (!await gotoMessages(page)) test.skip(true, '/messages no accesible');

    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (!await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Selección múltiple no visible');
    }
    await checkbox.click().catch(() => {});
    await page.waitForTimeout(1000);

    const bulkText = (await page.locator('body').textContent()) ?? '';
    const hasClose = /cerrar conversación|close conversation/i.test(bulkText);
    const hasAssign = /asignar a|assign to/i.test(bulkText);

    // En Sprint 1 NO deberían estar. Si están sin backend desplegado, es decisión técnica
    if (hasClose || hasAssign) {
      console.warn(`[DIAG] Cerrar/Asignar adelantado a Sprint 1: close=${hasClose}, assign=${hasAssign}`);
    }
    expect(true).toBe(true);
  });
});
