import { defineConfig, devices } from '@playwright/test';

/**
 * E2E — Memories web (puerto 3080)
 * Uso: pnpm test:e2e:memories
 */
const baseURL = process.env.BASE_URL || 'http://localhost:3080';
const fast = process.env.E2E_FAST === '1';
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const headed = process.env.E2E_HEADED === '1';
const headless = isCI && !headed;

export default defineConfig({
  testDir: './e2e-memories',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: fast ? 20_000 : 45_000,
  use: {
    baseURL,
    headless,
    actionTimeout: fast ? 8_000 : 15_000,
    navigationTimeout: fast ? 20_000 : 40_000,
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm --filter @bodasdehoy/memories-web dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
