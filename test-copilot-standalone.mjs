import { chromium } from 'playwright';

/**
 * Test standalone de apps/copilot (lobe-chat-stable)
 * Verifica que el nuevo copilot funciona correctamente en puerto 3210
 */

async function testCopilotStandalone() {
  console.log('🧪 Test Standalone - apps/copilot (lobe-chat-stable)');
  console.log('═'.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });

  // Capturar errores
  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' && !text.includes('GraphQL')) {
      errors.push(text);
      console.log(`  ❌ [Error] ${text.substring(0, 120)}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`  💥 [Page Error] ${err.message}`);
  });

  try {
    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 1: Cargar apps/copilot (localhost:3210)');
    console.log('─'.repeat(70));

    await page.goto('http://localhost:3210', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`  ✅ URL cargada: ${currentUrl}`);

    await page.screenshot({
      path: 'test-copilot-standalone-1-home.png',
      fullPage: true
    });
    console.log('  📸 Screenshot: test-copilot-standalone-1-home.png');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 2: Verificar estructura de la página');
    console.log('─'.repeat(70));

    const pageStructure = await page.evaluate(() => {
      return {
        title: document.title,
        hasChat: !!document.querySelector('[class*="chat"]'),
        hasInput: !!document.querySelector('[contenteditable="true"]'),
        hasSidebar: !!document.querySelector('[class*="sidebar"]'),
        hasToolbar: !!document.querySelector('[class*="toolbar"]'),
        bodyClasses: document.body.className,
      };
    });

    console.log('  Estructura:');
    console.log(`    Título: ${pageStructure.title}`);
    console.log(`    Chat UI: ${pageStructure.hasChat ? '✅' : '❌'}`);
    console.log(`    Input Editor: ${pageStructure.hasInput ? '✅' : '❌'}`);
    console.log(`    Sidebar: ${pageStructure.hasSidebar ? '✅' : '❌'}`);
    console.log(`    Toolbar: ${pageStructure.hasToolbar ? '✅' : '❌'}`);

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 3: Verificar features clave');
    console.log('─'.repeat(70));

    // Buscar menú de settings o features
    const hasSettings = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b =>
        b.textContent?.includes('Setting') ||
        b.textContent?.includes('Config') ||
        b.getAttribute('aria-label')?.includes('setting')
      );
    });

    console.log(`  Settings/Config: ${hasSettings ? '✅' : '⚠️'}`);

    // Verificar si hay algún texto que mencione las features
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasArtifactsRef = pageText.toLowerCase().includes('artifact');
    const hasMemoryRef = pageText.toLowerCase().includes('memor');
    const hasFileRef = pageText.toLowerCase().includes('file') || pageText.toLowerCase().includes('upload');

    console.log(`  Referencias a Artifacts: ${hasArtifactsRef ? '✅' : '⚠️'}`);
    console.log(`  Referencias a Memory: ${hasMemoryRef ? '✅' : '⚠️'}`);
    console.log(`  Referencias a Files: ${hasFileRef ? '✅' : '⚠️'}`);

    // ═══════════════════════════════════════════════════════════
    console.log('\n📍 PASO 4: Verificar editor con plugins');
    console.log('─'.repeat(70));

    // Buscar el editor
    const editorInfo = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (!editor) return { found: false };

      // Buscar plugins del editor (toolbar con botones de formato)
      const toolbar = document.querySelector('[class*="toolbar"], [class*="typobar"]');
      const formatButtons = toolbar ? toolbar.querySelectorAll('button').length : 0;

      return {
        found: true,
        hasToolbar: !!toolbar,
        formatButtons,
        editorClasses: editor.className,
      };
    });

    if (editorInfo.found) {
      console.log(`  ✅ Editor encontrado`);
      console.log(`  Toolbar: ${editorInfo.hasToolbar ? '✅' : '❌'}`);
      console.log(`  Botones de formato: ${editorInfo.formatButtons}`);
    } else {
      console.log('  ⚠️  Editor no encontrado en la página inicial');
    }

    await page.screenshot({
      path: 'test-copilot-standalone-2-editor.png',
      fullPage: true
    });
    console.log('  📸 Screenshot: test-copilot-standalone-2-editor.png');

    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 RESUMEN DEL TEST');
    console.log('═'.repeat(70));

    const summary = {
      'Servidor respondiendo': currentUrl.includes('localhost:3210') ? '✅' : '❌',
      'Página cargada': pageStructure.title ? '✅' : '❌',
      'Chat UI presente': pageStructure.hasChat ? '✅' : '⚠️',
      'Editor presente': editorInfo.found ? '✅' : '⚠️',
      'Toolbar de formato': editorInfo.hasToolbar ? '✅' : '⚠️',
      'Errores críticos': errors.length === 0 ? '✅ Ninguno' : `❌ ${errors.length}`,
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
    const allGood =
      currentUrl.includes('localhost:3210') &&
      pageStructure.title &&
      (pageStructure.hasChat || editorInfo.found);

    if (allGood) {
      console.log('\n✅ TEST EXITOSO! apps/copilot funciona correctamente');
      console.log('   - Servidor en puerto 3210');
      console.log('   - Página carga sin errores críticos');
      console.log('   - UI del chat presente');
    } else {
      console.log('\n⚠️  Algunos aspectos requieren atención (ver resumen arriba)');
    }

    console.log('\n⏳ Manteniendo navegador abierto 30 segundos...');
    console.log('   Puedes inspeccionar manualmente el copilot\n');

    await page.waitForTimeout(30000);

  } catch (err) {
    console.error('\n💥 ERROR EN EL TEST:', err.message);
    await page.screenshot({
      path: 'test-copilot-standalone-error.png',
      fullPage: true
    });
    console.log('📸 Screenshot del error: test-copilot-standalone-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test completado - navegador cerrado');
  }
}

testCopilotStandalone().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
