const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT DIRECTO ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
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

    console.log("2. Esperando carga (15 seg)...");
    await page.waitForTimeout(15000);
    await screenshot(page, "01-inicial");

    // Click directo en el input de chat usando coordenadas
    // El input está en la parte inferior central de la pantalla
    console.log("\n3. Haciendo click en input de chat (coordenadas)...");

    // Coordenadas aproximadas: centro horizontal (700), cerca del fondo (785)
    await page.mouse.click(700, 785);
    await page.waitForTimeout(1000);

    // Escribir pregunta
    console.log("\n4. Escribiendo pregunta...");
    await page.keyboard.type('Hola, ¿qué servicios ofrece Bodas de Hoy para organizar una boda?', { delay: 30 });
    await page.waitForTimeout(1500);
    await screenshot(page, "02-pregunta");

    // Enviar con Ctrl+Enter o botón
    console.log("\n5. Enviando mensaje...");

    // Buscar y hacer click en el botón de enviar
    const sendButton = await page.$('button[type="submit"]') ||
                       await page.$('button:has(svg)');

    if (sendButton) {
      await sendButton.click();
    } else {
      // Intentar con Enter
      await page.keyboard.press('Enter');
    }

    // Esperar respuesta
    console.log("\n6. Esperando respuesta (90 seg)...");
    await page.waitForTimeout(90000);
    await screenshot(page, "03-respuesta");

    // Mostrar contenido
    const pageText = await page.evaluate(() => {
      const messages = document.querySelectorAll('[class*="message"], [class*="content"], p');
      return Array.from(messages).map(m => m.innerText).slice(-5).join('\n---\n');
    });
    console.log("\n--- CONTENIDO RECIENTE ---");
    console.log(pageText.substring(0, 1500));

    console.log("\n=== NAVEGADOR ABIERTO 3 MINUTOS ===");
    await page.waitForTimeout(180000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
