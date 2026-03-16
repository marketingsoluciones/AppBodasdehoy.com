#!/usr/bin/env node
/**
 * Carga app-test y chat-test, captura errores de consola y red, y los imprime.
 * Usa WebKit (Safari) — el que usa el proyecto para E2E.
 *
 * Cómo ejecutarlo (importante):
 *   pnpm exec node scripts/revisar-errores-navegador.mjs
 * Así se usa el Playwright del proyecto y la misma caché de browsers que los tests E2E.
 *
 * Si ves "Executable doesn't exist" en una ruta con "cursor-sandbox-cache":
 *   El comando se ejecutó en el entorno sandbox de Cursor, que tiene su propia caché (vacía).
 *   Ejecuta el script desde tu terminal del sistema, en la raíz del repo:
 *   pnpm exec node scripts/revisar-errores-navegador.mjs
 *   Si falta WebKit: pnpm run test:e2e:app:install  (o: pnpm exec playwright install webkit)
 *
 * URLs por defecto: app-test y chat-test. Para local:
 *   BASE_URL_APP=http://127.0.0.1:8080 BASE_URL_CHAT=http://127.0.0.1:3210 pnpm exec node scripts/revisar-errores-navegador.mjs
 */
import { webkit } from 'playwright';

const APP_URL = process.env.BASE_URL_APP || 'https://app-test.bodasdehoy.com';
const CHAT_URL = process.env.BASE_URL_CHAT || 'https://chat-test.bodasdehoy.com';

const consoleErrors = [];
const networkFails = [];
const pageErrors = [];

async function capturePage(page, name, url) {
  consoleErrors.length = 0;
  networkFails.length = 0;
  pageErrors.length = 0;

  page.on('response', (r) => {
    const status = r.status();
    if (status >= 400) {
      networkFails.push({ status, url: r.url().replace(/^https?:\/\/[^/]+/, ''), ok: r.ok() });
    }
  });
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || (type === 'warn' && /error|fail|500|Internal Server/i.test(text))) {
      consoleErrors.push({ type, text: text.slice(0, 300) });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  console.log(`\n📍 Cargando ${name}: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log(`   ❌ Error cargando: ${e.message}`);
    return;
  }

  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '').catch(() => '');

  console.log(`   Red (4xx/5xx): ${networkFails.length}`);
  networkFails.slice(0, 15).forEach((e) => console.log(`      [${e.status}] ${e.url}`));
  console.log(`   Consola (error/warn): ${consoleErrors.length}`);
  consoleErrors.slice(0, 10).forEach((e) => console.log(`      [${e.type}] ${e.text}`));
  console.log(`   PageError: ${pageErrors.length}`);
  pageErrors.forEach((m) => console.log(`      ${m}`));
  if (bodyText && /Internal Server Error|Error 500|Error Capturado/i.test(bodyText)) {
    console.log('   ⚠️ Contenido de página contiene posible error:');
    console.log('      ' + bodyText.replace(/\n/g, '\n      ').slice(0, 400));
  }
}

async function main() {
  console.log('🔍 Revisión de errores en navegador (app-test + chat-test)\n');
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await capturePage(page, 'app-test', APP_URL);
  await capturePage(page, 'chat-test (chat)', CHAT_URL + '/bodasdehoy/chat');

  await browser.close();
  console.log('\n✅ Revisión terminada.');
}

main().catch((e) => {
  const msg = e?.message || String(e);
  console.error('Error:', msg);
  if (/Executable doesn't exist/.test(msg) && /cursor-sandbox-cache|playwright\/webkit/.test(msg)) {
    console.error('\n💡 Este fallo suele ocurrir cuando el script se ejecuta en el sandbox de Cursor.');
    console.error('   Ejecútalo desde tu terminal (fuera de Cursor) en la raíz del proyecto:');
    console.error('   pnpm exec node scripts/revisar-errores-navegador.mjs');
    console.error('   Si no tienes WebKit instalado: pnpm run test:e2e:app:install');
  }
  process.exit(1);
});
