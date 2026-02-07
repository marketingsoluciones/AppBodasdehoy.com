#!/usr/bin/env node
/**
 * Controla el navegador existente vía MCP para abrir el copilot
 */

const { chromium } = require('playwright');

(async () => {
  console.log('📡 Conectando al navegador vía CDP...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log('📄 URL actual:', await page.url());

  // Navegar a localhost:8080
  console.log('🌐 Navegando a http://127.0.0.1:8080...');
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('✅ Página cargada');
  console.log('⏳ Esperando 2 segundos...');
  await page.waitForTimeout(2000);

  // Abrir copilot con Cmd+Shift+C
  console.log('🤖 Abriendo copilot con Cmd+Shift+C...');
  await page.keyboard.press('Meta+Shift+C');

  // Esperar a que el copilot se abra
  await page.waitForTimeout(6000);

  // Capturar estado completo
  const state = await page.evaluate(() => {
    const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"], [class*="fixed"]');
    const content = document.querySelector('#rootElementMain');
    const iframe = document.querySelector('iframe[title*="Copilot"], iframe[src*="3210"], iframe[src*="chat"]');

    // Buscar todos los iframes
    const allIframes = Array.from(document.querySelectorAll('iframe'));

    return {
      url: window.location.href,
      sidebar: sidebar ? {
        className: sidebar.className,
        visible: window.getComputedStyle(sidebar).display !== 'none',
        position: {
          left: sidebar.getBoundingClientRect().left,
          width: sidebar.getBoundingClientRect().width,
          height: sidebar.getBoundingClientRect().height,
        },
      } : { found: false },
      content: content ? {
        marginLeft: window.getComputedStyle(content.parentElement || content).marginLeft,
        width: content.getBoundingClientRect().width,
      } : { found: false },
      iframe: iframe ? {
        src: iframe.src,
        title: iframe.title,
        visible: window.getComputedStyle(iframe).display !== 'none',
        width: iframe.getBoundingClientRect().width,
        height: iframe.getBoundingClientRect().height,
      } : { found: false },
      allIframes: allIframes.map(f => ({
        src: f.src,
        title: f.title,
        width: f.getBoundingClientRect().width,
      })),
    };
  });

  console.log('\n📊 ESTADO COMPLETO:\n');
  console.log(JSON.stringify(state, null, 2));

  // Screenshot
  console.log('\n📸 Tomando screenshot...');
  await page.screenshot({
    path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_COPILOT_ABIERTO.png',
    fullPage: false,
  });

  console.log('✅ Screenshot: SCREENSHOT_COPILOT_ABIERTO.png');
  console.log('\n💡 Navegador sigue abierto y controlable vía MCP');

  await browser.close();
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
