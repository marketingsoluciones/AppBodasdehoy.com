#!/usr/bin/env node
/**
 * Carga app-test y chat-test, captura errores de consola y red, y los imprime.
 *
 * Navegador:
 * - Por defecto prueba en orden: webkit → chromium → firefox (el primero instalado).
 * - Forzar uno: REVISAR_ERRORES_BROWSER=chromium (o webkit | firefox)
 * - Los E2E del repo siguen siendo solo WebKit; aquí chromium/firefox son solo diagnóstico.
 *
 * Uso:
 *   pnpm revisar:errores
 *   pnpm revisar:errores:local
 *
 * Si falta todo: pnpm exec playwright install
 *   o solo: pnpm exec playwright install chromium
 *
 * URLs locales:
 *   BASE_URL_APP=http://127.0.0.1:8080 BASE_URL_CHAT=http://127.0.0.1:3210 pnpm revisar:errores
 */
import { webkit, chromium, firefox } from 'playwright';

const BROWSERS = { webkit, chromium, firefox };

const APP_URL = process.env.BASE_URL_APP || 'https://app-test.bodasdehoy.com';
const CHAT_URL = process.env.BASE_URL_CHAT || 'https://chat-test.bodasdehoy.com';

/** @type {{ type: string, text: string }[]} */
const consoleErrors = [];
/** @type {{ status: number, url: string, ok: boolean }[]} */
const networkFails = [];
/** @type {string[]} */
const pageErrors = [];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getBrowserOrder() {
  const env = (process.env.REVISAR_ERRORES_BROWSER || process.env.PLAYWRIGHT_BROWSER || '')
    .toLowerCase()
    .trim();
  const all = /** @type {const} */ (['webkit', 'chromium', 'firefox']);
  if (env && all.includes(env)) {
    return [env, ...all.filter((b) => b !== env)];
  }
  return [...all];
}

async function launchPlaywrightBrowser() {
  const order = getBrowserOrder();
  /** @type {Error | undefined} */
  let lastError;

  for (const name of order) {
    try {
      const browser = await BROWSERS[name].launch({ headless: true });
      const note =
        name !== 'webkit'
          ? ' (solo diagnóstico; E2E del monorepo = WebKit)'
          : '';
      console.log(`🌐 Playwright: ${name}${note}\n`);
      return browser;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError;
}

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
    await sleep(3000);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.log(`   ❌ Error cargando: ${err.message}`);
    return;
  }

  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '').catch(() => '');

  console.log(`   Red (4xx/5xx): ${networkFails.length}`);
  networkFails.slice(0, 15).forEach((e) => console.log(`      [${e.status}] ${e.url}`));
  console.log(`   Consola (error/warn): ${consoleErrors.length}`);
  consoleErrors.slice(0, 15).forEach((e) => console.log(`      [${e.type}] ${e.text}`));
  console.log(`   PageError: ${pageErrors.length}`);
  pageErrors.forEach((m) => console.log(`      ${m}`));
  if (bodyText && /Internal Server Error|Error 500|Error Capturado/i.test(bodyText)) {
    console.log('   ⚠️ Contenido de página contiene posible error:');
    console.log('      ' + bodyText.replace(/\n/g, '\n      ').slice(0, 400));
  }
}

async function main() {
  console.log('🔍 Revisión de errores en navegador (app-test + chat-test)\n');

  const browser = await launchPlaywrightBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await capturePage(page, 'app-test', APP_URL);
  await capturePage(page, 'chat-test (chat)', `${CHAT_URL}/bodasdehoy/chat`);

  await browser.close();
  console.log('\n✅ Revisión terminada.');
}

main().catch((e) => {
  const msg = e?.message || String(e);
  console.error('Error:', msg);
  if (/Executable doesn't exist|browserType\.launch:/i.test(msg)) {
    console.error('\n💡 No hay navegador de Playwright instalado (o no en esta caché).');
    console.error('   Instala al menos uno:');
    console.error('     pnpm exec playwright install chromium');
    console.error('   O todo:');
    console.error('     pnpm exec playwright install');
    console.error('   E2E del repo (WebKit): pnpm run test:e2e:app:install');
    console.error('\n   Si usas sandbox de Cursor, ejecuta el mismo comando en la terminal del sistema.');
  }
  process.exit(1);
});
