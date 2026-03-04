const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== INVESTIGAR ESTRUCTURA DEL CHAT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("1. Navegando...");
    await page.goto("https://chat-test.bodasdehoy.com/bodasdehoy/chat", { timeout: 60000 });

    console.log("2. Esperando carga (20 seg)...");
    await page.waitForTimeout(20000);

    // Investigar la estructura del input
    console.log("\n3. Investigando estructura del input...\n");

    const inputInfo = await page.evaluate(() => {
      const info = {};

      // Buscar textareas
      const textareas = document.querySelectorAll('textarea');
      info.textareas = Array.from(textareas).map((ta, i) => ({
        index: i,
        id: ta.id,
        className: ta.className?.substring(0, 100),
        placeholder: ta.placeholder,
        value: ta.value,
        rect: ta.getBoundingClientRect()
      }));

      // Buscar contenteditables
      const editables = document.querySelectorAll('[contenteditable="true"]');
      info.contentEditables = Array.from(editables).map((el, i) => ({
        index: i,
        tagName: el.tagName,
        className: el.className?.substring(0, 100),
        textContent: el.textContent?.substring(0, 50)
      }));

      // Buscar inputs de texto
      const inputs = document.querySelectorAll('input[type="text"]');
      info.textInputs = inputs.length;

      // Buscar botones en el área inferior
      const bottomButtons = [];
      document.querySelectorAll('button').forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        if (rect.y > 700) { // Área inferior
          bottomButtons.push({
            index: i,
            className: btn.className?.substring(0, 50),
            ariaLabel: btn.getAttribute('aria-label'),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      info.bottomButtons = bottomButtons;

      return info;
    });

    console.log("=== TEXTAREAS ===");
    console.log(JSON.stringify(inputInfo.textareas, null, 2));

    console.log("\n=== CONTENT EDITABLES ===");
    console.log(JSON.stringify(inputInfo.contentEditables, null, 2));

    console.log("\n=== BOTONES EN ÁREA INFERIOR ===");
    console.log(JSON.stringify(inputInfo.bottomButtons, null, 2));

    // Ahora escribir algo y ver qué pasa
    console.log("\n4. Escribiendo mensaje...");
    await page.mouse.click(700, 785);
    await page.waitForTimeout(500);
    await page.keyboard.type('Test mensaje', { delay: 30 });
    await page.waitForTimeout(1000);

    await screenshot(page, "INV-1-escrito");

    // Verificar el estado después de escribir
    const afterWrite = await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      const results = [];
      textareas.forEach((ta, i) => {
        results.push({
          index: i,
          value: ta.value,
          innerText: ta.innerText
        });
      });
      return results;
    });

    console.log("\n=== TEXTAREAS DESPUÉS DE ESCRIBIR ===");
    console.log(JSON.stringify(afterWrite, null, 2));

    // Buscar el botón de envío que ahora debería ser visible
    console.log("\n5. Buscando botón de envío visible...");

    const sendButtonInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const candidates = [];

      buttons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);

        // Botón en el área inferior derecha
        if (rect.y > 750 && rect.x > 900) {
          candidates.push({
            index: i,
            x: rect.x,
            y: rect.y,
            centerX: rect.x + rect.width/2,
            centerY: rect.y + rect.height/2,
            width: rect.width,
            height: rect.height,
            backgroundColor: style.backgroundColor,
            display: style.display,
            visibility: style.visibility
          });
        }
      });

      return candidates;
    });

    console.log("=== BOTONES CANDIDATOS PARA ENVÍO ===");
    console.log(JSON.stringify(sendButtonInfo, null, 2));

    // Si hay un botón, hacer click en él
    if (sendButtonInfo.length > 0) {
      const btn = sendButtonInfo[0]; // El primero a la derecha
      console.log(`\n6. Haciendo click en botón en (${Math.round(btn.centerX)}, ${Math.round(btn.centerY)})...`);
      await page.mouse.click(btn.centerX, btn.centerY);
      await page.waitForTimeout(2000);
      await screenshot(page, "INV-2-after-click");

      // Verificar si se envió
      const afterClick = await page.evaluate(() => {
        const textareas = document.querySelectorAll('textarea');
        return Array.from(textareas).map(ta => ({
          value: ta.value,
          empty: !ta.value || ta.value.length === 0
        }));
      });

      console.log("\n=== ESTADO DESPUÉS DEL CLICK ===");
      console.log(JSON.stringify(afterClick, null, 2));

      if (afterClick[0]?.empty) {
        console.log("\n✓ ¡MENSAJE ENVIADO!");
        console.log("\n7. Esperando respuesta (30 seg)...");
        await page.waitForTimeout(30000);
        await screenshot(page, "INV-3-respuesta");
      }
    }

    console.log("\n=== NAVEGADOR ABIERTO 1 MINUTO ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    console.error(error);
  }

  await browser.close();
})();
