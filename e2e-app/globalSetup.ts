import https from 'https';
import http from 'http';

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

function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; if (body.length > 4000) { req.destroy(); resolve(body); } });
      res.on('end', () => resolve(body));
      res.on('error', () => resolve(body || ''));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
    setTimeout(() => { req.destroy(); resolve(''); }, timeoutMs);
  });
}

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
  const headed = process.env.E2E_HEADED === '1' || process.env.E2E_HEADED === 'true';
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const delayMs = parseInt(process.env.E2E_DELAY_BEFORE || '0', 10) || (headed && !isCI ? 5000 : 0);
  if (delayMs > 0) {
    console.log(`\n[E2E] Esperando ${delayMs / 1000}s para que puedas ver el navegador...\n`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const baseURL = process.env.BASE_URL || '';
  const isRemote = baseURL.includes('.bodasdehoy.com') || baseURL.startsWith('https://');
  if (!isRemote) return; // local dev: no health check (el webServer ya lo gestiona)

  console.log(`\n[E2E] Health check → ${baseURL}`);
  const html = await fetchText(baseURL, 12_000);

  if (!html || html.length < 100) {
    // Servidor no responde → los tests individuales skipearán solos, no abortamos
    console.log('[E2E] ⚠️  Servidor no accesible o sin contenido — los tests saltarán individualmente\n');
    return;
  }

  if (ERROR_PATTERNS.test(html)) {
    // Servidor UP pero mostrando error → abortar TODA la suite
    const snippet = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    throw new Error(
      `[E2E] ❌ El servidor muestra un error visible. Abortando toda la suite.\n` +
      `URL: ${baseURL}\n` +
      `Texto: ${snippet}\n\n` +
      `Corrige el error en el servidor y vuelve a ejecutar los tests.`,
    );
  }

  console.log('[E2E] ✅ Servidor accesible y sin errores visibles');

  // ── Backend probe: verificar que el proxy al chat backend responde ──
  const chatURL = process.env.CHAT_URL || '';
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

  console.log('');
}
