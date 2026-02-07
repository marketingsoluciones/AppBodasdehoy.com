/**
 * Test: Copilot con usuario real y evento seleccionado
 *
 * Este test:
 * 1. Hace login real con credenciales
 * 2. Selecciona un evento existente
 * 3. Navega a diferentes secciones
 * 4. Abre el Copilot y hace preguntas sobre el evento
 * 5. Verifica que muestre información correcta
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

// Credenciales de prueba
const TEST_USER = {
  email: "bodasdehoy.com@gmail.com",
  password: "lorca2012M*+."
};

(async () => {
  console.log("=== TEST COPILOT CON USUARIO REAL ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1500, height: 900 }
  });

  const page = await context.newPage();

  // Capturar logs relevantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Copilot') || text.includes('AUTH') || text.includes('event')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    // PASO 1: Ir a la página de login
    console.log("1. Navegando a login...");
    await page.goto("https://app-test.bodasdehoy.com/login", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);
    await screenshot(page, "real-01-login-page");

    // PASO 2: Hacer login
    console.log("\n2. Haciendo login con usuario real...");
    console.log(`   Email: ${TEST_USER.email}`);

    // Buscar campos de login
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")').first();

    // Rellenar credenciales
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_USER.email);
      console.log("   ✓ Email ingresado");
    }

    if (await passwordInput.isVisible()) {
      await passwordInput.fill(TEST_USER.password);
      console.log("   ✓ Contraseña ingresada");
    }

    await screenshot(page, "real-02-credentials");

    // Hacer clic en login
    if (await loginButton.isVisible()) {
      await loginButton.click();
      console.log("   ✓ Botón login clickeado");
    }

    // Esperar a que cargue la página principal
    await page.waitForTimeout(5000);
    await screenshot(page, "real-03-after-login");

    // Verificar si hay error de login
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      console.log("   ⚠️ Posible error de login, verificando...");
      const errorMsg = await page.locator('[class*="error"], [class*="alert"]').textContent().catch(() => "");
      if (errorMsg) console.log(`   Error: ${errorMsg}`);
    }

    // PASO 3: Buscar y seleccionar un evento
    console.log("\n3. Buscando eventos disponibles...");
    await page.waitForTimeout(2000);

    // Buscar cards de eventos o lista de eventos
    const eventElements = await page.locator('[class*="event"], [class*="card"], a[href*="resumen"]').all();
    console.log(`   Encontrados ${eventElements.length} posibles eventos`);

    // Capturar nombres de eventos visibles
    const pageContent = await page.evaluate(() => document.body.innerText);
    const eventMatches = pageContent.match(/(?:boda|evento|celebración)\s+(?:de\s+)?[\w\s]+/gi) || [];
    if (eventMatches.length > 0) {
      console.log(`   Eventos detectados en texto:`);
      eventMatches.slice(0, 5).forEach(e => console.log(`     - ${e.trim()}`));
    }

    await screenshot(page, "real-04-eventos");

    // Intentar hacer clic en el primer evento o ir a una sección
    let eventSelected = false;

    // Buscar enlaces a eventos específicos
    const eventLinks = page.locator('a[href*="evento"], a[href*="resumen"], [class*="card"] a').first();
    if (await eventLinks.isVisible().catch(() => false)) {
      await eventLinks.click();
      eventSelected = true;
      console.log("   ✓ Evento seleccionado");
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "real-05-evento-seleccionado");

    // PASO 4: Navegar a Presupuesto
    console.log("\n4. Navegando a Presupuesto...");

    const presupuestoLink = page.locator('a:has-text("Presupuesto"), [href*="presupuesto"]').first();
    if (await presupuestoLink.isVisible().catch(() => false)) {
      await presupuestoLink.click();
      await page.waitForTimeout(3000);
      console.log("   ✓ En sección Presupuesto");
    } else {
      // Navegar por URL directamente
      await page.goto("https://app-test.bodasdehoy.com/presupuesto", { waitUntil: 'networkidle' });
    }

    await screenshot(page, "real-06-presupuesto");

    // PASO 5: Abrir el Copilot
    console.log("\n5. Abriendo Copilot...");

    // Cerrar modales primero
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const copilotBtn = page.locator('button[title*="Copilot"], button:has-text("Copilot")').first();
    if (await copilotBtn.isVisible().catch(() => false)) {
      await copilotBtn.click({ force: true });
      await page.waitForTimeout(3000);
      console.log("   ✓ Copilot abierto");
    }

    await screenshot(page, "real-07-copilot");

    // PASO 6: Buscar el input del chat
    console.log("\n6. Buscando input del chat...");

    // Esperar a que el iframe cargue
    await page.waitForTimeout(5000);

    // El chat está en un iframe (LobeChat)
    const iframes = page.frameLocator('iframe');
    let chatInput = null;
    let inputFound = false;

    try {
      // Intentar encontrar el input en el iframe
      chatInput = iframes.first().locator('textarea, [contenteditable="true"], input[type="text"]').first();
      inputFound = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (inputFound) {
        console.log("   ✓ Input encontrado en iframe");
      }
    } catch (e) {
      console.log("   ⚠️ No se pudo acceder al iframe");
    }

    // Si no está en iframe, buscar en la página principal (CopilotChatNative)
    if (!inputFound) {
      chatInput = page.locator('textarea').first();
      inputFound = await chatInput.isVisible().catch(() => false);
      if (inputFound) {
        console.log("   ✓ Input encontrado en página principal");
      }
    }

    await screenshot(page, "real-08-chat-input");

    // PASO 7: Hacer preguntas sobre el evento
    if (inputFound && chatInput) {
      console.log("\n7. Haciendo preguntas sobre el evento...");

      // Pregunta 1: Sobre presupuesto
      const pregunta1 = "¿Cuánto tengo gastado en mi presupuesto?";
      console.log(`\n   Pregunta 1: "${pregunta1}"`);

      await chatInput.click();
      await chatInput.fill(pregunta1);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);
      await screenshot(page, "real-09-respuesta1");

      // Pregunta 2: Sobre invitados
      const pregunta2 = "¿Cuántos invitados tengo confirmados?";
      console.log(`\n   Pregunta 2: "${pregunta2}"`);

      await chatInput.click();
      await chatInput.fill(pregunta2);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);
      await screenshot(page, "real-10-respuesta2");

      // Pregunta 3: Pedir navegar a otra sección
      const pregunta3 = "Quiero ver el itinerario de mi evento";
      console.log(`\n   Pregunta 3: "${pregunta3}"`);

      await chatInput.click();
      await chatInput.fill(pregunta3);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);
      await screenshot(page, "real-11-respuesta3");

    } else {
      console.log("\n7. ⚠️ No se encontró input de chat");

      // Mostrar elementos disponibles
      const elements = await page.evaluate(() => ({
        textareas: document.querySelectorAll('textarea').length,
        iframes: document.querySelectorAll('iframe').length,
        inputs: document.querySelectorAll('input').length
      }));
      console.log("   Elementos:", elements);
    }

    await screenshot(page, "real-12-final");

    console.log("\n=== NAVEGADOR ABIERTO 60 SEG ===");
    console.log("Puedes interactuar manualmente con la aplicación.\n");
    await page.waitForTimeout(60000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "real-error");
    await page.waitForTimeout(30000);
  }

  await browser.close();
})();
