import { chromium } from 'playwright';

async function openCopilot() {
  console.log('🚀 Abriendo Copilot...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });

  const page = await browser.newPage();

  const networkErrors = [];
  page.on('response', r => {
    if (r.status() >= 400) {
      networkErrors.push({ status: r.status(), url: r.url().substring(0, 80) });
      console.log('❌ [' + r.status() + '] ' + r.url().substring(0, 60));
    }
  });

  console.log('📍 Cargando app-test.bodasdehoy.com...');
  await page.goto('https://app-test.bodasdehoy.com', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✅ Página cargada\n');

  await page.waitForTimeout(2000);

  // Encontrar y hacer clic en el botón Copilot
  console.log('📍 Buscando botón Copilot...');
  const copilotBtn = await page.$('button:has-text("Copilot")');

  if (copilotBtn) {
    console.log('✅ Botón encontrado\n');

    console.log('📍 Haciendo clic...');
    await copilotBtn.click();

    console.log('⏳ Esperando que cargue el Copilot (15s)...\n');
    await page.waitForTimeout(15000);

    // Verificar iframes
    const iframes = await page.$$('iframe');
    console.log('📊 Iframes: ' + iframes.length);
    for (const iframe of iframes) {
      const src = await iframe.getAttribute('src');
      if (src) {
        console.log('   ' + src.substring(0, 100));

        // Si es el iframe del chat, intentar leer contenido
        if (src.includes('chat')) {
          console.log('\n📍 Analizando iframe del chat...');
          try {
            const frame = await iframe.contentFrame();
            if (frame) {
              await frame.waitForTimeout(2000);
              const bodyText = await frame.evaluate(() => {
                return document.body ? document.body.innerText.substring(0, 300) : 'No body';
              });
              console.log('   Contenido: ' + bodyText.replace(/\n/g, ' ').substring(0, 200));
            }
          } catch(e) {
            console.log('   (cross-origin - no se puede leer)');
          }
        }
      }
    }

    // Screenshot
    await page.screenshot({ path: '/tmp/copilot-opened.png' });
    console.log('\n📸 Screenshot: /tmp/copilot-opened.png');

  } else {
    console.log('❌ Botón no encontrado');
  }

  console.log('\n📊 RESUMEN:');
  console.log('   Errores de red: ' + networkErrors.length);
  networkErrors.slice(0, 5).forEach(e => console.log('      [' + e.status + '] ' + e.url));

  console.log('\n🔍 Navegador abierto. Ctrl+C para cerrar.\n');
  await new Promise(() => {});
}

openCopilot().catch(e => console.error('Error:', e.message));
