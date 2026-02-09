import { chromium } from 'playwright';
import fs from 'fs';

async function captureConsoleErrors() {
  console.log('🔍 Capturando errores de consola en ambas apps...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  // Almacenar todos los errores
  const errors = {
    web: {
      console: [],
      network: [],
      page: [],
      warnings: []
    },
    copilot: {
      console: [],
      network: [],
      page: [],
      warnings: []
    }
  };

  // ===========================================
  // PARTE 1: apps/web (localhost:8080)
  // ===========================================
  console.log('📍 PARTE 1: Analizando apps/web (localhost:8080)...\n');

  const webPage = await context.newPage();

  // Capturar eventos de consola
  webPage.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    if (type === 'error') {
      errors.web.console.push({
        type: 'ERROR',
        text,
        url: location.url,
        line: location.lineNumber
      });
      console.log(`❌ [apps/web Console Error] ${text}`);
    } else if (type === 'warning') {
      errors.web.warnings.push({
        type: 'WARNING',
        text,
        url: location.url
      });
      console.log(`⚠️  [apps/web Warning] ${text}`);
    }
  });

  // Capturar errores de página (JavaScript)
  webPage.on('pageerror', err => {
    errors.web.page.push({
      message: err.message,
      stack: err.stack
    });
    console.log(`💥 [apps/web Page Error] ${err.message}`);
  });

  // Capturar errores de red
  webPage.on('response', response => {
    if (!response.ok() && response.status() >= 400) {
      errors.web.network.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`🌐 [apps/web Network Error] ${response.status()} - ${response.url()}`);
    }
  });

  console.log('Loading http://localhost:8080...');
  await webPage.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await webPage.waitForTimeout(5000); // Esperar 5s para que cargue todo

  console.log('\n📍 Abriendo Copilot sidebar en apps/web...');
  const copilotBtn = webPage.locator('button:has-text("Copilot")').first();

  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    await copilotBtn.click();
    await webPage.waitForTimeout(4000); // Esperar a que cargue el Copilot

    await webPage.screenshot({ path: 'web-copilot-opened.png', fullPage: true });
    console.log('📸 Screenshot guardado: web-copilot-opened.png');

    // ===========================================
    // PARTE 2: Abrir apps/copilot en nueva pestaña
    // ===========================================
    console.log('\n📍 PARTE 2: Clickeando "Abrir Copilot Completo"...\n');

    const expandBtn = webPage.locator('button:has-text("Abrir Copilot Completo")').first();

    if (await expandBtn.isVisible({ timeout: 3000 })) {
      console.log('✅ Botón "Abrir Copilot Completo" encontrado');

      // Esperar a que se abra la nueva pestaña
      const [copilotPage] = await Promise.all([
        context.waitForEvent('page'),
        expandBtn.click()
      ]);

      console.log('\n📍 Nueva pestaña abierta, configurando listeners...');

      // Capturar eventos de consola en copilot
      copilotPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        const location = msg.location();

        if (type === 'error') {
          errors.copilot.console.push({
            type: 'ERROR',
            text,
            url: location.url,
            line: location.lineNumber
          });
          console.log(`❌ [apps/copilot Console Error] ${text}`);
        } else if (type === 'warning') {
          errors.copilot.warnings.push({
            type: 'WARNING',
            text,
            url: location.url
          });
          console.log(`⚠️  [apps/copilot Warning] ${text}`);
        }
      });

      // Capturar errores de página en copilot
      copilotPage.on('pageerror', err => {
        errors.copilot.page.push({
          message: err.message,
          stack: err.stack
        });
        console.log(`💥 [apps/copilot Page Error] ${err.message}`);
      });

      // Capturar errores de red en copilot
      copilotPage.on('response', response => {
        if (!response.ok() && response.status() >= 400) {
          errors.copilot.network.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
          console.log(`🌐 [apps/copilot Network Error] ${response.status()} - ${response.url()}`);
        }
      });

      await copilotPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await copilotPage.waitForTimeout(8000); // Esperar 8s para que cargue completamente

      const copilotUrl = copilotPage.url();
      console.log(`\n📍 URL de apps/copilot: ${copilotUrl}`);

      if (copilotUrl.includes('localhost:3210') || copilotUrl.includes('127.0.0.1:3210')) {
        console.log('✅ Se abrió el Copilot LOCAL correcto (puerto 3210)');
      } else {
        console.log(`⚠️  URL inesperada: ${copilotUrl}`);
      }

      // Verificar funcionalidades del editor
      const editorInfo = await copilotPage.evaluate(() => {
        const title = document.title;
        const hasEditor = document.querySelectorAll('[contenteditable="true"]').length > 0;
        const hasToolbar = document.querySelector('[class*="toolbar"], [class*="format"], [class*="typobar"]') !== null;
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);

        return {
          title,
          hasEditor,
          hasToolbar,
          buttonsCount: buttons.length,
          sampleButtons: buttons.slice(0, 15),
        };
      });

      console.log('\n📊 Funcionalidades en apps/copilot:');
      console.log(`   Título: ${editorInfo.title}`);
      console.log(`   Tiene editor: ${editorInfo.hasEditor ? '✅' : '❌'}`);
      console.log(`   Tiene toolbar: ${editorInfo.hasToolbar ? '✅' : '❌'}`);
      console.log(`   Botones: ${editorInfo.buttonsCount}`);
      console.log(`   Ejemplos: ${editorInfo.sampleButtons.slice(0, 8).join(', ')}`);

      await copilotPage.screenshot({ path: 'copilot-full-version.png', fullPage: true });
      console.log('📸 Screenshot guardado: copilot-full-version.png');

    } else {
      console.log('❌ No se encontró el botón "Abrir Copilot Completo"');
    }
  } else {
    console.log('❌ No se pudo abrir el Copilot en apps/web');
  }

  // ===========================================
  // PARTE 3: Resumen de Errores
  // ===========================================
  console.log('\n\n===========================================');
  console.log('📊 RESUMEN DE ERRORES CAPTURADOS');
  console.log('===========================================\n');

  console.log('🌐 apps/web (localhost:8080):');
  console.log(`   Console Errors: ${errors.web.console.length}`);
  console.log(`   Page Errors: ${errors.web.page.length}`);
  console.log(`   Network Errors: ${errors.web.network.length}`);
  console.log(`   Warnings: ${errors.web.warnings.length}`);

  console.log('\n🚀 apps/copilot (localhost:3210):');
  console.log(`   Console Errors: ${errors.copilot.console.length}`);
  console.log(`   Page Errors: ${errors.copilot.page.length}`);
  console.log(`   Network Errors: ${errors.copilot.network.length}`);
  console.log(`   Warnings: ${errors.copilot.warnings.length}`);

  // Mostrar detalles de errores críticos
  if (errors.web.console.length > 0) {
    console.log('\n❌ Errores de Consola en apps/web:');
    errors.web.console.slice(0, 10).forEach((err, i) => {
      console.log(`\n   ${i + 1}. ${err.text}`);
      if (err.url) console.log(`      📁 ${err.url}:${err.line}`);
    });
  }

  if (errors.web.page.length > 0) {
    console.log('\n💥 Errores de JavaScript en apps/web:');
    errors.web.page.slice(0, 5).forEach((err, i) => {
      console.log(`\n   ${i + 1}. ${err.message}`);
      if (err.stack) console.log(`      ${err.stack.split('\n').slice(0, 3).join('\n      ')}`);
    });
  }

  if (errors.copilot.console.length > 0) {
    console.log('\n❌ Errores de Consola en apps/copilot:');
    errors.copilot.console.slice(0, 10).forEach((err, i) => {
      console.log(`\n   ${i + 1}. ${err.text}`);
      if (err.url) console.log(`      📁 ${err.url}:${err.line}`);
    });
  }

  if (errors.copilot.page.length > 0) {
    console.log('\n💥 Errores de JavaScript en apps/copilot:');
    errors.copilot.page.slice(0, 5).forEach((err, i) => {
      console.log(`\n   ${i + 1}. ${err.message}`);
      if (err.stack) console.log(`      ${err.stack.split('\n').slice(0, 3).join('\n      ')}`);
    });
  }

  // Guardar reporte completo en JSON
  const report = {
    timestamp: new Date().toISOString(),
    errors,
    summary: {
      web: {
        totalErrors: errors.web.console.length + errors.web.page.length + errors.web.network.length,
        totalWarnings: errors.web.warnings.length
      },
      copilot: {
        totalErrors: errors.copilot.console.length + errors.copilot.page.length + errors.copilot.network.length,
        totalWarnings: errors.copilot.warnings.length
      }
    }
  };

  fs.writeFileSync('error-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Reporte completo guardado en: error-report.json');

  console.log('\n⏳ Navegador abierto 90 segundos para inspección manual...');
  await webPage.waitForTimeout(90000);

  await browser.close();
  console.log('\n✅ Análisis completado');
}

captureConsoleErrors().catch(err => {
  console.error('Error en el script:', err);
  process.exit(1);
});
