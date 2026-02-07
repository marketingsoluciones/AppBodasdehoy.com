const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST V4 - RETRY BACKEND + ENVIAR MENSAJE ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar errores de red
  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('api-ia') || url.includes('chat')) {
      console.log(`[REQUEST FAILED] ${url}: ${request.failure()?.errorText}`);
    }
  });

  try {
    // ==========================================
    // PASO 1: Navegar y abrir Copilot
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(8000);
    await screenshot(page, "V4-01-inicio");

    // Buscar y clickear Copilot
    console.log("\n2. Abriendo Copilot...");
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
      console.log("   Click en Copilot realizado");
    }

    await page.waitForTimeout(8000);
    await screenshot(page, "V4-02-copilot-abierto");

    // ==========================================
    // PASO 3: Encontrar el frame del chat
    // ==========================================
    console.log("\n3. Buscando frame del chat...");

    const frames = page.frames();
    let chatFrame = null;

    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('chat-test') || url.includes('copilot')) {
        chatFrame = frame;
        console.log(`   ✓ Frame encontrado: ${url.substring(0, 80)}`);
        break;
      }
    }

    if (!chatFrame) {
      console.log("   ❌ No se encontró frame del chat");
      await page.waitForTimeout(60000);
      await browser.close();
      return;
    }

    // ==========================================
    // PASO 4: Verificar estado del chat
    // ==========================================
    console.log("\n4. Verificando estado del chat...");

    const chatState = await chatFrame.evaluate(() => {
      const body = document.body?.innerText || '';

      // Buscar error de backend
      const hasBackendError = body.includes('Backend IA') && body.includes('Error');
      const hasConnectionError = body.includes('Error de conexión');

      // Buscar botón Reintentar
      const retryBtn = Array.from(document.querySelectorAll('button, span, div')).find(el =>
        el.innerText?.trim() === 'Reintentar' || el.innerText?.includes('Retry')
      );

      // Buscar el campo de entrada (puede ser textarea, input, o contenteditable)
      const textarea = document.querySelector('textarea');
      const inputField = document.querySelector('input[type="text"]');
      const contentEditable = document.querySelector('[contenteditable="true"]');
      const chatInput = document.querySelector('[class*="input"], [class*="composer"], [class*="message-input"]');

      // Buscar por placeholder
      const withPlaceholder = document.querySelector('[placeholder*="mensaje"], [placeholder*="message"], [data-placeholder]');

      return {
        hasBackendError,
        hasConnectionError,
        hasRetryButton: !!retryBtn,
        retryButtonText: retryBtn?.innerText,
        hasTextarea: !!textarea,
        hasInputField: !!inputField,
        hasContentEditable: !!contentEditable,
        hasChatInput: !!chatInput,
        hasWithPlaceholder: !!withPlaceholder,
        bodyPreview: body.substring(0, 400)
      };
    });

    console.log(`   Estado: ${JSON.stringify(chatState, null, 2)}`);

    // ==========================================
    // PASO 5: Hacer click en Reintentar si hay error
    // ==========================================
    if (chatState.hasBackendError || chatState.hasConnectionError) {
      console.log("\n5. Error de backend detectado, buscando botón Reintentar...");

      const retryClicked = await chatFrame.evaluate(() => {
        // Buscar botón de reintentar
        const buttons = document.querySelectorAll('button, span, div, a');
        for (const btn of buttons) {
          const text = btn.innerText?.trim().toLowerCase();
          if (text === 'reintentar' || text === 'retry' || text.includes('reintentar')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0) {
              btn.click();
              return { clicked: true, text: btn.innerText };
            }
          }
        }

        // Buscar por clase
        const retryByClass = document.querySelector('[class*="retry"], [class*="reconnect"]');
        if (retryByClass) {
          retryByClass.click();
          return { clicked: true, method: 'class' };
        }

        return { clicked: false };
      });

      console.log(`   Retry result: ${JSON.stringify(retryClicked)}`);

      if (retryClicked.clicked) {
        console.log("   Esperando reconexión (10 seg)...");
        await page.waitForTimeout(10000);
        await screenshot(page, "V4-03-after-retry");

        // Verificar estado después del retry
        const afterRetry = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          return {
            stillHasError: body.includes('Error de conexión') || body.includes('Backend IA'),
            preview: body.substring(0, 200)
          };
        });

        console.log(`   Después de retry: error=${afterRetry.stillHasError}`);
      }
    }

    // ==========================================
    // PASO 6: Buscar e interactuar con el campo de entrada
    // ==========================================
    console.log("\n6. Buscando campo de entrada del chat...");

    // Buscar el input de chat con múltiples estrategias
    const inputInfo = await chatFrame.evaluate(() => {
      // Estrategia 1: textarea
      let input = document.querySelector('textarea');
      if (input) {
        const rect = input.getBoundingClientRect();
        return { type: 'textarea', selector: 'textarea', x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
      }

      // Estrategia 2: contenteditable
      input = document.querySelector('[contenteditable="true"]');
      if (input) {
        const rect = input.getBoundingClientRect();
        return { type: 'contenteditable', x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
      }

      // Estrategia 3: input con placeholder de mensaje
      input = document.querySelector('input[placeholder*="mensaje"], input[placeholder*="message"]');
      if (input) {
        const rect = input.getBoundingClientRect();
        return { type: 'input', x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
      }

      // Estrategia 4: buscar por clases comunes de chat
      const selectors = [
        '[class*="chat-input"]',
        '[class*="message-input"]',
        '[class*="composer"]',
        '[class*="InputArea"]',
        '[class*="ChatInput"]',
        '[data-testid*="input"]',
        '[role="textbox"]'
      ];

      for (const sel of selectors) {
        input = document.querySelector(sel);
        if (input) {
          const rect = input.getBoundingClientRect();
          if (rect.width > 50) {
            return { type: 'selector', selector: sel, x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
          }
        }
      }

      // Estrategia 5: buscar por posición (parte inferior del chat)
      const allInputs = document.querySelectorAll('textarea, input, [contenteditable="true"], [role="textbox"]');
      for (const inp of allInputs) {
        const rect = inp.getBoundingClientRect();
        if (rect.y > 400 && rect.width > 100) {  // En la parte inferior
          return { type: 'position', tagName: inp.tagName, x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
        }
      }

      // Estrategia 6: buscar div con data-placeholder (LobeChat usa esto)
      input = document.querySelector('[data-placeholder]');
      if (input) {
        const rect = input.getBoundingClientRect();
        return { type: 'data-placeholder', x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width };
      }

      return null;
    });

    console.log(`   Input encontrado: ${JSON.stringify(inputInfo)}`);

    if (inputInfo) {
      console.log(`   Haciendo click en input (${inputInfo.type})...`);

      // Para interactuar con el iframe, necesitamos usar el frameLocator
      const iframeSelector = 'iframe[src*="chat-test"]';
      const frameLocator = page.frameLocator(iframeSelector);

      // Intentar diferentes selectores según el tipo
      let inputElement;

      if (inputInfo.type === 'textarea') {
        inputElement = frameLocator.locator('textarea').first();
      } else if (inputInfo.type === 'contenteditable') {
        inputElement = frameLocator.locator('[contenteditable="true"]').first();
      } else if (inputInfo.type === 'data-placeholder') {
        inputElement = frameLocator.locator('[data-placeholder]').first();
      } else if (inputInfo.selector) {
        inputElement = frameLocator.locator(inputInfo.selector).first();
      } else {
        inputElement = frameLocator.locator('[role="textbox"], textarea, [contenteditable="true"]').first();
      }

      try {
        // Click para enfocar
        await inputElement.click({ timeout: 5000 });
        await page.waitForTimeout(500);

        // Escribir mensaje
        const mensaje = 'Hola! Que servicios ofrece Bodas de Hoy para organizar una boda?';

        if (inputInfo.type === 'contenteditable' || inputInfo.type === 'data-placeholder') {
          // Para contenteditable, usar type
          await inputElement.type(mensaje, { delay: 30 });
        } else {
          await inputElement.fill(mensaje);
        }

        console.log(`   ✓ Mensaje escrito: "${mensaje}"`);
        await page.waitForTimeout(1000);
        await screenshot(page, "V4-04-mensaje-escrito");

        // Buscar y hacer click en botón de envío
        const sendBtn = frameLocator.locator('button').last();
        const sendBtnVisible = await sendBtn.isVisible().catch(() => false);

        if (sendBtnVisible) {
          await sendBtn.click();
          console.log("   ✓ Mensaje enviado con botón!");
        } else {
          // Intentar con Enter
          await inputElement.press('Enter');
          console.log("   Mensaje enviado con Enter");
        }

        await page.waitForTimeout(3000);
        await screenshot(page, "V4-05-mensaje-enviado");

      } catch (e) {
        console.log(`   Error interactuando con input: ${e.message}`);

        // Intentar click directo por coordenadas en el iframe
        console.log("   Intentando click directo por coordenadas...");

        // Obtener posición del iframe
        const iframeRect = await page.evaluate(() => {
          const iframe = document.querySelector('iframe[src*="chat-test"]');
          if (iframe) {
            const rect = iframe.getBoundingClientRect();
            return { x: rect.x, y: rect.y };
          }
          return null;
        });

        if (iframeRect && inputInfo) {
          // Click en el input dentro del iframe
          const absoluteX = iframeRect.x + inputInfo.x;
          const absoluteY = iframeRect.y + inputInfo.y;

          await page.mouse.click(absoluteX, absoluteY);
          await page.waitForTimeout(500);
          await page.keyboard.type('Hola! Que servicios ofrece Bodas de Hoy?', { delay: 30 });
          await page.waitForTimeout(1000);
          await screenshot(page, "V4-04b-mensaje-coords");
          await page.keyboard.press('Enter');
          console.log("   Mensaje enviado por coordenadas");
        }
      }
    } else {
      console.log("   ❌ No se encontró campo de entrada");
    }

    // ==========================================
    // PASO 7: Esperar respuesta
    // ==========================================
    console.log("\n7. Esperando respuesta (60 seg)...");

    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i + 1) * 15} segundos...`);
      await screenshot(page, `V4-06-espera-${(i + 1) * 15}s`);

      // Verificar respuesta en el iframe
      const status = await chatFrame.evaluate(() => {
        const body = document.body?.innerText || '';
        const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
        let lastMessage = '';
        messages.forEach(m => {
          if (m.innerText?.length > 20) {
            lastMessage = m.innerText;
          }
        });

        return {
          hasError: body.includes('error occurred') || body.includes('No enabled'),
          hasResponse: lastMessage.length > 50,
          lastMessagePreview: lastMessage.substring(0, 150)
        };
      }).catch(() => ({ error: 'frame error' }));

      console.log(`   Status: error=${status.hasError}, response=${status.hasResponse}`);
      if (status.lastMessagePreview) {
        console.log(`   Preview: ${status.lastMessagePreview.substring(0, 100)}...`);
      }

      if (status.hasError || status.hasResponse) {
        break;
      }
    }

    await screenshot(page, "V4-07-final");

    console.log("\n=== TEST COMPLETADO - NAVEGADOR ABIERTO 2 MIN ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V4-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
