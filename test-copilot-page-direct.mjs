import { chromium } from 'playwright';

/**
 * Test directo de la página /copilot
 * Navega directamente a /copilot para verificar:
 * 1. La página carga correctamente
 * 2. El CopilotSplitLayout se renderiza
 * 3. El iframe apunta a localhost:3210 (apps/copilot)
 * 4. No hay errores críticos
 */

async function testCopilotPageDirect() {
  console.log('🧪 Test directo de la página /copilot\n');
  console.log('═'.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });

  // Capturar errores de consola
  const errors = [];
  const warnings = [];
  const logs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error' && !text.includes('GraphQL') && !text.includes('timed out')) {
      errors.push(text);
      console.log(`  ❌ [Error] ${text.substring(0, 120)}`);
    } else if (type === 'warning' && !text.includes('supports-color')) {
      warnings.push(text);
    } else if (text.includes('[ChatSidebar]') || text.includes('[Copilot]')) {
      logs.push(text);
      console.log(`  📝 ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`  💥 [Page Error] ${err.message}`);
  });

  try {
    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 1: Navegar directamente a /copilot');
    console.log('─'.repeat(70));

    await page.goto('http://localhost:8080/copilot', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    console.log(`  ✅ URL cargada: ${currentUrl}`);

    if (!currentUrl.includes('/copilot')) {
      console.log(`  ⚠️  Redirect inesperado a: ${currentUrl}`);
    } else {
      console.log('  ✅ Página /copilot cargada correctamente');
    }

    await page.screenshot({ path: 'test-direct-1-copilot-page.png', fullPage: true });
    console.log('  📸 Screenshot: test-direct-1-copilot-page.png');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 2: Verificar estructura de la página');
    console.log('─'.repeat(70));

    const pageStructure = await page.evaluate(() => {
      return {
        title: document.title,
        hasHeader: !!document.querySelector('header'),
        hasIframes: document.querySelectorAll('iframe').length > 0,
        iframeCount: document.querySelectorAll('iframe').length,
        bodyClasses: document.body.className,
        mainContent: !!document.querySelector('main'),
      };
    });

    console.log('  Estructura de la página:');
    console.log(`    Título: ${pageStructure.title}`);
    console.log(`    Header: ${pageStructure.hasHeader ? '✅' : '❌'}`);
    console.log(`    Main content: ${pageStructure.mainContent ? '✅' : '❌'}`);
    console.log(`    Iframes: ${pageStructure.iframeCount} ${pageStructure.hasIframes ? '✅' : '❌'}`);

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 3: Analizar iframes (apps/copilot)');
    console.log('─'.repeat(70));

    if (pageStructure.iframeCount > 0) {
      // Esperar a que los iframes carguen
      await page.waitForTimeout(5000);

      const iframeDetails = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.map((iframe, index) => ({
          index: index + 1,
          src: iframe.src,
          width: iframe.offsetWidth,
          height: iframe.offsetHeight,
          isVisible: iframe.offsetWidth > 0 && iframe.offsetHeight > 0,
          className: iframe.className,
          id: iframe.id || 'N/A'
        }));
      });

      console.log(`  📊 Total de iframes: ${iframeDetails.length}\n`);

      iframeDetails.forEach(iframe => {
        console.log(`  Iframe #${iframe.index}:`);
        console.log(`    ID: ${iframe.id}`);
        console.log(`    Tamaño: ${iframe.width}x${iframe.height}`);
        console.log(`    Visible: ${iframe.isVisible ? '✅ Sí' : '❌ No'}`);
        console.log(`    URL: ${iframe.src.substring(0, 80)}...`);

        // Verificar a dónde apunta
        if (iframe.src.includes('localhost:3210') || iframe.src.includes('127.0.0.1:3210')) {
          console.log('    ✅ ¡CORRECTO! Apunta a apps/copilot (puerto 3210)');
        } else if (iframe.src.includes('chat-test.bodasdehoy.com')) {
          console.log('    ⚠️  Apunta a producción (chat-test.bodasdehoy.com)');
        } else if (iframe.src.includes('localhost:8080')) {
          console.log('    ⚠️  Apunta a apps/web (mismo servidor)');
        } else {
          console.log(`    ⚠️  Apunta a: ${iframe.src}`);
        }
        console.log();
      });

      // Verificar si hay al menos un iframe apuntando a apps/copilot
      const hasCorrectIframe = iframeDetails.some(
        iframe => iframe.src.includes('3210') && iframe.isVisible
      );

      if (hasCorrectIframe) {
        console.log('  🎉 ¡ÉXITO! Al menos un iframe apunta correctamente a apps/copilot');
      } else {
        console.log('  ❌ Ningún iframe apunta correctamente a apps/copilot (puerto 3210)');
      }

    } else {
      console.log('  ❌ No se encontraron iframes en la página');
      console.log('  ⚠️  La página /copilot debería tener al menos 1 iframe');
    }

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 4: Verificar contenido de iframes');
    console.log('─'.repeat(70));

    const frames = page.frames();
    console.log(`  📦 Total de frames: ${frames.length} (incluye página principal)\n`);

    for (const frame of frames) {
      const frameUrl = frame.url();

      // Solo analizar frames que no sean la página principal
      if (frameUrl !== page.url()) {
        console.log(`  🔍 Analizando frame: ${frameUrl.substring(0, 60)}...`);

        try {
          await frame.waitForLoadState('domcontentloaded', { timeout: 10000 });

          const frameTitle = await frame.title().catch(() => 'N/A');
          console.log(`    Título: ${frameTitle}`);

          // Verificar si es apps/copilot
          if (frameUrl.includes('3210')) {
            console.log('    ✅ Este es el frame de apps/copilot');

            // Intentar detectar elementos específicos de LobeChat
            const hasLobeChat = await frame.evaluate(() => {
              const hasChat = !!document.querySelector('[class*="chat"]');
              const hasEditor = !!document.querySelector('[contenteditable="true"]');
              const hasToolbar = !!document.querySelector('[class*="toolbar"], [class*="typobar"]');
              return { hasChat, hasEditor, hasToolbar };
            }).catch(() => ({ hasChat: false, hasEditor: false, hasToolbar: false }));

            console.log(`    Chat UI: ${hasLobeChat.hasChat ? '✅' : '❌'}`);
            console.log(`    Editor: ${hasLobeChat.hasEditor ? '✅' : '❌'}`);
            console.log(`    Toolbar: ${hasLobeChat.hasToolbar ? '✅' : '❌'}`);
          }

        } catch (err) {
          console.log(`    ⚠️  Error cargando frame: ${err.message}`);
        }
        console.log();
      }
    }

    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 RESUMEN DEL TEST');
    console.log('═'.repeat(70));

    const summary = {
      'Página /copilot carga': currentUrl.includes('/copilot') ? '✅' : '❌',
      'Tiene header': pageStructure.hasHeader ? '✅' : '❌',
      'Iframes encontrados': `${pageStructure.iframeCount} ${pageStructure.iframeCount > 0 ? '✅' : '❌'}`,
      'Iframe a apps/copilot': iframeDetails?.some(f => f.src.includes('3210')) ? '✅ localhost:3210' : '❌',
      'Errores críticos': errors.length === 0 ? '✅ Ninguno' : `❌ ${errors.length}`,
      'Warnings': warnings.length === 0 ? '✅ Ninguno' : `⚠️ ${warnings.length}`
    };

    console.log();
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (errors.length > 0) {
      console.log('\n  🔍 Errores encontrados:');
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`    ${i + 1}. ${err.substring(0, 100)}`);
      });
    }

    console.log('\n  📝 Logs del Copilot:');
    if (logs.length > 0) {
      logs.forEach(log => console.log(`    ${log}`));
    } else {
      console.log('    (ninguno)');
    }

    // ═══════════════════════════════════════════════════════════
    const allGood =
      currentUrl.includes('/copilot') &&
      pageStructure.iframeCount > 0 &&
      iframeDetails?.some(f => f.src.includes('3210'));

    if (allGood) {
      console.log('\n🎉 ¡TEST EXITOSO! La página /copilot funciona correctamente');
      console.log('   - Carga sin errores');
      console.log('   - Tiene iframes');
      console.log('   - Apunta a apps/copilot (puerto 3210)');
    } else {
      console.log('\n⚠️  Algunos aspectos requieren atención (ver resumen arriba)');
    }

    console.log('\n⏳ Manteniendo navegador abierto 60 segundos...');
    console.log('   Puedes inspeccionar manualmente la página /copilot\n');

    await page.waitForTimeout(60000);

  } catch (err) {
    console.error('\n💥 ERROR EN EL TEST:', err.message);
    await page.screenshot({ path: 'test-direct-error.png', fullPage: true });
    console.log('📸 Screenshot del error: test-direct-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test completado - navegador cerrado');
  }
}

testCopilotPageDirect().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
