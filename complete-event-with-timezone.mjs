#!/usr/bin/env node
import { chromium } from 'playwright';

async function completeEventWithTimezone() {
  console.log('🔍 Completando evento con zona horaria...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL: ${page.url()}\n`);

    // El modal ya está abierto, solo necesitamos seleccionar la zona horaria
    console.log('📝 PASO 1: Seleccionando zona horaria...');

    // Buscar todos los selects
    const selects = await page.locator('select').all();
    console.log(`   Encontrados ${selects.length} selects\n`);

    // El último select debería ser la zona horaria
    if (selects.length >= 2) {
      const timezoneSelect = selects[selects.length - 1];

      // Obtener opciones disponibles
      const options = await timezoneSelect.evaluate(select => {
        return Array.from(select.options).map((opt, idx) => ({
          index: idx,
          value: opt.value,
          text: opt.text
        }));
      });

      console.log('   Opciones de zona horaria disponibles:');
      options.forEach(opt => {
        console.log(`      ${opt.index}: ${opt.text}`);
      });
      console.log('');

      // Seleccionar la primera opción válida (no "Seleccionar")
      if (options.length > 1) {
        await timezoneSelect.selectOption({ index: 1 });
        console.log(`   ✅ Zona horaria seleccionada: ${options[1].text}\n`);
      }
    }

    await page.waitForTimeout(1000);

    // Tomar screenshot antes de guardar
    await page.screenshot({ path: 'with-timezone-selected.png' });
    console.log('📸 Screenshot: with-timezone-selected.png\n');

    // Ahora sí guardar
    console.log('📝 PASO 2: Guardando evento...');
    const saveBtn = page.locator('button:has-text("Guardar")').first();
    await saveBtn.click({ force: true });
    console.log('   ✅ Click en Guardar\n');

    // Esperar a que se cierre el modal o navegue
    await page.waitForTimeout(3000);

    const newURL = page.url();
    console.log(`📍 Nueva URL: ${newURL}\n`);

    // Tomar screenshot después de guardar
    await page.screenshot({ path: 'after-saving-event.png' });
    console.log('📸 Screenshot: after-saving-event.png\n');

    // Si seguimos en la home, buscar el evento
    if (newURL === 'http://localhost:8080/' || !newURL.includes('/evento')) {
      console.log('📝 PASO 3: Buscando evento creado en la lista...\n');

      // Esperar un poco para que se cargue la lista
      await page.waitForTimeout(2000);

      // Buscar tarjetas de eventos
      const eventCards = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/evento"]'));
        return links.map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent?.trim().substring(0, 50)
        }));
      });

      console.log(`   Eventos encontrados: ${eventCards.length}`);
      eventCards.forEach((evt, idx) => {
        console.log(`      ${idx + 1}. ${evt.text} - ${evt.href}`);
      });
      console.log('');

      if (eventCards.length > 0) {
        // Hacer click en el primer evento
        const firstEventLink = page.locator(`a[href="${eventCards[0].href}"]`).first();
        console.log(`   Haciendo click en: ${eventCards[0].href}`);
        await firstEventLink.click({ force: true });
        await page.waitForTimeout(2000);
        console.log(`   ✅ Navegado a: ${page.url()}\n`);
      }
    } else {
      console.log('✅ Ya estamos dentro del evento\n');
    }

    // Tomar screenshot dentro del evento
    await page.screenshot({ path: 'inside-created-event.png' });
    console.log('📸 Screenshot: inside-created-event.png\n');

    // Ahora abrir el Copilot
    console.log('📝 PASO 4: Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3000);
    console.log('   ✅ Atajo presionado\n');

    // Tomar screenshot con Copilot
    await page.screenshot({ path: 'copilot-inside-event.png' });
    console.log('📸 Screenshot: copilot-inside-event.png\n');

    // Inspeccionar el Copilot
    console.log('📝 PASO 5: Inspeccionando Copilot...\n');

    const copilotDetails = await page.evaluate(() => {
      // Buscar el contenedor del Copilot
      const copilotContainer = document.querySelector('[class*="copilot"]') ||
                               Array.from(document.querySelectorAll('div, aside')).find(el =>
                                 el.textContent?.includes('Copilot')
                               );

      if (!copilotContainer) {
        return { found: false };
      }

      // Buscar textarea
      const textareas = copilotContainer.querySelectorAll('textarea');

      // Buscar botones con SVG
      const buttons = copilotContainer.querySelectorAll('button');
      const buttonDetails = Array.from(buttons).map(btn => {
        const svg = btn.querySelector('svg');
        return {
          title: btn.getAttribute('title') || '',
          text: btn.textContent?.trim() || '',
          hasSvg: svg !== null
        };
      }).filter(btn => btn.hasSvg); // Solo botones con SVG

      return {
        found: true,
        textareaCount: textareas.length,
        textareaPlaceholder: textareas[0]?.placeholder || '',
        buttonCount: buttonDetails.length,
        buttons: buttonDetails
      };
    });

    if (!copilotDetails.found) {
      console.log('❌ No se encontró el Copilot\n');
      return;
    }

    console.log('✅ Copilot encontrado\n');
    console.log(`   Textareas: ${copilotDetails.textareaCount}`);
    console.log(`   Placeholder: "${copilotDetails.textareaPlaceholder}"`);
    console.log(`   Botones con SVG: ${copilotDetails.buttonCount}\n`);

    if (copilotDetails.buttons.length > 0) {
      console.log('🔘 Botones encontrados:\n');
      copilotDetails.buttons.forEach((btn, idx) => {
        console.log(`   ${idx + 1}. "${btn.title}" - "${btn.text}"`);
      });
      console.log('');

      // Verificar los 4 botones esperados
      const expectedTitles = ['Emojis', 'Adjuntar', 'código', 'lista'];
      const matches = expectedTitles.map(keyword => {
        const found = copilotDetails.buttons.find(btn =>
          btn.title.toLowerCase().includes(keyword.toLowerCase())
        );
        return {
          keyword,
          found: found ? '✅' : '❌',
          title: found ? found.title : 'No encontrado'
        };
      });

      console.log('📊 Verificación de botones:\n');
      matches.forEach(m => {
        console.log(`   ${m.found} ${m.keyword}: ${m.title}`);
      });

      const successCount = matches.filter(m => m.found === '✅').length;
      console.log(`\n📈 Total: ${successCount}/4 botones correctos\n`);

      if (successCount === 4) {
        console.log('🎉 ¡ÉXITO! CopilotInputEditor funcionando correctamente\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeEventWithTimezone().catch(console.error);
