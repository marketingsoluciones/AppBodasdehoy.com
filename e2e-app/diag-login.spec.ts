/**
 * SPEC DIAGNÓSTICO — no corre por defecto en CI.
 * Captura todo el flujo de login contra app-dev: console logs, network requests
 * (especialmente la mutation `auth`), cookies antes/después, y vuelca a JSON.
 *
 * Uso:
 *   BASE_URL=https://app-dev.bodasdehoy.com CHAT_URL=https://chat-dev.bodasdehoy.com \
 *   E2E_SKIP_HEALTH=1 \
 *     pnpm exec playwright test e2e-app/diag-login.spec.ts --project=webkit --reporter=line
 *
 * Output: /tmp/diag-login-<timestamp>.json
 */
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://app-dev.bodasdehoy.com';
const CHAT_URL = process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com';
const EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'lorca2012M*+';

test.describe('DIAG — login + auth mutation', () => {
  test.setTimeout(420_000);

  test('captura login flow completo', async ({ context, page }) => {
    const events: any[] = [];
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    // 1) Capture console
    page.on('console', (msg) => {
      events.push({ ts: Date.now(), type: 'console', level: msg.type(), text: msg.text() });
    });
    page.on('pageerror', (err) => {
      events.push({ ts: Date.now(), type: 'pageerror', message: err.message, stack: err.stack });
    });

    // 2) Capture network (filtrar requests interesantes)
    page.on('request', (req) => {
      const url = req.url();
      if (/graphql|auth|firebase|login|api/i.test(url)) {
        networkRequests.push({
          ts: Date.now(),
          method: req.method(),
          url,
          headers: req.headers(),
          postData: req.postData()?.slice(0, 2000),
        });
      }
    });
    page.on('response', async (res) => {
      const url = res.url();
      if (/graphql|auth|firebase|login|api/i.test(url)) {
        let body = '';
        try {
          body = (await res.text()).slice(0, 5000);
        } catch {
          body = '[no body]';
        }
        networkResponses.push({
          ts: Date.now(),
          status: res.status(),
          url,
          headers: res.headers(),
          body,
        });
      }
    });

    // 3) Navegar a chat-dev/login (donde se hace el SSO real según el flow)
    events.push({ ts: Date.now(), type: 'goto', url: `${CHAT_URL}/login` });
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    await page.waitForTimeout(3000);

    const cookiesBeforeLogin = await context.cookies();
    events.push({ ts: Date.now(), type: 'cookies-before-login', count: cookiesBeforeLogin.length, names: cookiesBeforeLogin.map(c => c.name) });

    // 4) Llenar form
    try {
      await page.locator('input[type="email"]').first().fill(EMAIL, { timeout: 15_000 });
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      events.push({ ts: Date.now(), type: 'form-filled' });
    } catch (e: any) {
      events.push({ ts: Date.now(), type: 'form-error', message: e?.message });
    }

    // 5) Submit
    try {
      await page.locator('button[type="submit"]').first().click();
      events.push({ ts: Date.now(), type: 'submit-clicked' });
    } catch (e: any) {
      events.push({ ts: Date.now(), type: 'submit-error', message: e?.message });
    }

    // 6) Esperar redirect / cargar
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 120_000 }).catch(() => {
      events.push({ ts: Date.now(), type: 'no-redirect', url: page.url() });
    });
    await page.waitForTimeout(3000);
    events.push({ ts: Date.now(), type: 'after-submit-url', url: page.url() });

    // 7) Cookies tras login en chat-dev
    const cookiesAfterChatLogin = await context.cookies();
    events.push({
      ts: Date.now(),
      type: 'cookies-after-chat-login',
      count: cookiesAfterChatLogin.length,
      names: cookiesAfterChatLogin.map(c => `${c.name}@${c.domain}`),
    });

    // 8) Navegar a app-dev para activar SSO
    events.push({ ts: Date.now(), type: 'goto', url: BASE_URL });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    events.push({ ts: Date.now(), type: 'on-app-dev', url: page.url() });

    // 9) Cookies finales tras SSO
    const cookiesAfterAppNav = await context.cookies();
    events.push({
      ts: Date.now(),
      type: 'cookies-after-app-nav',
      count: cookiesAfterAppNav.length,
      cookies: cookiesAfterAppNav.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        sameSite: c.sameSite,
        value: c.value.slice(0, 30) + (c.value.length > 30 ? '...' : ''),
        valueLength: c.value.length,
      })),
    });

    // 10) DOM final
    const body = (await page.locator('body').textContent().catch(() => '')) ?? '';
    events.push({ ts: Date.now(), type: 'final-dom-snippet', text: body.slice(0, 400).replace(/\s+/g, ' ') });

    // Volcar todo a JSON
    const out = {
      env: { BASE_URL, CHAT_URL, EMAIL: EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2') },
      events,
      networkRequests: networkRequests.slice(0, 50),
      networkResponses: networkResponses.slice(0, 50),
    };
    const outPath = `/tmp/diag-login-${Date.now()}.json`;
    writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`\n=== DIAG OUTPUT: ${outPath} ===`);
    console.log(`Cookies finales (app-dev nav): ${cookiesAfterAppNav.map(c => c.name).join(', ') || 'NONE'}`);
    console.log(`Network requests capturadas: ${networkRequests.length}`);
    console.log(`Network responses capturadas: ${networkResponses.length}`);

    // No assert — solo captura
    expect(true).toBe(true);
  });
});
