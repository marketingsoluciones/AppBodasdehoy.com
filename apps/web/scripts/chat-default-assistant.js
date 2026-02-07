const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - DEFAULT ASSISTANT (auto) ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
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
    await screenshot(page, "D1-cargado");

    // Buscar y hacer click en "Default Assistant" que usa modelo "auto"
    console.log("\n3. Buscando Default Assistant con modelo 'auto'...");

    const assistantClicked = await page.evaluate(() => {
      // Buscar en la lista de conversaciones
      const items = document.querySelectorAll('[class*="list"] *, [class*="conversation"] *, [class*="item"] *');

      for (const item of items) {
        const text = item.innerText || '';
        // Buscar "Default Assistant" que tenga "auto"
        if (text.includes('Default Assistant') && text.includes('auto')) {
          const rect = item.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 30) {
            item.click();
            return { clicked: true, text: text.substring(0, 50) };
          }
        }
      }

      // Buscar cualquier elemento con "auto" en la sidebar
      const sidebar = document.querySelector('[class*="sidebar"], [class*="list"]');
      if (sidebar) {
        const autoItems = sidebar.querySelectorAll('*');
        for (const item of autoItems) {
          if (item.innerText?.includes('auto') && item.innerText?.includes('Assistant')) {
            const rect = item.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 20 && rect.x < 400) {
              item.click();
              return { clicked: true, text: item.innerText?.substring(0, 50) };
            }
          }
        }
      }

      return { clicked: false };
    });

    console.log("   Resultado:", assistantClicked);
    await page.waitForTimeout(2000);
    await screenshot(page, "D2-assistant-selected");

    // Si no pudimos hacer click, intentar con coordenadas basadas en la captura
    // Los "Default Assistant" están en la lista izquierda alrededor de y=320-500
    if (!assistantClicked.clicked) {
      console.log("   Intentando click por coordenadas en Default Assistant...");
      // El primer "Default Assistant" con "auto" está aproximadamente en (180, 330)
      await page.mouse.click(180, 330);
      await page.waitForTimeout(2000);
      await screenshot(page, "D2b-click-coords");
    }

    // Verificar qué modelo está seleccionado ahora
    const currentModel = await page.evaluate(() => {
      // El modelo se muestra en el header del chat
      const header = document.querySelector('[class*="header"]');
      if (header) {
        const text = header.innerText;
        if (text.includes('gpt')) return text.match(/gpt[^\s]*/)?.[0] || 'unknown';
        if (text.includes('auto')) return 'auto';
        if (text.includes('claude')) return 'claude';
        if (text.includes('llama')) return 'llama';
      }
      return 'unknown';
    });

    console.log(`\n   Modelo actual: ${currentModel}`);

    // Escribir mensaje
    console.log("\n4. Escribiendo mensaje...");

    // Click en textarea
    const textareaClicked = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        ta.focus();
        ta.click();
        return true;
      }
      return false;
    });

    if (textareaClicked) {
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola! Cuales son los principales servicios que ofrece Bodas de Hoy para organizar una boda?', { delay: 20 });
    } else {
      // Fallback a coordenadas
      await page.mouse.click(700, 785);
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola! Cuales son los principales servicios que ofrece Bodas de Hoy?', { delay: 20 });
    }

    await page.waitForTimeout(1000);
    await screenshot(page, "D3-mensaje-escrito");

    // Enviar mensaje
    console.log("\n5. Enviando mensaje...");
    const sendResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        // Botón de envío: parte inferior, derecha, fondo oscuro
        if (rect.y > 780 && rect.x > 900 && rect.width < 80 &&
            (style.backgroundColor.includes('rgb(34') ||
             style.backgroundColor.includes('rgb(0') ||
             btn.querySelector('svg'))) {
          btn.click();
          return { clicked: true, x: rect.x, y: rect.y };
        }
      }
      return { clicked: false };
    });

    console.log("   Resultado envío:", sendResult);

    if (!sendResult.clicked) {
      // Fallback: Enter
      console.log("   Intentando Enter...");
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "D4-enviado");

    // Esperar respuesta
    console.log("\n6. Esperando respuesta (120 seg)...");

    let responseReceived = false;
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);

      const status = await page.evaluate(() => {
        // Buscar errores
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
        let errorText = null;
        for (const el of errorElements) {
          if (el.innerText?.includes('error') || el.innerText?.includes('Error')) {
            errorText = el.innerText?.substring(0, 100);
            break;
          }
        }

        // Buscar indicador de carga/typing
        const loading = document.querySelector('[class*="loading"], [class*="typing"], [class*="generating"]');

        // Contar mensajes en el área de chat
        const chatArea = document.querySelector('[class*="chat"], [class*="messages"]');
        const messageCount = chatArea ? chatArea.querySelectorAll('[class*="message"]').length : 0;

        // Buscar contenido de respuesta
        const markdown = document.querySelectorAll('[class*="markdown"]');
        let hasContent = false;
        markdown.forEach(m => {
          if (m.innerText?.length > 100) hasContent = true;
        });

        return {
          error: errorText,
          isLoading: !!loading,
          messageCount,
          hasContent
        };
      });

      console.log(`   Estado: ${JSON.stringify(status)}`);
      await screenshot(page, `D5-espera-${(i+1)*15}s`);

      if (status.error) {
        console.log(`\n   ❌ Error: ${status.error}`);
        break;
      }

      if (status.hasContent && !status.isLoading) {
        console.log("\n   ✓ Respuesta recibida!");
        responseReceived = true;
        break;
      }
    }

    await screenshot(page, "D6-final");

    // Capturar respuesta
    const response = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="markdown"], [class*="content"]');
      const texts = [];
      elements.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 50) {
          texts.push(text);
        }
      });
      return texts.slice(-2).join('\n\n---\n\n');
    });

    console.log("\n=== RESPUESTA DEL BOT ===");
    console.log(response.substring(0, 2000) || "(Sin respuesta detectada)");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
