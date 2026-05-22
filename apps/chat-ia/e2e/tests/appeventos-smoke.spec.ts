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

  test('@appeventos-mesas /mesas accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/mesas');
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-presupuesto /presupuesto accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/presupuesto');
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });

  test('@appeventos-itinerario /itinerario accesible (no guest gate)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: DUAL_STATE, viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    try {
      await gotoPage(page, '/itinerario');
      expect(page.url()).not.toMatch(/login/i);
      await assertNoGuestGate(page);
    } finally {
      await ctx.close();
    }
  });
});
