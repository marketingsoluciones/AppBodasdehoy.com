import { test, expect } from '@playwright/test';

const CHAT_URL = 'https://chat-dev.bodasdehoy.com';
const APP_URL = 'https://app-dev.bodasdehoy.com';
const EMAIL = 'jcc@bodasdehoy.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

test('SMOKE JCC: validación end-to-end tras fixes sesión', async ({ page }) => {
  test.setTimeout(180_000);

  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('response', (resp) => {
    if (resp.status() >= 500) errors.push(`HTTP ${resp.status()} ${resp.url().slice(0, 100)}`);
  });

  console.log(`\n[1/6] Login jcc en ${CHAT_URL}/login`);
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
    const body = (await page.locator('body').textContent()) ?? '';
    const errorMatch = /error|inválid|incorrect|denied|denegad|no existe|wrong-password/i.exec(body);
    console.log(`Login error visible: ${errorMatch?.[0] || 'ninguno'}`);
    console.log(`Console errors: ${errors.slice(0, 3).join(' | ')}`);
    await page.screenshot({ path: '/tmp/smoke-jcc-fail.png', fullPage: true });
    expect(loggedIn, 'BUG_LOGIN: jcc falló').toBe(true);
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
    ];
    const found = errorPatterns.map((r) => r.exec(body)).filter(Boolean);
    if (found.length) {
      console.log(`  ❌ ${found[0]?.[0]}`);
      errors.push(`${path}: ${found[0]?.[0]}`);
    } else {
      console.log(`  ✅ OK (${body.length} chars body)`);
    }
  }

  console.log(`\n=== TOTAL ERRORES: ${errors.length} ===`);
  if (errors.length) console.log(errors.slice(0, 8).join('\n  '));
  await page.screenshot({ path: '/tmp/smoke-jcc-final.png', fullPage: true });
  expect(errors.filter((e) => !e.includes('200')).length, 'Errores graves').toBeLessThan(3);
});
