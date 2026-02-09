#!/usr/bin/env node
import { chromium } from 'playwright';

async function forceClearCacheCDP() {
  console.log('🧹 Limpiando caché completo con CDP...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Usar CDP directamente para limpiar todo
    const client = await context.newCDPSession(page);

    console.log('🗑️  Limpiando Cache Storage...');
    await client.send('Network.clearBrowserCache');

    console.log('🗑️  Limpiando Cookies...');
    await client.send('Network.clearBrowserCookies');

    console.log('🗑️  Deshabilitando caché para esta sesión...');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    console.log('✅ Caché limpiado\n');

    // Navegar a about:blank
    console.log('📍 Navegando a about:blank...');
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Navegar a localhost
    console.log('🔄 Navegando a localhost:8080 sin caché...');
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const title = await page.title();
    const url = page.url();

    console.log(`   ✅ Cargado`);
    console.log(`📍 URL: ${url}`);
    console.log(`📄 Título: ${title}\n`);

    await page.screenshot({ path: 'after-cdp-cache-clear.png', fullPage: true });
    console.log('📸 Screenshot: after-cdp-cache-clear.png\n');

    if (!title.includes('error')) {
      console.log('✅ ¡Página cargada sin errores!\n');
    } else {
      console.log('⚠️  Todavía hay error en la página\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceClearCacheCDP().catch(console.error);
