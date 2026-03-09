import { chromium } from 'playwright';

async function diagnoseCopilot() {
  console.log('🔍 Iniciando diagnóstico del Copilot...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const networkErrors = [];

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        status: response.status(),
        url: response.url().substring(0, 100),
        time: new Date().toLocaleTimeString()
      });
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.toLowerCase().includes('error')) {
      errors.push({ type: 'console', msg: text.substring(0, 200) });
    }
  });

  page.on('pageerror', error => {
    errors.push({ type: 'page', msg: error.message });
  });

  console.log('📍 Paso 1: Cargando https://app-test.bodasdehoy.com...');
  await page.goto('https://app-test.bodasdehoy.com', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  console.log('✅ Página cargada\n');

  await page.waitForTimeout(2000);

  console.log('📍 Paso 2: Buscando botón del Copilot...');

  // Buscar por diferentes métodos
  let copilotButton = null;

  // Método 1: Por clase o atributo
  const selectors = [
    '[class*="copilot" i]',
    '[class*="Copilot"]',
    'button[aria-label*="chat" i]',
    '[data-testid*="copilot"]'
  ];

  for (const sel of selectors) {
    try {
      copilotButton = await page.$(sel);
      if (copilotButton) {
        console.log('   ✅ Encontrado con: ' + sel);
        break;
      }
    } catch(e) {}
  }

  // Método 2: Buscar en esquina inferior derecha
  if (!copilotButton) {
    console.log('   Buscando elementos en esquina inferior derecha...');
    const allElements = await page.$$('button, div[role="button"], [onclick]');
    const viewport = page.viewportSize();

    for (const el of allElements) {
      const box = await el.boundingBox();
      if (box && box.x > viewport.width - 150 && box.y > viewport.height - 150) {
        console.log('   📍 Encontrado elemento en posición: x=' + box.x + ', y=' + box.y);
        copilotButton = el;
        break;
      }
    }
  }

  console.log('\n📍 Paso 3: Screenshot antes del clic...');
  await page.screenshot({ path: '/tmp/copilot-before.png' });
  console.log('   ✅ /tmp/copilot-before.png');

  console.log('\n📍 Paso 4: Haciendo clic...');
  if (copilotButton) {
    await copilotButton.click();
  } else {
    const vp = page.viewportSize();
    console.log('   Clic en coordenadas: ' + (vp.width - 60) + ', ' + (vp.height - 60));
    await page.mouse.click(vp.width - 60, vp.height - 60);
  }

  await page.waitForTimeout(5000);

  console.log('\n📍 Paso 5: Analizando iframes...');
  const iframes = await page.$$('iframe');
  console.log('   Total iframes: ' + iframes.length);

  for (let i = 0; i < iframes.length; i++) {
    const src = await iframes[i].getAttribute('src');
    const srcText = src || 'sin src';
    console.log('   [' + i + '] ' + srcText.substring(0, 80));

    if (srcText.includes('chat')) {
      console.log('   ^ Este es el iframe del chat');

      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          const bodyText = await frame.evaluate(() => document.body.innerText.substring(0, 500));
          console.log('\n   Contenido del iframe:');
          console.log('   ---');
          console.log('   ' + bodyText.replace(/\n/g, '\n   '));
          console.log('   ---');
        }
      } catch(e) {
        console.log('   ❌ No se puede leer contenido (cross-origin): ' + e.message);
      }
    }
  }

  console.log('\n📍 Paso 6: Screenshot después...');
  await page.screenshot({ path: '/tmp/copilot-after.png' });
  console.log('   ✅ /tmp/copilot-after.png');

  console.log('\n📊 RESUMEN:');
  console.log('   Errores de red (4xx/5xx): ' + networkErrors.length);
  for (const e of networkErrors.slice(0, 10)) {
    console.log('      [' + e.status + '] ' + e.url);
  }

  console.log('   Errores de consola: ' + errors.length);
  for (const e of errors.slice(0, 5)) {
    console.log('      ' + e.msg.substring(0, 100));
  }

  console.log('\n🔍 Navegador abierto. Presiona Ctrl+C para cerrar.\n');
  await new Promise(() => {});
}

diagnoseCopilot().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
