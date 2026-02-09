import { chromium } from 'playwright';

async function inspectServicio() {
  console.log('🚀 Iniciando inspección del servicio...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Para poder ver las acciones
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar errores de consola
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Console ${type}]`, msg.text());
    }
  });

  try {
    console.log('📍 Paso 1: Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(3000);

    console.log('📸 Captura 1: Página inicial');
    await page.screenshot({ path: 'estado-1-inicio.png', fullPage: true });

    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}\n`);

    // Verificar si hay sesión activa
    console.log('📍 Paso 2: Verificando estado de autenticación...');
    const hasSession = await page.evaluate(() => {
      const sessionCookie = document.cookie.includes('sessionBodas');
      const hasUser = !!window.localStorage.getItem('user');
      return { sessionCookie, hasUser };
    });

    console.log('   Sesión:', hasSession);

    if (currentUrl.includes('/login')) {
      console.log('\n🔐 Detectado: Página de login');
      console.log('📸 Captura 2: Formulario de login');
      await page.screenshot({ path: 'estado-2-login.png', fullPage: true });

      // Verificar elementos del formulario
      const loginElements = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        const submitButton = document.querySelector('button[type="submit"], button:has-text("Iniciar")');

        return {
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          hasSubmitButton: !!submitButton,
        };
      });

      console.log('   Elementos del formulario:', loginElements);

    } else {
      console.log('\n🏠 Detectado: Usuario autenticado - Página principal');

      // Buscar el menú de usuario
      console.log('\n📍 Paso 3: Buscando menú de usuario...');
      const userMenuButton = await page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Usuario")').first();

      if (await userMenuButton.isVisible().catch(() => false)) {
        console.log('   ✅ Menú de usuario encontrado');
        await userMenuButton.click();
        await page.waitForTimeout(1000);

        console.log('📸 Captura 3: Menú de usuario abierto');
        await page.screenshot({ path: 'estado-3-menu-usuario.png', fullPage: true });
      } else {
        console.log('   ⚠️  Menú de usuario no encontrado en los selectores comunes');
      }

      // Buscar y abrir el Copilot
      console.log('\n📍 Paso 4: Buscando Copilot...');

      // Intentar múltiples selectores para encontrar el copilot
      const copilotSelectors = [
        '[data-testid="copilot-trigger"]',
        '[data-testid="chat-sidebar-trigger"]',
        'button:has-text("Copilot")',
        'button:has-text("Chat")',
        '.copilot-trigger',
        '[aria-label*="copilot" i]',
      ];

      let copilotFound = false;
      for (const selector of copilotSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`   ✅ Copilot encontrado con selector: ${selector}`);
            await element.click();
            await page.waitForTimeout(2000);
            copilotFound = true;
            break;
          }
        } catch (e) {
          // Selector no encontrado, continuar
        }
      }

      if (!copilotFound) {
        console.log('   ⚠️  No se encontró trigger del Copilot con selectores comunes');
        console.log('   🔍 Intentando encontrar mediante shortcuts...');

        // Intentar abrir con atajo de teclado (si existe)
        await page.keyboard.press('Control+K');
        await page.waitForTimeout(1000);
      }

      console.log('📸 Captura 4: Estado después de intentar abrir Copilot');
      await page.screenshot({ path: 'estado-4-copilot.png', fullPage: true });

      // Verificar si el copilot está visible
      const copilotState = await page.evaluate(() => {
        // Buscar elementos del editor del copilot
        const editorElements = document.querySelectorAll('[contenteditable="true"]');
        const chatSidebar = document.querySelector('[data-testid="chat-sidebar"], .chat-sidebar');
        const editorAdvanced = document.querySelector('.editor-advanced, [class*="editor"]');

        return {
          contentEditableCount: editorElements.length,
          hasChatSidebar: !!chatSidebar,
          hasEditor: !!editorAdvanced,
          editorClasses: editorAdvanced ? editorAdvanced.className : null,
        };
      });

      console.log('\n📊 Estado del Copilot:');
      console.log('   ContentEditable elements:', copilotState.contentEditableCount);
      console.log('   Chat Sidebar:', copilotState.hasChatSidebar ? '✅' : '❌');
      console.log('   Editor detectado:', copilotState.hasEditor ? '✅' : '❌');
      if (copilotState.editorClasses) {
        console.log('   Clases del editor:', copilotState.editorClasses);
      }

      // Si hay contentEditable, intentar escribir algo
      if (copilotState.contentEditableCount > 0) {
        console.log('\n📍 Paso 5: Probando el editor del Copilot...');

        const editorElement = page.locator('[contenteditable="true"]').first();
        await editorElement.click();
        await page.waitForTimeout(500);

        // Escribir texto de prueba
        await editorElement.fill('Hola, este es un **test** del editor con *markdown*');
        await page.waitForTimeout(1000);

        console.log('📸 Captura 5: Editor con texto de prueba');
        await page.screenshot({ path: 'estado-5-editor-test.png', fullPage: true });

        // Probar formato
        console.log('\n📍 Paso 6: Probando comandos del editor...');
        await editorElement.press('Control+A');
        await editorElement.press('Control+B'); // Bold
        await page.waitForTimeout(500);

        console.log('📸 Captura 6: Después de aplicar formato bold');
        await page.screenshot({ path: 'estado-6-formato-bold.png', fullPage: true });
      }
    }

    console.log('\n✅ Inspección completada');
    console.log('\n📸 Capturas guardadas:');
    console.log('   - estado-1-inicio.png');
    console.log('   - estado-2-login.png (si aplica)');
    console.log('   - estado-3-menu-usuario.png (si aplica)');
    console.log('   - estado-4-copilot.png');
    console.log('   - estado-5-editor-test.png (si aplica)');
    console.log('   - estado-6-formato-bold.png (si aplica)');

    console.log('\n⏳ El navegador permanecerá abierto por 30 segundos para inspección manual...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error durante la inspección:', error.message);
    await page.screenshot({ path: 'estado-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Navegador cerrado');
  }
}

inspectServicio();
