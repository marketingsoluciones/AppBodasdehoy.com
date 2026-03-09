#!/usr/bin/env node

/**
 * Script para ejecutar tests del TestSuite desde el navegador usando Playwright
 * 
 * Uso:
 *   node scripts/test-navegador-playwright.mjs [url] [num-tests]
 * 
 * Ejemplo:
 *   node scripts/test-navegador-playwright.mjs https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests 10
 */

// Intentar importar desde diferentes ubicaciones
let chromium;
try {
  // Intentar desde apps/chat-ia primero
  const playwrightPath = require.resolve('playwright', { paths: ['./apps/chat-ia/node_modules'] });
  const playwright = require(playwrightPath);
  chromium = playwright.chromium;
} catch (e) {
  try {
    // Intentar desde raíz
    const playwright = require('playwright');
    chromium = playwright.chromium;
  } catch (e2) {
    console.error('❌ Playwright no encontrado. Instala con: cd apps/chat-ia && npx playwright install chromium');
    process.exit(1);
  }
}

const TESTSUITE_URL = process.argv[2] || 'https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests';
const NUM_TESTS = parseInt(process.argv[3] || '10', 10);

console.log('🧪 Ejecutando tests en navegador...');
console.log(`📍 URL: ${TESTSUITE_URL}`);
console.log(`📊 Tests a ejecutar: ${NUM_TESTS}`);

(async () => {
  let browser;
  try {
    // Lanzar navegador (visible para que el usuario vea)
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 100, // Ralentizar acciones para mejor visualización
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    
    const page = await context.newPage();

    // Navegar al TestSuite
    console.log(`\n🌐 Abriendo: ${TESTSUITE_URL}`);
    await page.goto(TESTSUITE_URL, { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // Esperar a que cargue el TestSuite
    console.log('⏳ Esperando a que cargue el TestSuite...');
    
    // Esperar a que aparezca el título o la tabla
    try {
      await page.waitForSelector('h2:has-text("Test Suite"), table, [data-testid="test-suite"]', { 
        timeout: 30000 
      });
      console.log('✅ TestSuite cargado');
    } catch (error) {
      console.log('⚠️  No se encontró el selector esperado, continuando...');
    }

    // Esperar un poco más para que carguen los tests
    await page.waitForTimeout(3000);

    // Verificar cuántos tests hay disponibles
    const testCount = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
      return checkboxes.length;
    });
    
    console.log(`📋 Tests disponibles: ${testCount}`);
    
    if (testCount === 0) {
      console.log('⚠️  No hay tests disponibles. Verifica:');
      console.log('   1. Que el backend esté corriendo');
      console.log('   2. Que tengas autenticación válida');
      console.log('   3. Que haya tests en la base de datos');
      
      // Tomar screenshot del estado actual
      await page.screenshot({ path: '/tmp/testsuite-no-tests.png', fullPage: true });
      console.log('📸 Screenshot guardado en: /tmp/testsuite-no-tests.png');
      
      await browser.close();
      return;
    }

    // Seleccionar los primeros N tests
    const testsToSelect = Math.min(NUM_TESTS, testCount);
    console.log(`\n✅ Seleccionando los primeros ${testsToSelect} tests...`);
    
    const checkboxes = await page.$$('tbody input[type="checkbox"]');
    for (let i = 0; i < testsToSelect; i++) {
      await checkboxes[i].check();
      if ((i + 1) % 10 === 0) {
        console.log(`   ${i + 1}/${testsToSelect} seleccionados...`);
      }
    }
    
    console.log(`✅ ${testsToSelect} tests seleccionados`);

    // Buscar y hacer click en el botón "Run Tests"
    console.log('\n🚀 Ejecutando tests...');
    
    // Esperar un momento para que se actualice el estado
    await page.waitForTimeout(500);
    
    // Buscar el botón "Run Tests" o "Run Tests (X)"
    const runButton = await page.$('button:has-text("Run Tests")');
    
    if (!runButton) {
      console.log('⚠️  No se encontró el botón "Run Tests"');
      console.log('💡 Verificando botones disponibles...');
      
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(b => b.textContent?.trim()).filter(Boolean)
      );
      console.log(`   Botones encontrados: ${buttons.join(', ')}`);
      
      await browser.close();
      return;
    }

    // Verificar que el botón esté habilitado
    const isDisabled = await runButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️  El botón "Run Tests" está deshabilitado');
      console.log('💡 Verifica que hay tests seleccionados');
      await browser.close();
      return;
    }

    // Hacer click en el botón
    await runButton.click();
    console.log('✅ Botón "Run Tests" presionado');

    // Esperar a que aparezca el indicador de ejecución
    console.log('\n⏳ Esperando a que inicien los tests...');
    try {
      await page.waitForSelector('text=/Ejecutando tests|Running tests|🚀/', { 
        timeout: 10000 
      });
      console.log('✅ Tests iniciados');
    } catch (error) {
      console.log('⚠️  No se encontró el indicador de ejecución, pero continuando...');
    }

    // Monitorear el progreso
    console.log('\n📊 Monitoreando progreso...');
    let lastProgress = '';
    let checkCount = 0;
    const maxChecks = 300; // Máximo 5 minutos (300 * 1 segundo)
    
    while (checkCount < maxChecks) {
      await page.waitForTimeout(1000);
      checkCount++;
      
      // Verificar si hay un indicador de progreso
      const progress = await page.evaluate(() => {
        const progressEl = document.querySelector('text=/Progreso|Progress/');
        const stopButton = document.querySelector('button:has-text("Stop")');
        
        if (stopButton) {
          return 'running';
        }
        
        if (progressEl) {
          return progressEl.textContent;
        }
        
        return 'unknown';
      });
      
      if (progress !== lastProgress && progress !== 'unknown') {
        console.log(`   ${progress}`);
        lastProgress = progress;
      }
      
      // Verificar si los tests terminaron (no hay botón Stop)
      const stopButton = await page.$('button:has-text("Stop")');
      if (!stopButton && checkCount > 5) {
        console.log('\n✅ Tests completados');
        break;
      }
      
      // Mostrar progreso cada 10 segundos
      if (checkCount % 10 === 0) {
        console.log(`   ⏳ Esperando... (${checkCount}s)`);
      }
    }

    // Tomar screenshot del resultado final
    console.log('\n📸 Tomando screenshot del resultado...');
    await page.waitForTimeout(2000); // Esperar a que se actualice la UI
    await page.screenshot({ path: '/tmp/testsuite-result.png', fullPage: true });
    console.log('✅ Screenshot guardado en: /tmp/testsuite-result.png');

    // Mostrar resultados finales
    console.log('\n📊 Resultados finales:');
    const results = await page.evaluate(() => {
      const stats = Array.from(document.querySelectorAll('span, div')).find(el => 
        el.textContent?.includes('passed') || el.textContent?.includes('failed')
      );
      
      const tableRows = Array.from(document.querySelectorAll('tbody tr'));
      const passed = tableRows.filter(row => 
        row.textContent?.includes('passed')
      ).length;
      const failed = tableRows.filter(row => 
        row.textContent?.includes('failed')
      ).length;
      
      return {
        statsText: stats?.textContent || 'No encontrado',
        passed,
        failed,
        total: tableRows.length,
      };
    });
    
    console.log(`   Estadísticas: ${results.statsText}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Total: ${results.total}`);

    // Mantener el navegador abierto por 15 segundos más para que el usuario vea los resultados
    console.log('\n⏳ Manteniendo navegador abierto por 15 segundos más...');
    console.log('💡 Puedes cerrar el navegador manualmente si quieres');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error ejecutando tests:', error.message);
    
    if (browser) {
      // Tomar screenshot del error
      try {
        const page = await browser.newPage();
        await page.screenshot({ path: '/tmp/testsuite-error.png', fullPage: true });
        console.log('📸 Screenshot del error guardado en: /tmp/testsuite-error.png');
      } catch (e) {
        // Ignorar errores al tomar screenshot
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n✅ Completado');
})();
