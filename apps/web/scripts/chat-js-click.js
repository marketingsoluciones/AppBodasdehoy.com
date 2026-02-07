const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - JS CLICK ===\n");

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
    await screenshot(page, "J1-cargado");

    // Escribir mensaje
    console.log("\n3. Escribiendo mensaje...");
    await page.mouse.click(700, 785);
    await page.waitForTimeout(500);
    await page.keyboard.type('Hola! Que servicios ofrece Bodas de Hoy?', { delay: 25 });
    await page.waitForTimeout(1500);
    await screenshot(page, "J2-escrito");

    // Usar JavaScript para encontrar y hacer click en el botón
    console.log("\n4. Buscando botón con JavaScript...");

    const buttonClicked = await page.evaluate(() => {
      // Buscar todos los botones
      const buttons = document.querySelectorAll('button');
      const results = [];

      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);

        // Buscar botón en área inferior derecha con fondo oscuro
        if (rect.y > 800 && rect.x > 950 &&
            (style.backgroundColor.includes('rgb(0') ||
             style.backgroundColor.includes('rgba(0') ||
             btn.className.includes('primary'))) {

          results.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            bg: style.backgroundColor,
            class: btn.className.substring(0, 50)
          });

          // Hacer click
          btn.click();
          return { clicked: true, info: results[0] };
        }
      }

      // Si no encontró por color, buscar el último botón en el área del input
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const taRect = textarea.getBoundingClientRect();

        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          // Botón a la derecha del textarea, misma altura
          if (rect.x > taRect.right - 100 &&
              rect.y >= taRect.top - 30 &&
              rect.y <= taRect.bottom + 30) {
            btn.click();
            return { clicked: true, method: 'position', x: rect.x, y: rect.y };
          }
        }
      }

      return { clicked: false, buttons: results };
    });

    console.log("   Resultado:", JSON.stringify(buttonClicked));
    await page.waitForTimeout(2000);
    await screenshot(page, "J3-despues-js-click");

    // Verificar si se envió
    const textareaEmpty = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      return !ta?.value || ta.value.length === 0;
    });

    if (textareaEmpty) {
      console.log("\n✓ ¡MENSAJE ENVIADO!");
      console.log("\n5. Esperando respuesta (60 seg)...");

      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(15000);
        await screenshot(page, `J4-wait-${(i+1)*15}s`);
      }

      // Capturar respuesta
      const response = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="markdown"], [class*="message"], p');
        return Array.from(elements)
          .map(e => e.innerText?.trim())
          .filter(t => t && t.length > 100)
          .slice(-2)
          .join('\n---\n');
      });

      console.log("\n=== RESPUESTA ===");
      console.log(response.substring(0, 1500) || "(Sin respuesta detectada)");

    } else {
      console.log("\n⚠️ Mensaje no enviado, intentando método alternativo...");

      // Método alternativo: dispatch de eventos
      const dispatched = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          // Crear y disparar evento de Enter
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true
          });
          textarea.dispatchEvent(enterEvent);

          // También probar con submit en el form
          const form = textarea.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return 'form submit dispatched';
          }
          return 'enter dispatched';
        }
        return 'no textarea';
      });

      console.log("   Dispatch result:", dispatched);
      await page.waitForTimeout(3000);
      await screenshot(page, "J5-after-dispatch");
    }

    await screenshot(page, "J6-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error-j");
  }

  await browser.close();
})();
