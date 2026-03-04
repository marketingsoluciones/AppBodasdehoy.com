#!/usr/bin/env node

/**
 * CAPTURADOR DE COOKIES - Para hacer login manual y guardar cookies
 *
 * Este script:
 * 1. Abre el navegador en app-test.bodasdehoy.com/login
 * 2. Espera a que hagas login MANUALMENTE
 * 3. Captura las cookies de autenticación
 * 4. Las guarda en un archivo JSON para reutilizarlas
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://app-test.bodasdehoy.com';
const COOKIES_FILE = path.join(__dirname, 'auth-cookies.json');

(async () => {
  console.log('======================================================================');
  console.log('CAPTURADOR DE COOKIES DE AUTENTICACIÓN');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('[PASO 1] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  ✅ Página cargada');

    console.log('\n[PASO 2] POR FAVOR, HAZ LOGIN MANUALMENTE');
    console.log('  - Ingresa tu email y password');
    console.log('  - Espera a que se complete el login');
    console.log('  - Deberías ver la página de inicio con tus eventos');
    console.log('\n  ⏳ Esperando que hagas login...');

    // Esperar a que salga de /login (el usuario hizo login)
    await page.waitForURL(url => !url.toString().includes('/login'), {
      timeout: 120000 // 2 minutos para hacer login manual
    });

    console.log('  ✅ Redirigido a:', page.url());

    // Esperar a que las cookies se establezcan
    console.log('\n[PASO 3] Esperando que las cookies se establezcan...');
    await page.waitForTimeout(5000);

    let cookiesEstablished = false;
    let attempts = 0;

    while (!cookiesEstablished && attempts < 30) {
      attempts++;
      await page.waitForTimeout(1000);

      const cookies = await context.cookies();
      const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
      const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

      if (attempts % 5 === 0) {
        console.log(`  [${attempts}s] idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`);
      }

      if (hasIdToken && hasSessionBodas) {
        console.log('  ✅ ¡Cookies establecidas correctamente!');
        cookiesEstablished = true;
        break;
      }
    }

    if (!cookiesEstablished) {
      console.log('\n  ⚠️  Las cookies no se establecieron en 30 segundos');
      console.log('  Pero continuaremos guardando todas las cookies disponibles...');
    }

    // Capturar TODAS las cookies
    const allCookies = await context.cookies();
    console.log(`\n[PASO 4] Capturando cookies (${allCookies.length} en total)...`);

    // Mostrar las cookies importantes
    const importantCookies = allCookies.filter(c =>
      c.name === 'idTokenV0.1.0' ||
      c.name === 'sessionBodas' ||
      c.name.includes('session') ||
      c.name.includes('token')
    );

    console.log('\n  Cookies importantes:');
    importantCookies.forEach(cookie => {
      const value = cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : '');
      console.log(`    - ${cookie.name}: ${value}`);
      console.log(`      domain: ${cookie.domain}, expires: ${new Date(cookie.expires * 1000).toISOString()}`);
    });

    // Guardar cookies en archivo JSON
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(allCookies, null, 2));
    console.log(`\n[PASO 5] ✅ Cookies guardadas en:`);
    console.log(`  ${COOKIES_FILE}`);

    console.log('\n======================================================================');
    console.log('✅ CAPTURA COMPLETADA EXITOSAMENTE');
    console.log('======================================================================');
    console.log('\nAhora puedes usar estas cookies en tus tests con:');
    console.log('  const cookies = require("./auth-cookies.json");');
    console.log('  await context.addCookies(cookies);');
    console.log('\n⏳ El navegador se cerrará en 5 segundos...');

    await page.waitForTimeout(5000);

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.message.includes('Timeout')) {
      console.log('\n  ⏳ El navegador quedará abierto para que puedas intentar de nuevo...');
      console.log('     Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    } else {
      await browser.close();
      process.exit(1);
    }
  }
})();
