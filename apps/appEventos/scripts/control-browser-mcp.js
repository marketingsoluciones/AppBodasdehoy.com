#!/usr/bin/env node
/**
 * Conecta al navegador existente vía CDP y lo controla
 */

const { chromium } = require('playwright');

(async () => {
  console.log('📡 Conectando al navegador vía CDP (puerto 9222)...');

  try {
    // Conectar al navegador usando CDP
    const browser = await chromium.connectOverCDP('http://localhost:9222');

    console.log('✅ Conectado al navegador');

    // Obtener el contexto y página existentes
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      console.error('❌ No hay contextos en el navegador');
      await browser.close();
      return;
    }

    const context = contexts[0];
    const pages = context.pages();

    if (pages.length === 0) {
      console.error('❌ No hay páginas abiertas');
      await browser.close();
      return;
    }

    const page = pages[0];
    const url = await page.url();

    console.log(`📄 Página actual: ${url}`);

    // Abrir copilot con Cmd+Shift+C
    console.log('🤖 Abriendo copilot...');
    await page.keyboard.press('Meta+Shift+C');

    // Esperar a que el copilot cargue
    await page.waitForTimeout(5000);

    // Capturar estado del copilot
    console.log('📊 Capturando estado del copilot...');

    const state = await page.evaluate(() => {
      const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="motion"]');
      const content = document.querySelector('#rootElementMain');
      const iframe = document.querySelector('iframe[title*="Copilot"], iframe[src*="3210"]');

      return {
        sidebar: sidebar ? {
          className: sidebar.className,
          visible: window.getComputedStyle(sidebar).display !== 'none',
          left: sidebar.getBoundingClientRect().left,
          width: sidebar.getBoundingClientRect().width,
        } : { found: false },
        content: content ? {
          marginLeft: window.getComputedStyle(content.parentElement).marginLeft,
          width: content.getBoundingClientRect().width,
        } : { found: false },
        iframe: iframe ? {
          src: iframe.src,
          width: iframe.getBoundingClientRect().width,
          height: iframe.getBoundingClientRect().height,
        } : { found: false },
      };
    });

    console.log('\n📊 ESTADO DEL COPILOT:\n');
    console.log(JSON.stringify(state, null, 2));

    // Tomar screenshot
    console.log('\n📸 Tomando screenshot...');
    await page.screenshot({
      path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/SCREENSHOT_MCP.png',
      fullPage: false,
    });

    console.log('✅ Screenshot guardado: SCREENSHOT_MCP.png');

    // NO cerrar el navegador - mantenerlo abierto para seguir controlándolo
    console.log('\n✅ Control MCP completado');
    console.log('💡 El navegador sigue abierto y disponible para más comandos');

    // Desconectar pero no cerrar
    await browser.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
