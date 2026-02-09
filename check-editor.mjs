#!/usr/bin/env node
import { chromium } from 'playwright';

async function checkEditor() {
  console.log('🔍 Verificando editor avanzado...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log(`   ✅ Página cargada\\n`);

    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(6000);
    console.log('   ✅ Copilot debería estar abierto\\n');

    await page.screenshot({ path: 'editor-check.png' });
    console.log('📸 Screenshot: editor-check.png\\n');

    const result = await page.evaluate(() => {
      // Buscar componentes del editor
      const allContentEditable = document.querySelectorAll('[contenteditable="true"]');
      const allTextareas = document.querySelectorAll('textarea');

      // Buscar por clase o atributos de @lobehub/editor
      const lexicalElements = document.querySelectorAll('[class*="lexical"]');
      const lobehubElements = document.querySelectorAll('[class*="lobehub"]');

      return {
        contentEditableCount: allContentEditable.length,
        textareasCount: allTextareas.length,
        lexicalElementsCount: lexicalElements.length,
        lobehubElementsCount: lobehubElements.length,
      };
    });

    console.log('📊 RESULTADO:\\n');
    console.log(`   ContentEditable elements: ${result.contentEditableCount}`);
    console.log(`   Textarea elements: ${result.textareasCount}`);
    console.log(`   Lexical elements: ${result.lexicalElementsCount}`);
    console.log(`   Lobehub elements: ${result.lobehubElementsCount}\\n`);

    if (result.contentEditableCount > 0 || result.lexicalElementsCount > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO DETECTADO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\\n');
      console.log('✅ Componentes de @lobehub/editor encontrados en el DOM\\n');
    } else if (result.textareasCount > 0) {
      console.log('⚠️  Solo se encontró textarea (editor simple)\\n');
    } else {
      console.log('❌ No se encontraron elementos de editor\\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEditor().catch(console.error);
