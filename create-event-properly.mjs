#!/usr/bin/env node
import { chromium } from 'playwright';

async function createEventProperly() {
  console.log('🔍 Creando evento correctamente...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL: ${page.url()}\n`);

    // Navegar a la home
    console.log('📝 PASO 1: Navegando a home...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('   ✅ En home\n');

    // Abrir modal de crear evento
    console.log('📝 PASO 2: Abriendo modal de crear evento...');
    const createBtn = page.locator('button:has-text("Crear")').first();
    await createBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('   ✅ Modal abierto\n');

    // Llenar nombre
    console.log('📝 PASO 3: Llenando campos del formulario...\n');
    const nameInput = page.locator('input[name="nombre"]');
    await nameInput.fill('Evento Test Copilot');
    console.log('   ✅ Nombre: "Evento Test Copilot"');

    // Seleccionar tipo (select estándar)
    const typeSelect = page.locator('select[name="tipo"]');
    await typeSelect.selectOption({ index: 1 }); // Primera opción después de "Select"
    console.log('   ✅ Tipo seleccionado');

    // Fecha
    const dateInput = page.locator('input[name="fecha"]');
    await dateInput.fill('2026-12-31');
    console.log('   ✅ Fecha: 2026-12-31');

    // TimeZone (SelectWithSearchField personalizado)
    console.log('\n   🌐 Seleccionando zona horaria...');

    // Buscar el input de timeZone por el label o por el nombre
    const timezoneInput = page.locator('input[type="text"]').filter({
      has: page.locator('..').filter({ hasText: /zona horaria|timeZone/i })
    }).or(page.locator('input').last()); // O el último input de texto

    // Hacer click para abrir el dropdown
    await timezoneInput.click();
    console.log('      Dropdown abierto');
    await page.waitForTimeout(500);

    // Escribir para filtrar (opcional, o solo hacer click en la primera opción)
    // await timezoneInput.fill('America/New_York');
    // await page.waitForTimeout(500);

    // Hacer click en la primera opción del dropdown
    const firstOption = page.locator('div.cursor-pointer.hover\\:bg-gray-100').first();
    await firstOption.click();
    console.log('      Opción seleccionada\n');

    await page.waitForTimeout(1000);

    // Tomar screenshot antes de guardar
    await page.screenshot({ path: 'form-completed.png' });
    console.log('📸 Screenshot: form-completed.png\n');

    // Guardar
    console.log('📝 PASO 4: Guardando evento...');
    const saveBtn = page.locator('button[type="submit"]:has-text("Guardar"), button:has-text("Guardar")').first();
    await saveBtn.click();
    console.log('   ✅ Click en Guardar\n');

    // Esperar a que se cierre el modal y se cree el evento
    await page.waitForTimeout(4000);

    const currentURL = page.url();
    console.log(`📍 URL después de guardar: ${currentURL}\n`);

    // Tomar screenshot después de guardar
    await page.screenshot({ path: 'after-create.png' });
    console.log('📸 Screenshot: after-create.png\n');

    // Buscar el evento creado y hacer click
    console.log('📝 PASO 5: Navegando al evento creado...');

    const eventLink = page.locator('a[href*="/evento"]').first();
    const eventCount = await eventLink.count();

    if (eventCount > 0) {
      console.log(`   Encontrado: ${eventCount} evento(s)`);
      await eventLink.click({ force: true });
      await page.waitForTimeout(2000);
      console.log(`   ✅ Navegado a: ${page.url()}\n`);
    } else {
      console.log('   ⚠️  No se encontraron eventos. Intentando navegar directamente...\n');

      // Intentar rutas comunes
      await page.goto('http://localhost:8080/resumen-evento', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log(`   URL: ${page.url()}\n`);
    }

    // Tomar screenshot dentro del evento
    await page.screenshot({ path: 'inside-event-final.png' });
    console.log('📸 Screenshot: inside-event-final.png\n');

    // Verificar si hay botón Copilot
    const copilotBtn = page.locator('button:has-text("Copilot")').first();
    const hasCopilot = await copilotBtn.count() > 0;

    console.log(`🤖 Botón Copilot disponible: ${hasCopilot ? '✅' : '❌'}\n`);

    if (!hasCopilot) {
      console.log('⚠️  El Copilot no está disponible en esta página.\n');
      return;
    }

    // Abrir Copilot
    console.log('📝 PASO 6: Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3000);
    console.log('   ✅ Atajo presionado\n');

    // Tomar screenshot con Copilot abierto
    await page.screenshot({ path: 'copilot-final-opened.png' });
    console.log('📸 Screenshot: copilot-final-opened.png\n');

    // Inspeccionar el editor
    console.log('📝 PASO 7: Inspeccionando editor del Copilot...\n');

    const editorData = await page.evaluate(() => {
      // Buscar textarea con el placeholder específico
      const textarea = document.querySelector('textarea[placeholder*="mensaje"]');

      if (!textarea) {
        return { found: false };
      }

      // Encontrar el contenedor del editor (padre más cercano)
      const editorContainer = textarea.closest('form, div[class*="editor"], div[class*="input"], div');

      if (!editorContainer) {
        return { found: true, hasContainer: false };
      }

      // Buscar botones con SVG en el contenedor
      const buttons = editorContainer.querySelectorAll('button');
      const buttonDetails = Array.from(buttons).map(btn => {
        const svg = btn.querySelector('svg');
        return {
          title: btn.getAttribute('title') || '',
          text: btn.textContent?.trim() || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          hasSvg: !!svg
        };
      }).filter(b => b.hasSvg && b.title); // Solo botones con SVG y title

      return {
        found: true,
        hasContainer: true,
        placeholder: textarea.placeholder,
        actionButtons: buttonDetails
      };
    });

    if (!editorData.found) {
      console.log('❌ No se encontró el textarea del editor\n');
      return;
    }

    console.log('✅ Editor encontrado\n');
    console.log(`   Placeholder: "${editorData.placeholder}"`);
    console.log(`   Botones de acción: ${editorData.actionButtons.length}\n`);

    if (editorData.actionButtons.length > 0) {
      console.log('🔘 Botones encontrados:\n');
      editorData.actionButtons.forEach((btn, idx) => {
        console.log(`   ${idx + 1}. "${btn.title}"`);
      });
      console.log('');

      // Verificar los 4 botones esperados
      const expected = ['Emojis', 'Adjuntar', 'código', 'lista'];
      const matches = expected.map(kw => {
        const found = editorData.actionButtons.find(b =>
          b.title.toLowerCase().includes(kw.toLowerCase())
        );
        return { keyword: kw, found: !!found, title: found?.title };
      });

      console.log('📊 Verificación:\n');
      matches.forEach(m => {
        console.log(`   ${m.found ? '✅' : '❌'} ${m.keyword}${m.found ? ': "' + m.title + '"' : ''}`);
      });

      const successCount = matches.filter(m => m.found).length;
      console.log(`\n📈 Total: ${successCount}/4 botones correctos\n`);

      if (successCount === 4) {
        console.log('🎉 ¡ÉXITO COMPLETO!\n');
        console.log('El CopilotInputEditor está funcionando correctamente con todos sus botones:\n');
        matches.forEach(m => {
          console.log(`   ✓ ${m.title}`);
        });
        console.log('');
      } else if (successCount > 0) {
        console.log(`⚠️  Solo ${successCount} de 4 botones encontrados\n`);
      } else {
        console.log('❌ No se encontraron los botones esperados\n');
      }
    } else {
      console.log('⚠️  No se encontraron botones de acción en el editor\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

createEventProperly().catch(console.error);
