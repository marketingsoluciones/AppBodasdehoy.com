#!/usr/bin/env node
/**
 * Captura errores de red con URLs específicas
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Verificando errores de red...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const networkErrors = [];
  const successfulRequests = [];

  // Capturar respuestas de red
  page.on('response', response => {
    const url = response.url();
    const status = response.status();

    if (url.includes('/api/')) {
      if (status >= 400) {
        networkErrors.push({ url, status });
        console.log(`❌ ${status}: ${url}`);
      } else if (status >= 200 && status < 300) {
        successfulRequests.push({ url, status });
        console.log(`✅ ${status}: ${url}`);
      }
    }
  });

  // Navegar
  try {
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'load', timeout: 10000 });
  } catch (e) {
    // Ignorar timeout
  }

  // Abrir copilot
  console.log('\n🤖 Abriendo copilot...');
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(8000);

  console.log('\n📊 RESUMEN DE RED:');
  console.log(`Requests exitosas: ${successfulRequests.length}`);
  console.log(`Requests con error: ${networkErrors.length}`);

  if (networkErrors.length > 0) {
    console.log('\n❌ ERRORES:');
    networkErrors.forEach((err, i) => {
      console.log(`${i + 1}. [${err.status}] ${err.url}`);
    });
  }

  if (successfulRequests.length > 0) {
    console.log('\n✅ EXITOSAS (primeras 5):');
    successfulRequests.slice(0, 5).forEach((req, i) => {
      console.log(`${i + 1}. [${req.status}] ${req.url}`);
    });
  }

  await browser.close();
})();
