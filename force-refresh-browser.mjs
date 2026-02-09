#!/usr/bin/env node
import { chromium } from 'playwright';

async function forceRefresh() {
  console.log('🔄 Conectando al navegador para forzar refresh...\n');

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Conectado al navegador\n');

    const context = browser.contexts()[0];
    const page = context.pages()[0];

    console.log(`📍 URL actual: ${page.url()}\n`);

    // Limpiar caché y storage
    console.log('🧹 Limpiando caché del navegador...');
    await context.clearCookies();

    // Evaluar en el contexto del navegador para limpiar storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('   ✅ Caché limpiado\n');

    // Hard refresh con Cmd+Shift+R
    console.log('🔄 Ejecutando hard refresh (Cmd+Shift+R)...');
    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForTimeout(3000);

    console.log('   ✅ Página recargada con código fresco\n');

    // Verificar la URL final
    console.log(`📍 URL después del refresh: ${page.url()}\n`);

    console.log('✅ Refresh completado. El navegador ahora debe tener el código actualizado.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que Chrome esté abierto con debugging:');
    console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n');
  }
}

forceRefresh();
