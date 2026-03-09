const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - PLAYWRIGHT NATIVO ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando a chat...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log("2. Esperando carga completa (20 seg)...");
    await page.waitForTimeout(20000);
    await screenshot(page, "P1-cargado");

    // Usar los métodos nativos de Playwright para interactuar con el textarea
    console.log("\n3. Buscando textarea...");

    // Esperar a que el textarea esté disponible
    const textarea = await page.waitForSelector('textarea', { timeout: 10000 });
    console.log("   ✓ Textarea encontrado");

    // Usar fill() que simula mejor la entrada del usuario en React
    console.log("\n4. Escribiendo mensaje con fill()...");
    await textarea.fill('Hola, ¿qué servicios ofrece Bodas de Hoy para organizar una boda?');

    await page.waitForTimeout(1500);
    await screenshot(page, "P2-mensaje-escrito");

    // Verificar que el mensaje esté escrito
    const value = await textarea.inputValue();
    console.log(`   Valor del textarea: "${value.substring(0, 50)}..."`);

    if (value.length > 0) {
      // El botón de envío debería aparecer ahora
      console.log("\n5. Buscando botón de envío...");

      // Esperar un momento para que el botón aparezca
      await page.waitForTimeout(1000);

      // Intentar múltiples selectores para el botón de envío
      const sendButtonSelectors = [
        'button[type="submit"]',
        'button[aria-label*="send"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="enviar"]',
        'button[aria-label*="Enviar"]',
        '[role="button"][aria-label*="send"]',
        // LobeChat usa un botón con SVG de flecha
        'button:has(svg path[d*="M2"])',  // Común para íconos de envío
      ];

      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        try {
          sendButton = await page.$(selector);
          if (sendButton) {
            console.log(`   ✓ Botón encontrado: ${selector}`);
            break;
          }
        } catch (e) {}
      }

      if (!sendButton) {
        // Buscar el último botón visible que aparece cerca del textarea
        console.log("   Buscando botón por proximidad al textarea...");

        const buttons = await page.$$('button');
        console.log(`   ${buttons.length} botones en total`);

        // Obtener el bounding box del textarea
        const taBox = await textarea.boundingBox();
        console.log(`   Textarea en: x=${taBox.x}, y=${taBox.y}, ancho=${taBox.width}`);

        // Buscar botones cerca del textarea (a la derecha y mismo nivel vertical)
        for (let i = buttons.length - 1; i >= 0; i--) {
          const btn = buttons[i];
          const box = await btn.boundingBox();
          if (box && box.x > taBox.x + taBox.width - 150 &&
              box.y >= taBox.y - 20 && box.y <= taBox.y + taBox.height + 20) {
            sendButton = btn;
            console.log(`   ✓ Botón encontrado por posición [${i}]: x=${box.x}, y=${box.y}`);
            break;
          }
        }
      }

      if (sendButton) {
        console.log("\n6. Haciendo click en botón de envío...");
        await sendButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Fallback: usar teclado
        console.log("\n6. No se encontró botón, usando Enter...");
        await textarea.press('Enter');
        await page.waitForTimeout(1000);

        // Si no funcionó, probar Shift+Enter o Ctrl+Enter
        const currentValue = await textarea.inputValue();
        if (currentValue.length > 0) {
          console.log("   Enter no envió, probando Shift+Enter...");
          await page.keyboard.down('Shift');
          await page.keyboard.press('Enter');
          await page.keyboard.up('Shift');
          await page.waitForTimeout(1000);
        }
      }

      await screenshot(page, "P3-despues-envio");

      // Verificar si el mensaje se envió
      const finalValue = await textarea.inputValue();
      console.log(`\n   Valor final del textarea: "${finalValue || '(vacío)'}"`);

      if (finalValue.length === 0) {
        console.log("   ✓ ¡Mensaje enviado correctamente!");

        console.log("\n7. Esperando respuesta del bot (90 seg)...");

        // Tomar screenshots periódicos mientras esperamos
        for (let i = 0; i < 6; i++) {
          await page.waitForTimeout(15000);
          await screenshot(page, `P4-esperando-${(i+1)*15}s`);

          // Buscar si hay respuesta nueva
          const hasResponse = await page.evaluate(() => {
            const elements = document.querySelectorAll('[class*="markdown"], [class*="content"]');
            return Array.from(elements).some(el => el.innerText && el.innerText.length > 100);
          });

          if (hasResponse) {
            console.log(`   ✓ Respuesta detectada después de ${(i+1)*15} segundos`);
            break;
          }
        }

        await screenshot(page, "P5-respuesta-final");

        // Capturar el contenido de la respuesta
        const responseContent = await page.evaluate(() => {
          const elements = document.querySelectorAll('[class*="markdown"], [class*="content"], [class*="message"]');
          const texts = [];
          elements.forEach(el => {
            const text = el.innerText?.trim();
            if (text && text.length > 100 && !text.includes('Bienvenido')) {
              texts.push(text);
            }
          });
          return texts.slice(-2).join('\n\n---\n\n');
        });

        console.log("\n=== RESPUESTA DEL BOT ===");
        console.log(responseContent.substring(0, 2000) || "(Sin contenido detectado)");

      } else {
        console.log("   ⚠️ El mensaje no se envió, sigue en el textarea");
      }
    }

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    console.error(error);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
