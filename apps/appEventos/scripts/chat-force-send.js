const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/chat-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST CHAT - FORZAR ENVÍO ===\n");

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
      waitUntil: 'domcontentloaded'
    });

    console.log("2. Esperando carga (15 seg)...");
    await page.waitForTimeout(15000);

    // Primero, inspeccionemos los botones disponibles
    const buttonInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const info = [];
      buttons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        info.push({
          index: i,
          text: btn.innerText?.substring(0, 30),
          className: btn.className?.substring(0, 50),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          hasSvg: !!btn.querySelector('svg')
        });
      });
      return info;
    });

    console.log("\n--- BOTONES ENCONTRADOS ---");
    buttonInfo.forEach(b => {
      console.log(`  [${b.index}] ${b.text || '(sin texto)'} - pos:(${Math.round(b.x)},${Math.round(b.y)}) size:${Math.round(b.width)}x${Math.round(b.height)} svg:${b.hasSvg}`);
    });

    // Encontrar textarea y su posición
    const textareaInfo = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        const rect = ta.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        };
      }
      return null;
    });

    console.log("\n--- TEXTAREA ---");
    console.log(textareaInfo);

    // Escribir mensaje con click directo y teclado
    console.log("\n3. Haciendo click en textarea y escribiendo...");
    if (textareaInfo) {
      // Click en el centro del textarea
      await page.mouse.click(
        textareaInfo.x + textareaInfo.width / 2,
        textareaInfo.y + textareaInfo.height / 2
      );
      await page.waitForTimeout(500);

      // Escribir con teclado
      await page.keyboard.type('Hola, ¿qué servicios tiene Bodas de Hoy para bodas?', { delay: 25 });
      await page.waitForTimeout(1000);
    }

    await screenshot(page, "F1-texto-escrito");

    // Buscar botones cerca del textarea (botón de envío)
    console.log("\n4. Buscando botón de envío cerca del textarea...");

    const sendButtonInfo = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (!textarea) return null;

      const taRect = textarea.getBoundingClientRect();

      // Buscar botones a la derecha del textarea
      const buttons = document.querySelectorAll('button');
      const candidates = [];

      buttons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        // El botón de envío está a la derecha y cerca del textarea
        if (rect.x > taRect.right - 100 &&
            rect.y > taRect.y - 20 &&
            rect.y < taRect.bottom + 50) {
          candidates.push({
            index: i,
            x: rect.x + rect.width/2,
            y: rect.y + rect.height/2,
            element: btn
          });
        }
      });

      // Retornar el más a la derecha (probablemente el de envío)
      if (candidates.length > 0) {
        const rightmost = candidates.reduce((a, b) => a.x > b.x ? a : b);
        return { x: rightmost.x, y: rightmost.y, index: rightmost.index };
      }

      return null;
    });

    console.log("   Botón candidato:", sendButtonInfo);

    // Intentar múltiples métodos de envío
    console.log("\n5. Intentando enviar mensaje...");

    // Método 1: Click en el botón encontrado
    if (sendButtonInfo) {
      console.log(`   Click en botón en (${Math.round(sendButtonInfo.x)}, ${Math.round(sendButtonInfo.y)})`);
      await page.mouse.click(sendButtonInfo.x, sendButtonInfo.y);
      await page.waitForTimeout(1000);
    }

    await screenshot(page, "F2-despues-click");

    // Verificar si el mensaje se envió (textarea debería estar vacío)
    const textareaAfter = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      return ta ? ta.value : null;
    });

    console.log(`   Texto en textarea después: "${textareaAfter?.substring(0, 30) || '(vacío)'}"`);

    if (textareaAfter && textareaAfter.length > 0) {
      console.log("\n   Mensaje no enviado. Probando método alternativo...");

      // Método 2: Focus en textarea y presionar Enter
      await page.focus('textarea');
      await page.waitForTimeout(300);

      // En LobeChat, Ctrl+Enter o Cmd+Enter suele enviar
      console.log("   Intentando Cmd+Enter...");
      await page.keyboard.press('Meta+Enter');
      await page.waitForTimeout(1000);

      const textareaAfter2 = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        return ta ? ta.value : null;
      });

      console.log(`   Texto después de Cmd+Enter: "${textareaAfter2?.substring(0, 30) || '(vacío)'}"`);

      if (textareaAfter2 && textareaAfter2.length > 0) {
        // Método 3: Ctrl+Enter
        console.log("   Intentando Ctrl+Enter...");
        await page.keyboard.press('Control+Enter');
        await page.waitForTimeout(1000);
      }

      // Método 4: Solo Enter después de enfocar
      const textareaAfter3 = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        return ta ? ta.value : null;
      });

      if (textareaAfter3 && textareaAfter3.length > 0) {
        console.log("   Intentando solo Enter...");
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    }

    await screenshot(page, "F3-despues-enter");

    // Verificar el estado final
    const finalState = await page.evaluate(() => {
      const ta = document.querySelector('textarea');
      const messages = document.querySelectorAll('[class*="message"]');
      return {
        textareaEmpty: !ta?.value || ta.value.length === 0,
        messageCount: messages.length,
        hasUserMessage: Array.from(messages).some(m =>
          m.innerText?.includes('servicios') || m.innerText?.includes('Bodas de Hoy'))
      };
    });

    console.log("\n--- ESTADO FINAL ---");
    console.log(finalState);

    // Esperar respuesta si el mensaje se envió
    if (finalState.textareaEmpty || finalState.hasUserMessage) {
      console.log("\n6. ¡Mensaje enviado! Esperando respuesta (60 seg)...");
      await page.waitForTimeout(60000);
      await screenshot(page, "F4-respuesta");
    } else {
      console.log("\n   ⚠️ El mensaje no se envió correctamente");
    }

    await screenshot(page, "F5-final");

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
