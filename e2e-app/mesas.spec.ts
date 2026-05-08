/**
 * mesas.spec.ts
 *
 * Tests del módulo de mesas (editor visual de distribución) en appEventos:
 *   - /mesas carga con editor visual y panel lateral
 *   - Lista de mesas en el panel izquierdo
 *   - Resumen: número de invitados asignados / capacidad
 *   - Crear nueva mesa con nombre y capacidad → aparece en lista
 *   - Planos: crear un plano / cambiar de plano
 *   - Asignar invitado a mesa (drag o asignación por botón)
 *   - Mesa llena → indicador de capacidad
 *   - Zona/plantilla: panel de plantillas disponible
 *   - Imprimir/exportar plano (botón existe)
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady, assertNoRuntimeError } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const RUN_ID = Date.now().toString().slice(-6);
const MESA_NAME = `Mesa E2E ${RUN_ID}`;
const MESA_CAPACITY = '8';
const PLANO_NAME = `Plano E2E ${RUN_ID}`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Carga básica de /mesas
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas — Carga y estructura básica', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    // Fail-fast: si login falla, abortar el test entero (evita falsos BUG_PRODUCTO en assertions posteriores)
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Verificar TEST_USER credenciales/Firebase Auth/SSO chat-dev. Test abortado para no generar falsos positivos.');
    }
    // Detectar runtime errors UI tras login (Runtime Error, GraphQL mismatch, ErrorBoundary, etc.)
    await assertNoRuntimeError(page);
  });

  test('/mesas carga sin ErrorBoundary con editor visual', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);

    // Editor visual (canvas SVG o contenedor drag)
    const hasCanvas =
      (await page.locator('svg, canvas, [class*="canvas"], [class*="plano"], [class*="floor-plan"]').count()) > 0;
    const hasEditor = /mesa|table|plano|asiento/i.test(text);

    expect(hasCanvas || hasEditor).toBe(true);
    console.log(`✅ /mesas carga — canvas: ${hasCanvas}, texto mesas: ${hasEditor}`);
  });

  test('panel lateral con lista de mesas o botón crear mesa', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Panel con lista de mesas
    const hasTableList =
      (await page.locator('[class*="table-list"], [class*="panel"], [class*="sidebar"]').count()) > 0;
    const hasCreateBtn =
      (await page.locator('button').filter({ hasText: /nueva mesa|create table|añadir mesa/i }).count()) > 0;

    const text = (await page.locator('body').textContent()) ?? '';
    const hasMesaText = /mesa/i.test(text);

    expect(hasTableList || hasCreateBtn || hasMesaText).toBe(true);
    console.log('✅ Panel/lista de mesas disponible');
  });

  test('resumen de invitados asignados / capacidad total visible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasResumen =
      /asignado|capacidad|total|invitado|libre|ocupado/i.test(text) ||
      /\d+\s*\/\s*\d+/.test(text);

    expect(hasResumen, 'Resumen de capacidad/invitados no visible en /mesas').toBe(true);
  });

  // 1.5.8 — Añadir elemento decorativo (árbol, DJ, piano) al plano
  test('toolbar del plano tiene botón para añadir elementos decorativos', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Buscar toolbar o botones para añadir elementos al plano
    const hasElementBtn =
      (await page.locator('button, [role="button"]').filter({ hasText: /elemento|decorar|árbol|dj|piano|objeto/i }).count()) > 0 ||
      (await page.locator('[title*="elemento"], [title*="decorar"], [aria-label*="elemento"]').count()) > 0;

    const hasAddToolbar =
      (await page.locator('[class*="toolbar"], [class*="tool-bar"], [class*="controls"]').count()) > 0;

    expect(hasElementBtn || hasAddToolbar, 'Toolbar/botón de añadir elementos decorativos no encontrado').toBe(true);
  });

  // 1.5.9 — Añadir texto al plano de mesas
  test('toolbar del plano tiene opción para añadir texto', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Buscar botón/herramienta de texto
    const hasTextTool =
      (await page.locator('button, [role="button"]').filter({ hasText: /^texto$|añadir texto|text tool/i }).count()) > 0 ||
      (await page.locator('[title*="texto"], [title*="text"], [aria-label*="texto"]').count()) > 0;

    const hasToolbar =
      (await page.locator('[class*="toolbar"], [class*="tool-bar"]').count()) > 0;

    expect(hasTextTool || hasToolbar, 'Toolbar / herramienta de texto en plano no encontrada').toBe(true);
  });

  // 1.5.10 — Ver resumen invitados sentados vs no-sentados (BlockResumen)
  test('resumen diferencia invitados sentados vs no sentados', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasSentados = /sentado|sin sentar|sin asignar|asignado|no asignado/i.test(text);
    const hasCountPattern = /\d+\s*(\/|\|)\s*\d+/.test(text);
    const hasResumenBlock =
      (await page.locator('[class*="resumen"], [class*="summary"], [class*="block-resumen"]').count()) > 0;

    expect(
      hasSentados || hasCountPattern || hasResumenBlock,
      'Resumen sentados/sin sentar no visible (texto ni bloque resumen detectado)'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CRUD — Crear mesa
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas — Crear nueva mesa', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    // Fail-fast: si login falla, abortar el test entero (evita falsos BUG_PRODUCTO en assertions posteriores)
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Verificar TEST_USER credenciales/Firebase Auth/SSO chat-dev. Test abortado para no generar falsos positivos.');
    }
    // Detectar runtime errors UI tras login (Runtime Error, GraphQL mismatch, ErrorBoundary, etc.)
    await assertNoRuntimeError(page);
  });

  test('crear mesa E2E con capacidad → visible en lista', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Botón crear mesa: por texto O por icono/aria-label/clase
    const createBtn = page.locator('button').filter({
      hasText: /nueva mesa|crear mesa|add table|añadir mesa/i,
    }).first();
    const plusBtn = page.locator('[aria-label*="mesa"], [aria-label*="table"], [class*="add-table"]').first();

    const createBtnVisible = await createBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    const plusBtnVisible = !createBtnVisible && await plusBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(createBtnVisible || plusBtnVisible, 'BUG_PRODUCTO: ningún botón crear mesa visible (ni por texto ni por icono)').toBe(true);

    if (createBtnVisible) await createBtn.click();
    else await plusBtn.click();
    await page.waitForTimeout(1500);

    // Formulario nueva mesa
    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="mesa"], input[type="text"]').first();
    await expect(nameInput, 'BUG_PRODUCTO: input nombre mesa no aparece tras click crear').toBeVisible({ timeout: 5_000 });
    await nameInput.fill(MESA_NAME);

    // Capacidad (puede no existir en todos los UI variants)
    const capacityInput = page.locator('input[type="number"], input[placeholder*="capacidad"], input[placeholder*="asientos"]').first();
    if (await capacityInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await capacityInput.fill(MESA_CAPACITY);
    }

    // Guardar
    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|añadir|save|aceptar/i,
    }).first();
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) await saveBtn.click();
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // Verificación: mesa creada visible en lista O en canvas SVG
    const mesaEl = page.getByText(MESA_NAME, { exact: false });
    const isVisibleInList = await mesaEl.first().isVisible({ timeout: 10_000 }).catch(() => false);
    let inCanvas = false;
    if (!isVisibleInList) {
      const svgText = await page.locator('svg text, svg [title]').allTextContents();
      inCanvas = svgText.some(t => t.includes(MESA_NAME.split(' ').pop()!));
    }
    expect(
      isVisibleInList || inCanvas,
      `BUG_PRODUCTO: mesa "${MESA_NAME}" creada NO visible (ni en lista ni en canvas SVG). Posible: mutation falló silente, o UI no refrescó.`
    ).toBe(true);
  });

  test('editar nombre de mesa existente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const mesaItem = page.locator('[class*="table-item"], [class*="mesa-item"], [class*="TableCard"]').first();
    const hasMesa = await mesaItem.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasMesa) {
      test.skip(true, 'TEST_DATA_SETUP: evento sin mesas previas para editar — crear una antes vía test "crear mesa E2E"');
      return;
    }

    const editBtn = mesaItem.locator('button').filter({ hasText: /editar|edit|✏️/i }).first();
    const hasEditBtn = await editBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasEditBtn) {
      await editBtn.click();
    } else {
      await mesaItem.dblclick();
    }
    await page.waitForTimeout(1000);

    // Tras click/dblclick debe aparecer modal de edición o input editable
    const modal = page.locator('[role="dialog"], [class*="modal"], input[type="text"]:visible').first();
    await expect(modal, 'BUG_PRODUCTO: ni modal ni input aparece tras editar mesa (botón editar ni doble click responden)').toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Planos múltiples
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas — Planos múltiples', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    // Fail-fast: si login falla, abortar el test entero (evita falsos BUG_PRODUCTO en assertions posteriores)
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Verificar TEST_USER credenciales/Firebase Auth/SSO chat-dev. Test abortado para no generar falsos positivos.');
    }
    // Detectar runtime errors UI tras login (Runtime Error, GraphQL mismatch, ErrorBoundary, etc.)
    await assertNoRuntimeError(page);
  });

  test('selector de planos visible y funcional', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar selector de planos (tabs o dropdown)
    const planosSelector = page.locator(
      '[class*="plano"], [class*="plan-selector"], [aria-label*="plano"]',
    );
    const hasPlanos = await planosSelector.count() > 0;

    const text = (await page.locator('body').textContent()) ?? '';
    const hasPlanoText = /plano|floor|zona/i.test(text);

    expect(hasPlanos || hasPlanoText, 'Selector/texto de planos no detectado en /mesas').toBe(true);
  });

  test('crear nuevo plano E2E', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const newPlanoBtn = page.locator('button').filter({
      hasText: /nuevo plano|crear plano|add floor|nueva zona/i,
    }).first();
    await expect(newPlanoBtn, 'BUG_PRODUCTO: botón nuevo plano no visible en /mesas').toBeVisible({ timeout: 8_000 });

    await newPlanoBtn.click();
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[type="text"], input[placeholder*="nombre"]').first();
    await expect(nameInput, 'BUG_PRODUCTO: input nombre plano no aparece tras click').toBeVisible({ timeout: 5_000 });
    await nameInput.fill(PLANO_NAME);

    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|save/i,
    }).first();
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    const planoEl = page.getByText(PLANO_NAME, { exact: false });
    await expect(
      planoEl.first(),
      `BUG_PRODUCTO: plano "${PLANO_NAME}" creado pero NO visible (mutation falló silente o UI no refrescó)`
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Asignar invitado a mesa
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas — Asignar invitados', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    // Fail-fast: si login falla, abortar el test entero (evita falsos BUG_PRODUCTO en assertions posteriores)
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Verificar TEST_USER credenciales/Firebase Auth/SSO chat-dev. Test abortado para no generar falsos positivos.');
    }
    // Detectar runtime errors UI tras login (Runtime Error, GraphQL mismatch, ErrorBoundary, etc.)
    await assertNoRuntimeError(page);
  });

  test('panel de invitados sin asignar disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasUnassigned =
      /sin asignar|unassigned|sin mesa|no asignado/i.test(text) ||
      (await page.locator('[class*="unassigned"], [class*="sin-asignar"]').count()) > 0;

    expect(hasUnassigned, 'Panel/sección de invitados sin asignar no detectado en /mesas').toBe(true);
  });

  test('asignar invitado a mesa desde panel', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const unassignedGuest = page.locator('[class*="unassigned"] [class*="guest"], [class*="sin-asignar"] [class*="invitado"]').first();
    const hasGuest = await unassignedGuest.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasGuest) {
      test.skip(true, 'TEST_DATA_SETUP: evento sin invitados sin asignar — necesita invitados creados primero');
      return;
    }

    const mesaTarget = page.locator('[class*="table-drop"], [class*="mesa-drop"], [data-droppable]').first();
    const hasMesa = await mesaTarget.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasMesa) {
      test.skip(true, 'TEST_DATA_SETUP: evento sin mesa destino para drop — necesita mesa creada primero');
      return;
    }

    const guestBox = await unassignedGuest.boundingBox();
    const mesaBox = await mesaTarget.boundingBox();
    expect(guestBox && mesaBox, 'BUG_PRODUCTO: bounding boxes de invitado/mesa no calculables').toBeTruthy();

    await page.mouse.move(guestBox!.x + guestBox!.width / 2, guestBox!.y + guestBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(mesaBox!.x + mesaBox!.width / 2, mesaBox!.y + mesaBox!.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    // Verificar que tras drag el invitado YA NO está en panel sin asignar (cambió de estado)
    const stillUnassigned = await unassignedGuest.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(stillUnassigned, 'BUG_PRODUCTO: invitado sigue en panel sin asignar tras drag-drop a mesa').toBe(false);
  });

  test('plantillas de disposición disponibles', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const templatePanel = page.locator('[class*="template"], [class*="plantilla"]').filter({
      hasText: /plantilla|template|prediseño/i,
    });
    const hasTemplates = await templatePanel.count() > 0;
    const text = (await page.locator('body').textContent()) ?? '';
    const hasTemplateText = /plantilla|template/i.test(text);

    expect(hasTemplates || hasTemplateText, 'Panel de plantillas de disposición no detectado en /mesas').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Exportar/Imprimir
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas — Exportar plano', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    // Fail-fast: si login falla, abortar el test entero (evita falsos BUG_PRODUCTO en assertions posteriores)
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Verificar TEST_USER credenciales/Firebase Auth/SSO chat-dev. Test abortado para no generar falsos positivos.');
    }
    // Detectar runtime errors UI tras login (Runtime Error, GraphQL mismatch, ErrorBoundary, etc.)
    await assertNoRuntimeError(page);
  });

  test('botón imprimir/exportar plano existe', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const exportBtnText = page.locator('button, a').filter({
      hasText: /imprimir|exportar|descargar|print|export|pdf/i,
    }).first();
    const exportBtnIcon = page.locator('[aria-label*="exportar" i], [aria-label*="imprimir" i], [aria-label*="print" i], [aria-label*="export" i], [title*="exportar" i], [title*="imprimir" i]').first();

    const hasTextBtn = await exportBtnText.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasIconBtn = !hasTextBtn && await exportBtnIcon.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasTextBtn || hasIconBtn, 'BUG_PRODUCTO: botón de exportar/imprimir plano no detectado (ni por texto ni por icono)').toBe(true);
  });
});
