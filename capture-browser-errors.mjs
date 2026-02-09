#!/usr/bin/env node
import { chromium } from 'playwright';

async function captureBrowserErrors() {
  console.log('🔍 Capturando errores del navegador...\\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors = [];
  const warnings = [];
  const logs = [];

  // Capturar TODOS los mensajes
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      errors.push(text);
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️  WARNING: ${text}`);
    } else if (type === 'log' || type === 'info') {
      logs.push(text);
    }
  });

  // Capturar errores de página no capturados
  page.on('pageerror', error => {
    const msg = error.toString();
    errors.push(msg);
    console.log(`💥 PAGE ERROR: ${msg}`);
  });

  // Capturar errores de request
  page.on('requestfailed', request => {
    const failure = request.failure();
    console.log(`🔴 REQUEST FAILED: ${request.url()} - ${failure?.errorText || 'Unknown'}`);
  });

  try {
    console.log('📝 Navegando a localhost:8080...\\n');
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log('\\n📝 Abriendo Copilot con ⌘⇧C...\\n');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(8000);

    console.log('\\n═══════════════════════════════════════════════════════════');
    console.log('RESUMEN DE ERRORES');
    console.log('═══════════════════════════════════════════════════════════\\n');
    console.log(`Total de errores: ${errors.length}`);
    console.log(`Total de warnings: ${warnings.length}\\n`);

    if (errors.length > 0) {
      console.log('📋 ERRORES ÚNICOS:\\n');
      const uniqueErrors = [...new Set(errors)];
      uniqueErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}\\n`);
      });
    } else {
      console.log('✅ No se encontraron errores de JavaScript\\n');
    }

    // Inspeccionar el DOM para ver si React renderizó algo
    const reactInfo = await page.evaluate(() => {
      const root = document.querySelector('#__next');
      if (!root) return { hasRoot: false };

      // Buscar componentes React en el árbol
      const allDivs = Array.from(document.querySelectorAll('div'));
      const reactComponents = allDivs.filter(div => {
        // React suele poner data attributes o clases específicas
        const hasReactProps = Object.keys(div).some(key => key.startsWith('__react'));
        return hasReactProps;
      });

      return {
        hasRoot: true,
        totalElements: allDivs.length,
        reactComponentsFound: reactComponents.length,
        bodyClasses: document.body.className,
        rootChildren: root.children.length,
      };
    });

    console.log('📊 INFO DE REACT:\\n');
    console.log(`   React root existe: ${reactInfo.hasRoot}`);
    console.log(`   Elementos totales: ${reactInfo.totalElements}`);
    console.log(`   Componentes React: ${reactInfo.reactComponentsFound}`);
    console.log(`   Root children: ${reactInfo.rootChildren}\\n`);

  } catch (error) {
    console.error('❌ Error en el script:', error.message);
  }
}

captureBrowserErrors().catch(console.error);
