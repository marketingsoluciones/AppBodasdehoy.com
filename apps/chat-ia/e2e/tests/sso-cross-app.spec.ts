// SPRINT-M 2026-05-21: sso-cross-app.feature → Playwright Test puro.
// Reusa el pattern de smoke-sso-cross-app.ts: cookie idTokenV0.1.0 cross-domain.
//
// Pre-requisitos:
//   - chat-ia-prod :3210
//   - appbodas-dev :3220
//   - .auth/super-admin.json existe

import { expect, test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// APPEVENTOS_URL prefer (APP_URL puede chocar con api-ia python :8000)
const APP_URL = process.env.APPEVENTOS_URL || 'http://localhost:3220';
const STATE_PATH = resolve(__dirname, '../.auth/super-admin.json');

test.describe('@sso @cross-app SSO chat-ia ↔ appEventos', () => {
  test('@sso-login-chat-then-app cookie idToken propaga a appEventos', async ({ browser }) => {
    // Pre-flight: storage state + appEventos available
    console.log(`[sso-spec] STATE_PATH=${STATE_PATH} exists=${existsSync(STATE_PATH)}`);
    if (!existsSync(STATE_PATH)) {
      test.skip(true, `missing ${STATE_PATH}`);
      return;
    }
    let probeStatus: number | string = 'unknown';
    try {
      const r = await fetch(APP_URL);
      probeStatus = r.status;
    } catch (e: any) {
      probeStatus = `error: ${e.message}`;
    }
    console.log(`[sso-spec] APP_URL=${APP_URL} probeStatus=${probeStatus}`);
    if (typeof probeStatus !== 'number' || probeStatus >= 400) {
      test.skip(true, `appEventos probe ${probeStatus}`);
      return;
    }

    // Leer cookie idToken saved (login real chat-ia previo)
    const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
    const idToken = state.cookies.find((c: any) => c.name === 'idTokenV0.1.0');
    expect(idToken).toBeTruthy();
    expect(idToken.value.length).toBeGreaterThan(100);

    // Nuevo context limpio + inject cookie a localhost (simula propagación
    // que en prod ocurre vía Domain=.bodasdehoy.com)
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await ctx.addCookies([
      {
        name: 'idTokenV0.1.0',
        value: idToken.value,
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ]);
    const page = await ctx.newPage();

    try {
      // domcontentloaded — appEventos hace polling continuo socket.io api3-ia
      // (NXDOMAIN, memoria proyecto) que impide networkidle
      const resp = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(5000);

      expect(resp?.status()).toBe(200);
      expect(page.url()).not.toMatch(/\/login|\/auth/);

      // UI signals: NO login prompt + Copilot button O avatar visible
      const uiSignals = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        const hasLoginPrompt = /iniciar sesi[oó]n|reg[ií]strate|sign in/i.test(text)
          && !/cerrar sesi[oó]n|sign out|logout/i.test(text);
        const hasCopilot = text.includes('copilot');
        const avatars = document.querySelectorAll('img[alt*="avatar" i], [class*="avatar" i]').length;
        return { hasLoginPrompt, hasCopilot, avatars };
      });
      expect(uiSignals.hasLoginPrompt).toBe(false);
      expect(uiSignals.hasCopilot || uiSignals.avatars > 0).toBe(true);
    } finally {
      await ctx.close();
    }
  });
});
