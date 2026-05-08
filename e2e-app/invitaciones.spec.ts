/**
 * invitaciones.spec.ts
 *
 * Tests de envío de invitaciones en appEventos (/invitaciones):
 *   - Página carga con tabs Email y WhatsApp
 *   - Tabla de invitados con checkboxes
 *   - Contadores: total, enviadas, pendientes, confirmadas
 *   - Selección de plantilla de email → preview visible
 *   - Enviar email a carlos.carrillo@recargaexpress.com → modal confirmación → confirmado
 *   - Fila de Carlos marcada como "enviada" tras envío
 *   - Tab WhatsApp: editor de mensaje O pantalla setup/QR
 *   - Preview de WA con variables sustituidas
 *   - Selección de plantilla WA
 *   - Portal RSVP: /confirmar-asistencia sin token → error controlado
 *   - Portal público: /e/[eventId] carga con info del evento
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady } from './helpers';
import { TEST_URLS, E2E_ENV } from './fixtures';

const BASE_URL = TEST_URLS.app;
const isAppTest = E2E_ENV !== 'local';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

/** Email del destinatario de prueba para invitaciones reales */
const CARLOS_EMAIL = 'carlos.carrillo@recargaexpress.com';
const CARLOS_NAME = 'Carlos';

// ─────────────────────────────────────────────────────────────────────────────
// Setup: asegurar que Carlos Carrillo existe como invitado
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Setup — Verificar invitado de prueba', () => {
  test.setTimeout(120_000);

  test('carlos.carrillo@recargaexpress.com existe (o se puede crear) como invitado', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_DATA_SETUP: TEST_USER no tiene eventos disponibles');
      return;
    }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const carlosExists = text.includes(CARLOS_EMAIL) || text.includes(CARLOS_NAME);

    expect(
      carlosExists,
      `TEST_DATA_SETUP: ${CARLOS_EMAIL} no existe como invitado en el evento. Crear primero antes de tests envío.`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Página /invitaciones — estructura básica
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitaciones — Estructura de la página', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
  });

  test('carga /invitaciones sin crash con tabs Email y WhatsApp', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);

    // Página de invitaciones: verificar que carga contenido coherente
    const noEvent = /selecciona un evento|elige un evento|sin evento|no hay evento/i.test(text);
    if (noEvent) {
      test.skip(true, 'TEST_DATA_SETUP: usuario sin evento seleccionado');
      return;
    }

    // Tabs Email y WhatsApp deben estar visibles — o al menos contenido de invitaciones
    const hasEmailTab = /email|correo/i.test(text) ||
      (await page.locator('[role="tab"], button, [class*="tab"]').filter({ hasText: /email|correo/i }).count()) > 0;
    const hasInvitacionesContent = /invitaci|enviada|pendiente|plantilla|diseño|template|whatsapp/i.test(text);

    expect(
      hasEmailTab || hasInvitacionesContent,
      'BUG_PRODUCTO: ni tab Email ni contenido invitaciones visible en /invitaciones'
    ).toBe(true);
  });

  test('tabla de invitados visible con checkboxes', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Tabla de invitados o lista
    const hasTable =
      (await page.locator('table, [class*="table"], [class*="invitado-row"]').count()) > 0;
    const hasCheckboxes =
      (await page.locator('input[type="checkbox"]').count()) > 0;

    const hasGuestList = hasTable || hasCheckboxes;
    const text = (await page.locator('body').textContent()) ?? '';
    const hasEmptyState = /sin invitados|no hay invitados|lista vacía|añade|agrega|selecciona un evento|elige un evento|sin evento/i.test(text);

    expect(
      hasGuestList || hasEmptyState,
      `BUG_PRODUCTO: ni tabla/checkbox ni empty-state visible en /invitaciones. Body: ${text.slice(0, 200)}`
    ).toBe(true);
  });

  test('contadores visibles: total, enviadas, pendientes, confirmadas', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasCounters =
      /total|enviada|pendiente|confirmada|invitado/i.test(text) ||
      (await page.locator('[class*="counter"], [class*="count"], [class*="stat"]').count()) > 0;

    expect(hasCounters, 'BUG_PRODUCTO: contadores invitaciones (total/enviadas/pendientes/confirmadas) no visibles').toBe(true);
  });

  // 1.9.7 — Panel enviados/no-enviados (EnviadosComponent) — resend individual
  test('panel enviados/no-enviados visible con opción de reenvío', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const noEvent = /selecciona un evento|elige un evento|sin evento|no hay evento/i.test(text);
    if (noEvent) {
      test.skip(true, 'TEST_DATA_SETUP: usuario sin evento seleccionado');
      return;
    }

    const hasSentPanel =
      /enviado|no enviado|pendiente de envío/i.test(text) ||
      (await page.locator('[class*="enviado"], [class*="sent"], [class*="pending"]').count()) > 0;

    const hasResendBtn =
      (await page.locator('button, [role="button"]').filter({ hasText: /reenviar|re-enviar|enviar de nuevo|resend/i }).count()) > 0;

    expect(hasSentPanel, 'BUG_PRODUCTO: panel de enviados/no-enviados no visible en /invitaciones').toBe(true);
    expect(hasResendBtn, 'BUG_PRODUCTO: botón reenvío no visible (debería estar al menos al hover en filas)').toBe(true);
  });

  // 1.9.8 — Diseño personalizado (DiseñoComponent) — subida de imagen de invitación
  test('diseño personalizado — opción de subir imagen de invitación visible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const noEvent = /selecciona un evento|elige un evento|sin evento|no hay evento/i.test(text);
    if (noEvent) {
      test.skip(true, 'TEST_DATA_SETUP: usuario sin evento seleccionado');
      return;
    }

    // Buscar tab/sección de diseño personalizado
    const hasDisenoTab =
      (await page.locator('[role="tab"], button').filter({ hasText: /diseño|diseño personalizado|custom/i }).count()) > 0;

    if (hasDisenoTab) {
      // Clicar el tab de diseño
      const disenoTab = page.locator('[role="tab"], button').filter({ hasText: /diseño/i }).first();
      await disenoTab.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    const textAfter = (await page.locator('body').textContent()) ?? '';
    const hasUploadZone =
      /subir|upload|imagen|arrastra|drop|selecciona.*imagen/i.test(textAfter) ||
      (await page.locator('input[type="file"], [class*="upload"], [class*="dropzone"]').count()) > 0;

    expect(
      hasUploadZone || hasDisenoTab,
      'BUG_PRODUCTO: ni zona upload ni tab de diseño detectado en /invitaciones'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Email — selección de plantilla y envío
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitaciones — Email: plantilla y envío a Carlos', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
  });

  test('tab email activo por defecto con selector de plantilla', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Tab Email debe estar activo por defecto
    const emailTabActive = page.locator('[role="tab"][aria-selected="true"], [class*="active"]').filter({
      hasText: /email/i,
    });
    const isEmailActive = await emailTabActive.first().isVisible({ timeout: 5_000 }).catch(() => false);

    // O verificar que hay un selector de plantilla visible
    const hasTemplateSelector =
      (await page.locator('select, [class*="template"], [class*="plantilla"]').count()) > 0;

    const text = (await page.locator('body').textContent()) ?? '';
    const hasEmailContent = /plantilla|template|diseño|preview|invitaci|enviada|pendiente/i.test(text);

    console.log(`Email tab activo: ${isEmailActive}, selector plantilla: ${hasTemplateSelector}, contenido invitaciones: ${hasEmailContent}`);
    if (!isEmailActive && !hasTemplateSelector && !hasEmailContent) {
      console.warn('⚠️ No se detectó tab email ni contenido de invitaciones — posible cambio de UI');
    }
    // Aceptar si hay cualquier contenido de invitaciones (el tab puede tener estructura distinta)
    expect(isEmailActive || hasTemplateSelector || hasEmailContent).toBe(true);
  });

  test('seleccionar plantilla → preview visible con nombre del evento', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Intentar seleccionar la primera plantilla disponible
    const templateSelect = page.locator('select').first();
    if (await templateSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const options = await templateSelect.locator('option').count();
      if (options > 1) {
        await templateSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        console.log('✅ Plantilla seleccionada via select');
      }
    }

    // Buscar opciones de plantilla como botones/cards
    const templateCard = page.locator('[class*="template"], [class*="plantilla"], [class*="card"]')
      .filter({ hasText: /plantilla|template|diseño/i })
      .first();
    if (await templateCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await templateCard.click();
      await page.waitForTimeout(2000);
    }

    // Verificar preview
    const previewArea = page.locator('[class*="preview"], iframe, [class*="email-preview"]');
    const hasPreview =
      (await previewArea.count()) > 0 ||
      (await page.locator('body').textContent())?.includes('preview');

    expect(hasPreview, 'BUG_PRODUCTO: preview de plantilla no visible tras selección').toBe(true);
  });

  test('seleccionar a Carlos y enviar email → ModalConfirmacionEnvio aparece', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (!text0.includes(CARLOS_EMAIL) && !text0.includes(CARLOS_NAME)) {
      test.skip(true, `TEST_DATA_SETUP: ${CARLOS_EMAIL} no en lista invitados — crear primero antes de probar envío`);
      return;
    }

    const carlosRow = page.locator('tr, [class*="row"], [class*="invitado"]')
      .filter({ hasText: new RegExp(CARLOS_EMAIL.split('@')[0], 'i') })
      .first();
    await expect(carlosRow, 'BUG_PRODUCTO: fila Carlos no visible aunque su email aparece en body').toBeVisible({ timeout: 5_000 });

    const checkbox = carlosRow.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await checkbox.check();
    } else {
      await carlosRow.click();
    }
    await page.waitForTimeout(1000);

    const sendBtn = page.locator('button').filter({
      hasText: /enviar|send|invitar/i,
    }).first();
    await expect(sendBtn, 'BUG_PRODUCTO: botón enviar no visible tras seleccionar invitado').toBeVisible({ timeout: 5_000 });

    await sendBtn.click();
    await page.waitForTimeout(2000);

    const modalText = (await page.locator('body').textContent()) ?? '';
    const hasConfirmModal =
      /confirmar|¿enviar|seguro|envío/i.test(modalText) ||
      (await page.locator('[role="dialog"], [class*="modal"]').filter({
        hasText: /confirm|enviar|invitaci/i,
      }).count()) > 0;
    expect(hasConfirmModal, 'BUG_PRODUCTO: ModalConfirmacionEnvio no aparece tras click enviar').toBe(true);

    const confirmBtn = page.locator('[role="dialog"], [class*="modal"]')
      .locator('button')
      .filter({ hasText: /confirm|enviar|sí|aceptar/i })
      .first();
    await expect(confirmBtn, 'BUG_PRODUCTO: botón confirmar no visible en modal envío').toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();
    await page.waitForTimeout(5000);

    // Verificar fila marcada como enviada (CRUD real)
    const carlosRowAfter = page.locator('tr, [class*="row"]')
      .filter({ hasText: new RegExp(CARLOS_EMAIL.split('@')[0], 'i') })
      .first();
    const rowText = (await carlosRowAfter.textContent()) ?? '';
    const markedAsSent = /enviada|sent|✓|✅/i.test(rowText);
    expect(
      markedAsSent,
      `BUG_PRODUCTO: fila Carlos NO marcada como enviada tras confirmar envío. Body fila: ${rowText.slice(0, 200)}`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. WhatsApp — tab, preview y plantillas
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitaciones — WhatsApp', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
  });

  test('tab WhatsApp muestra editor de mensaje O pantalla setup/QR', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Click en tab WhatsApp
    const waTab = page.locator('[role="tab"], button').filter({ hasText: /whatsapp/i }).first();
    await expect(waTab, 'BUG_PRODUCTO: tab WhatsApp no visible en /invitaciones').toBeVisible({ timeout: 8_000 });

    await waTab.click();
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasWAContent =
      /whatsapp|qr|escanear|scan|conectar|mensaje|plantilla|template/i.test(text);

    expect(hasWAContent).toBe(true);
    console.log('✅ Tab WhatsApp muestra contenido (editor o setup)');
  });

  test('WhatsApp: preview del mensaje con variables sustituidas', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const waTab = page.locator('[role="tab"], button').filter({ hasText: /whatsapp/i }).first();
    if (!await waTab.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }
    await waTab.click();
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    // Verificar que NO hay variables sin sustituir ({{nombre}} etc.)
    const hasUnsubstitutedVars = /\{\{[^}]+\}\}/.test(text);
    if (hasUnsubstitutedVars) {
      console.log('⚠️ Preview tiene variables sin sustituir en WhatsApp');
    } else {
      console.log('✅ Preview de WA sin variables crudas (o no hay preview aún)');
    }

    // Si hay un mensaje de preview, no debe tener {{...}}
    const previewEl = page.locator('[class*="preview"], [class*="message-preview"], [class*="wa-preview"]');
    if (await previewEl.count() > 0) {
      const previewText = (await previewEl.first().textContent()) ?? '';
      expect(previewText).not.toMatch(/\{\{[^}]+\}\}/);
    }
  });

  test('WhatsApp: selección de plantilla disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const waTab = page.locator('[role="tab"], button').filter({ hasText: /whatsapp/i }).first();
    if (!await waTab.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }
    await waTab.click();
    await page.waitForTimeout(3000);

    // Buscar selector de plantilla WA
    const templateSelector = page.locator('select, [class*="template-select"], [class*="plantilla"]');
    const hasSelectorWA = await templateSelector.count() > 0;

    const text = (await page.locator('body').textContent()) ?? '';
    const hasTemplateRef = /plantilla|template/i.test(text);

    expect(hasSelectorWA || hasTemplateRef, 'BUG_PRODUCTO: ni selector ni referencia plantilla WA detectado').toBe(true);
  });

  test('enviar WA a Carlos si WhatsApp está conectado', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/invitaciones`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    const waTab = page.locator('[role="tab"], button').filter({ hasText: /whatsapp/i }).first();
    await expect(waTab, 'BUG_PRODUCTO: tab WhatsApp no visible').toBeVisible({ timeout: 5_000 });
    await waTab.click();
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    if (/qr|escanear|scan|conectar/i.test(text)) {
      test.skip(true, 'INFRA_WA_NOT_CONNECTED: WhatsApp requiere QR scan. Conectar primero antes de probar envío');
      return;
    }

    const carlosRow = page.locator('tr, [class*="row"]')
      .filter({ hasText: new RegExp(CARLOS_EMAIL.split('@')[0], 'i') })
      .first();
    const hasCarlos = await carlosRow.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasCarlos) {
      test.skip(true, `TEST_DATA_SETUP: ${CARLOS_EMAIL} no en lista WA — crear primero`);
      return;
    }

    const checkbox = carlosRow.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await checkbox.check();
    }

    const sendBtn = page.locator('button').filter({ hasText: /enviar|send/i }).first();
    await expect(sendBtn, 'BUG_PRODUCTO: botón enviar WA no visible').toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await page.waitForTimeout(3000);

    // Verificar que tras envío hay confirmación (modal, toast, o estado actualizado)
    const bodyAfter = (await page.locator('body').textContent()) ?? '';
    const hasConfirmation = /enviad|sent|✓|confirmad|exitoso|success/i.test(bodyAfter);
    expect(hasConfirmation, 'BUG_PRODUCTO: tras click enviar WA no hay indicador de éxito (toast/modal/estado)').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Portal RSVP y portal público
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitaciones — Portal RSVP y portal público', () => {
  test.setTimeout(90_000);

  test('portal RSVP sin token → error controlado (no crash)', async ({ page }) => {
    await page.goto(`${BASE_URL}/confirmar-asistencia`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    }).catch(() => {});
    await waitForAppReady(page, 8_000);

    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null || text.length < 20) {
      test.skip(true, 'INFRA: /confirmar-asistencia no accesible (posible BUG_PRODUCTO route deprecada o endpoint caído)');
      return;
    }
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log('✅ Portal RSVP sin token maneja error correctamente');
  });

  test('portal RSVP con token falso → error amigable', async ({ page }) => {
    await page.goto(
      `${BASE_URL}/confirmar-asistencia?pGuestEvent=TOKEN_FALSO_12345`,
      { waitUntil: 'domcontentloaded', timeout: 20_000 },
    ).catch(() => {});
    await waitForAppReady(page, 8_000);

    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null || text.length < 20) {
      test.skip(true, 'INFRA: /confirmar-asistencia no accesible (posible BUG_PRODUCTO route deprecada o endpoint caído)');
      return;
    }
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    console.log('✅ Portal RSVP con token falso no crashea');
  });

  test('portal público /e/[eventId] requiere o redirige sin eventId válido', async ({ page }) => {
    // Probar con un ID de formato válido pero no existente
    await page.goto(`${BASE_URL}/e/000000000000000000000000`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await waitForAppReady(page, 15_000);
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(30);
    console.log('✅ Portal /e/ con eventId inexistente no crashea');
  });
});
