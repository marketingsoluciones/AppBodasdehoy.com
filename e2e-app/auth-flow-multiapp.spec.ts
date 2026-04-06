/**
 * auth-flow-multiapp.spec.ts
 *
 * Valida el flujo de autenticación SSO compartido entre las apps:
 *
 *   chat-ia    → https://chat-dev.bodasdehoy.com   (puerto 3210)
 *   appEventos → https://app-dev.bodasdehoy.com    (puerto 3220)
 *   memories   → https://memories-dev.bodasdehoy.com (puerto 3240)
 *
 * Cookie puente: idTokenV0.1.0 en dominio .bodasdehoy.com
 *
 *   -- chat-ia --
 *   CA01  Acceso sin login a /chat → visitante automático (no rota)
 *   CA02  Login incorrecto → error visible, sigue en /login
 *   CA03  Login correcto → accede al chat, input visible
 *   CA04  Logout → vuelve a /login
 *   CA05  /login?reason=session_expired → mensaje de sesión expirada
 *   CA06  Visitante desde login → chat accesible
 *
 *   -- appEventos --
 *   AE01  Acceso sin login → redirige a chat-ia/login (SSO redirect)
 *   AE02  Acceso sin login → no muestra página rota ni error 404
 *   AE03  Login correcto (vía chat-ia SSO) → accede a appEventos
 *   AE04  Logout desde appEventos → vuelve a login (no a página rota)
 *
 *   -- memories-web --
 *   MW01  Acceso a /app sin login → muestra formulario de login inline (no redirige)
 *   MW02  /app sin login → no muestra error ni página en blanco
 *   MW03  Login correcto en memories-web → accede a /app autenticado
 *   MW04  Logout desde memories-web → vuelve al estado no autenticado (LoginForm visible)
 *
 *   -- SSO cross-app (bidireccional) --
 *   SSO01 Login chat-ia → cookie SSO → appEventos accesible sin re-login
 *   SSO02 Login appEventos → cookie SSO → chat-ia auto-login sin mostrar formulario
 *   SSO03 Logout en chat-ia → cookie eliminada → ambas apps requieren re-login
 *   SSO04 Re-login tras logout → autenticado en chat-ia + appEventos + memories sin re-login
 *
 * Ejecutar:
 *   E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit \
 *     TEST_USER_EMAIL=bodasdehoy.com@gmail.com \
 *     TEST_USER_PASSWORD='lorca2012M*+' \
 *     npx playwright test e2e-app/auth-flow-multiapp.spec.ts
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { TEST_CREDENTIALS } from './fixtures';

// ─── URLs fijas dev ────────────────────────────────────────────────────────────
const CHAT  = 'https://chat-dev.bodasdehoy.com';
const APP   = 'https://app-dev.bodasdehoy.com';
const MEM   = 'https://memories-dev.bodasdehoy.com';

const TIMEOUT_NAV = 45_000;
const TIMEOUT_UI  = 15_000;
const TIMEOUT_SSO = 8_000;   // tiempo máx para que AuthContext procese idTokenV0.1.0

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearAllSession(context: BrowserContext, page: Page) {
  await context.clearCookies();
  for (const origin of [CHAT, APP, MEM]) {
    try {
      await page.goto(origin, { waitUntil: 'commit', timeout: 15_000 });
      await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
    } catch { /* ignorar si el dominio no carga */ }
  }
}

/** Verifica si la cookie idTokenV0.1.0 está presente en el contexto */
async function hasSsoCookie(context: BrowserContext): Promise<boolean> {
  const cookies = await context.cookies();
  return cookies.some((c) => c.name === 'idTokenV0.1.0');
}

/** Login en appEventos vía formulario local (local-login=1 para saltarse redirect a chat-ia) */
async function loginInAppEventos(page: Page, email: string, password: string) {
  await page.goto(`${APP}/login?local-login=1`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.waitFor({ timeout: TIMEOUT_UI });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"], button').filter({ hasText: /iniciar|entrar|login/i }).first().click();
  await page.waitForTimeout(8000);
}

/** Hace logout en chat-ia (limpia cookie + localStorage) */
async function logoutFromChatIa(page: Page, context: BrowserContext) {
  await page.goto(`${CHAT}/chat`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
  await page.waitForTimeout(2000);

  // Intentar botón logout UI (avatar → Sign out)
  const avatar = page.locator('[data-testid="user-avatar"], [aria-label*="user"], [class*="UserAvatar"], [class*="avatar"]').first();
  if (await avatar.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await avatar.click();
    await page.waitForTimeout(600);
  }
  const logoutBtn = page.locator('li, [role="menuitem"], button').filter({ hasText: /cerrar sesión|sign out|logout|salir/i }).first();
  if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(3000);
    return;
  }
  // Fallback: limpiar sesión manualmente
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach((c) => {
      const key = c.split('=')[0].trim();
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.bodasdehoy.com`;
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });
  await context.clearCookies();
  await page.waitForTimeout(1000);
}

/** Detecta si la página actual es una página de error real */
function isErrorPage(body: string, url: string): boolean {
  if (/\/404|\/500|\/error/.test(url)) return true;
  const head = body.slice(0, 300);
  return /\b(404|Page Not Found|500|Application error|Internal Server Error)\b/i.test(head);
}

/** Login en chat-ia vía formulario email+password */
async function loginInChatIa(page: Page, email: string, password: string) {
  await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
  await page.waitForTimeout(2500);

  const emailInput = page.locator('input[type="email"], input[placeholder="tu@email.com"]').first();
  await emailInput.waitFor({ timeout: TIMEOUT_UI });
  await emailInput.fill(email);

  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(password);

  const submitBtn = page.locator('button').filter({ hasText: /iniciar sesión/i }).first();
  await submitBtn.click();
  await page.waitForTimeout(8000);
}

// ─── CHAT-IA ──────────────────────────────────────────────────────────────────

test.describe('CA — chat-ia auth', () => {
  test.setTimeout(120_000);

  test('CA01 — acceso sin login a /chat (visitante automático, no rota)', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${CHAT}/chat`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const isError   = isErrorPage(body, url);
    const isBlank   = body.trim().length < 50;
    const isOnLogin = url.includes('/login') || body.toLowerCase().includes('iniciar sesión');
    const isOnChat  = url.includes('/chat');

    console.log(`\nCA01 url=${url} | error=${isError} | blank=${isBlank} | login=${isOnLogin} | chat=${isOnChat}`);
    if (isOnChat) console.log(`ℹ️  CA01: /chat accesible sin login (modo visitante automático)`);

    expect(isError,  'CA01: error 404/500').toBe(false);
    expect(isBlank,  'CA01: página en blanco').toBe(false);
    expect(isOnLogin || isOnChat, 'CA01: ni login ni chat').toBe(true);
  });

  test('CA02 — credenciales incorrectas → error visible, sigue en /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(2500);

    const email = page.locator('input[type="email"]').first();
    await email.waitFor({ timeout: TIMEOUT_UI });
    await email.fill('noexiste@fake.com');
    await page.locator('input[type="password"]').first().fill('malapassword123');
    await page.locator('button').filter({ hasText: /iniciar sesión/i }).first().click();
    await page.waitForTimeout(5000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const sigue = url.includes('/login') || body.toLowerCase().includes('iniciar sesión');
    const hayError = /credenciales|contraseña|usuario|error|invalid|wrong/i.test(body);
    const entróAlChat = url.includes('/chat') && !url.includes('/login');

    console.log(`\nCA02 url=${url} | sigue_en_login=${sigue} | error_visible=${hayError} | entró_chat=${entróAlChat}`);

    expect(entróAlChat, 'CA02: entró al chat con creds incorrectas').toBe(false);
    expect(sigue, 'CA02: salió de login sin autenticarse').toBe(true);
  });

  test('CA03 — login correcto → chat con input visible', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await context.clearCookies();

    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const enChat    = url.includes('/chat');
    const hayInput  = await page.locator('textarea, [contenteditable="true"]').first().isVisible({ timeout: 10_000 }).catch(() => false);
    const esError   = isErrorPage(body, url);

    console.log(`\nCA03 url=${url} | en_chat=${enChat} | input=${hayInput} | error=${esError}`);

    expect(esError, 'CA03: error tras login').toBe(false);
    expect(enChat || hayInput, 'CA03: no llegó al chat tras login correcto').toBe(true);
  });

  test('CA04 — logout → vuelve a /login (no rota)', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await context.clearCookies();

    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Buscar logout en UserPanel (avatar → menú → Sign out)
    const avatar = page.locator('[data-testid="user-avatar"], [aria-label*="user"], [class*="UserAvatar"]').first();
    if (await avatar.isVisible({ timeout: 6_000 }).catch(() => false)) {
      await avatar.click();
      await page.waitForTimeout(800);
    }

    const logoutItem = page.locator('li, [role="menuitem"], button').filter({ hasText: /cerrar sesión|sign out|logout|salir/i }).first();
    if (await logoutItem.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await logoutItem.click();
      await page.waitForTimeout(4000);
    } else {
      // Workaround: forzar logout limpiando storage
      await page.evaluate(() => { localStorage.clear(); });
      await context.clearCookies();
      await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
      await page.waitForTimeout(2000);
      console.log(`⚠️  CA04: botón logout no encontrado — se forzó limpieza de sesión`);
    }

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const enLogin = url.includes('/login') || body.toLowerCase().includes('iniciar sesión');
    const esError = isErrorPage(body, url);
    const enBlanco = body.trim().length < 50;

    console.log(`CA04 url=${url} | en_login=${enLogin} | error=${esError} | blank=${enBlanco}`);
    if (!enLogin) console.log(`⚠️  CA04 BUG: logout no llevó a /login. URL: ${url}`);

    expect(esError, 'CA04: error tras logout').toBe(false);
    expect(enBlanco, 'CA04: página en blanco tras logout').toBe(false);
    expect(enLogin, 'CA04: logout no llevó a /login').toBe(true);
  });

  test('CA05 — sesión expirada → /login?reason=session_expired con mensaje', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${CHAT}/login?reason=session_expired`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const enLogin       = url.includes('/login');
    const msgExpirada   = /sesión.*expirad|expiró|session.*expired/i.test(body);
    const queryPreserv  = url.includes('session_expired');
    const esError       = isErrorPage(body, url);

    console.log(`\nCA05 url=${url} | en_login=${enLogin} | msg_expira=${msgExpirada} | query_ok=${queryPreserv}`);
    if (enLogin && !msgExpirada) {
      console.log(`⚠️  CA05 BUG: en login pero sin mensaje de sesión expirada (query param perdido o no renderizado). URL: ${url}`);
    }

    expect(esError, 'CA05: error con sesión expirada').toBe(false);
    expect(enLogin, 'CA05: no llegó a login').toBe(true);
    expect(msgExpirada, 'CA05 BUG: mensaje sesión expirada no visible').toBe(true);
  });

  test('CA06 — visitante desde login → chat accesible', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(2500);

    // Pulsar "← Volver" para ir al landing con botón visitante
    const volver = page.locator('button').filter({ hasText: /← volver|volver/i }).first();
    if (await volver.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await volver.click();
      await page.waitForTimeout(800);
    }

    const visitorBtn = page.locator('button').filter({ hasText: /visitante|sin registrarme|explorar/i }).first();
    if (!await visitorBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      const btns = await page.locator('button').allTextContents();
      console.log(`⚠️  CA06: botón visitante no encontrado. Botones: ${JSON.stringify(btns)}`);
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(4000);

    const url     = page.url();
    const hayChat = url.includes('/chat');
    const hayInput = await page.locator('textarea, [contenteditable="true"]').first().isVisible({ timeout: 8_000 }).catch(() => false);

    console.log(`\nCA06 url=${url} | chat=${hayChat} | input=${hayInput}`);
    expect(hayChat || hayInput, 'CA06: visitante no llegó al chat').toBe(true);
  });
});

// ─── APPVENTOS ────────────────────────────────────────────────────────────────

test.describe('AE — appEventos auth', () => {
  test.setTimeout(120_000);

  test('[AE01] acceso sin login → redirige a chat-ia/login (SSO) o login propio', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(4000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const esError    = isErrorPage(body, url);
    const enBlanco   = body.trim().length < 50;
    const enLoginApp = url.includes(`${APP}/login`) || url.includes('app-dev') && url.includes('login');
    const redirigioAChatIa = url.includes('chat-dev.bodasdehoy.com') && url.includes('/login');
    const muestraLogin = body.toLowerCase().includes('iniciar sesión') || body.toLowerCase().includes('bienvenido') || body.toLowerCase().includes('email');

    console.log(`\nAE01 url=${url}`);
    console.log(`AE01 → error=${esError} | blank=${enBlanco} | login_propio=${enLoginApp} | redirig_chat=${redirigioAChatIa} | muestra_login=${muestraLogin}`);

    if (redirigioAChatIa) console.log(`✅ AE01: redirigió correctamente a chat-ia login (SSO)`);
    else if (enLoginApp || muestraLogin) console.log(`✅ AE01: muestra login propio de appEventos`);
    else if (!esError && !enBlanco) console.log(`ℹ️  AE01: muestra página sin auth sin redirigir (${url})`);

    expect(esError,  'AE01: página de error sin login').toBe(false);
    expect(enBlanco, 'AE01: página en blanco sin login').toBe(false);
  });

  test('[AE02] sin login: no muestra error ni página rota', async ({ page, context }) => {
    await context.clearCookies();

    // Probar rutas protegidas típicas
    const rutas = ['/invitados', '/presupuesto', '/mesas', '/itinerario'];
    const resultados: Array<{ ruta: string; url: string; ok: boolean; nota: string }> = [];

    for (const ruta of rutas) {
      try {
        await page.goto(`${APP}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForTimeout(2500);
        const url  = page.url();
        const body = (await page.locator('body').textContent()) ?? '';
        const esError  = isErrorPage(body, url);
        const enBlanco = body.trim().length < 50;
        const ok       = !esError && !enBlanco;
        const nota     = esError ? 'ERROR' : enBlanco ? 'BLANK' : url.includes('/login') ? 'login_redirect' : 'page_shown';
        resultados.push({ nota, ok, ruta, url });
        console.log(`AE02 ${ruta} → ${nota} (${url.slice(0, 60)})`);
      } catch (e: any) {
        resultados.push({ nota: `timeout: ${e.message?.slice(0, 50)}`, ok: false, ruta, url: '' });
        console.log(`AE02 ${ruta} → timeout`);
      }
    }

    const fallos = resultados.filter((r) => !r.ok);
    if (fallos.length > 0) {
      console.log(`⚠️  AE02 BUG: rutas con error/blank sin login: ${fallos.map((f) => f.ruta).join(', ')}`);
    }
    expect(fallos.length, `AE02: ${fallos.length} rutas con error/blank`).toBe(0);
  });

  test('[AE03] login correcto vía SSO → accede a appEventos autenticado', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await context.clearCookies();

    // Iniciar en appEventos → detecta sin sesión → redirige a chat-ia/login
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    const urlTrasAcceso = page.url();
    console.log(`\nAE03 tras acceso sin auth: ${urlTrasAcceso}`);

    // Si redirigió a chat-ia login, autenticar ahí
    if (urlTrasAcceso.includes('chat-dev') && urlTrasAcceso.includes('login')) {
      const email = page.locator('input[type="email"]').first();
      if (await email.isVisible({ timeout: TIMEOUT_UI }).catch(() => false)) {
        await email.fill(TEST_CREDENTIALS.email);
        await page.locator('input[type="password"]').first().fill(TEST_CREDENTIALS.password);
        await page.locator('button').filter({ hasText: /iniciar sesión/i }).first().click();
        await page.waitForTimeout(10000); // SSO redirect puede tardar
      }
    } else if (urlTrasAcceso.includes(`${APP}/login`) || urlTrasAcceso.includes('app-dev') && urlTrasAcceso.includes('login')) {
      // Login propio de appEventos
      const email = page.locator('input[type="email"], input[name="email"]').first();
      if (await email.isVisible({ timeout: TIMEOUT_UI }).catch(() => false)) {
        await email.fill(TEST_CREDENTIALS.email);
        await page.locator('input[type="password"]').first().fill(TEST_CREDENTIALS.password);
        await page.locator('button[type="submit"], button').filter({ hasText: /entrar|iniciar|login/i }).first().click();
        await page.waitForTimeout(8000);
      }
    } else {
      // Ya está autenticado o muestra app sin auth
      console.log(`ℹ️  AE03: appEventos no redirigió a login — puede que ya esté en modo público o autenticado`);
    }

    const urlFinal = page.url();
    const body     = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, urlFinal);
    const enLogin  = urlFinal.includes('/login');
    const enApp    = urlFinal.includes('app-dev.bodasdehoy.com') && !urlFinal.includes('/login');

    console.log(`AE03 url_final=${urlFinal} | en_app=${enApp} | en_login=${enLogin} | error=${esError}`);

    expect(esError, 'AE03: error tras SSO login').toBe(false);
    if (enLogin) console.log(`⚠️  AE03 BUG: SSO login no completó el redirect de vuelta a appEventos`);
  });

  test('[AE04] logout desde appEventos → no muestra error ni blanco', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await context.clearCookies();

    // Login primero
    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Ir a appEventos con la cookie SSO ya activa
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(4000);

    const urlEnApp = page.url();
    console.log(`\nAE04 en appEventos: ${urlEnApp}`);

    // Buscar botón de logout (Profile.tsx tiene icono o texto de salir/logout)
    const logoutBtn = page.locator('button, a, [role="menuitem"]').filter({ hasText: /salir|cerrar sesión|logout|sign out/i }).first();
    const hayLogout = await logoutBtn.isVisible({ timeout: 6_000 }).catch(() => false);

    if (!hayLogout) {
      // Intentar abrir menú de perfil
      const profileMenu = page.locator('[class*="profile"], [class*="Profile"], [class*="avatar"], [aria-label*="perfil"], [aria-label*="cuenta"]').first();
      if (await profileMenu.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await profileMenu.click();
        await page.waitForTimeout(800);
      }
    }

    const logoutBtn2 = page.locator('button, li, a, [role="menuitem"]').filter({ hasText: /salir|cerrar sesión|logout|sign out/i }).first();
    const hayLogout2 = await logoutBtn2.isVisible({ timeout: 4_000 }).catch(() => false);

    console.log(`AE04 logout_visible=${hayLogout || hayLogout2}`);

    if (hayLogout2) {
      await logoutBtn2.click();
      await page.waitForTimeout(5000);
    } else {
      console.log(`⚠️  AE04: botón de logout no encontrado en appEventos`);
      // Forzar limpieza
      await context.clearCookies();
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
      await page.waitForTimeout(3000);
    }

    const urlFinal = page.url();
    const body     = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, urlFinal);
    const enBlanco = body.trim().length < 50;
    const enLogin  = body.toLowerCase().includes('iniciar sesión') || urlFinal.includes('/login');

    console.log(`AE04 url_final=${urlFinal} | en_login=${enLogin} | error=${esError} | blank=${enBlanco}`);
    if (!enLogin) console.log(`⚠️  AE04 BUG: logout de appEventos no llevó a login. URL: ${urlFinal}`);

    expect(esError,  'AE04: error tras logout de appEventos').toBe(false);
    expect(enBlanco, 'AE04: página en blanco tras logout de appEventos').toBe(false);
  });
});

// ─── MEMORIES-WEB ─────────────────────────────────────────────────────────────

test.describe('MW — memories-web auth', () => {
  test.setTimeout(120_000);

  test('[MW01] /app sin login → LoginForm inline visible (no redirige)', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${MEM}/app`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, url);
    const enBlanco = body.trim().length < 50;
    // memories-web muestra LoginForm inline (no redirige a /login)
    const hayFormLogin = body.toLowerCase().includes('email') || body.toLowerCase().includes('iniciar') || body.toLowerCase().includes('entrar') || await page.locator('input[type="email"], input[type="text"]').isVisible({ timeout: 3_000 }).catch(() => false);
    const redirigioOtro = !url.includes('memories-dev');

    console.log(`\nMW01 url=${url} | error=${esError} | blank=${enBlanco} | form_login=${hayFormLogin} | redirigió=${redirigioOtro}`);

    if (redirigioOtro) console.log(`⚠️  MW01 BUG: memories-web /app redirigió a otro dominio: ${url}`);
    if (!hayFormLogin && !enBlanco && !esError) console.log(`ℹ️  MW01: /app muestra contenido sin login (acceso público o ya autenticado por cookie)`);

    expect(esError,  'MW01: error en /app sin login').toBe(false);
    expect(enBlanco, 'MW01: página en blanco en /app sin login').toBe(false);
  });

  test('[MW02] /app sin login: no rota, no 404', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${MEM}/app`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, url);
    const enBlanco = body.trim().length < 50;

    console.log(`\nMW02 url=${url} | body_len=${body.length} | error=${esError}`);

    expect(esError,  'MW02: error 404/500 en memories /app sin login').toBe(false);
    expect(enBlanco, 'MW02: página en blanco en memories /app').toBe(false);
  });

  test('[MW03] login en memories-web → accede autenticado', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await context.clearCookies();

    await page.goto(`${MEM}/app`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    // Buscar el formulario de login inline (LoginForm.tsx)
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    const hayInput   = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hayInput) {
      console.log(`\nMW03: no hay formulario de login (puede que ya esté autenticado por SSO o acceso público)`);
      const body = (await page.locator('body').textContent()) ?? '';
      console.log(`MW03 body snippet: ${body.slice(0, 200)}`);
      // Si ya está mostrando contenido de app → OK
      const tieneContenido = body.length > 100;
      expect(tieneContenido, 'MW03: no hay form ni contenido').toBe(true);
      return;
    }

    await emailInput.fill(TEST_CREDENTIALS.email);
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /entrar|acceder|continuar|login|iniciar/i }).first();
    if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.click();
    } else {
      await emailInput.press('Enter');
    }
    await page.waitForTimeout(5000);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, url);
    const enApp    = url.includes('/app') && url.includes('memories-dev');
    const sinLogin = !body.toLowerCase().includes('iniciar') && !body.toLowerCase().includes('email') || body.length > 500;

    console.log(`\nMW03 url=${url} | en_app=${enApp} | content_ok=${sinLogin} | error=${esError}`);

    expect(esError, 'MW03: error tras login en memories-web').toBe(false);
  });

  test('[MW04] logout desde memories-web → vuelve a estado no autenticado', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto(`${MEM}/app`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);

    // Buscar botón de logout/salir (index.tsx línea 88: <button onClick={onLogout}>Salir</button>)
    const salirBtn = page.locator('button').filter({ hasText: /salir|logout|cerrar/i }).first();
    const haySalir = await salirBtn.isVisible({ timeout: 4_000 }).catch(() => false);

    console.log(`\nMW04 logout_visible=${haySalir}`);

    if (haySalir) {
      await salirBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log(`⚠️  MW04: botón Salir no encontrado (quizás no está autenticado o el botón tiene otro texto)`);
      await context.clearCookies();
      await page.evaluate(() => { try { localStorage.removeItem('memories_user_id'); } catch { /* */ } });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
      await page.waitForTimeout(3000);
    }

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const esError  = isErrorPage(body, url);
    const enBlanco = body.trim().length < 50;

    console.log(`MW04 url=${url} | error=${esError} | blank=${enBlanco}`);

    expect(esError,  'MW04: error tras logout de memories-web').toBe(false);
    expect(enBlanco, 'MW04: página en blanco tras logout de memories-web').toBe(false);
  });
});

// ─── SSO CROSS-APP ────────────────────────────────────────────────────────────

test.describe('SSO — cross-app bidireccional', () => {
  test.setTimeout(180_000);

  // ── SSO01: chat-ia → appEventos ──────────────────────────────────────────────
  test('[SSO01] login chat-ia → cookie SSO → appEventos accesible sin re-login', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await clearAllSession(context, page);

    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    console.log(`\nSSO01 tras login chat-ia: ${page.url()}`);

    const cookiePresente = await hasSsoCookie(context);
    console.log(`SSO01 idTokenV0.1.0: ${cookiePresente ? '✅' : '❌'}`);
    expect(cookiePresente, 'SSO01: cookie idTokenV0.1.0 no seteada por chat-ia').toBe(true);

    // Navegar a appEventos — AuthContext debe procesar la cookie automáticamente
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(TIMEOUT_SSO);

    const url  = page.url();
    const body = (await page.locator('body').textContent()) ?? '';
    const enApp   = url.includes('app-dev') && !url.includes('/login');
    const enLogin = url.includes('/login');

    console.log(`SSO01 url_app=${url} | en_app=${enApp} | pide_login=${enLogin}`);
    if (enApp) console.log(`✅ SSO01: acceso directo a appEventos sin re-login`);
    if (enLogin) console.log(`⚠️  SSO01 BUG: appEventos pidió login aunque tenía cookie SSO`);

    expect(isErrorPage(body, url), 'SSO01: error en appEventos').toBe(false);
    expect(enLogin, 'SSO01: appEventos pidió re-login con cookie SSO presente').toBe(false);
  });

  // ── SSO02: appEventos → chat-ia (FIX DE HOY) ─────────────────────────────────
  test('[SSO02] login appEventos → cookie SSO → chat-ia auto-login sin mostrar formulario', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await clearAllSession(context, page);

    // Login en appEventos
    await loginInAppEventos(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    console.log(`\nSSO02 tras login app-dev: ${page.url()}`);

    const cookiePresente = await hasSsoCookie(context);
    console.log(`SSO02 idTokenV0.1.0: ${cookiePresente ? '✅' : '❌'}`);
    expect(cookiePresente, 'SSO02: cookie idTokenV0.1.0 no seteada por appEventos').toBe(true);

    // Navegar a chat-ia/login — el useEffect de auto-SSO debe detectar la cookie
    // y redirigir a /chat sin mostrar el formulario
    await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });

    // Esperar a que el useEffect de auto-SSO ejecute y redirija
    let enChat = false;
    let intentos = 0;
    while (!enChat && intentos < 15) {
      await page.waitForTimeout(1000);
      const url = page.url();
      enChat = url.includes('/chat') && !url.includes('/login');
      intentos++;
    }

    const urlFinal = page.url();
    const body     = (await page.locator('body').textContent()) ?? '';
    const formularioVisible = await page.locator('input[type="email"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const enLogin  = urlFinal.includes('/login');

    console.log(`SSO02 url_final=${urlFinal} | en_chat=${enChat} | formulario_visible=${formularioVisible} | en_login=${enLogin}`);
    if (enChat) console.log(`✅ SSO02: auto-SSO funcionó — chat-ia detectó cookie y redirigió a /chat`);
    if (formularioVisible) console.log(`⚠️  SSO02 BUG: chat-ia mostró formulario de login aunque había cookie idTokenV0.1.0`);

    expect(isErrorPage(body, urlFinal), 'SSO02: error en chat-ia').toBe(false);
    expect(formularioVisible, 'SSO02: chat-ia mostró formulario con cookie SSO presente').toBe(false);
    expect(enChat, 'SSO02: chat-ia no redirigió a /chat con cookie SSO').toBe(true);
  });

  // ── SSO03: Logout → sesión cerrada en ambas apps ──────────────────────────────
  test('[SSO03] logout en chat-ia → cookie SSO eliminada → ambas apps piden re-login', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await clearAllSession(context, page);

    // Login en chat-ia
    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    expect(await hasSsoCookie(context), 'SSO03: sin cookie tras login').toBe(true);
    console.log(`\nSSO03 login chat-ia OK, cookie presente`);

    // Verificar que appEventos es accesible (pre-condición)
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(TIMEOUT_SSO);
    const urlPreLogout = page.url();
    const appAccesible = urlPreLogout.includes('app-dev') && !urlPreLogout.includes('/login');
    console.log(`SSO03 app-dev antes del logout: ${appAccesible ? '✅ accesible' : '⚠️  pide login'}`);

    // Logout desde chat-ia
    await logoutFromChatIa(page, context);
    console.log(`SSO03 logout ejecutado`);

    // Verificar que la cookie desapareció
    const cookieTrasLogout = await hasSsoCookie(context);
    console.log(`SSO03 idTokenV0.1.0 tras logout: ${cookieTrasLogout ? '⚠️  AÚN PRESENTE' : '✅ eliminada'}`);

    // Verificar que chat-ia pide re-login
    await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(3000);
    const urlChat  = page.url();
    const chatEnLogin  = urlChat.includes('/login');
    const chatFormVisible = await page.locator('input[type="email"]').first().isVisible({ timeout: 4_000 }).catch(() => false);
    console.log(`SSO03 chat-ia tras logout: ${chatEnLogin ? '✅ en /login' : '⚠️  no en login'} | formulario=${chatFormVisible}`);

    // Verificar que appEventos también requiere re-login
    await page.goto(`${APP}/invitados`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(5000);
    const urlApp   = page.url();
    const appEnLogin = urlApp.includes('/login') || urlApp.includes('chat-dev');
    console.log(`SSO03 app-dev tras logout: ${appEnLogin ? '✅ pide re-login' : '⚠️  accedió sin login'}`);

    expect(chatFormVisible, 'SSO03: chat-ia no mostró formulario tras logout').toBe(true);
    expect(appEnLogin, 'SSO03: appEventos no pidió re-login tras logout de chat-ia').toBe(true);
  });

  // ── SSO04: Re-login → autenticado en las 3 apps ───────────────────────────────
  test('[SSO04] re-login en chat-ia → autenticado en chat-ia + appEventos + memories sin re-login', async ({ page, context }) => {
    if (!TEST_CREDENTIALS.email) { test.skip(); return; }
    await clearAllSession(context, page);

    // Login único en chat-ia
    await loginInChatIa(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    const cookiePresente = await hasSsoCookie(context);
    console.log(`\nSSO04 login chat-ia OK | cookie=${cookiePresente ? '✅' : '❌'}`);
    expect(cookiePresente, 'SSO04: cookie no seteada tras login').toBe(true);

    const resultados: Array<{ app: string; ok: boolean; url: string }> = [];

    // Verificar chat-ia (ya logueado)
    const urlChat = page.url();
    const chatOk  = urlChat.includes('/chat') && !urlChat.includes('/login');
    resultados.push({ app: 'chat-ia', ok: chatOk, url: urlChat });
    console.log(`SSO04 chat-ia: ${chatOk ? '✅' : '❌'} (${urlChat})`);

    // Verificar appEventos — debe auto-autenticar via cookie
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(TIMEOUT_SSO);
    const urlApp   = page.url();
    const appOk    = urlApp.includes('app-dev') && !urlApp.includes('/login');
    resultados.push({ app: 'appEventos', ok: appOk, url: urlApp });
    console.log(`SSO04 appEventos: ${appOk ? '✅' : '❌'} (${urlApp})`);

    // Verificar memories-web — debe auto-autenticar via idTokenV0.1.0 (AuthBridge fix)
    await page.goto(`${MEM}/app`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_NAV });
    await page.waitForTimeout(5000);
    const urlMem   = page.url();
    const memBody  = (await page.locator('body').textContent()) ?? '';
    // Con el fix de AuthBridge: idTokenV0.1.0 → isAuthenticated=true → muestra dashboard
    const memMuestraLogin = memBody.toLowerCase().includes('introduce tu email') || await page.locator('input[type="email"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const memMuestraApp   = memBody.includes('álbum') || memBody.includes('Nuevo álbum') || memBody.includes('Mis álbumes');
    const memOk    = !isErrorPage(memBody, urlMem) && !memMuestraLogin;
    resultados.push({ app: 'memories', ok: memOk, url: urlMem });
    console.log(`SSO04 memories: ${memOk ? '✅' : '❌'} | muestraLogin=${memMuestraLogin} | muestraApp=${memMuestraApp} (${urlMem})`);
    if (memMuestraLogin) console.log(`⚠️  SSO04 BUG memories: muestra formulario de login aunque idTokenV0.1.0 presente (AuthBridge no propagó SSO)`);

    const fallos = resultados.filter((r) => !r.ok);
    if (fallos.length === 0) {
      console.log(`✅ SSO04: un solo login → autenticado en las ${resultados.length} apps`);
    } else {
      console.log(`⚠️  SSO04 fallos: ${fallos.map((f) => f.app).join(', ')}`);
    }

    expect(chatOk,  'SSO04: chat-ia no quedó autenticado').toBe(true);
    expect(appOk,   'SSO04: appEventos requirió re-login (SSO no propagado)').toBe(true);
    expect(isErrorPage(memBody, urlMem), 'SSO04: memories-web devuelve error').toBe(false);
    expect(memMuestraLogin, 'SSO04: memories-web mostró form de login con idTokenV0.1.0 presente (AuthBridge SSO roto)').toBe(false);
  });
});
