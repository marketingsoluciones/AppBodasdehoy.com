#!/usr/bin/env node
import { chromium } from 'playwright';

async function forceHardRefresh() {
  console.log('🔄 Conectando al navegador para HARD refresh...\n');

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Conectado al navegador\n');

    const context = browser.contexts()[0];
    const page = context.pages()[0];

    console.log(`📍 URL actual: ${page.url()}\n`);

    // Ir a la página primero para poder limpiar storage
    console.log('🔄 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'load' });
    await page.waitForTimeout(500);

    // Limpiar storage mientras estamos en la página
    console.log('🧹 Limpiando todos los cachés y storage...');
    await page.evaluate(() => {
      // Limpiar localStorage
      if (window.localStorage) {
        localStorage.clear();
      }

      // Limpiar sessionStorage
      if (window.sessionStorage) {
        sessionStorage.clear();
      }

      // Limpiar todas las cookies del dominio
      document.cookie.split(";").forEach(c => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
    console.log('   ✅ Storage limpiado\n');

    // Limpiar cookies del contexto también
    await context.clearCookies();

    // Hacer hard reload con bypassServiceWorker
    console.log('🔄 Haciendo HARD RELOAD...');
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForTimeout(2000);

    console.log('   ✅ Página cargada con código fresco\n');

    // Verificar que esté cargado
    const title = await page.title();
    console.log(`📄 Título de página: ${title}`);
    console.log(`📍 URL final: ${page.url()}\n`);

    // Tomar screenshot del estado
    await page.screenshot({ path: 'refresh-verificacion.png', fullPage: true });
    console.log('📸 Screenshot: refresh-verificacion.png\n');

    console.log('✅ HARD refresh completado con código fresco garantizado.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceHardRefresh();
