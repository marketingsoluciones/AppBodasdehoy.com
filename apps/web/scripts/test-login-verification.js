#!/usr/bin/env node

const { chromium } = require('playwright');

const URL = 'http://localhost:8080';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/login-verify-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

(async () => {
  console.log('======================================================================');
  console.log('VERIFICACIÓN DE LOGIN Y COOKIES');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.text().includes('User') || msg.text().includes('guest') || msg.text().includes('cookie') || msg.text().includes('session')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a login...');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');

    console.log('\n[PASO 2] Llenando formulario...');
    await page.evaluate(([email, pass]) => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set || 
                         Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
        if (valueSetter) {
          valueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[type="password"]');
      if (emailInput) setNativeValue(emailInput, email);
      if (passInput) setNativeValue(passInput, pass);
    }, [USER_EMAIL, USER_PASSWORD]);

    await page.waitForTimeout(500);
    await screenshot(page, '02-form-filled');

    console.log('\n[PASO 3] Verificando cookies ANTES del login...');
    let cookies = await context.cookies();
    console.log(`  Total cookies: ${cookies.length}`);
    const sessionBefore = cookies.find(c => c.name === 'sessionBodas');
    const idTokenBefore = cookies.find(c => c.name === 'idTokenV0.1.0');
    console.log(`  sessionBodas: ${sessionBefore ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`  idTokenV0.1.0: ${idTokenBefore ? '✅ PRESENTE' : '❌ AUSENTE'}`);

    console.log('\n[PASO 4] Haciendo submit...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log(`  ✅ Redirigido a: ${page.url()}`);

    console.log('\n[PASO 5] Esperando 10 segundos para que se establezcan las cookies...');
    await page.waitForTimeout(10000);
    await screenshot(page, '03-after-login');

    console.log('\n[PASO 6] Verificando cookies DESPUÉS del login...');
    cookies = await context.cookies();
    console.log(`  Total cookies: ${cookies.length}`);

    const sessionAfter = cookies.find(c => c.name === 'sessionBodas');
    const idTokenAfter = cookies.find(c => c.name === 'idTokenV0.1.0');
    const guestCookie = cookies.find(c => c.name === 'guestbodas');

    console.log(`  sessionBodas: ${sessionAfter ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (sessionAfter) {
      console.log(`    - Dominio: ${sessionAfter.domain}`);
      console.log(`    - Valor (primeros 50 chars): ${sessionAfter.value.substring(0, 50)}...`);
    }

    console.log(`  idTokenV0.1.0: ${idTokenAfter ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (idTokenAfter) {
      console.log(`    - Dominio: ${idTokenAfter.domain}`);
      console.log(`    - Valor (primeros 50 chars): ${idTokenAfter.value.substring(0, 50)}...`);
    }

    console.log(`  guestbodas: ${guestCookie ? '⚠️ PRESENTE (debería estar ausente)' : '✅ AUSENTE'}`);

    console.log('\n[PASO 7] Verificando usuario en contexto...');
    const userInfo = await page.evaluate(() => {
      // Esperar un poco para que React actualice el estado
      return new Promise(resolve => {
        setTimeout(() => {
          const bodyText = document.body.innerText || '';
          resolve({
            hasGuestText: bodyText.includes('guest'),
            urlPath: window.location.pathname,
          });
        }, 2000);
      });
    });

    console.log(`  Tiene texto "guest" en la página: ${userInfo.hasGuestText ? '❌ SÍ (problema)' : '✅ NO'}`);
    console.log(`  URL actual: ${userInfo.urlPath}`);

    console.log('\n[PASO 8] Esperando a que cargue la página (20 segundos)...');
    await page.waitForTimeout(20000);
    await screenshot(page, '04-page-loaded');

    const pageState = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        hasLoader: text.includes('Un momento, por favor') || text.includes('Cargando eventos'),
        hasEvents: text.includes('Mis eventos'),
        hasGuest: text.includes('guest')
      };
    });

    console.log(`\n  Estado de la página:`);
    console.log(`    Loader visible: ${pageState.hasLoader ? '❌ SÍ' : '✅ NO'}`);
    console.log(`    Eventos cargados: ${pageState.hasEvents ? '✅ SÍ' : '❌ NO'}`);
    console.log(`    Texto "guest": ${pageState.hasGuest ? '❌ SÍ' : '✅ NO'}`);

    // Guardar logs
    const fs = require('fs');
    fs.writeFileSync('/tmp/login-verify-console.txt', consoleLogs.join('\n'), 'utf-8');
    console.log(`\n  📄 Logs de consola guardados en: /tmp/login-verify-console.txt`);

    console.log('\n✅ Verificación completada');
    console.log('\nNavegador abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error');
    await new Promise(() => {});
  }
})();
