#!/usr/bin/env node
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Capturando errores de consola...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];
  const warnings = [];
  const logs = [];

  // Escuchar console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
      console.log('❌ ERROR:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      if (text.includes('Error') || text.includes('fail') || text.includes('autenticación') || text.includes('usuario')) {
        console.log('⚠️ WARNING:', text);
      }
    } else if (text.includes('Error') || text.includes('autenticación') || text.includes('usuario no existe')) {
      logs.push(text);
      console.log('📝 LOG:', text);
    }
  });

  // Escuchar errores de página
  page.on('pageerror', error => {
    console.log('💥 PAGE ERROR:', error.message);
    errors.push(`Page Error: ${error.message}`);
  });

  console.log('\n✅ Escuchando errores...');
  console.log('⏳ Esperando 10 segundos...\n');

  await page.waitForTimeout(10000);

  console.log('\n📊 RESUMEN DE ERRORES:\n');
  console.log(`Total Errores: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  console.log(`Logs relevantes: ${logs.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORES CAPTURADOS:');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.substring(0, 150)}`);
    });
  }

  if (logs.length > 0) {
    console.log('\n📝 LOGS RELEVANTES:');
    logs.forEach((log, i) => {
      console.log(`${i + 1}. ${log.substring(0, 150)}`);
    });
  }

  // Guardar en archivo
  const report = {
    timestamp: new Date().toISOString(),
    url: await page.url(),
    errors,
    warnings: warnings.filter(w => w.includes('Error') || w.includes('fail') || w.includes('autenticación')),
    logs,
  };

  const fs = require('fs');
  fs.writeFileSync(
    '/Users/juancarlosparra/Projects/AppBodasdehoy.com/ERRORES_CONSOLA.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Reporte guardado: ERRORES_CONSOLA.json');

  await browser.close();
})();
