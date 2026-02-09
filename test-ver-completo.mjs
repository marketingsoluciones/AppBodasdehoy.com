import { chromium } from 'playwright';

async function testVerCompleto() {
  console.log('🧪 Probando botón "Ver completo"...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  // Página principal (apps/web)
  const mainPage = await context.newPage();

  console.log('📍 Abriendo app principal (apps/web)...');
  await mainPage.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await mainPage.waitForTimeout(3000);

  console.log('📍 Abriendo Copilot en sidebar...');
  const copilotBtn = mainPage.locator('button:has-text("Copilot")').first();

  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    await copilotBtn.click();
    await mainPage.waitForTimeout(3000);

    await mainPage.screenshot({ path: 'test-1-sidebar.png', fullPage: true });
    console.log('📸 Captura 1: Sidebar abierto');

    // Buscar botón "Ver completo"
    console.log('\n📍 Buscando botón "Ver completo"...');

    const verCompletoBtn = mainPage.locator('button:has-text("Ver completo"), a:has-text("Ver completo")').first();

    const btnVisible = await verCompletoBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (btnVisible) {
      console.log('✅ Botón "Ver completo" encontrado');

      // Esperar a que se abra la nueva pestaña
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        verCompletoBtn.click()
      ]);

      console.log('\n📍 Nueva pestaña abierta, esperando carga...');
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await newPage.waitForTimeout(5000);

      const newUrl = newPage.url();
      console.log('   URL: ' + newUrl);

      // Verificar que sea localhost:3210
      if (newUrl.includes('localhost:3210') || newUrl.includes('127.0.0.1:3210')) {
        console.log('   ✅ Se abrió el copilot LOCAL correcto');
      } else {
        console.log('   ⚠️  Se abrió:', newUrl);
      }

      await newPage.screenshot({ path: 'test-2-copilot-completo.png', fullPage: true });
      console.log('📸 Captura 2: Copilot completo');

      // Verificar funcionalidades del copilot completo
      const features = await newPage.evaluate(() => {
        const title = document.title;
        const hasEditor = document.querySelectorAll('[contenteditable="true"]').length > 0;
        const hasToolbar = document.querySelector('[class*="toolbar"], [class*="format"]') !== null;
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);

        return {
          title,
          hasEditor,
          hasToolbar,
          buttonsCount: buttons.length,
          sampleButtons: buttons.slice(0, 10),
        };
      });

      console.log('\n📊 Funcionalidades detectadas en Copilot completo:');
      console.log('   Título:', features.title);
      console.log('   Tiene editor:', features.hasEditor ? '✅' : '❌');
      console.log('   Tiene toolbar:', features.hasToolbar ? '✅' : '❌');
      console.log('   Botones encontrados:', features.buttonsCount);
      console.log('   Ejemplos:', features.sampleButtons.slice(0, 5).join(', '));

      console.log('\n⏳ Navegador abierto 60s para inspección manual...');
      console.log('   Puedes probar el editor completo en la segunda pestaña\n');
      await newPage.waitForTimeout(60000);

    } else {
      console.log('❌ No se encontró el botón "Ver completo"');
      console.log('   Revisando HTML del sidebar...');

      const sidebarText = await mainPage.evaluate(() => {
        return document.body.innerText.substring(0, 1000);
      });

      console.log('Texto del sidebar:', sidebarText.substring(0, 300));
    }

  } else {
    console.log('❌ No se pudo abrir el Copilot');
  }

  await browser.close();
  console.log('\n🏁 Test completado');
}

testVerCompleto();
