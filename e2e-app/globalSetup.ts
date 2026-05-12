import https from 'https';
import http from 'http';
import { resetBreaker } from './circuit-breaker';
import { getMemoriesUrl, TEST_URLS, E2E_ENV } from './fixtures';

/**
 * Global setup — corre ANTES de cualquier test.
 *
 * 1. Pausa inicial para que puedas ver el navegador (solo en headed).
 * 2. Health check rápido: si el servidor devuelve un error HTML visible
 *    (ErrorBoundary, "Error al cargar", 500, etc.) → aborta toda la suite
 *    inmediatamente sin desperdiciar tiempo corriendo 84 tests que fallarán.
 *
 * Diferencia entre 'unreachable' y 'error':
 *  - unreachable: timeout / sin contenido → los tests individuales skipearán solos
 *  - error: servidor up pero mostrando error → abortamos TODO (throw)
 */

const ERROR_PATTERNS =
  /Error Capturado por ErrorBoundary|Error al cargar|Internal Server Error|Something went wrong|Failed to load|No se pudo cargar|Ha ocurrido un error/i;

function fetchStatus(url: string, timeoutMs = 10_000): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; if (body.length > 2000) { req.destroy(); resolve({ status: res.statusCode ?? 0, body }); } });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      res.on('error', () => resolve({ status: 0, body: '' }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
    setTimeout(() => { req.destroy(); resolve({ status: 0, body: '' }); }, timeoutMs);
  });
}

export default async function globalSetup() {
  // Resetear circuit breaker al inicio de cada run
  resetBreaker();

  const headed = process.env.E2E_HEADED === '1' || process.env.E2E_HEADED === 'true';
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const delayMs = parseInt(process.env.E2E_DELAY_BEFORE || '0', 10) || (headed && !isCI ? 5000 : 0);
  if (delayMs > 0) {
    console.log(`\n[E2E] Esperando ${delayMs / 1000}s para que puedas ver el navegador...\n`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const isRemote = E2E_ENV !== 'local';
  if (!isRemote) return;

  // Skip health check (útil cuando chat-ia está compilando webpack pero queremos tests schema-only)
  if (process.env.E2E_SKIP_HEALTH === '1') {
    console.log('[E2E] ⚠️  Health check SKIPPED (E2E_SKIP_HEALTH=1)');
    return;
  }

  const checks: Array<{ label: string; url: string; timeoutMs: number }> = [
    { label: 'app', url: `${TEST_URLS.app}/`, timeoutMs: 5_000 },
    { label: 'chat', url: `${TEST_URLS.chat}/`, timeoutMs: 5_000 },
  ];
  if (E2E_ENV === 'dev') {
    checks.push(
      { label: 'tunnel_app_localhost_3220', url: 'http://localhost:3220/', timeoutMs: 3_000 },
      { label: 'tunnel_chat_localhost_3210', url: 'http://localhost:3210/', timeoutMs: 3_000 },
    );
  }

  console.log(`\n[E2E] Health check (${E2E_ENV})`);
  const results = await Promise.all(checks.map(async (c) => ({ ...c, ...(await fetchStatus(c.url, c.timeoutMs)) })));
  const isAllowed = (label: string, status: number) => {
    if (label === 'chat' || label === 'tunnel_chat_localhost_3210') return status === 200 || status === 307;
    return status === 200;
  };
  const failed = results.filter((r) => !isAllowed(r.label, r.status));
  if (failed.length > 0) {
    const lines = results.map((r) => `- ${r.label}: ${r.url} -> HTTP ${r.status || 0}`).join('\n');
    throw new Error(
      `[E2E] ❌ BLOQUEO_INFRA: health-check no pasa.\n` +
      `${lines}\n`,
    );
  }

  const appBody = results.find((r) => r.label === 'app')?.body || '';
  if (ERROR_PATTERNS.test(appBody)) {
    const snippet = appBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    throw new Error(`[E2E] ❌ El servidor muestra un error visible.\nURL: ${TEST_URLS.app}\nTexto: ${snippet}\n`);
  }

  console.log('[E2E] ✅ Health-check OK');

  // ── Backend probe: verificar que el proxy al chat backend responde ──
  const chatURL = TEST_URLS.chat;
  if (chatURL) {
    console.log(`[E2E] Backend probe → ${chatURL}/webapi/chat/auto`);
    const probe = await fetchStatus(`${chatURL}/webapi/chat/auto`, 10_000);

    if (probe.status === 0) {
      console.log('[E2E] ⚠️  Chat backend no responde (timeout/unreachable) — tests de IA probablemente fallarán');
    } else if (probe.status >= 500) {
      console.log(`[E2E] ⚠️  Chat backend devuelve ${probe.status} — api-ia posiblemente caído`);
      console.log(`[E2E]    Body: ${probe.body.slice(0, 200)}`);
    } else {
      // 401, 405, 400, etc. = backend UP (solo rechaza porque no hay auth/method)
      console.log(`[E2E] ✅ Chat backend responde (HTTP ${probe.status}) — proxy OK`);
    }
  }

  const memoriesURL = getMemoriesUrl();
  if (memoriesURL) {
    console.log(`[E2E] Probe memories → ${memoriesURL}`);
    const probe = await fetchStatus(memoriesURL, 10_000);
    if (probe.status === 0) {
      console.warn(`[E2E] ⚠️  memories-web no accesible (puerto 3240 no levantado) — tests específicos de memories pueden skipear`);
    } else if (probe.status >= 500) {
      console.warn(`[E2E] ⚠️  memories-web devuelve ${probe.status} — tests específicos de memories pueden skipear`);
    } else {
      console.log(`[E2E] ✅ memories-web responde (HTTP ${probe.status})`);
    }
  }

  console.log('');
}
