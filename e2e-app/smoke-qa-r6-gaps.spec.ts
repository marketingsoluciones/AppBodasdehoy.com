/**
 * smoke-qa-r6-gaps.spec.ts
 *
 * Valida los 3 gaps que QA reportó el 2-jul sobre el build previo
 * ErB1PSGLcPvI8PXpG0CZ8, ahora sobre el nuevo build GeP3dEQrHzGIq1--KP99e
 * (app-dev) + VorYTh1zJHec2xzR47vN3 (chat-dev):
 *
 *   Gap 1) Wrong-password banner con role="alert" + data-testid detectables
 *          por E2E.
 *   Gap 2) chat-dev login DIRECTO emite sessionBodas cross-domain.
 *   Gap 3) Bypass force emite pseudo-JWT de 3 partes (no cae en guest
 *          shell chat-dev).
 *
 * Ejecutar:
 *   E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit E2E_SKIP_HEALTH=1 \
 *     npx playwright test e2e-app/smoke-qa-r6-gaps.spec.ts \
 *     --project=webkit --reporter=list
 */
import { test, expect } from '@playwright/test';
import { TEST_URLS } from './fixtures';

const APP = process.env.APP_URL || TEST_URLS.app || 'https://app-dev.bodasdehoy.com';
const CHAT = process.env.CHAT_URL || TEST_URLS.chat || 'https://chat-dev.bodasdehoy.com';

// ─── Fase 5 QA-R6 — regresión crashes chat-dev anónimos ─────────────────────
// 6 rutas que en R4 crasheaban con overlay "Oops something went wrong".
// Deben cargar spinner "Acceso requerido" o el shell público, JAMÁS overlay.
const CHAT_ROUTES_ANON = [
  '/messages',
  '/bodasdehoy/messages',
  '/notifications',
  '/chat',
  '/wedding-creator',
  '/memories',
];

for (const route of CHAT_ROUTES_ANON) {
  test(`Fase 5 — chat-dev ${route} sin overlay Oops (anónimo)`, async ({ page }, testInfo) => {
    testInfo.setTimeout(30_000);
    await page.goto(`${CHAT}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    const oopsCount = await page.getByText(/Oops something went wrong|Algo ha fallado/i).count();
    console.log(`[Fase5] ${route} — Oops overlays: ${oopsCount}`);

    await testInfo.attach(`fase5-${route.replaceAll('/', '_')}.png`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });

    expect(oopsCount).toBe(0);
  });
}

// ─── Fase 3 QA-R6 — funcional app-dev con login válido ──────────────────────
// 5 módulos deben cargar sin overlay error tras login real. Login via bypass
// force (más rápido que Firebase real, ya validado por Gap 3).
const APP_MODULES = [
  '/invitados',
  '/mesas',
  '/servicios',
  '/itinerario',
  '/presupuesto',
];

for (const route of APP_MODULES) {
  test(`Fase 3 — app-dev ${route} carga sin overlay tras login`, async ({ page }, testInfo) => {
    testInfo.setTimeout(45_000);
    const email = process.env.TEST_USER3_EMAIL || 'jcc@bodasdehoy.com';

    // Login vía bypass force (rápido, no requiere Firebase real)
    const bypassRes = await page.context().request.post(`${APP}/api/dev/refresh-session`, {
      data: { email, force: true },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(bypassRes.status()).toBe(200);
    const bypassBody = await bypassRes.json();
    expect(bypassBody.success).toBe(true);

    // Extraer + inyectar cookie sessionBodas
    const setCookieHeader = bypassRes.headers()['set-cookie'] || '';
    const sessionCookieMatch = setCookieHeader.match(/sessionBodas=([^;]+)/);
    expect(sessionCookieMatch).not.toBeNull();
    const bypassToken = decodeURIComponent(sessionCookieMatch![1]);
    await page.context().addCookies([
      {
        name: 'sessionBodas',
        value: bypassToken,
        domain: '.bodasdehoy.com',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86400,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto(`${APP}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const oopsCount = await page.getByText(/Algo ha fallado|Oops something went wrong/i).count();
    console.log(`[Fase3] ${route} — Oops overlays: ${oopsCount}`);

    await testInfo.attach(`fase3-${route.replaceAll('/', '_')}.png`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });

    expect(oopsCount).toBe(0);
  });
}

// ─── DebugFooter — sanity: data-testid + estructura DOM ─────────────────────
// El display de "last GraphQL err" solo aparece cuando fetchApiBodas del
// código de la app captura un error. Un fetch inyectado desde page.evaluate
// NO pasa por fetchApiBodas → no se registra en el module-level
// lastFetchApiBodasError. Forzar un login real que falle es frágil.
// En vez de eso, comprobamos que la infraestructura del footer está en su
// sitio (data-testid + estructura DOM esperada expandida).
test('DebugFooter — sanity: data-testid + estructura DOM', async ({ page }, testInfo) => {
  testInfo.setTimeout(30_000);
  await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

  const footer = page.locator('[data-testid="debug-footer"]');
  await footer.waitFor({ state: 'visible', timeout: 10_000 });
  await footer.click(); // expandir
  await page.waitForTimeout(300);

  const expandedText = (await footer.innerText()).trim();
  console.log('[DebugFooter expandido]:', expandedText.slice(0, 300));

  await testInfo.attach('debugfooter-sanity.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });

  expect(expandedText).toMatch(/host/i);
  expect(expandedText).toMatch(/buildId/i);
  expect(expandedText).toMatch(/sessionBodas/i);
  expect(expandedText).toMatch(/idTokenV0\.1\.0/i);
});

// ─── Gap 1 — banner wrong-password con role=alert + data-testid ─────────────
test('Gap 1 — banner wrong-password detectable (role=alert + data-testid)', async ({ page }, testInfo) => {
  testInfo.setTimeout(30_000);
  await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

  // Rellenar con contraseña inválida a propósito
  await page.locator('input[type="email"]').first().fill('test-r6@dev.local');
  await page.locator('input[type="password"]').first().fill('wrong-pass-r6');
  await page
    .getByRole('button', { name: /iniciar sesión|iniciar sesion/i })
    .first()
    .click();

  // Esperar a que Firebase devuelva error y banner monte
  const banner = page.locator('[data-testid="login-inline-error"]');
  await banner.waitFor({ state: 'visible', timeout: 15_000 });

  const bannerText = (await banner.innerText()).trim();
  console.log('[Gap1] banner texto:', bannerText);

  // Assertions duras
  expect(await banner.getAttribute('role')).toBe('alert');
  expect(bannerText.length).toBeGreaterThan(0);

  await testInfo.attach('gap1-banner-visible.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
});

// ─── Gap 2 — chat-dev login directo emite sessionBodas ──────────────────────
test('Gap 2 — chat-dev login directo emite sessionBodas cross-domain', async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000);
  const email = process.env.TEST_USER3_EMAIL || 'jcc@bodasdehoy.com';
  const password = process.env.TEST_USER3_PASSWORD || 'lorca2012M*+';

  // Interceptar llamada a mutation Auth de api-mcp
  const mcpAuthCalls: Array<{ status: number; hasSessionCookie: boolean }> = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api-mcp.eventosorganizador.com/graphql')) {
      try {
        const body = await response.text();
        const parsed = JSON.parse(body);
        const hasSessionCookie = !!(parsed?.data?.auth?.sessionCookie);
        mcpAuthCalls.push({ status: response.status(), hasSessionCookie });
      } catch { /* ignore */ }
    }
  });

  await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  // Rellenar y submit
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page
    .getByRole('button', { name: /iniciar sesión|iniciar sesion|continue with email/i })
    .first()
    .click();

  // Esperar a que se complete el firebase-login + call a mutation Auth
  await page.waitForTimeout(8_000);

  // Capturar cookies
  const cookies = await page.context().cookies();
  const sessionBodasCookie = cookies.find((c) => c.name === 'sessionBodas');
  const idTokenCookie = cookies.find((c) => c.name === 'idTokenV0.1.0');

  const report = {
    email,
    finalUrl: page.url(),
    sessionBodas: sessionBodasCookie
      ? {
          length: sessionBodasCookie.value?.length,
          domain: sessionBodasCookie.domain,
          partsCount: sessionBodasCookie.value?.split('.').length,
        }
      : null,
    idTokenV010: idTokenCookie
      ? {
          length: idTokenCookie.value?.length,
          domain: idTokenCookie.domain,
          partsCount: idTokenCookie.value?.split('.').length,
        }
      : null,
    mcpAuthCallsSummary: {
      totalCalls: mcpAuthCalls.length,
      atLeastOneWithSessionCookie: mcpAuthCalls.some((c) => c.hasSessionCookie),
    },
  };

  console.log('[Gap2] chat-dev login report:', JSON.stringify(report, null, 2));
  await testInfo.attach('gap2-chat-dev-cookies.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  await testInfo.attach('gap2-chat-dev-final.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });

  // Assertion: sessionBodas DEBE existir tras login directo en chat-dev
  expect(report.sessionBodas).not.toBeNull();
  expect(report.sessionBodas!.partsCount).toBe(3);
  expect(report.sessionBodas!.domain).toBe('.bodasdehoy.com');
});

// ─── Gap 3 — bypass emite pseudo-JWT 3 partes + chat-dev NO guest shell ─────
test('Gap 3 — bypass force emite pseudo-JWT 3 partes válido en chat-dev', async ({ page, request }, testInfo) => {
  testInfo.setTimeout(45_000);

  // Fase 1: llamar bypass desde HTTP directo (no browser)
  const bypassRes = await request.post(`${APP}/api/dev/refresh-session`, {
    data: { email: 'e2e-bypass@dev.local', force: true },
    headers: { 'Content-Type': 'application/json' },
  });
  const bypassBody = await bypassRes.json();
  expect(bypassRes.status()).toBe(200);
  expect(bypassBody.success).toBe(true);

  // Extraer cookie sessionBodas del Set-Cookie
  const setCookieHeaders = bypassRes.headers()['set-cookie'] || '';
  const sessionCookieMatch = setCookieHeaders.match(/sessionBodas=([^;]+)/);
  expect(sessionCookieMatch).not.toBeNull();
  const bypassToken = decodeURIComponent(sessionCookieMatch![1]);
  const partsCount = bypassToken.split('.').length;
  console.log('[Gap3] bypass token partsCount:', partsCount, 'length:', bypassToken.length);
  expect(partsCount).toBe(3);

  // Fase 2: inyectar la cookie en un contexto de browser y abrir chat-dev
  await page.context().addCookies([
    {
      name: 'sessionBodas',
      value: bypassToken,
      domain: '.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 365 * 86400,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  await page.goto(`${CHAT}/chat`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4_000);

  // Comprobar si aparece shell de invitado
  const guestShellIndicators = [
    'Usuario no registrado',
    'Iniciar sesión para',
    'Regístrate gratis',
  ];
  let foundGuestShell = false;
  for (const text of guestShellIndicators) {
    const count = await page.locator(`text=${text}`).count();
    if (count > 0) { foundGuestShell = true; break; }
  }

  const finalUrl = page.url();
  console.log('[Gap3] chat-dev after bypass — url:', finalUrl, 'guestShell:', foundGuestShell);

  await testInfo.attach('gap3-chat-dev-after-bypass.png', {
    body: await page.screenshot({ fullPage: false }),
    contentType: 'image/png',
  });
  await testInfo.attach('gap3-bypass-report.json', {
    body: JSON.stringify({ bypassToken_length: bypassToken.length, partsCount, finalUrl, foundGuestShell }, null, 2),
    contentType: 'application/json',
  });

  // Assertion: NO debe aparecer el shell de invitado (el nuevo pseudo-JWT
  // de 3 partes debe validar parseSessionJwt en el front).
  expect(foundGuestShell).toBe(false);
});
