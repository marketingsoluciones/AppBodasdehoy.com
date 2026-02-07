#!/usr/bin/env node

/**
 * Script para verificar si Playwright y Chromium están instalados correctamente
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYWRIGHT_CACHE = path.join(process.env.HOME || '', 'Library/Caches/ms-playwright');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║   Verificar Instalación de Playwright                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Verificar Playwright en node_modules
console.log('📦 Verificando Playwright...');
try {
  const playwrightPath = path.join(__dirname, '..', 'node_modules', '.bin', 'playwright');
  if (fs.existsSync(playwrightPath)) {
    console.log('   ✅ Playwright encontrado en node_modules');
  } else {
    console.log('   ❌ Playwright no encontrado en node_modules');
  }
} catch (e) {
  console.log('   ⚠️  No se pudo verificar node_modules');
}

// Verificar directorio de caché
console.log('\n📁 Verificando directorio de caché...');
if (fs.existsSync(PLAYWRIGHT_CACHE)) {
  console.log(`   ✅ Directorio encontrado: ${PLAYWRIGHT_CACHE}`);
  
  // Verificar Chromium específicamente
  const chromiumDirs = fs.readdirSync(PLAYWRIGHT_CACHE).filter(dir => dir.startsWith('chromium'));
  if (chromiumDirs.length > 0) {
    console.log(`   ✅ Chromium encontrado: ${chromiumDirs.join(', ')}`);
    
    // Verificar ejecutable
    for (const dir of chromiumDirs) {
      const chromiumPath = path.join(PLAYWRIGHT_CACHE, dir);
      const chromeApp = path.join(chromiumPath, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
      
      if (fs.existsSync(chromeApp)) {
        console.log(`   ✅ Ejecutable encontrado: ${chromeApp}`);
      } else {
        console.log(`   ⚠️  Ejecutable no encontrado en: ${chromiumPath}`);
        console.log(`   💡 Puede estar instalándose aún...`);
      }
    }
  } else {
    console.log('   ⚠️  Chromium no encontrado en el directorio de caché');
    console.log('   💡 Ejecuta: npx playwright install chromium');
  }
} else {
  console.log(`   ❌ Directorio no encontrado: ${PLAYWRIGHT_CACHE}`);
  console.log('   💡 Ejecuta: npx playwright install chromium');
}

// Intentar lanzar Chromium para verificar
console.log('\n🚀 Intentando lanzar Chromium...');
try {
  const browser = await chromium.launch({
    headless: true,
  });
  
  console.log('   ✅ Chromium se lanzó correctamente');
  console.log('   ✅ Playwright está completamente instalado y funcionando');
  
  await browser.close();
  
  console.log('\n✅ Todo listo! Puedes usar los scripts de Playwright:\n');
  console.log('   node scripts/ejecutar-tests-automatico.mjs 10');
  console.log('   node scripts/abrir-testsuite-playwright.mjs');
  console.log('   node scripts/ver-testsuite-cursor.mjs\n');
  
} catch (error) {
  console.log(`   ❌ Error al lanzar Chromium: ${error.message}`);
  
  if (error.message.includes('Executable doesn\'t exist')) {
    console.log('\n💡 Chromium no está completamente instalado.');
    console.log('   Ejecuta: npx playwright install chromium');
    console.log('   Tiempo estimado: 2-5 minutos\n');
  } else {
    console.log(`\n💡 Error: ${error.message}\n`);
  }
  
  process.exit(1);
}
