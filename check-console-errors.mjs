#!/usr/bin/env node
import { chromium } from 'playwright';

async function checkConsoleErrors() {
  console.log('🔍 Verificando errores en consola del navegador...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];
  const warnings = [];
  const logs = [];

  // Capturar eventos de consola
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    } else if (type === 'log') {
      logs.push(text);
    }
  });

  // Capturar errores de página
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    console.log('📝 Escuchando eventos de consola por 5 segundos...\n');

    // Obtener errores actuales
    const consoleMessages = await page.evaluate(() => {
      // Intentar obtener información del estado del Copilot
      const copilotPanel = Array.from(document.querySelectorAll('div')).find(
        div => div.textContent?.includes('Copilot IA')
      );

      return {
        hasCopilotPanel: !!copilotPanel,
        panelHTML: copilotPanel ? copilotPanel.innerHTML : '',
        documentHTML: document.body.innerHTML.length
      };
    });

    console.log(`✅ Panel Copilot encontrado: ${consoleMessages.hasCopilotPanel}\n`);

    if (consoleMessages.hasCopilotPanel) {
      console.log('📊 Contenido del panel Copilot:\n');

      // Analizar el HTML del panel
      const panelHTML = consoleMessages.panelHTML;

      // Buscar indicios de componentes
      const hasTextarea = panelHTML.includes('<textarea');
      const hasInput = panelHTML.includes('<input');
      const hasForm = panelHTML.includes('<form');
      const hasButton = panelHTML.includes('<button');
      const hasSVG = panelHTML.includes('<svg');

      console.log(`   Tiene <textarea>: ${hasTextarea ? '✅' : '❌'}`);
      console.log(`   Tiene <input>: ${hasInput ? '✅' : '❌'}`);
      console.log(`   Tiene <form>: ${hasForm ? '✅' : '❌'}`);
      console.log(`   Tiene <button>: ${hasButton ? '✅' : '❌'}`);
      console.log(`   Tiene <svg>: ${hasSVG ? '✅' : '❌'}\n`);

      // Mostrar una porción del HTML para diagnóstico
      console.log('📄 Primeros 1000 caracteres del HTML del panel:\n');
      console.log(panelHTML.substring(0, 1000));
      console.log('...\n');
    }

    // Esperar un poco para capturar mensajes de consola
    await page.waitForTimeout(5000);

    console.log('\n📊 Resumen de mensajes de consola:\n');
    console.log(`   Errores: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Logs: ${logs.length}\n`);

    if (errors.length > 0) {
      console.log('❌ Errores encontrados:\n');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  Warnings encontrados:\n');
      warnings.slice(0, 5).forEach((warn, idx) => {
        console.log(`   ${idx + 1}. ${warn}\n`);
      });
    }

    if (logs.length > 0) {
      console.log('📝 Logs recientes (últimos 10):\n');
      logs.slice(-10).forEach((log, idx) => {
        console.log(`   ${idx + 1}. ${log}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkConsoleErrors().catch(console.error);
