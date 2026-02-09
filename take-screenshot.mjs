#!/usr/bin/env node
import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Esperar 2s para que cargue todo

    await page.screenshot({
      path: 'screenshot-estado-actual.png',
      fullPage: true
    });

    console.log('✅ Screenshot guardado: screenshot-estado-actual.png');

    // Obtener información adicional
    const url = page.url();
    const title = await page.title();

    console.log('📍 URL:', url);
    console.log('📄 Título:', title);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

takeScreenshot();
