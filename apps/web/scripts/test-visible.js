const { chromium } = require("playwright");

(async () => {
  console.log("=== ABRIENDO NAVEGADOR EN PRIMER PLANO ===");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: null, // Usar tamaño máximo de ventana
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  try {
    console.log("1. Navegando a app-test.bodasdehoy.com/login...");
    await page.goto("https://app-test.bodasdehoy.com/login", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log("2. Esperando que cargue el formulario...");
    await page.waitForTimeout(3000);

    // Esperar a que aparezcan inputs
    try {
      await page.waitForSelector('input', { timeout: 10000 });
    } catch (e) {
      console.log("   No se encontraron inputs, esperando más...");
      await page.waitForTimeout(5000);
    }

    const inputs = await page.$$('input');
    console.log(`   Encontrados ${inputs.length} inputs`);

    if (inputs.length >= 2) {
      console.log("3. Escribiendo credenciales...");

      // Email
      await inputs[0].click();
      await page.keyboard.type('bodasdehoy.com@gmail.com', { delay: 30 });
      await page.waitForTimeout(500);

      // Password
      await inputs[1].click();
      await page.keyboard.type('lorca2012M*+', { delay: 30 });
      await page.waitForTimeout(500);

      console.log("4. Buscando botón de login...");
      const buttons = await page.$$('button');

      if (buttons.length > 0) {
        console.log("5. Haciendo click en login...");
        await buttons[buttons.length - 1].click();

        console.log("6. Esperando respuesta (30 seg)...");
        await page.waitForTimeout(30000);
      }
    } else {
      console.log("⚠️ No hay formulario de login visible");
      console.log("   Puedes interactuar manualmente con el navegador");
    }

    console.log("\n=== NAVEGADOR ABIERTO - INTERACTÚA MANUALMENTE ===");
    console.log("El navegador permanecerá abierto 10 minutos");
    console.log("Escribe comandos aquí y los ejecutaré en el navegador\n");

    // Mantener abierto 10 minutos
    await page.waitForTimeout(600000);

  } catch (error) {
    console.log("Error:", error.message);
    console.log("Navegador abierto para debug manual...");
    await page.waitForTimeout(300000);
  }

  await browser.close();
})();
