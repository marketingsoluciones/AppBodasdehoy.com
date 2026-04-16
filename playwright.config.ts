import { defineConfig, devices } from '@playwright/test';
import { TEST_URLS, E2E_ENV } from './e2e-app/fixtures';

/**
 * E2E — Playwright (y uso con MCP).
 *
 * Entornos (controlados por E2E_ENV o BASE_URL):
 *   local  →  http://<LAN-IP>:3210/3220/3240  (auto-detect)
 *   dev    →  https://*-dev.bodasdehoy.com     (Cloudflare reverse proxy)
 *   test   →  https://*-test.bodasdehoy.com    (Vercel)
 *   prod   →  https://*.bodasdehoy.com
 *
 * Navegador: WebKit (Safari). Chromium vetado en este entorno.
 */
const baseURL = TEST_URLS.app;
const isLocal = E2E_ENV === 'local';
// Usar appEventos (baseURL) como health check — devuelve 200 de forma fiable
// chat-ia /api/health devuelve 500 → Playwright no lo considera "running" con reuseExistingServer
const healthURL = `${TEST_URLS.app}`;

const fast = process.env.E2E_FAST === '1';
const slowMo = process.env.E2E_SLOW === '1';
const useSystemChrome = process.env.USE_SYSTEM_CHROME === '1';
const browserName = process.env.PLAYWRIGHT_BROWSER || 'webkit';
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const headed = process.env.E2E_HEADED === '1' || process.env.E2E_HEADED === 'true';
const headless = isCI && !headed;

const project = browserName === 'firefox'
  ? { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  : browserName === 'webkit'
    ? { name: 'webkit', use: { ...devices['Desktop Safari'] } }
    : { name: 'chromium', use: { ...devices['Desktop Chrome'] } };

export default defineConfig({
  testDir: './e2e-app',
  globalSetup: './e2e-app/globalSetup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  bail: process.env.E2E_BAIL === '1' ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: fast ? 30_000 : 240_000,
  use: {
    baseURL,
    trace: fast ? 'off' : 'on-first-retry',
    screenshot: fast ? 'off' : 'only-on-failure',
    video: fast ? 'off' : 'retain-on-failure',
    headless,
    ...((slowMo || useSystemChrome) && {
      launchOptions: {
        ...(slowMo && { slowMo: 200 }),
        ...(useSystemChrome && browserName === 'chromium' && { channel: 'chrome' }),
      },
    }),
    actionTimeout: fast ? 10_000 : 30_000,
    navigationTimeout: fast ? 25_000 : 90_000,
    viewport: fast ? { width: 1280, height: 720 } : undefined,
    ignoreHTTPSErrors: true,
  },
  projects: [project],
  ...(isLocal && {
    webServer: {
      command: 'pnpm dev:web',
      url: healthURL,
      reuseExistingServer: true,
      timeout: fast ? 90_000 : 180_000,
    },
  }),
});
