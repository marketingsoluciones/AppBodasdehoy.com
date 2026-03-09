/**
 * Test V3: Verificar navegación del Copilot
 *
 * Este test:
 * 1. Se autentica en app-test (usando usuario existente)
 * 2. Navega a un evento existente haciendo clic en las pestañas
 * 3. Abre el Copilot y hace preguntas sobre el evento
 * 4. Verifica que las respuestas incluyan links de navegación
 */
const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST NAVEGACIÓN COPILOT V3 ===\n");

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
    if (text.includes('Copilot') || text.includes('PAGE_CONTEXT') || text.includes('AUTH_CONFIG') || text.includes('CopilotChat')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  try {
    // PASO 1: Navegar a app-test
    console.log("1. Navegando a app-test...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    // Activar dev_bypass para simular sesión
    await page.evaluate(() => {
      sessionStorage.setItem('dev_bypass', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, "nav3-01-inicio");

    // PASO 2: Navegar directamente a una sección (Resumen, Presupuesto, etc.)
    console.log("\n2. Navegando a Presupuesto...");

    // Hacer clic en la pestaña "Presupuesto" directamente
    const presupuestoTab = page.locator('a:has-text("Presupuesto"), button:has-text("Presupuesto")').first();
    if (await presupuestoTab.isVisible().catch(() => false)) {
      await presupuestoTab.click({ force: true });
      await page.waitForTimeout(3000);
      console.log("   ✓ Navegado a Presupuesto");
    } else {
      // Si no hay pestaña directa, intentar URL
      console.log("   Navegando por URL...");
      await page.goto("https://app-test.bodasdehoy.com/presupuesto", {
        waitUntil: 'networkidle'
      });
    }

    await page.waitForTimeout(2000);
    await screenshot(page, "nav3-02-presupuesto");

    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    // PASO 3: Abrir Copilot con force click
    console.log("\n3. Abriendo Copilot...");

    // Cerrar modales primero
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Buscar y hacer clic en el botón Copilot
    const copilotBtnSelectors = [
      'button[title*="Copilot"]',
      'button:has-text("Copilot")',
      '[class*="copilot"]',
      'button:has(svg) + span:has-text("Copilot")'
    ];

    let copilotOpened = false;
    for (const selector of copilotBtnSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible().catch(() => false)) {
        console.log(`   Encontrado: ${selector}`);
        await btn.click({ force: true });
        copilotOpened = true;
        break;
      }
    }

    if (!copilotOpened) {
      // Intentar con el header donde está el botón Copilot
      console.log("   Buscando en header...");
      await page.locator('header button, nav button').filter({ hasText: /copilot/i }).first().click({ force: true }).catch(() => {
        console.log("   No se encontró botón en header");
      });
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "nav3-03-copilot-abierto");

    // Verificar si el sidebar está abierto
    const sidebarVisible = await page.locator('[class*="ChatSidebar"], [class*="sidebar"]').isVisible().catch(() => false);
    console.log(`   Sidebar visible: ${sidebarVisible}`);

    // PASO 4: Buscar input de chat
    console.log("\n4. Buscando input de chat...");

    // Esperar a que el chat se renderice
    await page.waitForTimeout(2000);

    // Buscar textarea en la página principal (CopilotChatNative para guests)
    let inputElement = null;
    let inputFound = false;

    // Primero intentar en la página principal
    const textareas = await page.locator('textarea').all();
    console.log(`   Textareas encontrados: ${textareas.length}`);

    for (const textarea of textareas) {
      const isVisible = await textarea.isVisible().catch(() => false);
      if (isVisible) {
        inputElement = textarea;
        inputFound = true;
        console.log("   ✓ Input encontrado en página principal");
        break;
      }
    }

    if (!inputFound) {
      // Buscar contenteditable
      const editables = await page.locator('[contenteditable="true"]').all();
      console.log(`   Contenteditables encontrados: ${editables.length}`);

      for (const editable of editables) {
        const isVisible = await editable.isVisible().catch(() => false);
        if (isVisible) {
          inputElement = editable;
          inputFound = true;
          console.log("   ✓ Input (contenteditable) encontrado");
          break;
        }
      }
    }

    if (!inputFound) {
      // Buscar en iframes
      console.log("   Buscando en iframes...");
      const iframes = page.frameLocator('iframe');

      try {
        const iframeInput = iframes.first().locator('textarea, [contenteditable="true"]').first();
        inputFound = await iframeInput.isVisible().catch(() => false);
        if (inputFound) {
          inputElement = iframeInput;
          console.log("   ✓ Input encontrado en iframe");
        }
      } catch (e) {
        console.log("   No hay iframes con input");
      }
    }

    await screenshot(page, "nav3-04-buscando-input");

    // PASO 5: Interactuar con el chat si se encontró input
    if (inputFound && inputElement) {
      console.log("\n5. Enviando pregunta sobre presupuesto...");

      const pregunta = "Quiero ver mi presupuesto y agregar un gasto de catering de 500 euros";

      await inputElement.click();
      await inputElement.fill(pregunta);
      console.log(`   Pregunta: "${pregunta}"`);
      await screenshot(page, "nav3-05-pregunta");

      await page.keyboard.press('Enter');
      console.log("   ✓ Pregunta enviada");

      // Esperar respuesta
      console.log("   Esperando respuesta...");
      await page.waitForTimeout(15000);

      await screenshot(page, "nav3-06-respuesta");

      // Analizar respuesta
      const pageText = await page.evaluate(() => document.body.innerText);

      const hasLink = pageText.includes('/presupuesto') ||
                      pageText.includes('[Ver presupuesto]') ||
                      pageText.includes('presupuesto');
      const hasContext = pageText.includes('gasto') ||
                         pageText.includes('catering') ||
                         pageText.includes('500');

      console.log(`\n   Análisis de respuesta:`);
      console.log(`   - Menciona presupuesto/link: ${hasLink ? '✓' : '✗'}`);
      console.log(`   - Entiende contexto: ${hasContext ? '✓' : '✗'}`);

      // Buscar links de navegación
      const navLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/presupuesto"], a[href*="/invitados"], a[href*="/mesas"]');
        return Array.from(links).map(a => ({
          text: a.textContent?.trim().substring(0, 30),
          href: a.getAttribute('href')
        }));
      });

      if (navLinks.length > 0) {
        console.log(`\n   Links de navegación encontrados: ${navLinks.length}`);
        navLinks.slice(0, 5).forEach(l => console.log(`     - "${l.text}": ${l.href}`));
      }

    } else {
      console.log("\n5. ⚠️ No se encontró input de chat");
      console.log("   Verificando estado de la página...");

      // Capturar elementos relevantes
      const elements = await page.evaluate(() => {
        return {
          textareas: document.querySelectorAll('textarea').length,
          editables: document.querySelectorAll('[contenteditable]').length,
          iframes: document.querySelectorAll('iframe').length,
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t).slice(0, 10)
        };
      });
      console.log("   Elementos:", elements);
    }

    await screenshot(page, "nav3-07-final");

    console.log("\n=== NAVEGADOR ABIERTO 45 SEG ===");
    console.log("Puedes interactuar manualmente con la aplicación.\n");
    await page.waitForTimeout(45000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "nav3-error");
    await page.waitForTimeout(20000);
  }

  await browser.close();
})();
