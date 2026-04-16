const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST.BODASDEHOY.COM - COPILOT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    // Permitir permisos para notificaciones si es necesario
    permissions: ['notifications']
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Navegar a app-test
    // ==========================================
    console.log("1. Navegando a app-test.bodasdehoy.com...");
    await page.goto("https://app-test.bodasdehoy.com", {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    console.log("   Esperando carga inicial (10 seg)...");
    await page.waitForTimeout(10000);
    await screenshot(page, "01-inicio");

    // Verificar si estamos en login o dashboard
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    const pageState = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        hasLogin: body.includes('Iniciar sesión') || body.includes('Login') || body.includes('Correo'),
        hasDashboard: body.includes('Eventos') || body.includes('Dashboard') || body.includes('Resumen'),
        hasCopilot: !!document.querySelector('[class*="copilot"], [class*="chat"], iframe[src*="chat"]'),
        text: body.substring(0, 300)
      };
    });

    console.log(`   Estado: login=${pageState.hasLogin}, dashboard=${pageState.hasDashboard}, copilot=${pageState.hasCopilot}`);

    // ==========================================
    // PASO 2: Login si es necesario
    // ==========================================
    if (pageState.hasLogin || currentUrl.includes('login')) {
      console.log("\n2. Realizando login...");

      // Buscar campos de login
      const loginFields = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="correo"], input[placeholder*="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');

        return {
          hasEmail: !!emailInput,
          hasPassword: !!passInput,
          hasSubmit: !!submitBtn
        };
      });

      console.log(`   Campos encontrados: email=${loginFields.hasEmail}, pass=${loginFields.hasPassword}, submit=${loginFields.hasSubmit}`);

      if (loginFields.hasEmail && loginFields.hasPassword) {
        // Usar credenciales de test
        // TODO: Reemplazar con credenciales reales de test
        const testEmail = 'test@bodasdehoy.com';
        const testPass = 'test123';

        console.log(`   Escribiendo email: ${testEmail}`);
        await page.fill('input[type="email"], input[name="email"], input[placeholder*="correo"]', testEmail);
        await page.waitForTimeout(500);

        console.log("   Escribiendo password...");
        await page.fill('input[type="password"]', testPass);
        await page.waitForTimeout(500);

        await screenshot(page, "02-login-filled");

        // Click en submit
        console.log("   Haciendo click en submit...");
        await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');

        console.log("   Esperando respuesta de login (15 seg)...");
        await page.waitForTimeout(15000);
        await screenshot(page, "03-after-login");

        // Verificar si el login fue exitoso
        const afterLogin = await page.evaluate(() => {
          const body = document.body.innerText || '';
          return {
            hasError: body.includes('error') || body.includes('incorrecto') || body.includes('inválido'),
            hasDashboard: body.includes('Eventos') || body.includes('Dashboard') || body.includes('Resumen'),
            url: window.location.href
          };
        });

        console.log(`   Después de login: error=${afterLogin.hasError}, dashboard=${afterLogin.hasDashboard}`);
        console.log(`   URL: ${afterLogin.url}`);
      } else {
        console.log("   No se encontraron campos de login estándar");

        // Intentar login con Google si está disponible
        const googleBtn = await page.$('button:has-text("Google"), [class*="google"]');
        if (googleBtn) {
          console.log("   Botón de Google encontrado (login social disponible)");
        }
      }
    } else {
      console.log("\n2. Ya autenticado, saltando login...");
    }

    await screenshot(page, "04-estado-actual");

    // ==========================================
    // PASO 3: Buscar y activar Copilot
    // ==========================================
    console.log("\n3. Buscando Copilot...");

    // Buscar el botón/icono del Copilot
    const copilotInfo = await page.evaluate(() => {
      // Buscar iframe del copilot
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"]');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        return { type: 'iframe', x: rect.x, y: rect.y, width: rect.width, height: rect.height, visible: rect.width > 0 };
      }

      // Buscar botón flotante del copilot
      const floatBtn = document.querySelector('[class*="copilot"], [class*="chat-button"], [class*="assistant"]');
      if (floatBtn) {
        const rect = floatBtn.getBoundingClientRect();
        return { type: 'button', x: rect.x + rect.width/2, y: rect.y + rect.height/2, visible: true };
      }

      // Buscar en la barra lateral o navegación
      const navItems = document.querySelectorAll('nav *, [class*="sidebar"] *, [class*="menu"] *');
      for (const item of navItems) {
        const text = (item.innerText || '').toLowerCase();
        if (text.includes('copilot') || text.includes('asistente') || text.includes('chat')) {
          const rect = item.getBoundingClientRect();
          if (rect.width > 0) {
            return { type: 'nav', x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: item.innerText, visible: true };
          }
        }
      }

      return { type: 'not_found', visible: false };
    });

    console.log(`   Copilot encontrado: ${JSON.stringify(copilotInfo)}`);

    if (copilotInfo.type === 'button' || copilotInfo.type === 'nav') {
      console.log("   Haciendo click para abrir Copilot...");
      await page.mouse.click(copilotInfo.x, copilotInfo.y);
      await page.waitForTimeout(3000);
      await screenshot(page, "05-copilot-opened");
    } else if (copilotInfo.type === 'iframe' && copilotInfo.visible) {
      console.log("   Copilot ya visible como iframe");
    }

    // ==========================================
    // PASO 4: Interactuar con el Copilot
    // ==========================================
    console.log("\n4. Interactuando con Copilot...");

    // Verificar si hay un iframe del copilot
    const copilotFrame = page.frame({ url: /chat|copilot/ });

    if (copilotFrame) {
      console.log("   Copilot está en iframe, cambiando contexto...");

      // Buscar textarea en el iframe
      const textarea = await copilotFrame.$('textarea');
      if (textarea) {
        console.log("   Escribiendo mensaje en iframe...");
        await textarea.fill('Hola! Que servicios ofrece Bodas de Hoy para organizar mi boda?');
        await copilotFrame.waitForTimeout(1000);

        // Buscar botón de envío
        const sendBtn = await copilotFrame.$('button[type="submit"], button:has(svg)');
        if (sendBtn) {
          await sendBtn.click();
          console.log("   Mensaje enviado!");
        }
      }
    } else {
      // Buscar textarea en la página principal
      console.log("   Buscando textarea en la página principal...");

      const textareaFound = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        if (ta) {
          const rect = ta.getBoundingClientRect();
          return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
        }
        return { found: false };
      });

      if (textareaFound.found) {
        console.log("   Textarea encontrado, escribiendo mensaje...");
        await page.mouse.click(textareaFound.x, textareaFound.y);
        await page.waitForTimeout(500);
        await page.keyboard.type('Hola! Que servicios ofrece Bodas de Hoy para organizar mi boda?', { delay: 20 });
        await page.waitForTimeout(1000);
        await screenshot(page, "06-mensaje-escrito");

        // Buscar y hacer click en botón de envío
        const sendClicked = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            // Botón cerca del textarea, parte inferior
            if (rect.y > 700 && rect.x > 800 && rect.width < 80) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (sendClicked) {
          console.log("   Mensaje enviado!");
        } else {
          console.log("   Intentando Enter...");
          await page.keyboard.press('Enter');
        }
      } else {
        console.log("   No se encontró textarea del Copilot");
      }
    }

    await page.waitForTimeout(3000);
    await screenshot(page, "07-despues-envio");

    // ==========================================
    // PASO 5: Esperar respuesta
    // ==========================================
    console.log("\n5. Esperando respuesta del Copilot (60 seg)...");

    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i+1)*15} segundos...`);
      await screenshot(page, `08-espera-${(i+1)*15}s`);

      // Verificar si hay respuesta
      const status = await page.evaluate(() => {
        const body = document.body.innerText || '';
        const hasError = body.includes('error occurred') || body.includes('No enabled providers');
        const hasLoading = !!document.querySelector('[class*="loading"], [class*="typing"]');

        // Buscar contenido de respuesta
        const markdown = document.querySelectorAll('[class*="markdown"], [class*="message"]');
        let responseText = '';
        markdown.forEach(m => {
          if (m.innerText?.length > 100) {
            responseText = m.innerText;
          }
        });

        return {
          hasError,
          hasLoading,
          hasResponse: responseText.length > 100,
          preview: responseText.substring(0, 200)
        };
      });

      console.log(`   error=${status.hasError}, loading=${status.hasLoading}, response=${status.hasResponse}`);

      if (status.hasError) {
        console.log(`\n   ❌ Error: ${status.preview}`);
        break;
      }

      if (status.hasResponse && !status.hasLoading) {
        console.log("\n   ✓ Respuesta recibida!");
        console.log(`   Preview: ${status.preview}`);
        break;
      }
    }

    await screenshot(page, "09-final");

    // ==========================================
    // PASO 6: Capturar estado final
    // ==========================================
    console.log("\n6. Capturando estado final...");

    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyPreview: document.body.innerText?.substring(0, 500)
      };
    });

    console.log(`   URL: ${finalState.url}`);
    console.log(`   Title: ${finalState.title}`);

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
