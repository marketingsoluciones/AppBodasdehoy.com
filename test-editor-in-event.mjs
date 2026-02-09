#!/usr/bin/env node
import { chromium } from 'playwright';

async function testEditorInEvent() {
  console.log('🔍 Probando editor en evento...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Navegar directamente a resumen-evento
    console.log('📝 Navegando a /resumen-evento...');
    await page.goto('http://localhost:8080/resumen-evento', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`   ✅ URL: ${page.url()}\n`);

    await page.screenshot({ path: 'resumen-evento.png' });
    console.log('📸 Screenshot: resumen-evento.png\n');

    // Abrir Copilot
    console.log('📝 Abriendo Copilot...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(4000);
    console.log('   ✅ Abierto\n');

    await page.screenshot({ path: 'copilot-with-editor.png' });
    console.log('📸 Screenshot: copilot-with-editor.png\n');

    // Inspeccionar editor
    const result = await page.evaluate(() => {
      // Buscar editor contenteditable (de @lobehub/editor)
      const contentEditableEditor = document.querySelector('[contenteditable="true"]');

      // Buscar textarea (editor simple)
      const textareaEditor = document.querySelector('textarea');

      // Buscar componentes de @lobehub
      const chatInputComp = document.querySelector('[class*="ChatInput"]');
      const actionBarComp = document.querySelector('[class*="ActionBar"]');

      // Contar botones
      const allButtons = document.querySelectorAll('button');
      const buttonsWithSvg = Array.from(allButtons).filter(btn => btn.querySelector('svg'));

      return {
        hasContentEditable: !!contentEditableEditor,
        hasTextarea: !!textareaEditor,
        hasChatInputComp: !!chatInputComp,
        hasActionBarComp: !!actionBarComp,
        editorType: contentEditableEditor ? 'contenteditable (LOBEHUB)' :
                   textareaEditor ? 'textarea (SIMPLE)' : 'NO ENCONTRADO',
        totalButtons: allButtons.length,
        svgButtons: buttonsWithSvg.length,
        placeholder: contentEditableEditor?.getAttribute('aria-placeholder') ||
                    textareaEditor?.placeholder ||
                    'N/A'
      };
    });

    console.log('📊 RESULTADO:\n');
    console.log(`   Editor type: ${result.editorType}`);
    console.log(`   ContentEditable: ${result.hasContentEditable ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Textarea: ${result.hasTextarea ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ChatInput component: ${result.hasChatInputComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ActionBar component: ${result.hasActionBarComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Placeholder: "${result.placeholder}"`);
    console.log(`   Total botones: ${result.totalButtons}`);
    console.log(`   Botones con SVG: ${result.svgButtons}\n`);

    if (result.hasContentEditable && !result.hasTextarea) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡ÉXITO! EDITOR AVANZADO ACTIVO 🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ @lobehub/editor está funcionando correctamente');
      console.log('✅ Editor con contenteditable=true (rich text editor)');
      console.log('✅ NO hay textarea simple\n');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else if (result.hasTextarea && !result.hasContentEditable) {
      console.log('❌ FALLO: Todavía usando el editor simple con textarea\n');
      console.log('   El componente CopilotInputEditorAdvanced no se cargó.\n');
      console.log('   Posibles causas:');
      console.log('   - Error de compilación/importación');
      console.log('   - Caché del navegador');
      console.log('   - Build anterior cargado\n');
    } else if (result.hasTextarea && result.hasContentEditable) {
      console.log('⚠️  AMBOS editores presentes (puede ser transición)\n');
    } else {
      console.log('❌ NO se encontró ningún editor\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEditorInEvent().catch(console.error);
