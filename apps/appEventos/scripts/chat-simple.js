const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT SIMPLE ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", { timeout: 60000 });

    console.log("2. Esperando carga (25 seg)...");
    await page.waitForTimeout(25000);
    await screenshot(page, "X1-cargado");

    // Coordenadas del centro del textarea (basado en capturas anteriores)
    // El textarea está en la parte inferior central, aproximadamente y=785
    const textareaX = 730;
    const textareaY = 785;

    console.log(`\n3. Click en textarea (${textareaX}, ${textareaY})...`);
    await page.mouse.click(textareaX, textareaY);
    await page.waitForTimeout(800);

    console.log("\n4. Escribiendo con teclado...");
    await page.keyboard.type('Hola! Me gustaria saber que servicios ofrece Bodas de Hoy para organizar mi boda?', {
      delay: 35
    });

    await page.waitForTimeout(2000);
    await screenshot(page, "X2-texto-escrito");

    // El botón de enviar aparece a la derecha cuando hay texto
    // Basado en capturas, está aproximadamente en x=1020, y=848
    const sendBtnX = 1020;
    const sendBtnY = 848;

    console.log(`\n5. Click en botón enviar (${sendBtnX}, ${sendBtnY})...`);
    await page.mouse.click(sendBtnX, sendBtnY);
    await page.waitForTimeout(500);

    // Si no funcionó, intentar con el dropdown primero
    // El botón tiene un dropdown - hacer click solo en la parte izquierda
    console.log("   Click adicional un poco a la izquierda...");
    await page.mouse.click(sendBtnX - 20, sendBtnY);
    await page.waitForTimeout(1000);

    await screenshot(page, "X3-despues-click");

    // Verificar visualmente si el texto sigue ahí
    // Si sigue, intentar Enter
    console.log("\n6. Presionando Enter como respaldo...");
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await screenshot(page, "X4-despues-enter");

    console.log("\n7. Esperando respuesta (90 seg)...");
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      await screenshot(page, `X5-esperando-${(i+1)*15}s`);
      console.log(`   ${(i+1)*15} segundos...`);
    }

    await screenshot(page, "X6-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error-x");
  }

  await browser.close();
})();
