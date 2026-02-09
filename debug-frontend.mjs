import { chromium } from 'playwright';
import fs from 'fs';

async function debugFrontend() {
  console.log('🔍 Iniciando debug del frontend...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  const logs = [];

  // Capturar todos los mensajes de consola
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    const logEntry = {
      type,
      text,
      location: `${location.url}:${location.lineNumber}:${location.columnNumber}`
    };

    if (type === 'error') {
      console.log(`❌ [Console Error] ${text}`);
      errors.push(logEntry);
    } else if (type === 'warning') {
      console.log(`⚠️  [Console Warning] ${text}`);
      warnings.push(logEntry);
    } else {
      logs.push(logEntry);
    }
  });

  // Capturar errores de página
  page.on('pageerror', error => {
    console.log(`💥 [Page Error] ${error.message}`);
    errors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack
    });
  });

  // Capturar peticiones fallidas
  page.on('requestfailed', request => {
    console.log(`🔴 [Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('📍 Navegando a localhost:8080...\n');
    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏱️  Esperando 5 segundos para que la app cargue...\n');
    await page.waitForTimeout(5000);

    // Captura 1: Estado inicial
    await page.screenshot({ path: 'debug-1-inicial.png', fullPage: true });
    console.log('📸 Captura 1: Estado inicial guardada\n');

    // Obtener el HTML del body
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('debug-body.html', bodyHTML);
    console.log('💾 HTML del body guardado en debug-body.html\n');

    // Verificar qué componentes están renderizados
    const componentState = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.getElementById('__next'),
        rootChildren: document.getElementById('__next')?.children.length || 0,
        bodyChildren: document.body.children.length,
        loadingElements: document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="spinner"]').length,
        errorElements: document.querySelectorAll('[class*="error"], [class*="Error"]').length,
        mainContent: document.querySelector('main')?.innerHTML.substring(0, 200) || 'No main found',
        scripts: Array.from(document.scripts).map(s => ({
          src: s.src,
          hasError: s.hasAttribute('data-error')
        })),
      };
    });

    console.log('📊 Estado de componentes:');
    console.log('   React root exists:', componentState.hasReactRoot);
    console.log('   Root children count:', componentState.rootChildren);
    console.log('   Loading elements:', componentState.loadingElements);
    console.log('   Error elements:', componentState.errorElements);
    console.log('   Main content preview:', componentState.mainContent);
    console.log('');

    // Verificar el AuthContext
    const authState = await page.evaluate(() => {
      try {
        // Intentar acceder al estado de autenticación desde window
        return {
          hasAuthContext: typeof window !== 'undefined',
          cookies: document.cookie,
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage),
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('🔐 Estado de autenticación:');
    console.log('   Cookies:', authState.cookies || 'None');
    console.log('   LocalStorage keys:', authState.localStorageKeys?.join(', ') || 'None');
    console.log('');

    // Esperar un poco más para ver si algo cambia
    console.log('⏱️  Esperando 10 segundos más para observar cambios...\n');
    await page.waitForTimeout(10000);

    // Captura 2: Después de esperar
    await page.screenshot({ path: 'debug-2-despues.png', fullPage: true });
    console.log('📸 Captura 2: Después de esperar guardada\n');

    // Verificar si cambió algo
    const componentState2 = await page.evaluate(() => ({
      rootChildren: document.getElementById('__next')?.children.length || 0,
      loadingElements: document.querySelectorAll('[class*="loading"], [class*="Loading"]').length,
      bodyClasses: document.body.className,
      bodyText: document.body.innerText.substring(0, 500),
    }));

    console.log('📊 Estado después de esperar:');
    console.log('   Root children:', componentState2.rootChildren);
    console.log('   Loading elements:', componentState2.loadingElements);
    console.log('   Body classes:', componentState2.bodyClasses);
    console.log('   Body text:', componentState2.bodyText);
    console.log('');

    // Guardar reporte de errores
    const report = {
      timestamp: new Date().toISOString(),
      errors,
      warnings,
      importantLogs: logs.filter(l =>
        l.text.includes('[Auth]') ||
        l.text.includes('[App]') ||
        l.text.includes('Error') ||
        l.text.includes('error')
      ),
      componentState,
      componentState2,
      authState,
    };

    fs.writeFileSync('debug-report.json', JSON.stringify(report, null, 2));
    console.log('💾 Reporte completo guardado en debug-report.json\n');

    console.log('📊 RESUMEN:');
    console.log(`   Total errores: ${errors.length}`);
    console.log(`   Total warnings: ${warnings.length}`);
    console.log(`   Loading elements: ${componentState2.loadingElements}`);
    console.log('');

    if (errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:');
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.text}`);
      });
    }

    console.log('\n⏳ Navegador permanecerá abierto 30 segundos para inspección manual...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n💥 Error durante el debug:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Debug completado');
  }
}

debugFrontend();
