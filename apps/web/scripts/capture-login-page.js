#!/usr/bin/env node
/**
 * Capturar login page para ver qué está pasando
 */

const { chromium } = require('playwright');

(async () => {
  console.log('📸 Capturando página de login...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const logs = [];

  // Capturar console logs
  page.on('console', msg => {
    logs.push(msg.text());
    console.log('[LOG]', msg.text());
  });

  // Capturar navegaciones
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('🔄 Navegación a:', frame.url());
    }
  });

  try {
    console.log('🔍 Navegando a /login...');
    await page.goto('http://127.0.0.1:8080/login', {
      waitUntil: 'domcontentloaded',
      timeout: 5000
    });

    // Esperar un momento
    await page.waitForTimeout(2000);

    // Capturar estado
    const state = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        hasForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        bodyText: document.body.innerText.substring(0, 500),
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({
          type: i.type,
          name: i.name,
          placeholder: i.placeholder,
        })),
      };
    });

    console.log('\n📊 ESTADO DE LA PÁGINA:');
    console.log(JSON.stringify(state, null, 2));

    // Screenshot
    const screenshotPath = '/Users/juancarlosparra/Projects/AppBodasdehoy.com/LOGIN_PAGE_SCREENSHOT.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('\n📸 Screenshot guardado:', screenshotPath);

    // Esperar 5 segundos más para ver si hay redirect
    console.log('\n⏳ Esperando 5 segundos para ver si hay redirect...');
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log('🔍 URL final:', finalUrl);

    if (finalUrl !== 'http://127.0.0.1:8080/login') {
      console.log('⚠️  Hubo redirect de /login a:', finalUrl);
    } else {
      console.log('✅ Página se mantiene en /login');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
