import { chromium } from 'playwright';

async function testWithPopups() {
  console.log('🧪 Test con popups habilitados...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: [
      '--disable-popup-blocking' // Deshabilitar bloqueo de popups
    ]
  });

  // NO crear context primero - esperar a capturar el popup
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });

  // Capturar errores
  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ [Error] ${text}`);
    }
  });

  console.log('📍 Cargando localhost:8080...');
  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(4000);

  console.log('📍 Abriendo Copilot...');
  const copilotBtn = page.locator('button:has-text("Copilot")').first();

  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    await copilotBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'before-button-click.png', fullPage: true });
    console.log('📸 Screenshot: before-button-click.png');

    console.log('\n📍 Buscando botón "Abrir Copilot Completo"...');
    const expandBtn = page.locator('button:has-text("Abrir Copilot Completo")').first();

    if (await expandBtn.isVisible({ timeout: 3000 })) {
      console.log('✅ Botón encontrado\n');

      // Configurar listener para la nueva pestaña ANTES de hacer click
      const popupPromise = page.waitForEvent('popup', { timeout: 10000 });

      console.log('📍 Haciendo click en el botón...');
      await expandBtn.click();

      try {
        console.log('⏳ Esperando que se abra la nueva pestaña...');
        const popup = await popupPromise;

        console.log('✅ ¡Nueva pestaña abierta exitosamente!');
        console.log(`   URL: ${popup.url()}`);

        // Esperar a que cargue
        await popup.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await popup.waitForTimeout(5000);

        console.log('\n📊 Analizando apps/copilot...');

        // Capturar errores en el popup
        const popupErrors = [];
        popup.on('console', msg => {
          if (msg.type() === 'error') {
            popupErrors.push(msg.text());
            console.log(`   ❌ [Copilot Error] ${msg.text()}`);
          }
        });

        // Verificar el editor
        const editorInfo = await popup.evaluate(() => {
          const contentEditables = document.querySelectorAll('[contenteditable="true"]');
          const hasToolbar = document.querySelector('[class*="toolbar"], [class*="typobar"]') !== null;

          return {
            title: document.title,
            contentEditableCount: contentEditables.length,
            hasToolbar,
            url: window.location.href
          };
        });

        console.log('\n✅ Funcionalidades en apps/copilot:');
        console.log(`   Título: ${editorInfo.title}`);
        console.log(`   URL: ${editorInfo.url}`);
        console.log(`   ContentEditable: ${editorInfo.contentEditableCount}`);
        console.log(`   Tiene Toolbar: ${editorInfo.hasToolbar ? '✅' : '❌'}`);

        await popup.screenshot({ path: 'copilot-popup-opened.png', fullPage: true });
        console.log('\n📸 Screenshot: copilot-popup-opened.png');

        if (editorInfo.contentEditableCount > 0 && editorInfo.hasToolbar) {
          console.log('\n🎉 ¡TODO FUNCIONA CORRECTAMENTE!');
          console.log('   El editor completo se abrió con todos los plugins');
        } else {
          console.log('\n⚠️  Advertencia: El editor puede no estar completamente cargado');
        }

        console.log('\n📊 Resumen de Errores:');
        console.log(`   apps/web: ${errors.length} errores`);
        console.log(`   apps/copilot: ${popupErrors.length} errores`);

      } catch (err) {
        console.log(`❌ Error esperando popup: ${err.message}`);

        // Verificar si hay alguna pestaña nueva abierta manualmente
        const pages = browser.contexts()[0]?.pages() || [];
        console.log(`   Páginas abiertas: ${pages.length}`);
      }

    } else {
      console.log('❌ Botón NO encontrado');
    }

  } else {
    console.log('❌ No se pudo abrir Copilot');
  }

  console.log('\n⏳ Navegador abierto 90 segundos para inspección manual...');
  await page.waitForTimeout(90000);

  await browser.close();
  console.log('\n✅ Test completado');
}

testWithPopups().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
