#!/usr/bin/env node
import { chromium } from 'playwright';

async function checkLoadedFiles() {
  console.log('🔍 Verificando archivos cargados en el navegador...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Obtener el hash del archivo _app.js para ver si es el correcto
    const appFileInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const appScript = scripts.find(s => s.src.includes('pages/_app'));

      if (!appScript) return null;

      return {
        src: appScript.src,
        fullPath: appScript.src
      };
    });

    if (appFileInfo) {
      console.log('📦 Archivo _app.js cargado:');
      console.log(`   ${appFileInfo.fullPath}\n`);

      // Intentar obtener el contenido para ver si tiene el fix
      console.log('🔍 Verificando si el fix está en el código cargado...');

      const hasValidation = await page.evaluate(() => {
        // Buscar en el código fuente de la página
        const pageSource = document.documentElement.innerHTML;

        // Buscar indicios del fix (el console.warn que agregamos)
        const hasWarn = pageSource.includes('Development not found for domain');
        const hasFirstSubdomain = pageSource.includes('firstSubdomain');

        return {
          hasWarn,
          hasFirstSubdomain,
          searchSample: pageSource.substring(pageSource.indexOf('Auth'), pageSource.indexOf('Auth') + 500)
        };
      });

      console.log(`   ⚠️  Validación "Development not found": ${hasValidation.hasWarn ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   ⚠️  Variable "firstSubdomain": ${hasValidation.hasFirstSubdomain ? '✅ SÍ' : '❌ NO'}\n`);

      if (!hasValidation.hasWarn && !hasValidation.hasFirstSubdomain) {
        console.log('❌ El código del navegador NO tiene el fix. Código viejo cacheado.\n');
      } else {
        console.log('✅ El código parece tener el fix.\n');
      }
    } else {
      console.log('⚠️  No se encontró script _app.js\n');
    }

    // Verificar todas las solicitudes de red pendientes
    console.log('🌐 Verificando conexión al servidor...');
    const serverCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8080/', { method: 'HEAD' });
        return {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (serverCheck.error) {
      console.log(`   ❌ Error al conectar: ${serverCheck.error}\n`);
    } else {
      console.log(`   ✅ Servidor responde: HTTP ${serverCheck.status}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLoadedFiles().catch(console.error);
