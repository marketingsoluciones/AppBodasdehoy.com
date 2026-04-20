#!/usr/bin/env node
/**
 * warmup-dev.mjs — Pre-compila las rutas principales de appEventos en dev.
 *
 * Uso: node scripts/warmup-dev.mjs
 */

const BASE = process.env.WARMUP_URL || 'http://127.0.0.1:3220';
const ROUTES = ['/', '/login', '/invitados', '/presupuesto', '/servicios'];
const MAX_WAIT = 30_000;
const RETRY_MS = 2_000;

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT) {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3_000) });
      if (res.ok || res.status === 307 || res.status === 302) return true;
    } catch {}
    await new Promise(r => setTimeout(r, RETRY_MS));
  }
  return false;
}

async function warmRoute(route) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE}${route}`, {
      signal: AbortSignal.timeout(180_000),
      headers: { 'User-Agent': 'warmup-dev/1.0' },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✅ ${route} → ${res.status} (${elapsed}s)`);
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ⚠️ ${route} → ${e.message} (${elapsed}s)`);
  }
}

(async () => {
  console.log(`[warmup] Esperando server en ${BASE}...`);
  const ready = await waitForServer();
  if (!ready) {
    console.log('[warmup] Server no respondió en 30s. Abortando.');
    process.exit(0);
  }

  console.log('[warmup] Server listo. Pre-compilando rutas...');
  for (const route of ROUTES) {
    await warmRoute(route);
  }
  console.log('[warmup] Listo. Todas las rutas pre-compiladas.');
})();
