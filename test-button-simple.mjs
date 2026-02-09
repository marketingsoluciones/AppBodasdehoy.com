import { chromium } from 'playwright';

async function testButton() {
  console.log('🧪 Test simple del botón "Abrir Copilot Completo"...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  // Capturar errores
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [Console Error] ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`💥 [Page Error] ${err.message}`);
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

    console.log('\n📍 Buscando botón "Abrir Copilot Completo"...');

    // Buscar el botón
    const expandBtn = page.locator('button:has-text("Abrir Copilot Completo")').first();
    const isVisible = await expandBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      console.log('✅ Botón encontrado');

      // Verificar el HTML del botón
      const btnInfo = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent?.includes('Abrir Copilot Completo'));

        if (!btn) return { found: false };

        return {
          found: true,
          text: btn.textContent,
          onClick: btn.onclick !== null ? 'tiene onclick' : 'sin onclick',
          hasClickListener: btn.getAttribute('onclick') !== null,
        };
      });

      console.log('📊 Info del botón:');
      console.log(`   Texto: ${btnInfo.text}`);
      console.log(`   onClick: ${btnInfo.onClick}`);

      // Método 1: Click directo y capturar nueva pestaña
      console.log('\n📍 Método 1: Click con waitForEvent...');

      try {
        const newPagePromise = context.waitForEvent('page', { timeout: 5000 });
        await expandBtn.click();

        const newPage = await newPagePromise;
        console.log('✅ Nueva pestaña abierta!');
        console.log(`   URL: ${newPage.url()}`);

        await newPage.waitForTimeout(3000);
        await newPage.screenshot({ path: 'new-tab-opened.png', fullPage: true });
        console.log('📸 Screenshot: new-tab-opened.png');

      } catch (err) {
        console.log(`❌ Click no abrió nueva pestaña: ${err.message}`);

        // Método 2: Ejecutar window.open directamente
        console.log('\n📍 Método 2: Ejecutar window.open() directamente...');

        const newPage2Promise = context.waitForEvent('page', { timeout: 5000 });

        await page.evaluate(() => {
          window.open('http://localhost:3210', '_blank', 'noopener,noreferrer');
        });

        try {
          const newPage2 = await newPage2Promise;
          console.log('✅ window.open() funcionó!');
          console.log(`   URL: ${newPage2.url()}`);
        } catch (err2) {
          console.log(`❌ window.open() también falló: ${err2.message}`);
        }
      }

    } else {
      console.log('❌ Botón NO encontrado');

      // Buscar todos los botones para debug
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(Boolean);
      });

      console.log('Botones disponibles:', allButtons.slice(0, 15));
    }

  } else {
    console.log('❌ No se pudo abrir Copilot');
  }

  console.log('\n⏳ Navegador abierto 60s...');
  await page.waitForTimeout(60000);

  await browser.close();
  console.log('✅ Test completado');
}

testButton().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
