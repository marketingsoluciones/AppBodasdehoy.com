#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  console.log('📸 Conectando...');

  // Conectar al navegador usando CDP
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  if (browser.contexts().length > 0) {
    const context = browser.contexts()[0];
    const pages = context.pages();

    if (pages.length > 0) {
      const page = pages[0];

      console.log('📄 URL actual:', await page.url());

      // Screenshot
      await page.screenshot({
        path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_NOW.png',
        fullPage: false
      });

      // Capturar estado
      const state = await page.evaluate(() => {
        const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"], [class*="fixed"]');
        const content = document.querySelector('#rootElementMain, main');
        const iframe = document.querySelector('iframe');

        return {
          url: window.location.href,
          sidebar: sidebar ? {
            className: sidebar.className,
            visible: window.getComputedStyle(sidebar).display !== 'none',
            position: {
              left: sidebar.getBoundingClientRect().left,
              width: sidebar.getBoundingClientRect().width,
              height: sidebar.getBoundingClientRect().height
            }
          } : { found: false },
          content: content ? {
            marginLeft: window.getComputedStyle(content.parentElement || content).marginLeft,
            width: content.getBoundingClientRect().width
          } : { found: false },
          iframe: iframe ? {
            src: iframe.src,
            visible: window.getComputedStyle(iframe).display !== 'none',
            width: iframe.getBoundingClientRect().width
          } : { found: false }
        };
      });

      console.log('\n📊 ESTADO:');
      console.log(JSON.stringify(state, null, 2));
      console.log('\n✅ Screenshot: SCREENSHOT_NOW.png');
    }
  }

  await browser.close();
})().catch(err => console.error('Error:', err.message));
