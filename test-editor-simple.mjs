#!/usr/bin/env node
import { chromium } from 'playwright';

async function testEditor() {
  console.log('🔍 Probando si el editor avanzado se carga...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Navegar a localhost:8080
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log(`   ✅ URL: ${page.url()}\\n`);

    // Verificar que la página se haya cargado
    const title = await page.title();
    console.log(`📄 Título: ${title}\\n`);

    // Abrir Copilot con el atajo de teclado
    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(5000); // Esperar más tiempo
    console.log('   ⏳ Esperando que se abra...\\n');

    // Tomar screenshot
    await page.screenshot({ path: 'test-editor-check.png' });
    console.log('📸 Screenshot: test-editor-check.png\\n');

    // Inspeccionar el DOM completo buscando el editor
    const result = await page.evaluate(() => {
      // Buscar diferentes tipos de editores
      const contentEditableEditor = document.querySelector('[contenteditable="true"]');
      const textareaEditor = document.querySelector('textarea');
      const chatInputComp = document.querySelector('[class*="ChatInput"]') ||
                            document.querySelector('[class*="chat-input"]');
      const actionBarComp = document.querySelector('[class*="ActionBar"]') ||
                            document.querySelector('[class*="action-bar"]');

      // Buscar el componente Copilot
      const copilotChat = document.querySelector('[class*="CopilotChat"]') ||
                          document.querySelector('[class*="copilot"]');

      // Buscar cualquier editor visible
      const allTextareas = Array.from(document.querySelectorAll('textarea'));
      const visibleTextareas = allTextareas.filter(ta => {
        const style = window.getComputedStyle(ta);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      // Buscar cualquier contenteditable visible
      const allContentEditable = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      const visibleContentEditable = allContentEditable.filter(ce => {
        const style = window.getComputedStyle(ce);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      return {
        hasContentEditable: !!contentEditableEditor,
        hasTextarea: !!textareaEditor,
        hasChatInputComp: !!chatInputComp,
        hasActionBarComp: !!actionBarComp,
        hasCopilotChat: !!copilotChat,
        visibleTextareasCount: visibleTextareas.length,
        visibleContentEditableCount: visibleContentEditable.length,
        textareaPlaceholders: visibleTextareas.map(ta => ta.placeholder).slice(0, 3),
        contentEditablePlaceholders: visibleContentEditable.map(ce =>
          ce.getAttribute('aria-placeholder') || ce.getAttribute('placeholder')
        ).slice(0, 3),
      };
    });

    console.log('📊 RESULTADO:\\n');
    console.log(`   ContentEditable encontrado: ${result.hasContentEditable ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Textarea encontrado: ${result.hasTextarea ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ChatInput component: ${result.hasChatInputComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ActionBar component: ${result.hasActionBarComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Copilot component: ${result.hasCopilotChat ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Textareas visibles: ${result.visibleTextareasCount}`);
    console.log(`   ContentEditable visibles: ${result.visibleContentEditableCount}\\n`);

    if (result.textareaPlaceholders.length > 0) {
      console.log('📝 Placeholders de textarea:');
      result.textareaPlaceholders.forEach((p, i) => console.log(`   ${i + 1}. ${p || 'Sin placeholder'}`));
      console.log('');
    }

    if (result.contentEditablePlaceholders.length > 0) {
      console.log('📝 Placeholders de contentEditable:');
      result.contentEditablePlaceholders.forEach((p, i) => console.log(`   ${i + 1}. ${p || 'Sin placeholder'}`));
      console.log('');
    }

    // Verificar resultado
    if (result.visibleContentEditableCount > 0 && result.visibleTextareasCount === 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO CARGADO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\\n');
      console.log('✅ El editor de @lobehub (contenteditable) está funcionando');
      console.log('✅ NO hay textarea simple\\n');
    } else if (result.visibleTextareasCount > 0 && result.visibleContentEditableCount === 0) {
      console.log('❌ FALLO: Todavía usando editor simple con textarea\\n');
      console.log('   CopilotInputEditorAdvanced no se cargó correctamente.\\n');
    } else if (result.visibleTextareasCount === 0 && result.visibleContentEditableCount === 0) {
      console.log('⚠️  NO se encontró ningún editor visible\\n');
      console.log('   Posibles causas:');
      console.log('   - El Copilot no se abrió');
      console.log('   - El usuario no está logueado (requiere sesión)');
      console.log('   - Error en el componente\\n');
    } else {
      console.log('⚠️  Situación ambigua: hay ambos tipos de editores\\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEditor().catch(console.error);
