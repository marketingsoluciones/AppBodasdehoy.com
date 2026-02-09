#!/usr/bin/env node
import { chromium } from 'playwright';

async function inspectCopilot() {
  console.log('🔍 Inspeccionando Copilot en detalle...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Capturar mensajes de consola
  const logs = { errors: [], warnings: [], info: [] };
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') logs.errors.push(text);
    else if (msg.type() === 'warning') logs.warnings.push(text);
    else if (text.includes('CopilotInputEditor') || text.includes('lobehub') || text.includes('Editor')) {
      logs.info.push(text);
    }
  });

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log('📝 Abriendo Copilot...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(7000);

    await page.screenshot({ path: 'copilot-inspect.png' });
    console.log('📸 Screenshot guardado\\n');

    // Inspección profunda del DOM
    const result = await page.evaluate(() => {
      // Buscar TODOS los divs que puedan contener el editor
      const allDivs = document.querySelectorAll('div');
      const suspiciousDivs = Array.from(allDivs).filter(div => {
        const text = div.textContent || '';
        const className = div.className || '';
        return text.includes('Escribe') ||
               className.includes('editor') ||
               className.includes('input') ||
               className.includes('chat');
      }).length;

      // Buscar elementos relacionados con el editor
      const lexical = document.querySelectorAll('[class*="Lexical"], [class*="lexical"]');
      const contentEditable = document.querySelectorAll('[contenteditable]');
      const textareas = document.querySelectorAll('textarea');
      const inputs = document.querySelectorAll('input[type="text"]');

      // Buscar por data attributes
      const dataEditor = document.querySelectorAll('[data-lexical-editor]');

      // Buscar componentes React por sus displayNames en el DOM
      const reactRoot = document.querySelector('#__next');

      return {
        suspiciousDivs,
        lexicalCount: lexical.length,
        contentEditableCount: contentEditable.length,
        textareasCount: textareas.length,
        inputsCount: inputs.length,
        dataEditorCount: dataEditor.length,
        hasReactRoot: !!reactRoot,
        bodyHTML: document.body.innerHTML.substring(0, 500),
      };
    });

    console.log('📊 RESULTADOS DE INSPECCIÓN:\\n');
    console.log(`   Divs sospechosos (editor/input/chat): ${result.suspiciousDivs}`);
    console.log(`   Elementos Lexical: ${result.lexicalCount}`);
    console.log(`   ContentEditable: ${result.contentEditableCount}`);
    console.log(`   Textareas: ${result.textareasCount}`);
    console.log(`   Inputs de texto: ${result.inputsCount}`);
    console.log(`   Data-lexical-editor: ${result.dataEditorCount}`);
    console.log(`   React root existe: ${result.hasReactRoot}\\n`);

    // Mostrar errores
    if (logs.errors.length > 0) {
      console.log('❌ ERRORES DE CONSOLA:\\n');
      logs.errors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 150)}`);
      });
      console.log('');
    }

    if (logs.warnings.length > 0) {
      console.log('⚠️  WARNINGS:\\n');
      logs.warnings.slice(0, 3).forEach((warn, i) => {
        console.log(`   ${i + 1}. ${warn.substring(0, 150)}`);
      });
      console.log('');
    }

    if (logs.info.length > 0) {
      console.log('ℹ️  INFO RELEVANTE:\\n');
      logs.info.forEach((info, i) => {
        console.log(`   ${i + 1}. ${info}`);
      });
      console.log('');
    }

    // Análisis
    if (result.dataEditorCount > 0 || result.lexicalCount > 0) {
      console.log('✅ Editor de @lobehub/editor (Lexical) está en el DOM!\\n');
    } else if (result.contentEditableCount > 0) {
      console.log('✅ Hay contentEditable en el DOM (podría ser el editor)\\n');
    } else if (result.textareasCount > 0) {
      console.log('⚠️  Solo se encontró textarea (editor simple)\\n');
    } else {
      console.log('❌ No se detectó ningún editor\\n');
      console.log('Posibles causas:');
      console.log('- El componente CopilotChatNative no se renderizó');
      console.log('- Error de importación de @lobehub/editor');
      console.log('- El usuario no está logueado y el editor está oculto\\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectCopilot().catch(console.error);
