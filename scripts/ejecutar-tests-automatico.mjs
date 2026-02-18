#!/usr/bin/env node

/**
 * Script para ejecutar tests del TestSuite automáticamente usando Playwright
 * 
 * Características:
 * - Abre TestSuite en Chromium
 * - Selecciona tests automáticamente
 * - Ejecuta tests
 * - Monitorea progreso
 * - Guarda resultados y screenshots
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SCREENSHOT_DIR = path.join(PROJECT_ROOT, '.screenshots');
const RESULTS_DIR = path.join(PROJECT_ROOT, '.test-results');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function getTestSuiteUrl() {
  // Objetivo: que el agente pueda abrir y hacer pruebas. app-test/chat-test no cargan en el navegador de Cursor; localhost sí.
  if (process.env.USE_LOCALHOST === '1' || process.env.AUTOMATION_LOCALHOST === '1') {
    return 'http://localhost:3210/bodasdehoy/admin/tests';
  }
  const envFile = path.join(PROJECT_ROOT, 'apps/web/.env.production');
  let chatUrl = 'http://localhost:3210';
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf-8');
      const match = content.match(/^NEXT_PUBLIC_CHAT=(.+)$/m);
      if (match) {
        chatUrl = match[1].trim().replace(/['"]/g, '');
      }
    } catch (e) {
      // Ignorar
    }
  }
  return `${chatUrl}/bodasdehoy/admin/tests`;
}

async function main() {
  const args = process.argv.slice(2);
  const testCount = parseInt(args[0]) || 10; // Por defecto ejecutar 10 tests
  const selectAll = args.includes('--all');
  
  const testSuiteUrl = getTestSuiteUrl();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Ejecutar Tests Automático                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL del TestSuite: ${testSuiteUrl}`);
  console.log(`📊 Tests a ejecutar: ${selectAll ? 'Todos' : testCount}\n`);
  
  try {
    console.log('🚀 Lanzando Chromium...');
    const browser = await chromium.launch({
      headless: false, // Visible para ver el progreso
      args: ['--start-maximized'],
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    // Interceptar console logs
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[TestSuite]') || text.includes('test') || text.includes('error')) {
        console.log(`📝 Console: ${text}`);
      }
    });
    
    // Navegar al TestSuite
    console.log(`\n🌐 Navegando a: ${testSuiteUrl}`);
    await page.goto(testSuiteUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(3000);
    
    console.log('✅ TestSuite cargado\n');
    
    // Verificar que la tabla existe
    const tableExists = await page.$('table') !== null;
    if (!tableExists) {
      throw new Error('No se encontró la tabla de tests. Verifica que el TestSuite cargó correctamente.');
    }
    
    console.log('🔍 Analizando tests disponibles...');
    
    // Contar tests disponibles
    const testRows = await page.$$('table tbody tr');
    const totalTests = testRows.length;
    console.log(`   Tests disponibles: ${totalTests}`);
    
    if (totalTests === 0) {
      throw new Error('No hay tests disponibles en la tabla');
    }
    
    // Seleccionar tests
    console.log(`\n📋 Seleccionando tests...`);
    
    if (selectAll) {
      // Seleccionar todos usando el checkbox del header
      const headerCheckbox = await page.$('table thead input[type="checkbox"]');
      if (headerCheckbox) {
        await headerCheckbox.click();
        console.log(`   ✅ Todos los tests seleccionados (${totalTests})`);
      } else {
        // Seleccionar manualmente todos los checkboxes
        const checkboxes = await page.$$('table tbody input[type="checkbox"]');
        for (const checkbox of checkboxes) {
          await checkbox.click();
        }
        console.log(`   ✅ Todos los tests seleccionados manualmente (${totalTests})`);
      }
    } else {
      // Seleccionar solo los primeros N tests
      const checkboxes = await page.$$('table tbody input[type="checkbox"]');
      const testsToSelect = Math.min(testCount, checkboxes.length);
      
      for (let i = 0; i < testsToSelect; i++) {
        await checkboxes[i].click();
      }
      console.log(`   ✅ ${testsToSelect} tests seleccionados`);
    }
    
    await page.waitForTimeout(1000);
    
    // Tomar screenshot antes de ejecutar
    const beforeScreenshot = path.join(SCREENSHOT_DIR, `tests-before-${Date.now()}.png`);
    await page.screenshot({ path: beforeScreenshot, fullPage: true });
    console.log(`📸 Screenshot antes: ${beforeScreenshot}`);
    
    // Buscar y hacer click en "Run Tests"
    console.log(`\n▶️  Ejecutando tests...`);
    
    const runButton = await page.$('button:has-text("Run Tests"), button:has-text("Ejecutar")');
    if (!runButton) {
      throw new Error('No se encontró el botón "Run Tests"');
    }
    
    await runButton.click();
    console.log('   ✅ Botón "Run Tests" presionado');
    
    // Esperar a que aparezca el banner de progreso
    console.log('   ⏳ Esperando banner de progreso...');
    try {
      await page.waitForSelector('text=/Ejecutando|Running|Progreso|Progress/i', {
        timeout: 10000,
      });
      console.log('   ✅ Banner de progreso visible');
    } catch (e) {
      console.log('   ⚠️  Banner de progreso no apareció (puede ser normal)');
    }
    
    // Monitorear progreso
    console.log('\n📊 Monitoreando ejecución...');
    
    let lastProgress = '';
    let completedTests = 0;
    const maxWaitTime = 300000; // 5 minutos máximo
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await page.waitForTimeout(2000);
      
      // Intentar leer el progreso
      try {
        const progressText = await page.textContent('body');
        const progressMatch = progressText.match(/(\d+)\s*\/\s*(\d+)/);
        
        if (progressMatch) {
          const current = parseInt(progressMatch[1]);
          const total = parseInt(progressMatch[2]);
          const progress = `${current} / ${total}`;
          
          if (progress !== lastProgress) {
            console.log(`   📈 Progreso: ${progress}`);
            lastProgress = progress;
            completedTests = current;
            
            // Si todos los tests están completos
            if (current >= total) {
              console.log('   ✅ Todos los tests completados');
              break;
            }
          }
        }
        
        // Verificar si hay botón "Stop" visible (significa que está ejecutando)
        const stopButton = await page.$('button:has-text("Stop"), button:has-text("Detener")');
        if (!stopButton) {
          // No hay botón stop, puede que haya terminado
          const runningIndicator = await page.$('text=/Ejecutando|Running/i');
          if (!runningIndicator) {
            console.log('   ✅ Ejecución completada');
            break;
          }
        }
      } catch (e) {
        // Continuar monitoreando
      }
    }
    
    // Tomar screenshot después de ejecutar
    await page.waitForTimeout(2000);
    const afterScreenshot = path.join(SCREENSHOT_DIR, `tests-after-${Date.now()}.png`);
    await page.screenshot({ path: afterScreenshot, fullPage: true });
    console.log(`📸 Screenshot después: ${afterScreenshot}`);
    
    // Extraer resultados
    console.log('\n📊 Extrayendo resultados...');
    
    try {
      const results = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
          const cells = row.querySelectorAll('td');
          const statusCell = Array.from(cells).find(cell => 
            cell.textContent.match(/passed|failed|running|pending/i)
          );
          const scoreCell = Array.from(cells).find(cell => 
            cell.textContent.match(/\d+%|\d+\/\d+/)
          );
          
          return {
            status: statusCell ? statusCell.textContent.trim() : 'unknown',
            score: scoreCell ? scoreCell.textContent.trim() : 'N/A',
          };
        }).filter(r => r.status !== 'unknown');
      });
      
      const passed = results.filter(r => r.status.toLowerCase().includes('pass')).length;
      const failed = results.filter(r => r.status.toLowerCase().includes('fail')).length;
      
      console.log(`   ✅ Tests pasados: ${passed}`);
      console.log(`   ❌ Tests fallidos: ${failed}`);
      console.log(`   📊 Total: ${results.length}`);
      
      // Guardar resultados
      const resultsFile = path.join(RESULTS_DIR, `results-${Date.now()}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        total: results.length,
        passed,
        failed,
        results,
      }, null, 2));
      console.log(`   💾 Resultados guardados: ${resultsFile}`);
    } catch (e) {
      console.log(`   ⚠️  No se pudieron extraer resultados: ${e.message}`);
    }
    
    console.log('\n✅ Ejecución completada');
    console.log('\n💡 El navegador permanecerá abierto para revisar resultados manualmente');
    console.log('   Presiona Ctrl+C para cerrar el navegador\n');
    
    // Mantener abierto para revisión manual
    await new Promise(() => {}); // Mantener abierto indefinidamente
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('Executable doesn\'t exist')) {
      console.log('\n💡 Playwright no está instalado. Ejecuta:');
      console.log('   npx playwright install chromium\n');
    }
    
    process.exit(1);
  }
}

// Manejar señales
process.on('SIGINT', async () => {
  console.log('\n\n👋 Cerrando...');
  process.exit(0);
});

main().catch(console.error);
