// SPRINT Q 2026-05-21: smoke token refresh post-wait.
// Validacion ligera: tras 65s de inactividad, las llamadas API siguen exitosas.
// Si el token expirara sin refresh, las llamadas devolverían 401.
//
// NOTA: no verifica directamente "refresh ocurrió", solo "API sigue accesible
// post-expiración natural cercana". Test completo de refresh requeriría
// mock del Date para forzar expiración o instrumentación del flow Firebase.

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STATE_PATH = resolve(__dirname, '.auth/super-admin.json');
const WAIT_MS = Number(process.env.WAIT_MS || 65_000);

async function main() {
  if (!existsSync(STATE_PATH)) {
    console.error(`❌ Missing ${STATE_PATH}`);
    process.exitCode = 1;
    return;
  }

  console.log(`SMOKE TOKEN REFRESH → wait ${WAIT_MS / 1000}s + verify API still OK`);

  // Inspect JWT issued_at + expires_at
  const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  const origin = state.origins[0];
  const expiresAt = origin?.localStorage.find((kv: any) => kv.name === 'mcp_jwt_expires_at');
  if (expiresAt) {
    const expireDate = new Date(expiresAt.value); // ISO string
    const minsToExpiry = (expireDate.getTime() - Date.now()) / 60_000;
    console.log(`[1] mcp_jwt expires ${expireDate.toISOString()} (${minsToExpiry.toFixed(1)} min)`);
  }

  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: STATE_PATH,
  });
  const page = await ctx.newPage();

  try {
    console.log(`[2] navigate /chat`);
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Initial trpc call OK?
    const initial = await page.evaluate(async () => {
      const r = await fetch('/trpc/lambda/config.getGlobalConfig?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%7D', {
        credentials: 'include',
      });
      return { status: r.status, ok: r.ok };
    });
    console.log(`[3] initial trpc call: status=${initial.status} ok=${initial.ok}`);

    console.log(`[4] wait ${WAIT_MS / 1000}s (simulating inactividad)`);
    await page.waitForTimeout(WAIT_MS);

    // Post-wait: trpc call should still work (con refresh transparent O JWT aún válido)
    const after = await page.evaluate(async () => {
      const r = await fetch('/trpc/lambda/config.getGlobalConfig?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%2C%22v%22%3A1%7D%7D%7D', {
        credentials: 'include',
      });
      return { status: r.status, ok: r.ok };
    });
    console.log(`[5] post-wait trpc call: status=${after.status} ok=${after.ok}`);

    // Sessions count debe seguir accesible (consultar via UI)
    const sessionsVisible = await page.locator('[data-testid="session-item"]').count();
    console.log(`[6] sessions still visible: ${sessionsVisible}`);

    console.log(`\n=== RESUMEN ===`);
    console.log(`  initial:  ${initial.ok ? '✓' : '✗'} (status ${initial.status})`);
    console.log(`  post-wait: ${after.ok ? '✓' : '✗'} (status ${after.status})`);
    console.log(`  sessions visible: ${sessionsVisible > 0 ? '✓' : '✗'}`);
    process.exitCode = (initial.ok && after.ok && sessionsVisible > 0) ? 0 : 1;
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
