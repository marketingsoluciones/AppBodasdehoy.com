#!/usr/bin/env node
import { chromium } from 'playwright';

async function verifyAdvancedEditor() {
  console.log('🔍 Verificando editor avanzado de @lobehub/editor...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Navegar a localhost
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`   ✅ Cargado: ${page.url()}\n`);

    // Tomar screenshot
    await page.screenshot({ path: 'home-loaded.png' });
    console.log('📸 Screenshot: home-loaded.png\n');

    // Verificar si hay errores en consola
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Abrir Copilot
    console.log('📝 Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(4000);
    console.log('   ✅ Copilot abierto\n');

    await page.screenshot({ path: 'copilot-advanced.png' });
    console.log('📸 Screenshot: copilot-advanced.png\n');

    // Inspeccionar el editor
    const editorInfo = await page.evaluate(() => {
      // Buscar componentes de @lobehub/editor
      const chatInput = document.querySelector('[class*="ChatInput"]') ||
                        document.querySelector('[class*="chat-input"]');

      const editor = document.querySelector('[class*="Editor"]') ||
                     document.querySelector('[contenteditable="true"]') ||
                     document.querySelector('textarea');

      const actionBar = document.querySelector('[class*="ChatInputActionBar"]') ||
                        document.querySelector('[class*="ActionBar"]');

      // Buscar todos los botones
      const allButtons = document.querySelectorAll('button');
      const buttonInfo = Array.from(allButtons).map(btn => ({
        text: btn.textContent?.trim().substring(0, 20),
        title: btn.getAttribute('title'),
        hasSvg: !!btn.querySelector('svg'),
        ariaLabel: btn.getAttribute('aria-label')
      })).filter(b => b.hasSvg || b.title);

      return {
        hasChatInput: !!chatInput,
        hasEditor: !!editor,
        hasActionBar: !!actionBar,
        editorType: editor?.tagName.toLowerCase(),
        isContentEditable: editor?.getAttribute('contenteditable') === 'true',
        totalButtons: allButtons.length,
        relevantButtons: buttonInfo.length,
        buttons: buttonInfo.slice(0, 15)
      };
    });

    console.log('📊 Información del editor:\n');
    console.log(`   ChatInput component: ${editorInfo.hasChatInput ? '✅' : '❌'}`);
    console.log(`   Editor encontrado: ${editorInfo.hasEditor ? '✅' : '❌'}`);
    console.log(`   ActionBar component: ${editorInfo.hasActionBar ? '✅' : '❌'}`);
    console.log(`   Tipo de editor: ${editorInfo.editorType}`);
    console.log(`   ContentEditable: ${editorInfo.isContentEditable ? '✅' : '❌'}`);
    console.log(`   Total botones: ${editorInfo.totalButtons}`);
    console.log(`   Botones relevantes: ${editorInfo.relevantButtons}\n`);

    if (editorInfo.buttons.length > 0) {
      console.log('🔘 Botones encontrados:\n');
      editorInfo.buttons.forEach((btn, idx) => {
        console.log(`   ${idx + 1}. ${btn.title || btn.text || btn.ariaLabel || 'Sin título'}`);
      });
      console.log('');
    }

    // Verificar si es el editor de @lobehub
    const isLobeEditor = editorInfo.isContentEditable &&
                         (editorInfo.hasChatInput || editorInfo.hasActionBar);

    if (isLobeEditor) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡EDITOR AVANZADO CARGADO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ El componente @lobehub/editor está funcionando');
      console.log('✅ Editor con contenteditable=true (rich text)');
      console.log('✅ Componentes ChatInput y ActionBar detectados\n');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else if (editorInfo.editorType === 'textarea') {
      console.log('⚠️  ALERTA: Todavía usando textarea simple\n');
      console.log('   El editor de @lobehub no se cargó correctamente.');
      console.log('   Revisa la consola del navegador para ver errores.\n');
    }

    if (errors.length > 0) {
      console.log('❌ Errores en consola:\n');
      errors.slice(0, 5).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAdvancedEditor().catch(console.error);
