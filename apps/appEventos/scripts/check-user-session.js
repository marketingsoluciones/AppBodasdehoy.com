#!/usr/bin/env node
/**
 * Verifica si hay usuario logueado en la web app
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Verificando sesión de usuario...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Verificar cookies y localStorage
  const sessionData = await page.evaluate(() => {
    // Cookies
    const cookies = document.cookie;

    // LocalStorage
    const localStorage = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      localStorage[key] = window.localStorage.getItem(key);
    }

    // SessionStorage
    const sessionStorage = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      sessionStorage[key] = window.sessionStorage.getItem(key);
    }

    // Verificar si hay props de React (AuthContext)
    const rootElement = document.querySelector('#__next');

    return {
      url: window.location.href,
      cookies,
      localStorage,
      sessionStorage,
      hasRootElement: !!rootElement,
    };
  });

  console.log('\n📊 SESIÓN DEL USUARIO:\n');
  console.log('URL:', sessionData.url);
  console.log('\n🍪 COOKIES:');
  console.log(sessionData.cookies.substring(0, 200) + '...');

  console.log('\n💾 LOCALSTORAGE (keys):');
  console.log(Object.keys(sessionData.localStorage).join(', '));

  console.log('\n📦 SESSIONSTORAGE (keys):');
  console.log(Object.keys(sessionData.sessionStorage).join(', '));

  // Buscar cookie de sesión
  const hasSessionCookie = sessionData.cookies.includes('sessionBodas');
  const hasFirebaseUser = sessionData.localStorage['firebase:authUser'];

  console.log('\n✅ ESTADO DE AUTENTICACIÓN:');
  console.log(`  sessionBodas cookie: ${hasSessionCookie ? '✅ SÍ' : '❌ NO'}`);
  console.log(`  Firebase user: ${hasFirebaseUser ? '✅ SÍ' : '❌ NO'}`);

  if (hasFirebaseUser) {
    try {
      const firebaseUser = JSON.parse(hasFirebaseUser);
      console.log('\n👤 USUARIO FIREBASE:');
      console.log(`  Email: ${firebaseUser.email}`);
      console.log(`  UID: ${firebaseUser.uid}`);
      console.log(`  Display Name: ${firebaseUser.displayName}`);
    } catch (e) {
      console.log('  (Error parseando usuario Firebase)');
    }
  }

  await browser.close();
})();
