const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT CON ENVIO MEJORADO ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando a chat-test.bodasdehoy.com...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    console.log("2. Esperando carga completa (20 seg)...");
    await page.waitForTimeout(20000);
    await screenshot(page, "01-cargado");

    // Buscar el textarea del chat
    console.log("\n3. Buscando textarea del chat...");

    // El textarea está en la parte inferior
    const textarea = await page.$('textarea');

    if (textarea) {
      console.log("   ✓ Textarea encontrado!");

      // Focus y escribir
      await textarea.click();
      await page.waitForTimeout(500);

      console.log("\n4. Escribiendo pregunta...");
      await textarea.fill('Hola, ¿qué servicios ofrece Bodas de Hoy para organizar una boda?');
      await page.waitForTimeout(1000);
      await screenshot(page, "02-pregunta-escrita");

      // Buscar el botón de envío
      console.log("\n5. Buscando botón de envío...");

      // El botón de envío suele ser el que tiene un ícono de flecha o submit
      // Buscar botones cerca del textarea
      const sendButtons = await page.$$('button');
      console.log(`   Encontrados ${sendButtons.length} botones`);

      // Intentar encontrar el botón correcto (último botón cerca del input)
      // O buscar por atributos comunes
      let sentMessage = false;

      // Método 1: Buscar botón con atributo específico
      const submitBtn = await page.$('button[type="submit"]') ||
                        await page.$('button[aria-label*="send"]') ||
                        await page.$('button[aria-label*="Send"]') ||
                        await page.$('button[title*="send"]') ||
                        await page.$('button[title*="Send"]');

      if (submitBtn) {
        console.log("   ✓ Botón submit encontrado!");
        await submitBtn.click();
        sentMessage = true;
      } else {
        // Método 2: El botón de envío está a la derecha del input
        // En LobeChat, suele ser el botón más a la derecha en el área del input
        console.log("   Buscando botón por posición...");

        // Buscar botón con SVG (ícono)
        const btnWithSvg = await page.$('button svg');
        if (btnWithSvg) {
          const parentBtn = await btnWithSvg.$('xpath=..');
          if (parentBtn) {
            await parentBtn.click();
            sentMessage = true;
            console.log("   ✓ Click en botón con SVG");
          }
        }
      }

      if (!sentMessage) {
        // Método 3: Usar coordenadas - el botón está aproximadamente en (1030, 847)
        // basado en el screenshot, está a la derecha del input
        console.log("   Intentando click por coordenadas...");
        await page.mouse.click(1030, 847);
        console.log("   Click ejecutado en (1030, 847)");
      }

      await page.waitForTimeout(2000);
      await screenshot(page, "03-mensaje-enviado");

      console.log("\n6. Esperando respuesta del bot (60 seg)...");
      await page.waitForTimeout(60000);
      await screenshot(page, "04-respuesta");

      // Capturar contenido de la respuesta
      const pageContent = await page.evaluate(() => {
        // Buscar mensajes en el área de chat
        const messages = document.querySelectorAll('[class*="message"], [class*="content"], [class*="markdown"], p');
        const texts = [];
        messages.forEach(m => {
          const text = m.innerText?.trim();
          if (text && text.length > 20) {
            texts.push(text.substring(0, 500));
          }
        });
        return texts.slice(-5).join('\n\n---\n\n');
      });

      console.log("\n=== CONTENIDO CAPTURADO ===");
      console.log(pageContent.substring(0, 2000));

    } else {
      console.log("   ❌ No se encontró textarea");

      // Intentar método alternativo con coordenadas
      console.log("   Intentando método con coordenadas...");
      await page.mouse.click(700, 785);
      await page.waitForTimeout(500);
      await page.keyboard.type('Hola, ¿qué servicios tiene Bodas de Hoy?', { delay: 30 });
      await page.waitForTimeout(1000);
      await page.mouse.click(1030, 847); // Botón enviar
      await page.waitForTimeout(60000);
      await screenshot(page, "04-alternativo");
    }

    console.log("\n=== NAVEGADOR ABIERTO 3 MINUTOS ===");
    console.log("Puedes interactuar manualmente\n");
    await page.waitForTimeout(180000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
