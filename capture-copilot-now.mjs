#!/usr/bin/env node

import { chromium } from '@playwright/test';

async function captureNow() {
  console.log('📸 Capturando estado actual del Copilot...\n');

  const browser = await chromium.launch({ 
    headless: false,  // Mostrar navegador
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('   ✅ Página cargada\n');

    console.log('📝 Esperando 3 segundos...');
    await page.waitForTimeout(3000);

    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+C');
    await page.waitForTimeout(3000);
    console.log('   ✅ Copilot abierto\n');

    console.log('📸 Capturando screenshot completo...');
    await page.screenshot({ 
      path: 'CAPTURA-COPILOT-ACTUAL.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot guardado: CAPTURA-COPILOT-ACTUAL.png\n');

    console.log('⏸️  Dejando navegador abierto por 10 segundos para inspección manual...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureNow();
