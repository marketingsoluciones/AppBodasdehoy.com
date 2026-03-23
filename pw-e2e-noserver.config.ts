/**
 * Playwright config para E2E SIN webServer (servidor ya corriendo).
 * Usa la resolución centralizada de URLs de fixtures.ts.
 *
 * Uso:
 *   E2E_ENV=local npx playwright test --config pw-e2e-noserver.config.ts
 *   E2E_ENV=dev   npx playwright test --config pw-e2e-noserver.config.ts
 */
import { defineConfig, devices } from '@playwright/test';
import { TEST_URLS } from './e2e-app/fixtures';

export default defineConfig({
  testDir: './e2e-app',
  fullyParallel: false,
  retries: 0,
  bail: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  use: {
    baseURL: TEST_URLS.app,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }],
});
