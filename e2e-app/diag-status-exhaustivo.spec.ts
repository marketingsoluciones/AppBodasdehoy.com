import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://app-dev.bodasdehoy.com';
const CHAT_URL = process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com';
const EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'lorca2012M*+';

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { error: 'no es JWT (no tiene 3 partes)' };
    const decode = (b64: string) => {
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const norm = padded.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(norm, 'base64').toString('utf-8'));
    };
    return { header: decode(parts[0]), payload: decode(parts[1]), signaturePresent: parts[2].length > 0 };
  } catch (e: any) {
    return { error: String(e?.message || e) };
  }
}

test('REPRO-EXHAUSTIVO: status(sessionCookie) en api3-mcp DEV', async ({ page, context }) => {
  test.setTimeout(180_000);

  console.log('=== PASO 1: Login en chat-dev (SSO real) ===');
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((u: URL) => u.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
  }
  console.log(`Login finalizado, URL=${page.url()}`);

  console.log('\n=== PASO 2: Extraer cookies y decodificar JWT ===');
  const cookies = await context.cookies();
  console.log(`Cookies presentes (${cookies.length}):`);
  for (const c of cookies) {
    if (c.name.includes('idToken') || c.name.includes('session') || c.name.includes('Bodas')) {
      console.log(
        `  - ${c.name}: domain=${c.domain} path=${c.path} secure=${c.secure} sameSite=${c.sameSite} httpOnly=${c.httpOnly} valueLength=${c.value.length}`,
      );
    }
  }

  const idToken = cookies.find((c) => c.name === 'idTokenV0.1.0');
  const sessionBodas = cookies.find((c) => c.name === 'sessionBodas');
  const candidate = sessionBodas?.value || idToken?.value || '';
  console.log(`\nCookie elegida para status(): ${sessionBodas ? 'sessionBodas' : (idToken ? 'idTokenV0.1.0' : '(ninguna)')}`);

  if (candidate) {
    const decoded = decodeJwt(candidate);
    console.log('JWT decodificado (header + payload):');
    console.log(JSON.stringify(decoded, null, 2));
    if (decoded?.payload?.exp) {
      const expDate = new Date(decoded.payload.exp * 1000);
      const now = new Date();
      const diffMin = Math.round((expDate.getTime() - now.getTime()) / 60000);
      console.log(
        `exp = ${expDate.toISOString()} (now=${now.toISOString()}, diff=${diffMin} min — JWT ${diffMin > 0 ? 'AÚN VÁLIDO' : 'EXPIRADO'})`,
      );
    }
    if (decoded?.payload?.iat) {
      const iatDate = new Date(decoded.payload.iat * 1000);
      console.log(`iat = ${iatDate.toISOString()} (recién emitido, ~${Math.round((Date.now() - iatDate.getTime()) / 1000)}s ago)`);
    }
  }

  console.log('\n=== PASO 3: Navegar a app-dev y probar mutation status() con variantes ===');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3000);

  console.log('\n--- VARIANTE 1: /api/proxy/graphql + X-Development ---');
  const v1 = await page.evaluate(async (token: string) => {
    const res = await fetch('/api/proxy/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy', Development: 'bodasdehoy' },
      body: JSON.stringify({
        query: `mutation ($sessionCookie : String!){ status(sessionCookie: $sessionCookie){ customToken } }`,
        variables: { sessionCookie: token },
      }),
    });
    return {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type'), 'x-trace-id': res.headers.get('x-trace-id') },
      body: (await res.text()).slice(0, 1000),
    };
  }, candidate);
  console.log(`HTTP ${v1.status}`);
  console.log(`Headers: ${JSON.stringify(v1.headers)}`);
  console.log(`Body: ${v1.body}`);

  console.log('\n--- VARIANTE 2: api3-mcp directo + X-Development ---');
  const v2 = await page.evaluate(async (token: string) => {
    const res = await fetch('https://api-mcp.eventosorganizador.com/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy' },
      body: JSON.stringify({
        query: `mutation ($sessionCookie : String!){ status(sessionCookie: $sessionCookie){ customToken } }`,
        variables: { sessionCookie: token },
      }),
    });
    return {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type'), 'x-trace-id': res.headers.get('x-trace-id') },
      body: (await res.text()).slice(0, 1000),
    };
  }, candidate);
  console.log(`HTTP ${v2.status}`);
  console.log(`Headers: ${JSON.stringify(v2.headers)}`);
  console.log(`Body: ${v2.body}`);

  console.log('\n--- CONTROL: { __typename } con misma cookie (debe pasar) ---');
  const ctrl = await page.evaluate(async () => {
    const res = await fetch('https://api-mcp.eventosorganizador.com/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    return { status: res.status, body: (await res.text()).slice(0, 300) };
  });
  console.log(`HTTP ${ctrl.status}`);
  console.log(`Body: ${ctrl.body}`);

  console.log('\n--- CONTROL NEGATIVO: status(sessionCookie=\"\") ---');
  const v3 = await page.evaluate(async () => {
    const res = await fetch('https://api-mcp.eventosorganizador.com/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Development': 'bodasdehoy' },
      body: JSON.stringify({
        query: `mutation ($sessionCookie : String!){ status(sessionCookie: $sessionCookie){ customToken } }`,
        variables: { sessionCookie: '' },
      }),
    });
    return { status: res.status, body: (await res.text()).slice(0, 600) };
  });
  console.log(`HTTP ${v3.status}`);
  console.log(`Body: ${v3.body}`);

  console.log('\n--- CONTROL POSITIVO: misma mutation en api3 produccion / no DEV ---');
  const v4 = await page.evaluate(async () => {
    try {
      const res = await fetch('https://api-mcp.eventosorganizador.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      return { status: res.status, body: (await res.text()).slice(0, 300) };
    } catch (e: any) {
      return { status: 0, body: '', error: String(e?.message || e) };
    }
  });
  console.log(`HTTP ${v4.status} body=${v4.body}`);

  expect(true).toBe(true);
});
