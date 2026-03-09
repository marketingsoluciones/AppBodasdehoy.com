const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = '/Users/juancarlosparra/Projects/AppBodasdehoy.com/.screenshots';

  console.log("1. Abriendo chat...");
  await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
  await page.waitForTimeout(5000);

  // Screenshot inicial
  await page.screenshot({ path: `${screenshotDir}/chat-1-loaded.png`, fullPage: true });
  console.log("   Screenshot: chat-1-loaded.png");

  console.log("2. Buscando campo de entrada...");

  // Buscar el campo de texto para escribir
  const inputSelectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
    '[data-testid="chat-input"]',
    '.chat-input',
    '#chat-input',
    '[placeholder*="message"]',
    '[placeholder*="Message"]',
    '[placeholder*="escrib"]'
  ];

  let inputFound = null;
  for (const selector of inputSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          inputFound = selector;
          console.log(`   Campo encontrado: ${selector}`);
          break;
        }
      }
    } catch (e) {}
  }

  if (inputFound) {
    console.log("3. Escribiendo mensaje...");
    await page.fill(inputFound, "Hola, necesito ayuda para organizar mi boda");
    await page.waitForTimeout(1000);

    // Screenshot con mensaje escrito
    await page.screenshot({ path: `${screenshotDir}/chat-2-message-typed.png`, fullPage: true });
    console.log("   Screenshot: chat-2-message-typed.png");

    console.log("4. Enviando mensaje...");
    await page.keyboard.press('Enter');

    console.log("5. Esperando respuesta (15 segundos)...");
    await page.waitForTimeout(15000);

    // Screenshot con respuesta
    await page.screenshot({ path: `${screenshotDir}/chat-3-response.png`, fullPage: true });
    console.log("   Screenshot: chat-3-response.png");
  } else {
    console.log("   No se encontró campo de entrada directo, tomando screenshot...");
    // Mostrar la URL actual
    console.log("   URL:", page.url());
  }

  console.log("\n6. Proceso completado");
  await browser.close();
})();
