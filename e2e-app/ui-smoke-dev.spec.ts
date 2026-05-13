import { test, expect } from '@playwright/test';
import fs from 'fs';
import { TEST_URLS } from './fixtures';
import { clearSession, loginAndSelectEvent, navigateToModule, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || TEST_URLS.app;
const MODE = process.env.UI_SMOKE_MODE || 'bypass';
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';
const BYPASS_EMAIL = process.env.UI_BYPASS_EMAIL || EMAIL || 'jcc@bodasdehoy.com';
const BYPASS_UID = process.env.UI_BYPASS_UID || 'upSETrmXc7ZnsIhrjDjbHd7u2up1';
const BYPASS_ROLE = process.env.UI_BYPASS_ROLE || 'creator';
const BYPASS_EVENTOS_RAW = (() => {
  if (process.env.UI_BYPASS_EVENTOS) return process.env.UI_BYPASS_EVENTOS;
  const f = process.env.UI_BYPASS_EVENTOS_FILE;
  if (f && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  return '[]';
})();

test.describe('UI smoke (-dev)', () => {
  test.setTimeout(180_000);

  async function waitForEventsHome(page: any) {
    await page.waitForFunction(
      () => {
        const t = document.body?.innerText ?? '';
        return /Mis eventos/i.test(t) && !/Cargando eventos/i.test(t);
      },
      { timeout: 120_000 },
    );
  }

  async function activateBypass(page: any) {
    await page.addInitScript(
      ({ email, uid, role, eventosRaw }) => {
        localStorage.setItem('dev_bypass', 'true');
        localStorage.setItem('dev_bypass_email', email);
        localStorage.setItem('dev_bypass_uid', uid);
        localStorage.setItem('dev_bypass_role', role);
        localStorage.setItem('dev_bypass_eventos', eventosRaw);
      },
      { email: BYPASS_EMAIL, uid: BYPASS_UID, role: BYPASS_ROLE, eventosRaw: BYPASS_EVENTOS_RAW },
    );
  }

  async function openHomeWithMode(page: any) {
    if (MODE === 'bypass') {
      await activateBypass(page);
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'commit', timeout: 90_000 });
      } catch (e) {
        if (!String(e).includes('interrupted by another navigation')) throw e;
      }
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      return;
    }

    const eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL);
    expect(eventId).not.toBeNull();
  }

  async function selectFirstEvent(page: any) {
    try {
      await waitForEventsHome(page);
    } catch {
      const bodyText = (await page.locator('body').textContent().catch(() => '')) ?? '';
      throw new Error(`No cargó "Mis eventos". Snippet: ${bodyText.replace(/\s+/g, ' ').trim().slice(0, 220)}`);
    }

    const pendientesTab = page.locator('button').filter({ hasText: /^Pendientes$/i }).first();
    if (await pendientesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pendientesTab.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    const eventCards = page.locator('.cardEvento, [class*="cardEvento"], a[href*="/resumen-evento"], a[href*="/e/"]');
    let count = await eventCards.count();
    if (count === 0) {
      const cardEmpty = page.locator('[class*="CardEmpty"], .cardEmpty, [class*="rounded"][class*="shadow"]').first();
      const snippet = ((await page.locator('body').textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').slice(0, 220);
      throw new Error(`No hay cards visibles. Snippet: ${snippet}`);
    }

    const firstVisible = eventCards.first();
    await firstVisible.scrollIntoViewIfNeeded().catch(() => {});
    await firstVisible.click({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    await waitForAppReady(page, 60_000);

    await page
      .waitForURL((u: URL) => u.pathname.includes('resumen-evento') || u.searchParams.has('event'), { timeout: 60_000 })
      .catch(() => {});

    const needEventHint = page.getByText(/Primero debes crear un evento/i).first();
    await needEventHint.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  test.beforeEach(async ({ page }) => {
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`[nav] ${page.url()}`);
      }
    });
  });

  test('seleccionar evento', async ({ context, page }) => {
    await clearSession(context, page);
    await openHomeWithMode(page);
    await selectFirstEvent(page);
  });

  test('invitados: carga lista', async ({ context, page }) => {
    await clearSession(context, page);
    await openHomeWithMode(page);
    await selectFirstEvent(page);

    const ok = await navigateToModule(page, 'invitados', 60_000);
    expect(ok).toBe(true);

    const bodyText = (await page.locator('body').textContent().catch(() => '')) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(bodyText).toMatch(/invitad/i);
  });

  test('planes/billing: carga sin crash', async ({ context, page }) => {
    await clearSession(context, page);
    await openHomeWithMode(page);
    await selectFirstEvent(page);

    try {
      await page.goto(`${BASE_URL}/facturacion`, { waitUntil: 'commit', timeout: 120_000 });
    } catch (e) {
      if (!String(e).includes('interrupted by another navigation')) throw e;
    }
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await waitForAppReady(page, 25_000);
    await page.waitForTimeout(2000);

    const bodyText = (await page.locator('body').textContent().catch(() => '')) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(bodyText).toMatch(/plan|mensual|anual|€|gratis|free/i);
  });

  test('Copilot: toggle visible y abre panel', async ({ context, page }) => {
    await clearSession(context, page);
    await openHomeWithMode(page);
    await selectFirstEvent(page);

    const ok = await navigateToModule(page, 'resumen', 60_000);
    expect(ok).toBe(true);
    await waitForAppReady(page, 35_000);

    const toggle = page.getByTestId('copilot-toggle');
    const toggleVisible = await toggle.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!toggleVisible) {
      test.skip(true, 'Copilot toggle no habilitado en este entorno');
      return;
    }

    await toggle.click();
    const iframe = page.locator('iframe');
    const visible = await iframe.first().isVisible({ timeout: 15_000 }).catch(() => false);
    expect(visible).toBe(true);
  });
});
