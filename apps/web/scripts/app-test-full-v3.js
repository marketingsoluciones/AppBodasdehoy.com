const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST V3 - LOGIN + COPILOT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Escuchar eventos de consola del iframe
  page.on('console', msg => {
    if (msg.text().includes('error') || msg.text().includes('Error')) {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  try {
    // ==========================================
    // PASO 1: Navegar a app-test
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log("   Esperando carga inicial (8 seg)...");
    await page.waitForTimeout(8000);
    await screenshot(page, "V3-01-inicio");

    // ==========================================
    // PASO 2: Verificar estado de autenticación
    // ==========================================
    console.log("\n2. Verificando estado de autenticación...");

    const authCheck = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const hasUserName = body.includes('Bodas de Hoy') || body.includes('Juan') || body.includes('Admin');
      const hasLoginForm = body.includes('Iniciar sesión') || body.includes('Correo electrónico');
      const hasEvents = body.includes('Eventos') || body.includes('eventos') || body.includes('Resumen');

      // Buscar avatar con inicial (indica usuario logueado)
      const avatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
      let avatarText = '';
      avatars.forEach(a => {
        if (a.innerText && a.innerText.length <= 2) {
          avatarText = a.innerText;
        }
      });

      return {
        hasUserName,
        hasLoginForm,
        hasEvents,
        avatarText,
        isLoggedIn: hasEvents && !hasLoginForm,
        bodyPreview: body.substring(0, 300)
      };
    });

    console.log(`   Estado auth: loggedIn=${authCheck.isLoggedIn}, avatar="${authCheck.avatarText}"`);
    console.log(`   hasEvents=${authCheck.hasEvents}, hasLoginForm=${authCheck.hasLoginForm}`);

    // ==========================================
    // PASO 3: Hacer login si es necesario
    // ==========================================
    if (!authCheck.isLoggedIn || authCheck.hasLoginForm) {
      console.log("\n3. Intentando login via API dev...");

      // Intentar login con el endpoint de desarrollo
      const loginResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/dev/refresh-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'bodasdehoy.com@gmail.com'
            }),
            credentials: 'include'
          });

          const data = await response.json();
          return {
            success: data.success,
            status: response.status,
            message: data.message || data.error,
            user: data.user,
            expires: data.expires
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      console.log(`   Login result: ${JSON.stringify(loginResult)}`);

      if (loginResult.success) {
        console.log("   ✓ Login exitoso! Recargando...");
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
        await screenshot(page, "V3-02-after-login");
      } else {
        console.log("   ⚠️ Login falló, verificando cookies existentes...");

        // Verificar si hay cookies de sesión
        const cookies = await context.cookies();
        const sessionCookie = cookies.find(c => c.name === 'sessionBodas');
        if (sessionCookie) {
          console.log(`   Cookie sessionBodas encontrada: ${sessionCookie.value.substring(0, 30)}...`);
        } else {
          console.log("   No hay cookie de sesión");
        }
      }
    } else {
      console.log("\n3. Usuario ya autenticado, continuando...");
    }

    await screenshot(page, "V3-03-estado-auth");

    // ==========================================
    // PASO 4: Buscar y abrir Copilot
    // ==========================================
    console.log("\n4. Buscando botón Copilot en header...");

    // Buscar el botón Copilot
    const copilotButton = await page.evaluate(() => {
      // Buscar por texto exacto "Copilot" en el header
      const allElements = document.querySelectorAll('button, a, div, span');

      for (const el of allElements) {
        const text = el.innerText?.trim();
        if (text === 'Copilot') {
          const rect = el.getBoundingClientRect();
          // Debe estar en el header (y < 80px)
          if (rect.width > 0 && rect.y < 80) {
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              text: text
            };
          }
        }
      }

      // Buscar por clase
      const byClass = document.querySelector('[class*="copilot" i], [data-testid*="copilot" i]');
      if (byClass) {
        const rect = byClass.getBoundingClientRect();
        return {
          found: true,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          method: 'class'
        };
      }

      return { found: false };
    });

    console.log(`   Botón Copilot: ${JSON.stringify(copilotButton)}`);

    if (copilotButton.found) {
      console.log("   Haciendo click en Copilot...");
      await page.mouse.click(copilotButton.x, copilotButton.y);
    } else {
      // Intentar click por coordenadas aproximadas del header
      console.log("   Intentando click por coordenadas (~500, 20)...");
      await page.mouse.click(500, 20);
    }

    await page.waitForTimeout(5000);
    await screenshot(page, "V3-04-copilot-clicked");

    // ==========================================
    // PASO 5: Verificar iframe del Copilot
    // ==========================================
    console.log("\n5. Verificando iframe del Copilot...");

    const iframeCheck = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const results = [];

      iframes.forEach((iframe, i) => {
        const rect = iframe.getBoundingClientRect();
        results.push({
          index: i,
          src: iframe.src?.substring(0, 100),
          width: rect.width,
          height: rect.height,
          visible: rect.width > 100 && rect.height > 100,
          isChat: iframe.src?.includes('chat') || iframe.src?.includes('copilot')
        });
      });

      return results;
    });

    console.log(`   Iframes encontrados: ${JSON.stringify(iframeCheck)}`);

    // Encontrar el iframe del chat
    const chatIframeInfo = iframeCheck.find(i => i.isChat || i.visible);

    if (chatIframeInfo) {
      console.log(`   ✓ Iframe del chat encontrado: index=${chatIframeInfo.index}, src=${chatIframeInfo.src}`);

      // Esperar a que el iframe cargue completamente
      console.log("   Esperando carga del iframe (10 seg)...");
      await page.waitForTimeout(10000);
      await screenshot(page, "V3-05-iframe-loaded");

      // ==========================================
      // PASO 6: Interactuar con el iframe
      // ==========================================
      console.log("\n6. Interactuando con el chat en iframe...");

      // Obtener todos los frames de la página
      const frames = page.frames();
      console.log(`   Total frames: ${frames.length}`);

      let chatFrame = null;
      for (const frame of frames) {
        const url = frame.url();
        if (url.includes('chat') || url.includes('copilot') || url.includes('3210')) {
          chatFrame = frame;
          console.log(`   ✓ Chat frame encontrado: ${url.substring(0, 80)}`);
          break;
        }
      }

      if (chatFrame) {
        // Verificar estado del iframe
        const iframeState = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          const hasError = body.includes('Error') || body.includes('error');
          const hasBackendError = body.includes('Backend IA') || body.includes('conexión');
          const textarea = document.querySelector('textarea');
          const hasTextarea = !!textarea;

          return {
            hasError,
            hasBackendError,
            hasTextarea,
            bodyPreview: body.substring(0, 300)
          };
        }).catch(e => ({ error: e.message }));

        console.log(`   Estado iframe: ${JSON.stringify(iframeState)}`);

        if (iframeState.hasTextarea) {
          console.log("   ✓ Textarea encontrado en iframe!");

          // Escribir mensaje
          const textarea = await chatFrame.$('textarea');
          if (textarea) {
            await textarea.click();
            await page.waitForTimeout(500);

            const mensaje = 'Hola! Que servicios ofrece Bodas de Hoy para organizar una boda perfecta?';
            await textarea.fill(mensaje);
            console.log(`   Mensaje escrito: "${mensaje}"`);

            await page.waitForTimeout(1000);
            await screenshot(page, "V3-06-mensaje-escrito");

            // Buscar botón de envío
            const sendButton = await chatFrame.$('button[type="submit"], button:has(svg), button:last-of-type');
            if (sendButton) {
              await sendButton.click();
              console.log("   ✓ Botón de envío clickeado!");
            } else {
              // Intentar con Enter
              await textarea.press('Enter');
              console.log("   Enviado con Enter");
            }

            await page.waitForTimeout(3000);
            await screenshot(page, "V3-07-mensaje-enviado");
          }
        } else if (iframeState.hasBackendError) {
          console.log("   ❌ Error de backend detectado en iframe");
          console.log(`   Contenido: ${iframeState.bodyPreview}`);
        } else {
          console.log("   ⚠️ No se encontró textarea en iframe");
        }
      } else {
        console.log("   ⚠️ No se encontró frame del chat");
      }
    } else {
      console.log("   ⚠️ No se encontró iframe del Copilot");
    }

    // ==========================================
    // PASO 7: Esperar respuesta
    // ==========================================
    console.log("\n7. Esperando respuesta del chat (90 seg)...");

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i + 1) * 15} segundos...`);
      await screenshot(page, `V3-08-espera-${(i + 1) * 15}s`);

      // Verificar estado
      const frames = page.frames();
      let chatFrame = null;
      for (const frame of frames) {
        const url = frame.url();
        if (url.includes('chat') || url.includes('copilot')) {
          chatFrame = frame;
          break;
        }
      }

      if (chatFrame) {
        const status = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          return {
            hasError: body.includes('error occurred') || body.includes('No enabled providers'),
            hasLoading: !!document.querySelector('[class*="loading"], [class*="typing"]'),
            length: body.length,
            preview: body.substring(0, 200)
          };
        }).catch(() => ({ error: 'frame error' }));

        console.log(`   Status: error=${status.hasError}, loading=${status.hasLoading}`);

        if (status.hasError) {
          console.log("   ❌ Error detectado en chat");
          console.log(`   Preview: ${status.preview}`);
          break;
        }
      }
    }

    await screenshot(page, "V3-09-final");

    // ==========================================
    // PASO 8: Resumen final
    // ==========================================
    console.log("\n8. Resumen final:");
    console.log(`   URL: ${page.url()}`);

    const finalState = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        hasError: body.includes('error') || body.includes('Error'),
        hasCopilot: !!document.querySelector('iframe'),
        bodyLength: body.length
      };
    });

    console.log(`   Estado: hasError=${finalState.hasError}, hasCopilot=${finalState.hasCopilot}`);

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V3-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
