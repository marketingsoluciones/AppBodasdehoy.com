import { chromium } from 'playwright';

async function testCopilotEditor() {
  console.log('🤖 Probando el Copilot y su editor...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('📍 Paso 1: Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(3000);

    console.log('📸 Captura 1: Aplicación cargada');
    await page.screenshot({ path: 'copilot-test-1-app.png', fullPage: true });

    console.log('\n📍 Paso 2: Buscando botón del Copilot...');

    // Buscar el botón de Copilot - intentar múltiples selectores
    const copilotButton = await page.locator('button:has-text("Copilot")').first();

    const isVisible = await copilotButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log('✅ Botón Copilot encontrado');
      console.log('\n📍 Paso 3: Haciendo click en Copilot...');

      await copilotButton.click();
      await page.waitForTimeout(2000);

      console.log('📸 Captura 2: Después de abrir Copilot');
      await page.screenshot({ path: 'copilot-test-2-abierto.png', fullPage: true });

      // Verificar si el copilot se abrió
      const copilotState = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="chat-sidebar"], .chat-sidebar, [class*="ChatSidebar"]');
        const editor = document.querySelectorAll('[contenteditable="true"]');
        const panel = document.querySelector('[role="dialog"], [class*="panel"]');

        return {
          hasSidebar: !!sidebar,
          sidebarHTML: sidebar ? sidebar.outerHTML.substring(0, 500) : null,
          editorCount: editor.length,
          hasPanel: !!panel,
          bodyClasses: document.body.className,
        };
      });

      console.log('\n📊 Estado del Copilot después de abrir:');
      console.log('   Sidebar detectada:', copilotState.hasSidebar ? '✅' : '❌');
      console.log('   ContentEditable elementos:', copilotState.editorCount);
      console.log('   Panel/Dialog:', copilotState.hasPanel ? '✅' : '❌');

      if (copilotState.editorCount > 0) {
        console.log('\n📍 Paso 4: Probando el editor...');

        const editorElement = page.locator('[contenteditable="true"]').first();

        // Hacer click en el editor
        await editorElement.click();
        await page.waitForTimeout(500);

        console.log('   ✅ Click en editor exitoso');

        // Escribir texto de prueba con markdown
        const testText = 'Hola, este es un **texto en bold** y también *cursiva*';
        await page.keyboard.type(testText, { delay: 50 });
        await page.waitForTimeout(1000);

        console.log('   ✅ Texto escrito:', testText);

        console.log('📸 Captura 3: Editor con texto');
        await page.screenshot({ path: 'copilot-test-3-texto.png', fullPage: true });

        // Probar formato bold con keyboard shortcut
        console.log('\n📍 Paso 5: Probando formato con teclado...');

        // Seleccionar todo
        await page.keyboard.press('Control+A');
        await page.waitForTimeout(300);

        // Aplicar bold
        await page.keyboard.press('Control+B');
        await page.waitForTimeout(500);

        console.log('   ✅ Formato bold aplicado con Ctrl+B');

        console.log('📸 Captura 4: Después de aplicar bold');
        await page.screenshot({ path: 'copilot-test-4-bold.png', fullPage: true });

        // Limpiar y probar slash command
        console.log('\n📍 Paso 6: Probando slash commands...');

        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.waitForTimeout(300);

        // Escribir /
        await page.keyboard.type('/');
        await page.waitForTimeout(1000);

        console.log('   ✅ Slash command "/" escrito');

        console.log('📸 Captura 5: Menú de slash commands');
        await page.screenshot({ path: 'copilot-test-5-slash.png', fullPage: true });

        // Verificar si apareció menú de comandos
        const slashMenuVisible = await page.evaluate(() => {
          const menu = document.querySelector('[role="menu"], [class*="slash"], [class*="command"]');
          return !!menu;
        });

        console.log('   Menú de slash commands:', slashMenuVisible ? '✅ Visible' : '❌ No visible');

        // Obtener el contenido del editor
        const editorContent = await page.evaluate(() => {
          const editor = document.querySelector('[contenteditable="true"]');
          return {
            textContent: editor?.textContent || '',
            innerHTML: editor?.innerHTML.substring(0, 300) || '',
          };
        });

        console.log('\n📝 Contenido del editor:');
        console.log('   Text:', editorContent.textContent);
        console.log('   HTML:', editorContent.innerHTML);

      } else {
        console.log('\n⚠️  No se encontró el editor contenteditable');

        // Buscar inputs alternativos
        const alternativeInputs = await page.evaluate(() => ({
          textareas: document.querySelectorAll('textarea').length,
          inputs: document.querySelectorAll('input[type="text"]').length,
        }));

        console.log('   Textareas encontradas:', alternativeInputs.textareas);
        console.log('   Text inputs encontrados:', alternativeInputs.inputs);
      }

    } else {
      console.log('❌ No se encontró el botón de Copilot');

      // Buscar elementos similares
      const similarButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons
          .filter(b => b.textContent?.toLowerCase().includes('copilot') ||
                       b.textContent?.toLowerCase().includes('chat') ||
                       b.className?.toLowerCase().includes('copilot'))
          .map(b => ({
            text: b.textContent?.trim(),
            classes: b.className,
          }));
      });

      console.log('   Botones similares encontrados:', similarButtons);
    }

    console.log('\n✅ Test completado');
    console.log('\n📸 Capturas guardadas:');
    console.log('   - copilot-test-1-app.png');
    console.log('   - copilot-test-2-abierto.png');
    console.log('   - copilot-test-3-texto.png');
    console.log('   - copilot-test-4-bold.png');
    console.log('   - copilot-test-5-slash.png');

    console.log('\n⏳ El navegador permanecerá abierto 60 segundos para inspección manual...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    await page.screenshot({ path: 'copilot-test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Navegador cerrado');
  }
}

testCopilotEditor();
