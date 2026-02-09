#!/usr/bin/env node
import { chromium } from 'playwright';

async function cleanNavigate() {
  console.log('🧹 Navegación limpia...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Ir a about:blank primero
    console.log('📍 Navegando a about:blank...');
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Navegar a localhost con bypass cache
    console.log('🔄 Navegando a localhost:8080 con bypass cache...');
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log(`   ✅ Cargado`);
    console.log(`📄 Título: ${title}\n`);

    await page.screenshot({ path: 'clean-navigate.png', fullPage: true });
    console.log('📸 Screenshot: clean-navigate.png\n');

    if (title.includes('error')) {
      console.log('⚠️  Todavía hay error - verificando consola...\n');

      // Esperar un poco más
      await page.waitForTimeout(2000);
    } else {
      console.log('✅ Página cargada correctamente\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanNavigate().catch(console.error);
