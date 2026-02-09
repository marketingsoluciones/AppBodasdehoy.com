#!/usr/bin/env node
import { chromium } from 'playwright';

async function testCompleto() {
  console.log('🚀 Test completo: Crear evento + Verificar Copilot\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ En home page\n');

    // PASO 1: Crear evento
    console.log('📝 PASO 1: Creando evento de prueba...');

    const crearEventoBtn = page.locator('text="Crear un evento"').first();

    if (await crearEventoBtn.isVisible()) {
      await crearEventoBtn.click();
      console.log('   🖱️  Click en "Crear un evento"');

      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-5-crear-evento.png', fullPage: true });
      console.log('   📸 Screenshot: test-5-crear-evento.png');

      // Llenar formulario de evento
      const nombreEvento = page.locator('input[name="nombre"], input[placeholder*="nombre"]').first();

      if (await nombreEvento.isVisible()) {
        await nombreEvento.fill('Evento de Prueba Automatizado');
        console.log('   ✅ Nombre del evento ingresado');

        await page.waitForTimeout(500);

        // Buscar y clickear botón de guardar/crear
        const guardarBtn = page.locator('button:has-text("Crear"), button:has-text("Guardar")').first();

        if (await guardarBtn.isVisible()) {
          await guardarBtn.click();
          console.log('   ✅ Evento guardado');

          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-6-evento-creado.png', fullPage: true });
          console.log('   📸 Screenshot: test-6-evento-creado.png\n');
        }
      }
    }

    // PASO 2: Abrir Copilot con evento seleccionado
    console.log('📝 PASO 2: Abriendo Copilot con evento seleccionado...');

    const copilotBtn = page.locator('text="Copilot"').first();
    await copilotBtn.click();
    console.log('   🖱️  Click en Copilot');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-7-copilot-con-evento.png', fullPage: true });
    console.log('   📸 Screenshot: test-7-copilot-con-evento.png\n');

    // PASO 3: Verificar los 4 botones del editor
    console.log('📝 PASO 3: Buscando los 4 botones del editor...');

    await page.waitForTimeout(2000);

    // Buscar botones con diferentes estrategias
    const buttonChecks = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));

      return {
        emoji: allButtons.some(b => b.textContent?.includes('😊')),
        attach: allButtons.some(b => b.textContent?.includes('📎')),
        code: allButtons.some(b => b.textContent?.includes('</>')),
        list: allButtons.some(b => b.textContent?.includes('•')),
        total: allButtons.length
      };
    });

    console.log(`   😊 Emoji: ${buttonChecks.emoji ? '✅' : '❌'}`);
    console.log(`   📎 Adjuntar: ${buttonChecks.attach ? '✅' : '❌'}`);
    console.log(`   </> Código: ${buttonChecks.code ? '✅' : '❌'}`);
    console.log(`   • Lista: ${buttonChecks.list ? '✅' : '❌'}`);
    console.log(`   📊 Total botones en página: ${buttonChecks.total}\n`);

    const found = [buttonChecks.emoji, buttonChecks.attach, buttonChecks.code, buttonChecks.list].filter(Boolean).length;

    if (found === 4) {
      console.log('   ✅ ¡TODOS LOS BOTONES ENCONTRADOS!\n');

      // Probar textarea
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        await textarea.fill('Este es un mensaje de prueba con el editor completo 🎉');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-8-editor-funcionando.png', fullPage: true });
        console.log('   📸 Screenshot: test-8-editor-funcionando.png\n');
      }
    } else {
      console.log(`   ⚠️  Solo ${found}/4 botones encontrados\n`);

      // Buscar el componente del editor
      const editorHTML = await page.evaluate(() => {
        const copilotArea = document.querySelector('[class*="copilot"], [class*="chat"]');
        return copilotArea ? copilotArea.outerHTML.substring(0, 500) : 'No encontrado';
      });
      console.log('   🔍 HTML del área Copilot (primeros 500 chars):');
      console.log('   ' + editorHTML + '\n');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST COMPLETO FINALIZADO');
    console.log('='.repeat(70));
    console.log('Verifica los screenshots generados.');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test-error-completo.png', fullPage: true });
  }
}

testCompleto().catch(console.error);
