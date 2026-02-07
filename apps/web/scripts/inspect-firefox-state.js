#!/usr/bin/env node

/**
 * Inspeccionar estado de autenticación en Firefox abierto
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function main() {
  console.log('\n======================================================================');
  console.log('INSPECCIÓN DE ESTADO DE AUTENTICACIÓN');
  console.log('======================================================================\n');

  let browser;

  try {
    // Conectar al contexto persistente existente
    console.log('[PASO 1] Conectando a Firefox con perfil persistente...\n');

    const userDataDir = '/tmp/firefox-copilot-profile';

    browser = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args: []
    });

    const page = browser.pages()[0];

    // Navegar a eventos para asegurar que estamos en la app
    await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('[PASO 2] Inspeccionando cookies...\n');

    // Obtener TODAS las cookies del contexto
    const allCookies = await browser.cookies();

    console.log(`   Total de cookies: ${allCookies.length}\n`);

    // Buscar cookies específicas
    const idTokenCookie = allCookies.find(c => c.name === 'idTokenV0.1.0');
    const sessionCookie = allCookies.find(c => c.name === 'sessionBodas');
    const guestCookie = allCookies.find(c => c.name === 'guestBodas');

    console.log('   Cookies de autenticación:');
    console.log(`   - idTokenV0.1.0: ${idTokenCookie ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (idTokenCookie) {
      console.log(`     Domain: ${idTokenCookie.domain}`);
      console.log(`     Path: ${idTokenCookie.path}`);
      console.log(`     Value length: ${idTokenCookie.value.length} caracteres`);
      console.log(`     Expires: ${new Date(idTokenCookie.expires * 1000).toISOString()}`);
    }

    console.log(`   - sessionBodas: ${sessionCookie ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (sessionCookie) {
      console.log(`     Domain: ${sessionCookie.domain}`);
      console.log(`     Path: ${sessionCookie.path}`);
      console.log(`     Value length: ${sessionCookie.value.length} caracteres`);
      console.log(`     Expires: ${new Date(sessionCookie.expires * 1000).toISOString()}`);
    }

    console.log(`   - guestBodas: ${guestCookie ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (guestCookie) {
      console.log(`     Domain: ${guestCookie.domain}`);
      console.log(`     Value: ${guestCookie.value}`);
    }

    console.log('\n[PASO 3] Inspeccionando localStorage...\n');

    // Leer localStorage
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        data[key] = value;
      }
      return data;
    });

    console.log('   localStorage keys:');
    Object.keys(localStorageData).forEach(key => {
      const value = localStorageData[key];
      if (key.includes('firebase') || key.includes('auth') || key.includes('user') || key.includes('token')) {
        console.log(`   - ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
      }
    });

    console.log('\n[PASO 4] Verificando usuario en DOM...\n');

    // Verificar texto del menú desplegable
    const userMenuText = await page.evaluate(() => {
      // Buscar el avatar/menú de usuario
      const avatar = document.querySelector('[class*="avatar"], [class*="user"], button:has(img)');
      if (avatar) {
        return avatar.textContent;
      }
      return null;
    });

    console.log(`   Texto del menú de usuario: "${userMenuText}"`);

    // Verificar si hay "guest" en el DOM
    const hasGuestText = await page.evaluate(() => {
      return document.body.textContent.includes('guest');
    });

    console.log(`   ¿Contiene "guest"?: ${hasGuestText ? '⚠️ SÍ' : '✅ NO'}`);

    console.log('\n[PASO 5] Verificando Firebase Auth...\n');

    // Verificar estado de Firebase
    const firebaseState = await page.evaluate(() => {
      try {
        // @ts-ignore
        const auth = window.firebase?.auth?.()?.currentUser;
        if (auth) {
          return {
            exists: true,
            uid: auth.uid,
            email: auth.email,
            displayName: auth.displayName,
            emailVerified: auth.emailVerified
          };
        }
        return { exists: false };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('   Firebase Auth currentUser:');
    if (firebaseState.exists) {
      console.log(`     ✅ Usuario autenticado`);
      console.log(`     UID: ${firebaseState.uid}`);
      console.log(`     Email: ${firebaseState.email}`);
      console.log(`     Display Name: ${firebaseState.displayName}`);
      console.log(`     Email Verified: ${firebaseState.emailVerified}`);
    } else if (firebaseState.error) {
      console.log(`     ❌ Error: ${firebaseState.error}`);
    } else {
      console.log(`     ❌ NO hay usuario autenticado en Firebase`);
    }

    console.log('\n[PASO 6] Listando TODAS las cookies (para debug)...\n');

    allCookies
      .filter(c => !c.name.includes('_ga') && !c.name.includes('_gid'))
      .forEach(cookie => {
        console.log(`   ${cookie.name}:`);
        console.log(`     Domain: ${cookie.domain}`);
        console.log(`     Value: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
      });

    console.log('\n======================================================================');
    console.log('INSPECCIÓN COMPLETADA');
    console.log('======================================================================\n');

    console.log('🦊 Firefox permanece abierto\n');

    // Mantener navegador abierto
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

main();
