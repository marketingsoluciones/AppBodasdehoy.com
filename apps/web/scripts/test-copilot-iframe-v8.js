/**
 * Test V8: Verificar si el Copilot ya funciona después del fix del backend
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST V8 - VERIFICAR FIX BACKEND ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // PASO 1: Navegar y autenticar
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(3000);

    // PASO 2: Establecer dev_bypass
    console.log("\n2. Estableciendo dev_bypass...");
    await page.evaluate(() => {
      sessionStorage.setItem('dev_bypass', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    await screenshot(page, "V8-01-after-bypass");

    // Verificar autenticación
    const authStatus = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        hasEvents: body.includes('eventos') || body.includes('Eventos'),
        hasLogin: body.includes('Iniciar sesión'),
        isLoggedIn: !body.includes('Iniciar sesión') && (body.includes('eventos') || body.includes('dashboard'))
      };
    });

    console.log(`   Autenticado: ${authStatus.isLoggedIn}`);

    if (!authStatus.isLoggedIn) {
      console.log("   ⚠️ No autenticado. Terminando.");
      await browser.close();
      return;
    }

    // PASO 3: Abrir Copilot
    console.log("\n3. Abriendo Copilot...");
    const copilotBtn = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.innerText?.trim() === 'Copilot') {
          const rect = el.getBoundingClientRect();
          if (rect.y < 80 && rect.width > 0) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
      }
      return null;
    });

    if (copilotBtn) {
      await page.mouse.click(copilotBtn.x, copilotBtn.y);
      console.log("   Click en Copilot");
    }

    await page.waitForTimeout(8000);
    await screenshot(page, "V8-02-copilot-abierto");

    // PASO 4: Verificar estado del chat
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
          hasInput: !!document.querySelector('[contenteditable="true"]'),
          hasWelcome: body.includes('Bodas de Hoy') || body.includes('assist'),
          preview: body.substring(0, 200)
        };
      });

      console.log("\n=== ESTADO DEL CHAT ===");
      console.log(`   Error Backend IA: ${chatStatus.hasBackendError ? '❌ SÍ' : '✅ NO'}`);
      console.log(`   No Providers: ${chatStatus.hasNoProviders ? '❌ SÍ' : '✅ NO'}`);
      console.log(`   Input disponible: ${chatStatus.hasInput ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Mensaje bienvenida: ${chatStatus.hasWelcome ? '✅ SÍ' : '❌ NO'}`);

      if (chatStatus.hasBackendError || chatStatus.hasNoProviders) {
        console.log("\n❌ EL ERROR PERSISTE EN EL IFRAME");
        console.log("   Esto indica un problema de CORS o configuración del iframe");
      } else if (chatStatus.hasInput) {
        console.log("\n✅ EL COPILOT PARECE FUNCIONAR");

        // PASO 5: Enviar mensaje de prueba
        console.log("\n5. Enviando mensaje de prueba...");

        const frameLocator = page.frameLocator('iframe[src*="chat-test"]');
        const input = frameLocator.locator('[contenteditable="true"]').first();

        try {
          await input.click({ timeout: 5000 });
          await page.waitForTimeout(500);

          const mensaje = 'Hola! Funciona el chat?';
          await input.type(mensaje, { delay: 30 });

          await page.waitForTimeout(1000);
          await screenshot(page, "V8-03-mensaje-escrito");

          // Enviar
          await page.keyboard.press('Enter');
          console.log("   ✓ Mensaje enviado");

          await page.waitForTimeout(8000);
          await screenshot(page, "V8-04-esperando-respuesta");

          // Verificar respuesta
          const response = await chatFrame.evaluate(() => {
            const messages = document.querySelectorAll('[class*="message"]');
            let lastBotMsg = '';
            messages.forEach(m => {
              const text = m.innerText || '';
              if (text.length > 50 && !text.includes('Hola! Funciona')) {
                lastBotMsg = text;
              }
            });
            return {
              hasResponse: lastBotMsg.length > 20,
              preview: lastBotMsg.substring(0, 100)
            };
          });

          if (response.hasResponse) {
            console.log(`\n✅ RESPUESTA RECIBIDA: "${response.preview}..."`);
          } else {
            // Esperar más
            console.log("   Esperando respuesta...");
            await page.waitForTimeout(10000);
            await screenshot(page, "V8-05-mas-espera");
          }

        } catch (e) {
          console.log(`   Error al enviar: ${e.message}`);
        }
      }
    }

    await screenshot(page, "V8-06-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V8-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
