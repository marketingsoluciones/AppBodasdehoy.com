const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/step-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 Screenshot: ${path}`);
  return path;
};

(async () => {
  console.log("=== TEST COPILOT CHAT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // PASO 1: Ir al login
    console.log("PASO 1: Navegando a login...");
    await page.goto("https://app-test.bodasdehoy.com/login", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    // Esperar que cargue
    console.log("   Esperando que cargue...");
    await page.waitForTimeout(15000);
    await screenshot(page, "01-login-page");

    // PASO 2: Buscar formulario de login
    console.log("\nPASO 2: Buscando formulario...");
    const inputs = await page.$$('input');
    console.log(`   Encontrados ${inputs.length} inputs`);

    if (inputs.length >= 2) {
      // PASO 3: Escribir credenciales
      console.log("\nPASO 3: Escribiendo credenciales...");
      await inputs[0].fill('bodasdehoy.com@gmail.com');
      await page.waitForTimeout(500);
      await inputs[1].fill('lorca2012M*+');
      await page.waitForTimeout(500);
      await screenshot(page, "02-credentials");

      // PASO 4: Click en login
      console.log("\nPASO 4: Haciendo login...");
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        await buttons[buttons.length - 1].click();
      }

      // PASO 5: Esperar dashboard
      console.log("\nPASO 5: Esperando dashboard (30 seg)...");
      await page.waitForTimeout(30000);
      await screenshot(page, "03-dashboard");

      // PASO 6: Buscar y abrir Copilot
      console.log("\nPASO 6: Buscando Copilot chat...");

      // Buscar el botón o iframe de Copilot
      const copilotButton = await page.$('[data-copilot]') ||
                           await page.$('.copilot-button') ||
                           await page.$('iframe[src*="copilot"]') ||
                           await page.$('iframe[src*="chat"]');

      if (copilotButton) {
        console.log("   Copilot encontrado!");
        await copilotButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log("   Buscando iframe de chat...");
        const frames = page.frames();
        console.log(`   ${frames.length} frames encontrados`);
      }

      await screenshot(page, "04-copilot");

      // PASO 7: Navegar al chat directamente
      console.log("\nPASO 7: Navegando a chat...");
      await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", {
        timeout: 60000,
        waitUntil: 'domcontentloaded'
      });
      await page.waitForTimeout(10000);
      await screenshot(page, "05-chat-page");

      // PASO 8: Escribir pregunta
      console.log("\nPASO 8: Escribiendo pregunta...");
      const chatInput = await page.$('textarea') || await page.$('input[type="text"]');
      if (chatInput) {
        await chatInput.fill('¿Cuáles son las características principales de Bodas de Hoy?');
        await page.waitForTimeout(1000);
        await screenshot(page, "06-pregunta");

        // Enviar
        console.log("\nPASO 9: Enviando pregunta...");
        await page.keyboard.press('Enter');

        // Esperar respuesta
        console.log("\nPASO 10: Esperando respuesta (30 seg)...");
        await page.waitForTimeout(30000);
        await screenshot(page, "07-respuesta");
      } else {
        console.log("   No se encontró input de chat");
      }

    } else {
      console.log("   ⚠️ No se encontró formulario de login");
      console.log("   La página puede estar en loading o Cloudflare");
    }

    console.log("\n=== NAVEGADOR ABIERTO 5 MINUTOS ===");
    console.log("Puedes interactuar manualmente\n");
    await page.waitForTimeout(300000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
