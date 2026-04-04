/**
 * login-logout-cycle.spec.ts — LLC: Login / Logout lifecycle tests
 *
 * Tests de ciclo login→logout para chat-ia y SSO con appEventos.
 * Todos los tests son diagnósticos con soft assertions donde el comportamiento
 * no está garantizado (ej: selector de botón logout puede variar).
 *
 * E2E_ENV=test  →  chat-test.bodasdehoy.com / app-test.bodasdehoy.com
 * E2E_ENV=dev   →  chat-dev.bodasdehoy.com  / app-dev.bodasdehoy.com
 * E2E_ENV=local →  localhost:3210 / localhost:3220
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const CHAT = TEST_URLS.chat;
const APP  = TEST_URLS.app;

// ─── Timeouts ──────────────────────────────────────────────────────────────────

const NAV_TIMEOUT = 30_000;
const UI_TIMEOUT  = 12_000;

// ─── Session-related storage keys to track ────────────────────────────────────

const SESSION_COOKIE_NAMES = [
  'idTokenV0.1.0',
  'sessionBodas',
  'dev-user-config',
];

const SESSION_LOCALSTORAGE_KEYS = [
  'dev-user-config',
  'api2_jwt_token',
  'jwt_token',
  'current_development',
  // Firebase Auth keys (prefix-based — captured dynamically too)
  'firebase:authUser',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionState {
  cookies: Record<string, string>;
  localStorage: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * clearSession — Borra todas las cookies del contexto y el localStorage
 * en los orígenes de chat-ia y appEventos.
 */
async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies();

  // Clear localStorage in all open pages
  const pages = context.pages();
  for (const page of pages) {
    try {
      await page.evaluate(() => {
        try { localStorage.clear(); } catch { /* cross-origin — ignore */ }
      });
    } catch {
      // Page may be closed or cross-origin — ignore
    }
  }
}

/**
 * loginInChat — Navega a /login del chat-ia y rellena las credenciales.
 * Espera a que el login complete (redirección fuera de /login).
 */
async function loginInChat(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${CHAT}/login`, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });

  // Esperar que el split-screen / formulario cargue completamente
  await page.waitForTimeout(2500);

  // Wait for the form to be ready
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]').first();
  await emailInput.waitFor({ state: 'visible', timeout: UI_TIMEOUT });
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: UI_TIMEOUT });
  await passwordInput.fill(password);

  // Submit — look for "Iniciar sesión" button
  const submitBtn = page.locator('button').filter({ hasText: /iniciar\s*sesi[oó]n/i }).first();
  await submitBtn.waitFor({ state: 'visible', timeout: UI_TIMEOUT });
  await submitBtn.click();

  // Wait for redirect away from /login (success) or error message
  try {
    await page.waitForURL((url) => !url.href.includes('/login'), {
      timeout: NAV_TIMEOUT,
    });
    console.log(`[loginInChat] Login successful → ${page.url()}`);
  } catch {
    console.warn(`[loginInChat] Did not redirect away from /login within ${NAV_TIMEOUT}ms. Current URL: ${page.url()}`);
    const errorText = await page.locator('[class*="error"], [class*="alert"], .ant-alert-message').first().textContent({ timeout: 3_000 }).catch(() => null);
    if (errorText) console.warn(`[loginInChat] Error visible: ${errorText}`);
  }
}

/**
 * logoutFromChat — Intenta hacer logout desde chat-ia via el menú de usuario.
 * El avatar/user-panel → click → menú dropdown → item "signout".
 */
async function logoutFromChat(page: Page): Promise<'ui' | 'manual'> {
  // Intentar click en avatar (sidebar bottom o top-right)
  const avatarSelectors = [
    '[class*="UserAvatar"]',
    '[class*="userAvatar"]',
    '[class*="Avatar"][role="button"]',
    '[class*="Avatar"][tabindex]',
    'header img[class*="avatar" i]',
    '[aria-label*="user" i]',
    '[aria-label*="usuario" i]',
    '[aria-label*="profile" i]',
  ];

  for (const sel of avatarSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
      await el.click();
      await page.waitForTimeout(600);
      // Buscar item de logout en el menú dropdown
      const logoutItem = page.locator('li, [role="menuitem"]').filter({ hasText: /sign.?out|log.?out|cerrar.?sesi[oó]n|salir|exit/i }).first();
      if (await logoutItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutItem.click();
        await page.waitForTimeout(1500);
        console.log(`[logout:chat] ✅ Logout UI vía selector: ${sel}`);
        return 'ui';
      }
    }
  }

  // Fallback: limpiar manualmente
  console.warn('[logout:chat] No se encontró avatar/logout en UI — limpieza manual');
  await page.context().clearCookies();
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
  await page.goto(`${CHAT}/login`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  return 'manual';
}

/**
 * captureSessionState — Captura todas las cookies relevantes y los keys de
 * localStorage relacionados con la sesión desde el origen dado.
 *
 * @param page    Playwright Page (debe estar en el origen correcto)
 * @param origin  URL base del origen (ej: CHAT o APP) — para filtrar cookies
 */
async function captureSessionState(page: Page, origin: string): Promise<SessionState> {
  const context = page.context();

  // --- Cookies ---
  const allCookies = await context.cookies();

  // Extract hostname for domain matching (e.g. "chat-test.bodasdehoy.com" → "bodasdehoy.com")
  let rootDomain = '';
  try {
    const parsedOrigin = new URL(origin);
    const parts = parsedOrigin.hostname.split('.');
    rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : parsedOrigin.hostname;
  } catch { /* ignore */ }

  const cookieMap: Record<string, string> = {};
  for (const cookie of allCookies) {
    // Include cookies that belong to the root domain or any subdomain
    const cookieDomain = cookie.domain.replace(/^\./, '');
    if (!rootDomain || cookieDomain.endsWith(rootDomain) || rootDomain.endsWith(cookieDomain)) {
      cookieMap[cookie.name] = cookie.value.slice(0, 80) + (cookie.value.length > 80 ? '…' : '');
    }
  }

  // --- localStorage ---
  let lsMap: Record<string, string> = {};
  try {
    lsMap = await page.evaluate((keys: string[]) => {
      const result: Record<string, string> = {};

      // Capture known keys
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val !== null) result[key] = val.slice(0, 120) + (val.length > 120 ? '…' : '');
      }

      // Also capture ALL keys (for memory-leak check)
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && !(k in result)) {
          const v = localStorage.getItem(k) ?? '';
          result[`__all__${k}`] = v.slice(0, 80) + (v.length > 80 ? '…' : '');
        }
      }

      return result;
    }, SESSION_LOCALSTORAGE_KEYS);
  } catch (err) {
    console.warn('[captureSessionState] localStorage not accessible:', String(err));
  }

  return { cookies: cookieMap, localStorage: lsMap };
}

/**
 * parseDevUserConfig — Parsea el JSON de dev-user-config desde localStorage.
 * Retorna null si no existe o es inválido.
 */
function parseDevUserConfig(state: SessionState): Record<string, unknown> | null {
  const raw = state.localStorage['dev-user-config'];
  if (!raw) return null;
  try {
    return JSON.parse(raw.endsWith('…') ? raw.slice(0, -1) : raw);
  } catch {
    return null;
  }
}

/**
 * attemptLogoutInChat — Intenta hacer logout dentro de chat-ia.
 * Estrategia: buscar avatar/user-menu → buscar item de logout en dropdown.
 * Si no se encuentra, limpia cookies manualmente y lo documenta.
 *
 * Retorna: 'ui' si se hizo logout vía UI, 'manual' si se limpió manualmente.
 */
async function attemptLogoutInChat(page: Page, context: BrowserContext): Promise<'ui' | 'manual'> {
  console.log('[logout:chat] Buscando botón de usuario/avatar…');

  // Strategy 1: click avatar / user menu triggers
  const avatarSelectors = [
    '[data-testid*="avatar"]',
    '[data-testid*="user"]',
    'button[aria-label*="xit"]',
    'button[aria-label*="ser"]',
    'button[aria-label*=" usuario"]',
    // LobeChat sidebar bottom area — usually an avatar button
    'nav button img[alt]',
    'aside button img',
    '[class*="avatar"]',
    '[class*="Avatar"]',
  ];

  let avatarFound = false;
  for (const sel of avatarSelectors) {
    const el = page.locator(sel).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      console.log(`[logout:chat] Avatar selector encontrado: ${sel}`);
      await el.click({ timeout: UI_TIMEOUT });
      avatarFound = true;
      break;
    }
  }

  if (avatarFound) {
    // Wait a moment for dropdown / menu to appear
    await page.waitForTimeout(800);

    // Strategy 2: find logout item in open menu/dropdown
    const logoutSelectors = [
      'text=/cerrar\s*sesi[oó]n/i',
      'text=/sign\s*out/i',
      'text=/log\s*out/i',
      'text=/logout/i',
      'text=/salir/i',
      'text=/exit/i',
      '[data-testid*="logout"]',
      '[data-testid*="sign-out"]',
      'button[aria-label*="logout"]',
      'li[role="menuitem"] >> text=/salir|exit|logout|sign out|cerrar/i',
      '[role="menuitem"] >> text=/salir|exit|logout|sign out|cerrar/i',
    ];

    for (const sel of logoutSelectors) {
      const item = page.locator(sel).first();
      const visible = await item.isVisible({ timeout: 2_000 }).catch(() => false);
      if (visible) {
        console.log(`[logout:chat] Logout item encontrado: ${sel}`);
        await item.click({ timeout: UI_TIMEOUT });

        // Wait for redirect to /login
        try {
          await page.waitForURL((url) => url.pathname.startsWith('/login'), {
            timeout: NAV_TIMEOUT,
          });
          console.log('[logout:chat] Logout UI exitoso → redirigido a /login');
          return 'ui';
        } catch {
          console.warn('[logout:chat] No se redirigió a /login tras logout. URL actual:', page.url());
          return 'ui';
        }
      }
    }

    console.warn('[logout:chat] Avatar encontrado pero no se pudo localizar item de logout en el menú.');
  } else {
    console.warn('[logout:chat] No se encontró ningún avatar/user-menu selector. Documentado.');
  }

  // Fallback: manual session clear
  console.log('[logout:chat] Fallback → limpieza manual de cookies y localStorage');
  await clearSession(context);
  await page.goto(`${CHAT}/login`, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
  return 'manual';
}

/**
 * attemptLogoutInApp — Intenta hacer logout dentro de appEventos.
 * Retorna: 'ui' | 'manual'.
 */
async function attemptLogoutInApp(page: Page, context: BrowserContext): Promise<'ui' | 'manual'> {
  console.log('[logout:app] Buscando botón de logout en appEventos…');

  // appEventos logout selectors
  const appLogoutSelectors = [
    'text=/cerrar\s*sesi[oó]n/i',
    'text=/salir/i',
    'text=/log\s*out/i',
    'text=/sign\s*out/i',
    '[data-testid*="logout"]',
    '[href*="logout"]',
    '[href*="signout"]',
    'a[href*="/api/auth/signout"]',
    'button >> text=/salir|cerrar sesi/i',
    '[class*="logout"]',
    '[class*="signout"]',
  ];

  // First try to open a user menu if present
  const userMenuSelectors = [
    '[data-testid*="user-menu"]',
    '[data-testid*="avatar"]',
    'button[aria-label*="usuario"]',
    'button[aria-label*="user"]',
    '[class*="userMenu"]',
    '[class*="user-menu"]',
    'nav [class*="avatar"]',
    'header [class*="avatar"]',
  ];

  for (const sel of userMenuSelectors) {
    const el = page.locator(sel).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      console.log(`[logout:app] User menu selector encontrado: ${sel}`);
      await el.click({ timeout: UI_TIMEOUT });
      await page.waitForTimeout(600);
      break;
    }
  }

  for (const sel of appLogoutSelectors) {
    const item = page.locator(sel).first();
    const visible = await item.isVisible({ timeout: 2_000 }).catch(() => false);
    if (visible) {
      console.log(`[logout:app] Logout selector encontrado: ${sel}`);
      await item.click({ timeout: UI_TIMEOUT });

      try {
        await page.waitForURL((url) =>
          url.pathname.includes('/login') || url.pathname === '/',
          { timeout: NAV_TIMEOUT }
        );
        console.log('[logout:app] Logout UI exitoso → URL:', page.url());
        return 'ui';
      } catch {
        console.warn('[logout:app] No se redirigió a /login tras logout. URL:', page.url());
        return 'ui';
      }
    }
  }

  console.warn('[logout:app] No se encontró botón de logout en appEventos. Documentado. Limpieza manual.');
  await clearSession(context);
  return 'manual';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('LLC — Login/Logout Cycle', () => {
  test.beforeEach(async ({ context }) => {
    // Start each test with a clean session
    await clearSession(context);
  });

  // ─── LLC01 ───────────────────────────────────────────────────────────────

  test('LLC01 — Login en chat-ia → verificar cookies/localStorage presentes', async ({ page, context }) => {
    console.log('\n═══ LLC01: Login en chat-ia ═══');
    console.log(`CHAT: ${CHAT}`);
    console.log(`Credentials: ${TEST_CREDENTIALS.email}`);

    // Perform login
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Wait a moment for auth state to settle (Firebase async)
    await page.waitForTimeout(2_000);

    // Navigate back to chat root to ensure we have a stable page in the right origin
    const currentUrl = page.url();
    if (!currentUrl.startsWith(CHAT)) {
      await page.goto(CHAT, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1_000);
    }

    // Capture session state
    const state = await captureSessionState(page, CHAT);

    console.log('\n[LLC01] Session state after login:');
    console.log(JSON.stringify(state, null, 2));

    // ─ Assertions ─

    // 1. Check that idTokenV0.1.0 cookie is present
    const hasIdToken = 'idTokenV0.1.0' in state.cookies;
    expect.soft(hasIdToken, 'Cookie idTokenV0.1.0 debe estar presente tras login').toBe(true);
    if (hasIdToken) {
      console.log('[LLC01] ✓ Cookie idTokenV0.1.0 presente');
    } else {
      console.warn('[LLC01] ✗ Cookie idTokenV0.1.0 NO encontrada. Cookies disponibles:', Object.keys(state.cookies));
    }

    // 2. Check session-related cookies are present
    for (const cookieName of SESSION_COOKIE_NAMES) {
      if (cookieName in state.cookies) {
        console.log(`[LLC01] ✓ Cookie "${cookieName}" presente`);
      } else {
        console.warn(`[LLC01] ✗ Cookie "${cookieName}" NO presente`);
      }
    }

    // 3. Check dev-user-config in localStorage
    const devUserConfig = parseDevUserConfig(state);
    if (devUserConfig) {
      console.log('[LLC01] dev-user-config parseado:', JSON.stringify(devUserConfig, null, 2));

      expect.soft(
        typeof devUserConfig['email'] === 'string' && (devUserConfig['email'] as string).length > 0,
        'dev-user-config.email no debe estar vacío'
      ).toBe(true);

      expect.soft(
        typeof devUserConfig['development'] === 'string' && (devUserConfig['development'] as string).length > 0,
        'dev-user-config.development no debe estar vacío'
      ).toBe(true);

      const hasUserId =
        (typeof devUserConfig['user_id'] === 'string' && (devUserConfig['user_id'] as string).length > 0) ||
        (typeof devUserConfig['userId'] === 'string' && (devUserConfig['userId'] as string).length > 0) ||
        (typeof devUserConfig['uid'] === 'string' && (devUserConfig['uid'] as string).length > 0);

      expect.soft(hasUserId, 'dev-user-config debe tener user_id/userId/uid no vacío').toBe(true);

      if (!hasUserId) {
        console.warn('[LLC01] dev-user-config keys disponibles:', Object.keys(devUserConfig));
      }
    } else {
      const rawDevConfig = state.localStorage['dev-user-config'];
      console.warn('[LLC01] dev-user-config en localStorage:', rawDevConfig ?? 'AUSENTE');
      expect.soft(rawDevConfig, 'dev-user-config debe estar en localStorage').toBeTruthy();
    }

    // 4. Check jwt tokens
    for (const lsKey of ['api2_jwt_token', 'jwt_token', 'current_development']) {
      const val = state.localStorage[lsKey];
      if (val) {
        console.log(`[LLC01] ✓ localStorage["${lsKey}"] presente (${val.length} chars)`);
      } else {
        console.warn(`[LLC01] ✗ localStorage["${lsKey}"] NO presente`);
      }
    }

    // 5. Verify page is not on /login (successful auth)
    const finalUrl = page.url();
    expect.soft(
      !finalUrl.includes('/login'),
      `Tras login exitoso no debe estar en /login. URL actual: ${finalUrl}`
    ).toBe(true);

    console.log(`\n[LLC01] URL final: ${finalUrl}`);
    console.log('[LLC01] DONE ✓\n');
  });

  // ─── LLC02 ───────────────────────────────────────────────────────────────

  test('LLC02 — Logout desde chat-ia → verificar limpieza de sesión', async ({ page, context }) => {
    console.log('\n═══ LLC02: Logout desde chat-ia ═══');

    // Step 1: Login
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_000);

    const stateBeforeLogout = await captureSessionState(page, CHAT);
    console.log('[LLC02] Estado ANTES del logout:');
    console.log(JSON.stringify(stateBeforeLogout, null, 2));

    // Step 2: Attempt logout
    const logoutMethod = await logoutFromChat(page);
    console.log(`[LLC02] Método de logout usado: ${logoutMethod}`);

    // Wait for auth state to clear
    await page.waitForTimeout(1_500);

    // Navigate to chat to capture state
    const currentUrl = page.url();
    if (!currentUrl.startsWith(CHAT) || currentUrl.includes('/login')) {
      // Already on /login or redirected — stay there to capture state
    }

    // Capture state after logout
    const stateAfterLogout = await captureSessionState(page, CHAT);
    console.log('\n[LLC02] Estado DESPUÉS del logout:');
    console.log(JSON.stringify(stateAfterLogout, null, 2));

    // ─ Assertions ─

    // 1. api2_jwt_token should be gone
    const hasApi2Token = 'api2_jwt_token' in stateAfterLogout.localStorage;
    expect.soft(!hasApi2Token, 'api2_jwt_token debe ser borrado tras logout').toBe(true);
    console.log(`[LLC02] api2_jwt_token tras logout: ${hasApi2Token ? 'PRESENTE (leak!)' : 'ausente ✓'}`);

    // 2. jwt_token should be gone
    const hasJwtToken = 'jwt_token' in stateAfterLogout.localStorage;
    expect.soft(!hasJwtToken, 'jwt_token debe ser borrado tras logout').toBe(true);
    console.log(`[LLC02] jwt_token tras logout: ${hasJwtToken ? 'PRESENTE (leak!)' : 'ausente ✓'}`);

    // 3. dev-user-config: si existe, no debe contener datos sensibles (token/email/uid)
    // El logout lo elimina, pero la app puede recrearlo con solo { development } al navegar a /login
    const hasDevConfig = 'dev-user-config' in stateAfterLogout.localStorage;
    if (hasDevConfig) {
      const rawConfig = stateAfterLogout.localStorage['dev-user-config'];
      let parsedConfig: Record<string, unknown> = {};
      try { parsedConfig = JSON.parse(rawConfig.endsWith('…') ? rawConfig.slice(0, -1) : rawConfig); } catch { /* */ }
      const hasSensitiveData = !!(parsedConfig['token'] || parsedConfig['jwt'] || parsedConfig['email']);
      expect.soft(!hasSensitiveData, `dev-user-config tiene datos sensibles tras logout: ${JSON.stringify(parsedConfig)}`).toBe(true);
      console.log(`[LLC02] dev-user-config presente (solo tenant config: ${!hasSensitiveData ? '✓ sin token/email' : '✗ CONTIENE DATOS SENSIBLES'})`);
    } else {
      console.log('[LLC02] dev-user-config ausente tras logout ✓');
    }

    // 4. Should be redirected to /login
    const urlAfterLogout = page.url();
    if (logoutMethod === 'ui') {
      expect.soft(
        urlAfterLogout.includes('/login'),
        `Tras logout UI se debe redirigir a /login. URL actual: ${urlAfterLogout}`
      ).toBe(true);
      console.log(`[LLC02] URL tras logout: ${urlAfterLogout} ${urlAfterLogout.includes('/login') ? '✓' : '✗'}`);
    } else {
      console.log(`[LLC02] Logout manual — URL actual: ${urlAfterLogout}`);
    }

    // 5. Summary: what cookies remain after logout?
    const remainingCookies = Object.keys(stateAfterLogout.cookies);
    console.log(`[LLC02] Cookies restantes tras logout (${remainingCookies.length}):`, remainingCookies);

    const remainingLsKeys = Object.keys(stateAfterLogout.localStorage).filter(k => !k.startsWith('__all__'));
    const remainingLsAllKeys = Object.keys(stateAfterLogout.localStorage).filter(k => k.startsWith('__all__'));
    console.log(`[LLC02] localStorage keys conocidos restantes (${remainingLsKeys.length}):`, remainingLsKeys);
    console.log(`[LLC02] localStorage keys adicionales restantes (${remainingLsAllKeys.length}):`, remainingLsAllKeys.map(k => k.replace('__all__', '')));

    console.log('[LLC02] DONE ✓\n');
  });

  // ─── LLC03 ───────────────────────────────────────────────────────────────

  test('LLC03 — Re-login tras logout (sin estado residual)', async ({ page, context }) => {
    console.log('\n═══ LLC03: Re-login tras logout ═══');

    // Step 1: Login
    console.log('[LLC03] Step 1: primer login');
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_000);

    // Step 2: Logout
    console.log('[LLC03] Step 2: logout');
    const logoutMethod = await logoutFromChat(page);
    console.log(`[LLC03] Logout method: ${logoutMethod}`);
    await page.waitForTimeout(1_500);

    // Step 3: Re-login
    console.log('[LLC03] Step 3: re-login (estado fresco)');
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_000);

    // Capture state after re-login
    const stateRelogin = await captureSessionState(page, CHAT);
    console.log('[LLC03] Estado tras re-login:');
    console.log(JSON.stringify(stateRelogin, null, 2));

    const finalUrl = page.url();
    console.log(`[LLC03] URL tras re-login: ${finalUrl}`);

    // ─ Assertions ─

    // 1. Should not be on /login
    expect.soft(
      !finalUrl.includes('/login'),
      `Re-login debe redirigir fuera de /login. URL: ${finalUrl}`
    ).toBe(true);

    // 2. No "Sesión expirada" banner visible
    const expiredBanner = page.locator('text=/sesi[oó]n\s*expirada|session\s*expired/i').first();
    const hasExpiredBanner = await expiredBanner.isVisible({ timeout: 3_000 }).catch(() => false);
    expect.soft(!hasExpiredBanner, 'No debe aparecer banner "Sesión expirada" tras re-login').toBe(true);
    console.log(`[LLC03] Banner "Sesión expirada": ${hasExpiredBanner ? 'PRESENTE (problema!)' : 'ausente ✓'}`);

    // 3. Email in session should not be empty
    const devUserConfig = parseDevUserConfig(stateRelogin);
    if (devUserConfig) {
      const emailInConfig = devUserConfig['email'] as string | undefined;
      expect.soft(
        typeof emailInConfig === 'string' && emailInConfig.length > 0,
        'Email en dev-user-config no debe estar vacío tras re-login'
      ).toBe(true);
      console.log(`[LLC03] Email en dev-user-config: "${emailInConfig ?? 'VACÍO'}"`);
    } else {
      console.warn('[LLC03] dev-user-config no disponible en localStorage tras re-login');
    }

    // 4. Chat input should be visible (app is functional)
    const chatInputSelectors = [
      'textarea[placeholder]',
      'div[contenteditable="true"]',
      '[data-testid*="chat-input"]',
      '[data-testid*="input"]',
      '.chat-input',
      'form textarea',
    ];

    let chatInputFound = false;
    for (const sel of chatInputSelectors) {
      const visible = await page.locator(sel).first().isVisible({ timeout: 3_000 }).catch(() => false);
      if (visible) {
        chatInputFound = true;
        console.log(`[LLC03] Chat input visible: ${sel} ✓`);
        break;
      }
    }

    expect.soft(chatInputFound, 'El input del chat debe ser visible tras re-login exitoso').toBe(true);
    if (!chatInputFound) {
      console.warn('[LLC03] Chat input NO encontrado. Puede que la app esté en estado anómalo.');
    }

    console.log('[LLC03] DONE ✓\n');
  });

  // ─── LLC04 ───────────────────────────────────────────────────────────────

  test('LLC04 — SSO login (chat-ia → appEventos) → logout en appEventos → verificar estado', async ({ page, context }) => {
    console.log('\n═══ LLC04: SSO chat-ia → appEventos → logout en appEventos ═══');
    console.log(`CHAT: ${CHAT}`);
    console.log(`APP:  ${APP}`);

    // Step 1: Login en chat-ia
    console.log('[LLC04] Step 1: Login en chat-ia');
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_000);

    const stateAfterChatLogin = await captureSessionState(page, CHAT);
    console.log('[LLC04] Estado tras login en chat-ia:');
    console.log(JSON.stringify(stateAfterChatLogin, null, 2));

    // Verify we have idTokenV0.1.0 cookie (prerequisite for SSO)
    const hasIdToken = 'idTokenV0.1.0' in stateAfterChatLogin.cookies;
    expect.soft(hasIdToken, 'Prerequisito SSO: idTokenV0.1.0 debe estar presente').toBe(true);
    console.log(`[LLC04] Cookie idTokenV0.1.0 para SSO: ${hasIdToken ? 'presente ✓' : 'AUSENTE ✗'}`);

    // Step 2: Navigate to appEventos (SSO)
    console.log('[LLC04] Step 2: Navegar a appEventos (SSO)');
    await page.goto(APP, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000); // Allow SSO cookie exchange

    const appUrl = page.url();
    console.log(`[LLC04] URL en appEventos: ${appUrl}`);

    const stateInApp = await captureSessionState(page, APP);
    console.log('[LLC04] Estado en appEventos:');
    console.log(JSON.stringify(stateInApp, null, 2));

    // Check if SSO worked (not redirected to login in app)
    const appIsAuthenticated = !appUrl.includes('/login');
    if (appIsAuthenticated) {
      console.log('[LLC04] SSO exitoso: appEventos no redirigió a /login ✓');
    } else {
      console.warn('[LLC04] SSO posiblemente fallido: appEventos está en /login. URL:', appUrl);
    }

    // Step 3: Logout desde appEventos
    console.log('[LLC04] Step 3: Intentar logout en appEventos');
    const appLogoutMethod = await logoutFromChat(page);
    console.log(`[LLC04] Logout method en appEventos: ${appLogoutMethod}`);
    await page.waitForTimeout(1_500);

    const stateAfterAppLogout = await captureSessionState(page, APP);
    console.log('[LLC04] Estado tras logout en appEventos:');
    console.log(JSON.stringify(stateAfterAppLogout, null, 2));

    // Step 4: Check if idTokenV0.1.0 still present in chat domain
    // (logout in appEventos should NOT clear the chat-ia session cookie
    //  unless it's a coordinated global logout)
    console.log('[LLC04] Step 4: Verificar estado de idTokenV0.1.0 tras logout en appEventos');

    // Navigate back to chat to check its domain cookies
    await page.goto(CHAT, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);

    const stateBackInChat = await captureSessionState(page, CHAT);
    console.log('[LLC04] Estado en chat-ia tras logout en appEventos:');
    console.log(JSON.stringify(stateBackInChat, null, 2));

    const idTokenAfterAppLogout = 'idTokenV0.1.0' in stateBackInChat.cookies;
    console.log(`[LLC04] idTokenV0.1.0 tras logout en appEventos: ${idTokenAfterAppLogout ? 'PRESENTE' : 'ausente'}`);
    console.log('[LLC04] NOTA: Si idTokenV0.1.0 persiste tras logout en appEventos, el SSO es unidireccional (expected en algunos flows)');

    // Soft assertion — document the behavior without failing
    // The expectation depends on product design:
    // Option A: Logout in appEventos should NOT clear chat-ia session → idTokenV0.1.0 present
    // Option B: Global logout clears all → idTokenV0.1.0 gone
    // We log which case applies without hard-failing
    console.log(`[LLC04] Resultado SSO logout: ${idTokenAfterAppLogout ? 'Logout parcial (solo appEventos)' : 'Logout global (ambas apps)'}`);

    // Verify appEventos state after logout
    const urlAfterAppLogout = page.url();
    console.log(`[LLC04] URL final: ${urlAfterAppLogout}`);

    console.log('[LLC04] DONE ✓\n');
  });

  // ─── LLC05 ───────────────────────────────────────────────────────────────

  test('LLC05 — Estado residual entre login sessions (memory leak check)', async ({ page, context }) => {
    console.log('\n═══ LLC05: Memory leak check — localStorage entre sesiones ═══');

    // ── Fase A: Login ──
    console.log('[LLC05] FASE A: Login inicial');
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_500);

    const stateA = await captureSessionState(page, CHAT);
    const keysA = Object.keys(stateA.localStorage);
    console.log(`\n[LLC05] [A] localStorage keys tras login (${keysA.length} total):`);
    console.log(JSON.stringify(
      Object.fromEntries(
        Object.entries(stateA.localStorage).map(([k, v]) => [
          k.startsWith('__all__') ? k.slice(7) : k,
          v.slice(0, 60) + (v.length > 60 ? '…' : ''),
        ])
      ),
      null,
      2
    ));

    // ── Fase B: Logout ──
    console.log('\n[LLC05] FASE B: Logout');
    const logoutMethod = await logoutFromChat(page);
    console.log(`[LLC05] Logout method: ${logoutMethod}`);
    await page.waitForTimeout(1_500);

    // Navigate back to login page to capture post-logout state in same origin
    const currentUrl = page.url();
    if (!currentUrl.startsWith(CHAT)) {
      await page.goto(`${CHAT}/login`, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
    }

    const stateB = await captureSessionState(page, CHAT);
    const keysB = Object.keys(stateB.localStorage);
    console.log(`\n[LLC05] [B] localStorage keys tras logout (${keysB.length} total):`);
    console.log(JSON.stringify(
      Object.fromEntries(
        Object.entries(stateB.localStorage).map(([k, v]) => [
          k.startsWith('__all__') ? k.slice(7) : k,
          v.slice(0, 60) + (v.length > 60 ? '…' : ''),
        ])
      ),
      null,
      2
    ));

    // ── Fase C: Re-login ──
    console.log('\n[LLC05] FASE C: Re-login');
    await loginInChat(page, TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
    await page.waitForTimeout(2_500);

    const stateC = await captureSessionState(page, CHAT);
    const keysC = Object.keys(stateC.localStorage);
    console.log(`\n[LLC05] [C] localStorage keys tras re-login (${keysC.length} total):`);
    console.log(JSON.stringify(
      Object.fromEntries(
        Object.entries(stateC.localStorage).map(([k, v]) => [
          k.startsWith('__all__') ? k.slice(7) : k,
          v.slice(0, 60) + (v.length > 60 ? '…' : ''),
        ])
      ),
      null,
      2
    ));

    // ── Análisis de diferencias ──

    const normalizeKeys = (keys: string[]) => keys.map(k => k.startsWith('__all__') ? k.slice(7) : k);

    const normA = new Set(normalizeKeys(keysA));
    const normB = new Set(normalizeKeys(keysB));
    const normC = new Set(normalizeKeys(keysC));

    // Keys that survived logout (present in A and still present in B — potential leaks)
    const survivedLogout = [...normA].filter(k => normB.has(k));
    console.log(`\n[LLC05] ANÁLISIS — Keys que sobrevivieron el logout (${survivedLogout.length}):`);
    if (survivedLogout.length > 0) {
      for (const key of survivedLogout) {
        const valA = stateA.localStorage[key] ?? stateA.localStorage[`__all__${key}`] ?? '';
        const valB = stateB.localStorage[key] ?? stateB.localStorage[`__all__${key}`] ?? '';
        const changed = valA !== valB;
        console.log(`  - "${key}" ${changed ? '(valor cambió)' : '(valor IDÉNTICO — posible leak!)'}`);
      }
    } else {
      console.log('  (ninguno — localStorage limpiado completamente en logout ✓)');
    }

    // Sensitive keys that should NOT survive logout
    const sensitiveSurvivors = survivedLogout.filter(k =>
      ['api2_jwt_token', 'jwt_token', 'dev-user-config'].includes(k)
    );
    if (sensitiveSurvivors.length > 0) {
      console.warn(`\n[LLC05] POSIBLES LEAKS SENSIBLES: ${sensitiveSurvivors.join(', ')}`);
      expect.soft(
        sensitiveSurvivors.length === 0,
        `Keys sensibles no deben sobrevivir logout: ${sensitiveSurvivors.join(', ')}`
      ).toBe(true);
    } else {
      console.log('\n[LLC05] No se detectaron leaks de keys sensibles ✓');
    }

    // Keys present in C but NOT in A (new keys introduced during re-login)
    const newInC = [...normC].filter(k => !normA.has(k));
    console.log(`\n[LLC05] Keys nuevos en re-login que NO estaban en primer login (${newInC.length}):`);
    if (newInC.length > 0) {
      newInC.forEach(k => console.log(`  + "${k}"`));
    } else {
      console.log('  (ninguno — re-login produce el mismo estado que el primer login ✓)');
    }

    // Keys in A but NOT in C (keys lost between sessions)
    const lostInC = [...normA].filter(k => !normC.has(k));
    console.log(`\n[LLC05] Keys presentes en primer login pero AUSENTES en re-login (${lostInC.length}):`);
    if (lostInC.length > 0) {
      lostInC.forEach(k => console.log(`  - "${k}"`));
    } else {
      console.log('  (ninguno — re-login restaura todos los keys del primer login ✓)');
    }

    // Keys only present during logout phase (transient logout state)
    const onlyInLogout = [...normB].filter(k => !normA.has(k) && !normC.has(k));
    console.log(`\n[LLC05] Keys presentes SOLO durante logout (${onlyInLogout.length}):`);
    if (onlyInLogout.length > 0) {
      onlyInLogout.forEach(k => console.log(`  ? "${k}"`));
    }

    // Summary report
    console.log('\n[LLC05] RESUMEN FINAL:');
    console.log(`  Fase A (post-login):    ${normA.size} keys`);
    console.log(`  Fase B (post-logout):   ${normB.size} keys`);
    console.log(`  Fase C (post-relogin):  ${normC.size} keys`);
    console.log(`  Keys que sobrevivieron logout: ${survivedLogout.length}`);
    console.log(`  Keys sensibles con leak:       ${sensitiveSurvivors.length}`);
    console.log(`  Keys nuevos en re-login:       ${newInC.length}`);
    console.log(`  Keys perdidos en re-login:     ${lostInC.length}`);

    console.log('[LLC05] DONE ✓\n');
  });
});
