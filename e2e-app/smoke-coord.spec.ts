import { test, expect } from '@playwright/test';

const CHAT_URL = 'https://chat-dev.bodasdehoy.com';
const APP_URL = 'https://app-dev.bodasdehoy.com';
const EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

test('SMOKE COORD: login + perfil + invitados + mesas + presupuesto', async ({ page, context }) => {
  test.setTimeout(180_000);

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('response', (resp) => {
    if (resp.status() >= 500) errors.push(`${resp.status()} ${resp.url().slice(0, 100)}`);
  });

  console.log(`\n[1/6] Login en ${CHAT_URL}/login`);
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(5_000);

  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/chat($|\?|\/)/, { timeout: 30_000 }).catch(() => {});
  const loggedIn = !page.url().includes('/login');
  console.log(`URL: ${page.url()} | Logged: ${loggedIn ? '✅' : '❌'}`);

  if (!loggedIn) {
    await page.screenshot({ path: '/tmp/smoke-fail.png', fullPage: true });
    test.fail();
    return;
  }

  for (const path of ['/perfil', '/invitados', '/mesas', '/presupuesto', '/itinerario']) {
    console.log(`\n[${path}]`);
    await page.goto(`${APP_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(5_000);
    const body = (await page.locator('body').textContent()) ?? '';
    const errorPatterns = [
      /displayName must be/,
      /Cannot return null for non-nullable/,
      /Error Capturado por ErrorBoundary/,
      /Runtime Error/,
      /Failed to compile/,
    ];
    const found = errorPatterns.map((r) => r.exec(body)).filter(Boolean);
    if (found.length) {
      console.log(`  ❌ Error: ${found[0]?.[0]}`);
      errors.push(`${path}: ${found[0]?.[0]}`);
    } else {
      console.log(`  ✅ OK (${body.length} chars)`);
    }
  }

  console.log(`\n=== TOTAL ERRORES: ${errors.length} ===`);
  if (errors.length) console.log(errors.slice(0, 8).join('\n  '));
  await page.screenshot({ path: '/tmp/smoke-final.png', fullPage: true });
  expect(errors.filter((e) => !e.includes('200')).length, 'Errores graves en navegación').toBeLessThan(3);
});
