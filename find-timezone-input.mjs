#!/usr/bin/env node
import { chromium } from 'playwright';

async function findTimezoneInput() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log('🔍 Buscando el input de timezone...\n');

    // Analizar el DOM para encontrar el input correcto
    const inputInfo = await page.evaluate(() => {
      // Buscar el label que contiene "zona horaria"
      const labels = Array.from(document.querySelectorAll('label'));
      const timezoneLabel = labels.find(label =>
        label.textContent?.toLowerCase().includes('zona horaria') ||
        label.textContent?.toLowerCase().includes('timezone')
      );

      if (!timezoneLabel) {
        return { found: false, message: 'No se encontró label de timezone' };
      }

      // Encontrar el contenedor padre
      const container = timezoneLabel.parentElement;

      if (!container) {
        return { found: false, message: 'No se encontró contenedor' };
      }

      // Buscar el input dentro del contenedor
      const input = container.querySelector('input[type="text"]');

      if (!input) {
        return {
          found: false,
          message: 'No se encontró input',
          containerHTML: container.innerHTML.substring(0, 500)
        };
      }

      return {
        found: true,
        inputId: input.id,
        inputName: input.name,
        inputClass: input.className,
        inputPlaceholder: input.placeholder,
        labelText: timezoneLabel.textContent
      };
    });

    console.log('📊 Resultado:\n');
    console.log(JSON.stringify(inputInfo, null, 2));
    console.log('');

    if (inputInfo.found) {
      console.log('✅ Input encontrado!\n');
      console.log(`   Clase: ${inputInfo.inputClass}`);
      console.log(`   Placeholder: ${inputInfo.inputPlaceholder}`);
      console.log(`   Name: ${inputInfo.inputName}`);
      console.log('');

      // Intentar interactuar con el input
      console.log('🖱️  Probando interacción...\n');

      // Usando el placeholder como selector
      const input = page.locator(`input[placeholder="${inputInfo.inputPlaceholder}"]`);
      const count = await input.count();
      console.log(`   Inputs con ese placeholder: ${count}`);

      if (count > 0) {
        await input.click();
        console.log('   ✅ Click exitoso');
        await page.waitForTimeout(1000);

        // Verificar si el dropdown se abrió
        const dropdownVisible = await page.locator('div.cursor-pointer.hover\\:bg-gray-100').count();
        console.log(`   Opciones de dropdown visibles: ${dropdownVisible}\n`);

        if (dropdownVisible > 0) {
          console.log('✅ El dropdown se abrió correctamente!\n');

          // Hacer click en la primera opción
          await page.locator('div.cursor-pointer.hover\\:bg-gray-100').first().click();
          console.log('   ✅ Primera opción seleccionada\n');

          await page.screenshot({ path: 'timezone-selected.png' });
          console.log('📸 Screenshot: timezone-selected.png\n');
        }
      }
    } else {
      console.log(`❌ ${inputInfo.message}\n`);
      if (inputInfo.containerHTML) {
        console.log(`HTML del contenedor:\n${inputInfo.containerHTML}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findTimezoneInput().catch(console.error);
