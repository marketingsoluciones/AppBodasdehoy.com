#!/usr/bin/env node
import { chromium } from 'playwright';

async function inspectCurrentCopilot() {
  console.log('🔍 Inspeccionando el Copilot actual del navegador...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL: ${page.url()}\n`);

    // Tomar screenshot del estado actual
    await page.screenshot({ path: 'current-copilot-state.png' });
    console.log('📸 Screenshot: current-copilot-state.png\n');

    // Inspeccionar directamente lo que está en el navegador
    const analysis = await page.evaluate(() => {
      // Buscar TODOS los textareas
      const allTextareas = document.querySelectorAll('textarea');

      const textareaInfo = Array.from(allTextareas).map(ta => ({
        placeholder: ta.placeholder,
        value: ta.value,
        name: ta.name,
        id: ta.id,
        visible: ta.offsetParent !== null
      }));

      // Buscar el textarea del Copilot (el que está visible)
      const copilotTextarea = Array.from(allTextareas).find(ta =>
        ta.offsetParent !== null && // Está visible
        (ta.placeholder?.includes('mensaje') || ta.placeholder?.includes('Escribe'))
      );

      if (!copilotTextarea) {
        return {
          found: false,
          allTextareas: textareaInfo
        };
      }

      // Encontrar el contenedor del editor
      let container = copilotTextarea.parentElement;
      while (container && !container.querySelector('button')) {
        container = container.parentElement;
      }

      if (!container) {
        container = copilotTextarea.closest('div');
      }

      // Buscar TODOS los botones en el contenedor
      const allButtons = container.querySelectorAll('button');

      const buttonDetails = Array.from(allButtons).map(btn => {
        const svg = btn.querySelector('svg');
        const svgPaths = svg ? Array.from(svg.querySelectorAll('path')).length : 0;

        return {
          title: btn.getAttribute('title') || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          text: btn.textContent?.trim().substring(0, 30) || '',
          className: btn.className.substring(0, 100),
          hasSvg: !!svg,
          svgPathCount: svgPaths,
          type: btn.getAttribute('type') || '',
          disabled: btn.disabled
        };
      });

      // Filtrar solo botones con SVG
      const svgButtons = buttonDetails.filter(b => b.hasSvg);

      // Buscar botones de acción (los que tienen title o ariaLabel)
      const actionButtons = svgButtons.filter(b => b.title || b.ariaLabel);

      return {
        found: true,
        placeholder: copilotTextarea.placeholder,
        allTextareas: textareaInfo,
        totalButtons: allButtons.length,
        svgButtons: svgButtons.length,
        actionButtons: actionButtons,
        allButtonDetails: buttonDetails.filter(b => b.hasSvg)
      };
    });

    if (!analysis.found) {
      console.log('❌ No se encontró el textarea del Copilot\n');
      console.log(`📊 Textareas encontrados: ${analysis.allTextareas.length}\n`);
      analysis.allTextareas.forEach((ta, idx) => {
        console.log(`   ${idx + 1}. Placeholder: "${ta.placeholder}"`);
        console.log(`      Visible: ${ta.visible ? '✅' : '❌'}`);
        console.log('');
      });
      return;
    }

    console.log('✅ Copilot encontrado!\n');
    console.log(`📝 Placeholder: "${analysis.placeholder}"`);
    console.log(`🔢 Total botones: ${analysis.totalButtons}`);
    console.log(`🎨 Botones con SVG: ${analysis.svgButtons}`);
    console.log(`🎯 Botones de acción: ${analysis.actionButtons.length}\n`);

    console.log('📋 Todos los botones con SVG:\n');
    analysis.allButtonDetails.forEach((btn, idx) => {
      console.log(`   ${idx + 1}. Title: "${btn.title}"`);
      console.log(`      Text: "${btn.text}"`);
      console.log(`      Type: "${btn.type}"`);
      console.log(`      SVG paths: ${btn.svgPathCount}`);
      console.log(`      Class: ${btn.className.substring(0, 50)}...`);
      console.log('');
    });

    // Verificar los 4 botones esperados del CopilotInputEditor
    const expectedButtons = [
      { name: 'Emojis', keywords: ['emoji', 'emojis'] },
      { name: 'Adjuntar archivo', keywords: ['adjuntar', 'archivo', 'attach'] },
      { name: 'Insertar código', keywords: ['código', 'code'] },
      { name: 'Insertar lista', keywords: ['lista', 'list'] }
    ];

    console.log('🔍 Verificando botones esperados del CopilotInputEditor:\n');

    const verification = expectedButtons.map(expected => {
      const found = analysis.actionButtons.find(btn => {
        const searchText = (btn.title + ' ' + btn.ariaLabel + ' ' + btn.text).toLowerCase();
        return expected.keywords.some(kw => searchText.includes(kw.toLowerCase()));
      });

      return {
        expected: expected.name,
        found: !!found,
        button: found
      };
    });

    verification.forEach(v => {
      console.log(`   ${v.found ? '✅' : '❌'} ${v.expected}`);
      if (v.found && v.button) {
        console.log(`      → Title: "${v.button.title}"`);
        console.log(`      → Text: "${v.button.text}"`);
      }
    });

    const successCount = verification.filter(v => v.found).length;
    console.log(`\n📊 RESULTADO: ${successCount}/4 botones correctos\n`);

    if (successCount === 4) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉 ¡ÉXITO COMPLETO! 🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ El CopilotInputEditor está funcionando correctamente');
      console.log('   con los 4 botones de react-icons (IoHappy, IoAttach,');
      console.log('   IoCode, IoList) funcionando correctamente.\n');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else if (successCount > 0) {
      console.log(`⚠️  PARCIAL: ${successCount}/4 botones encontrados\n`);
    } else {
      console.log('❌ Los botones del CopilotInputEditor NO están presentes\n');
      console.log('   Esto significa que se está mostrando un editor diferente.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

inspectCurrentCopilot().catch(console.error);
