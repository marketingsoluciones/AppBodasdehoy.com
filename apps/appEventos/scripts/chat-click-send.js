const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - CLICK PRECISO EN ENVIAR ===\n");

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
    await screenshot(page, "S1-inicio");

    // Usar JavaScript para escribir en el textarea
    console.log("\n3. Escribiendo mensaje vía JS...");

    const wrote = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.value = 'Hola, ¿qué servicios ofrece Bodas de Hoy para organizar una boda?';
        // Disparar eventos para que React detecte el cambio
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });

    if (wrote) {
      console.log("   ✓ Mensaje escrito en textarea");
    } else {
      console.log("   ❌ No se encontró textarea, usando teclado...");
      await page.mouse.click(700, 785);
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola, ¿qué servicios ofrece Bodas de Hoy?', { delay: 20 });
    }

    await page.waitForTimeout(1000);
    await screenshot(page, "S2-escrito");

    // Buscar el botón de envío usando múltiples estrategias
    console.log("\n4. Buscando botón de envío...");

    // Estrategia 1: Buscar botón con aria-label o title relacionado con send
    let clicked = await page.evaluate(() => {
      // Buscar botones con íconos de envío
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        if (svg) {
          // El botón de envío suele tener un path con flecha
          const paths = svg.querySelectorAll('path');
          for (const path of paths) {
            const d = path.getAttribute('d');
            // Detectar íconos de flecha/envío comunes
            if (d && (d.includes('arrow') || d.includes('send') ||
                d.includes('M22') || d.includes('l-1.5') ||
                d.includes('2 2') || d.includes('12 19'))) {
              btn.click();
              return 'Clicked button with arrow SVG';
            }
          }
        }
      }
      return null;
    });

    if (clicked) {
      console.log(`   ✓ ${clicked}`);
    } else {
      // Estrategia 2: El último botón en el área del input suele ser el de envío
      console.log("   Intentando último botón en área de input...");

      clicked = await page.evaluate(() => {
        // Buscar el contenedor del input de chat
        const textarea = document.querySelector('textarea');
        if (textarea) {
          // Buscar el padre que contiene el textarea y botones
          let container = textarea.parentElement;
          for (let i = 0; i < 5; i++) {
            if (!container) break;
            const buttons = container.querySelectorAll('button');
            if (buttons.length > 0) {
              // El botón de envío suele ser el último o el que tiene color de fondo
              const lastBtn = buttons[buttons.length - 1];
              const style = window.getComputedStyle(lastBtn);
              if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                  style.backgroundColor !== 'transparent') {
                lastBtn.click();
                return `Clicked button with background: ${style.backgroundColor}`;
              }
            }
            container = container.parentElement;
          }
        }
        return null;
      });

      if (clicked) {
        console.log(`   ✓ ${clicked}`);
      } else {
        // Estrategia 3: Click directo en coordenadas ajustadas
        console.log("   Usando coordenadas específicas para el botón negro...");

        // El botón está aproximadamente en (1020, 848) basado en las capturas
        await page.mouse.click(1018, 848);
        console.log("   Click en (1018, 848)");
        await page.waitForTimeout(500);

        // Si no funcionó, intentar con Enter
        await page.keyboard.press('Enter');
        console.log("   También presionado Enter");
      }
    }

    await page.waitForTimeout(2000);
    await screenshot(page, "S3-enviado");

    // Esperar respuesta
    console.log("\n5. Esperando respuesta del bot (90 seg)...");

    // Monitorear cambios en el DOM
    let responseReceived = false;
    for (let i = 0; i < 18; i++) {
      await page.waitForTimeout(5000);

      const hasResponse = await page.evaluate(() => {
        // Buscar mensajes nuevos del asistente
        const messages = document.querySelectorAll('[class*="message"]');
        // Si hay más de un mensaje (el de bienvenida), hay respuesta
        return messages.length > 1;
      });

      if (hasResponse && !responseReceived) {
        console.log(`   ✓ Respuesta detectada después de ${(i+1)*5} segundos`);
        responseReceived = true;
        await screenshot(page, "S4-respuesta");
      }

      // Screenshot de progreso cada 30 segundos
      if ((i + 1) % 6 === 0) {
        await screenshot(page, `S4-progreso-${(i+1)*5}s`);
      }
    }

    await screenshot(page, "S5-final");

    // Capturar contenido de respuesta
    const content = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="markdown"], [class*="content"], p');
      const texts = [];
      elements.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 50) {
          texts.push(text);
        }
      });
      return texts.slice(-3).join('\n\n---\n\n');
    });

    console.log("\n=== CONTENIDO DE RESPUESTA ===");
    console.log(content.substring(0, 2000) || "(No se detectó contenido de respuesta)");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error-final");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
