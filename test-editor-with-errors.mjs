#!/usr/bin/env node
import { chromium } from 'playwright';

async function testEditor() {
  console.log('🔍 Verificando el editor (incluyendo elementos ocultos)...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Capturar errores de consola
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Capturar errores de página
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log(`   ✅ URL: ${page.url()}\\n`);

    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(5000);
    console.log('   ✅ Copilot debería estar abierto\\n');

    await page.screenshot({ path: 'test-with-errors.png' });
    console.log('📸 Screenshot: test-with-errors.png\\n');

    // Inspeccionar el DOM SIN filtrar por visibilidad
    const result = await page.evaluate(() => {
      // Buscar TODOS los editores (visibles o no)
      const allContentEditable = document.querySelectorAll('[contenteditable="true"]');
      const allTextareas = document.querySelectorAll('textarea');

      // Buscar componentes de @lobehub
      const chatInputComp = document.querySelector('[class*="ChatInput"]');
      const actionBarComp = document.querySelector('[class*="ActionBar"]');

      // Buscar el componente CopilotInputEditorAdvanced por su estructura
      const lobehubEditor = document.querySelector('[class*="editor"]');

      // Obtener clases de los elementos encontrados
      const contentEditableClasses = Array.from(allContentEditable).map(el => el.className).slice(0, 3);
      const textareaClasses = Array.from(allTextareas).map(el => el.className).slice(0, 3);

      return {
        totalContentEditable: allContentEditable.length,
        totalTextareas: allTextareas.length,
        hasChatInputComp: !!chatInputComp,
        hasActionBarComp: !!actionBarComp,
        hasLobehubEditor: !!lobehubEditor,
        contentEditableClasses,
        textareaClasses,
        chatInputClass: chatInputComp?.className || null,
        actionBarClass: actionBarComp?.className || null,
      };
    });

    console.log('📊 RESULTADO (incluyendo elementos ocultos):\\n');
    console.log(`   Total ContentEditable en DOM: ${result.totalContentEditable}`);
    console.log(`   Total Textareas en DOM: ${result.totalTextareas}`);
    console.log(`   ChatInput component: ${result.hasChatInputComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ActionBar component: ${result.hasActionBarComp ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Editor component: ${result.hasLobehubEditor ? '✅ SÍ' : '❌ NO'}\\n`);

    if (result.contentEditableClasses.length > 0) {
      console.log('📝 Clases de ContentEditable:');
      result.contentEditableClasses.forEach((c, i) => console.log(`   ${i + 1}. ${c || 'Sin clase'}`));
      console.log('');
    }

    if (result.textareaClasses.length > 0) {
      console.log('📝 Clases de Textarea:');
      result.textareaClasses.forEach((c, i) => console.log(`   ${i + 1}. ${c || 'Sin clase'}`));
      console.log('');
    }

    if (result.chatInputClass) {
      console.log(`📝 ChatInput className: ${result.chatInputClass}\\n`);
    }

    if (result.actionBarClass) {
      console.log(`📝 ActionBar className: ${result.actionBarClass}\\n`);
    }

    // Mostrar errores
    if (consoleErrors.length > 0) {
      console.log('❌ ERRORES DE CONSOLA:\\n');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 200)}`);
      });
      console.log('');
    }

    if (pageErrors.length > 0) {
      console.log('❌ ERRORES DE PÁGINA:\\n');
      pageErrors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 200)}`);
      });
      console.log('');
    }

    if (consoleWarnings.length > 0) {
      console.log('⚠️  WARNINGS:\\n');
      consoleWarnings.slice(0, 5).forEach((warn, i) => {
        console.log(`   ${i + 1}. ${warn.substring(0, 200)}`);
      });
      console.log('');
    }

    // Análisis
    if (result.totalContentEditable > 0 && result.hasChatInputComp) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO EN EL DOM! 🎉');
      console.log('═══════════════════════════════════════════════════════════\\n');
      console.log('✅ El componente @lobehub/editor está en el DOM');
      console.log('✅ ChatInput component detectado\\n');
      if (consoleErrors.length === 0) {
        console.log('✅ Sin errores de JavaScript\\n');
      } else {
        console.log('⚠️  Hay errores en la consola - revisar arriba\\n');
      }
    } else if (result.totalTextareas > 0) {
      console.log('❌ Solo se encontró textarea (editor simple)\\n');
    } else {
      console.log('⚠️  No se encontró ningún editor en el DOM\\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEditor().catch(console.error);
