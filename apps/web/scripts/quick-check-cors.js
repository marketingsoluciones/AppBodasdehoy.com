#!/usr/bin/env node
/**
 * Quick check - Captura errores sin esperar networkidle
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Quick check de errores CORS...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];
  const corsErrors = [];
  const otherErrors = [];

  // Capturar errores
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error' || text.includes('Error') || text.includes('error')) {
      errors.push(text);

      if (text.includes('CORS') || text.includes('blocked by CORS')) {
        corsErrors.push(text);
        console.log('❌ CORS:', text.substring(0, 100));
      } else if (text.includes('Failed to fetch') || text.includes('500')) {
        otherErrors.push(text);
        console.log('⚠️  ERROR:', text.substring(0, 100));
      }
    }
  });

  // Navegar SIN esperar networkidle
  try {
    await page.goto('http://127.0.0.1:8080', { waitUntil: 'load', timeout: 10000 });
    console.log('✅ Página cargada (load)');
  } catch (e) {
    console.log('⚠️  Timeout esperado, pero página cargó parcialmente');
  }

  // Abrir copilot
  console.log('🤖 Abriendo copilot...');
  await page.keyboard.press('Meta+Shift+C');
  await page.waitForTimeout(5000);

  console.log('\n📊 RESUMEN:');
  console.log(`Total errores: ${errors.length}`);
  console.log(`Errores CORS: ${corsErrors.length}`);
  console.log(`Otros errores: ${otherErrors.length}`);

  if (corsErrors.length === 0) {
    console.log('\n✅ ¡ÉXITO! No hay errores CORS');
  } else {
    console.log('\n❌ Todavía hay errores CORS:');
    corsErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.substring(0, 120)}`);
    });
  }

  if (otherErrors.length > 0) {
    console.log('\n⚠️  Otros errores encontrados:');
    const uniqueErrors = [...new Set(otherErrors)];
    uniqueErrors.slice(0, 5).forEach((err, i) => {
      console.log(`${i + 1}. ${err.substring(0, 120)}`);
    });
  }

  await browser.close();
})();
