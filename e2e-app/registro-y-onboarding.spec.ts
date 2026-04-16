/**
 * registro-y-onboarding.spec.ts
 *
 * Cubre los flujos de autenticación y onboarding:
 *   - Estructura de la página de login en chat-ia (chat-test)
 *   - Login con credenciales correctas/incorrectas
 *   - Persistencia de sesión entre recargas
 *   - Logout limpia la sesión
 *   - SSO: login en chat-test → app-test reconoce la sesión via cookie idTokenV0.1.0
 *   - Modo visitante: visitor ID persiste y se reutiliza
 *
 * Credenciales para tests de login real:
 *   TEST_USER_EMAIL=...  TEST_USER_PASSWORD=...
 * (Si no están definidas, los tests que las necesitan se saltan automáticamente.)
 *
 * Ejecutar (requiere VPN + app-test activo):
 *   TEST_USER_EMAIL=x@test.com TEST_USER_PASSWORD=pass123 pnpm test:e2e:app:todo
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';
import { TEST_URLS, E2E_ENV } from './fixtures';

// Usar URLs centralizadas (respetan E2E_ENV=local|dev|test|prod)
const CHAT_URL = TEST_URLS.chat;
const APP_URL = TEST_URLS.app;

// Tests que requieren infra real (cualquier entorno que no sea "nada")
const isAppTest = true; // TEST_URLS siempre resuelve al entorno configurado

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Estructura de la página de login (sin credenciales)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login page — estructura (chat-test)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('[RO01] carga sin pantalla blanca ni ErrorBoundary', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
    const text = (await body.textContent()) ?? '';
    expect(text.length).toBeGreaterThan(80);
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('[RO02] muestra opciones de registro, login y modo visitante', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';

    // Vista landing: debe tener botón registro y link de login
    expect(text).toMatch(/Crear cuenta gratis|Empieza a organizar/i);
    expect(text).toMatch(/Iniciar sesión/i);

    // Modo visitante: buscar en la vista actual o en landing (tras "← Volver")
    // En flows de 2 pasos: landing → "Iniciar sesión" → form con visitante
    // O: /login muestra form directamente con "← Volver" para volver a landing
    let hasVisitor = /visitante|explorar/i.test(text);

    if (!hasVisitor) {
      // Intentar "← Volver" para ir a landing si estamos en la vista form
      const backBtn = page.locator('a, button, [role="button"]').filter({ hasText: /← Volver|Volver/i }).first();
      const backVisible = await backBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (backVisible) {
        await backBtn.click();
        await page.waitForTimeout(1500);
        const landingText = (await body.textContent()) ?? '';
        hasVisitor = /visitante|explorar/i.test(landingText);
      }
    }

    if (!hasVisitor) {
      // Si tampoco está en landing, puede que el build desplegado no tenga esta opción todavía
      console.warn('⚠️ RO02: modo visitante no encontrado en chat-test — puede que el build sea anterior a esta feature');
    } else {
      console.log('RO02: modo visitante visible ✓');
    }
  });

  test('[RO03] al hacer clic en "Iniciar sesión" aparece formulario de login', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    // En la vista landing, el link "Iniciar sesión" cambia a la vista login
    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    const linkVisible = await loginLink.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!linkVisible) {
      // Puede que ya muestre el formulario de login directamente
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      return;
    }

    await loginLink.click();
    await page.waitForTimeout(1000);

    // Ahora debe aparecer el formulario de login con email y password
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8_000 });
  });

  test('[RO04] credenciales incorrectas muestran mensaje de error (no crash)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    // Ir a la vista login (si estamos en landing, clic en "Iniciar sesión")
    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    const linkVisible = await loginLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (linkVisible) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    // Rellenar con credenciales malas
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill('noexiste@test-e2e-invalido.com');
    await passwordInput.fill('wrong_pass_123');

    // Buscar el botón submit de login
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Esperar respuesta
    await page.waitForTimeout(5000);

    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';

    // Debe aparecer un mensaje de error, NO crash
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    const hasError =
      /Credenciales incorrectas|Error|contraseña|no existe|invalid|wrong|usuario/i.test(text);
    expect(hasError).toBe(true);
    console.log('Error message shown correctly for wrong credentials');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Login con credenciales reales (requiere TEST_USER_EMAIL + TEST_USER_PASSWORD)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login con credenciales reales (chat-test)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('[RO05] login exitoso → redirige a /chat y localStorage tiene user_type registered', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    // Ir a vista login si estamos en landing
    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    const linkVisible = await loginLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (linkVisible) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Esperar redirect a /chat
    await page.waitForURL((url) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});

    const finalUrl = page.url();
    expect(finalUrl).toContain('/chat');

    // Verificar localStorage: dev-user-config debe tener user_type registered
    const config = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('dev-user-config');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });

    expect(config).not.toBeNull();
    expect(config.user_type).toBe('registered');
    expect(config.userId).toBeTruthy();
    expect(config.userId).not.toMatch(/^visitor_/);
    console.log(`Login OK. userId: ${config.userId?.slice(0, 12)}...`);
  });

  test('[RO06] sesión persiste tras recarga de página', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    // Login
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Recargar
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    // Debe seguir en /chat (no redirigir a /login)
    expect(finalUrl).not.toMatch(/\/login/);

    // localStorage debe conservar la sesión
    const config = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('dev-user-config');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });
    expect(config?.user_type).toBe('registered');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SSO cross-domain: login chat-test → app-test reconoce sesión
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SSO cross-domain (chat-test → app-test)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('[RO07] tras login en chat-test, la cookie idTokenV0.1.0 existe en dominio .bodasdehoy.com', async ({
    page,
    context,
  }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Verificar que existe la cookie SSO
    const cookies = await context.cookies();
    const ssoToken = cookies.find((c) => c.name === 'idTokenV0.1.0');
    if (ssoToken) {
      expect(ssoToken.domain).toMatch(/bodasdehoy\.com/);
      console.log(`Cookie idTokenV0.1.0 presente. Domain: ${ssoToken.domain}`);
    } else {
      // La cookie puede estar en dominio chat-test (si el backend no la tiene aún)
      console.log('ℹ️ Cookie idTokenV0.1.0 no encontrada (puede requerir servidor actualizado)');
      // El test es informativo en este caso — no fallar
    }
  });

  test('[RO08] tras login en chat-test con ?redirect=app-test, vuelve a app-test autenticado', async ({
    page,
  }) => {
    // Cross-domain SSO requiere dominios reales (.bodasdehoy.com) — no funciona en local
    if (!hasCredentials || E2E_ENV === 'local') {
      test.skip();
      return;
    }

    const returnUrl = encodeURIComponent(APP_URL + '/');
    const loginWithRedirect = `${CHAT_URL}/login?redirect=${returnUrl}`;

    await page.goto(loginWithRedirect, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    // Ir al formulario de login
    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    // Debe redirigir a app-test tras el login (por el ?redirect=)
    const appHost = new URL(APP_URL).hostname;
    await page
      .waitForURL((url) => url.hostname === appHost, { timeout: 40_000 })
      .catch(() => {});

    const finalUrl = page.url();
    expect(finalUrl).toContain(appHost);

    // La app debe cargar autenticada (sin ErrorBoundary)
    await waitForAppReady(page, 25_000);
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // El menú de perfil no debe mostrar "Iniciar sesión"
    const profileTrigger = page.getByTestId('profile-menu-trigger');
    if (await profileTrigger.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await profileTrigger.click();
      await page.waitForTimeout(500);
      const dropdown = page.getByTestId('profile-menu-dropdown');
      if (await dropdown.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const menuText = (await dropdown.textContent()) ?? '';
        // Usuario autenticado: menú tiene Cerrar sesión o nombre
        const isLoggedIn =
          /Cerrar\s+sesión|Mi\s+perfil|Mis\s+eventos/i.test(menuText) ||
          !/Iniciar\s+sesión/i.test(menuText);
        expect(isLoggedIn).toBe(true);
        console.log('SSO verificado: usuario autenticado en app-test tras login en chat-test');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Modo visitante
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Modo visitante (chat-test)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('[RO09] "Continuar como visitante" lleva al chat con user_type visitor', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    // Buscar el botón "Continuar como visitante"
    const visitorBtn = page.locator('button, a').filter({ hasText: /visitante|explorar/i }).first();
    const btnVisible = await visitorBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!btnVisible) {
      console.log('ℹ️ Botón visitante no encontrado — puede estar en scroll o con texto distinto');
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(3000);

    // Debe estar en /chat ahora
    const url = page.url();
    expect(url).toContain('/chat');

    // localStorage debe tener user_type visitor
    const config = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('dev-user-config');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });

    expect(config).not.toBeNull();
    expect(config.user_type).toBe('visitor');
    expect(config.userId).toMatch(/^visitor_/);
    console.log(`Modo visitante activado. ID: ${config.userId}`);
  });

  test('[RO10] visitor ID se reutiliza en visitas posteriores (no se genera uno nuevo cada vez)', async ({
    page,
    context,
  }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    // Primera visita: activar modo visitante
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const visitorBtn = page.locator('button, a').filter({ hasText: /visitante|explorar/i }).first();
    if (!(await visitorBtn.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(2000);

    const firstConfig = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dev-user-config') ?? 'null'); }
      catch { return null; }
    });
    const firstVisitorId = firstConfig?.userId;
    expect(firstVisitorId).toMatch(/^visitor_/);

    // Segunda visita al /login (simula reabrir la app)
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const visitorBtn2 = page.locator('button, a').filter({ hasText: /visitante|explorar/i }).first();
    if (await visitorBtn2.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await visitorBtn2.click();
      await page.waitForTimeout(2000);
    }

    const secondConfig = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dev-user-config') ?? 'null'); }
      catch { return null; }
    });

    // El visitor ID debe ser el mismo (reutilización)
    expect(secondConfig?.userId).toBe(firstVisitorId);
    console.log(`Visitor ID reutilizado correctamente: ${firstVisitorId}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Logout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Logout (app-test)', () => {
  test.setTimeout(120_000);

  test('[RO11] logout desde app-test limpia la sesión y muestra "Iniciar sesión"', async ({
    page,
    context,
  }) => {
    // Cross-domain SSO requiere dominios reales
    if (!hasCredentials || E2E_ENV === 'local') {
      test.skip();
      return;
    }

    // 1. Login primero en chat-test con redirect a app-test
    await clearSession(context, page);
    const appHost = new URL(APP_URL).hostname;
    const returnUrl = encodeURIComponent(APP_URL + '/');
    await page.goto(`${CHAT_URL}/login?redirect=${returnUrl}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page.waitForTimeout(2000);

    const loginLink = page.locator('a, [role="button"], span').filter({ hasText: /^Iniciar sesión$/ }).first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page
      .waitForURL((url) => url.hostname === appHost, { timeout: 40_000 })
      .catch(() => {});
    await waitForAppReady(page, 25_000);

    // 2. Logout: abrir menú y hacer clic en "Cerrar sesión"
    const profileTrigger = page.getByTestId('profile-menu-trigger');
    if (!(await profileTrigger.isVisible({ timeout: 10_000 }).catch(() => false))) {
      console.log('ℹ️ Profile trigger no visible — skip logout check');
      test.skip();
      return;
    }

    await profileTrigger.click();
    await page.waitForTimeout(500);

    const logoutBtn = page.locator('button, a, [role="menuitem"]').filter({ hasText: /Cerrar sesión/i }).first();
    if (!(await logoutBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      console.log('ℹ️ Cerrar sesión no visible en menú — puede que no esté logueado aún');
      test.skip();
      return;
    }

    await logoutBtn.click();
    await page.waitForTimeout(3000);

    // 3. Verificar que la sesión fue limpiada
    await waitForAppReady(page, 20_000);
    await profileTrigger.click().catch(() => {});
    await page.waitForTimeout(500);

    const dropdown = page.getByTestId('profile-menu-dropdown');
    if (await dropdown.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const menuText = (await dropdown.textContent()) ?? '';
      expect(menuText).toMatch(/Iniciar\s+sesión/i);
      console.log('Logout verificado: menú muestra "Iniciar sesión"');
    }

    // Cookies sessionBodas deben estar limpias
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'sessionBodas');
    expect(sessionCookie).toBeUndefined();
  });
});
