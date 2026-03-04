const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST - COPILOT V2 ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Navegar a app-test
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log("   Esperando carga (10 seg)...");
    await page.waitForTimeout(10000);
    await screenshot(page, "V2-01-inicio");

    // ==========================================
    // PASO 2: Buscar y hacer click en "Copilot" en el header
    // ==========================================
    console.log("\n2. Buscando botón Copilot en el header...");

    // El botón Copilot está en la barra de navegación superior
    const copilotBtn = await page.evaluate(() => {
      // Buscar por texto "Copilot"
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.innerText === 'Copilot' || el.textContent === 'Copilot') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.y < 100) {
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              width: rect.width,
              height: rect.height
            };
          }
        }
      }

      // Buscar enlaces o botones que contengan "copilot"
      const links = document.querySelectorAll('a, button, [role="button"]');
      for (const link of links) {
        const text = (link.innerText || '').toLowerCase();
        const href = link.href || '';
        if (text.includes('copilot') || href.includes('copilot')) {
          const rect = link.getBoundingClientRect();
          if (rect.width > 0 && rect.y < 100) {
            return {
              found: true,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              method: 'link'
            };
          }
        }
      }

      return { found: false };
    });

    console.log(`   Botón Copilot: ${JSON.stringify(copilotBtn)}`);

    if (copilotBtn.found) {
      console.log("   Haciendo click en Copilot...");
      await page.mouse.click(copilotBtn.x, copilotBtn.y);
      await page.waitForTimeout(5000);
      await screenshot(page, "V2-02-copilot-clicked");

      // Verificar si se abrió el chat (puede ser un panel lateral o modal)
      const chatOpened = await page.evaluate(() => {
        // Buscar iframe del chat
        const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"]');
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          return { type: 'iframe', visible: rect.width > 0, width: rect.width, height: rect.height };
        }

        // Buscar panel lateral
        const panel = document.querySelector('[class*="panel"], [class*="sidebar"], [class*="drawer"]');
        if (panel && panel.querySelector('textarea')) {
          return { type: 'panel', visible: true };
        }

        // Buscar textarea
        const textarea = document.querySelector('textarea');
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          return { type: 'textarea', visible: rect.width > 0, x: rect.x, y: rect.y };
        }

        return { type: 'unknown', visible: false };
      });

      console.log(`   Chat abierto: ${JSON.stringify(chatOpened)}`);
    } else {
      // Intentar con coordenadas aproximadas basadas en la captura
      // El botón Copilot está aproximadamente en x=480, y=12 (en el header)
      console.log("   Intentando click en coordenadas aproximadas (480, 15)...");
      await page.mouse.click(480, 15);
      await page.waitForTimeout(5000);
      await screenshot(page, "V2-02-coords-click");
    }

    // Esperar a que cargue el iframe del copilot
    console.log("\n3. Esperando iframe del Copilot...");
    await page.waitForTimeout(3000);

    // Verificar si hay un iframe
    const iframeInfo = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const info = [];
      iframes.forEach((iframe, i) => {
        const rect = iframe.getBoundingClientRect();
        info.push({
          index: i,
          src: iframe.src?.substring(0, 100),
          width: rect.width,
          height: rect.height,
          visible: rect.width > 100
        });
      });
      return info;
    });

    console.log(`   Iframes encontrados: ${JSON.stringify(iframeInfo)}`);

    // Buscar el iframe del copilot
    let copilotIframe = null;
    for (const info of iframeInfo) {
      if (info.src?.includes('chat') || info.src?.includes('copilot') || info.visible) {
        copilotIframe = page.frameLocator(`iframe`).nth(info.index);
        console.log(`   Usando iframe ${info.index}: ${info.src}`);
        break;
      }
    }

    await screenshot(page, "V2-03-estado");

    // ==========================================
    // PASO 4: Interactuar con el chat
    // ==========================================
    console.log("\n4. Interactuando con el chat...");

    if (copilotIframe) {
      try {
        // ✅ MEJORA: Esperar más tiempo para que React renderice completamente
        // El iframe HTML carga rápido, pero React necesita ~5-10s para renderizar
        console.log("   Esperando 12 segundos para que React renderice...");
        await page.waitForTimeout(12000);

        // Buscar textarea dentro del iframe con reintentos
        console.log("   Buscando textarea en iframe...");
        const textarea = copilotIframe.locator('textarea').first();

        // ✅ Intentar esperar a que el textarea esté visible (máximo 10s)
        let isVisible = false;
        try {
          await textarea.waitFor({ state: 'visible', timeout: 10000 });
          isVisible = true;
        } catch {
          isVisible = await textarea.isVisible().catch(() => false);
        }

        if (isVisible) {
          console.log("   Textarea encontrado en iframe!");
          await textarea.fill('Hola! Que servicios ofrece Bodas de Hoy para organizar una boda perfecta?');
          await page.waitForTimeout(1000);
          await screenshot(page, "V2-04-mensaje-escrito");

          // Buscar botón de envío
          const sendBtn = copilotIframe.locator('button').last();
          await sendBtn.click();
          console.log("   Mensaje enviado!");
        } else {
          console.log("   Textarea no visible en iframe");
        }
      } catch (e) {
        console.log(`   Error con iframe: ${e.message}`);
      }
    } else {
      // Buscar textarea en la página principal
      const mainTextarea = await page.$('textarea');
      if (mainTextarea) {
        console.log("   Usando textarea en página principal");
        await mainTextarea.fill('Hola! Que servicios ofrece Bodas de Hoy?');
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
      }
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "V2-05-despues-envio");

    // ==========================================
    // PASO 5: Esperar respuesta
    // ==========================================
    console.log("\n5. Esperando respuesta (90 seg)...");

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);
      await screenshot(page, `V2-06-espera-${(i+1)*15}s`);

      // Verificar estado
      const status = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return {
          hasError: text.includes('error') && text.includes('occurred'),
          hasNoProviders: text.includes('No enabled providers'),
          bodyLength: text.length
        };
      });

      if (status.hasError || status.hasNoProviders) {
        console.log(`   ❌ Error detectado`);
        break;
      }
    }

    await screenshot(page, "V2-07-final");

    // Capturar estado final
    const finalUrl = page.url();
    console.log(`\n   URL final: ${finalUrl}`);

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V2-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
