import { test, expect } from '@playwright/test';

import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;

function isAuthOrSessionError(text: string): boolean {
  return /sesión no válida|session_expired|token-expired|login_required|Error Capturado por ErrorBoundary|Not enough segments/i.test(
    text,
  );
}

async function captureAuthSnapshot(page: any, label: string) {
  const snap = await page
    .evaluate((lbl: string) => {
      const safeGet = (k: string) => {
        try {
          return localStorage.getItem(k);
        } catch {
          return null;
        }
      };

      const debug = (window as any).debugAuthState;
      const debugResult = typeof debug === 'function' ? debug() : null;

      return {
        label: lbl,
        url: location.href,
        api2JwtExpiresAt: safeGet('api2_jwt_expires_at'),
        hasApi2Jwt: Boolean(safeGet('api2_jwt_token')),
        hasJwt: Boolean(safeGet('jwt_token')),
        devUserConfigPreview: (safeGet('dev-user-config') || '').slice(0, 180),
        debugResult,
      };
    }, label)
    .catch(() => null);

  if (snap) console.log('[E2E] Auth snapshot:', JSON.stringify(snap));
}

test.describe('chat-ia: sesión estable en /messages', () => {
  test.setTimeout(120_000);

  test('login → /messages no debe caer a los pocos segundos', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const authFailures: Array<{ url: string; status: number }> = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    page.on('pageerror', (err) => {
      pageErrors.push(String(err));
    });

    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();

      const isApi = url.includes('/webapi/') || url.includes('/api/');
      const isAuthish =
        url.includes('/webapi/chat/') ||
        url.includes('/api/auth/') ||
        url.includes('/api/user/') ||
        url.includes('/api/events/') ||
        url.includes('/api/messages/');

      if (isApi && isAuthish && (status === 401 || status === 403)) {
        authFailures.push({ url, status });
      }
    });

    await page.goto(`${TEST_URLS.chat}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    if (page.url().includes('/chat')) {
      await page.goto(`${TEST_URLS.chat}/messages`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } else {
      await page.locator('input[type="email"], input[placeholder*="email" i]').first().click();
      await page.keyboard.press('Meta+A');
      await page.keyboard.type(EMAIL, { delay: 15 });

      await page.locator('input[type="password"], input[placeholder*="Contraseña" i]').first().click();
      await page.keyboard.press('Meta+A');
      await page.keyboard.type(PASSWORD, { delay: 15 });

      await page
        .locator('button:has-text("Iniciar sesión"), button[type="submit"]')
        .first()
        .click();

      await page
        .waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45_000 })
        .catch(() => {});

      await captureAuthSnapshot(page, 'after-login');

      await page.goto(`${TEST_URLS.chat}/messages`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    }

    await captureAuthSnapshot(page, 'after-open-messages');

    await page.waitForTimeout(5_000);

    const firstConversationLink = page
      .locator('a[href*="/messages/"]')
      .filter({ hasNotText: 'Mensajes' })
      .first();

    if (await firstConversationLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstConversationLink.click();
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    }

    await page.waitForTimeout(25_000);

    await captureAuthSnapshot(page, 'before-assert');

    if (authFailures.length > 0) {
      console.log('[E2E] Auth failures:', JSON.stringify(authFailures.slice(0, 10)));
    }

    expect(page.url(), 'No debe redirigir a /login tras unos segundos').not.toContain('/login');

    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';

    expect(isAuthOrSessionError(bodyText), 'La UI no debe mostrar error de sesión/auth').toBe(false);
    expect(pageErrors, 'No debe haber page errors (JS runtime)').toEqual([]);

    const relevantConsoleErrors = consoleErrors.filter((t) => isAuthOrSessionError(t));
    expect(relevantConsoleErrors, 'No debe haber console errors de sesión/auth').toEqual([]);
    expect(authFailures, 'No debe haber 401/403 en endpoints authish al estar logueado').toEqual([]);
  });
});
