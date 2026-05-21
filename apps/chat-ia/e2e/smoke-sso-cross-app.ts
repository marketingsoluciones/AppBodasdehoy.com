// SPRINT-J 2026-05-21: SSO real chat-ia → appEventos cross-app.
// Localhost: cookies no propagan entre puertos → transferimos idTokenV0.1.0 manualmente.
// Producción: dominio compartido .bodasdehoy.com → cookie propaga automatic.
// Este smoke valida que la lógica SSO de appEventos acepta el token de chat-ia.
//
// Pre-requisitos:
//   - chat-ia-prod :3210 corriendo
//   - appbodas-dev :3220 corriendo
//   - .auth/super-admin.json existe
//
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-sso-cross-app.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const CHAT_URL = process.env.BASE_URL || 'http://localhost:3210';
const APP_URL = process.env.APP_URL || 'http://localhost:3220';
const STORAGE_DIR = resolve(__dirname, '.auth');
const USER_TAG = process.env.USER_TAG || 'super-admin';

interface Check { step: string; status: 'OK' | 'FAIL'; detail?: string }

async function main() {
  const statePath = resolve(STORAGE_DIR, `${USER_TAG}.json`);
  if (!existsSync(statePath)) {
    console.error(`❌ Missing ${statePath} — run save-storage-states.ts first`);
    process.exitCode = 1;
    return;
  }

  console.log(`SMOKE SSO CROSS-APP → chat-ia(${CHAT_URL}) → appEventos(${APP_URL})`);
  const checks: Check[] = [];

  // Pre-flight appEventos available
  const appAlive = await fetch(APP_URL).then((r) => r.ok).catch(() => false);
  if (!appAlive) {
    console.error(`❌ appEventos :${APP_URL} no responde — skip`);
    process.exitCode = 2;
    return;
  }

  // Leer estado saved chat-ia: cookie + tokens
  const state = JSON.parse(readFileSync(statePath, 'utf-8'));
  const idTokenCookie = state.cookies.find((c: any) => c.name === 'idTokenV0.1.0');
  if (!idTokenCookie) {
    console.error(`❌ idTokenV0.1.0 cookie missing en ${statePath}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[1] idTokenV0.1.0 encontrado: domain=${idTokenCookie.domain} len=${idTokenCookie.value.length}`);

  const browser = await webkit.launch({ headless: true });

  // Context con storageState chat-ia + cookie manualmente añadida para appEventos:3220
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });

  // Transferir cookie idToken al dominio appEventos (localhost:3220)
  // Localhost no comparte cookies entre ports — esto simula el SSO de producción
  await ctx.addCookies([
    {
      name: 'idTokenV0.1.0',
      value: idTokenCookie.value,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
  console.log(`[2] cookie transferida a localhost (compartida 3210/3220 al ser misma domain)`);

  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 100)));

  try {
    console.log(`[3] navigate appEventos /`);
    // domcontentloaded en vez de networkidle — appEventos hace polling continuo a
    // socket.io api3-ia.eventosorganizador.com (NXDOMAIN, memoria proyecto)
    const navResponse = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);
    const status = navResponse?.status() || 0;
    checks.push({ step: 'appEventos / responds', status: status === 200 ? 'OK' : 'FAIL', detail: `${status}` });
    console.log(`    status=${status} url=${page.url()}`);

    // No debería estar en /login si SSO funcionó
    const onLogin = page.url().includes('/login') || page.url().includes('/auth');
    checks.push({
      step: 'NO redirect a /login (SSO valid)',
      status: !onLogin ? 'OK' : 'FAIL',
      detail: `url=${page.url()}`,
    });

    // Indicadores de UI autenticada (appEventos no expone email en localStorage root):
    //  - Avatar visible top-right (signo de session activa)
    //  - "Copilot" button (solo aparece logged in)
    //  - NO botón "Iniciar sesión" / "Login"
    const uiSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const hasLoginPrompt = /iniciar sesi[oó]n|reg[ií]strate|sign in/i.test(text)
        && !/cerrar sesi[oó]n|sign out|logout/i.test(text);
      const hasCopilot = text.includes('copilot');
      const avatars = document.querySelectorAll('img[alt*="avatar" i], [class*="avatar" i], [class*="Avatar"]').length;
      return { hasLoginPrompt, hasCopilot, avatars };
    });
    console.log(`    uiSignals:`, uiSignals);
    checks.push({
      step: 'UI logged-in (no login prompt, copilot or avatar)',
      status: !uiSignals.hasLoginPrompt && (uiSignals.hasCopilot || uiSignals.avatars > 0) ? 'OK' : 'FAIL',
      detail: `loginPrompt=${uiSignals.hasLoginPrompt} copilot=${uiSignals.hasCopilot} avatars=${uiSignals.avatars}`,
    });

    // Screenshot final para inspección
    const screenshotPath = `/tmp/smoke-sso-${USER_TAG}.png`;
    writeFileSync(
      screenshotPath,
      await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')),
    );
    console.log(`[4] screenshot → ${screenshotPath}`);

    console.log(`\n=== RESUMEN ${USER_TAG} ===`);
    console.table(checks);
    const fails = checks.filter((c) => c.status === 'FAIL').length;
    process.exitCode = fails > 0 ? 1 : 0;
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
