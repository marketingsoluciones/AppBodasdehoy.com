import { chromium } from 'playwright';

async function testCopilotNavigation() {
  console.log('🧪 Test de navegación a /copilot (SIN popups)...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

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
    } else if (text.includes('[ChatSidebar]')) {
      console.log(`📝 ${text}`);
    }
  });

  console.log('📍 Paso 1: Cargar localhost:8080...');
  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(4000);

  console.log('📍 Paso 2: Abrir Copilot sidebar...');
  const copilotBtn = page.locator('button:has-text("Copilot")').first();

  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    await copilotBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'step-1-sidebar-opened.png', fullPage: true });
    console.log('📸 Screenshot: step-1-sidebar-opened.png');

    console.log('\n📍 Paso 3: Buscar botón "Ver completo"...');

    // Buscar el botón "Ver completo" en el header
    const verCompletoBtn = page.locator('button:has-text("Ver completo")').first();

    if (await verCompletoBtn.isVisible({ timeout: 3000 })) {
      console.log('✅ Botón "Ver completo" encontrado en header');

      // Configurar listener de navegación
      const navigationPromise = page.waitForURL('**/copilot', { timeout: 10000 }).catch(() => null);

      console.log('\n📍 Paso 4: Click en "Ver completo"...');
      await verCompletoBtn.click();

      // Esperar navegación
      console.log('⏳ Esperando navegación a /copilot...');
      await navigationPromise;

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`\n📍 URL actual: ${currentUrl}`);

      if (currentUrl.includes('/copilot')) {
        console.log('✅ ¡Navegación exitosa a /copilot!');
        console.log('   🎉 SIN popups - navegación interna correcta');

        await page.screenshot({ path: 'step-2-copilot-page.png', fullPage: true });
        console.log('📸 Screenshot: step-2-copilot-page.png');

        // Esperar a que cargue el iframe
        await page.waitForTimeout(5000);

        // Verificar que el iframe existe
        const iframeInfo = await page.evaluate(() => {
          const iframes = Array.from(document.querySelectorAll('iframe'));
          return {
            count: iframes.length,
            srcs: iframes.map(iframe => ({
              src: iframe.src,
              width: iframe.offsetWidth,
              height: iframe.offsetHeight
            }))
          };
        });

        console.log('\n📊 Análisis de la página /copilot:');
        console.log(`   Iframes encontrados: ${iframeInfo.count}`);
        iframeInfo.srcs.forEach((iframe, i) => {
          console.log(`\n   Iframe ${i + 1}:`);
          console.log(`     URL: ${iframe.src}`);
          console.log(`     Size: ${iframe.width}x${iframe.height}`);

          if (iframe.src.includes('localhost:3210') || iframe.src.includes('127.0.0.1:3210')) {
            console.log('     ✅ Apunta a apps/copilot (puerto 3210) - ¡CORRECTO!');
          } else {
            console.log(`     ⚠️  Apunta a: ${iframe.src}`);
          }
        });

        if (iframeInfo.count > 0) {
          console.log('\n🎉 ¡ÉXITO! El Copilot completo se está cargando en iframe sin popups');
        } else {
          console.log('\n⚠️  No se encontraron iframes - puede estar cargando');
        }

      } else {
        console.log(`❌ No navegó a /copilot. URL actual: ${currentUrl}`);
      }

    } else {
      console.log('❌ Botón "Ver completo" NO encontrado');

      // Buscar todos los botones para debug
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(Boolean);
      });

      console.log('Botones disponibles:', allButtons.slice(0, 20));
    }

  } else {
    console.log('❌ No se pudo abrir Copilot');
  }

  console.log('\n📊 Resumen:');
  console.log(`   Errores capturados: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\n   Errores:');
    errors.slice(0, 5).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
    });
  }

  console.log('\n⏳ Navegador abierto 90 segundos para inspección manual...');
  await page.waitForTimeout(90000);

  await browser.close();
  console.log('\n✅ Test completado');
}

testCopilotNavigation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
