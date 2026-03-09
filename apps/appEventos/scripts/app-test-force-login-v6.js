const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST V6 - FORCE LOGIN + COPILOT ===\n");

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
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(5000);
    await screenshot(page, "V6-01-inicio");

    // ==========================================
    // PASO 2: Hacer login con FORCE=true
    // ==========================================
    console.log("\n2. Haciendo login con FORCE=true...");

    const loginResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dev/refresh-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'bodasdehoy.com@gmail.com',
            force: true  // <-- FORZAR CREACIÓN DE SESIÓN
          }),
          credentials: 'include'
        });

        const data = await response.json();
        return {
          success: data.success,
          status: response.status,
          message: data.message || data.error,
          warning: data.warning
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`   Login result: ${JSON.stringify(loginResult)}`);

    if (loginResult.success) {
      console.log("   ✓ Login FORCE exitoso! Recargando página...");
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
    } else {
      console.log("   ⚠️ Login falló incluso con force=true");
      console.log("   Puede que necesites reiniciar el servidor Next.js");
    }

    await screenshot(page, "V6-02-after-login");

    // Verificar estado de auth
    const authStatus = await page.evaluate(() => {
      const avatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
      let avatarText = '';
      avatars.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length <= 3) avatarText = text;
      });

      const body = document.body.innerText || '';
      return {
        avatarText,
        isGuest: avatarText === 'G' || avatarText === '',
        hasEvents: body.includes('eventos') || body.includes('Eventos')
      };
    });

    console.log(`   Estado auth: avatar="${authStatus.avatarText}", isGuest=${authStatus.isGuest}`);

    // Mostrar cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'sessionBodas');
    if (sessionCookie) {
      console.log(`   ✓ Cookie sessionBodas establecida: ${sessionCookie.value.substring(0, 50)}...`);
    } else {
      console.log("   ⚠️ No hay cookie sessionBodas");
    }

    // ==========================================
    // PASO 3: Abrir Copilot
    // ==========================================
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
    await screenshot(page, "V6-03-copilot-abierto");

    // ==========================================
    // PASO 4: Verificar estado del chat
    // ==========================================
    console.log("\n4. Verificando estado del chat...");

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
      const chatStatus = await chatFrame.evaluate(() => {
        const body = document.body?.innerText || '';
        return {
          hasError: body.includes('Error de conexión') || body.includes('Backend IA'),
          hasNoProviders: body.includes('No enabled providers'),
          hasInput: !!document.querySelector('[contenteditable="true"]'),
          preview: body.substring(0, 300)
        };
      });

      console.log(`   Chat: error=${chatStatus.hasError}, noProviders=${chatStatus.hasNoProviders}, input=${chatStatus.hasInput}`);

      if (chatStatus.hasError || chatStatus.hasNoProviders) {
        console.log("   ❌ Error detectado en el chat:");
        console.log(`   ${chatStatus.preview.substring(0, 150)}`);
      }

      // ==========================================
      // PASO 5: Enviar mensaje
      // ==========================================
      if (chatStatus.hasInput && !chatStatus.hasError) {
        console.log("\n5. Enviando mensaje...");

        const frameLocator = page.frameLocator('iframe[src*="chat-test"]');
        const input = frameLocator.locator('[contenteditable="true"]').first();

        try {
          await input.click({ timeout: 5000 });
          await page.waitForTimeout(500);

          const mensaje = 'Hola! Recomiendame los mejores lugares para celebrar una boda en Madrid';
          await input.type(mensaje, { delay: 25 });
          console.log(`   ✓ Mensaje: "${mensaje}"`);

          await page.waitForTimeout(1000);
          await screenshot(page, "V6-04-mensaje-escrito");

          // Enviar
          const sendBtn = frameLocator.locator('button').last();
          await sendBtn.click();
          console.log("   ✓ Mensaje enviado!");

          await page.waitForTimeout(3000);
          await screenshot(page, "V6-05-mensaje-enviado");

        } catch (e) {
          console.log(`   Error: ${e.message}`);
        }
      } else {
        console.log("\n5. No se puede enviar mensaje debido a errores");
      }
    }

    // ==========================================
    // PASO 6: Esperar respuesta
    // ==========================================
    console.log("\n6. Esperando respuesta (60 seg)...");

    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i + 1) * 15} segundos...`);
      await screenshot(page, `V6-06-espera-${(i + 1) * 15}s`);

      if (chatFrame) {
        const status = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          const messages = document.querySelectorAll('[class*="message"]');
          let lastMsg = '';
          messages.forEach(m => {
            if (m.innerText?.length > 50) lastMsg = m.innerText;
          });

          return {
            hasError: body.includes('No enabled') || body.includes('error occurred'),
            hasResponse: lastMsg.length > 100,
            preview: lastMsg.substring(0, 100)
          };
        }).catch(() => ({}));

        if (status.hasError) {
          console.log("   ❌ Error en respuesta");
          break;
        }
        if (status.hasResponse) {
          console.log(`   ✓ Respuesta recibida: ${status.preview}...`);
          break;
        }
      }
    }

    await screenshot(page, "V6-07-final");

    // ==========================================
    // Resumen
    // ==========================================
    console.log("\n=== RESUMEN ===");
    console.log(`Login: ${loginResult.success ? '✓' : '❌'}`);

    const finalAuth = await page.evaluate(() => {
      const avatars = document.querySelectorAll('[class*="avatar"]');
      let avatar = '';
      avatars.forEach(el => {
        if (el.innerText?.length <= 3) avatar = el.innerText;
      });
      return { avatar, isGuest: avatar === 'G' || avatar === '' };
    });

    console.log(`Auth: avatar="${finalAuth.avatar}", guest=${finalAuth.isGuest}`);

    console.log("\n=== NAVEGADOR ABIERTO 2 MIN ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V6-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
