#!/usr/bin/env node
import { chromium } from 'playwright';

async function closeModalAndOpenCopilot() {
  console.log('🔍 Cerrando modal y abriendo Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Paso 1: Cerrar cualquier modal presionando Escape
    console.log('📝 PASO 1: Cerrando modales con Escape...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // Por si hay múltiples modales
    await page.waitForTimeout(1000);
    console.log('   ✅ Escape presionado\n');

    // Tomar screenshot después de cerrar modales
    await page.screenshot({ path: 'after-close-modal.png' });
    console.log('📸 Screenshot: after-close-modal.png\n');

    // Paso 2: Buscar y hacer click en el botón Copilot
    console.log('📝 PASO 2: Buscando botón Copilot...');

    // Intentar varios selectores para el botón Copilot
    const copilotSelectors = [
      'button:has-text("Copilot")',
      '[title*="Copilot"]',
      '[aria-label*="Copilot"]',
      'button:has-text("copilot")',
    ];

    let copilotButton = null;
    for (const selector of copilotSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        copilotButton = page.locator(selector).first();
        console.log(`   ✅ Botón encontrado con selector: ${selector}`);
        break;
      }
    }

    if (!copilotButton) {
      console.log('   ❌ No se encontró el botón Copilot');
      return;
    }

    // Intentar click con force para evitar interceptación
    console.log('📝 PASO 3: Haciendo click en Copilot (force: true)...');
    await copilotButton.click({ force: true, timeout: 10000 });
    console.log('   ✅ Click realizado\n');

    // Esperar a que aparezca el panel del Copilot
    console.log('📝 PASO 4: Esperando panel Copilot...');
    await page.waitForTimeout(2000);

    // Tomar screenshot del Copilot abierto
    await page.screenshot({ path: 'copilot-opened.png' });
    console.log('📸 Screenshot: copilot-opened.png\n');

    // Paso 5: Inspeccionar el editor dentro del Copilot
    console.log('📝 PASO 5: Inspeccionando editor...\n');

    const editorInfo = await page.evaluate(() => {
      // Buscar el textarea del editor
      const textarea = document.querySelector('textarea[placeholder*="mensaje"]');

      if (!textarea) {
        return { found: false, message: 'No se encontró textarea' };
      }

      // Buscar botones cerca del textarea
      const editorContainer = textarea.closest('[class*="editor"], [class*="input"], form, div');

      if (!editorContainer) {
        return { found: true, hasContainer: false };
      }

      // Contar todos los botones dentro del contenedor del editor
      const buttons = editorContainer.querySelectorAll('button');
      const buttonInfo = Array.from(buttons).map(btn => ({
        text: btn.textContent?.trim() || '',
        title: btn.getAttribute('title') || '',
        ariaLabel: btn.getAttribute('aria-label') || '',
        innerHTML: btn.innerHTML.substring(0, 100), // Primeros 100 chars para ver si hay SVG
        hasSvg: btn.querySelector('svg') !== null,
        classes: btn.className
      }));

      return {
        found: true,
        hasContainer: true,
        placeholder: textarea.placeholder,
        buttonCount: buttons.length,
        buttons: buttonInfo,
        containerClasses: editorContainer.className
      };
    });

    if (!editorInfo.found) {
      console.log(`❌ ${editorInfo.message}\n`);
      return;
    }

    console.log(`📊 Información del editor:`);
    console.log(`   Placeholder: ${editorInfo.placeholder}`);
    console.log(`   Botones encontrados: ${editorInfo.buttonCount}\n`);

    if (editorInfo.buttons && editorInfo.buttons.length > 0) {
      console.log(`📋 Detalles de los botones:\n`);
      editorInfo.buttons.forEach((btn, idx) => {
        console.log(`   Botón ${idx + 1}:`);
        console.log(`      Texto: "${btn.text}"`);
        console.log(`      Title: "${btn.title}"`);
        console.log(`      Tiene SVG: ${btn.hasSvg ? '✅ SÍ' : '❌ NO'}`);
        if (btn.innerHTML.includes('svg')) {
          console.log(`      HTML: ${btn.innerHTML.substring(0, 80)}...`);
        }
        console.log('');
      });

      // Verificar si son los botones correctos de react-icons
      const expectedButtons = [
        { title: 'Emojis', hasSvg: true },
        { title: 'Adjuntar archivo', hasSvg: true },
        { title: 'Insertar código', hasSvg: true },
        { title: 'Insertar lista', hasSvg: true }
      ];

      const matchingButtons = editorInfo.buttons.filter(btn =>
        expectedButtons.some(expected =>
          btn.title.includes(expected.title) && btn.hasSvg === expected.hasSvg
        )
      );

      console.log(`\n✅ Botones correctos encontrados: ${matchingButtons.length}/4\n`);

      if (matchingButtons.length === 4) {
        console.log('🎉 ¡ÉXITO! El editor CopilotInputEditor está mostrándose correctamente\n');
      } else {
        console.log('⚠️  El editor no tiene los 4 botones esperados\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

closeModalAndOpenCopilot().catch(console.error);
