import { chromium } from 'playwright';

async function inspectEditor() {
  console.log('🔍 Inspeccionando el editor real renderizado...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  const page = await (await browser.newContext({
    viewport: { width: 1400, height: 900 }
  })).newPage();

  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [Error]`, text);
      errors.push(text);
    } else if (type === 'warning' && text.includes('lobehub')) {
      console.log(`⚠️  [Warning]`, text);
    }
  });

  page.on('pageerror', err => {
    console.log(`💥 [Page Error]`, err.message);
    errors.push(err.message);
  });

  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(3000);

  console.log('📍 Abriendo Copilot...');
  const btn = page.locator('button:has-text("Copilot")').first();

  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(3000);

    console.log('\n📊 Analizando el editor renderizado...\n');

    const editorAnalysis = await page.evaluate(() => {
      // Buscar todos los tipos de inputs
      const contentEditable = document.querySelectorAll('[contenteditable="true"]');
      const textareas = document.querySelectorAll('textarea');
      const textInputs = document.querySelectorAll('input[type="text"]');

      // Analizar el contenteditable (debería ser el editor avanzado)
      const editorDetails = [];
      contentEditable.forEach((el, i) => {
        const parent = el.parentElement;
        const styles = window.getComputedStyle(el);

        editorDetails.push({
          index: i,
          tagName: el.tagName,
          classes: el.className,
          parentClasses: parent?.className || '',
          display: styles.display,
          width: styles.width,
          height: styles.height,
          placeholder: el.getAttribute('placeholder'),
          hasChildren: el.children.length > 0,
          innerHTML: el.innerHTML.substring(0, 200),
          // Buscar componentes de lobehub
          hasLobehubClasses: el.className.includes('lobehub') ||
                            parent?.className.includes('lobehub') ||
                            el.innerHTML.includes('lobehub'),
        });
      });

      // Buscar barras de herramientas de formato
      const toolbars = Array.from(document.querySelectorAll('div')).filter(div => {
        const className = div.className || '';
        const text = div.textContent || '';
        return className.includes('toolbar') ||
               className.includes('format') ||
               className.includes('menu') ||
               text.includes('Bold') ||
               text.includes('Italic');
      }).map(div => ({
        classes: div.className,
        text: div.textContent?.substring(0, 100),
      }));

      return {
        contentEditableCount: contentEditable.length,
        textareaCount: textareas.length,
        textInputCount: textInputs.length,
        editorDetails,
        toolbarsFound: toolbars.length,
        toolbars: toolbars.slice(0, 3), // Primeras 3
      };
    });

    console.log('Inputs encontrados:');
    console.log('  ContentEditable (editor avanzado):', editorAnalysis.contentEditableCount);
    console.log('  Textareas (editor simple):', editorAnalysis.textareaCount);
    console.log('  Text inputs:', editorAnalysis.textInputCount);
    console.log('  Toolbars de formato:', editorAnalysis.toolbarsFound);

    if (editorAnalysis.editorDetails.length > 0) {
      console.log('\n📝 Detalles del ContentEditable:');
      editorAnalysis.editorDetails.forEach(detail => {
        console.log(`\n  Editor ${detail.index + 1}:`);
        console.log(`    Tag: ${detail.tagName}`);
        console.log(`    Display: ${detail.display}`);
        console.log(`    Size: ${detail.width} x ${detail.height}`);
        console.log(`    Tiene clases de lobehub: ${detail.hasLobehubClasses ? '✅' : '❌'}`);
        console.log(`    Placeholder: ${detail.placeholder || 'None'}`);
        console.log(`    Children: ${detail.hasChildren}`);
        if (detail.classes) {
          console.log(`    Classes: ${detail.classes.substring(0, 100)}`);
        }
      });
    }

    if (editorAnalysis.toolbarsFound > 0) {
      console.log('\n🛠️  Toolbars encontrados:');
      editorAnalysis.toolbars.forEach((tb, i) => {
        console.log(`\n  Toolbar ${i + 1}:`);
        console.log(`    Classes: ${tb.classes.substring(0, 80)}`);
        console.log(`    Text: ${tb.text}`);
      });
    } else {
      console.log('\n⚠️  NO se encontraron toolbars de formato');
      console.log('   Esto significa que el editor avanzado no está completamente cargado');
    }

    // Tomar screenshot
    await page.screenshot({ path: 'editor-actual.png', fullPage: true });
    console.log('\n📸 Screenshot guardado: editor-actual.png');

    // Resumen de errores
    if (errors.length > 0) {
      console.log('\n❌ Errores de JavaScript encontrados:');
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`\n  ${i + 1}. ${err.substring(0, 150)}`);
      });
    } else {
      console.log('\n✅ No hay errores de JavaScript');
    }

    console.log('\n💡 Diagnóstico:');
    if (editorAnalysis.contentEditableCount === 0) {
      console.log('   ❌ El editor avanzado NO está renderizado');
      console.log('   Posible causa: Error al cargar @lobehub/editor');
    } else if (!editorAnalysis.editorDetails[0]?.hasLobehubClasses) {
      console.log('   ⚠️  Hay un contentEditable pero NO tiene clases de lobehub');
      console.log('   Posible causa: Se está usando un editor diferente');
    } else if (editorAnalysis.toolbarsFound === 0) {
      console.log('   ⚠️  Editor cargado pero SIN toolbar de formato');
      console.log('   El editor está en modo básico');
    } else {
      console.log('   ✅ Editor avanzado parece estar correctamente cargado');
    }
  }

  console.log('\n⏳ Navegador abierto 60s...');
  await page.waitForTimeout(60000);
  await browser.close();
}

inspectEditor();
