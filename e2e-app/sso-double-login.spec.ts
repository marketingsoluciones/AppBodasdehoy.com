/**
 * SSO Double Login Diagnostic — app-test / chat-test
 *
 * Bug: After logging in at chat-test, the user sees "Sesión no autorizada o expirada"
 * at app-test/login and is then redirected to chat-test/login again (double login).
 *
 * Root cause hypothesis:
 * 1. login.js sets sso_redirect_pending='1' → redirects to chat-test/login
 * 2. User logs in → idTokenV0.1.0 cookie set → redirect to app-test/
 * 3. AuthContext SSO cross-domain: calls /api/proxy-bodas/graphql auth mutation
 * 4. IF this call fails → catch block does NOT clear sso_redirect_pending
 * 5. API calls return 401 → handleSessionExpired() removes idTokenV0.1.0 → /login?session_expired=1
 * 6. At login?session_expired=1: ssoRedirectPending='1' still set → SSO blocked → shows error form
 * 7. User fills form → signInWithCustomToken fails (app-test not in Firebase authorized domains)
 * 8. sso_redirect_pending eventually clears → SSO fires AGAIN to chat-test → double login
 *
 * Tests in this file require TEST_PASSWORD env var for full credential flows.
 * Several diagnostic tests can run without credentials.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const APP_TEST = 'https://app-test.bodasdehoy.com';
const CHAT_TEST = 'https://chat-test.bodasdehoy.com';
const TEST_EMAIL = 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';

// Helper: limpia cookies + sessionStorage de ambos orígenes
async function cleanSession(context: BrowserContext) {
  await context.clearCookies();
  const page = await context.newPage();
  await page.goto(APP_TEST + '/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.evaluate(() => sessionStorage.clear());
  await page.close();
}

// Helper: leer sso_redirect_pending en app-test
async function getSsoFlag(page: Page): Promise<string | null> {
  return page.evaluate(() => sessionStorage.getItem('sso_redirect_pending'));
}

// Helper: esperar a que la URL cambie con timeout
async function waitForUrlChange(page: Page, fromUrl: string, timeout = 10000): Promise<string> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const current = page.url();
    if (!current.includes(fromUrl)) return current;
    await page.waitForTimeout(200);
  }
  return page.url();
}

// =============================================================================
// BLOQUE 1: Diagnóstico sin credenciales — comportamiento del SSO redirect
// =============================================================================
test.describe('SSO Redirect — comportamiento del flag', () => {

  test('DL01 — login page sin sesión activa el SSO redirect a chat-test', async ({ page }) => {
    // Limpiar estado
    await page.context().clearCookies();

    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => { sessionStorage.clear(); });

    // Recargar para que el effect de SSO se ejecute con sessionStorage limpio
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    // Esperar posible redirect a chat-test
    try {
      await page.waitForURL(/chat-test\.bodasdehoy\.com\/login/, { timeout: 8000 });
    } catch {
      // No hubo redirect automático
    }

    const finalUrl = page.url();
    console.log('DL01 url_final:', finalUrl);

    const wentToChatTest = finalUrl.includes('chat-test.bodasdehoy.com');
    const stuckOnAppTest = finalUrl.includes('app-test.bodasdehoy.com');

    console.log('DL01', JSON.stringify({ wentToChatTest, stuckOnAppTest, finalUrl }));

    // El comportamiento esperado es redirigir a chat-test
    if (wentToChatTest) {
      console.log('✅ DL01: SSO redirect funcionando correctamente');
    } else {
      console.log('⚠️  DL01 BUG: SSO redirect NO ocurrió — página permanece en app-test/login');
      // Capturar estado para diagnóstico
      const ssoFlag = await page.evaluate(() => sessionStorage.getItem('sso_redirect_pending'));
      const hasCookie = await page.evaluate(() => document.cookie.includes('idTokenV0.1.0'));
      const hasSessionBodas = await page.evaluate(() => document.cookie.includes('sessionBodas'));
      const sessionExpiredBanner = await page.locator('text=Sesión no autorizada').isVisible().catch(() => false);
      console.log('DL01 diagnóstico:', JSON.stringify({ ssoFlag, hasCookie, hasSessionBodas, sessionExpiredBanner }));
    }

    // Test no falla — es diagnóstico. Solo valida que no hay error de página.
    await expect(page).not.toHaveURL(/500|error/i);
  });

  test('DL02 — sso_redirect_pending=1 bloquea el SSO redirect', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Simular estado "stuck": flag seteado pero sin cookie
    await page.evaluate(() => {
      sessionStorage.setItem('sso_redirect_pending', '1');
    });

    // Esperar un poco para que cualquier effect se ejecute
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const ssoFlag = await getSsoFlag(page);
    const wentToChatTest = currentUrl.includes('chat-test.bodasdehoy.com');
    const sessionExpiredVisible = await page.locator('text=Sesión no autorizada').isVisible().catch(() => false);
    const loginFormVisible = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);

    console.log('DL02', JSON.stringify({ currentUrl, ssoFlag, wentToChatTest, sessionExpiredVisible, loginFormVisible }));

    if (!wentToChatTest && loginFormVisible) {
      console.log('✅ DL02 confirmado: sso_redirect_pending=1 bloquea SSO redirect, muestra formulario de login (estado atascado)');
    } else if (wentToChatTest) {
      console.log('ℹ️  DL02: SSO redirect ocurrió a pesar del flag (flag fue ignorado o limpiado)');
    }

    // El formulario debe ser visible cuando el flag está seteado (comportamiento bloqueado)
    expect(wentToChatTest).toBe(false);
    expect(loginFormVisible || sessionExpiredVisible).toBe(true);
  });

  test('DL03 — sso_redirect_pending NO se limpia al fallar la sesión SSO', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Simular que el SSO redirect fue enviado (flag seteado)
    await page.evaluate(() => {
      sessionStorage.setItem('sso_redirect_pending', '1');
    });

    // Simular que el usuario volvió de chat-test con idTokenV0.1.0 inválido
    await page.context().addCookies([{
      name: 'idTokenV0.1.0',
      value: 'invalid-token-to-force-failure',
      domain: '.bodasdehoy.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    }]);

    // Navegar a la app (simula el redirect de vuelta desde chat-test)
    await page.goto(APP_TEST + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Esperar a que AuthContext intente procesar el token
    await page.waitForTimeout(6000); // timeout SSO 4s + margen

    const urlAfterWait = page.url();
    const ssoFlagAfter = await getSsoFlag(page);
    const hasBadCookie = await page.evaluate(() => document.cookie.includes('idTokenV0.1.0'));

    console.log('DL03', JSON.stringify({
      urlAfterWait,
      ssoFlagAfter,
      hasBadCookie,
      note: 'sso_redirect_pending debería ser null si se limpió correctamente tras fallo'
    }));

    if (ssoFlagAfter === '1') {
      console.log('🐛 DL03 BUG CONFIRMADO: sso_redirect_pending=1 persiste después del fallo SSO cross-domain');
      console.log('   → Esto causa que el usuario quede atascado en el formulario de login');
      console.log('   → Fix: limpiar sso_redirect_pending en el catch block de AuthContext.tsx línea ~794');
    } else {
      console.log('✅ DL03: sso_redirect_pending fue limpiado correctamente tras fallo SSO');
    }

    // Verificar que si navegamos a /login, el SSO redirect se activa (no bloqueado)
    await page.evaluate(() => {
      // Limpiar el token inválido para que hasSsoToken sea false
      document.cookie = 'idTokenV0.1.0=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.bodasdehoy.com; path=/';
    });
    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const urlAtLogin = page.url();
    const canRedirectToChat = urlAtLogin.includes('chat-test.bodasdehoy.com');
    const flagBlockingRedirect = (await getSsoFlag(page)) === '1';

    console.log('DL03 after-cleanup check:', JSON.stringify({
      urlAtLogin,
      canRedirectToChat,
      flagBlockingRedirect,
      note: 'Si flagBlockingRedirect=true, el usuario quedó atascado y no puede llegar a chat-test/login'
    }));

    if (flagBlockingRedirect) {
      console.log('🐛 DL03 BUG: sso_redirect_pending stuck → Usuario no puede ir a chat-test/login');
    }
  });

  test('DL04 — session_expired=1 con flag stuck NO redirige a chat-test', async ({ page }) => {
    await page.context().clearCookies();

    // Simular exactamente el estado del bug:
    // - sso_redirect_pending=1 (de la redirección anterior)
    // - sin idTokenV0.1.0 (fue eliminado por handleSessionExpired)
    // - URL: /login?session_expired=1

    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      sessionStorage.setItem('sso_redirect_pending', '1');
    });

    await page.goto(APP_TEST + '/login?session_expired=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    const sessionExpiredBanner = await page.locator('text=Sesión no autorizada').isVisible().catch(() => false);
    const loginFormVisible = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
    const wentToChat = url.includes('chat-test.bodasdehoy.com');
    const ssoFlag = await getSsoFlag(page);

    console.log('DL04', JSON.stringify({
      url, sessionExpiredBanner, loginFormVisible, wentToChat, ssoFlag
    }));

    if (sessionExpiredBanner && loginFormVisible && !wentToChat) {
      console.log('🐛 DL04 BUG CONFIRMADO: con sso_redirect_pending=1 + session_expired=1');
      console.log('   → Usuario ve error "Sesión no autorizada" + formulario de login');
      console.log('   → NO redirige a chat-test para re-autenticarse automáticamente');
      console.log('   → Usuario debe introducir credenciales manualmente en app-test/login');
      console.log('   → ESTO ES EL DOUBLE LOGIN BUG (pantalla 3 del screenshot del usuario)');
    } else if (wentToChat) {
      console.log('✅ DL04: Redirige a chat-test para re-autenticarse (bug no presente o corregido)');
    }

    // La presencia del banner + form SIN redirect a chat confirma el bug
    expect(wentToChat).toBe(false); // documenta el bug actual
    expect(sessionExpiredBanner).toBe(true); // banner visible (bug presente)
  });

});

// =============================================================================
// BLOQUE 2: Diagnóstico del formulario de login directo en app-test
// (sin SSO redirect — con ?local-login=1)
// =============================================================================
test.describe('Login directo app-test — signInWithCustomToken', () => {

  test.skip(!TEST_PASSWORD, 'Requiere TEST_PASSWORD env var');

  test('DL05 — login directo app-test: signInWithCustomToken falla si dominio no autorizado', async ({ page }) => {
    await page.context().clearCookies();

    // Capturar errores de consola para detectar signInWithCustomToken failures
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('signInWithCustomToken') || msg.text().includes('Auth]')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('requestfailed', req => {
      networkErrors.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
    });

    // Interceptar respuestas para capturar errores de auth
    const authResponses: Array<{ url: string; status: number; body?: string }> = [];
    page.on('response', async resp => {
      const url = resp.url();
      if (url.includes('/graphql') || url.includes('/api/proxy') || url.includes('/api/auth')) {
        const status = resp.status();
        let body = '';
        try {
          const text = await resp.text();
          if (text.includes('error') || text.includes('Error') || status >= 400) {
            body = text.substring(0, 300);
          }
        } catch {}
        if (status >= 400 || body) {
          authResponses.push({ url: url.replace(/https:\/\/[^/]+/, ''), status, body });
        }
      }
    });

    // Usar local-login=1 para saltarse el SSO redirect y probar el formulario directo
    await page.goto(APP_TEST + '/login?local-login=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Rellenar credenciales
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passInput.fill(TEST_PASSWORD);

    const submitBtn = page.locator('button[type="submit"], button:has-text("Iniciar sesión"), button:has-text("Iniciar")').first();
    await submitBtn.click();

    // Esperar resultado (puede ser éxito o error)
    await page.waitForTimeout(6000);

    const finalUrl = page.url();
    const sessionExpiredVisible = await page.locator('text=Sesión no autorizada').isVisible().catch(() => false);
    const successRedirect = !finalUrl.includes('/login');
    const errorVisible = await page.locator('text=error, text=Error, text=incorrecto').first().isVisible().catch(() => false);
    const sessionCookie = await page.evaluate(() => document.cookie.includes('sessionBodas'));

    console.log('DL05 Login directo app-test:', JSON.stringify({
      finalUrl,
      sessionExpiredVisible,
      successRedirect,
      errorVisible,
      sessionCookie,
      consoleErrors: consoleErrors.slice(0, 5),
      authResponses: authResponses.slice(0, 5),
    }));

    if (sessionExpiredVisible) {
      console.log('🐛 DL05 BUG: Login directo en app-test da "Sesión no autorizada"');
      console.log('   → Probable causa: signInWithCustomToken falla porque app-test no está en Firebase authorized domains');
      console.log('   → Fix: añadir app-test.bodasdehoy.com en Firebase Console → Authentication → Authorized domains');
    } else if (successRedirect) {
      console.log('✅ DL05: Login directo en app-test funcionó correctamente');
    }

    const hasSignInError = consoleErrors.some(e => e.includes('signInWithCustomToken'));
    console.log('DL05 signInWithCustomToken error en consola:', hasSignInError);
  });

});

// =============================================================================
// BLOQUE 3: Flujo SSO completo — chat-test → app-test (requiere credenciales)
// =============================================================================
test.describe('Flujo SSO completo — sin double login', () => {

  test.skip(!TEST_PASSWORD, 'Requiere TEST_PASSWORD env var');

  test('DL06 — flujo completo SSO chat-test→app-test sin double login', async ({ page }) => {
    await page.context().clearCookies();

    const loginAttempts: string[] = [];
    const ssoEvents: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Verificator]') || text.includes('[Auth]') || text.includes('SSO')) {
        ssoEvents.push(text);
      }
    });

    // Paso 1: ir a app-test/login (con sessionStorage limpio)
    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });

    loginAttempts.push('1. app-test/login cargado');

    // Paso 2: esperar SSO redirect a chat-test
    let wentToChat = false;
    try {
      await page.waitForURL(/chat-test\.bodasdehoy\.com\/login/, { timeout: 8000 });
      wentToChat = true;
      loginAttempts.push('2. SSO redirect a chat-test/login ✓');
    } catch {
      loginAttempts.push('2. SSO redirect NO ocurrió ✗ — probable sso_redirect_pending stuck');
    }

    if (!wentToChat) {
      console.log('DL06 FAIL: SSO redirect no ocurrió desde app-test/login');
      console.log('DL06 steps:', loginAttempts);
      return;
    }

    // Paso 3: login en chat-test
    const chatUrl = page.url();
    loginAttempts.push(`3. En chat-test: ${chatUrl}`);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.waitFor({ timeout: 8000 });
    await emailInput.fill(TEST_EMAIL);
    await passInput.fill(TEST_PASSWORD);

    const submitBtn = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("sesión")').first();
    await submitBtn.click();
    loginAttempts.push('4. Credenciales enviadas en chat-test');

    // Paso 4: esperar redirect de vuelta a app-test
    try {
      await page.waitForURL(/app-test\.bodasdehoy\.com/, { timeout: 15000 });
      loginAttempts.push('5. Redirect de vuelta a app-test ✓');
    } catch {
      loginAttempts.push('5. NO hubo redirect a app-test ✗');
    }

    const urlAfterLogin = page.url();
    loginAttempts.push(`6. URL tras login: ${urlAfterLogin}`);

    // Paso 5: esperar que AuthContext procese el SSO token
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    loginAttempts.push(`7. URL final tras espera: ${finalUrl}`);

    // Diagnóstico del estado
    const isAtLogin = finalUrl.includes('/login');
    const sessionExpiredVisible = await page.locator('text=Sesión no autorizada').isVisible().catch(() => false);
    const isAtChatLogin = finalUrl.includes('chat-test.bodasdehoy.com/login');
    const sessionCookie = await page.evaluate(() => document.cookie.includes('sessionBodas'));
    const idToken = await page.evaluate(() => document.cookie.includes('idTokenV0.1.0'));
    const ssoFlagFinal = await page.evaluate(() => sessionStorage.getItem('sso_redirect_pending'));

    console.log('DL06 Flujo SSO completo:', JSON.stringify({
      steps: loginAttempts,
      finalUrl,
      isAtLogin,
      sessionExpiredVisible,
      isAtChatLogin,
      sessionCookie,
      idToken,
      ssoFlagFinal,
      ssoEvents: ssoEvents.slice(0, 10),
    }));

    if (isAtChatLogin) {
      console.log('🐛 DL06 DOUBLE LOGIN CONFIRMADO: Después de login en chat-test, redirige OTRA VEZ a chat-test/login');
      console.log('   → El usuario tiene que loguearse dos veces');
    } else if (sessionExpiredVisible) {
      console.log('🐛 DL06 BUG: Aparece "Sesión no autorizada" en app-test después del login correcto en chat-test');
      console.log('   → sso_redirect_pending stuck:', ssoFlagFinal);
    } else if (!isAtLogin && sessionCookie) {
      console.log('✅ DL06: Flujo SSO completo sin double login');
    }

    // El usuario NO debe acabar en chat-test/login de nuevo (double login)
    expect(isAtChatLogin).toBe(false);
    // El usuario NO debe ver "Sesión no autorizada" después de login correcto
    expect(sessionExpiredVisible).toBe(false);
  });

  test('DL07 — idTokenV0.1.0 es procesado correctamente por /api/proxy-bodas/graphql', async ({ page }) => {
    // Este test verifica si la ruta proxy en app-test existe y funciona
    // Primero obtenemos un idToken real vía login en chat-test

    await page.context().clearCookies();

    // Login en chat-test para obtener idTokenV0.1.0
    await page.goto(CHAT_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    await emailInput.waitFor({ timeout: 8000 });
    await emailInput.fill(TEST_EMAIL);
    await passInput.fill(TEST_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("Iniciar")').first().click();

    // Esperar login completado
    await page.waitForURL(/chat-test\.bodasdehoy\.com\/(?!login)/, { timeout: 15000 }).catch(() => {});

    // Capturar el idToken cookie
    const cookies = await page.context().cookies();
    const idToken = cookies.find(c => c.name === 'idTokenV0.1.0');

    console.log('DL07 idTokenV0.1.0 tras login chat-test:', idToken ? `presente (${idToken.value.length} chars)` : 'AUSENTE');

    if (!idToken) {
      console.log('⚠️  DL07: idTokenV0.1.0 no encontrado tras login en chat-test — imposible continuar');
      return;
    }

    // Ahora ir a app-test y hacer la llamada proxy manualmente
    await page.goto(APP_TEST + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Llamar directamente al proxy
    const proxyResult = await page.evaluate(async (token: string) => {
      try {
        const resp = await fetch('/api/proxy-bodas/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Development': 'bodasdehoy',
          },
          body: JSON.stringify({
            query: `mutation Auth($idToken: String!) { auth(idToken: $idToken) { sessionCookie } }`,
            variables: { idToken: token },
          }),
        });
        const status = resp.status;
        let body: any = null;
        try { body = await resp.json(); } catch {}
        return { status, body, ok: resp.ok };
      } catch (e: any) {
        return { error: e.message };
      }
    }, idToken.value);

    console.log('DL07 /api/proxy-bodas/graphql result:', JSON.stringify(proxyResult));

    if ((proxyResult as any).error || (proxyResult as any).status >= 400) {
      console.log('🐛 DL07 BUG: /api/proxy-bodas/graphql FALLA en app-test');
      console.log('   → Esta es la causa raíz del double login');
      console.log('   → La SSO cross-domain exchange (idTokenV0.1.0 → sessionBodas) no funciona en test env');
    } else if ((proxyResult as any).body?.data?.auth?.sessionCookie) {
      console.log('✅ DL07: /api/proxy-bodas/graphql funciona — devuelve sessionCookie');
    } else {
      console.log('⚠️  DL07 SOSPECHOSO: proxy responde pero sin sessionCookie:', JSON.stringify(proxyResult));
    }
  });

});

// =============================================================================
// BLOQUE 4: Verificación de la solución propuesta
// =============================================================================
test.describe('Verificación del fix propuesto', () => {

  test('DL08 — después del fix: sso_redirect_pending se limpia cuando SSO falla', async ({ page }) => {
    // Este test verifica si el fix fue aplicado:
    // Fix: en AuthContext.tsx catch block (línea ~794), limpiar sso_redirect_pending
    // También en el catch block de signInWithCustomToken fallback (línea ~738)

    await page.context().clearCookies();
    await page.goto(APP_TEST + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Simular estado post-SSO-fallo:
    // - sso_redirect_pending=1 (estaba esperando)
    // - idTokenV0.1.0 inválido (simula token de chat-test que falla en proxy)
    await page.evaluate(() => {
      sessionStorage.setItem('sso_redirect_pending', '1');
    });
    await page.context().addCookies([{
      name: 'idTokenV0.1.0',
      value: 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.invalid',
      domain: '.bodasdehoy.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    }]);

    // Navegar a la app para que AuthContext ejecute verificator
    await page.goto(APP_TEST + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(6000); // Esperar más que el timeout de 4s del verificator

    const ssoFlagAfter = await getSsoFlag(page);
    const idTokenPresent = await page.evaluate(() => document.cookie.includes('idTokenV0.1.0'));

    console.log('DL08 Fix check:', JSON.stringify({
      ssoFlagAfter,
      idTokenPresent,
      fixApplied: ssoFlagAfter === null,
      note: 'Si fixApplied=false, el bug persiste — añadir clearSsoFlag en catch de AuthContext.tsx'
    }));

    if (ssoFlagAfter === null) {
      console.log('✅ DL08: Fix confirmado — sso_redirect_pending limpiado tras fallo SSO');
    } else {
      console.log('🐛 DL08: Fix NO aplicado — sso_redirect_pending=', ssoFlagAfter, 'después de fallo SSO');
      console.log('   → Aplicar fix en AuthContext.tsx:');
      console.log('   → catch (ssoErr) { ...; sessionStorage.removeItem("sso_redirect_pending"); }');
    }

    // Verificar que ahora si vamos a /login, el SSO redirect puede ocurrir
    await page.evaluate(() => {
      // Limpiar cookie inválida
      document.cookie = 'idTokenV0.1.0=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.bodasdehoy.com; path=/';
    });

    await page.goto(APP_TEST + '/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const canNowRedirect = page.url().includes('chat-test.bodasdehoy.com');
    console.log('DL08 can now redirect to chat-test:', canNowRedirect);

    if (ssoFlagAfter === null && canNowRedirect) {
      console.log('✅ DL08: Fix completo — después del fallo, el usuario puede re-autenticarse via SSO');
    } else if (ssoFlagAfter === '1') {
      console.log('🐛 DL08: Sin fix — usuario atascado, no puede llegar a chat-test/login');
    }
  });

});
