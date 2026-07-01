/**
 * diag-r5-login-tokenparts.spec.ts
 *
 * QA R5 ronda 5 — diagnóstico del CASO D masivo:
 * el backend api-mcp rechaza el idToken con "Token no tiene formato JWT
 * válido (debe tener 3 partes)". Este test hace login real en app-dev
 * y captura:
 *   - Console: log "[Auth] tokenID diagnóstico" con partsCount
 *   - Network: POST /api/proxy-bodas/graphql response body + request payload
 *   - Cookies: sessionBodas + idTokenV0.1.0 tras 3s post-submit
 *
 * Ejecutar:
 *   E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit \
 *     npx playwright test e2e-app/diag-r5-login-tokenparts.spec.ts \
 *     --project=webkit --reporter=list
 */
import { test, expect } from '@playwright/test';
import { TEST_URLS } from './fixtures';

const APP = process.env.APP_URL || TEST_URLS.app || 'https://app-dev.bodasdehoy.com';

const CANDIDATES: Array<{ label: string; email: string; password: string }> = [
  {
    label: 'jcc@bodasdehoy.com',
    email: process.env.TEST_USER3_EMAIL || 'jcc@bodasdehoy.com',
    password: process.env.TEST_USER3_PASSWORD || 'lorca2012M*+',
  },
  {
    label: 'bodasdehoy.com@gmail.com',
    email: process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com',
    password: process.env.TEST_USER_PASSWORD || 'lorca2012M*+',
  },
];

for (const cred of CANDIDATES) {
  test(`R5 diag — login ${cred.label} en app-dev`, async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);

    // Captura Console
    const consoleLines: Array<{ type: string; text: string }> = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('[Auth]') ||
        text.includes('[fetchApiBodas]') ||
        text.includes('[FormLogin]') ||
        text.includes('[Verificator]') ||
        text.includes('tokenID') ||
        text.includes('partsCount') ||
        text.includes('sessionBodas') ||
        text.includes('sessionCookie')
      ) {
        consoleLines.push({ type: msg.type(), text });
      }
    });

    // Captura request/response del proxy GraphQL
    const graphqlEvents: Array<{
      url: string;
      status: number;
      requestBody?: string;
      responseBody?: string;
    }> = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/proxy-bodas/graphql') || url.includes('api-mcp')) {
        const status = response.status();
        let requestBody: string | undefined;
        let responseBody: string | undefined;
        try {
          requestBody = response.request().postData() ?? undefined;
        } catch {
          /* ignore */
        }
        try {
          responseBody = (await response.text()).slice(0, 4000);
        } catch {
          /* ignore */
        }
        graphqlEvents.push({ url, status, requestBody: requestBody?.slice(0, 4000), responseBody });
      }
    });

    // 1) Ir a /login
    await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // 2) Rellenar formulario
    // SplitLoginPage usa placeholder + type, no name attributes
    await page
      .locator('input[type="email"], input[placeholder*="@"], input[name="identifier"]')
      .first()
      .fill(cred.email);
    await page.locator('input[type="password"]').first().fill(cred.password);
    // 3) Submit — botón "Iniciar sesión"
    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/proxy-bodas/graphql'),
          { timeout: 30_000 },
        )
        .catch(() => null),
      page
        .getByRole('button', { name: /iniciar sesión|iniciar sesion|login|sign in/i })
        .first()
        .click(),
    ]);

    // 4) Esperar a que el flujo async del post-login intente setear cookies
    await page.waitForTimeout(5_000);

    // 5) Capturar cookies
    const cookies = await page.context().cookies();
    const relevant = cookies.filter((c) =>
      ['sessionBodas', 'idTokenV0.1.0', 'undefined', 'current_development', 'guestbodas'].includes(
        c.name,
      ),
    );

    // 6) Buscar log tokenID diagnóstico específicamente
    const tokenDiag = consoleLines.find((l) => l.text.includes('tokenID diagnóstico'));

    // 7) Construir informe
    const report = {
      cred: cred.label,
      appUrl: APP,
      finalUrl: page.url(),
      tokenDiag: tokenDiag?.text ?? null,
      consoleAuthLines: consoleLines.slice(0, 40),
      graphqlEvents: graphqlEvents.map((e) => ({
        url: e.url,
        status: e.status,
        requestQuery: (() => {
          try {
            return e.requestBody ? JSON.parse(e.requestBody)?.query?.slice(0, 200) : undefined;
          } catch {
            return e.requestBody?.slice(0, 200);
          }
        })(),
        requestVariables: (() => {
          try {
            const body = e.requestBody ? JSON.parse(e.requestBody) : null;
            const vars = body?.variables;
            if (vars?.idToken) {
              const t = String(vars.idToken);
              return {
                idToken_length: t.length,
                idToken_partsCount: t.split('.').length,
                idToken_first20: t.slice(0, 20),
                idToken_last20: t.slice(-20),
                otherVars: Object.keys(vars).filter((k) => k !== 'idToken'),
              };
            }
            return vars;
          } catch {
            return null;
          }
        })(),
        responsePreview: e.responseBody?.slice(0, 800),
      })),
      cookies: relevant.map((c) => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        valueLength: c.value?.length,
        valuePreview: c.value?.slice(0, 30),
      })),
    };

    console.log('\n============ R5 DIAG REPORT ============');
    console.log(JSON.stringify(report, null, 2));
    console.log('============ END REPORT ============\n');

    // Adjuntar al reporte HTML
    await testInfo.attach('r5-diag-report.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
    await testInfo.attach('final-screenshot.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    // Test no falla; solo diagnóstico
    expect(report.graphqlEvents.length).toBeGreaterThan(0);
  });
}
