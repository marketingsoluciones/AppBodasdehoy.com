#!/usr/bin/env node

/**
 * Test para hacer login manualmente y verificar cookies
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/manual-login-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

(async () => {
  console.log('======================================================================');
  console.log('MANUAL LOGIN TEST - Verificación de Cookies');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('[PASO 1] Navegando a login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');

    console.log('\n[PASO 2] Ingresando credenciales...');

    // Llenar formulario
    await page.fill('input[type="email"], input[name="email"]', USER_EMAIL);
    await page.waitForTimeout(500);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.waitForTimeout(500);
    await screenshot(page, '02-credentials-filled');

    console.log('\n[PASO 3] Verificando cookies ANTES del login...');
    const cookiesBefore = await context.cookies();
    console.log('  Total cookies:', cookiesBefore.length);
    const relevantBefore = cookiesBefore.filter(c =>
      c.name.includes('session') || c.name.includes('token') || c.name.includes('guest')
    );
    console.log('  Cookies relevantes:', relevantBefore.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

    console.log('\n[PASO 4] Haciendo click en submit...');
    await page.click('button[type="submit"]');

    console.log('  Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log(`  ✅ Redirigido a: ${page.url()}`);

    console.log('\n[PASO 5] Esperando a que se establezcan las cookies (10 segundos)...');
    await page.waitForTimeout(10000);
    await screenshot(page, '03-after-login-wait');

    console.log('\n[PASO 6] Verificando cookies DESPUÉS del login...');
    const cookiesAfter = await context.cookies();
    console.log('  Total cookies:', cookiesAfter.length);

    const sessionBodas = cookiesAfter.find(c => c.name === 'sessionBodas');
    const idToken = cookiesAfter.find(c => c.name === 'idTokenV0.1.0');
    const guestBodas = cookiesAfter.find(c => c.name === 'guestbodas');

    console.log('\n  📋 Cookies importantes:');
    console.log(`    sessionBodas: ${sessionBodas ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (sessionBodas) {
      console.log(`      - Valor: ${sessionBodas.value.substring(0, 50)}...`);
      console.log(`      - Dominio: ${sessionBodas.domain}`);
      console.log(`      - Path: ${sessionBodas.path}`);
      console.log(`      - Secure: ${sessionBodas.secure}`);
      console.log(`      - HttpOnly: ${sessionBodas.httpOnly}`);
      console.log(`      - SameSite: ${sessionBodas.sameSite}`);
    }

    console.log(`    idTokenV0.1.0: ${idToken ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (idToken) {
      console.log(`      - Valor: ${idToken.value.substring(0, 50)}...`);
      console.log(`      - Dominio: ${idToken.domain}`);
    }

    console.log(`    guestbodas: ${guestBodas ? '⚠️ PRESENTE (no debería)' : '✅ AUSENTE'}`);

    console.log('\n[PASO 7] Esperando a que cargue la página (30 segundos)...');
    for (let i = 5; i <= 30; i += 5) {
      await page.waitForTimeout(5000);
      console.log(`  ${i}s...`);

      if (i === 30) {
        await screenshot(page, `04-page-loaded-${i}s`);
      }
    }

    // Verificar estado del loader
    const loaderInfo = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        hasLoader: text.includes('Un momento, por favor') || text.includes('Cargando eventos'),
        hasEvents: text.includes('Mis eventos')
      };
    });

    console.log(`\n  Estado de la página:`);
    console.log(`    Loader visible: ${loaderInfo.hasLoader ? '❌ SÍ (problema)' : '✅ NO'}`);
    console.log(`    Eventos cargados: ${loaderInfo.hasEvents ? '✅ SÍ' : '❌ NO'}`);

    // Verificar usuario en consola
    console.log('\n[PASO 8] Verificando usuario en memoria...');
    const userInfo = await page.evaluate(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          const user = window.__NEXT_DATA__?.props?.pageProps?.user || {};
          resolve({
            uid: user.uid || 'NO UID',
            displayName: user.displayName || 'NO NAME',
            email: user.email || 'NO EMAIL'
          });
        }, 1000);
      });
    });

    console.log(`  Usuario actual:`);
    console.log(`    UID: ${userInfo.uid}`);
    console.log(`    displayName: ${userInfo.displayName}`);
    console.log(`    email: ${userInfo.email}`);

    console.log('\n✅ Test completado');
    console.log('\nNavegador abierto para inspección. Presiona Ctrl+C para cerrar.\n');
    console.log('Puedes:');
    console.log('  1. Abrir DevTools (F12)');
    console.log('  2. Ver Application > Cookies');
    console.log('  3. Ver Console para logs');
    console.log('  4. Verificar Network para ver llamadas GraphQL\n');

    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});
  }
})();
