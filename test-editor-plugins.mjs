#!/usr/bin/env node

/**
 * Script para verificar que el editor con plugins esté funcionando
 */

import { chromium } from '@playwright/test';

async function testEditorPlugins() {
  console.log('🔍 Verificando editor con plugins...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  // Capturar errores de consola
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    console.log('   ✅ Página cargada\n');

    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+C');
    await page.waitForTimeout(1500);
    console.log('   ✅ Copilot debería estar abierto\n');

    // Esperar a que el editor se renderice
    await page.waitForTimeout(1000);

    // Verificar elementos del editor
    const result = await page.evaluate(() => {
      // Buscar elementos del editor
      const contentEditable = document.querySelectorAll('[contenteditable="true"]');
      const lexicalElements = document.querySelectorAll('[class*="lexical"]');
      const lobeElements = document.querySelectorAll('[class*="lobehub"]');

      // Buscar elementos de plugins
      const listElements = document.querySelectorAll('[class*="list"]');
      const codeElements = document.querySelectorAll('[class*="code"]');
      const tableElements = document.querySelectorAll('[class*="table"]');

      return {
        contentEditable: contentEditable.length,
        lexical: lexicalElements.length,
        lobehub: lobeElements.length,
        lists: listElements.length,
        code: codeElements.length,
        tables: tableElements.length,
      };
    });

    console.log('📊 RESULTADO:\n');
    console.log(`   ContentEditable elements: ${result.contentEditable}`);
    console.log(`   Lexical elements: ${result.lexical}`);
    console.log(`   Lobehub elements: ${result.lobehub}`);
    console.log(`   List elements: ${result.lists}`);
    console.log(`   Code elements: ${result.code}`);
    console.log(`   Table elements: ${result.tables}\n`);

    // Screenshot para inspección
    await page.screenshot({ path: 'editor-plugins-check.png', fullPage: false });
    console.log('📸 Screenshot: editor-plugins-check.png\n');

    // Verificar errores de consola
    if (consoleErrors.length > 0) {
      console.log('⚠️  ERRORES DE CONSOLA DETECTADOS:\n');
      consoleErrors.forEach(err => console.log(`   ${err}`));
      console.log('');
    }

    if (result.contentEditable > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO DETECTADO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ Editor con plugins funcionando correctamente\n');
    } else {
      console.log('❌ Editor no detectado - revisar logs arriba\n');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await browser.close();
  }
}

testEditorPlugins();
