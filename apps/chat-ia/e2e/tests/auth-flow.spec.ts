// SPRINT-M 2026-05-21: auth-flow.feature (Cucumber) → Playwright Test puro.
// Tests login real Firebase + logout + sin runtime errors.
//
// IMPORTANTE: este spec hace LOGIN REAL (no usa storageState) — por eso configura
// `use.storageState: undefined` para anular el storageState del project.
// Pre-requisito: chat-ia-prod :3210 corriendo.

import { expect, test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Parse env del worktree .env.local (mismo helper que otros smokes)
const envPath = resolve(__dirname, '../../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PWD = process.env.TEST_USER_PASSWORD!;

// Override project storageState — login real desde cero
test.use({ storageState: { cookies: [], origins: [] } });

test.describe.serial('@auth Authentication flow', () => {
  test('@auth-firebase-email login email/password redirige a /chat con tokens', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PWD);
    await page.waitForLoadState('networkidle');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Firebase async sync (playbook pattern)

    // Redirect a /chat
    await expect(page).toHaveURL(/\/chat/);

    // Cookies + localStorage tokens
    const state = await page.context().storageState();
    const idToken = state.cookies.find((c) => c.name === 'idTokenV0.1.0');
    expect(idToken).toBeTruthy();

    const origin = state.origins[0];
    const mcpJwt = origin?.localStorage.find((kv) => kv.name === 'mcp_jwt_token');
    expect(mcpJwt).toBeTruthy();
    expect(mcpJwt!.value.length).toBeGreaterThan(50);

    const fbAuth = origin?.localStorage.find((kv) => kv.name.includes('firebase:authUser'));
    expect(fbAuth).toBeTruthy();
  });

  test('@auth-runtime-errors login sin runtime errors ni overlay', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PWD);
    await page.waitForLoadState('networkidle');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // No Next.js error overlay
    const overlay = await page.locator('text=/Application error|Unhandled Runtime Error/i').count();
    expect(overlay).toBe(0);

    // Ignorar errores ruido conocidos en local dev:
    //  - Chunks (webkit dev hot reload)
    //  - access control (RSC cross-origin checks normales)
    //  - CORS api-mcp (backend prod no whitelist localhost — esperado)
    //  - Failed 500 sincronización wallet/invoice (mismo CORS issue)
    //  - sync-user-identity (trpc redirect)
    const noiseRegex = /Loading chunk|access control|favicon|sentry|workbox|No permitido por CORS|MCP\] (Error|Excepci|Errores)|Failed to load resource|wallet[Ss]ervice|invoices[Ss]ervice|sync-user/i;
    const significant = consoleErrors.filter((e) => !noiseRegex.test(e));
    expect(significant).toEqual([]);
  });
});
