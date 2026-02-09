#!/usr/bin/env node
import { chromium } from 'playwright';

async function navigateToLocalhost() {
  console.log('🔄 Navegando a localhost:8080...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const currentUrl = page.url();
    console.log(`📍 URL actual: ${currentUrl}\n`);

    if (currentUrl.includes('localhost:8080')) {
      console.log('✅ Ya estás en localhost:8080\n');
    } else {
      console.log('🔄 Navegando a localhost:8080...');
      await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      console.log('   ✅ Navegación completada\n');
    }

    const title = await page.title();
    console.log(`📄 Título: ${title}`);
    console.log(`📍 URL final: ${page.url()}\n`);

    await page.screenshot({ path: 'localhost-home.png', fullPage: true });
    console.log('📸 Screenshot: localhost-home.png\n');

    console.log('ℹ️  Ahora necesitas:');
    console.log('   1. Hacer login con tus credenciales');
    console.log('   2. Crear o seleccionar un evento');
    console.log('   3. Abrir el Copilot haciendo click en el botón "Copilot" del header\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

navigateToLocalhost().catch(console.error);
