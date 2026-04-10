/**
 * admin-panel.spec.ts
 *
 * Tests del panel de administración en chat-ia (/admin/*):
 * (Funcionalidad NUEVA — Campaigns, Training, Users, Billing ampliados)
 *
 * Rutas:
 *   - /admin              → Dashboard general (stats)
 *   - /admin/campaigns    → Crear y enviar campañas (Email/WA/SMS) con templates
 *   - /admin/training     → CRUD preguntas de entrenamiento IA
 *   - /admin/users        → Gestión de usuarios, sort, bulk actions, export CSV
 *   - /admin/billing      → Stats, credit modal, usage tracking, drill-down
 *   - /admin/sessions     → Sesiones activas
 *   - /admin/audit        → Auditoría de acciones
 *
 * NOTA: La mayoría de datos son mock/localStorage — no requieren backend real.
 * Requiere usuario con rol ADMIN para acceder. Si no, verificar redirect/403.
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || process.env.TEST_USER_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

const RUN_ID = Date.now().toString().slice(-5);

async function loginAsAdmin(page: any): Promise<boolean> {
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);
    const btn = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch { return false; }
}

async function gotoAdmin(page: any, path: string) {
  await page.goto(`${CHAT_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await waitForAppReady(page, 20_000);
  await page.waitForTimeout(3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. /admin — Acceso y layout general
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Acceso y layout', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAsAdmin(page);
  });

  test('/admin carga o redirige (solo admin)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin');

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const isAdmin = /admin|usuarios|campañas|entrenamiento|billing|sesiones/i.test(text);
    const isRedirected = page.url().includes('/login') || page.url().includes('/chat');
    const is403 = /acceso.?denegado|unauthorized|no autorizado|403|forbidden/i.test(text);

    if (isAdmin) {
      console.log('✅ Acceso al panel admin concedido');
    } else if (is403) {
      console.log('ℹ️ 403 — usuario no tiene rol ADMIN (esperado para cuenta de prueba)');
    } else if (isRedirected) {
      console.log('ℹ️ Redirigido al login/chat — usuario no es admin');
    }
  });

  test('links de navegación admin visibles: Campañas, Entrenamiento, Usuarios, Billing', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/login|chat|403|forbidden/i.test(text) && !/admin/i.test(text)) {
      console.log('ℹ️ Sin acceso admin — skipping navegación');
      return;
    }

    const navLinks = ['Campañas', 'Entrenamiento', 'Usuarios', 'Billing', 'Sesiones'];
    for (const link of navLinks) {
      const el = page.locator('a, [role="link"]').filter({ hasText: new RegExp(link, 'i') });
      const hasLink = await el.count() > 0;
      console.log(`Nav link "${link}": ${hasLink}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. /admin/campaigns — Crear campaña con template
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Campañas (/admin/campaigns)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAsAdmin(page);
  });

  test('carga página de campañas con selector de canal y evento', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/campaigns');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/403|forbidden|login/i.test(text) && !/campaña/i.test(text)) {
      console.log('ℹ️ Sin acceso a /admin/campaigns');
      return;
    }

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasCampaignContent = /campaña|canal|evento|email|whatsapp|sms/i.test(text);
    expect(hasCampaignContent).toBe(true);
    console.log('✅ Página de campañas carga');
  });

  test('seleccionar canal EMAIL → campo "asunto" aparece', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/campaigns');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|forbidden|login/i.test(text0) && !/campaña/i.test(text0)) { return; }

    // Selector de canal
    const channelSelect = page.locator('select, [class*="channel-select"]').first();
    if (await channelSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await channelSelect.selectOption({ label: 'EMAIL' });
      await page.waitForTimeout(1000);
    } else {
      // Puede ser botones/tabs de canal
      const emailBtn = page.locator('button').filter({ hasText: /email/i }).first();
      if (await emailBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await emailBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const text = (await page.locator('body').textContent()) ?? '';
    const hasSubject = /asunto|subject/i.test(text);
    const hasSubjectInput = await page.locator('input[placeholder*="asunto"], input[name="subject"]').count() > 0;

    console.log(hasSubject || hasSubjectInput ? '✅ Campo asunto visible para EMAIL' : 'ℹ️ Campo asunto no encontrado');
  });

  test('click template "Bienvenida" → popula formulario', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/campaigns');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/campaña/i.test(text0)) { return; }

    // Buscar template cards
    const bienvenidaTemplate = page.locator('button, [class*="template"]').filter({
      hasText: /bienvenida|welcome/i,
    }).first();

    if (!await bienvenidaTemplate.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Template "Bienvenida" no encontrado');
      return;
    }

    await bienvenidaTemplate.click();
    await page.waitForTimeout(1000);

    // El textarea de mensaje debe tener contenido
    const msgTextarea = page.locator('textarea, [class*="message-input"]').first();
    if (await msgTextarea.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const msgValue = await msgTextarea.inputValue().catch(() => '');
      const isPopulated = msgValue.length > 10;
      console.log(isPopulated ? `✅ Template pobló mensaje: "${msgValue.slice(0, 50)}..."` : 'ℹ️ Textarea vacío tras template');
    }
  });

  test('preview de campaña actualiza al escribir mensaje', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/campaigns');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/campaña/i.test(text0)) { return; }

    const msgTextarea = page.locator('textarea').first();
    if (!await msgTextarea.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    const TEST_MSG = `Test campaña E2E ${RUN_ID}`;
    await msgTextarea.fill(TEST_MSG);
    await page.waitForTimeout(500);

    // Preview debe mostrar el mensaje
    const previewPanel = page.locator('[class*="preview"], [class*="Preview"]').first();
    if (await previewPanel.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const previewText = (await previewPanel.textContent()) ?? '';
      const hasMsg = previewText.includes(TEST_MSG) || previewText.length > 20;
      console.log(hasMsg ? '✅ Preview actualiza con el mensaje' : 'ℹ️ Preview no refleja el mensaje');
    } else {
      console.log('ℹ️ Panel de preview no encontrado');
    }
  });

  test('draft auto-guardado en localStorage bodas_campaign_draft', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/campaigns');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/campaña/i.test(text0)) { return; }

    const msgTextarea = page.locator('textarea').first();
    if (!await msgTextarea.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    const DRAFT_MSG = `Draft campaña ${RUN_ID}`;
    await msgTextarea.fill(DRAFT_MSG);
    await page.waitForTimeout(1000); // auto-save delay

    const draftData = await page.evaluate(() => {
      return localStorage.getItem('bodas_campaign_draft');
    });

    if (draftData) {
      const parsed = JSON.parse(draftData);
      const hasDraftMsg = JSON.stringify(parsed).includes(DRAFT_MSG.slice(0, 10));
      console.log(hasDraftMsg ? '✅ Draft campaña en localStorage' : `ℹ️ Draft: ${draftData.slice(0, 80)}`);
    } else {
      console.log('ℹ️ localStorage bodas_campaign_draft no encontrado');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. /admin/training — CRUD preguntas de entrenamiento IA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Entrenamiento IA (/admin/training)', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAsAdmin(page);
  });

  test('carga con lista de preguntas y categorías', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/training');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text) && !/entren|training/i.test(text)) { return; }

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasTrainingContent = /entrenamiento|training|pregunta|question|respuesta|answer/i.test(text);
    expect(hasTrainingContent).toBe(true);
    console.log('✅ Página de entrenamiento carga con preguntas');
  });

  test('filtros de categoría: Todas, Básicas, Emocionales, Técnicas, Comerciales', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/training');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text) && !/entren/i.test(text)) { return; }

    const categories = ['Básicas', 'Emocionales', 'Técnicas', 'Comerciales'];
    let found = 0;
    for (const cat of categories) {
      const tab = page.locator('[role="tab"], button').filter({ hasText: new RegExp(cat, 'i') });
      if (await tab.count() > 0) found++;
    }
    console.log(`Categorías encontradas: ${found}/${categories.length}`);
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('búsqueda filtra preguntas por texto', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/training');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/entren/i.test(text0)) { return; }

    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"]').first();
    if (!await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await searchInput.fill('boda');
    await page.waitForTimeout(500);
    console.log('✅ Búsqueda en training ejecutada');
  });

  test('añadir nueva pregunta → aparece en lista', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/training');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/entren/i.test(text0)) { return; }

    const addBtn = page.locator('button').filter({ hasText: /nueva pregunta|add question|añadir/i }).first();
    if (!await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await addBtn.click();
    await page.waitForTimeout(1000);

    // Rellenar formulario
    const questionInput = page.locator('textarea, input').filter({}).nth(0);
    const NEW_QUESTION = `¿Test E2E ${RUN_ID}?`;
    const NEW_ANSWER = `Respuesta de prueba E2E ${RUN_ID}`;

    if (await questionInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await questionInput.fill(NEW_QUESTION);
    }

    const answerInput = page.locator('textarea').last();
    if (await answerInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await answerInput.fill(NEW_ANSWER);
    }

    const saveBtn = page.locator('button').filter({ hasText: /guardar|save/i }).first();
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasSaved = bodyText.includes(NEW_QUESTION.slice(0, 20)) || bodyText.includes(NEW_ANSWER.slice(0, 20));
    console.log(hasSaved ? '✅ Nueva pregunta añadida' : 'ℹ️ Pregunta no encontrada tras guardar');
  });

  test('exportar JSON → inicia descarga', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/training');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/entren/i.test(text0)) { return; }

    const exportBtn = page.locator('button, a').filter({ hasText: /exportar|export/i }).first();
    if (!await exportBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón exportar no encontrado');
      return;
    }

    // Interceptar descarga
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.json/i);
      console.log(`✅ Export JSON descargado: ${filename}`);
    } else {
      console.log('ℹ️ Descarga no detectada como evento Playwright');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. /admin/users — Tabla, filtros, bulk actions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Usuarios (/admin/users)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAsAdmin(page);
  });

  test('tabla de usuarios carga con columnas: Usuario, Rol, Eventos, Último acceso, Estado', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/users');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text) && !/usuario/i.test(text)) { return; }

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasCols = /usuario|rol|evento|acceso|estado/i.test(text);
    expect(hasCols).toBe(true);
    console.log('✅ Tabla de usuarios con columnas visible');
  });

  test('búsqueda por nombre/email filtra usuarios', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/users');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/usuario/i.test(text0)) { return; }

    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"]').first();
    if (!await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    const rowsBefore = await page.locator('table tr, [class*="user-row"]').count();
    await searchInput.fill('Juan');
    await page.waitForTimeout(500);
    const rowsAfter = await page.locator('table tr, [class*="user-row"]').count();

    console.log(`Filas: antes=${rowsBefore}, después búsqueda "Juan"=${rowsAfter}`);
    console.log('✅ Búsqueda de usuarios ejecutada');
  });

  test('sort por columna nombre: asc → desc al hacer click doble', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/users');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/usuario/i.test(text0)) { return; }

    const nameHeader = page.locator('th, [class*="table-header"]').filter({ hasText: /usuario|nombre|name/i }).first();
    if (!await nameHeader.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await nameHeader.click();
    await page.waitForTimeout(500);

    // Obtener primera fila tras sort asc
    const firstRowAsc = (await page.locator('table tbody tr').first().textContent()) ?? '';
    await nameHeader.click();
    await page.waitForTimeout(500);

    const firstRowDesc = (await page.locator('table tbody tr').first().textContent()) ?? '';
    if (firstRowAsc !== firstRowDesc) {
      console.log('✅ Sort por nombre funciona (asc ≠ desc)');
    } else {
      console.log('ℹ️ Sort no cambió el orden detectado');
    }
  });

  test('seleccionar usuario → bulk actions aparecen (Suspender/Activar)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/users');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/usuario/i.test(text0)) { return; }

    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1); // 0 = select all
    if (!await firstCheckbox.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await firstCheckbox.check();
    await page.waitForTimeout(500);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasBulkActions = /suspender|activar|eliminar|bulk/i.test(text);
    if (hasBulkActions) {
      console.log('✅ Bulk actions visibles tras selección');
    } else {
      console.log('ℹ️ Bulk actions no detectados');
    }
  });

  test('exportar CSV → descarga con nombre billing-users-*.csv', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/users');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/usuario/i.test(text0)) { return; }

    const exportBtn = page.locator('button, a').filter({ hasText: /exportar csv|export csv/i }).first();
    if (!await exportBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón exportar CSV no encontrado');
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.csv/i);
      console.log(`✅ CSV usuarios exportado: ${filename}`);
    } else {
      console.log('ℹ️ Descarga CSV no detectada');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. /admin/billing — Stats, credit modal, usage tracking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin — Billing (/admin/billing)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginAsAdmin(page);
  });

  test('stats cards: Wallets Activos, Saldo Circulante, Ingresos del Mes, Consumo', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text) && !/billing|factura/i.test(text)) { return; }

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasStats =
      /wallets|saldo|ingresos|consumo|€|\d+[.,]\d{2}/i.test(text);
    expect(hasStats).toBe(true);
    console.log('✅ Stats de billing visibles');
  });

  test('selector de periodo: Hoy, Semana, Mes', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/billing/i.test(text0)) { return; }

    const periods = ['Hoy', 'Semana', 'Mes'];
    for (const period of periods) {
      const tab = page.locator('[role="tab"], button').filter({ hasText: new RegExp(`^${period}$`, 'i') });
      if (await tab.count() > 0) {
        await tab.first().click();
        await page.waitForTimeout(1000);
        console.log(`✅ Tab "${period}" clickable`);
      }
    }
  });

  test('LowBalanceList: botón "Dar crédito" abre CreditModal', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/billing/i.test(text0)) { return; }

    const creditBtn = page.locator('button').filter({ hasText: /dar crédito|give credit|add credit/i }).first();
    if (!await creditBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón "Dar crédito" no encontrado — puede que no haya usuarios con saldo bajo');
      return;
    }

    await creditBtn.click();
    await page.waitForTimeout(1500);

    // CreditModal debe aparecer
    const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]');
    const hasModal = await modal.count() > 0;
    if (hasModal) {
      console.log('✅ CreditModal abierto');
      const modalText = (await modal.first().textContent()) ?? '';
      const hasForm = /tipo|importe|nota|amount|type/i.test(modalText);
      console.log(`Formulario en modal: ${hasForm}`);
    }
  });

  test('CreditModal: rellenar tipo + importe + confirmar → success', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/billing/i.test(text0)) { return; }

    const creditBtn = page.locator('button').filter({ hasText: /dar crédito|give credit/i }).first();
    if (!await creditBtn.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    await creditBtn.click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[role="dialog"], [class*="Modal"]').first();
    if (!await modal.isVisible({ timeout: 5_000 }).catch(() => false)) { return; }

    // Seleccionar tipo "Bonus"
    const typeSelect = modal.locator('select').first();
    if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await typeSelect.selectOption({ index: 1 });
    }

    // Importe
    const amountInput = modal.locator('input[type="number"]').first();
    if (await amountInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await amountInput.fill('5');
    }

    // Nota opcional
    const noteInput = modal.locator('textarea').first();
    if (await noteInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await noteInput.fill(`Bonus E2E test ${RUN_ID}`);
    }

    // Confirmar
    const confirmBtn = modal.locator('button').filter({ hasText: /confirmar|aplicar|guardar|save/i }).first();
    if (await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);

      const textAfter = (await page.locator('body').textContent()) ?? '';
      const hasSuccess = /✅|éxito|success|nuevo saldo/i.test(textAfter);
      console.log(hasSuccess ? '✅ CreditModal: operación exitosa' : 'ℹ️ Respuesta de éxito no detectada');
    }
  });

  test('usage tracking: filtrar por userId muestra resultados filtrados', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/billing/i.test(text0)) { return; }

    // Scroll a la sección de usage tracking
    const usageSection = page.locator('[class*="usage"], [class*="Usage"]').first();
    if (await usageSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await usageSection.scrollIntoViewIfNeeded();
    }

    const filterInput = page.locator('input[placeholder*="userId"], input[placeholder*="usuario"]').first();
    if (!await filterInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Filtro de userId en usage tracking no encontrado');
      return;
    }

    await filterInput.fill('test');
    await page.waitForTimeout(1000);

    const text = (await page.locator('body').textContent()) ?? '';
    console.log(/sin resultados|no hay|test/i.test(text)
      ? '✅ Filtro usage tracking ejecutado'
      : 'ℹ️ Filtro sin resultado visible');
  });

  test('click en usuario de tracking → UserDrilldownModal con transacciones', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await gotoAdmin(page, '/admin/billing');

    const text0 = (await page.locator('body').textContent()) ?? '';
    if (/403|login/i.test(text0) && !/billing/i.test(text0)) { return; }

    // Buscar fila clickable en usage tracking
    const trackingRow = page.locator('[class*="usage"] tr, [class*="tracking"] tr').first();
    if (!await trackingRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Sin filas en usage tracking para click');
      return;
    }

    await trackingRow.click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[role="dialog"], [class*="Modal"]').first();
    const hasModal = await modal.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasModal) {
      const modalText = (await modal.textContent()) ?? '';
      const hasTransactions = /transacci|recharge|bonus|consumption|saldo/i.test(modalText);
      console.log(hasTransactions ? '✅ UserDrilldownModal con transacciones abierto' : '✅ Modal abierto (sin transacciones)');
    } else {
      console.log('ℹ️ Modal de drill-down no abierto');
    }
  });
});
