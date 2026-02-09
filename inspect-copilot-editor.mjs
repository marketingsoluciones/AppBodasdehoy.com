#!/usr/bin/env node
import { chromium } from 'playwright';

async function inspectCopilotEditor() {
  console.log('🔍 Inspeccionando componente del editor Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const currentUrl = page.url();
    console.log(`📍 URL actual: ${currentUrl}\n`);

    // Buscar el textarea del editor
    console.log('📝 Buscando textarea del editor...');
    const textareaInfo = await page.evaluate(() => {
      const textarea = document.querySelector('textarea[placeholder*="Escribe tu mensaje"]');

      if (!textarea) return { found: false };

      // Get parent elements to understand structure
      const container = textarea.closest('[style*="borderRadius"]') || textarea.parentElement;
      const actionBar = container?.querySelector('[style*="borderBottom"], div:has(button)');

      // Get all buttons in action bar
      const buttons = actionBar ? Array.from(actionBar.querySelectorAll('button')) : [];

      return {
        found: true,
        placeholder: textarea.placeholder,
        containerHTML: container?.outerHTML.substring(0, 1000),
        buttonCount: buttons.length,
        buttons: buttons.map(btn => ({
          innerHTML: btn.innerHTML.substring(0, 200),
          title: btn.title || btn.getAttribute('title'),
          className: btn.className,
          textContent: btn.textContent?.substring(0, 50),
        })),
      };
    });

    if (!textareaInfo.found) {
      console.log('   ❌ Textarea no encontrado');
      console.log('   ℹ️  El Copilot podría no estar abierto o no tener evento seleccionado\n');
      return;
    }

    console.log('   ✅ Textarea encontrado');
    console.log(`   📄 Placeholder: "${textareaInfo.placeholder}"\n`);

    console.log(`📊 Botones encontrados: ${textareaInfo.buttonCount}`);
    if (textareaInfo.buttonCount > 0) {
      console.log('\n🔍 Detalles de cada botón:\n');
      textareaInfo.buttons.forEach((btn, idx) => {
        console.log(`   Botón ${idx + 1}:`);
        console.log(`      Title: ${btn.title || 'No title'}`);
        console.log(`      Text: ${btn.textContent || 'No text'}`);
        console.log(`      HTML: ${btn.innerHTML.substring(0, 150)}${btn.innerHTML.length > 150 ? '...' : ''}`);
        console.log('');
      });
    }

    console.log('\n📦 HTML del contenedor (primeros 1000 chars):');
    console.log(textareaInfo.containerHTML);
    console.log('\n');

    // Tomar screenshot
    await page.screenshot({ path: 'editor-inspection.png', fullPage: true });
    console.log('📸 Screenshot: editor-inspection.png\n');

    console.log('✅ Inspección completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectCopilotEditor().catch(console.error);
