#!/usr/bin/env node
/**
 * Captura console.logs del navegador
 */

const { chromium } = require('playwright');

(async () => {
  console.log('📡 Conectando para capturar console.logs...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const logs = [];

  // Capturar console.logs
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text, timestamp: Date.now() });

    // Mostrar en tiempo real si contiene palabras clave
    if (text.includes('AUTH') || text.includes('Copilot') || text.includes('postMessage') || text.includes('EventosAutoAuth')) {
      console.log(`[${type.toUpperCase()}]`, text);
    }
  });

  console.log('✅ Escuchando console.logs...');
  console.log('⏳ Esperando 15 segundos...\n');

  await page.waitForTimeout(15000);

  // Filtrar logs relevantes
  const authLogs = logs.filter(log =>
    log.text.includes('AUTH') ||
    log.text.includes('Copilot') ||
    log.text.includes('iframe') ||
    log.text.includes('EventosAutoAuth')
  );

  console.log('\n📊 LOGS RELEVANTES CAPTURADOS:\n');
  authLogs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  console.log(`\nTotal logs capturados: ${logs.length}`);
  console.log(`Logs relevantes: ${authLogs.length}`);

  await browser.close();
})();
