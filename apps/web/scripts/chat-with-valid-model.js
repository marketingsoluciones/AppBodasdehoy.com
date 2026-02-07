const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - CON MODELO VÁLIDO ===\n");

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

    console.log("2. Esperando carga (20 seg)...");
    await page.waitForTimeout(20000);
    await screenshot(page, "V1-cargado");

    // Primero, intentar cambiar el modelo haciendo click en el selector de modelo
    console.log("\n3. Buscando selector de modelo...");

    // El modelo actual se muestra en la barra superior (gpt-5-mini)
    // Buscar el botón/selector de modelo
    const modelSelector = await page.evaluate(() => {
      // Buscar elementos que contengan "gpt-5-mini" o "model"
      const elements = document.querySelectorAll('button, [class*="model"], [class*="selector"]');
      for (const el of elements) {
        if (el.innerText?.includes('gpt') || el.innerText?.includes('model')) {
          const rect = el.getBoundingClientRect();
          return {
            text: el.innerText?.substring(0, 30),
            x: rect.x + rect.width/2,
            y: rect.y + rect.height/2,
            found: true
          };
        }
      }

      // Buscar en el header del chat
      const header = document.querySelector('[class*="header"], [class*="top"]');
      if (header) {
        const buttons = header.querySelectorAll('button, span, div');
        for (const btn of buttons) {
          if (btn.innerText?.includes('gpt') || btn.innerText?.includes('mini')) {
            const rect = btn.getBoundingClientRect();
            return {
              text: btn.innerText?.substring(0, 30),
              x: rect.x + rect.width/2,
              y: rect.y + rect.height/2,
              found: true
            };
          }
        }
      }

      return { found: false };
    });

    console.log("   Selector de modelo:", modelSelector);

    if (modelSelector.found) {
      console.log("   Haciendo click en selector de modelo...");
      await page.mouse.click(modelSelector.x, modelSelector.y);
      await page.waitForTimeout(1500);
      await screenshot(page, "V2-modelo-menu");

      // Buscar opción de modelo alternativo (Groq, Claude, Llama, etc)
      const modelOption = await page.evaluate(() => {
        // Buscar en dropdowns/menus abiertos
        const options = document.querySelectorAll('[class*="menu"] *, [class*="dropdown"] *, [class*="popover"] *, [class*="option"]');
        const validModels = ['groq', 'llama', 'claude', 'anthropic', 'auto'];

        for (const opt of options) {
          const text = opt.innerText?.toLowerCase() || '';
          for (const model of validModels) {
            if (text.includes(model)) {
              const rect = opt.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                return {
                  text: opt.innerText?.substring(0, 30),
                  x: rect.x + rect.width/2,
                  y: rect.y + rect.height/2,
                  found: true
                };
              }
            }
          }
        }

        // También buscar "auto" que usa el modelo por defecto del backend
        for (const opt of options) {
          const text = opt.innerText?.toLowerCase() || '';
          if (text.includes('auto') || text.includes('default')) {
            const rect = opt.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return {
                text: opt.innerText?.substring(0, 30),
                x: rect.x + rect.width/2,
                y: rect.y + rect.height/2,
                found: true
              };
            }
          }
        }

        return { found: false };
      });

      console.log("   Opción de modelo encontrada:", modelOption);

      if (modelOption.found) {
        console.log(`   Seleccionando modelo: ${modelOption.text}`);
        await page.mouse.click(modelOption.x, modelOption.y);
        await page.waitForTimeout(1000);
      } else {
        // Cerrar el menú haciendo click fuera
        console.log("   No se encontró modelo válido, cerrando menú...");
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    await screenshot(page, "V3-modelo-seleccionado");

    // Escribir mensaje
    console.log("\n4. Escribiendo mensaje...");
    await page.mouse.click(700, 785);
    await page.waitForTimeout(500);
    await page.keyboard.type('Hola! Que servicios ofrece Bodas de Hoy para organizar bodas?', { delay: 25 });
    await page.waitForTimeout(1000);
    await screenshot(page, "V4-mensaje-escrito");

    // Enviar usando JavaScript click
    console.log("\n5. Enviando mensaje...");
    const sendResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        // Botón de envío: en la parte inferior, a la derecha, fondo oscuro
        if (rect.y > 800 && rect.x > 950 && rect.width < 60 &&
            (style.backgroundColor.includes('rgb(34') ||
             style.backgroundColor.includes('rgb(0') ||
             style.backgroundColor.includes('#222'))) {
          btn.click();
          return { clicked: true, bg: style.backgroundColor };
        }
      }

      // Fallback: buscar cualquier botón con SVG cerca del textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const taRect = textarea.getBoundingClientRect();
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          if (rect.x > taRect.right - 80 && rect.y > taRect.y - 30) {
            btn.click();
            return { clicked: true, method: 'fallback' };
          }
        }
      }

      return { clicked: false };
    });

    console.log("   Resultado:", sendResult);
    await page.waitForTimeout(2000);
    await screenshot(page, "V5-enviado");

    // Esperar respuesta
    console.log("\n6. Esperando respuesta (90 seg)...");

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);
      await screenshot(page, `V6-espera-${(i+1)*15}s`);

      // Verificar si hay error o respuesta
      const status = await page.evaluate(() => {
        const errorMsg = document.querySelector('[class*="error"]');
        const messages = document.querySelectorAll('[class*="message"]');
        const loading = document.querySelector('[class*="loading"], [class*="typing"]');

        return {
          hasError: errorMsg ? errorMsg.innerText?.substring(0, 100) : null,
          messageCount: messages.length,
          isLoading: !!loading
        };
      });

      console.log(`   Estado: ${JSON.stringify(status)}`);

      if (status.hasError) {
        console.log(`\n   ❌ Error detectado: ${status.hasError}`);
        break;
      }

      if (status.messageCount > 1 && !status.isLoading) {
        console.log("\n   ✓ Respuesta recibida!");
        break;
      }
    }

    await screenshot(page, "V7-final");

    // Capturar respuesta
    const response = await page.evaluate(() => {
      const markdown = document.querySelectorAll('[class*="markdown"], [class*="content"], p');
      const texts = [];
      markdown.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 50 && !text.includes('Escribe tu mensaje')) {
          texts.push(text);
        }
      });
      return texts.slice(-2).join('\n\n---\n\n');
    });

    console.log("\n=== RESPUESTA DEL BOT ===");
    console.log(response.substring(0, 1500) || "(Sin respuesta detectada)");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
