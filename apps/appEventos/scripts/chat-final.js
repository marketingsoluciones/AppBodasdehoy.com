const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT FINAL ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", { timeout: 60000 });

    console.log("2. Esperando carga (20 seg)...");
    await page.waitForTimeout(20000);
    await screenshot(page, "Z1-cargado");

    // Click y escribir
    console.log("\n3. Escribiendo mensaje...");
    await page.mouse.click(700, 785);
    await page.waitForTimeout(500);
    await page.keyboard.type('Hola! Que servicios ofrece Bodas de Hoy?', { delay: 30 });
    await page.waitForTimeout(1500);
    await screenshot(page, "Z2-escrito");

    // MÉTODO 1: Click directo en el botón de envío
    // El botón es el ícono negro con flecha, está aproximadamente en:
    // - x: alrededor de 1015 (centro del botón)
    // - y: alrededor de 847
    console.log("\n4. Intentando click en botón de envío...");
    await page.mouse.click(1015, 847);
    await page.waitForTimeout(1500);
    await screenshot(page, "Z3-click1");

    // Verificar si se envió
    let textareaContent = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      return ta ? ta.value : '';
    });

    if (textareaContent.length > 0) {
      console.log("   Mensaje aún en textarea, probando métodos alternativos...");

      // MÉTODO 2: Usar locator de Playwright para encontrar el botón
      console.log("\n5. Buscando botón con locator...");
      try {
        // Buscar botón que contiene SVG con path de flecha
        const sendButton = page.locator('button').filter({
          has: page.locator('svg')
        }).last();

        if (await sendButton.count() > 0) {
          await sendButton.click();
          console.log("   Click con locator ejecutado");
          await page.waitForTimeout(1500);
        }
      } catch (e) {
        console.log("   Locator falló:", e.message);
      }

      await screenshot(page, "Z4-click2");

      // Verificar de nuevo
      textareaContent = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        return ta ? ta.value : '';
      });

      if (textareaContent.length > 0) {
        // MÉTODO 3: Cmd+Enter (Mac) para enviar
        console.log("\n6. Probando Cmd+Enter...");
        await page.focus('textarea');
        await page.keyboard.down('Meta');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Meta');
        await page.waitForTimeout(1500);
        await screenshot(page, "Z5-cmdenter");

        // Verificar de nuevo
        textareaContent = await page.evaluate(() => {
          const ta = document.querySelector('textarea');
          return ta ? ta.value : '';
        });

        if (textareaContent.length > 0) {
          // MÉTODO 4: Ctrl+Enter
          console.log("\n7. Probando Ctrl+Enter...");
          await page.focus('textarea');
          await page.keyboard.down('Control');
          await page.keyboard.press('Enter');
          await page.keyboard.up('Control');
          await page.waitForTimeout(1500);
          await screenshot(page, "Z6-ctrlenter");
        }
      }
    }

    // Estado final
    textareaContent = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      return ta ? ta.value : '';
    });

    if (textareaContent.length === 0) {
      console.log("\n✓ ¡MENSAJE ENVIADO!");
      console.log("\n8. Esperando respuesta del bot (90 seg)...");

      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(15000);
        await screenshot(page, `Z7-wait-${(i+1)*15}s`);

        // Verificar si hay respuesta
        const hasResponse = await page.evaluate(() => {
          const content = document.body.innerText;
          return content.includes('servicios') && content.length > 500;
        });

        if (hasResponse) {
          console.log(`   Respuesta detectada a los ${(i+1)*15}s`);
          break;
        }
      }

      // Capturar respuesta
      const response = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="markdown"], p');
        return Array.from(elements)
          .map(e => e.innerText)
          .filter(t => t.length > 50)
          .slice(-3)
          .join('\n---\n');
      });

      console.log("\n=== RESPUESTA ===");
      console.log(response.substring(0, 2000));

    } else {
      console.log("\n⚠️ No se pudo enviar el mensaje");
      console.log(`   Contenido actual: "${textareaContent}"`);
    }

    await screenshot(page, "Z8-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error-z");
  }

  await browser.close();
})();
