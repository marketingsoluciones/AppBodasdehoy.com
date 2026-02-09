#!/usr/bin/env node
import { chromium } from 'playwright';

async function simpleReload() {
  console.log('🔄 Recargando página sin limpiar sesión...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL actual: ${page.url()}\n`);

    // Simplemente recargar la página
    console.log('🔄 Recargando...');
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForTimeout(2000);

    const newUrl = page.url();
    const title = await page.title();

    console.log(`   ✅ Recargado`);
    console.log(`📍 URL: ${newUrl}`);
    console.log(`📄 Título: ${title}\n`);

    await page.screenshot({ path: 'after-simple-reload.png', fullPage: true });
    console.log('📸 Screenshot: after-simple-reload.png\n');

    console.log('✅ Listo');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleReload().catch(console.error);
