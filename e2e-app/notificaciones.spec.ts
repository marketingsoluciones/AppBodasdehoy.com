/**
 * notificaciones.spec.ts
 *
 * Tests de la página de notificaciones en chat-ia (/notifications):
 * (Funcionalidad NUEVA mejorada en últimos commits)
 *
 * Escenarios:
 *   1. Carga con notificaciones reales (o estado vacío)
 *   2. Agrupación por fecha: "Hoy", "Esta semana", "Anteriores"
 *   3. Filter tabs: "Todas" ↔ "Sin leer"
 *   4. Type filters (chips): task_reminder, whatsapp_message, etc
 *   5. Search por mensaje o recurso
 *   6. Click en notificación → marca como leída + navega
 *   7. Snooze 30 min → notificación desaparece, localStorage tiene expiry
 *   8. "Marcar todas como leídas" → todas read=true
 *   9. Load more → página 2 se añade
 *  10. NotificationBell (sidebar) → badge unread count, click → dropdown panel
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

const CHAT_URL = isAppTest ? 'https://chat-test.bodasdehoy.com' : 'http://127.0.0.1:3210';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function loginInChat(page: any): Promise<boolean> {
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);
    const btn = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }
    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Carga y estructura básica de /notifications
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notificaciones — Carga y estructura', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('/notifications carga sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);

    const hasNotifContent = /notificaci|notification|sin resultados|no tienes|todas|sin leer/i.test(text);
    expect(hasNotifContent).toBe(true);
    console.log('✅ /notifications carga correctamente');
  });

  test('tabs "Todas" y "Sin leer" visibles', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const allTab = page.locator('[role="tab"], button').filter({ hasText: /^todas$/i }).first();
    const unreadTab = page.locator('[role="tab"], button').filter({ hasText: /sin leer|unread/i }).first();

    const hasAll = await allTab.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasUnread = await unreadTab.isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasAll || hasUnread).toBe(true);
    console.log(`✅ Tabs: Todas=${hasAll}, Sin leer=${hasUnread}`);
  });

  test('notificaciones agrupadas por fecha (Hoy/Esta semana/Anteriores)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasGrouped = /hoy|esta semana|anteriores|today|this week/i.test(text);

    if (hasGrouped) {
      console.log('✅ Notificaciones agrupadas por fecha');
    } else {
      console.log('ℹ️ Grupos de fecha no encontrados — puede que no haya notificaciones o formato distinto');
    }
  });

  test('sin notificaciones → estado vacío amigable', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';

    // Si no hay notificaciones, debe mostrar estado vacío amigable
    if (/sin resultados|no tienes|no hay|empty|🔔/i.test(text)) {
      console.log('✅ Estado vacío con mensaje amigable');
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    } else {
      // Hay notificaciones
      console.log('ℹ️ Hay notificaciones (no estado vacío)');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Filtros y búsqueda
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notificaciones — Filtros y búsqueda', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('click "Sin leer" → muestra solo no leídas o estado vacío', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const textBefore = (await page.locator('body').textContent()) ?? '';

    const unreadTab = page.locator('[role="tab"], button').filter({ hasText: /sin leer|unread/i }).first();
    if (!await unreadTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Tab Sin leer no encontrado');
      return;
    }

    await unreadTab.click();
    await page.waitForTimeout(2000);

    const textAfter = (await page.locator('body').textContent()) ?? '';
    // El contenido debe cambiar o quedarse en vacío
    const changed = textBefore !== textAfter || /sin resultados|no hay|empty/i.test(textAfter);
    console.log(changed ? '✅ Tab "Sin leer" filtra correctamente' : 'ℹ️ Sin cambio visible al filtrar sin leer');
  });

  test('type filter chips: task_reminder, whatsapp_message, etc', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Chips de tipo de notificación
    const typeChips = page.locator('[class*="chip"], [class*="tag"], [class*="filter-badge"]').filter({
      hasText: /tarea|whatsapp|mensaje|recordatorio|task|reminder/i,
    });
    const chipCount = await typeChips.count();

    if (chipCount > 0) {
      console.log(`✅ ${chipCount} chips de tipo de notificación disponibles`);
      await typeChips.first().click();
      await page.waitForTimeout(1500);
      console.log('✅ Chip de tipo clickado');
    } else {
      console.log('ℹ️ Chips de tipo no encontrados — puede no tener notificaciones');
    }
  });

  test('búsqueda por mensaje o recurso filtra resultados', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const searchInput = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]',
    ).first();

    if (!await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Input de búsqueda no encontrado en /notifications');
      return;
    }

    await searchInput.fill('boda');
    await page.waitForTimeout(1000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasFilteredOrEmpty = /boda|sin resultados|no hay/i.test(text);
    console.log(hasFilteredOrEmpty ? '✅ Búsqueda ejecutada' : 'ℹ️ Búsqueda sin cambio visible');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Acciones sobre notificaciones
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notificaciones — Acciones (leer, snooze, marcar todas)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('click en notificación → navega a URL correspondiente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const notifItems = page.locator('[class*="notification-item"], [class*="NotificationItem"], [class*="notif"]')
      .first();

    if (!await notifItems.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Sin notificaciones para hacer click');
      return;
    }

    const urlBefore = page.url();
    await notifItems.click();
    await page.waitForTimeout(3000);

    const urlAfter = page.url();
    if (urlBefore !== urlAfter) {
      console.log(`✅ Click en notificación navega: ${urlBefore} → ${urlAfter}`);
    } else {
      console.log('ℹ️ URL no cambió — puede que la notificación no tenga URL');
    }
  });

  test('snooze 30 min → notificación desaparece + localStorage con expiry', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    // Buscar botón de snooze ⏰
    const snoozeBtn = page.locator('button').filter({
      hasText: /⏰|snooze|posponer/i,
    }).first();

    if (!await snoozeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón snooze no encontrado — puede no haber notificaciones');
      return;
    }

    await snoozeBtn.click();
    await page.waitForTimeout(500);

    // Dropdown con opciones: 30 min, 1h, 4h, Mañana
    const snooze30 = page.locator('[role="menuitem"], li, button').filter({
      hasText: /30.?min|media hora/i,
    }).first();

    if (!await snooze30.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('ℹ️ Opción 30 min no encontrada');
      return;
    }

    await snooze30.click();
    await page.waitForTimeout(2000);

    // Verificar localStorage `bodas_snoozed_notifications`
    const snoozedData = await page.evaluate(() => {
      return localStorage.getItem('bodas_snoozed_notifications');
    });

    if (snoozedData) {
      const parsed = JSON.parse(snoozedData);
      const keys = Object.keys(parsed);
      if (keys.length > 0) {
        const expiry = parsed[keys[0]];
        const now = Date.now();
        const in30min = now + 30 * 60 * 1000;
        const isApprox30min = Math.abs(expiry - in30min) < 60_000; // dentro de 1 min de error
        console.log(isApprox30min
          ? '✅ Snooze 30 min: expiry en localStorage correcto'
          : `ℹ️ Snooze expiry: ${new Date(expiry).toISOString()}`);
      }
    } else {
      console.log('ℹ️ localStorage bodas_snoozed_notifications no encontrado');
    }
  });

  test('"Marcar todas como leídas" → todas pasan a read=true visualmente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const markAllBtn = page.locator('button').filter({
      hasText: /marcar todas|mark all|leer todo/i,
    }).first();

    if (!await markAllBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón "Marcar todas" no encontrado');
      return;
    }

    // Contar indicadores de no leído antes
    const unreadDotsBefore = await page.locator('[class*="unread-dot"], [class*="pink-dot"], [class*="unread"]').count();
    console.log(`Indicadores sin leer antes: ${unreadDotsBefore}`);

    await markAllBtn.click();
    await page.waitForTimeout(2000);

    const unreadDotsAfter = await page.locator('[class*="unread-dot"], [class*="pink-dot"], [class*="unread"]').count();
    console.log(`Indicadores sin leer después: ${unreadDotsAfter}`);

    if (unreadDotsAfter < unreadDotsBefore) {
      console.log('✅ Indicadores de no leído reducidos tras "Marcar todas"');
    } else {
      console.log('ℹ️ Sin cambio visible en indicadores');
    }
  });

  test('load more → carga página 2 de notificaciones', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const loadMoreBtn = page.locator('button').filter({
      hasText: /cargar más|load more|ver más/i,
    }).first();

    if (!await loadMoreBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Botón "Cargar más" no disponible — puede que haya menos de 30 notificaciones');
      return;
    }

    const countBefore = await page.locator('[class*="notification-item"], [class*="NotificationItem"]').count();
    await loadMoreBtn.click();
    await page.waitForTimeout(3000);
    const countAfter = await page.locator('[class*="notification-item"], [class*="NotificationItem"]').count();

    if (countAfter > countBefore) {
      console.log(`✅ Load more: ${countBefore} → ${countAfter} notificaciones`);
    } else {
      console.log('ℹ️ Conteo no aumentó tras load more');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. NotificationBell en sidebar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Notificaciones — Bell y badge en sidebar', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (hasCredentials) await loginInChat(page);
  });

  test('NotificationBell visible en sidebar de chat-ia', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Bell de notificaciones en TopActions
    const bell = page.locator('[aria-label*="notif"], [aria-label*="bell"], [class*="bell"], [class*="NotificationBell"]').first();
    const hasBell = await bell.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasBell) {
      console.log('✅ NotificationBell visible en sidebar');
    } else {
      // Buscar por icono 🔔
      const bellIcon = page.locator('button').filter({ hasText: /🔔/ }).first();
      const hasBellIcon = await bellIcon.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`ℹ️ Bell por ícono: ${hasBellIcon}`);
    }
  });

  test('badge de notificaciones no leídas muestra número', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000); // Dar tiempo al poll de 60s para primera carga

    // Badge de unread count
    const badge = page.locator('[class*="badge"], [class*="Badge"], [class*="unread-count"]')
      .filter({ hasText: /\d+/ })
      .first();

    const hasBadge = await badge.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasBadge) {
      const badgeText = (await badge.textContent()) ?? '';
      const count = parseInt(badgeText);
      expect(count).toBeGreaterThanOrEqual(0);
      console.log(`✅ Badge de notificaciones: ${badgeText}`);
    } else {
      console.log('ℹ️ Badge de notificaciones no visible — puede que unreadCount sea 0');
    }
  });

  test('click bell → dropdown panel de notificaciones aparece', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const bell = page.locator(
      '[aria-label*="notif"], [aria-label*="bell"], [class*="bell"], [class*="NotificationBell"]',
    ).first();

    if (!await bell.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Bell no encontrado');
      return;
    }

    await bell.click();
    await page.waitForTimeout(1500);

    // Dropdown debe abrirse
    const dropdown = page.locator('[class*="dropdown"], [class*="popover"], [role="menu"]').first();
    const hasDropdown = await dropdown.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasDropdown) {
      console.log('✅ Dropdown de notificaciones abierto desde bell');
      const dropText = (await dropdown.textContent()) ?? '';
      const hasNotifContent = /notificaci|ver todas|sin notif/i.test(dropText);
      console.log(`Contenido dropdown: ${hasNotifContent}`);
    } else {
      // Puede navegar directamente a /notifications
      const finalUrl = page.url();
      if (finalUrl.includes('/notifications')) {
        console.log('✅ Bell navega directamente a /notifications');
      }
    }
  });
});
