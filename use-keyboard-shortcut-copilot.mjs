#!/usr/bin/env node
import { chromium } from 'playwright';

async function useKeyboardShortcut() {
  console.log('🔍 Usando atajo de teclado para abrir Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Cerrar cualquier modal abierto
    console.log('📝 PASO 1: Cerrando modales...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('   ✅ Modales cerrados\n');

    // Tomar screenshot
    await page.screenshot({ path: 'before-shortcut.png' });
    console.log('📸 Screenshot: before-shortcut.png\n');

    // Usar el atajo de teclado Cmd+Shift+C (⌘⇧C) para abrir Copilot
    console.log('📝 PASO 2: Presionando ⌘⇧C para abrir Copilot...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3000);
    console.log('   ✅ Atajo presionado\n');

    // Tomar screenshot después del atajo
    await page.screenshot({ path: 'after-shortcut.png' });
    console.log('📸 Screenshot: after-shortcut.png\n');

    // Paso 3: Inspeccionar si el Copilot se abrió y verificar el editor
    console.log('📝 PASO 3: Verificando si Copilot se abrió...\n');

    const copilotInfo = await page.evaluate(() => {
      // Buscar indicios del panel Copilot
      const copilotPanel = document.querySelector('[class*="copilot"], [id*="copilot"]');

      if (!copilotPanel) {
        return {
          found: false,
          message: 'No se encontró panel Copilot'
        };
      }

      // Buscar textarea dentro del panel
      const textareaSelectors = [
        'textarea[placeholder*="mensaje"]',
        'textarea[placeholder*="Escribe"]',
        'textarea',
        '[contenteditable="true"]'
      ];

      let textarea = null;
      for (const selector of textareaSelectors) {
        textarea = copilotPanel.querySelector(selector);
        if (textarea) break;
      }

      if (!textarea) {
        return {
          found: true,
          hasTextarea: false,
          panelHTML: copilotPanel.innerHTML.substring(0, 500)
        };
      }

      // Buscar el contenedor del editor
      const editorContainer = textarea.closest('[class*="editor"], [class*="input"], form, div');

      // Buscar botones
      const buttons = (editorContainer || copilotPanel).querySelectorAll('button');
      const buttonInfo = Array.from(buttons).map(btn => {
        const svg = btn.querySelector('svg');
        return {
          text: btn.textContent?.trim() || '',
          title: btn.getAttribute('title') || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          hasSvg: svg !== null,
          svgPath: svg ? svg.innerHTML.substring(0, 60) : '',
          classes: btn.className
        };
      });

      return {
        found: true,
        hasTextarea: true,
        placeholder: textarea.placeholder || textarea.getAttribute('placeholder'),
        buttonCount: buttons.length,
        buttons: buttonInfo
      };
    });

    if (!copilotInfo.found) {
      console.log(`❌ ${copilotInfo.message}\n`);
      console.log('⚠️  El atajo de teclado no abrió el Copilot o el panel no se renderizó\n');
      return;
    }

    console.log('✅ Panel Copilot encontrado\n');

    if (!copilotInfo.hasTextarea) {
      console.log('❌ No se encontró textarea en el panel Copilot\n');
      if (copilotInfo.panelHTML) {
        console.log(`HTML del panel: ${copilotInfo.panelHTML}\n`);
      }
      return;
    }

    console.log(`📊 Información del editor:`);
    console.log(`   Placeholder: ${copilotInfo.placeholder}`);
    console.log(`   Botones encontrados: ${copilotInfo.buttonCount}\n`);

    if (copilotInfo.buttons && copilotInfo.buttons.length > 0) {
      console.log(`📋 Detalles de los botones:\n`);

      // Filtrar solo los botones del action bar (los que tienen SVG y title)
      const actionButtons = copilotInfo.buttons.filter(btn => btn.hasSvg && btn.title);

      console.log(`   Botones de acción (con SVG y title): ${actionButtons.length}\n`);

      actionButtons.forEach((btn, idx) => {
        console.log(`   Botón ${idx + 1}:`);
        console.log(`      Title: "${btn.title}"`);
        console.log(`      Texto: "${btn.text}"`);
        console.log(`      SVG: ${btn.svgPath}...`);
        console.log('');
      });

      // Verificar los 4 botones esperados
      const expectedButtons = [
        { title: 'Emojis', keyword: 'emoji' },
        { title: 'Adjuntar archivo', keyword: 'adjuntar' },
        { title: 'Insertar código', keyword: 'código' },
        { title: 'Insertar lista', keyword: 'lista' }
      ];

      const matches = expectedButtons.map(expected => {
        const found = actionButtons.find(btn =>
          btn.title.toLowerCase().includes(expected.keyword)
        );
        return {
          expected: expected.title,
          found: found ? '✅' : '❌',
          details: found ? `"${found.title}"` : 'No encontrado'
        };
      });

      console.log('\n📊 Verificación de botones esperados:\n');
      matches.forEach(m => {
        console.log(`   ${m.found} ${m.expected}: ${m.details}`);
      });

      const successCount = matches.filter(m => m.found === '✅').length;

      console.log(`\n📈 Total: ${successCount}/4 botones correctos encontrados\n`);

      if (successCount === 4) {
        console.log('🎉 ¡ÉXITO COMPLETO! El editor CopilotInputEditor está funcionando correctamente');
        console.log('    Todos los botones con iconos SVG de react-icons están presentes.\n');
      } else {
        console.log('⚠️  Algunos botones no se encontraron o no tienen el formato esperado\n');
      }
    } else {
      console.log('⚠️  No se encontraron botones en el editor\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

useKeyboardShortcut().catch(console.error);
