// SPRINT-G 2026-05-21: Playwright Test config (alternativa a Cucumber).
// Soporta reuso storageState pre-saved + webkit por defecto.
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx playwright test
// Subset: npx playwright test tests/sessions.spec.ts

import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Plain env parser (evita dep dotenv)
const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 2 : 1,
  // workers=1 evita contention webkit + race conditions backend per-user
  // (3 projects con storageState distintos pero comparten trpc backend)
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    storageState: process.env.STORAGE_STATE,
  },
  projects: [
    {
      name: 'webkit-super-admin',
      use: {
        ...devices['Desktop Safari'],
        storageState: resolve(__dirname, '.auth/super-admin.json'),
      },
    },
    {
      name: 'webkit-collaborator',
      use: {
        ...devices['Desktop Safari'],
        storageState: resolve(__dirname, '.auth/collaborator.json'),
      },
    },
    {
      name: 'webkit-invited',
      use: {
        ...devices['Desktop Safari'],
        storageState: resolve(__dirname, '.auth/invited.json'),
      },
    },
  ],
});
