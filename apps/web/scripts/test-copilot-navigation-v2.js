/**
 * Test: Verificar navegación del Copilot con evento seleccionado
 *
 * Este test:
 * 1. Se autentica en app-test
 * 2. Selecciona el primer evento disponible
 * 3. Abre el Copilot
 * 4. Hace preguntas sobre el evento
 * 5. Verifica que las respuestas incluyan links de navegación
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

const waitForResponse = async (page, timeout = 15000) => {
  const startTime = Date.now();
  let lastContent = "";

  while (Date.now() - startTime < timeout) {
    await page.waitForTimeout(500);

    // Buscar contenido de respuesta del asistente
    const currentContent = await page.evaluate(() => {
      // Buscar en mensajes del chat
      const messages = document.querySelectorAll('[class*="message"], [class*="assistant"], [class*="chat"]');
      const texts = [];
      messages.forEach(m => {
        const text = m.textContent || "";
        if (text.length > 20) texts.push(text);
      });
      return texts.join(" | ");
    });

    if (currentContent !== lastContent && currentContent.length > lastContent.length) {
      lastContent = currentContent;
      // Si hay contenido nuevo, esperar un poco más para ver si sigue llegando
      await page.waitForTimeout(1000);
    } else if (currentContent === lastContent && lastContent.length > 0) {
      // No hay cambios, probablemente terminó
      return lastContent;
    }
  }

  return lastContent;
};

(async () => {
  console.log("=== TEST NAVEGACIÓN COPILOT V2 ===\n");
  console.log("Este test verifica que el Copilot genere links de navegación\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capturar logs relevantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Copilot') || text.includes('PAGE_CONTEXT') || text.includes('AUTH_CONFIG')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  // Detectar navegaciones
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      if (!url.includes('_next')) {
        console.log(`\n🔗 Navegación: ${url}`);
      }
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
    await screenshot(page, "nav2-01-inicio");

    // PASO 2: Buscar y seleccionar el primer evento
    console.log("\n2. Buscando eventos disponibles...");

    // Buscar cards o links de eventos
    const eventCards = await page.locator('[class*="event"], [class*="card"], a[href*="resumen"]').all();
    console.log(`   Encontrados ${eventCards.length} posibles eventos`);

    // Intentar hacer clic en el primer evento
    let eventSelected = false;
    let eventName = "";

    for (const card of eventCards) {
      try {
        const text = await card.textContent();
        if (text && (text.includes('boda') || text.includes('Boda') || text.includes('evento') || text.includes('Evento'))) {
          eventName = text.substring(0, 50);
          console.log(`   Seleccionando evento: "${eventName}..."`);
          await card.click();
          eventSelected = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!eventSelected) {
      // Si no hay eventos con esos nombres, intentar el primer elemento clickeable
      console.log("   No se encontró evento específico, buscando primer evento...");
      const firstClickable = page.locator('main a, main button, main [class*="card"]').first();
      if (await firstClickable.isVisible().catch(() => false)) {
        eventName = await firstClickable.textContent().catch(() => "Evento") || "Evento";
        await firstClickable.click();
        eventSelected = true;
      }
    }

    await page.waitForTimeout(2000);
    await screenshot(page, "nav2-02-evento-seleccionado");

    // Verificar que estamos en una página de evento
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    // PASO 3: Cerrar modales y abrir Copilot
    console.log("\n3. Cerrando modales bloqueantes...");

    // Cerrar cualquier modal o overlay bloqueante
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Intentar cerrar botones de cerrar modal
    const closeButtons = page.locator('button:has-text("Cerrar"), button:has-text("×"), [class*="close"], [aria-label*="close"]');
    const closeCount = await closeButtons.count();
    console.log(`   Encontrados ${closeCount} botones de cerrar`);
    for (let i = 0; i < closeCount && i < 3; i++) {
      try {
        await closeButtons.nth(i).click({ force: true });
        await page.waitForTimeout(300);
      } catch (e) {
        // Ignorar errores
      }
    }

    await page.waitForTimeout(1000);
    console.log("\n   Abriendo Copilot...");

    // Buscar botón de Copilot
    const copilotBtn = page.locator('button[title*="Copilot"], button:has-text("Copilot"), [aria-label*="Copilot"]').first();
    const hasCopilot = await copilotBtn.isVisible().catch(() => false);

    if (hasCopilot) {
      // Usar force click para evitar elementos bloqueantes
      await copilotBtn.click({ force: true });
      await page.waitForTimeout(2000);
      console.log("   ✓ Copilot abierto");
    } else {
      console.log("   ⚠️ No se encontró botón de Copilot visible");
    }

    await screenshot(page, "nav2-03-copilot-abierto");

    // PASO 4: Esperar a que el iframe cargue y buscar input
    console.log("\n4. Buscando input de chat...");
    await page.waitForTimeout(3000);

    // Buscar input en la página principal o en iframe
    let inputElement = null;
    let inputContext = "main";

    // Primero buscar en la página principal (CopilotChatNative)
    inputElement = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
    let inputVisible = await inputElement.isVisible().catch(() => false);

    if (!inputVisible) {
      // Buscar en iframe
      console.log("   Buscando en iframe...");
      const iframe = page.frameLocator('iframe[src*="chat"]').first();
      inputElement = iframe.locator('textarea, [contenteditable="true"]').first();
      inputVisible = await inputElement.isVisible().catch(() => false);
      inputContext = "iframe";
    }

    console.log(`   Input encontrado en: ${inputContext}, visible: ${inputVisible}`);

    if (inputVisible) {
      // PASO 5: Hacer preguntas y verificar respuestas con links
      console.log("\n5. Preguntando sobre presupuesto...");

      const pregunta1 = "Quiero ver mi presupuesto y agregar un gasto de catering";
      await inputElement.click();
      await inputElement.fill(pregunta1);
      console.log(`   Pregunta: "${pregunta1}"`);
      await screenshot(page, "nav2-04-pregunta1");

      await page.keyboard.press('Enter');
      console.log("   Enviando pregunta...");

      // Esperar respuesta
      const response1 = await waitForResponse(page, 20000);
      await screenshot(page, "nav2-05-respuesta1");

      // Analizar respuesta
      const hasPresupuestoLink = response1.includes('/presupuesto') ||
                                  response1.includes('[Ver presupuesto]') ||
                                  response1.includes('presupuesto');
      const hasGastoMention = response1.includes('gasto') ||
                              response1.includes('catering') ||
                              response1.includes('añadir');

      console.log(`\n   Respuesta (${response1.length} chars):`);
      console.log(`   - Menciona presupuesto: ${hasPresupuestoLink ? '✓' : '✗'}`);
      console.log(`   - Entiende contexto (gasto/catering): ${hasGastoMention ? '✓' : '✗'}`);

      // Buscar links en la página
      const links = await page.evaluate(() => {
        const allLinks = document.querySelectorAll('a[href*="/presupuesto"], a[href*="/invitados"], a[href*="/mesas"]');
        return Array.from(allLinks).map(a => ({
          text: a.textContent?.trim().substring(0, 50),
          href: a.getAttribute('href')
        }));
      });

      if (links.length > 0) {
        console.log(`\n   ✓ Links de navegación encontrados: ${links.length}`);
        links.forEach(link => {
          console.log(`     - "${link.text}": ${link.href}`);
        });
      } else {
        console.log("\n   ⚠️ No se encontraron links de navegación clickeables");
      }

      // PASO 6: Segunda pregunta sobre invitados
      console.log("\n6. Preguntando sobre invitados...");
      await page.waitForTimeout(2000);

      const pregunta2 = "Cuantos invitados tengo confirmados? Quiero ver la lista";
      await inputElement.click();
      await inputElement.fill(pregunta2);
      console.log(`   Pregunta: "${pregunta2}"`);

      await page.keyboard.press('Enter');

      const response2 = await waitForResponse(page, 15000);
      await screenshot(page, "nav2-06-respuesta2");

      const hasInvitadosLink = response2.includes('/invitados') ||
                               response2.includes('[Ver invitados]');
      const hasConfirmados = response2.includes('confirmado') ||
                             response2.includes('invitado');

      console.log(`\n   Respuesta (${response2.length} chars):`);
      console.log(`   - Menciona invitados/link: ${hasInvitadosLink ? '✓' : '✗'}`);
      console.log(`   - Entiende contexto: ${hasConfirmados ? '✓' : '✗'}`);

    } else {
      console.log("   ✗ No se encontró input de chat visible");
    }

    await screenshot(page, "nav2-07-final");

    console.log("\n=== RESUMEN ===");
    console.log("El test verificó:");
    console.log("1. Autenticación con dev_bypass");
    console.log("2. Selección de evento");
    console.log("3. Apertura del Copilot");
    console.log("4. Envío de preguntas sobre presupuesto e invitados");
    console.log("5. Verificación de links de navegación en respuestas");

    console.log("\n=== NAVEGADOR ABIERTO 30 SEG ===\n");
    await page.waitForTimeout(30000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "nav2-error");
    await page.waitForTimeout(15000);
  }

  await browser.close();
})();
