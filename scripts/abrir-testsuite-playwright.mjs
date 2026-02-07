#!/usr/bin/env node

/**
 * Script para abrir TestSuite usando Playwright y visualizarlo desde Cursor
 * 
 * Características:
 * - Abre TestSuite en Chromium (headless: false para verlo)
 * - Toma screenshots automáticamente
 * - Lee contenido del DOM
 * - Permite interactuar con el TestSuite
 * - Guarda screenshots en .screenshots/
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configuración
const SCREENSHOT_DIR = path.join(PROJECT_ROOT, '.screenshots');
const STATE_FILE = path.join(PROJECT_ROOT, '.testsuite-state.json');

// Asegurar que el directorio de screenshots existe
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Determinar URL del TestSuite
function getTestSuiteUrl() {
  const envFile = path.join(PROJECT_ROOT, 'apps/web/.env.production');
  let chatUrl = 'https://chat-test.bodasdehoy.com';
  
  if (fs.existsSync(envFile)) {
    try {
      const content = fs.readFileSync(envFile, 'utf-8');
      const match = content.match(/^NEXT_PUBLIC_CHAT=(.+)$/m);
      if (match) {
        chatUrl = match[1].trim().replace(/['"]/g, '');
      }
    } catch (e) {
      console.warn('⚠️  No se pudo leer .env.production, usando URL por defecto');
    }
  }
  
  return `${chatUrl}/bodasdehoy/admin/tests`;
}

async function main() {
  const testSuiteUrl = getTestSuiteUrl();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Abrir TestSuite con Playwright                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL del TestSuite: ${testSuiteUrl}\n`);
  
  // Lanzar navegador
  console.log('🚀 Lanzando Chromium...');
  const browser = await chromium.launch({
    headless: false, // Mostrar navegador para verlo
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  // Interceptar requests para logging
  page.on('request', (request) => {
    if (request.url().includes('/api/admin/tests')) {
      console.log(`📡 Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', (response) => {
    if (response.url().includes('/api/admin/tests')) {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
    }
  });
  
  // Interceptar console logs
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[TestSuite]') || text.includes('error') || text.includes('Error')) {
      console.log(`📝 Console: ${text}`);
    }
  });
  
  // Navegar al TestSuite
  console.log(`\n🌐 Navegando a: ${testSuiteUrl}`);
  console.log('⏳ Esperando a que cargue...\n');
  
  try {
    await page.goto(testSuiteUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    // Esperar a que el contenido cargue
    await page.waitForTimeout(3000);
    
    // Verificar que cargó correctamente
    const pageTitle = await page.title();
    const url = page.url();
    
    console.log(`✅ Página cargada:`);
    console.log(`   Título: ${pageTitle}`);
    console.log(`   URL actual: ${url}\n`);
    
    // Verificar si hay errores visibles
    const errorElements = await page.$$('text=/error\\.title|error\\.desc/');
    if (errorElements.length > 0) {
      console.log('⚠️  ADVERTENCIA: Se detectaron marcadores de error sin resolver');
    }
    
    // Buscar elementos del TestSuite
    console.log('🔍 Analizando contenido del TestSuite...\n');
    
    // Buscar tabla de tests
    const table = await page.$('table');
    if (table) {
      console.log('✅ Tabla de tests encontrada');
      
      // Contar filas
      const rows = await page.$$('table tbody tr');
      console.log(`   Filas encontradas: ${rows.length}`);
      
      // Buscar checkboxes
      const checkboxes = await page.$$('input[type="checkbox"]');
      console.log(`   Checkboxes encontrados: ${checkboxes.length}`);
    } else {
      console.log('⚠️  No se encontró tabla de tests');
    }
    
    // Buscar botones
    const runButton = await page.$('button:has-text("Run Tests"), button:has-text("Ejecutar")');
    if (runButton) {
      console.log('✅ Botón "Run Tests" encontrado');
    }
    
    const resetButton = await page.$('button:has-text("Reset"), button:has-text("Reiniciar")');
    if (resetButton) {
      console.log('✅ Botón "Reset" encontrado');
    }
    
    // Buscar contador de tests
    const counterText = await page.textContent('body');
    const counterMatch = counterText.match(/(\d+)\s*tests?\s*(disponibles|available)/i);
    if (counterMatch) {
      console.log(`✅ Contador de tests: ${counterMatch[1]} tests disponibles`);
    }
    
    // Buscar estadísticas
    const statsElements = await page.$$('text=/passed|failed|pending|total/i');
    if (statsElements.length > 0) {
      console.log(`✅ Elementos de estadísticas encontrados: ${statsElements.length}`);
    }
    
    // Tomar screenshot inicial
    console.log('\n📸 Tomando screenshot...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = path.join(SCREENSHOT_DIR, `testsuite-${timestamp}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    console.log(`✅ Screenshot guardado: ${screenshotPath}`);
    
    // Guardar estado
    const state = {
      url: testSuiteUrl,
      timestamp: new Date().toISOString(),
      screenshot: screenshotPath,
      browser: 'chromium',
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`✅ Estado guardado: ${STATE_FILE}`);
    
    // Extraer información útil del DOM
    console.log('\n📊 Información extraída:');
    
    try {
      const pageInfo = await page.evaluate(() => {
        const table = document.querySelector('table');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean);
        
        return {
          hasTable: !!table,
          rowCount: rows.length,
          checkboxCount: checkboxes.length,
          buttons: buttons.slice(0, 10), // Primeros 10 botones
          url: window.location.href,
          title: document.title,
        };
      });
      
      console.log(JSON.stringify(pageInfo, null, 2));
    } catch (e) {
      console.log('⚠️  No se pudo extraer información del DOM (posible CORS)');
    }
    
    console.log('\n✅ TestSuite abierto y listo para usar');
    console.log('\n💡 Instrucciones:');
    console.log('   1. El navegador está abierto y visible');
    console.log('   2. Puedes interactuar con el TestSuite normalmente');
    console.log('   3. Los screenshots se guardan en .screenshots/');
    console.log('   4. Presiona Ctrl+C para cerrar el navegador\n');
    
    // Mantener el navegador abierto
    console.log('⏳ Manteniendo navegador abierto... (Ctrl+C para cerrar)\n');
    
    // Esperar hasta que se cierre
    await new Promise(() => {}); // Mantener abierto indefinidamente
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Tomar screenshot del error
    const errorScreenshot = path.join(SCREENSHOT_DIR, `error-${Date.now()}.png`);
    try {
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`📸 Screenshot del error guardado: ${errorScreenshot}`);
    } catch (e) {
      // Ignorar errores al tomar screenshot
    }
    
    await browser.close();
    process.exit(1);
  }
}

// Manejar señales para cerrar limpiamente
process.on('SIGINT', async () => {
  console.log('\n\n👋 Cerrando navegador...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Cerrando navegador...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
