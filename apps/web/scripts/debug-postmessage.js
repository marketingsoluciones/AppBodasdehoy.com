#!/usr/bin/env node
/**
 * Debug postMessage entre parent e iframe del copilot
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Conectando al navegador para debug postMessage...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Inyectar listener de postMessage en el parent
  await page.evaluate(() => {
    window.__postMessageLog = [];

    // Intercept postMessage enviados
    const originalPostMessage = window.postMessage;
    window.postMessage = function(...args) {
      window.__postMessageLog.push({
        type: 'SENT_PARENT',
        timestamp: Date.now(),
        data: args[0],
      });
      console.log('📤 [Parent] postMessage SENT:', args[0]);
      return originalPostMessage.apply(this, args);
    };

    // Listen postMessage recibidos
    window.addEventListener('message', (event) => {
      window.__postMessageLog.push({
        type: 'RECEIVED_PARENT',
        timestamp: Date.now(),
        data: event.data,
        origin: event.origin,
      });
      console.log('📥 [Parent] postMessage RECEIVED:', event.data);
    });

    // Intercept postMessage del iframe
    const iframe = document.querySelector('iframe[title*="Copilot"]');
    if (iframe && iframe.contentWindow) {
      const originalIframePostMessage = iframe.contentWindow.postMessage;
      iframe.contentWindow.postMessage = function(...args) {
        window.__postMessageLog.push({
          type: 'SENT_TO_IFRAME',
          timestamp: Date.now(),
          data: args[0],
          targetOrigin: args[1],
        });
        console.log('📤 [Parent→Iframe] postMessage:', args[0]);
        return originalIframePostMessage.apply(this, args);
      };
    }
  });

  console.log('✅ Listeners de postMessage inyectados');
  console.log('⏳ Esperando 10 segundos para capturar mensajes...\n');

  await page.waitForTimeout(10000);

  // Obtener log de mensajes
  const log = await page.evaluate(() => window.__postMessageLog || []);

  console.log('📊 MENSAJES CAPTURADOS:\n');
  console.log(JSON.stringify(log, null, 2));

  // Verificar si AUTH_CONFIG fue enviado
  const authSent = log.find(m => m.data?.type === 'AUTH_CONFIG');
  const authReceived = log.find(m => m.data?.type === 'AUTH_REQUEST');

  console.log('\n📋 RESUMEN:');
  console.log(`  AUTH_CONFIG enviado: ${authSent ? '✅ SÍ' : '❌ NO'}`);
  console.log(`  AUTH_REQUEST recibido: ${authReceived ? '✅ SÍ' : '❌ NO'}`);

  if (authSent) {
    console.log('\n  Datos AUTH_CONFIG:', JSON.stringify(authSent.data.payload, null, 2));
  }

  await browser.close();
})();
