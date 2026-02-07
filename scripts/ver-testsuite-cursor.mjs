#!/usr/bin/env node

/**
 * Script para visualizar TestSuite desde Cursor usando Playwright
 * 
 * Este script:
 * - Abre TestSuite en modo headless
 * - Toma screenshots detallados
 * - Extrae información del DOM
 * - Muestra el contenido en la terminal
 * - Guarda screenshots para visualización en Cursor
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const SCREENSHOT_DIR = path.join(PROJECT_ROOT, '.screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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
      // Ignorar
    }
  }
  
  return `${chatUrl}/bodasdehoy/admin/tests`;
}

async function main() {
  const testSuiteUrl = getTestSuiteUrl();
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Visualizar TestSuite desde Cursor                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL: ${testSuiteUrl}\n`);
  
  const browser = await chromium.launch({
    headless: true, // Headless para screenshots rápidos
  });
  
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  
  try {
    console.log('🌐 Cargando TestSuite...');
    await page.goto(testSuiteUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    await page.waitForTimeout(2000);
    
    // Extraer información
    console.log('\n📊 Analizando contenido...\n');
    
    const info = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() : null;
      };
      
      const getCount = (selector) => {
        return document.querySelectorAll(selector).length;
      };
      
      return {
        title: document.title,
        url: window.location.href,
        hasTable: !!document.querySelector('table'),
        tableRows: getCount('table tbody tr'),
        checkboxes: getCount('input[type="checkbox"]'),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean),
        hasRunButton: !!document.querySelector('button:has-text("Run Tests"), button:has-text("Ejecutar")'),
        hasResetButton: !!document.querySelector('button:has-text("Reset"), button:has-text("Reiniciar")'),
        bodyText: document.body.innerText.substring(0, 500),
      };
    });
    
    console.log('✅ Información extraída:');
    console.log(JSON.stringify(info, null, 2));
    
    // Buscar contador de tests
    const bodyText = await page.textContent('body');
    const counterMatch = bodyText.match(/(\d+)\s*tests?\s*(disponibles|available)/i);
    if (counterMatch) {
      console.log(`\n📈 Tests disponibles: ${counterMatch[1]}`);
    }
    
    // Verificar errores de i18n
    if (bodyText.includes('error.title') || bodyText.includes('error.desc')) {
      console.log('\n⚠️  ADVERTENCIA: Se detectaron marcadores de error sin resolver');
    } else {
      console.log('\n✅ No se detectaron errores de i18n');
    }
    
    // Tomar screenshot
    console.log('\n📸 Tomando screenshot...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = path.join(SCREENSHOT_DIR, `testsuite-view-${timestamp}.png`);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    
    console.log(`✅ Screenshot guardado: ${screenshotPath}`);
    console.log(`\n💡 Puedes ver el screenshot en Cursor abriendo: ${screenshotPath}\n`);
    
    await browser.close();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    try {
      const errorScreenshot = path.join(SCREENSHOT_DIR, `error-${Date.now()}.png`);
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`📸 Screenshot del error: ${errorScreenshot}`);
    } catch (e) {
      // Ignorar
    }
    
    await browser.close();
    process.exit(1);
  }
}

main().catch(console.error);
