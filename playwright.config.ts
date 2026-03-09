import { defineConfig, devices } from '@playwright/test';

/**
 * E2E — Playwright (y uso con MCP).
 * Objetivo: versión original más básica = menos pesada, mejor carga.
 * - Por defecto: Chromium de Playwright (no system Chrome para reducir peso).
 * - Modo ligero: E2E_FAST=1 (sin trace/video por defecto, timeouts cortos).
 * - Navegador visible: headless solo en CI; E2E_HEADED=1 para ver el navegador.
 * - Contra dominio real: BASE_URL=https://app-test.bodasdehoy.com (VPN).
 */
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const healthURL = `${baseURL}/api/health`;
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(baseURL) || baseURL.includes('127.0.0.1') || baseURL.includes('localhost');

const fast = process.env.E2E_FAST === '1';
const slowMo = process.env.E2E_SLOW === '1';
const useSystemChrome = process.env.USE_SYSTEM_CHROME === '1'; // legacy; por defecto usamos PLAYWRIGHT_BROWSER=webkit
const browserName = process.env.PLAYWRIGHT_BROWSER || 'chromium';
/** Solo headless en CI. Si no está CI, el navegador se abre siempre (o con E2E_HEADED=1 forzamos visible). */
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
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : fast ? 0 : 0,
  workers: 1,
  reporter: 'list',
  timeout: fast ? 30_000 : 60_000,
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
    actionTimeout: fast ? 10_000 : 20_000,
    navigationTimeout: fast ? 25_000 : 60_000,
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
