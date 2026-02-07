const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - CREAR NUEVA SESIÓN ===\n");

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
    await screenshot(page, "NEW1-cargado");

    // Buscar el botón "+" para crear nueva conversación
    console.log("\n3. Buscando botón de nueva conversación...");

    // El botón + está en el header de la sidebar, cerca de "Copilot" y "BodasdeHoy"
    // Aproximadamente en coordenadas (345, 25) basado en las capturas
    const newButtonResult = await page.evaluate(() => {
      // Buscar todos los botones con iconos
      const buttons = document.querySelectorAll('button, [role="button"]');

      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        // Buscar botón pequeño en la parte superior izquierda
        if (rect.x > 300 && rect.x < 380 && rect.y < 80 && rect.width < 50) {
          // Verificar si tiene un ícono de "+"
          const svg = btn.querySelector('svg');
          const hasPlus = btn.innerText?.includes('+') ||
                         (svg && (svg.innerHTML.includes('plus') || svg.innerHTML.includes('add')));

          if (svg || hasPlus) {
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              width: rect.width,
              height: rect.height
            };
          }
        }
      }

      // Buscar por el texto "new" en la sidebar
      const newTexts = document.querySelectorAll('*');
      for (const el of newTexts) {
        if (el.innerText === 'new' || el.innerText === 'New') {
          const rect = el.getBoundingClientRect();
          if (rect.x < 400) {
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              method: 'text-new'
            };
          }
        }
      }

      return { found: false };
    });

    console.log("   Botón encontrado:", newButtonResult);

    if (newButtonResult.found) {
      await page.mouse.click(newButtonResult.x, newButtonResult.y);
      await page.waitForTimeout(2000);
    } else {
      // Click en coordenadas conocidas del botón +
      console.log("   Intentando click en coordenadas (345, 30)...");
      await page.mouse.click(345, 30);
      await page.waitForTimeout(2000);
    }

    await screenshot(page, "NEW2-after-click-new");

    // Verificar si se abrió un menú o modal
    const menuOpened = await page.evaluate(() => {
      const menus = document.querySelectorAll('[class*="menu"], [class*="modal"], [class*="dropdown"], [class*="popover"]');
      for (const menu of menus) {
        if (menu.getBoundingClientRect().width > 100) {
          return {
            opened: true,
            text: menu.innerText?.substring(0, 200)
          };
        }
      }
      return { opened: false };
    });

    console.log("   Menu abierto:", menuOpened);

    if (menuOpened.opened) {
      // Buscar opción de "New Chat" o "Create Agent"
      const optionResult = await page.evaluate(() => {
        const options = document.querySelectorAll('[class*="menu"] *, [class*="item"], [role="menuitem"]');

        for (const opt of options) {
          const text = opt.innerText?.toLowerCase() || '';
          if (text.includes('new') || text.includes('chat') || text.includes('create')) {
            const rect = opt.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 20) {
              return {
                found: true,
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                text: opt.innerText?.substring(0, 30)
              };
            }
          }
        }
        return { found: false };
      });

      console.log("   Opción encontrada:", optionResult);

      if (optionResult.found) {
        await page.mouse.click(optionResult.x, optionResult.y);
        await page.waitForTimeout(2000);
      }
    }

    await screenshot(page, "NEW3-new-chat-created");

    // Verificar el modelo actual de la nueva sesión
    const headerInfo = await page.evaluate(() => {
      const body = document.body.innerText;
      const hasAuto = body.includes('auto');
      const hasGpt5 = body.includes('gpt-5');

      // Buscar el modelo en el header del chat
      const header = document.querySelector('[class*="header"]');
      const headerText = header?.innerText?.substring(0, 100) || '';

      return {
        hasAuto,
        hasGpt5,
        headerText
      };
    });

    console.log(`\n   Info del header: ${JSON.stringify(headerInfo)}`);

    // Escribir mensaje
    console.log("\n4. Escribiendo mensaje...");
    const textareaFocused = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        ta.focus();
        return true;
      }
      return false;
    });

    if (textareaFocused) {
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola! Cuales son los servicios principales de Bodas de Hoy para organizar una boda perfecta?', { delay: 15 });
    }

    await page.waitForTimeout(1000);
    await screenshot(page, "NEW4-mensaje-escrito");

    // Enviar mensaje
    console.log("\n5. Enviando mensaje...");
    const sentResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        // Botón de envío en la parte inferior derecha
        if (rect.y > 780 && rect.x > 900 && rect.width < 80) {
          btn.click();
          return { sent: true };
        }
      }
      return { sent: false };
    });

    console.log(`   Enviado: ${sentResult.sent}`);
    await page.waitForTimeout(3000);
    await screenshot(page, "NEW5-enviado");

    // Esperar respuesta
    console.log("\n6. Esperando respuesta (120 seg)...");

    let gotResponse = false;
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);

      const status = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasError = text.includes('error occurred') ||
                        text.includes('No enabled providers') ||
                        text.includes('communication error');
        const hasLoading = !!document.querySelector('[class*="loading"], [class*="typing"], [class*="generating"]');

        // Buscar contenido de respuesta
        const markdown = document.querySelectorAll('[class*="markdown"]');
        let responseText = '';
        let maxLen = 0;
        markdown.forEach(m => {
          if (m.innerText?.length > maxLen) {
            maxLen = m.innerText.length;
            responseText = m.innerText;
          }
        });

        return {
          hasError,
          hasLoading,
          hasResponse: responseText.length > 100,
          responsePreview: responseText.substring(0, 300)
        };
      });

      console.log(`   hasError=${status.hasError}, hasLoading=${status.hasLoading}, hasResponse=${status.hasResponse}`);
      await screenshot(page, `NEW6-wait-${(i+1)*15}s`);

      if (status.hasError) {
        console.log("\n   ❌ Error detectado!");

        // Intentar obtener más detalles
        const errorDetail = await page.evaluate(() => {
          // Click en "Show Details" si existe
          const detailsBtn = Array.from(document.querySelectorAll('*')).find(
            el => el.innerText?.includes('Show Details')
          );
          if (detailsBtn) {
            detailsBtn.click();
          }
          return document.body.innerText.match(/error[^.]*\./gi)?.slice(0, 3).join(' ') || 'No details';
        });
        console.log(`   Detalles: ${errorDetail}`);
        break;
      }

      if (status.hasResponse && !status.hasLoading) {
        console.log("\n   ✓ ¡Respuesta recibida!");
        console.log(`   Preview: ${status.responsePreview}`);
        gotResponse = true;
        break;
      }
    }

    await screenshot(page, "NEW7-final");

    // Capturar respuesta completa
    if (gotResponse) {
      const fullResponse = await page.evaluate(() => {
        const markdown = document.querySelectorAll('[class*="markdown"]');
        let longest = '';
        markdown.forEach(m => {
          if (m.innerText?.length > longest.length) {
            longest = m.innerText;
          }
        });
        return longest;
      });

      console.log("\n=== RESPUESTA COMPLETA ===");
      console.log(fullResponse.substring(0, 2000));
    }

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
