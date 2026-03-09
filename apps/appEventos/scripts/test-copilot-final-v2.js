#!/usr/bin/env node

/**
 * TEST FINAL V2 - Con cierre automático y mejor manejo de loading
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/copilot-v2-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForCookiesAndAuth(page) {
  console.log('\n⏳ Esperando cookies de autenticación...');

  let authenticated = false;
  let attempts = 0;
  const maxAttempts = 45;

  while (!authenticated && attempts < maxAttempts) {
    attempts++;
    await page.waitForTimeout(1000);

    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 5 === 0) {
      console.log(`  [${attempts}s] idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Ambas cookies establecidas!');
      authenticated = true;
      break;
    }
  }

  if (!authenticated) {
    console.log('  ⚠️  Timeout esperando cookies');
  }

  await page.waitForTimeout(3000);
  return authenticated;
}

async function waitForLoadingToDisappear(page, timeout = 30000) {
  console.log('  ⏳ Esperando que el loading desaparezca...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const hasLoading = await page.evaluate(() => {
      // Buscar el overlay de loading
      const loadingDiv = document.querySelector('.font-display.fixed.top-0.left-0.w-full.h-screen.z-50.bg-white');
      if (!loadingDiv) return false;

      const style = window.getComputedStyle(loadingDiv);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!hasLoading) {
      console.log('  ✅ Loading desapareció');
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log('  ⚠️  Loading aún visible después de timeout');
  return false;
}

(async () => {
  console.log('======================================================================');
  console.log('TEST FINAL V2 - CON CIERRE AUTOMÁTICO');
  console.log('======================================================================\n');

  let browser;
  let success = false;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 50,
      args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Ocultar webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Logs de consola
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Auth]') || text.includes('Cookie') || text.includes('error')) {
        console.log(`  [CONSOLE] ${text}`);
      }
    });

    console.log('[PASO 1] Limpiando cookies...');
    await context.clearCookies();
    console.log('  ✅ Cookies limpiadas');

    console.log('\n[PASO 2] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  ✅ Página cargada');

    // CRÍTICO: Esperar a que el loading de la página de login desaparezca
    console.log('\n[PASO 3] Esperando que el loading inicial desaparezca...');
    await page.waitForTimeout(3000); // Dar tiempo al setTimeout de 1s de login.js
    await waitForLoadingToDisappear(page, 10000);
    await screenshot(page, '01-login-ready');

    console.log('\n[PASO 4] Llenando formulario...');

    // Verificar que el formulario esté visible
    const emailInput = await page.waitForSelector('input[type="email"]', {
      state: 'visible',
      timeout: 10000
    });

    if (!emailInput) {
      throw new Error('Input de email no encontrado');
    }

    console.log('  ✅ Formulario visible');

    // Llenar formulario de forma natural
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
    await page.waitForTimeout(300);

    await page.click('input[type="password"]');
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 50 });
    await page.waitForTimeout(500);

    await screenshot(page, '02-form-filled');
    console.log('  ✅ Formulario llenado');

    console.log('\n[PASO 5] Enviando formulario...');
    await page.click('button[type="submit"]');

    // Esperar redirección
    console.log('  ⏳ Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Redirigido a:', page.url());

    await screenshot(page, '03-after-redirect');

    // Esperar autenticación
    console.log('\n[PASO 6] Esperando autenticación...');
    const isAuthenticated = await waitForCookiesAndAuth(page);

    if (!isAuthenticated) {
      console.log('\n❌ AUTENTICACIÓN FALLIDA');
      await screenshot(page, '04-auth-failed');

      console.log('\n⚠️  El test no puede continuar sin autenticación');
      console.log('📸 Capturas en /tmp/copilot-v2-*.png');

      // CERRAR NAVEGADOR AUTOMÁTICAMENTE
      console.log('\n🔴 Cerrando navegador automáticamente...');
      await browser.close();
      process.exit(1);
    }

    console.log('  ✅ Usuario autenticado');

    // Esperar a que el loading de la homepage desaparezca
    console.log('\n[PASO 7] Esperando que la homepage cargue...');
    await page.waitForTimeout(5000);
    await waitForLoadingToDisappear(page, 30000);
    await screenshot(page, '05-homepage-ready');

    console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    console.log('\nEl usuario está correctamente autenticado.');
    console.log('Las cookies están establecidas.');
    console.log('El loading ha desaparecido.');
    console.log('\n📸 Capturas guardadas en /tmp/copilot-v2-*.png');

    success = true;

    // Mantener abierto 10 segundos para verificación visual
    console.log('\n⏳ Manteniendo navegador abierto 10s para verificación...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    // SIEMPRE cerrar el navegador
    if (browser) {
      console.log('\n🔴 Cerrando navegador...');
      await browser.close();
      console.log('✅ Navegador cerrado');
    }

    process.exit(success ? 0 : 1);
  }
})();
