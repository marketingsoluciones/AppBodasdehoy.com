const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST - CON LOGIN Y COPILOT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Navegar y hacer login vía API dev
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log("   Esperando carga inicial (8 seg)...");
    await page.waitForTimeout(8000);
    await screenshot(page, "L01-inicio");

    // Hacer login usando el endpoint de desarrollo
    console.log("\n2. Haciendo login vía API de desarrollo...");

    const loginResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dev/refresh-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'bodasdehoy.com@gmail.com' }),
          credentials: 'include'
        });

        const data = await response.json();
        return {
          success: data.success,
          message: data.message || data.error,
          status: response.status,
          user: data.user,
          eventos: data.eventos
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log(`   Login result: ${JSON.stringify(loginResult)}`);

    if (loginResult.success) {
      console.log("   ✓ Login exitoso! Recargando página...");
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(8000);
      await screenshot(page, "L02-after-login");
    } else {
      console.log("   ⚠️ Login falló, continuando de todos modos...");
    }

    // Verificar si estamos logueados
    const authState = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const hasUserMenu = body.includes('Mi perfil') || body.includes('Cerrar sesión') || body.includes('Mis eventos');
      const hasDashboard = body.includes('Resumen') || body.includes('Invitados') || body.includes('Presupuesto');

      // Verificar avatar/foto de usuario en header
      const avatar = document.querySelector('[class*="avatar"], [class*="profile"]');

      return {
        isLoggedIn: hasUserMenu || hasDashboard,
        hasAvatar: !!avatar,
        bodyPreview: body.substring(0, 200)
      };
    });

    console.log(`   Estado de auth: loggedIn=${authState.isLoggedIn}, avatar=${authState.hasAvatar}`);
    await screenshot(page, "L03-estado-auth");

    // ==========================================
    // PASO 3: Buscar y abrir Copilot
    // ==========================================
    console.log("\n3. Buscando botón Copilot...");

    // El botón Copilot está en el header, buscar por texto
    const copilotClicked = await page.evaluate(() => {
      // Buscar cualquier elemento con texto "Copilot"
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      while (walker.nextNode()) {
        if (walker.currentNode.textContent?.trim() === 'Copilot') {
          const parent = walker.currentNode.parentElement;
          if (parent) {
            const rect = parent.getBoundingClientRect();
            if (rect.width > 0 && rect.y < 80) {
              parent.click();
              return { clicked: true, x: rect.x, y: rect.y };
            }
          }
        }
      }

      // Buscar por clase o atributo
      const copilotEls = document.querySelectorAll('[class*="copilot"], [data-copilot], a[href*="copilot"]');
      for (const el of copilotEls) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          el.click();
          return { clicked: true, method: 'selector', x: rect.x, y: rect.y };
        }
      }

      return { clicked: false };
    });

    console.log(`   Copilot click: ${JSON.stringify(copilotClicked)}`);

    if (!copilotClicked.clicked) {
      // Buscar por coordenadas basadas en la captura (botón está aproximadamente en x=460)
      console.log("   Intentando click por coordenadas (~460, 15)...");
      await page.mouse.click(460, 15);
    }

    await page.waitForTimeout(5000);
    await screenshot(page, "L04-copilot-opened");

    // ==========================================
    // PASO 4: Verificar si se abrió el Copilot
    // ==========================================
    console.log("\n4. Verificando estado del Copilot...");

    // Puede ser un iframe, un panel lateral, o un modal
    const copilotState = await page.evaluate(() => {
      // Buscar iframe
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        const src = iframe.src || '';
        if (src.includes('chat') || src.includes('copilot')) {
          const rect = iframe.getBoundingClientRect();
          return { type: 'iframe', src: src.substring(0, 100), visible: rect.width > 100, width: rect.width, height: rect.height };
        }
      }

      // Verificar si hay iframes visibles grandes
      for (const iframe of iframes) {
        const rect = iframe.getBoundingClientRect();
        if (rect.width > 300 && rect.height > 400) {
          return { type: 'iframe-visible', src: iframe.src?.substring(0, 100), width: rect.width, height: rect.height };
        }
      }

      // Buscar panel/drawer
      const panels = document.querySelectorAll('[class*="drawer"], [class*="panel"], [class*="sidebar"]');
      for (const panel of panels) {
        const rect = panel.getBoundingClientRect();
        if (rect.width > 300 && panel.querySelector('textarea, input')) {
          return { type: 'panel', width: rect.width };
        }
      }

      // Buscar textarea directamente
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        return { type: 'textarea', visible: rect.width > 0, x: rect.x, y: rect.y };
      }

      return { type: 'not_found' };
    });

    console.log(`   Estado Copilot: ${JSON.stringify(copilotState)}`);

    // ==========================================
    // PASO 5: Interactuar con el chat
    // ==========================================
    console.log("\n5. Interactuando con el chat...");

    if (copilotState.type === 'iframe' || copilotState.type === 'iframe-visible') {
      // El chat está en un iframe
      console.log("   Chat está en iframe, buscando frame...");

      const frames = page.frames();
      console.log(`   Total frames: ${frames.length}`);

      // Encontrar el frame del chat
      let chatFrame = null;
      for (const frame of frames) {
        const url = frame.url();
        if (url.includes('chat') || url.includes('copilot') || url.includes('3210')) {
          chatFrame = frame;
          console.log(`   ✓ Frame encontrado: ${url}`);
          break;
        }
      }

      if (chatFrame) {
        // Esperar a que cargue
        await page.waitForTimeout(5000);

        // Buscar textarea en el frame
        const textarea = await chatFrame.$('textarea');
        if (textarea) {
          console.log("   ✓ Textarea encontrado en iframe!");

          await textarea.click();
          await page.waitForTimeout(500);
          await textarea.type('Hola! Que servicios ofrece Bodas de Hoy para organizar una boda perfecta?', { delay: 20 });
          await page.waitForTimeout(1000);
          await screenshot(page, "L05-mensaje-escrito");

          // Buscar botón de envío
          const sendBtn = await chatFrame.$('button:last-of-type');
          if (sendBtn) {
            await sendBtn.click();
            console.log("   ✓ Mensaje enviado!");
          } else {
            // Intentar con Enter
            await textarea.press('Enter');
            console.log("   Enviado con Enter");
          }
        } else {
          console.log("   ⚠️ No se encontró textarea en iframe");
        }
      }
    } else if (copilotState.type === 'textarea') {
      // Textarea en página principal
      console.log("   Usando textarea en página principal...");
      await page.click('textarea');
      await page.type('textarea', 'Hola! Que servicios ofrece Bodas de Hoy?', { delay: 20 });
      await page.press('textarea', 'Enter');
    } else {
      console.log("   ⚠️ No se encontró interfaz de chat");
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "L06-despues-envio");

    // ==========================================
    // PASO 6: Esperar respuesta
    // ==========================================
    console.log("\n6. Esperando respuesta (90 seg)...");

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);
      await screenshot(page, `L07-espera-${(i+1)*15}s`);

      // Verificar si hay error en cualquier frame
      const status = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return {
          hasError: text.includes('error occurred') || text.includes('No enabled providers'),
          bodyLen: text.length
        };
      });

      if (status.hasError) {
        console.log("   ❌ Error detectado");
        break;
      }
    }

    await screenshot(page, "L08-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "L-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
