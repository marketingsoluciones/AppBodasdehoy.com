#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });

  console.log('📄 Cargando página...');
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('🤖 Abriendo copilot...');
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(4000);

  console.log('📸 Capturando screenshot...');
  await page.screenshot({
    path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_ACTUAL.png',
    fullPage: false
  });

  const state = await page.evaluate(() => {
    const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"]');
    const content = document.querySelector('#rootElementMain');
    const iframe = document.querySelector('iframe[title*="Copilot"], iframe[src*="3210"]');

    return {
      sidebar: sidebar ? {
        className: sidebar.className,
        display: window.getComputedStyle(sidebar).display,
        position: window.getComputedStyle(sidebar).position,
        left: sidebar.getBoundingClientRect().left,
        width: sidebar.getBoundingClientRect().width,
        visible: window.getComputedStyle(sidebar).display !== 'none'
      } : { found: false },
      content: content ? {
        marginLeft: window.getComputedStyle(content.parentElement).marginLeft,
        width: content.getBoundingClientRect().width,
        left: content.getBoundingClientRect().left
      } : { found: false },
      iframe: iframe ? {
        src: iframe.src,
        width: iframe.getBoundingClientRect().width,
        height: iframe.getBoundingClientRect().height
      } : { found: false }
    };
  });

  console.log('\n📊 ESTADO CAPTURADO:\n');
  console.log(JSON.stringify(state, null, 2));

  await browser.close();
  console.log('\n✅ Screenshot guardado: SCREENSHOT_ACTUAL.png');
})();
