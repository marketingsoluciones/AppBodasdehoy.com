/**
 * Test V11: Verificar Copilot Guest con más tiempo y debug
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST V11 - COPILOT GUEST DEBUG ===\n");

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
    if (msg.type() === 'error' || msg.text().includes('Copilot')) {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
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

    await screenshot(page, "V11-01-inicio");

    // PASO 2: Click en Copilot
    console.log("\n2. Buscando y clickeando Copilot...");

    // Usar evaluación más precisa
    const copilotClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
      for (const btn of buttons) {
        if (btn.textContent?.trim().includes('Copilot')) {
          btn.click();
          return true;
        }
      }
      // También buscar en spans/divs
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent?.trim() === 'Copilot' && el.offsetHeight > 0) {
          el.click();
          return true;
        }
      }
      return false;
    });

    console.log(`   Click en Copilot: ${copilotClicked ? '✓' : '✗'}`);

    await page.waitForTimeout(5000);
    await screenshot(page, "V11-02-after-click");

    // PASO 3: Analizar contenido del sidebar
    console.log("\n3. Analizando contenido del sidebar...");

    const sidebarContent = await page.evaluate(() => {
      // Buscar el sidebar de chat
      const sidebarSelectors = [
        '[class*="ChatSidebar"]',
        '[class*="sidebar" i]',
        '[class*="Copilot" i]',
        'aside',
        '[role="complementary"]'
      ];

      let sidebarEl = null;
      for (const sel of sidebarSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetWidth > 200) {
          sidebarEl = el;
          break;
        }
      }

      if (!sidebarEl) {
        return { found: false, html: '', text: '' };
      }

      return {
        found: true,
        html: sidebarEl.innerHTML.substring(0, 1000),
        text: sidebarEl.textContent?.substring(0, 500) || '',
        hasTextarea: !!sidebarEl.querySelector('textarea'),
        hasSuggestions: sidebarEl.textContent?.includes('gestiono') || false,
        hasNativeChat: sidebarEl.textContent?.includes('Escribe tu mensaje') || false,
        hasIframe: !!sidebarEl.querySelector('iframe')
      };
    });

    console.log(`   Sidebar encontrado: ${sidebarContent.found ? '✓' : '✗'}`);
    if (sidebarContent.found) {
      console.log(`   Tiene textarea: ${sidebarContent.hasTextarea ? '✓' : '✗'}`);
      console.log(`   Tiene sugerencias: ${sidebarContent.hasSuggestions ? '✓' : '✗'}`);
      console.log(`   Chat nativo: ${sidebarContent.hasNativeChat ? '✓' : '✗'}`);
      console.log(`   Tiene iframe: ${sidebarContent.hasIframe ? '✓' : '✗'}`);
      console.log(`   Texto: ${sidebarContent.text.substring(0, 150)}`);
    }

    await screenshot(page, "V11-03-sidebar-analisis");

    // PASO 4: Si hay textarea, enviar mensaje
    if (sidebarContent.hasTextarea) {
      console.log("\n4. Enviando mensaje...");

      const textarea = page.locator('textarea').first();
      await textarea.click();
      await textarea.fill('Hola, soy invitado');
      await page.keyboard.press('Enter');

      console.log("   ✓ Mensaje enviado");
      await page.waitForTimeout(10000);
      await screenshot(page, "V11-04-mensaje-enviado");
    } else if (sidebarContent.hasIframe) {
      console.log("\n4. El sidebar usa iframe (LobeChat)");
      console.log("   Esto indica que isGuest=false");
    } else {
      console.log("\n4. No se encontró input de chat");
    }

    await screenshot(page, "V11-05-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V11-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
