#!/usr/bin/env node
import { chromium } from 'playwright';

async function findCopilotPanel() {
  console.log('🔍 Buscando panel específico del Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Buscar el panel flotante del Copilot
    const panelInfo = await page.evaluate(() => {
      // Buscar divs con posición fixed o absolute que contengan texto de Copilot
      const allElements = document.querySelectorAll('div, aside, section');

      const copilotPanels = [];

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        const position = style.position;
        const text = el.textContent || '';

        // Buscar elementos fixed/absolute que contengan "Copilot" o "asistente"
        if ((position === 'fixed' || position === 'absolute') &&
            (text.includes('Copilot') || text.includes('asistente'))) {

          const rect = el.getBoundingClientRect();

          // Filtrar solo paneles visibles y pequeños (no el body completo)
          if (rect.width > 50 && rect.width < 800 && rect.height > 50) {
            copilotPanels.push({
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              position,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              textContent: text.substring(0, 100),
              innerHTML: el.innerHTML.substring(0, 1500),
              hasTextarea: el.querySelector('textarea') !== null,
              hasInput: el.querySelector('input') !== null,
              buttonCount: el.querySelectorAll('button').length,
              svgCount: el.querySelectorAll('svg').length
            });
          }
        }
      }

      return {
        panelsFound: copilotPanels.length,
        panels: copilotPanels
      };
    });

    console.log(`📊 Paneles flotantes encontrados: ${panelInfo.panelsFound}\n`);

    if (panelInfo.panels.length === 0) {
      console.log('❌ No se encontraron paneles flotantes del Copilot\n');
      return;
    }

    panelInfo.panels.forEach((panel, idx) => {
      console.log(`📋 Panel ${idx + 1}:`);
      console.log(`   Tag: ${panel.tagName}`);
      console.log(`   Position: ${panel.position}`);
      console.log(`   Size: ${Math.round(panel.width)}x${Math.round(panel.height)}px`);
      console.log(`   Top/Left: ${Math.round(panel.top)}px, ${Math.round(panel.left)}px`);
      console.log(`   Class: ${panel.className.substring(0, 100)}`);
      console.log(`   Tiene textarea: ${panel.hasTextarea ? '✅' : '❌'}`);
      console.log(`   Tiene input: ${panel.hasInput ? '✅' : '❌'}`);
      console.log(`   Botones: ${panel.buttonCount}`);
      console.log(`   SVGs: ${panel.svgCount}`);
      console.log(`   Texto: "${panel.textContent}"`);
      console.log('\n   HTML del panel:\n');
      console.log(panel.innerHTML);
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Si encontramos el panel, inspeccionemos sus botones en detalle
    if (panelInfo.panels.length > 0) {
      console.log('📝 Inspeccionando botones del primer panel en detalle...\n');

      const buttonDetails = await page.evaluate(() => {
        const allElements = document.querySelectorAll('div, aside, section');
        let copilotPanel = null;

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const position = style.position;
          const text = el.textContent || '';
          const rect = el.getBoundingClientRect();

          if ((position === 'fixed' || position === 'absolute') &&
              (text.includes('Copilot') || text.includes('asistente')) &&
              rect.width > 50 && rect.width < 800 && rect.height > 50) {
            copilotPanel = el;
            break;
          }
        }

        if (!copilotPanel) {
          return { found: false };
        }

        // Encontrar todos los botones
        const buttons = copilotPanel.querySelectorAll('button');
        const buttonInfo = Array.from(buttons).map(btn => {
          const svg = btn.querySelector('svg');
          return {
            text: btn.textContent?.trim() || '',
            title: btn.getAttribute('title') || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            type: btn.getAttribute('type') || '',
            className: btn.className,
            hasSvg: svg !== null,
            svgHTML: svg ? svg.outerHTML.substring(0, 150) : '',
            innerHTML: btn.innerHTML.substring(0, 200)
          };
        });

        // Encontrar textareas e inputs
        const textareas = copilotPanel.querySelectorAll('textarea');
        const inputs = copilotPanel.querySelectorAll('input[type="text"], input:not([type])');

        return {
          found: true,
          buttonCount: buttonInfo.length,
          buttons: buttonInfo,
          textareaCount: textareas.length,
          inputCount: inputs.length,
          textareas: Array.from(textareas).map(ta => ({
            placeholder: ta.placeholder,
            value: ta.value,
            className: ta.className
          })),
          inputs: Array.from(inputs).map(inp => ({
            placeholder: inp.placeholder,
            value: inp.value,
            type: inp.type,
            className: inp.className
          }))
        };
      });

      if (!buttonDetails.found) {
        console.log('❌ No se pudo reinspeccionar el panel\n');
        return;
      }

      console.log(`📊 Detalles completos del panel:\n`);
      console.log(`   Textareas: ${buttonDetails.textareaCount}`);
      console.log(`   Inputs: ${buttonDetails.inputCount}`);
      console.log(`   Botones: ${buttonDetails.buttonCount}\n`);

      if (buttonDetails.textareas.length > 0) {
        console.log('📝 Textareas encontrados:\n');
        buttonDetails.textareas.forEach((ta, idx) => {
          console.log(`   ${idx + 1}. Placeholder: "${ta.placeholder}"`);
        });
        console.log('');
      }

      if (buttonDetails.inputs.length > 0) {
        console.log('📝 Inputs encontrados:\n');
        buttonDetails.inputs.forEach((inp, idx) => {
          console.log(`   ${idx + 1}. Placeholder: "${inp.placeholder}"`);
        });
        console.log('');
      }

      if (buttonDetails.buttons.length > 0) {
        console.log('🔘 Botones encontrados:\n');
        buttonDetails.buttons.forEach((btn, idx) => {
          console.log(`   Botón ${idx + 1}:`);
          console.log(`      Title: "${btn.title}"`);
          console.log(`      Text: "${btn.text}"`);
          console.log(`      Type: "${btn.type}"`);
          console.log(`      Has SVG: ${btn.hasSvg ? '✅' : '❌'}`);
          if (btn.hasSvg) {
            console.log(`      SVG: ${btn.svgHTML.substring(0, 80)}...`);
          }
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findCopilotPanel().catch(console.error);
