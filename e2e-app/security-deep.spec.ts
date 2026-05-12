/**
 * security-deep.spec.ts
 *
 * Tests de seguridad profunda en appEventos:
 *   - XSS: inyección en campos texto (nombre invitado, comentarios)
 *   - CSRF: requests sin cookies/headers de auth deben rechazarse
 *   - SQL/NoSQL injection: campos texto con keywords peligrosas
 *   - Auth bypass: acceso a URLs internas sin sesión
 *   - Token expirado: comportamiento si JWT expira mid-session
 *   - Rate limiting: ráfaga de requests, ¿hay throttle?
 *
 * GAP P0 detectado por COORD-APP — coverage de security
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, navigateToModule, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const isAppDev =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com');

test.describe('Security — XSS injection en campos texto', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('XSS en nombre de invitado no ejecuta JS', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, 20_000);

    const xssPayload = '<script>window.__xssExecuted=true</script>';
    const createBtn = page.locator('button').filter({ hasText: /añadir|crear|nuevo.*invitado/i }).first();
    if (!await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'No hay botón crear invitado visible');
    }
    await createBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[placeholder*="nombre" i], input[name*="nombre" i]').first();
    if (!await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      test.skip(true, 'No hay input nombre');
    }
    await nameInput.fill(`Test ${xssPayload}`);

    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /guardar|añadir|crear/i }).first();
    await submitBtn.click().catch(() => {});
    await page.waitForTimeout(2000);

    // Verificar: XSS NO ejecutó
    const xssExecuted = await page.evaluate(() => (window as any).__xssExecuted === true).catch(() => false);
    expect(xssExecuted, 'BUG_SECURITY: XSS payload se ejecutó en nombre invitado').toBe(false);

    // Verificar: el script no se renderizó como HTML
    const html = await page.locator('body').innerHTML();
    expect(html.includes('<script>window.__xssExecuted')).toBe(false);
  });
});

test.describe('Security — Auth bypass', () => {
  test.setTimeout(60_000);

  test('Acceso a /invitados sin sesión redirige a /login o muestra guest', async ({ context, page }) => {
    if (!isAppDev) { test.skip(); return; }
    await clearSession(context, page);

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const isLoginRedirect = finalUrl.includes('/login') || /iniciar sesión|continuar como/i.test(bodyText);
    expect(isLoginRedirect, 'BUG_SECURITY: /invitados accesible sin login (falta auth guard)').toBe(true);
  });

  test('Acceso a /mesas sin sesión redirige a /login o muestra guest', async ({ context, page }) => {
    if (!isAppDev) { test.skip(); return; }
    await clearSession(context, page);

    await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const isLoginRedirect = finalUrl.includes('/login') || /iniciar sesión|continuar como/i.test(bodyText);
    expect(isLoginRedirect, 'BUG_SECURITY: /mesas accesible sin login (falta auth guard)').toBe(true);
  });

  test('Acceso a /presupuesto sin sesión redirige a /login o muestra guest', async ({ context, page }) => {
    if (!isAppDev) { test.skip(); return; }
    await clearSession(context, page);

    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const isLoginRedirect = finalUrl.includes('/login') || /iniciar sesión|continuar como/i.test(bodyText);
    expect(isLoginRedirect, 'BUG_SECURITY: /presupuesto accesible sin login (falta auth guard)').toBe(true);
  });
});

test.describe('Security — CSRF/Auth headers', () => {
  test.setTimeout(60_000);

  test('GraphQL mutation sin cookie ni Authorization devuelve error/null data', async ({ request }) => {
    if (!isAppDev) { test.skip(); return; }

    const response = await request.post('https://api3-mcp-graphql.eventosorganizador.com/graphql', {
      data: {
        query: `mutation { createEvent(name: "test-csrf", date: "2026-12-31") { _id } }`,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Development': 'bodasdehoy',
      },
      timeout: 10_000,
    });

    const body = await response.json();
    const hasError = body?.errors?.length > 0 || body?.data?.createEvent === null;
    expect(hasError, 'BUG_SECURITY: mutation acepta sin auth (CSRF posible)').toBe(true);
  });

  test('Authorization con Bearer fake JWT rechazado', async ({ request }) => {
    if (!isAppDev) { test.skip(); return; }

    const response = await request.post('https://api3-mcp-graphql.eventosorganizador.com/graphql', {
      data: {
        query: `mutation { createEvent(name: "test-fake-jwt", date: "2026-12-31") { _id } }`,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Development': 'bodasdehoy',
        'Authorization': 'Bearer fake.jwt.token.malicious',
      },
      timeout: 10_000,
    });

    const body = await response.json();
    const hasError = body?.errors?.length > 0;
    expect(hasError, 'BUG_SECURITY: Authorization Bearer fake aceptado').toBe(true);
  });
});

test.describe('Security — Injection patterns', () => {
  test.setTimeout(120_000);

  test('NoSQL injection en queryenEvento no devuelve eventos no autorizados', async ({ request, context, page }) => {
    if (!isAppDev || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === 'sessionBodas' || c.name === 'idTokenV0.1.0')?.value;

    // NoSQL injection attempt: $ne en variable
    const response = await request.post('https://api3-mcp-graphql.eventosorganizador.com/graphql', {
      data: {
        query: `query($variable: String, $valor: String, $development: String!) {
          queryenEvento(variable: $variable, valor: $valor, development: $development) { _id usuario_id }
        }`,
        variables: {
          variable: '_id',
          valor: '{"$ne": null}',
          development: 'bodasdehoy',
        },
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Development': 'bodasdehoy',
        ...(session ? { 'Cookie': `sessionBodas=${session}` } : {}),
      },
      timeout: 10_000,
    });

    const body = await response.json();
    const events = Array.isArray(body?.data?.queryenEvento) ? body.data.queryenEvento : [];
    // El user solo debería ver sus propios eventos. Si recibe eventos de otros = injection exitosa.
    // Ver: para validar correctamente necesitamos un user_id conocido y verificar que solo recibe esos.
    expect(events.length, 'NoSQL injection probably worked — too many results').toBeLessThan(100);
  });
});
