/**
 * Test V9: Verificar que el Copilot funciona para usuarios GUEST (no autenticados)
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST V9 - COPILOT COMO INVITADO (GUEST) ===\n");

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
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(5000);

    await screenshot(page, "V9-01-inicio-guest");

    // Verificar que NO estamos autenticados
    const authStatus = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        hasLogin: body.includes('Iniciar sesión') || body.includes('Login'),
        hasEvents: body.includes('Mis eventos') || body.includes('dashboard'),
        url: window.location.href
      };
    });

    console.log(`   Estado: hasLogin=${authStatus.hasLogin}, hasEvents=${authStatus.hasEvents}`);
    console.log(`   URL: ${authStatus.url}`);

    // PASO 2: Buscar y abrir Copilot
    console.log("\n2. Buscando botón Copilot...");

    const copilotBtn = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.innerText?.trim() === 'Copilot') {
          const rect = el.getBoundingClientRect();
          if (rect.y < 100 && rect.width > 0) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
      }
      return null;
    });

    if (copilotBtn) {
      console.log("   ✓ Botón Copilot encontrado, haciendo click...");
      await page.mouse.click(copilotBtn.x, copilotBtn.y);
    } else {
      console.log("   ⚠️ Botón Copilot no encontrado en header. Buscando alternativas...");

      // Intentar encontrar por selector
      const copilotElements = await page.locator('text=Copilot').all();
      if (copilotElements.length > 0) {
        await copilotElements[0].click();
        console.log("   ✓ Click en elemento Copilot encontrado");
      }
    }

    await page.waitForTimeout(8000);
    await screenshot(page, "V9-02-copilot-abierto");

    // PASO 3: Verificar estado del chat
    console.log("\n3. Verificando estado del chat...");

    const frames = page.frames();
    let chatFrame = null;

    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('chat-test') || url.includes('copilot')) {
        chatFrame = frame;
        console.log(`   Frame: ${url.substring(0, 60)}`);
        break;
      }
    }

    if (chatFrame) {
      const chatStatus = await chatFrame.evaluate(() => {
        const body = document.body?.innerText || '';
        return {
          hasBackendError: body.includes('Backend IA') && body.includes('Error'),
          hasNoProviders: body.includes('No enabled providers'),
          hasLoginRequired: body.includes('Inicia sesión') || body.includes('Login'),
          hasInput: !!document.querySelector('[contenteditable="true"]'),
          hasWelcome: body.includes('Bodas de Hoy') || body.includes('assist') || body.includes('Copilot'),
          preview: body.substring(0, 300)
        };
      });

      console.log("\n=== ESTADO DEL CHAT (GUEST) ===");
      console.log(`   Error Backend IA: ${chatStatus.hasBackendError ? '❌ SÍ' : '✅ NO'}`);
      console.log(`   No Providers: ${chatStatus.hasNoProviders ? '❌ SÍ' : '✅ NO'}`);
      console.log(`   Login Required: ${chatStatus.hasLoginRequired ? '❌ SÍ' : '✅ NO'}`);
      console.log(`   Input disponible: ${chatStatus.hasInput ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Mensaje bienvenida: ${chatStatus.hasWelcome ? '✅ SÍ' : '❌ NO'}`);

      if (chatStatus.hasLoginRequired) {
        console.log("\n⚠️ SE REQUIERE LOGIN - El fix puede no haberse aplicado");
        console.log("   Preview:", chatStatus.preview.substring(0, 150));
      } else if (chatStatus.hasInput) {
        console.log("\n✅ EL COPILOT ESTÁ DISPONIBLE PARA INVITADOS");

        // PASO 4: Enviar mensaje de prueba
        console.log("\n4. Enviando mensaje como invitado...");

        const frameLocator = page.frameLocator('iframe[src*="chat-test"]');
        const input = frameLocator.locator('[contenteditable="true"]').first();

        try {
          await input.click({ timeout: 5000 });
          await page.waitForTimeout(500);

          const mensaje = 'Hola! Soy un invitado. Como puedo confirmar mi asistencia a una boda?';
          await input.type(mensaje, { delay: 30 });

          await page.waitForTimeout(1000);
          await screenshot(page, "V9-03-mensaje-escrito");

          // Enviar
          await page.keyboard.press('Enter');
          console.log("   ✓ Mensaje enviado como invitado");

          // Esperar respuesta
          console.log("\n5. Esperando respuesta del bot...");
          await page.waitForTimeout(10000);
          await screenshot(page, "V9-04-esperando-respuesta");

          // Verificar respuesta
          const response = await chatFrame.evaluate(() => {
            const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
            let lastBotMsg = '';
            messages.forEach(m => {
              const text = m.innerText || '';
              if (text.length > 50 && !text.includes('Soy un invitado')) {
                lastBotMsg = text;
              }
            });

            const body = document.body?.innerText || '';
            const hasError = body.includes('Error') || body.includes('error');

            return {
              hasResponse: lastBotMsg.length > 20,
              hasError,
              preview: lastBotMsg.substring(0, 150) || body.substring(0, 150)
            };
          });

          if (response.hasResponse) {
            console.log(`\n✅ RESPUESTA RECIBIDA:`);
            console.log(`   "${response.preview}..."`);
          } else if (response.hasError) {
            console.log("\n❌ ERROR EN LA RESPUESTA");
            console.log(`   ${response.preview}`);
          } else {
            console.log("\n⏳ Esperando más tiempo...");
            await page.waitForTimeout(10000);
            await screenshot(page, "V9-05-mas-espera");
          }

        } catch (e) {
          console.log(`   Error al enviar: ${e.message}`);
        }
      }
    } else {
      // Verificar si hay mensaje de "Inicia sesión" fuera del iframe
      const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log("\n⚠️ No se encontró iframe del chat");
      console.log("   Contenido:", pageContent.substring(0, 200));
    }

    await screenshot(page, "V9-06-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V9-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
