/**
 * Test V10: Verificar que el Copilot funciona para usuarios GUEST
 * Usando CopilotChatNative (sin iframe)
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST V10 - COPILOT GUEST (CopilotChatNative) ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  // Contexto LIMPIO - sin cookies ni session storage
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // PASO 1: Navegar SIN autenticar
    console.log("1. Navegando a app-test.bodasdehoy.com (SIN autenticar)...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);

    await screenshot(page, "V10-01-inicio-guest");

    // PASO 2: Buscar y hacer click en el botón Copilot
    console.log("\n2. Buscando botón Copilot...");

    // Buscar el botón Copilot en el header
    const copilotButton = page.locator('button:has-text("Copilot"), [class*="copilot" i]:has-text("Copilot")').first();

    if (await copilotButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await copilotButton.click();
      console.log("   ✓ Click en botón Copilot");
    } else {
      // Intentar buscar en todo el documento
      const allElements = await page.locator('*:has-text("Copilot")').all();
      let clicked = false;
      for (const el of allElements) {
        const text = await el.innerText().catch(() => '');
        if (text.trim() === 'Copilot') {
          const box = await el.boundingBox();
          if (box && box.y < 100) { // Solo en el header
            await el.click();
            clicked = true;
            console.log("   ✓ Click en elemento Copilot del header");
            break;
          }
        }
      }
      if (!clicked) {
        console.log("   ⚠️ No se pudo hacer click en Copilot");
      }
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "V10-02-copilot-abierto");

    // PASO 3: Verificar que se abrió el panel de chat
    console.log("\n3. Verificando panel de chat...");

    // Buscar el CopilotChatNative (sin iframe)
    const chatPanel = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const hasNativeChat = body.includes('Escribe tu mensaje') ||
                            body.includes('Copilot') && body.includes('asistente');
      const hasGuestBanner = body.includes('Estás como invitado') || body.includes('Iniciar sesión');
      const hasInput = !!document.querySelector('textarea[placeholder*="mensaje"]');

      // Buscar elementos del CopilotChatNative
      const quickSuggestions = body.includes('Como gestiono') || body.includes('presupuesto');

      return {
        hasNativeChat,
        hasGuestBanner,
        hasInput,
        quickSuggestions,
        preview: body.substring(0, 500)
      };
    });

    console.log("\n=== ESTADO DEL CHAT (GUEST) ===");
    console.log(`   Chat nativo visible: ${chatPanel.hasNativeChat ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Banner invitado: ${chatPanel.hasGuestBanner ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Input de texto: ${chatPanel.hasInput ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Sugerencias rápidas: ${chatPanel.quickSuggestions ? '✅ SÍ' : '❌ NO'}`);

    if (chatPanel.hasNativeChat || chatPanel.quickSuggestions) {
      console.log("\n✅ COPILOT NATIVE VISIBLE PARA INVITADOS");

      // PASO 4: Enviar mensaje
      console.log("\n4. Enviando mensaje como invitado...");

      // Buscar el textarea
      const textarea = page.locator('textarea').first();

      if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
        await textarea.click();
        await page.waitForTimeout(500);

        const mensaje = 'Hola! Soy un invitado. Como puedo confirmar mi asistencia?';
        await textarea.fill(mensaje);
        console.log(`   ✓ Mensaje escrito: "${mensaje}"`);

        await page.waitForTimeout(1000);
        await screenshot(page, "V10-03-mensaje-escrito");

        // Presionar Enter para enviar
        await page.keyboard.press('Enter');
        console.log("   ✓ Mensaje enviado (Enter)");

        // Esperar respuesta
        console.log("\n5. Esperando respuesta del bot...");
        await page.waitForTimeout(8000);
        await screenshot(page, "V10-04-esperando-respuesta");

        // Verificar respuesta
        const response = await page.evaluate(() => {
          const body = document.body.innerText || '';
          // Buscar mensajes del asistente
          const hasResponse = body.includes('Pensando') === false &&
                              (body.includes('confirmar') ||
                               body.includes('asistencia') ||
                               body.includes('invitado') ||
                               body.includes('evento') ||
                               body.includes('boda'));
          const hasError = body.includes('Error') || body.includes('error');

          return {
            hasResponse,
            hasError,
            preview: body.substring(0, 800)
          };
        });

        if (response.hasResponse && !response.hasError) {
          console.log("\n✅ RESPUESTA RECIBIDA DEL BOT");
        } else if (response.hasError) {
          console.log("\n❌ ERROR EN LA RESPUESTA");
        } else {
          console.log("\n⏳ Respuesta pendiente...");
        }

        await page.waitForTimeout(5000);
        await screenshot(page, "V10-05-respuesta");

      } else {
        console.log("   ⚠️ No se encontró textarea para escribir mensaje");
      }

    } else {
      console.log("\n⚠️ NO SE DETECTÓ EL CHAT NATIVO");
      console.log("   Preview:", chatPanel.preview.substring(0, 200));
    }

    await screenshot(page, "V10-06-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V10-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
