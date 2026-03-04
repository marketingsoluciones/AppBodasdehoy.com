const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST V7 - DEV BYPASS + COPILOT ===\n");

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
    // ==========================================
    // PASO 1: Navegar a app-test
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);

    // ==========================================
    // PASO 2: Establecer dev_bypass en sessionStorage
    // ==========================================
    console.log("\n2. Estableciendo dev_bypass...");

    await page.evaluate(() => {
      sessionStorage.setItem('dev_bypass', 'true');
      console.log("[Test] dev_bypass establecido en sessionStorage");
    });

    // Recargar para que el AuthContext use el bypass
    console.log("   Recargando página para aplicar bypass...");
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(8000);

    await screenshot(page, "V7-01-after-bypass");

    // Verificar estado de autenticación
    const authStatus = await page.evaluate(() => {
      const avatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
      let avatarText = '';
      avatars.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length <= 3) avatarText = text;
      });

      const body = document.body.innerText || '';
      const hasEvents = body.includes('eventos') || body.includes('Eventos') || body.includes('Mis eventos');
      const hasLogin = body.includes('Iniciar sesión') || body.includes('Correo electrónico');

      return {
        avatarText,
        hasEvents,
        hasLogin,
        isLoggedIn: hasEvents && !hasLogin,
        url: window.location.href
      };
    });

    console.log(`   Estado: avatar="${authStatus.avatarText}", loggedIn=${authStatus.isLoggedIn}, hasLogin=${authStatus.hasLogin}`);
    console.log(`   URL: ${authStatus.url}`);

    // ==========================================
    // PASO 3: Si estamos logueados, buscar Copilot
    // ==========================================
    if (authStatus.isLoggedIn) {
      console.log("\n3. ✓ Usuario autenticado! Buscando Copilot...");

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
      await screenshot(page, "V7-02-copilot-abierto");

      // Verificar iframe del chat
      const frames = page.frames();
      let chatFrame = null;

      for (const frame of frames) {
        const url = frame.url();
        if (url.includes('chat-test') || url.includes('copilot')) {
          chatFrame = frame;
          console.log(`   Frame del chat: ${url.substring(0, 60)}`);
          break;
        }
      }

      if (chatFrame) {
        // Verificar estado del chat
        const chatStatus = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          return {
            hasError: body.includes('Error de conexión') || body.includes('Backend IA'),
            hasInput: !!document.querySelector('[contenteditable="true"]'),
            preview: body.substring(0, 200)
          };
        });

        console.log(`   Chat: error=${chatStatus.hasError}, input=${chatStatus.hasInput}`);

        if (chatStatus.hasError) {
          console.log("   ❌ Error de conexión con Backend IA");
        } else if (chatStatus.hasInput) {
          // ==========================================
          // PASO 4: Enviar mensaje
          // ==========================================
          console.log("\n4. Enviando mensaje al chat...");

          const frameLocator = page.frameLocator('iframe[src*="chat-test"]');
          const input = frameLocator.locator('[contenteditable="true"]').first();

          try {
            await input.click({ timeout: 5000 });
            await page.waitForTimeout(500);

            const mensaje = 'Hola! Cuales son los servicios mas populares para organizar una boda en Madrid?';
            await input.type(mensaje, { delay: 25 });
            console.log(`   ✓ Mensaje: "${mensaje}"`);

            await page.waitForTimeout(1000);
            await screenshot(page, "V7-03-mensaje-escrito");

            // Enviar
            const sendBtn = frameLocator.locator('button').last();
            await sendBtn.click();
            console.log("   ✓ Mensaje enviado!");

            await page.waitForTimeout(3000);
            await screenshot(page, "V7-04-mensaje-enviado");

            // ==========================================
            // PASO 5: Esperar respuesta
            // ==========================================
            console.log("\n5. Esperando respuesta (60 seg)...");

            for (let i = 0; i < 4; i++) {
              await page.waitForTimeout(15000);
              console.log(`   ${(i + 1) * 15} segundos...`);
              await screenshot(page, `V7-05-espera-${(i + 1) * 15}s`);

              const status = await chatFrame.evaluate(() => {
                const body = document.body?.innerText || '';
                const messages = document.querySelectorAll('[class*="message"]');
                let lastMsg = '';
                messages.forEach(m => {
                  if (m.innerText?.length > 100) lastMsg = m.innerText;
                });

                return {
                  hasError: body.includes('No enabled') || body.includes('error occurred'),
                  hasResponse: lastMsg.length > 100,
                  preview: lastMsg.substring(0, 150)
                };
              }).catch(() => ({}));

              if (status.hasError) {
                console.log("   ❌ Error en respuesta");
                break;
              }
              if (status.hasResponse) {
                console.log(`   ✓ Respuesta: ${status.preview}...`);
                break;
              }
            }

          } catch (e) {
            console.log(`   Error: ${e.message}`);
          }
        }
      }

    } else {
      console.log("\n3. ⚠️ No se pudo autenticar con bypass");
      console.log("   El bypass puede no estar funcionando o hay otro problema");

      // Intentar verificar si hay algún mensaje de error
      const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`   Contenido: ${pageContent.substring(0, 200)}`);
    }

    await screenshot(page, "V7-06-final");

    // ==========================================
    // Resumen
    // ==========================================
    console.log("\n=== RESUMEN ===");

    const finalAuth = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const avatars = document.querySelectorAll('[class*="avatar"]');
      let avatar = '';
      avatars.forEach(el => {
        if (el.innerText?.length <= 3) avatar = el.innerText;
      });
      return {
        avatar,
        isGuest: avatar === 'G' || avatar === '',
        hasEvents: body.includes('Mis eventos'),
        url: window.location.href
      };
    });

    console.log(`Auth: avatar="${finalAuth.avatar}", guest=${finalAuth.isGuest}, events=${finalAuth.hasEvents}`);
    console.log(`URL: ${finalAuth.url}`);

    console.log("\n=== NAVEGADOR ABIERTO 2 MIN ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V7-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
