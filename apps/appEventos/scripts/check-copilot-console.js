#!/usr/bin/env node
/**
 * Script para capturar logs de consola del Copilot
 */

const { chromium } = require('playwright');

const BASE = 'http://localhost:8080';

async function main() {
  console.log('='.repeat(70));
  console.log('CAPTURA DE LOGS - COPILOT');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar todos los mensajes de consola
  const consoleLogs = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log(text);
  });

  // Capturar errores
  page.on('pageerror', error => {
    const text = `[ERROR] ${error.message}`;
    consoleLogs.push(text);
    console.error(text);
  });

  try {
    console.log('\n[PASO 1] Navegando a localhost:8080...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('\n[PASO 2] Buscando botón Copilot...');
    const copilotBtn = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase();
        if (text.includes('copilot')) {
          btn.click();
          return { found: true };
        }
      }
      return { found: false };
    });

    if (copilotBtn.found) {
      console.log('  ✅ Botón clickeado, esperando...');
      await page.waitForTimeout(5000);

      console.log('\n[PASO 3] Verificando iframe...');
      const frames = page.frames();
      console.log(`  Total frames: ${frames.length}`);
      
      const chatFrame = frames.find(f => {
        const url = f.url();
        return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
      });

      if (chatFrame) {
        console.log(`  ✅ Frame encontrado: ${chatFrame.url()}`);
        console.log('\n[PASO 4] Esperando 45 segundos y capturando logs del iframe...');
        
        // Escuchar logs del iframe también
        chatFrame.on('console', msg => {
          const text = `[IFRAME-${msg.type()}] ${msg.text()}`;
          consoleLogs.push(text);
          console.log(text);
        });

        await page.waitForTimeout(45000);

        console.log('\n[PASO 5] Verificando estado del iframe...');
        const iframeContent = await chatFrame.evaluate(() => {
          return {
            hasTextarea: !!document.querySelector('textarea'),
            hasContentEditable: !!document.querySelector('[contenteditable="true"]'),
            hasLoadingOverlay: !!document.querySelector('.absolute.inset-0'),
            bodyClasses: document.body.className,
            bodyText: document.body.innerText.substring(0, 500),
          };
        }).catch(() => ({ error: 'Could not read iframe content' }));

        console.log('\n  Estado del iframe:', JSON.stringify(iframeContent, null, 2));
      } else {
        console.log('  ❌ No se encontró frame del Copilot');
      }
    }

    console.log('\n✅ Captura completada');
    console.log(`\nTotal de logs capturados: ${consoleLogs.length}`);
    
    console.log('\nNavegador quedará abierto para inspección manual.');
    console.log('Presiona Ctrl+C para cerrar.\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await new Promise(() => {});
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
