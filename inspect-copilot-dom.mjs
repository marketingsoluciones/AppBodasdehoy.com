#!/usr/bin/env node
import { chromium } from 'playwright';

async function inspectCopilotDOM() {
  console.log('🔍 Inspeccionando DOM del Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Buscar todos los elementos que podrían ser el panel Copilot
    const domInfo = await page.evaluate(() => {
      // Buscar por diferentes criterios
      const results = {
        byText: null,
        byClass: null,
        allTextareas: [],
        allButtons: []
      };

      // 1. Buscar elemento que contenga "Copilot IA"
      const allDivs = document.querySelectorAll('div, section, aside');
      for (const div of allDivs) {
        if (div.textContent && div.textContent.includes('Copilot IA')) {
          results.byText = {
            tagName: div.tagName,
            className: div.className,
            id: div.id,
            innerHTML: div.innerHTML.substring(0, 500)
          };
          break;
        }
      }

      // 2. Buscar todos los textareas
      const textareas = document.querySelectorAll('textarea, [contenteditable="true"]');
      results.allTextareas = Array.from(textareas).map(ta => ({
        tagName: ta.tagName,
        placeholder: ta.placeholder || ta.getAttribute('placeholder'),
        className: ta.className,
        value: ta.value ? ta.value.substring(0, 50) : '',
        parentClass: ta.parentElement?.className
      }));

      // 3. Si encontramos el panel por texto, buscar botones dentro
      if (results.byText) {
        const panel = allDivs[Array.from(allDivs).findIndex(d => d.textContent?.includes('Copilot IA'))];
        if (panel) {
          const buttons = panel.querySelectorAll('button');
          results.allButtons = Array.from(buttons).map(btn => {
            const svg = btn.querySelector('svg');
            return {
              text: btn.textContent?.trim() || '',
              title: btn.getAttribute('title') || '',
              ariaLabel: btn.getAttribute('aria-label') || '',
              className: btn.className,
              hasSvg: svg !== null,
              svgContent: svg ? svg.innerHTML.substring(0, 80) : '',
              parentClass: btn.parentElement?.className
            };
          });
        }
      }

      return results;
    });

    console.log('📊 Resultados de la inspección:\n');

    if (domInfo.byText) {
      console.log('✅ Panel Copilot encontrado por texto "Copilot IA"');
      console.log(`   Tag: ${domInfo.byText.tagName}`);
      console.log(`   Class: ${domInfo.byText.className}`);
      console.log(`   ID: ${domInfo.byText.id || '(sin ID)'}\n`);
    } else {
      console.log('❌ No se encontró panel con "Copilot IA"\n');
    }

    console.log(`📝 Textareas encontrados: ${domInfo.allTextareas.length}`);
    if (domInfo.allTextareas.length > 0) {
      domInfo.allTextareas.forEach((ta, idx) => {
        console.log(`\n   Textarea ${idx + 1}:`);
        console.log(`      Tag: ${ta.tagName}`);
        console.log(`      Placeholder: "${ta.placeholder}"`);
        console.log(`      Class: ${ta.className.substring(0, 80)}`);
        console.log(`      Parent class: ${ta.parentClass?.substring(0, 60)}`);
      });
    }
    console.log('');

    console.log(`🔘 Botones encontrados en el panel: ${domInfo.allButtons.length}`);
    if (domInfo.allButtons.length > 0) {
      console.log('');

      // Filtrar botones del action bar (los que tienen SVG)
      const actionButtons = domInfo.allButtons.filter(btn => btn.hasSvg);

      console.log(`   Botones con SVG (action bar): ${actionButtons.length}\n`);

      actionButtons.forEach((btn, idx) => {
        console.log(`   Botón ${idx + 1}:`);
        console.log(`      Title: "${btn.title}"`);
        console.log(`      Text: "${btn.text}"`);
        console.log(`      Class: ${btn.className.substring(0, 60)}`);
        console.log(`      SVG: ${btn.svgContent.substring(0, 50)}...`);
        console.log('');
      });

      // Verificar botones esperados
      const expectedTitles = ['Emojis', 'Adjuntar archivo', 'Insertar código', 'Insertar lista'];

      console.log('📊 Verificación de botones esperados:\n');

      const matches = expectedTitles.map(title => {
        const found = actionButtons.find(btn =>
          btn.title.toLowerCase().includes(title.toLowerCase().split(' ')[0]) ||
          btn.title.toLowerCase().includes(title.toLowerCase())
        );
        return {
          expected: title,
          found: found ? '✅' : '❌',
          actual: found ? found.title : 'No encontrado'
        };
      });

      matches.forEach(m => {
        console.log(`   ${m.found} ${m.expected}`);
        if (m.found === '✅') {
          console.log(`      Título real: "${m.actual}"`);
        }
      });

      const successCount = matches.filter(m => m.found === '✅').length;

      console.log(`\n📈 Resultado: ${successCount}/4 botones correctos\n`);

      if (successCount === 4) {
        console.log('🎉 ¡ÉXITO! Todos los botones del CopilotInputEditor están presentes');
        console.log('    El componente se está renderizando correctamente con react-icons.\n');
      } else if (successCount > 0) {
        console.log(`⚠️  Solo se encontraron ${successCount} de 4 botones esperados\n`);
      } else {
        console.log('❌ No se encontraron los botones esperados del CopilotInputEditor\n');
      }
    } else {
      console.log('   ⚠️  No se encontraron botones en el panel\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectCopilotDOM().catch(console.error);
