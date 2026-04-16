import { chromium } from 'playwright';

async function testCopilot() {
  console.log('🚀 Abriendo navegador...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('response', r => {
    if (r.status() >= 400) {
      errors.push('[' + r.status() + '] ' + r.url().substring(0, 80));
    }
  });

  console.log('📍 Cargando app-test.bodasdehoy.com...');
  await page.goto('https://app-test.bodasdehoy.com', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  console.log('✅ Página cargada\n');

  await page.waitForTimeout(2000);

  // Buscar el botón Copilot en el header
  console.log('📍 Buscando botón "Copilot" en el header...');

  // El botón tiene texto "Copilot" visible
  const copilotBtn = await page.$('text=Copilot');

  if (copilotBtn) {
    console.log('✅ Botón encontrado!\n');

    console.log('📍 Haciendo clic en Copilot...');
    await copilotBtn.click();

    console.log('⏳ Esperando que cargue el chat (10s)...\n');
    await page.waitForTimeout(10000);

    // Screenshot
    await page.screenshot({ path: '/tmp/copilot-open.png' });
    console.log('📸 Screenshot guardado: /tmp/copilot-open.png\n');

    // Buscar iframe del chat
    const iframes = await page.$$('iframe');
    console.log('📊 Iframes encontrados: ' + iframes.length);

    for (let i = 0; i < iframes.length; i++) {
      const src = await iframes[i].getAttribute('src');
      if (src) {
        console.log('   [' + i + '] ' + src.substring(0, 100));
      }
    }

    // Verificar si hay contenido del chat visible
    const chatContent = await page.$('[class*="chat"], [class*="Chat"], [class*="copilot"], [class*="Copilot"]');
    if (chatContent) {
      console.log('\n✅ Panel del chat detectado');
    }

  } else {
    console.log('❌ No se encontró el botón Copilot');

    // Intentar otros selectores
    const altBtn = await page.$('button:has-text("Copilot"), [aria-label*="Copilot"], [class*="copilot"]');
    if (altBtn) {
      console.log('   Encontrado con selector alternativo');
      await altBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  console.log('\n📊 Errores de red: ' + errors.length);
  errors.slice(0, 5).forEach(e => console.log('   ' + e));

  console.log('\n🔍 Navegador abierto para inspección...\n');
  await new Promise(() => {});
}

testCopilot().catch(e => console.error('Error:', e.message));
