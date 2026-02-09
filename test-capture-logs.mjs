#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';

async function runTests() {
  console.log('🚀 Capturando TODOS los logs de la consola\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  // Array para almacenar todos los logs
  const consoleLogs = [];
  const networkLogs = [];

  // Capturar TODOS los mensajes de consola
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);

    consoleLogs.push({ timestamp, type, text });

    // Mostrar en tiempo real
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
  });

  // Capturar navegaciones
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
      console.log(`\n🔄 [${timestamp}] NAVEGACIÓN: ${url}\n`);
      networkLogs.push({ timestamp, event: 'navigation', url });
    }
  });

  // Capturar errores de página
  page.on('pageerror', error => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
    console.log(`\n❌ [${timestamp}] ERROR DE PÁGINA: ${error.message}\n`);
    consoleLogs.push({ timestamp, type: 'error', text: error.message });
  });

  try {
    console.log('📝 Navegando a /login?debug-no-redirect=1...\n');
    await page.goto(`${BASE_URL}/login?debug-no-redirect=1`, { waitUntil: 'networkidle' });

    console.log('\n⏱️  Esperando 8 segundos para observar comportamiento...\n');
    await page.waitForTimeout(8000);

    const finalUrl = page.url();
    console.log(`\n📍 URL FINAL: ${finalUrl}\n`);

    if (finalUrl.includes('/login')) {
      console.log('✅ Permanece en /login - No hubo redirect\n');
    } else {
      console.log('❌ Se redirigió a:', finalUrl, '\n');

      // Analizar logs para encontrar el culpable
      console.log('🔍 Analizando logs para encontrar el redirect...\n');

      const authLogs = consoleLogs.filter(log => log.text.includes('[Auth]'));
      if (authLogs.length > 0) {
        console.log('📋 Logs de [Auth]:');
        authLogs.forEach(log => {
          console.log(`   [${log.timestamp}] [${log.type}] ${log.text}`);
        });
        console.log('');
      }

      const redirectLogs = consoleLogs.filter(log =>
        log.text.toLowerCase().includes('redirect') ||
        log.text.toLowerCase().includes('redirigiendo')
      );
      if (redirectLogs.length > 0) {
        console.log('📋 Logs con "redirect":');
        redirectLogs.forEach(log => {
          console.log(`   [${log.timestamp}] [${log.type}] ${log.text}`);
        });
        console.log('');
      }
    }

    console.log('⏸️  Navegador abierto para inspección (60 segundos)...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    // Guardar logs a archivo
    const fs = await import('fs');
    fs.writeFileSync('console-logs.json', JSON.stringify({
      consoleLogs,
      networkLogs,
      finalUrl: page.url()
    }, null, 2));
    console.log('\n💾 Logs guardados en: console-logs.json');

    console.log('\n👋 Cerrando navegador');
    await context.close();
    await browser.close();
  }
}

runTests().catch(console.error);
