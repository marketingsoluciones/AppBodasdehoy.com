#!/usr/bin/env node
import { chromium } from 'playwright';

async function navigateToEvento() {
  console.log('🔍 Navegando directamente a un evento existente...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Cerrar cualquier modal
    console.log('📝 PASO 1: Cerrando modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('   ✅ Modal cerrado\n');

    // Verificar si ya hay eventos en la base de datos
    console.log('📝 PASO 2: Verificando eventos en localStorage...\n');

    const localStorageData = await page.evaluate(() => {
      // Intentar obtener datos del localStorage
      const keys = Object.keys(localStorage);
      const relevantData = {};

      keys.forEach(key => {
        if (key.includes('event') || key.includes('usuario') || key.includes('auth')) {
          try {
            relevantData[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            relevantData[key] = localStorage.getItem(key);
          }
        }
      });

      return relevantData;
    });

    console.log('   Datos relevantes en localStorage:');
    Object.keys(localStorageData).forEach(key => {
      console.log(`      ${key}: ${typeof localStorageData[key]}`);
    });
    console.log('');

    // Intentar navegar a una URL de evento directamente
    console.log('📝 PASO 3: Navegando a URL de evento de prueba...\n');

    // Probar diferentes URLs comunes
    const testURLs = [
      'http://localhost:8080/resumen-evento',
      'http://localhost:8080/evento',
      'http://localhost:8080/invitados',
      'http://localhost:8080/presupuesto'
    ];

    for (const testURL of testURLs) {
      console.log(`   Probando: ${testURL}`);
      await page.goto(testURL, { waitUntil: 'networkidle', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const currentURL = page.url();
      console.log(`   Resultado: ${currentURL}`);

      // Verificar si hay botón Copilot disponible
      const hasCopilotBtn = await page.locator('button:has-text("Copilot")').count() > 0;
      console.log(`   Botón Copilot disponible: ${hasCopilotBtn ? '✅' : '❌'}\n`);

      if (hasCopilotBtn && currentURL !== 'http://localhost:8080/') {
        console.log(`✅ Encontramos una página con Copilot: ${currentURL}\n`);

        // Tomar screenshot
        await page.screenshot({ path: 'found-page-with-copilot.png' });
        console.log('📸 Screenshot: found-page-with-copilot.png\n');

        // Abrir Copilot
        console.log('📝 PASO 4: Abriendo Copilot...\n');
        await page.keyboard.press('Meta+Shift+KeyC');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'copilot-opened-final.png' });
        console.log('📸 Screenshot: copilot-opened-final.png\n');

        // Inspeccionar
        const inspection = await page.evaluate(() => {
          // Buscar panel Copilot (puede ser modal, drawer, etc)
          const selectors = [
            '[class*="copilot"]',
            '[id*="copilot"]',
            '[data-testid*="copilot"]',
            'aside',
            '[role="dialog"]'
          ];

          let copilotPanel = null;
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              if (el.textContent?.includes('Copilot') || el.textContent?.includes('asistente')) {
                copilotPanel = el;
                break;
              }
            }
            if (copilotPanel) break;
          }

          if (!copilotPanel) {
            return { found: false, html: document.body.innerHTML.substring(0, 500) };
          }

          // Buscar textarea
          const textarea = copilotPanel.querySelector('textarea');

          // Buscar todos los botones
          const buttons = copilotPanel.querySelectorAll('button');
          const buttonData = Array.from(buttons).map(btn => {
            const svg = btn.querySelector('svg');
            return {
              title: btn.getAttribute('title') || '',
              text: btn.textContent?.trim().substring(0, 30) || '',
              hasSvg: !!svg,
              ariaLabel: btn.getAttribute('aria-label') || ''
            };
          });

          return {
            found: true,
            hasTextarea: !!textarea,
            textareaPlaceholder: textarea?.placeholder || '',
            totalButtons: buttons.length,
            svgButtons: buttonData.filter(b => b.hasSvg),
            allButtons: buttonData
          };
        });

        if (!inspection.found) {
          console.log('❌ No se encontró panel Copilot\n');
          console.log(`HTML: ${inspection.html}\n`);
          continue;
        }

        console.log('✅ Panel Copilot encontrado\n');
        console.log(`   Tiene textarea: ${inspection.hasTextarea ? '✅' : '❌'}`);
        console.log(`   Placeholder: "${inspection.textareaPlaceholder}"`);
        console.log(`   Total botones: ${inspection.totalButtons}`);
        console.log(`   Botones con SVG: ${inspection.svgButtons.length}\n`);

        if (inspection.svgButtons.length > 0) {
          console.log('🔘 Botones con SVG:\n');
          inspection.svgButtons.forEach((btn, idx) => {
            console.log(`   ${idx + 1}. Title: "${btn.title}"`);
            console.log(`      Text: "${btn.text}"`);
            console.log(`      Aria: "${btn.ariaLabel}"\n`);
          });

          // Verificar los 4 botones del editor
          const keywords = ['emoji', 'adjuntar', 'código', 'lista'];
          const found = keywords.map(kw => {
            const btn = inspection.svgButtons.find(b =>
              b.title.toLowerCase().includes(kw) ||
              b.ariaLabel.toLowerCase().includes(kw)
            );
            return { keyword: kw, found: !!btn, button: btn };
          });

          console.log('📊 Verificación de botones del editor:\n');
          found.forEach(f => {
            console.log(`   ${f.found ? '✅' : '❌'} ${f.keyword}${f.found ? ': "' + f.button.title + '"' : ''}`);
          });

          const successCount = found.filter(f => f.found).length;
          console.log(`\n📈 Resultado: ${successCount}/4 botones\n`);

          if (successCount === 4) {
            console.log('🎉 ¡ÉXITO! El CopilotInputEditor está funcionando correctamente\n');
          }
        }

        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

navigateToEvento().catch(console.error);
