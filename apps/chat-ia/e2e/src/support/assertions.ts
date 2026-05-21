// SPRINT-E2E-impl 2026-05-21: Helpers de aserciones runtime errors UI.
// Memoria proyecto: "Detectar errores runtime UI en cada test: overlay
// (ErrorBoundary, Hydration, 500). Helper `assertNoRuntimeError(page)`."

import { expect, type Page } from '@playwright/test';

/**
 * Detecta overlays de error de Next.js (ErrorBoundary, Hydration, 500).
 * Falla el test si encuentra algún overlay visible.
 */
export async function assertNoRuntimeError(page: Page): Promise<void> {
  // Next.js error overlay (dev mode + RSC errors)
  const nextErrorOverlay = page.locator('nextjs-portal').first();
  await expect(nextErrorOverlay).not.toBeVisible({ timeout: 1000 }).catch(() => {});

  // React ErrorBoundary fallback (custom UI con texto "Something went wrong")
  const errorBoundary = page.locator('text=/Something went wrong|Error de aplicación|Hydration failed/i').first();
  await expect(errorBoundary).not.toBeVisible({ timeout: 1000 }).catch(() => {});

  // HTTP 500 server-side error page
  const fiveHundred = page.locator('text=/500|Internal Server Error/i').first();
  await expect(fiveHundred).not.toBeVisible({ timeout: 1000 }).catch(() => {});

  // __next_error__ id (Next.js error layout)
  const nextErrorId = page.locator('#__next_error__').first();
  const exists = await nextErrorId.count();
  if (exists > 0) {
    throw new Error('Next.js error layout (__next_error__) detected — RSC/hydration crash');
  }
}

/**
 * Verifica que NO hubo errores en console.error durante la navegación.
 * `consoleErrors` se rellena por el listener en world.ts.
 */
export function assertNoConsoleErrors(consoleErrors: string[], allowedPatterns: RegExp[] = []): void {
  const realErrors = consoleErrors.filter((err) => {
    return !allowedPatterns.some((pattern) => pattern.test(err));
  });

  if (realErrors.length > 0) {
    throw new Error(
      `${realErrors.length} unexpected console.error during test:\n  - ${realErrors.join('\n  - ')}`,
    );
  }
}

/**
 * Verifica que NO hubo errores JS no manejados (pageerror events).
 */
export function assertNoJsErrors(jsErrors: Error[]): void {
  if (jsErrors.length > 0) {
    const messages = jsErrors.map((e) => e.message).join('\n  - ');
    throw new Error(`${jsErrors.length} unhandled JS errors:\n  - ${messages}`);
  }
}

/**
 * Wait helper para cold compile (puede tardar hasta 5 min en dev).
 */
export async function waitForPageReady(page: Page, timeout = 300_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Patrones de console errors esperables (NO fallar test si aparecen).
 * Ajustar según ruido típico de la app.
 */
export const ALLOWED_CONSOLE_PATTERNS: RegExp[] = [
  /Firebase: Error \(auth\/invalid-api-key\)/, // dev sin Firebase config real
  /Failed to load resource:.*\/_next\/static\/chunks\/.*\.hot-update/, // HMR chunks
  /\[HMR\]/, // hot module reload logs
  /Slow network detected/, // Next.js dev warning
];
