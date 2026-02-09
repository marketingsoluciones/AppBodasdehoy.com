#!/usr/bin/env node
import { chromium } from 'playwright';

async function crearEventoCompleto() {
  console.log('🚀 Creando evento completo con todos los campos requeridos...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ En home page\n');

    // Crear evento
    console.log('📝 PASO 1: Abriendo formulario de evento...');
    const crearEventoBtn = page.locator('text="Crear un evento"').first();

    if (await crearEventoBtn.isVisible()) {
      await crearEventoBtn.click();
      console.log('   🖱️  Click en "Crear un evento"');
      await page.waitForTimeout(2000);

      // Llenar nombre
      console.log('\n📝 PASO 2: Llenando formulario...');
      const nombreInput = page.locator('input[placeholder*="nombre"], input[name="nombre"]').first();
      if (await nombreInput.isVisible()) {
        await nombreInput.fill('Mi Boda Automatizada 2026');
        console.log('   ✅ Nombre: Mi Boda Automatizada 2026');
        await page.waitForTimeout(500);
      }

      // Seleccionar tipo de evento
      const tipoSelect = page.locator('select, [role="combobox"]').filter({ hasText: 'Seleccionar' }).first();
      if (await tipoSelect.isVisible()) {
        await tipoSelect.click();
        await page.waitForTimeout(500);

        // Intentar seleccionar "Boda" de varias formas
        const bodaOption = page.locator('option:has-text("Boda"), [role="option"]:has-text("Boda")').first();
        if (await bodaOption.isVisible()) {
          await bodaOption.click();
          console.log('   ✅ Tipo: Boda');
        } else {
          // Si no encuentra "Boda", seleccionar la primera opción disponible
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          console.log('   ✅ Tipo: Primera opción');
        }
        await page.waitForTimeout(500);
      }

      // Seleccionar fecha (hoy + 6 meses)
      const fechaInput = page.locator('input[type="date"], input[placeholder*="fecha"]').first();
      if (await fechaInput.isVisible()) {
        const fechaFutura = new Date();
        fechaFutura.setMonth(fechaFutura.getMonth() + 6);
        const fechaStr = fechaFutura.toISOString().split('T')[0];

        await fechaInput.fill(fechaStr);
        console.log(`   ✅ Fecha: ${fechaStr}`);
        await page.waitForTimeout(500);
      }

      // Seleccionar zona horaria
      const zonaHorariaSelect = page.locator('select, [role="combobox"]').nth(1); // Segundo select
      if (await zonaHorariaSelect.isVisible()) {
        await zonaHorariaSelect.click();
        await page.waitForTimeout(500);

        // Seleccionar primera zona horaria
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        console.log('   ✅ Zona horaria: Seleccionada');
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: 'test-9-formulario-completo.png', fullPage: true });
      console.log('   📸 Screenshot: test-9-formulario-completo.png\n');

      // Guardar evento
      console.log('📝 PASO 3: Guardando evento...');
      const guardarBtn = page.locator('button:has-text("Guardar")').first();

      if (await guardarBtn.isVisible()) {
        await guardarBtn.click();
        console.log('   🖱️  Click en Guardar');

        await page.waitForTimeout(5000); // Esperar más tiempo para que se guarde y redirija

        await page.screenshot({ path: 'test-10-despues-guardar.png', fullPage: true });
        console.log('   📸 Screenshot: test-10-despues-guardar.png');

        // Verificar si estamos en otra página (señal de éxito)
        const currentUrl = page.url();
        console.log(`   📍 URL actual: ${currentUrl}\n`);

        if (currentUrl.includes('/eventos') || !currentUrl.includes('modal')) {
          console.log('   ✅ ¡Evento creado exitosamente!\n');
        } else {
          console.log('   ⚠️  El evento puede no haberse guardado (revisar screenshot)\n');
        }
      }

      // PASO 4: Abrir Copilot
      console.log('📝 PASO 4: Abriendo Copilot con evento seleccionado...');
      await page.waitForTimeout(2000);

      const copilotBtn = page.locator('button:has-text("Copilot")').first();
      if (await copilotBtn.isVisible()) {
        await copilotBtn.click();
        console.log('   🖱️  Click en Copilot');

        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-11-copilot-final.png', fullPage: true });
        console.log('   📸 Screenshot: test-11-copilot-final.png\n');

        // PASO 5: Buscar los 4 botones
        console.log('📝 PASO 5: Verificando botones del editor...');
        await page.waitForTimeout(2000);

        const botones = await page.evaluate(() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          return {
            emoji: allButtons.some(b => b.textContent?.includes('😊')),
            attach: allButtons.some(b => b.textContent?.includes('📎')),
            code: allButtons.some(b => b.textContent?.includes('</>')),
            list: allButtons.some(b => b.textContent?.includes('•')),
          };
        });

        console.log(`   😊 Emoji: ${botones.emoji ? '✅' : '❌'}`);
        console.log(`   📎 Adjuntar: ${botones.attach ? '✅' : '❌'}`);
        console.log(`   </> Código: ${botones.code ? '✅' : '❌'}`);
        console.log(`   • Lista: ${botones.list ? '✅' : '❌'}\n`);

        const found = [botones.emoji, botones.attach, botones.code, botones.list].filter(Boolean).length;

        if (found === 4) {
          console.log('   🎉 ¡TODOS LOS BOTONES ENCONTRADOS!\n');
        } else {
          console.log(`   ⚠️  Solo ${found}/4 botones encontrados\n`);
        }
      }
    }

    console.log('='.repeat(70));
    console.log('✅ PROCESO COMPLETO FINALIZADO');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test-error-crear-evento.png', fullPage: true });
  }
}

crearEventoCompleto().catch(console.error);
