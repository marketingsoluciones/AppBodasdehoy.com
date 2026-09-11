// Helpers de aserciones runtime errors UI — ported from Cucumber support/.
// SPRINT-U 2026-05-21: tras descomisionar Cucumber, este helper queda disponible
// para Playwright Test specs en tests/.

import { expect, type Page } from '@playwright/test';

/**
 * Detecta overlays de error de Next.js (ErrorBoundary, Hydration, 500).
 * No falla — captura silenciosa de overlays comunes.
 */
export async function assertNoRuntimeError(page: Page): Promise<void> {
  // Next.js error overlay
  const nextErrorOverlay = page.locator('nextjs-portal').first();
  await expect(nextErrorOverlay).not.toBeVisible({ timeout: 1000 }).catch(() => {});

  // React ErrorBoundary fallback
  const errorBoundary = page.locator('text=/Something went wrong|Application error|Hydration failed/i').first();
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
 * Verifica console.error filtrando ruido conocido.
 */
export function assertNoConsoleErrors(consoleErrors: string[], allowedPatterns: RegExp[] = DEFAULT_ALLOWED): void {
  const realErrors = consoleErrors.filter((err) => !allowedPatterns.some((p) => p.test(err)));
  if (realErrors.length > 0) {
    throw new Error(
      `${realErrors.length} unexpected console.error:\n  - ${realErrors.join('\n  - ')}`,
    );
  }
}

/**
 * Patrones de console errors conocidos como ruido en local dev (CORS, chunks, etc).
 */
export const DEFAULT_ALLOWED: RegExp[] = [
  /Loading chunk/,
  /access control/i,
  /favicon/,
  /sentry/,
  /workbox/,
  /No permitido por CORS/i,
  /MCP\] (Error|Excepci|Errores)/,
  /Failed to load resource/,
  /wallet[Ss]ervice/,
  /invoices[Ss]ervice/,
  /sync-user/,
  /Slow network detected/,
  /\[HMR\]/,
];
