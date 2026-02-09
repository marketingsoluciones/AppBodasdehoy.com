#!/usr/bin/env node

import { chromium } from '@playwright/test';

async function captureEditor() {
  console.log('📸 Capturando screenshot del editor del Copilot...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    console.log('   ✅ Página cargada\n');

    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+C');
    await page.waitForTimeout(2000);
    console.log('   ✅ Copilot abierto\n');

    // Esperar a que el editor se renderice
    await page.waitForTimeout(1000);

    // Capturar screenshot del área del Copilot
    console.log('📸 Capturando screenshot...');
    await page.screenshot({ 
      path: 'copilot-editor-current.png',
      fullPage: false 
    });
    console.log('   ✅ Screenshot guardado: copilot-editor-current.png\n');

    // También capturar solo el área del editor si es posible
    const editorElement = await page.$('[contenteditable="true"]');
    if (editorElement) {
      await editorElement.screenshot({ path: 'editor-input-current.png' });
      console.log('   ✅ Screenshot del input guardado: editor-input-current.png\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureEditor();
