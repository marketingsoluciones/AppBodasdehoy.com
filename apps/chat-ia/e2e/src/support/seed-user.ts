// SPRINT-E2E-impl 2026-05-21: Seed user helper via UI signup.
// Memoria proyecto: "E2E SOLO via UI — NUNCA pedir seed a api-mcp/api-ia.
// Test crea su data como usuario real."

import type { Page } from '@playwright/test';

export interface SeedUser {
  email: string;
  password: string;
  development: string;
}

/**
 * Crea un usuario test via UI signup (Firebase).
 * Si el usuario ya existe (Firebase devuelve auth/email-already-in-use),
 * intenta login en su lugar.
 *
 * @example
 * const user = await seedUserViaUI(page, { email: 'e2e-test@bodasdehoy.com' });
 */
export async function seedUserViaUI(
  page: Page,
  opts: { email: string; password?: string; development?: string },
): Promise<SeedUser> {
  const email = opts.email;
  const password = opts.password || process.env.TEST_PASSWORD || `E2E-${Date.now()}!`;
  const development = opts.development || 'bodasdehoy';

  // 1. Visit signup page
  await page.goto('/signup');

  // 2. Fill form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // 3. Submit
  await page.click('button[type="submit"]');

  // 4. Wait for redirect or error
  try {
    await page.waitForURL(/\/chat/, { timeout: 15_000 });
    // Signup success
    return { email, password, development };
  } catch {
    // Signup may have failed (user exists). Try login.
    return loginUserViaUI(page, { email, password, development });
  }
}

/**
 * Login existing user via UI (Firebase email/password).
 */
export async function loginUserViaUI(
  page: Page,
  opts: { email: string; password: string; development?: string },
): Promise<SeedUser> {
  const development = opts.development || 'bodasdehoy';

  await page.goto('/login');
  await page.fill('input[type="email"]', opts.email);
  await page.fill('input[type="password"]', opts.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/chat/, { timeout: 30_000 });

  return { email: opts.email, password: opts.password, development };
}

/**
 * Limpia el usuario test (signout + clear local state).
 * NO elimina el usuario en Firebase — eso requeriría Firebase Admin SDK (server-side).
 */
export async function cleanupUserSession(page: Page): Promise<void> {
  // Trigger logout button if visible
  const logoutButton = page.getByRole('button', { name: /sign out|logout|cerrar sesión/i }).first();
  if (await logoutButton.count()) {
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => {});
  }

  // Clear all localStorage + sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Constants para tests E2E.
 */
export const E2E_TEST_USER = {
  email: 'e2e-test@bodasdehoy.com',
  password: process.env.TEST_PASSWORD || 'E2E-Test-2026!',
};
