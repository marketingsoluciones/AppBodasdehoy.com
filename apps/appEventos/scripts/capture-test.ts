import { chromium } from 'playwright';

async function captureTest() {
  console.log('🚀 Capturando estado de la app...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Capturar logs de consola
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log('📋 Console:', text);
  });

  // Capturar errores de página
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  // Capturar respuestas de red
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🔴 HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    console.log('📍 Navegando a app-test.bodasdehoy.com/login...');
    await page.goto('https://app-test.bodasdehoy.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Esperar a que cargue
    await page.waitForTimeout(3000);

    // Tomar screenshot
    const screenshotPath = '/tmp/app-test-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot guardado: ${screenshotPath}`);

    // Capturar HTML de errores visibles
    const errorElements = await page.locator('.error, [class*="error"], .text-red, [class*="Error"]').all();
    if (errorElements.length > 0) {
      console.log('\n❌ Errores encontrados en la página:');
      for (const el of errorElements) {
        const text = await el.textContent();
        if (text?.trim()) {
          console.log(`   - ${text.trim()}`);
        }
      }
    }

    // Verificar si hay overlay de error de Next.js
    const nextError = await page.locator('[data-nextjs-dialog], #__next-build-watcher').first();
    if (await nextError.isVisible()) {
      console.log('\n⚠️ Error overlay de Next.js detectado');
      const errorContent = await page.locator('[data-nextjs-dialog-content]').textContent();
      if (errorContent) {
        console.log('Error:', errorContent);
      }
    }

    // Mostrar URL actual
    console.log(`\n📍 URL actual: ${page.url()}`);

    // Mostrar logs de consola relevantes
    console.log('\n📋 Logs de consola (últimos 20):');
    consoleLogs.slice(-20).forEach(log => console.log(`   ${log}`));

    // Mantener abierto
    console.log('\n👀 Navegador abierto. Presiona Ctrl+C para cerrar.');
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/tmp/app-test-error.png' });
  }
}

captureTest().catch(console.error);
