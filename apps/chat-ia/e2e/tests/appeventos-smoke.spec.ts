// Tier 1 — smoke ligero appEventos pages (load + heading + auth state real).
//
// HALLAZGO CRÍTICO 2026-05-22 (commit 240585cd): SSO cookie transfer simulation
// (solo idTokenV0.1.0) NO equivale a usuario real autenticado. appEventos detecta
// como VISITOR y muestra "Crear cuenta gratis" en /invitados, /presupuesto, etc.
//
// RESOLUCIÓN 2026-05-22 (lote 11): nuevo save-storage-states-dual.ts hace login
// real a chat-ia (:3210) Y appEventos (:3220) en el mismo BrowserContext, captura
// cookies + localStorage de ambos origins. Spec carga .auth/{tag}-dual.json y
// asserta STRICT que NO aparece "Crear cuenta gratis" — falla loud si SSO se rompe.
//
// Pre-requisitos:
//   - chat-ia-prod :3210
//   - appbodas-dev :3220 (warm-up previo recomendado por cold compile lento)
//   - .auth/super-admin-dual.json existe (correr save-storage-states-dual.ts)

import { expect, test, type Page } from '@playwright/test';
import { existsSync } from 'fs';
import { resolve } from 'path';

const APPEVENTOS_URL = process.env.APPEVENTOS_URL || 'http://localhost:3220';
const DUAL_STATE = resolve(__dirname, '../.auth/super-admin-dual.json');

// Cache shared entre tests del describe.serial
let cachedEventId: string | null = null;

async function gotoPage(page: Page, path: string) {
  // domcontentloaded — appEventos hace polling socket.io api3-ia NXDOMAIN
  // que impide networkidle. timeout 180s — cold compile primer hit puede tardar ~3min
  await page.goto(APPEVENTOS_URL + path, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(4000);
}

async function assertNoGuestGate(page: Page) {
  // STRICT: si aparece "Crear cuenta gratis" → SSO está roto, FAIL ruidoso
  const guestGateVisible = await page
    .locator('text=/Crear cuenta gratis/i')
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
  expect(guestGateVisible, 'guest gate "Crear cuenta gratis" visible — dual login no aplicado').toBe(false);
}

/**
 * /mesas, /presupuesto, /itinerario requieren ?eventId=<X> en URL.
 * Sin event seleccionado, vista-sin-cookie.tsx redirige a /login?d=<path>.
 * Confirmed en pages/api/copilot/chat.ts:184 (URL canónica con eventId).
 *
 * Esta helper navega a /eventos, lee el primer eventId del DOM y lo cachea
 * en cachedEventId. Si /eventos está vacío → null (test debe skip).
 */
async function fetchFirstEventId(page: Page): Promise<string | null> {
  if (cachedEventId) return cachedEventId;
  await gotoPage(page, '/eventos');
  // Busca links/buttons con href que contenga eventId, o data-eventid
  const eventLink = await page
    .locator('a[href*="eventId="], a[href*="/event/"], [data-eventid]')
    .first();
  const href = await eventLink.getAttribute('href').catch(() => null);
  const dataId = await eventLink.getAttribute('data-eventid').catch(() => null);
  let id: string | null = null;
  if (href) {
    const m = href.match(/eventId=([a-f0-9]+)/i) || href.match(/\/event\/([a-f0-9]+)/i);
    if (m) id = m[1];
  }
  if (!id && dataId) id = dataId;
  if (id) cachedEventId = id;
  return id;
}

test.describe.serial('@appeventos appEventos page smoke (logged-in via dual storage state)', () => {
  test.skip(() => !existsSync(DUAL_STATE), 'requires .auth/super-admin-dual.json — run save-storage-states-dual.ts');

  test('@appeventos-home / renderiza autenticado', async ({ browser }) => {
    const probe = await fetch(APPEVENTOS_URL).then((r) => r.ok).catch(() => false);
    if (!probe) test.skip(true, `appEventos no responde en ${APPEVENTOS_URL}`);

    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/');
      // No login prompt
      const hasLogin = await page.locator('text=/Iniciar sesi[oó]n/i').first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasLogin).toBe(false);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-eventos /eventos lista accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/eventos');
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-invitados /invitados accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/invitados');
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-mesas /mesas?eventId=<X> accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      const eventId = await fetchFirstEventId(page);
      test.skip(!eventId, '/eventos sin eventos visibles — no se puede testear /mesas');
      await gotoPage(page, `/mesas?eventId=${eventId}`);
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-presupuesto /presupuesto?eventId=<X> accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      const eventId = await fetchFirstEventId(page);
      test.skip(!eventId, '/eventos sin eventos visibles — no se puede testear /presupuesto');
      await gotoPage(page, `/presupuesto?eventId=${eventId}`);
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-itinerario /itinerario?eventId=<X> accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      const eventId = await fetchFirstEventId(page);
      test.skip(!eventId, '/eventos sin eventos visibles — no se puede testear /itinerario');
      await gotoPage(page, `/itinerario?eventId=${eventId}`);
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });
});
