#!/usr/bin/env node
/**
 * Captura el estado actual del navegador
 */

const { chromium } = require('playwright');

async function main() {
  console.log('📸 Conectando al navegador existente...');

  // Conectarnos al navegador ya abierto
  const browser = await chromium.launch({
    headless: false,
    args: ['--remote-debugging-port=9222']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Screenshot completo
  console.log('📸 Tomando screenshot...');
  await page.screenshot({
    path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/screenshot-estado-actual.png',
    fullPage: true
  });

  // Capturar estado del layout
  const layoutState = await page.evaluate(() => {
    const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"]');
    const content = document.querySelector('#rootElementMain, main');
    const iframe = document.querySelector('iframe[title*="Copilot"], iframe[src*="3210"]');

    return {
      sidebar: sidebar ? {
        visible: window.getComputedStyle(sidebar).display !== 'none',
        position: sidebar.getBoundingClientRect(),
        css: {
          position: window.getComputedStyle(sidebar).position,
          left: window.getComputedStyle(sidebar).left,
          right: window.getComputedStyle(sidebar).right
        }
      } : null,
      content: content ? {
        position: content.getBoundingClientRect(),
        parentMargin: window.getComputedStyle(content.parentElement).marginLeft
      } : null,
      iframe: iframe ? {
        found: true,
        src: iframe.src,
        size: iframe.getBoundingClientRect()
      } : { found: false }
    };
  });

  console.log('\n📊 ESTADO CAPTURADO:');
  console.log(JSON.stringify(layoutState, null, 2));
  console.log('\n✅ Screenshot guardado en: screenshot-estado-actual.png');

  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
