#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  console.log('📸 Capturando screenshot actual...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const url = await page.url();
  console.log('📄 URL actual:', url);

  // Capturar errores de la consola
  const errors = await page.evaluate(() => {
    // Buscar elementos de error en el DOM
    const errorElements = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], .text-red-600, .text-red-500'));
    return errorElements.map(el => ({
      text: el.textContent?.trim().substring(0, 200),
      className: el.className,
    }));
  });

  // Screenshot
  await page.screenshot({
    path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_ERRORES.png',
    fullPage: false,
  });

  console.log('✅ Screenshot guardado: SCREENSHOT_ERRORES.png');

  if (errors.length > 0) {
    console.log('\n⚠️ ERRORES DETECTADOS EN DOM:\n');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.className}]`);
      console.log(`   ${err.text}\n`);
    });
  }

  // Capturar estado del copilot
  const copilotState = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[title*="Copilot"]');
    const sidebar = document.querySelector('[class*="ChatSidebar"]');

    return {
      iframeFound: !!iframe,
      iframeSrc: iframe?.src,
      sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
    };
  });

  console.log('\n📊 Estado Copilot:');
  console.log(JSON.stringify(copilotState, null, 2));

  await browser.close();
})();
