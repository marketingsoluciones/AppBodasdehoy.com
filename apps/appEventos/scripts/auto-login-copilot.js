#!/usr/bin/env node
/**
 * Auto-login para verificar copilot con usuario autenticado
 */

const { chromium } = require('playwright');

const CREDENTIALS = {
  email: 'bodasdehoy.com@gmail.com',
  password: 'lorca2012M*+',
};

(async () => {
  console.log('🔐 Iniciando auto-login...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Ir a login
    console.log('📍 Navegando a /login...');
    await page.goto('http://127.0.0.1:8080/login', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verificar si ya está logueado
    const isLoggedIn = await page.evaluate(() => {
      return document.cookie.includes('sessionBodas');
    });

    if (isLoggedIn) {
      console.log('✅ Usuario ya está logueado');
      console.log('📊 Verificando datos de sesión...');

      const sessionData = await page.evaluate(() => {
        return {
          hasSessionCookie: document.cookie.includes('sessionBodas'),
          hasFirebaseUser: !!window.localStorage.getItem('firebase:authUser'),
          url: window.location.href,
        };
      });

      console.log(JSON.stringify(sessionData, null, 2));

      // Ir a home
      console.log('\n🏠 Navegando a home...');
      await page.goto('http://127.0.0.1:8080', { waitUntil: 'load', timeout: 10000 });
      await page.waitForTimeout(2000);

      // Abrir copilot
      console.log('🤖 Abriendo copilot...');
      await page.keyboard.press('Meta+Shift+C');
      await page.waitForTimeout(8000);

      console.log('\n✅ Proceso completado. Copilot debería estar cargando datos del usuario.');

      await browser.close();
      return;
    }

    // Buscar campo de email
    console.log('🔍 Buscando formulario de login...');
    const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="correo"]';
    const passwordSelector = 'input[type="password"], input[name="password"], input[placeholder*="contraseña"]';

    await page.waitForSelector(emailSelector, { timeout: 10000 });

    // Llenar formulario
    console.log('✍️  Llenando email...');
    await page.fill(emailSelector, CREDENTIALS.email);
    await page.waitForTimeout(500);

    console.log('✍️  Llenando password...');
    await page.fill(passwordSelector, CREDENTIALS.password);
    await page.waitForTimeout(500);

    // Buscar botón de submit
    const submitButton = await page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")').first();

    console.log('🖱️  Haciendo click en submit...');
    await submitButton.click();

    // Esperar navegación o cambio de estado
    console.log('⏳ Esperando autenticación Firebase...');
    await page.waitForTimeout(5000);

    // Verificar si login fue exitoso
    const loginSuccess = await page.evaluate(() => {
      return document.cookie.includes('sessionBodas') ||
             window.localStorage.getItem('firebase:authUser') !== null;
    });

    if (loginSuccess) {
      console.log('✅ Login exitoso!');

      // Ir a home
      console.log('\n🏠 Navegando a home...');
      await page.goto('http://127.0.0.1:8080', { waitUntil: 'load', timeout: 10000 });
      await page.waitForTimeout(2000);

      // Abrir copilot
      console.log('🤖 Abriendo copilot...');
      await page.keyboard.press('Meta+Shift+C');
      await page.waitForTimeout(8000);

      // Capturar estado final
      const finalState = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[title*="Copilot"]');
        return {
          hasSessionCookie: document.cookie.includes('sessionBodas'),
          firebaseUser: window.localStorage.getItem('firebase:authUser') ? 'Presente' : 'Ausente',
          iframeFound: !!iframe,
          iframeSrc: iframe?.src,
          url: window.location.href,
        };
      });

      console.log('\n📊 ESTADO FINAL:');
      console.log(JSON.stringify(finalState, null, 2));

      console.log('\n✅ Proceso completado exitosamente');
      console.log('👉 Revisa el navegador - el copilot debería mostrar datos personalizados');
    } else {
      console.log('❌ Login falló. Verifica credenciales o que el formulario se llenó correctamente.');
    }

  } catch (error) {
    console.error('❌ Error durante el proceso:', error.message);
    console.log('\n💡 Intenta hacer login manualmente en: http://127.0.0.1:8080/login');
  } finally {
    await browser.close();
  }
})();
