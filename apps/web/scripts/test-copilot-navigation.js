/**
 * Test: Verificar navegación del Copilot con preguntas sobre eventos
 *
 * Prueba el flujo:
 * 1. Usuario pregunta sobre presupuesto de un evento
 * 2. Copilot responde con información y link
 * 3. Link navega a la sección correcta
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST NAVEGACIÓN COPILOT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar logs de navegación
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Copilot') || text.includes('Navigate') || text.includes('navegacion')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  // Detectar navegaciones
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`\n🔗 Navegación detectada: ${frame.url()}`);
    }
  });

  try {
    // PASO 1: Autenticarse con dev_bypass
    console.log("1. Navegando y autenticando...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    // Establecer dev_bypass para simular usuario autenticado
    await page.evaluate(() => {
      sessionStorage.setItem('dev_bypass', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, "nav-01-inicio");

    // Verificar si hay eventos
    const hasEvents = await page.evaluate(() => {
      return document.body.innerText.includes('evento') ||
             document.body.innerText.includes('Evento');
    });
    console.log(`   Tiene eventos: ${hasEvents ? '✓' : '✗'}`);

    // PASO 2: Abrir Copilot
    console.log("\n2. Abriendo Copilot...");
    const copilotBtn = page.locator('text=Copilot').first();
    await copilotBtn.waitFor({ state: 'visible', timeout: 10000 });
    await copilotBtn.click();
    await page.waitForTimeout(2000);
    await screenshot(page, "nav-02-copilot-abierto");

    // PASO 3: Preguntar sobre presupuesto
    console.log("\n3. Preguntando sobre presupuesto...");

    // Buscar textarea o input
    let inputElement = page.locator('textarea').first();
    let inputVisible = await inputElement.isVisible().catch(() => false);

    if (!inputVisible) {
      // Buscar en iframe si no es chat nativo
      const iframe = page.frameLocator('iframe[src*="chat"]').first();
      inputElement = iframe.locator('[contenteditable="true"]').first();
      inputVisible = await inputElement.isVisible().catch(() => false);
    }

    if (inputVisible) {
      const pregunta = "Quiero agregar un gasto de 500 euros para el catering en mi presupuesto";
      await inputElement.click();
      await inputElement.fill(pregunta);
      console.log(`   Pregunta: "${pregunta}"`);
      await screenshot(page, "nav-03-pregunta");

      await page.keyboard.press('Enter');
      console.log("   ✓ Pregunta enviada");

      // Esperar respuesta
      await page.waitForTimeout(10000);
      await screenshot(page, "nav-04-respuesta");

      // Verificar si hay link de navegación en la respuesta
      const responseText = await page.evaluate(() => {
        return document.body.innerText;
      });

      const hasPresupuestoLink = responseText.includes('/presupuesto') ||
                                  responseText.includes('presupuesto');
      const hasBudgetMention = responseText.includes('gasto') ||
                               responseText.includes('catering') ||
                               responseText.includes('500');

      console.log(`\n   Respuesta menciona presupuesto: ${hasPresupuestoLink ? '✓' : '✗'}`);
      console.log(`   Respuesta entiende el contexto: ${hasBudgetMention ? '✓' : '✗'}`);

      // PASO 4: Hacer otra pregunta sobre invitados
      console.log("\n4. Preguntando sobre invitados...");
      await page.waitForTimeout(2000);

      await inputElement.click();
      await inputElement.fill("Cuántos invitados tengo confirmados?");
      await page.keyboard.press('Enter');
      await page.waitForTimeout(8000);
      await screenshot(page, "nav-05-invitados");

      // PASO 5: Verificar links clickeables
      console.log("\n5. Buscando links clickeables...");

      const links = await page.evaluate(() => {
        const allLinks = document.querySelectorAll('a[href*="/invitados"], a[href*="/presupuesto"], a[href*="/mesas"]');
        return Array.from(allLinks).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href')
        }));
      });

      if (links.length > 0) {
        console.log(`   ✓ Links encontrados: ${links.length}`);
        links.forEach(link => {
          console.log(`     - ${link.text}: ${link.href}`);
        });
      } else {
        console.log("   ⚠️ No se encontraron links de navegación");
      }

    } else {
      console.log("   ✗ No se encontró input de chat");
    }

    await screenshot(page, "nav-06-final");

    console.log("\n=== NAVEGADOR ABIERTO 45 SEG ===\n");
    await page.waitForTimeout(45000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "nav-error");
    await page.waitForTimeout(15000);
  }

  await browser.close();
})();
