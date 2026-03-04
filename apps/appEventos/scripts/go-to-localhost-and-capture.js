#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Navegando a localhost:8080...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];

  // Capturar errores
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('Error') || text.includes('autenticación')) {
      errors.push({ type, text });
      console.log(`[${type.toUpperCase()}]`, text.substring(0, 100));
    }
  });

  // Navegar a localhost
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✅ Página cargada');

  await page.waitForTimeout(3000);

  // Abrir copilot
  console.log('🤖 Abriendo copilot...');
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(8000);

  // Screenshot
  console.log('📸 Capturando screenshot...');
  await page.screenshot({
    path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_LOCALHOST_COPILOT.png',
    fullPage: false,
  });

  // Capturar estado completo
  const state = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[title*="Copilot"]');
    const errorElements = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-600'));

    return {
      url: window.location.href,
      iframeFound: !!iframe,
      iframeSrc: iframe?.src,
      errors: errorElements.map(el => el.textContent?.trim().substring(0, 100)),
      hasSessionCookie: document.cookie.includes('sessionBodas'),
    };
  });

  console.log('\n📊 ESTADO:');
  console.log(JSON.stringify(state, null, 2));

  if (errors.length > 0) {
    console.log('\n❌ ERRORES CAPTURADOS EN CONSOLA:');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.type}] ${err.text.substring(0, 120)}`);
    });
  }

  console.log('\n✅ Screenshot guardado: SCREENSHOT_LOCALHOST_COPILOT.png');

  await browser.close();
})();
