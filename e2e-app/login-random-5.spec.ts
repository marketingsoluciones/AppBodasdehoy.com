import { test, expect } from '@playwright/test';

import { clearSession, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || '';
const isRemoteEnv = BASE_URL.includes('app-test') || BASE_URL.includes('app-dev');
const loginPath = isRemoteEnv ? '/login?local-login=1' : '/login';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

async function gotoLogin(page: any) {
  await page.goto(loginPath, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => {});
  await waitForAppReady(page, 15_000);
}

function shouldSkipBecauseEdge(text: string) {
  return /1033|Please enable cookies|Cloudflare/i.test(text);
}

test.describe('Login random set (5)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('01 /login carga contenido (no blanco)', async ({ page }) => {
    await gotoLogin(page);
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    if (shouldSkipBecauseEdge(text)) test.skip(true, 'login no alcanzable (Cloudflare/cookies)');
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);
  });

  test('02 email inválido no permite completar login', async ({ page }) => {
    await gotoLogin(page);
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    if (shouldSkipBecauseEdge(text)) test.skip(true, 'login no alcanzable (Cloudflare/cookies)');

    await page.locator('input[type="email"], input[name="identifier"]').first().fill('no-es-email');
    await page.locator('input[type="password"]').first().fill('x');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(800);

    expect(page.url()).toContain('/login');
  });

  test('03 password incorrecta mantiene en /login', async ({ page }) => {
    if (!hasCredentials) test.skip(true, 'faltan credenciales E2E');
    await gotoLogin(page);
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    if (shouldSkipBecauseEdge(text)) test.skip(true, 'login no alcanzable (Cloudflare/cookies)');

    await page.locator('input[type="email"], input[name="identifier"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(`${TEST_PASSWORD}__wrong`);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/login');
    const after = (await body.textContent()) ?? '';
    expect(after).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('04 login válido sale de /login', async ({ page }) => {
    if (!hasCredentials) test.skip(true, 'faltan credenciales E2E');
    await gotoLogin(page);
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    if (shouldSkipBecauseEdge(text)) test.skip(true, 'login no alcanzable (Cloudflare/cookies)');

    await page.locator('input[type="email"], input[name="identifier"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 45_000 }).catch(() => {});
    await waitForAppReady(page, 20_000);

    expect(page.url()).not.toContain('/login');
    const after = (await body.textContent()) ?? '';
    expect(after).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('05 sesión persiste tras recargar', async ({ page }) => {
    if (!hasCredentials) test.skip(true, 'faltan credenciales E2E');
    await gotoLogin(page);
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    if (shouldSkipBecauseEdge(text)) test.skip(true, 'login no alcanzable (Cloudflare/cookies)');

    await page.locator('input[type="email"], input[name="identifier"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 45_000 }).catch(() => {});
    await waitForAppReady(page, 20_000);

    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await waitForAppReady(page, 20_000);

    expect(page.url()).not.toContain('/login');
    const after = (await body.textContent()) ?? '';
    expect(after).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

