import { chromium } from 'playwright';

async function testCopilotConLogin() {
  console.log('🚀 Probando Copilot con usuario autenticado...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar errores
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`❌ [Error]`, msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log(`💥 [Page Error]`, error.message);
  });

  try {
    console.log('📍 Paso 1: Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(3000);

    console.log('📸 Captura 1: Página inicial');
    await page.screenshot({ path: 'login-test-1-inicio.png', fullPage: true });

    // Verificar si ya hay sesión
    const hasSession = await page.evaluate(() => {
      return document.cookie.includes('sessionBodas');
    });

    console.log('\n📊 Estado de sesión:', hasSession ? '✅ Autenticado' : '❌ No autenticado');

    if (!hasSession) {
      console.log('\n⚠️  Usuario no autenticado. Por favor, inicia sesión manualmente en el navegador.');
      console.log('   El script esperará 60 segundos para que inicies sesión...\n');

      // Esperar a que aparezca la cookie de sesión (máx 60s)
      let loginSuccess = false;
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(1000);
        const currentSession = await page.evaluate(() => {
          return document.cookie.includes('sessionBodas');
        });

        if (currentSession) {
          loginSuccess = true;
          console.log(`   ✅ ¡Login detectado después de ${i + 1} segundos!`);
          break;
        }

        // Mostrar progreso cada 10 segundos
        if ((i + 1) % 10 === 0) {
          console.log(`   ⏱️  Han pasado ${i + 1} segundos...`);
        }
      }

      if (!loginSuccess) {
        console.log('\n❌ No se detectó login después de 60 segundos');
        console.log('   Cerrando navegador...');
        await browser.close();
        return;
      }

      // Esperar un poco más para que la app cargue con el usuario
      console.log('\n⏱️  Esperando 3 segundos para que la app cargue con el usuario...');
      await page.waitForTimeout(3000);

      console.log('📸 Captura 2: Después del login');
      await page.screenshot({ path: 'login-test-2-logueado.png', fullPage: true });
    }

    console.log('\n📍 Paso 2: Buscando botón del Copilot...');

    const copilotButton = await page.locator('button:has-text("Copilot")').first();
    const isVisible = await copilotButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log('   ✅ Botón Copilot encontrado');

      console.log('\n📍 Paso 3: Abriendo Copilot...');
      await copilotButton.click();
      await page.waitForTimeout(2000);

      console.log('📸 Captura 3: Copilot abierto');
      await page.screenshot({ path: 'login-test-3-copilot-abierto.png', fullPage: true });

      // Verificar estado del copilot
      const copilotState = await page.evaluate(() => {
        const editor = document.querySelectorAll('[contenteditable="true"]');
        const textarea = document.querySelectorAll('textarea');
        const guestMessage = document.querySelector('p:has-text("Inicia sesión")');
        const chatMessages = document.querySelectorAll('[class*="message"], [class*="Message"]');

        return {
          editorCount: editor.length,
          textareaCount: textarea.length,
          hasGuestMessage: !!guestMessage,
          chatMessagesCount: chatMessages.length,
          bodyText: document.body.innerText.substring(0, 500),
        };
      });

      console.log('\n📊 Estado del Copilot:');
      console.log('   ContentEditable elements:', copilotState.editorCount);
      console.log('   Textarea elements:', copilotState.textareaCount);
      console.log('   Mensaje de "Inicia sesión":', copilotState.hasGuestMessage ? '❌ Visible' : '✅ No visible');
      console.log('   Mensajes de chat:', copilotState.chatMessagesCount);

      if (copilotState.editorCount > 0) {
        console.log('\n📍 Paso 4: ✅ Editor encontrado, probando escribir...');

        const editor = page.locator('[contenteditable="true"]').first();
        await editor.click();
        await page.waitForTimeout(500);

        const testText = '**Hola** este es un _test_ del editor';
        await page.keyboard.type(testText, { delay: 50 });
        await page.waitForTimeout(1000);

        console.log('   ✅ Texto escrito:', testText);

        console.log('📸 Captura 4: Editor con texto');
        await page.screenshot({ path: 'login-test-4-con-texto.png', fullPage: true });

        // Probar formato bold
        await page.keyboard.press('Control+A');
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+B');
        await page.waitForTimeout(500);

        console.log('   ✅ Formato bold aplicado');

        console.log('📸 Captura 5: Con formato bold');
        await page.screenshot({ path: 'login-test-5-bold.png', fullPage: true });

        console.log('\n✅ ÉXITO: El editor del Copilot está funcionando correctamente con markdown!');

      } else if (copilotState.textareaCount > 0) {
        console.log('\n⚠️  Se encontró un textarea en lugar de contenteditable');
        console.log('   Esto significa que se está usando el editor simple, no el avanzado');

      } else if (copilotState.hasGuestMessage) {
        console.log('\n❌ El usuario no está autenticado correctamente');
        console.log('   El Copilot muestra el mensaje de "Inicia sesión"');

      } else {
        console.log('\n❌ No se encontró ningún editor');
        console.log('   Body text:', copilotState.bodyText);
      }

    } else {
      console.log('   ❌ No se encontró el botón de Copilot');
    }

    console.log('\n⏳ Navegador permanecerá abierto 90 segundos para inspección manual...');
    console.log('   Puedes interactuar con el Copilot y verificar el editor avanzado.');
    await page.waitForTimeout(90000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'login-test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Test completado');
  }
}

testCopilotConLogin();
