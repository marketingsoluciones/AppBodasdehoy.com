#!/usr/bin/env node
/**
 * Abre navegador con CDP habilitado para control remoto
 * Permite que Claude MCP se conecte y controle el navegador
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Abriendo navegador con CDP habilitado...');
  console.log('📡 Puerto CDP: 9222');
  console.log('💡 Claude MCP podrá conectarse y controlarlo\n');

  // Abrir navegador con debugging habilitado
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: [
      '--window-size=1800,1200',
      '--window-position=100,50',
      '--remote-debugging-port=9222', // ✅ CDP habilitado
    ],
  });

  const context = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const page = await context.newPage();

  console.log('✅ Navegador abierto y listo');
  console.log('📄 Navegando a http://127.0.0.1:8080...\n');

  await page.goto('http://127.0.0.1:8080', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('✅ Página cargada');
  console.log('🎯 Puedes controlar este navegador desde Claude MCP');
  console.log('📡 CDP endpoint: http://localhost:9222');
  console.log('\n💡 Para abrir el copilot: Presiona Cmd+Shift+C');
  console.log('🛑 Para cerrar: Presiona Ctrl+C en esta terminal\n');

  console.log('================================================================================');
  console.log('NAVEGADOR LISTO PARA CONTROL MCP');
  console.log('================================================================================\n');

  // Mantener el script corriendo
  await new Promise(() => {});
})();
