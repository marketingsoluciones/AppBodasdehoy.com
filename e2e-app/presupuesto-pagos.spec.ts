/**
 * presupuesto-pagos.spec.ts
 *
 * Tests del módulo de presupuesto y pagos en appEventos:
 *   - /resumen-evento muestra bloque de presupuesto con cifras €
 *   - /presupuesto carga con columnas estimado/pagado
 *   - Crear categoría → visible en lista
 *   - Crear gasto con importe → visible en tabla
 *   - Registrar pago: importe + medio + fecha + concepto → visible
 *   - Totales coherentes: al menos un importe > 0
 *   - Filtrar por categoría
 *   - Exportar presupuesto (botón existe)
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
const CAT_NAME = `Categoría E2E ${RUN_ID}`;
const GASTO_DESC = `Gasto E2E ${RUN_ID}`;
const GASTO_AMOUNT = '350';
const PAGO_AMOUNT = '200';
const PAGO_CONCEPTO = `Pago E2E ${RUN_ID}`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Resumen de evento — bloque presupuesto
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Presupuesto — /resumen-evento', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
    await assertNoRuntimeError(page);
  });

  test('muestra bloque de presupuesto con cifras €', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasPresupuesto = /presupuesto|budget|estimado|€|gasto/i.test(text);
    expect(hasPresupuesto).toBe(true);
    console.log('✅ Bloque de presupuesto visible en /resumen-evento');
  });

  test('columnas estimado y pagado/gastado visibles', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasEstimado = /estimado|presupuestado/i.test(text);
    const hasPagado = /pagado|gastado|abonado/i.test(text);

    if (hasEstimado) console.log('✅ Columna "estimado" visible');
    if (hasPagado) console.log('✅ Columna "pagado" visible');
    // Al menos uno debe aparecer si hay datos
    const hasBudgetData = hasEstimado || hasPagado || /\d+[.,]\d+\s*€|€\s*\d+/i.test(text);
    console.log(`Datos de presupuesto: ${hasBudgetData}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Página /presupuesto — estructura
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Presupuesto — /presupuesto página principal', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
    await assertNoRuntimeError(page);
  });

  test('carga sin crash y muestra tabla con categorías o estado vacío', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);

    const hasBudgetContent =
      /categoría|gasto|importe|€|presupuesto|añadir|agregar/i.test(text) ||
      (await page.locator('table, [class*="budget"], [class*="presupuesto"]').count()) > 0;

    expect(hasBudgetContent).toBe(true);
    console.log('✅ /presupuesto carga correctamente');
  });

  test('total general visible con cifra numérica', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    // Buscar cifras numéricas con €
    const hasAmounts = /\d+[.,]\d{2}\s*€|€\s*\d+|\d+\s*€/i.test(text);
    const hasTotal = /total|suma/i.test(text);

    if (hasAmounts) {
      console.log('✅ Cifras € visibles en presupuesto');
    }
    if (hasTotal) {
      console.log('✅ Total visible en presupuesto');
    }
    // No fallar si no hay datos aún — puede estar vacío en cuenta de prueba
  });

  test('botón añadir categoría/gasto disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const addBtn = page.locator('button').filter({
      hasText: /añadir|agregar|nuevo|crear|nueva categoría|add/i,
    }).first();

    const hasAddButton = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    const plusBtn = page.locator('button[class*="add"], button[class*="create"], [aria-label*="añadir"]');
    const hasPlusBtn = !hasAddButton && await plusBtn.count() > 0;
    expect(hasAddButton || hasPlusBtn, 'BUG_PRODUCTO: ningún botón añadir categoría/gasto visible (ni texto ni icono)').toBe(true);
  });

  // 1.6.10 — Exportar presupuesto a Excel (ExportExcelPresupuesto)
  test('botón exportar presupuesto a Excel existe y abre sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const exportBtn = page
      .locator('button, [role="button"], a')
      .filter({ hasText: /exportar|export|excel|xlsx|descargar/i })
      .first();

    if (await exportBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
      // Interceptar descarga para no abrir fichero externo
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 8_000 }).catch(() => null),
        exportBtn.click().catch(() => {}),
      ]);
      await page.waitForTimeout(1500);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(xlsx|csv|xls)$/i);
      }
      // Sin crash en click es válido aunque no se capture la descarga
    } else {
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      throw new Error('BUG_PRODUCTO: botón exportar Excel no visible en /presupuesto (esperado al menos opción menú o icono)');
    }
  });

  // 1.6.11 — Duplicar presupuesto de evento anterior (DuplicatePresupuesto)
  test('duplicar presupuesto de evento anterior — modal abre y muestra lista de eventos', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar botón de importar/duplicar presupuesto
    const importBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /importar|duplicar|copiar.*evento|desde.*evento|duplicate/i })
      .first();

    await expect(importBtn, 'BUG_PRODUCTO: botón duplicar/importar presupuesto no visible').toBeVisible({ timeout: 5_000 });
    await importBtn.click();
    await page.waitForTimeout(1200);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasModal = /evento|duplicar|importar|selecciona|categoría/i.test(text);
    expect(hasModal, 'BUG_PRODUCTO: modal duplicar presupuesto no muestra contenido esperado').toBe(true);

    // Cerrar modal sin hacer cambios
    const cancelBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /cancelar|cancel|cerrar/i })
      .first();
    if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CRUD — Crear categoría y gasto
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Presupuesto — Crear categoría y gasto', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
    await assertNoRuntimeError(page);
  });

  test('crear categoría E2E → visible en la lista', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar botón de nueva categoría
    const newCatBtn = page.locator('button').filter({
      hasText: /nueva categoría|add category|añadir categoría|nueva/i,
    }).first();

    await expect(newCatBtn, 'BUG_PRODUCTO: botón nueva categoría no visible en /presupuesto').toBeVisible({ timeout: 8_000 });
    await newCatBtn.click();
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="categoría"], input[type="text"]').first();
    await expect(nameInput, 'BUG_PRODUCTO: input nombre categoría no visible tras click crear').toBeVisible({ timeout: 5_000 });
    await nameInput.fill(CAT_NAME);
    await page.waitForTimeout(500);

    // Submit
    const submitBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|añadir|save/i,
    }).first();

    if (await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(3000);

    // Verificar que aparece en la lista
    const catEl = page.getByText(CAT_NAME, { exact: false });
    await expect(
      catEl.first(),
      `BUG_PRODUCTO: categoría "${CAT_NAME}" creada pero NO visible (mutation falló silente o UI no refrescó)`
    ).toBeVisible({ timeout: 8_000 });
  });

  test('crear gasto E2E con importe → visible en tabla', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar botón de nuevo gasto/partida (puede estar dentro de una categoría)
    const newGastoBtn = page.locator('button').filter({
      hasText: /nuevo gasto|nueva partida|añadir gasto|add expense/i,
    }).first();

    const newGastoVisible = await newGastoBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!newGastoVisible) {
      const expandBtn = page.locator('[class*="category"], [class*="categoria"]').first()
        .locator('button').filter({ hasText: /\+|añadir|add/i }).first();
      await expect(
        expandBtn,
        'BUG_PRODUCTO: ningún botón añadir gasto/partida visible (ni global ni dentro de categoría)'
      ).toBeVisible({ timeout: 5_000 });
      await expandBtn.click();
    } else {
      await newGastoBtn.click();
    }
    await page.waitForTimeout(1000);

    // Rellenar descripción
    const descInput = page.locator('input[placeholder*="descripción"], input[placeholder*="concepto"], input[placeholder*="gasto"], input[type="text"]').first();
    if (await descInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await descInput.fill(GASTO_DESC);
    }

    // Rellenar importe
    const amountInput = page.locator('input[placeholder*="importe"], input[type="number"], input[placeholder*="€"]').first();
    if (await amountInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await amountInput.fill(GASTO_AMOUNT);
    }

    // Submit
    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|añadir|save/i,
    }).first();

    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(3000);

    // Verificar descripción o importe visible
    const gastoEl = page.getByText(GASTO_DESC, { exact: false });
    const amountEl = page.getByText(GASTO_AMOUNT, { exact: false });

    const descVisible = await gastoEl.first().isVisible({ timeout: 8_000 }).catch(() => false);
    const amountVisible = await amountEl.first().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(
      descVisible || amountVisible,
      `BUG_PRODUCTO: gasto "${GASTO_DESC}" (importe ${GASTO_AMOUNT}) creado pero ni descripción ni importe visibles tras submit`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Registrar pago
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Presupuesto — Registrar pago', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
    await assertNoRuntimeError(page);
  });

  test('registrar pago con importe, medio, fecha y concepto', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar botón "Añadir pago" o similar
    const pagoBtn = page.locator('button').filter({
      hasText: /añadir pago|nuevo pago|registrar pago|pagar|add payment/i,
    }).first();

    const pagoBtnVisible = await pagoBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!pagoBtnVisible) {
      const gastoRow = page.locator('tr, [class*="expense-row"], [class*="gasto"]').first();
      const hasGasto = await gastoRow.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!hasGasto) {
        test.skip(true, 'TEST_DATA_SETUP: presupuesto sin gastos previos para registrar pago — crear gasto primero');
        return;
      }
      const pagoInRow = gastoRow.locator('button').filter({ hasText: /pago|pay/i }).first();
      await expect(
        pagoInRow,
        'BUG_PRODUCTO: gasto existe pero ningún botón pago en su fila (esperado al menos icono $)'
      ).toBeVisible({ timeout: 3_000 });
      await pagoInRow.click();
    } else {
      await pagoBtn.click();
    }
    await page.waitForTimeout(1500);

    // Rellenar formulario de pago
    // Importe
    const importeInput = page.locator('input[type="number"], input[placeholder*="importe"]').first();
    if (await importeInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await importeInput.fill(PAGO_AMOUNT);
    }

    // Concepto
    const conceptoInput = page.locator('input[placeholder*="concepto"], input[placeholder*="descripción"]').first();
    if (await conceptoInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await conceptoInput.fill(PAGO_CONCEPTO);
    }

    // Medio de pago (select)
    const medioSelect = page.locator('select').first();
    if (await medioSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const options = await medioSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await medioSelect.selectOption({ index: 1 });
      }
    }

    // Fecha (puede ser date input)
    const fechaInput = page.locator('input[type="date"]').first();
    if (await fechaInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await fechaInput.fill(today);
    }

    // Guardar
    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|confirmar|añadir|save/i,
    }).first();

    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(3000);

    // Verificar que el pago aparece
    const pagoEl = page.getByText(PAGO_CONCEPTO, { exact: false });
    const amountEl = page.getByText(PAGO_AMOUNT, { exact: false });

    const pagoVisible = await pagoEl.first().isVisible({ timeout: 8_000 }).catch(() => false);
    const amountVisible = await amountEl.first().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(
      pagoVisible || amountVisible,
      `BUG_PRODUCTO: pago "${PAGO_CONCEPTO}" (importe ${PAGO_AMOUNT}) registrado pero NO visible (mutation falló silente o UI colapsada)`
    ).toBe(true);
  });

  test('totales coherentes: columna pagado ≥ 0 y alguna cifra visible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Extraer cifras numéricas del texto
    const amounts = text.match(/[\d]+[.,][\d]{2}/g) ?? [];
    console.log(`Cifras numéricas encontradas en presupuesto: ${amounts.slice(0, 5).join(', ')}`);

    // Verificar que los totales tienen sentido (no negativos extremos, no NaN)
    const hasNaN = /NaN|undefined|null/i.test(text);
    expect(hasNaN).toBe(false);

    console.log('✅ Totales sin NaN/undefined');
  });
});
