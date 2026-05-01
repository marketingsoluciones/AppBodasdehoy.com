import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { loginAndSelectEventByName, clearSession, waitForAppReady } from './helpers';
import { ISABEL_RAUL_EVENT } from './fixtures/isabel-raul-event';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3220';
const U1_EMAIL = process.env.TEST_USER_EMAIL || '';
const U1_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const U2_EMAIL = process.env.TEST_USER2_EMAIL || '';
const U2_PASSWORD = process.env.TEST_USER2_PASSWORD || '';

const hasBoth = Boolean(U1_EMAIL && U1_PASSWORD && U2_EMAIL && U2_PASSWORD);
const hasEmails = Boolean(U1_EMAIL && U2_EMAIL);
const MANUAL_TIMEOUT_MS = 5 * 60_000;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function newCtx(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  return { ctx, page };
}

async function newLabeledCtx(browser: Browser, label: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const { ctx, page } = await newCtx(browser);
  await page.addInitScript((l) => {
    const inject = () => {
      try {
        const existing = document.getElementById('__pw_label');
        if (existing) return;
        const el = document.createElement('div');
        el.id = '__pw_label';
        el.textContent = l;
        el.style.position = 'fixed';
        el.style.top = '10px';
        el.style.left = '10px';
        el.style.zIndex = '2147483647';
        el.style.padding = '6px 10px';
        el.style.borderRadius = '10px';
        el.style.background = 'rgba(0,0,0,0.75)';
        el.style.color = 'white';
        el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        el.style.fontSize = '12px';
        el.style.fontWeight = '700';
        document.body.appendChild(el);
      } catch { }
    };
    window.addEventListener('DOMContentLoaded', inject);
  }, label);
  return { ctx, page };
}

async function isServiciosReady(page: Page): Promise<boolean> {
  if (!page.url().includes('/servicios')) return false;
  try {
    const text = (await page.locator('body').textContent().catch(() => '')) ?? '';
    if (text.length < 80) return false;
    if (/Comprobando sesi[oó]n y conexi[oó]n/i.test(text)) return false;
    if (/Crear cuenta gratis|Ya tengo cuenta|Iniciar sesi[oó]n/i.test(text)) return false;
    return /Nueva tarea|Aun No Tienes Tasks|Tasks Creados|Filtros|Pendiente|En progreso|Completad/i.test(text);
  } catch {
    return false;
  }
}

async function gotoServicios(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/servicios?event=${ISABEL_RAUL_EVENT.id}`, { waitUntil: 'commit', timeout: 90_000 });
  await waitForAppReady(page, 30_000);
  const start = Date.now();
  while (Date.now() - start < 45_000) {
    if (await isServiciosReady(page)) return true;
    await delay(1200);
  }
  return false;
}

async function gotoServiciosManual(page: Page, label: string): Promise<void> {
  console.log(`[SOCKET-2U] ${label}: abre login si hace falta y espera a que cargue /servicios (NO recargar).`);
  await page.goto(`${BASE_URL}/servicios?event=${ISABEL_RAUL_EVENT.id}`, { waitUntil: 'commit', timeout: 90_000 });

  const start = Date.now();
  while (Date.now() - start < MANUAL_TIMEOUT_MS) {
    if (await isServiciosReady(page)) return;
    await delay(1500);
  }

  throw new Error(`${label}: timeout esperando /servicios listo (manual login).`);
}

async function openNotificationsPanel(page: Page): Promise<boolean> {
  const candidates = [
    page.locator('div.bg-slate-100.w-10.h-10.rounded-full').first(),
    page.locator('[class*="notification" i], [class*="notif" i]').filter({ has: page.locator('svg') }).first(),
    page.locator('[aria-label*="notif" i], [aria-label*="notific" i]').first(),
    page.locator('button, div, span').filter({ has: page.locator('svg') }).first(),
  ];

  for (const c of candidates) {
    if (await c.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await c.click().catch(() => {});
      break;
    }
  }

  const header = page.locator('text=Mis notificaciones, text=notifications').first();
  return await header.isVisible({ timeout: 15_000 }).catch(() => false);
}

async function readHeaderUnreadCount(page: Page): Promise<number> {
  const badge = page.locator('span.bg-red-500.text-white').first();
  const txt = (await badge.textContent().catch(() => '')) ?? '';
  const n = parseInt((txt.match(/\d+/) ?? [])[0] ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

async function switchToTableView(page: Page): Promise<boolean> {
  const tableTabSelectors = [
    'button[title*="tabla" i]',
    'button[aria-label*="tabla" i]',
    '[class*="table"][role="tab"]',
    'button:has-text("Tabla")',
    'svg.lucide-table, svg.lucide-layout-list',
  ];

  for (const sel of tableTabSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await delay(1_500);
      break;
    }
  }

  await page.waitForTimeout(2_000);
  const rows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])');
  let rowCount = await rows.count().catch(() => 0);
  if (rowCount === 0) {
    const addBtn = page.locator('button:has-text("Nueva tarea")').first();
    const canCreate = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (canCreate) {
      await addBtn.click();
      await page.waitForTimeout(3_000);
      rowCount = await rows.count().catch(() => 0);
    }
  }
  return rowCount > 0;
}

async function openFirstTaskCommentModal(page: Page): Promise<boolean> {
  const commentIconSelectors = [
    'td svg.lucide-message-square',
    'td .lucide-message-square',
    'tr td [class*="message"]',
    'td div:has(svg.lucide-message-square)',
    'svg.lucide-message-square',
  ];

  for (const sel of commentIconSelectors) {
    const icons = page.locator(sel);
    const count = await icons.count().catch(() => 0);
    if (count > 0) {
      await icons.first().click({ timeout: 5_000 }).catch(() => {});
      break;
    }
  }

  const commentCells = page.locator('td div.group, td [class*="group"]').filter({ hasText: /^\d+$|^-$/ });
  if ((await commentCells.count().catch(() => 0)) > 0) {
    await commentCells.first().click({ timeout: 5_000 }).catch(() => {});
    await delay(1_000);
  }

  const modalSelectors = [
    '#modal-comments-container',
    'div.fixed.inset-0 h3:has-text("Actividad")',
    'div.fixed.inset-0 h3:has-text("Comentarios")',
    'div[class*="fixed"][class*="inset-0"] div[class*="bg-white"]',
  ];

  for (const sel of modalSelectors) {
    const modal = page.locator(sel).first();
    if (await modal.isVisible({ timeout: 15_000 }).catch(() => false)) return true;
  }

  return await page.locator('div.fixed.inset-0').first().isVisible({ timeout: 3_000 }).catch(() => false);
}

async function typeAndSendComment(page: Page, text: string): Promise<boolean> {
  const editorSelectors = [
    '#modal-comments-container ~ div div[contenteditable="true"]',
    'div.fixed.inset-0 div[contenteditable="true"]',
    'div[contenteditable="true"]',
  ];

  let editor: any = null;
  for (const sel of editorSelectors) {
    const el = page.locator(sel).last();
    if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
      editor = el;
      break;
    }
  }
  if (!editor) return false;

  await editor.click({ force: true }).catch(() => {});
  await delay(200);
  await editor.fill(text).catch(async () => {
    await editor.press('Control+a');
    await editor.type(text);
  });
  await delay(400);

  const sendSelectors = [
    'span[class*="right-3"][class*="cursor-pointer"]',
    'span[class*="absolute"][class*="right-3"]',
    '.fixed.inset-0 span.cursor-pointer',
  ];

  for (const sel of sendSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await delay(1_000);
      return true;
    }
  }

  const tealSvg = page.locator('svg[class*="teal"]').first();
  if (await tealSvg.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await tealSvg.click({ force: true }).catch(() => {});
    await delay(1_000);
    return true;
  }

  return false;
}

test.describe('Socket notificación comentario (2 usuarios)', () => {
  test.setTimeout(600_000);

  test('U1 comenta tarea → U2 ve badge sin recargar', async ({ browser }) => {
    if (!hasEmails) test.skip();

    const { ctx: ctx1, page: p1 } = await newLabeledCtx(browser, `U1 ${U1_EMAIL || ''}`.trim());
    const { ctx: ctx2, page: p2 } = await newLabeledCtx(browser, `U2 ${U2_EMAIL || ''}`.trim());

    try {
      await Promise.all([clearSession(ctx1, p1), clearSession(ctx2, p2)]);

      if (hasBoth) {
        const [ev1, ev2] = await Promise.all([
          loginAndSelectEventByName(p1, U1_EMAIL, U1_PASSWORD, BASE_URL, ISABEL_RAUL_EVENT.nombre),
          loginAndSelectEventByName(p2, U2_EMAIL, U2_PASSWORD, BASE_URL, ISABEL_RAUL_EVENT.nombre),
        ]);

        expect(ev1).not.toBeNull();
        expect(ev2).not.toBeNull();
      } else {
        console.log('[SOCKET-2U] Credenciales no detectadas. Login MANUAL requerido en ambas ventanas.');
        console.log(`[SOCKET-2U] U1: ${U1_EMAIL}`);
        console.log(`[SOCKET-2U] U2: ${U2_EMAIL}`);
      }

      if (hasBoth) {
        const ok2 = await gotoServicios(p2);
        expect(ok2).toBe(true);
      } else {
        await gotoServiciosManual(p2, 'U2');
      }

      const notifOpen = await openNotificationsPanel(p2);
      expect(notifOpen).toBe(true);

      const before = await readHeaderUnreadCount(p2);

      if (hasBoth) {
        const ok1 = await gotoServicios(p1);
        expect(ok1).toBe(true);
      } else {
        await gotoServiciosManual(p1, 'U1');
      }

      const hasTasks = await switchToTableView(p1);
      expect(hasTasks).toBe(true);

      const modalOk = await openFirstTaskCommentModal(p1);
      expect(modalOk).toBe(true);

      const commentText = `RT-${Date.now()}`;
      const sent = await typeAndSendComment(p1, commentText);
      expect(sent).toBe(true);

      const increased = await p2.waitForFunction(
        (prev) => {
          const el = document.querySelector('span.bg-red-500.text-white');
          const n = parseInt((el?.textContent || '').match(/\d+/)?.[0] || '0', 10);
          const v = Number.isFinite(n) ? n : 0;
          return v > prev;
        },
        before,
        { timeout: 45_000 },
      ).then(() => true).catch(() => false);

      expect(increased).toBe(true);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
