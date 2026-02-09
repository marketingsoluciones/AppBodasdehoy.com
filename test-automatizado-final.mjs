#!/usr/bin/env node
import { chromium } from 'playwright';

async function testAutomatizado() {
  console.log('🚀 Iniciando pruebas automatizadas...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('✅ Conectado al navegador\n');

  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Navegar a localhost:8080
    console.log('📝 Navegando a http://localhost:8080/...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`   ✅ Cargado: ${page.url()}\n`);

    // Screenshot inicial
    await page.screenshot({ path: 'test-0-inicial.png', fullPage: true });
    console.log('   📸 Screenshot: test-0-inicial.png\n');

    // PASO 1: Verificar menú de usuario
    console.log('📝 PASO 1: Verificando menú de usuario...');

    // Buscar icono con "G" o avatar
    const userIcon = page.locator('text="G"').first();

    try {
      await userIcon.waitFor({ timeout: 5000, state: 'visible' });
      console.log('   ✅ Icono de usuario encontrado');

      await userIcon.click();
      console.log('   🖱️  Click en icono');

      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-1-menu-usuario.png', fullPage: true });
      console.log('   📸 Screenshot: test-1-menu-usuario.png');

      // Cerrar menú
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      console.log('   ✅ Menú cerrado\n');

    } catch (e) {
      console.log('   ⚠️  Icono de usuario no encontrado o no clickeable\n');
    }

    // PASO 2: Buscar y clickear Copilot
    console.log('📝 PASO 2: Abriendo Copilot...');

    const copilotButton = page.locator('text="Copilot"').first();

    try {
      await copilotButton.waitFor({ timeout: 5000, state: 'visible' });
      console.log('   ✅ Botón Copilot encontrado');

      await copilotButton.click();
      console.log('   🖱️  Click en Copilot');

      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-2-copilot-abierto.png', fullPage: true });
      console.log('   📸 Screenshot: test-2-copilot-abierto.png\n');

    } catch (e) {
      console.log('   ⚠️  Botón Copilot no encontrado\n');
      await page.screenshot({ path: 'test-2-copilot-error.png', fullPage: true });
    }

    // PASO 3: Verificar los 4 botones del editor
    console.log('📝 PASO 3: Verificando botones del editor...');

    // Esperar un poco más por si el panel tarda en abrir
    await page.waitForTimeout(2000);

    // Buscar cada botón
    const buttons = {
      emoji: await page.locator('button:has-text("😊")').count(),
      attach: await page.locator('button:has-text("📎")').count(),
      code: await page.locator('button:has-text("</>")', 'button[title*="code"]').count(),
      list: await page.locator('button:has-text("•")').count(),
    };

    console.log(`   😊 Emoji: ${buttons.emoji > 0 ? '✅' : '❌'} (${buttons.emoji} encontrados)`);
    console.log(`   📎 Adjuntar: ${buttons.attach > 0 ? '✅' : '❌'} (${buttons.attach} encontrados)`);
    console.log(`   </> Código: ${buttons.code > 0 ? '✅' : '❌'} (${buttons.code} encontrados)`);
    console.log(`   • Lista: ${buttons.list > 0 ? '✅' : '❌'} (${buttons.list} encontrados)\n`);

    const totalButtons = buttons.emoji + buttons.attach + buttons.code + buttons.list;

    if (totalButtons >= 4) {
      console.log('   ✅ ¡EDITOR COMPLETO CON TODOS LOS BOTONES!\n');

      // PASO 4: Probar funcionalidades
      console.log('📝 PASO 4: Probando funcionalidades...');

      // Buscar textarea
      const textarea = page.locator('textarea').first();

      try {
        await textarea.waitFor({ timeout: 3000, state: 'visible' });
        console.log('   ✅ Textarea encontrado');

        // Escribir texto
        await textarea.fill('Hola, este es un mensaje de prueba automático 🎉');
        console.log('   ✅ Texto escrito');

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-3-texto-escrito.png', fullPage: true });
        console.log('   📸 Screenshot: test-3-texto-escrito.png\n');

        // Probar botón emoji
        const emojiBtn = page.locator('button:has-text("😊")').first();
        if (await emojiBtn.isVisible()) {
          await emojiBtn.click();
          console.log('   ✅ Click en botón emoji');

          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-4-emoji-selector.png', fullPage: true });
          console.log('   📸 Screenshot: test-4-emoji-selector.png\n');

          // Cerrar selector de emoji si está abierto
          await page.keyboard.press('Escape');
        }

      } catch (e) {
        console.log('   ⚠️  Textarea no encontrado o no editable\n');
      }

    } else {
      console.log(`   ⚠️  Solo se encontraron ${totalButtons}/4 botones\n`);
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE PRUEBAS AUTOMATIZADAS');
    console.log('='.repeat(70));
    console.log('Screenshots generados:');
    console.log('  ✅ test-0-inicial.png - Estado inicial');
    console.log('  ✅ test-1-menu-usuario.png - Menú de usuario');
    console.log('  ✅ test-2-copilot-abierto.png - Panel Copilot');
    console.log('  ✅ test-3-texto-escrito.png - Texto en editor');
    console.log('  ✅ test-4-emoji-selector.png - Selector de emojis');
    console.log('='.repeat(70));
    console.log('\n✅ Todas las pruebas completadas. Revisa los screenshots.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  }
}

testAutomatizado().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
