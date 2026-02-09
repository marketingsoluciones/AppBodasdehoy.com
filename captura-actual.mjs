#!/usr/bin/env node
import { chromium } from 'playwright';

async function capturarPantalla() {
  console.log('📸 Tomando captura de pantalla del estado actual...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    const title = await page.title();

    console.log(`📍 URL: ${url}`);
    console.log(`📄 Título: ${title}\n`);

    await page.screenshot({
      path: 'captura-estado-actual.png',
      fullPage: true
    });

    console.log('✅ Captura guardada: captura-estado-actual.png\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

capturarPantalla().catch(console.error);
