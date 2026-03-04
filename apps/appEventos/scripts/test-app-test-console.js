#!/usr/bin/env node

/**
 * Test para capturar logs de consola y encontrar el problema del loader
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/app-test-console-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

(async () => {
  console.log('======================================================================');
  console.log('TEST - CAPTURANDO LOGS DE CONSOLA');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  const errors = [];
  const networkFailures = [];

  // Capturar logs de consola
  page.on('console', msg => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const text = `[${timestamp}] ${msg.type()}: ${msg.text()}`;
    logs.push(text);
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  // Capturar errores de página
  page.on('pageerror', err => {
    const text = `[PAGE ERROR] ${err.message}`;
    errors.push(text);
    console.log(text);
  });

  // Capturar fallos de red
  page.on('requestfailed', request => {
    const text = `[NET FAIL] ${request.url()} - ${request.failure()?.errorText || 'unknown'}`;
    networkFailures.push(text);
    console.log(text);
  });

  try {
    // Login
    console.log('[PASO 1] Navegando y haciendo login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login');

    await page.evaluate(([email, pass]) => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
          || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
        if (valueSetter) {
          valueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      const emailInput = document.querySelector('input[type="email"]') ||
                       document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[type="password"]');

      if (emailInput) setNativeValue(emailInput, email);
      if (passInput) setNativeValue(passInput, pass);
    }, [USER_EMAIL, USER_PASSWORD]);

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    console.log('  Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Login exitoso');

    await screenshot(page, '02-after-login');

    // Esperar 60 segundos capturando todo
    console.log('\n[PASO 2] Esperando 60 segundos y capturando logs...');

    for (let i = 10; i <= 60; i += 10) {
      await page.waitForTimeout(10000);
      console.log(`\n  --- ${i} segundos ---`);
      await screenshot(page, `03-wait-${i}s`);

      // Verificar estado del loader
      const loaderInfo = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const hasLoader = text.includes('Un momento, por favor') || text.includes('Cargando eventos');
        const hasEvents = text.includes('Mis eventos');
        return { hasLoader, hasEvents };
      });

      console.log(`  Loader visible: ${loaderInfo.hasLoader}, Eventos cargados: ${loaderInfo.hasEvents}`);
      console.log(`  Logs capturados: ${logs.length}, Errores: ${errors.length}, Fallos de red: ${networkFailures.length}`);
    }

    console.log('\n[PASO 3] Guardando logs...');

    const allLogs = [
      '='.repeat(70),
      'LOGS DE CONSOLA',
      '='.repeat(70),
      ...logs,
      '',
      '='.repeat(70),
      'ERRORES DE PÁGINA',
      '='.repeat(70),
      ...errors,
      '',
      '='.repeat(70),
      'FALLOS DE RED',
      '='.repeat(70),
      ...networkFailures
    ].join('\n');

    fs.writeFileSync('/tmp/app-test-console-logs.txt', allLogs, 'utf-8');
    console.log('  📄 Logs guardados en: /tmp/app-test-console-logs.txt');
    console.log(`  Total logs: ${logs.length}`);
    console.log(`  Total errores: ${errors.length}`);
    console.log(`  Total fallos de red: ${networkFailures.length}`);

    await screenshot(page, '99-final');

    console.log('\n✅ Test completado');
    console.log('\nNavegador abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    const allLogs = [
      '='.repeat(70),
      'LOGS DE CONSOLA',
      '='.repeat(70),
      ...logs,
      '',
      '='.repeat(70),
      'ERRORES DE PÁGINA',
      '='.repeat(70),
      ...errors,
      '',
      '='.repeat(70),
      'FALLOS DE RED',
      '='.repeat(70),
      ...networkFailures,
      '',
      '='.repeat(70),
      'ERROR FINAL',
      '='.repeat(70),
      error.stack || error.message
    ].join('\n');

    fs.writeFileSync('/tmp/app-test-console-logs.txt', allLogs, 'utf-8');
    console.log('  📄 Logs guardados en: /tmp/app-test-console-logs.txt');

    await screenshot(page, 'error-final');
    console.log('\nNavegador abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});
  }
})();
