#!/usr/bin/env node
import { chromium } from 'playwright';

async function saveAndOpenCopilot() {
  console.log('🔍 Guardando evento y abriendo Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL: ${page.url()}\n`);

    // PASO 1: Guardar el evento
    console.log('📝 PASO 1: Guardando evento...');
    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await saveBtn.click();
    console.log('   ✅ Click en Guardar\n');

    // Esperar a que se cierre el modal y se cree el evento
    await page.waitForTimeout(4000);

    console.log(`📍 URL después de guardar: ${page.url()}\n`);

    // Tomar screenshot
    await page.screenshot({ path: 'event-saved.png' });
    console.log('📸 Screenshot: event-saved.png\n');

    // PASO 2: Navegar al evento creado
    console.log('📝 PASO 2: Navegando al evento...');

    // Buscar si ya estamos en una página de evento
    const currentURL = page.url();

    if (!currentURL.includes('/evento') && !currentURL.includes('/resumen') && !currentURL.includes('/invitados')) {
      console.log('   Buscando evento en la lista...');

      // Esperar un poco para que se actualice la lista
      await page.waitForTimeout(2000);

      // Buscar el evento creado
      const eventLink = page.locator('a[href*="/evento"], a[href*="/resumen"]').first();
      const linkCount = await eventLink.count();

      if (linkCount > 0) {
        console.log('   ✅ Evento encontrado, haciendo click...');
        await eventLink.click({ force: true });
        await page.waitForTimeout(2000);
      } else {
        console.log('   ⚠️  No se encontró evento. Intentando navegar manualmente...');
        await page.goto('http://localhost:8080/resumen-evento', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
    }

    console.log(`   ✅ En: ${page.url()}\n`);

    // Tomar screenshot dentro del evento
    await page.screenshot({ path: 'inside-event-page.png' });
    console.log('📸 Screenshot: inside-event-page.png\n');

    // PASO 3: Verificar si hay botón Copilot
    console.log('📝 PASO 3: Verificando botón Copilot...');

    const copilotBtn = page.locator('button:has-text("Copilot")');
    const hasCopilot = await copilotBtn.count() > 0;

    console.log(`   Botón Copilot: ${hasCopilot ? '✅' : '❌'}\n`);

    if (!hasCopilot) {
      console.log('⚠️  El Copilot no está disponible. Posiblemente falta el evento seleccionado.\n');
      return;
    }

    // PASO 4: Abrir Copilot con atajo de teclado
    console.log('📝 PASO 4: Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3000);
    console.log('   ✅ Atajo presionado\n');

    // Tomar screenshot con Copilot
    await page.screenshot({ path: 'copilot-opened-success.png' });
    console.log('📸 Screenshot: copilot-opened-success.png\n');

    // PASO 5: Inspeccionar el editor del Copilot
    console.log('📝 PASO 5: Inspeccionando editor del Copilot...\n');

    const editorAnalysis = await page.evaluate(() => {
      // Buscar el textarea del Copilot
      const textareas = Array.from(document.querySelectorAll('textarea'));
      const copilotTextarea = textareas.find(ta =>
        ta.placeholder?.toLowerCase().includes('mensaje') ||
        ta.placeholder?.toLowerCase().includes('escribe')
      );

      if (!copilotTextarea) {
        return {
          found: false,
          textareaCount: textareas.length,
          placeholders: textareas.map(ta => ta.placeholder)
        };
      }

      // Encontrar el contenedor del editor
      const editorContainer = copilotTextarea.closest('div, form');

      if (!editorContainer) {
        return {
          found: true,
          hasContainer: false,
          placeholder: copilotTextarea.placeholder
        };
      }

      // Buscar TODOS los botones en el contenedor
      const allButtons = editorContainer.querySelectorAll('button');

      // Filtrar botones que tienen SVG y title (botones de acción)
      const actionButtons = Array.from(allButtons)
        .map(btn => {
          const svg = btn.querySelector('svg');
          return {
            title: btn.getAttribute('title') || '',
            text: btn.textContent?.trim() || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            hasSvg: !!svg
          };
        })
        .filter(btn => btn.hasSvg && btn.title); // Solo botones con SVG y title

      return {
        found: true,
        hasContainer: true,
        placeholder: copilotTextarea.placeholder,
        totalButtons: allButtons.length,
        actionButtons: actionButtons
      };
    });

    if (!editorAnalysis.found) {
      console.log('❌ No se encontró el textarea del Copilot\n');
      console.log(`   Textareas encontrados: ${editorAnalysis.textareaCount}`);
      console.log(`   Placeholders: ${JSON.stringify(editorAnalysis.placeholders)}\n`);
      return;
    }

    console.log('✅ Editor del Copilot encontrado!\n');
    console.log(`   Placeholder: "${editorAnalysis.placeholder}"`);
    console.log(`   Total de botones: ${editorAnalysis.totalButtons}`);
    console.log(`   Botones de acción (con SVG + title): ${editorAnalysis.actionButtons.length}\n`);

    if (editorAnalysis.actionButtons.length > 0) {
      console.log('🔘 Botones de acción encontrados:\n');
      editorAnalysis.actionButtons.forEach((btn, idx) => {
        console.log(`   ${idx + 1}. "${btn.title}"`);
      });
      console.log('');

      // Verificar los 4 botones esperados del CopilotInputEditor
      const expectedKeywords = [
        { keyword: 'emoji', name: 'Emojis' },
        { keyword: 'adjuntar', name: 'Adjuntar archivo' },
        { keyword: 'código', name: 'Insertar código' },
        { keyword: 'lista', name: 'Insertar lista' }
      ];

      const verification = expectedKeywords.map(expected => {
        const found = editorAnalysis.actionButtons.find(btn =>
          btn.title.toLowerCase().includes(expected.keyword.toLowerCase())
        );
        return {
          expected: expected.name,
          found: !!found,
          actualTitle: found ? found.title : 'No encontrado'
        };
      });

      console.log('📊 Verificación de botones esperados:\n');
      verification.forEach(v => {
        console.log(`   ${v.found ? '✅' : '❌'} ${v.expected}`);
        if (v.found) {
          console.log(`      Título real: "${v.actualTitle}"`);
        }
      });

      const successCount = verification.filter(v => v.found).length;
      console.log(`\n📈 RESULTADO: ${successCount}/4 botones correctos\n`);

      if (successCount === 4) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎉 ¡ÉXITO TOTAL! 🎉');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('El componente CopilotInputEditor está funcionando PERFECTAMENTE');
        console.log('con todos los botones esperados:\n');
        verification.forEach(v => {
          console.log(`   ✓ ${v.actualTitle}`);
        });
        console.log('\n═══════════════════════════════════════════════════════════\n');
      } else if (successCount > 0) {
        console.log(`⚠️  PARCIAL: Solo se encontraron ${successCount} de 4 botones esperados\n`);
      } else {
        console.log('❌ FALLO: No se encontraron los botones esperados del CopilotInputEditor\n');
      }
    } else {
      console.log('⚠️  No se encontraron botones de acción en el editor\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

saveAndOpenCopilot().catch(console.error);
