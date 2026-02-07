/**
 * Test V12: Verificar Copilot Guest - Buscar textarea directamente
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST V12 - COPILOT GUEST SIMPLE ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Copilot') || text.includes('ChatNative') || text.includes('Guest')) {
      console.log(`[BROWSER] ${msg.type()}: ${text}`);
    }
  });

  try {
    // PASO 1: Navegar
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    // Forzar recarga para asegurar últimos cambios
    console.log("   Forzando recarga...");
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    await screenshot(page, "V12-01-inicio");

    // PASO 2: Click en Copilot
    console.log("\n2. Buscando y clickeando Copilot...");

    // Buscar el botón Copilot en el header
    const copilotBtn = page.locator('text=Copilot').first();
    await copilotBtn.waitFor({ state: 'visible', timeout: 10000 });
    await copilotBtn.click();
    console.log("   ✓ Click en Copilot");

    await page.waitForTimeout(3000);
    await screenshot(page, "V12-02-after-click");

    // PASO 3: Buscar textarea del chat nativo
    console.log("\n3. Buscando textarea del chat nativo...");

    const textarea = page.locator('textarea').first();
    const textareaVisible = await textarea.isVisible().catch(() => false);

    console.log(`   Textarea visible: ${textareaVisible ? '✓' : '✗'}`);

    if (textareaVisible) {
      // PASO 4: Verificar si es chat nativo (no iframe)
      const hasIframe = await page.evaluate(() => {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
          if (iframe.src && iframe.src.includes('chat-test')) {
            return true;
          }
        }
        return false;
      });

      console.log(`   Es chat nativo (sin iframe): ${!hasIframe ? '✓' : '✗ (usa iframe)'}`);

      // PASO 5: Enviar mensaje
      console.log("\n4. Enviando mensaje como invitado...");
      await textarea.click();
      await textarea.fill('Hola, soy un usuario invitado');
      await screenshot(page, "V12-03-mensaje-escrito");

      await page.keyboard.press('Enter');
      console.log("   ✓ Mensaje enviado");

      // Esperar respuesta
      console.log("\n5. Esperando respuesta...");
      await page.waitForTimeout(10000);
      await screenshot(page, "V12-04-esperando-respuesta");

      // Verificar si hay respuesta
      const chatContent = await page.evaluate(() => {
        const messages = document.querySelectorAll('[class*="message"], [class*="Message"], [class*="chat"], [class*="Chat"]');
        let content = [];
        messages.forEach(m => {
          if (m.textContent && m.textContent.length > 10) {
            content.push(m.textContent.substring(0, 100));
          }
        });
        return content;
      });

      console.log(`   Mensajes encontrados: ${chatContent.length}`);
      if (chatContent.length > 0) {
        console.log("   Contenido:", chatContent[0]);
      }

    } else {
      // Buscar si hay mensaje de "Iniciar sesión"
      const pageText = await page.evaluate(() => document.body.innerText);

      if (pageText.includes('Iniciar sesión para usar')) {
        console.log("\n❌ El chat pide iniciar sesión - No funciona para guests");
      } else if (pageText.includes('Estás como invitado')) {
        console.log("\n✅ Se detecta modo invitado");
      }

      console.log("\n   Buscando cualquier input...");
      const inputs = await page.locator('input, textarea, [contenteditable="true"]').all();
      console.log(`   Inputs encontrados: ${inputs.length}`);
    }

    await screenshot(page, "V12-05-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V12-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
