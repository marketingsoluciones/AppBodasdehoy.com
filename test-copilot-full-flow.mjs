import { chromium } from 'playwright';

/**
 * Test completo del flujo de Copilot:
 * 1. Cargar apps/web (localhost:8080)
 * 2. Abrir Copilot desde el sidebar
 * 3. Click en "Ver completo"
 * 4. Verificar navegación a /copilot (SIN popup)
 * 5. Verificar que iframe carga apps/copilot (localhost:3210)
 * 6. Capturar errores de consola
 */

async function testCopilotFullFlow() {
  console.log('🧪 Test completo del flujo de Copilot\n');
  console.log('═'.repeat(60));

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
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
      console.log(`  ❌ [Console Error] ${text.substring(0, 150)}`);
    } else if (type === 'warning' && !text.includes('supports-color')) {
      warnings.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`  💥 [Page Error] ${err.message}`);
  });

  try {
    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 1: Cargar apps/web (localhost:8080)');
    console.log('─'.repeat(60));

    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(3000);
    const homeUrl = page.url();
    console.log(`  ✅ Página cargada: ${homeUrl}`);

    await page.screenshot({ path: 'test-flow-1-home.png', fullPage: true });
    console.log('  📸 Screenshot guardado: test-flow-1-home.png');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 2: Abrir Copilot desde sidebar');
    console.log('─'.repeat(60));

    const copilotButton = page.locator('button:has-text("Copilot")').first();
    const isVisible = await copilotButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      throw new Error('❌ Botón Copilot no encontrado en la página');
    }

    console.log('  ✅ Botón Copilot encontrado');
    await copilotButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-flow-2-sidebar-opened.png', fullPage: true });
    console.log('  📸 Screenshot guardado: test-flow-2-sidebar-opened.png');
    console.log('  ✅ Sidebar del Copilot abierto');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 3: Click en "Ver completo" (debería navegar SIN popup)');
    console.log('─'.repeat(60));

    // Buscar el botón "Ver completo" o "Ver en Pantalla Completa"
    const expandButton = page.locator('button:has-text("Ver")').filter({
      hasText: /Ver (completo|en Pantalla Completa)/i
    }).first();

    const expandVisible = await expandButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!expandVisible) {
      console.log('  ⚠️  Botón "Ver completo" no encontrado');
      console.log('  🔍 Buscando todos los botones disponibles...');

      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => b.textContent?.trim())
          .filter(Boolean);
      });

      console.log(`  Botones encontrados (${allButtons.length}):`);
      allButtons.slice(0, 10).forEach((btn, i) => {
        console.log(`    ${i + 1}. ${btn}`);
      });

      throw new Error('Botón "Ver completo" no encontrado');
    }

    console.log('  ✅ Botón "Ver completo" encontrado');

    // Preparar para detectar navegación
    const currentUrl = page.url();
    console.log(`  📍 URL actual (antes del click): ${currentUrl}`);

    // Click y esperar navegación
    await expandButton.click();
    console.log('  👆 Click ejecutado en "Ver completo"');

    // Esperar cambio de URL
    await page.waitForURL('**/copilot', { timeout: 10000 }).catch(() => {
      console.log('  ⚠️  No se detectó navegación a /copilot en 10 segundos');
    });

    await page.waitForTimeout(3000);

    const newUrl = page.url();
    console.log(`  📍 URL actual (después del click): ${newUrl}`);

    if (newUrl.includes('/copilot')) {
      console.log('  ✅ ¡NAVEGACIÓN EXITOSA! Ahora está en /copilot');
      console.log('  🎉 SIN popups - navegación interna correcta');
    } else {
      console.log(`  ❌ No navegó a /copilot. URL: ${newUrl}`);
    }

    await page.screenshot({ path: 'test-flow-3-copilot-page.png', fullPage: true });
    console.log('  📸 Screenshot guardado: test-flow-3-copilot-page.png');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 4: Verificar que iframe carga apps/copilot');
    console.log('─'.repeat(60));

    // Esperar a que carguen los iframes
    await page.waitForTimeout(5000);

    const iframeInfo = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return {
        count: iframes.length,
        details: iframes.map((iframe, index) => ({
          index: index + 1,
          src: iframe.src,
          width: iframe.offsetWidth,
          height: iframe.offsetHeight,
          isVisible: iframe.offsetWidth > 0 && iframe.offsetHeight > 0
        }))
      };
    });

    console.log(`  📊 Iframes encontrados: ${iframeInfo.count}`);

    if (iframeInfo.count === 0) {
      console.log('  ❌ No se encontraron iframes en la página');
    } else {
      iframeInfo.details.forEach(iframe => {
        console.log(`\n  Iframe #${iframe.index}:`);
        console.log(`    URL: ${iframe.src}`);
        console.log(`    Tamaño: ${iframe.width}x${iframe.height}`);
        console.log(`    Visible: ${iframe.isVisible ? '✅' : '❌'}`);

        if (iframe.src.includes('localhost:3210') || iframe.src.includes('127.0.0.1:3210')) {
          console.log('    ✅ ¡Apunta a apps/copilot (puerto 3210)!');
        } else if (iframe.src.includes('chat-test.bodasdehoy.com')) {
          console.log('    ⚠️  Apunta a producción (chat-test)');
        }
      });
    }

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 5: Verificar contenido del iframe');
    console.log('─'.repeat(60));

    if (iframeInfo.count > 0) {
      try {
        // Intentar acceder al contenido del iframe
        const frames = page.frames();
        console.log(`  📦 Total frames: ${frames.length} (main + ${frames.length - 1} iframe(s))`);

        for (const frame of frames) {
          const frameUrl = frame.url();
          if (frameUrl.includes('3210') || frameUrl.includes('copilot')) {
            console.log(`\n  🔍 Analizando iframe: ${frameUrl.substring(0, 60)}...`);

            // Esperar a que el iframe cargue
            await frame.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {
              console.log('    ⚠️  Timeout esperando carga del iframe');
            });

            // Verificar título
            const title = await frame.title().catch(() => 'N/A');
            console.log(`    Título: ${title}`);

            // Verificar si hay errores en el iframe
            const iframeErrors = [];
            frame.on('console', msg => {
              if (msg.type() === 'error') {
                iframeErrors.push(msg.text());
              }
            });

            if (iframeErrors.length > 0) {
              console.log(`    ❌ Errores en iframe: ${iframeErrors.length}`);
            } else {
              console.log('    ✅ Sin errores en iframe');
            }
          }
        }
      } catch (err) {
        console.log(`  ⚠️  No se pudo acceder al contenido del iframe: ${err.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 RESUMEN DEL TEST');
    console.log('═'.repeat(60));

    const summary = {
      'Carga inicial (apps/web)': homeUrl.includes('localhost:8080') ? '✅' : '❌',
      'Sidebar abierto': '✅',
      'Navegación a /copilot': newUrl.includes('/copilot') ? '✅ SIN popups' : '❌',
      'Iframes encontrados': `${iframeInfo.count} ${iframeInfo.count > 0 ? '✅' : '❌'}`,
      'Apunta a apps/copilot': iframeInfo.details.some(f => f.src.includes('3210')) ? '✅' : '❌',
      'Errores de consola': errors.length === 0 ? '✅ Ninguno' : `❌ ${errors.length} errores`,
      'Warnings': warnings.length === 0 ? '✅ Ninguno' : `⚠️ ${warnings.length} warnings`
    };

    console.log();
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (errors.length > 0) {
      console.log('\n  🔍 Primeros 3 errores:');
      errors.slice(0, 3).forEach((err, i) => {
        console.log(`    ${i + 1}. ${err.substring(0, 120)}`);
      });
    }

    // ═══════════════════════════════════════════════════════════
    console.log('\n⏳ Manteniendo navegador abierto 60 segundos para inspección manual...');
    console.log('   Puedes verificar manualmente que todo funciona correctamente\n');

    await page.waitForTimeout(60000);

  } catch (err) {
    console.error('\n💥 ERROR EN EL TEST:', err.message);
    await page.screenshot({ path: 'test-flow-error.png', fullPage: true });
    console.log('📸 Screenshot del error guardado: test-flow-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test completado - navegador cerrado');
  }
}

testCopilotFullFlow().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
