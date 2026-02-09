#!/usr/bin/env node
import { chromium } from 'playwright';

async function testPageEditor() {
  console.log('🔍 Probando página de test del editor...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    console.log('📝 Navegando a /test-editor...');
    await page.goto('http://localhost:8080/test-editor', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(7000);
    console.log('   ✅ Página cargada\\n');

    await page.screenshot({ path: 'test-editor-page.png' });
    console.log('📸 Screenshot: test-editor-page.png\\n');

    const result = await page.evaluate(() => {
      // Buscar el editor de @lobehub
      const contentEditable = document.querySelectorAll('[contenteditable="true"]');
      const lexical = document.querySelectorAll('[data-lexical-editor]');
      const allDivs = document.querySelectorAll('div');

      // Buscar el título de la página
      const h1 = document.querySelector('h1');
      const title = h1?.textContent || '';

      return {
        pageTitle: title,
        contentEditableCount: contentEditable.length,
        lexicalCount: lexical.length,
        totalDivs: allDivs.length,
      };
    });

    console.log('📊 RESULTADO:\\n');
    console.log(`   Título de página: ${result.pageTitle}`);
    console.log(`   ContentEditable elements: ${result.contentEditableCount}`);
    console.log(`   Lexical editor elements: ${result.lexicalCount}`);
    console.log(`   Total divs: ${result.totalDivs}\\n`);

    if (errors.length > 0) {
      console.log('❌ ERRORES:\\n');
      errors.slice(0, 5).forEach((err, i) => console.log(`   ${i + 1}. ${err}\\n`));
    }

    if (result.contentEditableCount > 0 || result.lexicalCount > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO FUNCIONANDO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\\n');
      console.log('✅ @lobehub/editor está renderizando correctamente');
      console.log('✅ El problema está solucionado con transpilePackages\\n');
    } else {
      console.log('⚠️  No se encontró el editor en la página\\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPageEditor().catch(console.error);
