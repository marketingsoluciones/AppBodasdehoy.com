const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - NUEVA CONVERSACIÓN ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando a chat...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    console.log("2. Esperando carga (15 seg)...");
    await page.waitForTimeout(15000);
    await screenshot(page, "N1-cargado");

    // Buscar y hacer doble click en Default Assistant para abrir esa conversación
    console.log("\n3. Haciendo doble click en Default Assistant...");

    const assistantResult = await page.evaluate(() => {
      // Buscar elementos que contengan "Default Assistant" y "auto"
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.innerText || '';
        // Buscar el container del item de la lista que contiene "Default Assistant" y "auto"
        if (text.includes('Default Assistant') &&
            text.includes('auto') &&
            !text.includes('Just Chat') &&
            el.getBoundingClientRect().width > 150 &&
            el.getBoundingClientRect().width < 350) {
          const rect = el.getBoundingClientRect();
          return {
            found: true,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            text: text.substring(0, 50)
          };
        }
      }
      return { found: false };
    });

    console.log("   Elemento encontrado:", assistantResult);

    if (assistantResult.found) {
      // Doble click para abrir la conversación
      await page.mouse.dblclick(assistantResult.x, assistantResult.y);
      await page.waitForTimeout(2000);
      await screenshot(page, "N2-after-dblclick");
    }

    // Verificar si cambió el chat activo
    const chatHeader = await page.evaluate(() => {
      // Buscar el título del chat actual en el header
      const header = document.querySelector('[class*="header"]');
      return header ? header.innerText?.substring(0, 100) : 'unknown';
    });

    console.log(`   Chat activo: ${chatHeader}`);

    // Si sigue en "Just Chat", intentar crear nueva conversación
    if (chatHeader.includes('Just Chat') || chatHeader.includes('gpt-5')) {
      console.log("\n   Intentando crear nueva conversación...");

      // Buscar botón de nueva conversación (+)
      const newChatResult = await page.evaluate(() => {
        // Buscar botón con + o "new"
        const buttons = document.querySelectorAll('button, [class*="button"], [class*="new"]');
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          // El botón de nueva conversación suele estar en la parte superior izquierda
          if (rect.x < 400 && rect.y < 150 && rect.width < 50) {
            const text = btn.innerText || '';
            const hasPlusIcon = btn.querySelector('svg') || text.includes('+');
            if (hasPlusIcon) {
              return {
                found: true,
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2
              };
            }
          }
        }

        // También buscar el texto "new" que aparece en la sidebar
        const newItems = document.querySelectorAll('[class*="new"], [class*="create"]');
        for (const item of newItems) {
          if (item.innerText?.toLowerCase().includes('new')) {
            const rect = item.getBoundingClientRect();
            if (rect.x < 400) {
              return {
                found: true,
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                method: 'new-text'
              };
            }
          }
        }

        return { found: false };
      });

      console.log("   Botón nueva conversación:", newChatResult);

      if (newChatResult.found) {
        await page.mouse.click(newChatResult.x, newChatResult.y);
        await page.waitForTimeout(2000);
        await screenshot(page, "N3-new-chat");
      }
    }

    await screenshot(page, "N4-before-message");

    // Verificar el modelo actual
    const currentModel = await page.evaluate(() => {
      const text = document.body.innerText;
      if (text.includes('gpt-5-mini')) return 'gpt-5-mini';
      if (text.includes('auto')) return 'auto';
      if (text.includes('claude')) return 'claude';
      if (text.includes('llama')) return 'llama';
      return 'unknown';
    });

    console.log(`\n   Modelo detectado: ${currentModel}`);

    // Escribir mensaje
    console.log("\n4. Escribiendo mensaje...");
    const textareaFound = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        ta.focus();
        return true;
      }
      return false;
    });

    if (textareaFound) {
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola! Necesito informacion sobre los servicios de Bodas de Hoy para organizar mi boda.', { delay: 20 });
    }

    await page.waitForTimeout(1000);
    await screenshot(page, "N5-mensaje-escrito");

    // Enviar
    console.log("\n5. Enviando mensaje...");
    const sendClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        if (rect.y > 780 && rect.x > 900 && rect.width < 80) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    console.log(`   Enviado: ${sendClicked}`);
    await page.waitForTimeout(3000);
    await screenshot(page, "N6-enviado");

    // Esperar respuesta
    console.log("\n6. Esperando respuesta (90 seg)...");

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);

      const status = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const hasError = bodyText.includes('error occurred') || bodyText.includes('No enabled providers');
        const hasLoading = !!document.querySelector('[class*="loading"], [class*="typing"]');

        // Buscar contenido de respuesta del bot
        const markdown = document.querySelectorAll('[class*="markdown"]');
        let responseText = '';
        markdown.forEach(m => {
          if (m.innerText?.length > 100) {
            responseText = m.innerText.substring(0, 200);
          }
        });

        return {
          hasError,
          hasLoading,
          hasResponse: responseText.length > 50,
          response: responseText
        };
      });

      console.log(`   Estado: error=${status.hasError}, loading=${status.hasLoading}, response=${status.hasResponse}`);
      await screenshot(page, `N7-wait-${(i+1)*15}s`);

      if (status.hasError) {
        console.log("\n   ❌ Error detectado");

        // Obtener detalles del error
        const errorDetails = await page.evaluate(() => {
          // Hacer click en "Show Details" si existe
          const showDetails = document.querySelector('[class*="detail"]');
          if (showDetails) showDetails.click();

          // Buscar mensajes de error
          const errors = document.querySelectorAll('[class*="error"], [class*="alert"]');
          const errorTexts = [];
          errors.forEach(e => {
            if (e.innerText?.length > 10) {
              errorTexts.push(e.innerText);
            }
          });
          return errorTexts.join('\n');
        });

        console.log("   Detalles:", errorDetails.substring(0, 500));
        break;
      }

      if (status.hasResponse && !status.hasLoading) {
        console.log("\n   ✓ Respuesta recibida!");
        console.log(`   Preview: ${status.response}`);
        break;
      }
    }

    await screenshot(page, "N8-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
