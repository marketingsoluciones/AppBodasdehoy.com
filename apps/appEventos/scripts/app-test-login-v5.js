const { chromium } = require("playwright");

const screenshot = async (page, name) => {
  const path = `/tmp/app-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 ${path}`);
};

(async () => {
  console.log("=== TEST APP-TEST V5 - LOGIN CORRECTO + COPILOT ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
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

    await page.waitForTimeout(5000);
    await screenshot(page, "V5-01-inicio");

    // ==========================================
    // PASO 2: Verificar estado actual de auth
    // ==========================================
    console.log("\n2. Verificando estado de autenticación...");

    const authStatus = await page.evaluate(() => {
      // Buscar el avatar en el header
      const avatarElements = document.querySelectorAll('[class*="avatar"], [class*="Avatar"], [class*="profile"]');
      let avatarText = '';
      let avatarFound = false;

      avatarElements.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length <= 3) {
          avatarText = text;
          avatarFound = true;
        }
      });

      // Verificar si hay nombre de usuario visible
      const body = document.body.innerText || '';
      const isGuest = avatarText === 'G' || avatarText === '' || body.includes('Guest');
      const hasEvents = body.includes('Mis eventos') || body.includes('eventos');

      return {
        avatarText,
        avatarFound,
        isGuest,
        hasEvents,
        isLoggedIn: !isGuest && hasEvents,
        bodyPreview: body.substring(0, 200)
      };
    });

    console.log(`   Avatar: "${authStatus.avatarText}", isGuest: ${authStatus.isGuest}, isLoggedIn: ${authStatus.isLoggedIn}`);

    // ==========================================
    // PASO 3: Hacer login si es Guest
    // ==========================================
    if (authStatus.isGuest || !authStatus.isLoggedIn) {
      console.log("\n3. Usuario es Guest, realizando login...");

      // Método 1: Usar el endpoint de desarrollo
      console.log("   Intentando login via /api/dev/refresh-session...");

      const loginResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/dev/refresh-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'bodasdehoy.com@gmail.com' }),
            credentials: 'include'
          });

          const data = await response.json();
          return {
            success: data.success,
            status: response.status,
            message: data.message || data.error,
            hint: data.hint
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      console.log(`   Login API result: ${JSON.stringify(loginResult)}`);

      if (loginResult.success) {
        console.log("   ✓ Login exitoso via API! Recargando página...");
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
      } else {
        console.log("   ⚠️ Login API falló, intentando login por formulario...");

        // Verificar si hay formulario de login
        const hasLoginForm = await page.evaluate(() => {
          return !!document.querySelector('input[type="email"], input[name="email"]');
        });

        if (hasLoginForm) {
          console.log("   Formulario de login encontrado, completando...");

          // Completar formulario
          await page.fill('input[type="email"], input[name="email"]', 'bodasdehoy.com@gmail.com');
          await page.waitForTimeout(500);

          const hasPassword = await page.$('input[type="password"]');
          if (hasPassword) {
            await page.fill('input[type="password"]', 'test123456');
            await page.waitForTimeout(500);
          }

          // Buscar botón de submit
          const submitBtn = await page.$('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar")');
          if (submitBtn) {
            await submitBtn.click();
            console.log("   Formulario enviado, esperando respuesta...");
            await page.waitForTimeout(10000);
          }
        } else {
          // Intentar con Google Sign-In si está disponible
          const googleBtn = await page.$('button:has-text("Google"), [class*="google"]');
          if (googleBtn) {
            console.log("   Botón de Google encontrado (requiere interacción manual)");
          }
        }
      }

      await screenshot(page, "V5-02-after-login-attempt");

      // Verificar estado después del login
      const afterLogin = await page.evaluate(() => {
        const avatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
        let avatarText = '';
        avatars.forEach(el => {
          const text = el.innerText?.trim();
          if (text && text.length <= 3) avatarText = text;
        });

        return {
          avatarText,
          isGuest: avatarText === 'G' || avatarText === '',
          url: window.location.href
        };
      });

      console.log(`   Después de login: avatar="${afterLogin.avatarText}", isGuest=${afterLogin.isGuest}`);

      if (afterLogin.isGuest) {
        console.log("\n   ⚠️ TODAVÍA COMO GUEST - El login no funcionó");
        console.log("   Posibles causas:");
        console.log("   - El endpoint /api/dev/refresh-session requiere backend activo");
        console.log("   - Las cookies no se están estableciendo correctamente");
        console.log("   - El usuario no existe en el backend");

        // Mostrar cookies actuales
        const cookies = await context.cookies();
        console.log(`\n   Cookies actuales (${cookies.length}):`);
        cookies.forEach(c => {
          if (c.name.includes('session') || c.name.includes('token') || c.name.includes('Bodas')) {
            console.log(`     - ${c.name}: ${c.value.substring(0, 30)}...`);
          }
        });
      }
    } else {
      console.log("\n3. Usuario ya está logueado, continuando...");
    }

    await screenshot(page, "V5-03-estado-auth");

    // ==========================================
    // PASO 4: Abrir Copilot
    // ==========================================
    console.log("\n4. Abriendo Copilot...");

    // Buscar el botón Copilot en el header
    const copilotBtn = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.innerText?.trim() === 'Copilot') {
          const rect = el.getBoundingClientRect();
          if (rect.y < 80 && rect.width > 0) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
      }
      return null;
    });

    if (copilotBtn) {
      await page.mouse.click(copilotBtn.x, copilotBtn.y);
      console.log("   Click en Copilot realizado");
    } else {
      console.log("   Botón Copilot no encontrado, intentando por coordenadas...");
      await page.mouse.click(900, 30);
    }

    await page.waitForTimeout(8000);
    await screenshot(page, "V5-04-copilot-abierto");

    // ==========================================
    // PASO 5: Interactuar con el chat
    // ==========================================
    console.log("\n5. Interactuando con el chat...");

    // Buscar el frame del chat
    const frames = page.frames();
    let chatFrame = null;

    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('chat-test') || url.includes('copilot')) {
        chatFrame = frame;
        console.log(`   Frame del chat: ${url.substring(0, 60)}`);
        break;
      }
    }

    if (chatFrame) {
      // Verificar estado del chat
      const chatStatus = await chatFrame.evaluate(() => {
        const body = document.body?.innerText || '';
        const hasError = body.includes('Error de conexión') || body.includes('Backend IA');
        const contentEditable = document.querySelector('[contenteditable="true"]');

        return {
          hasError,
          hasInput: !!contentEditable,
          preview: body.substring(0, 200)
        };
      });

      console.log(`   Chat status: error=${chatStatus.hasError}, hasInput=${chatStatus.hasInput}`);

      if (chatStatus.hasError) {
        console.log("   ❌ Error de conexión con Backend IA detectado");

        // Intentar click en Reintentar
        await chatFrame.evaluate(() => {
          const btns = document.querySelectorAll('button, span, div');
          for (const btn of btns) {
            if (btn.innerText?.includes('Reintentar')) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        await page.waitForTimeout(5000);
      }

      if (chatStatus.hasInput) {
        // Usar frameLocator para interactuar
        const frameLocator = page.frameLocator('iframe[src*="chat-test"]');
        const input = frameLocator.locator('[contenteditable="true"]').first();

        try {
          await input.click({ timeout: 5000 });
          await page.waitForTimeout(500);

          const mensaje = 'Hola! Cuales son los mejores proveedores de catering para bodas?';
          await input.type(mensaje, { delay: 30 });
          console.log(`   ✓ Mensaje escrito: "${mensaje}"`);

          await page.waitForTimeout(1000);
          await screenshot(page, "V5-05-mensaje-escrito");

          // Enviar con botón o Enter
          const sendBtn = frameLocator.locator('button').last();
          const btnVisible = await sendBtn.isVisible().catch(() => false);

          if (btnVisible) {
            await sendBtn.click();
            console.log("   ✓ Mensaje enviado!");
          } else {
            await input.press('Enter');
            console.log("   Enviado con Enter");
          }

          await page.waitForTimeout(3000);
          await screenshot(page, "V5-06-mensaje-enviado");

        } catch (e) {
          console.log(`   Error con input: ${e.message}`);
        }
      }
    } else {
      console.log("   ❌ No se encontró frame del chat");
    }

    // ==========================================
    // PASO 6: Esperar respuesta
    // ==========================================
    console.log("\n6. Esperando respuesta (60 seg)...");

    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(15000);
      console.log(`   ${(i + 1) * 15} segundos...`);
      await screenshot(page, `V5-07-espera-${(i + 1) * 15}s`);

      if (chatFrame) {
        const status = await chatFrame.evaluate(() => {
          const body = document.body?.innerText || '';
          return {
            hasError: body.includes('No enabled providers') || body.includes('error occurred'),
            length: body.length
          };
        }).catch(() => ({}));

        if (status.hasError) {
          console.log("   ❌ Error detectado en respuesta");
          break;
        }
      }
    }

    await screenshot(page, "V5-08-final");

    // ==========================================
    // PASO 7: Resumen
    // ==========================================
    console.log("\n7. Resumen de la prueba:");

    const finalStatus = await page.evaluate(() => {
      const avatars = document.querySelectorAll('[class*="avatar"], [class*="Avatar"]');
      let avatarText = '';
      avatars.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length <= 3) avatarText = text;
      });

      return {
        url: window.location.href,
        avatarText,
        isGuest: avatarText === 'G'
      };
    });

    console.log(`   URL: ${finalStatus.url}`);
    console.log(`   Avatar: "${finalStatus.avatarText}"`);
    console.log(`   Es Guest: ${finalStatus.isGuest}`);

    if (finalStatus.isGuest) {
      console.log("\n   ⚠️ PROBLEMA: El usuario sigue como Guest");
      console.log("   El login no funcionó correctamente.");
      console.log("   Posibles soluciones:");
      console.log("   1. Verificar que el backend api-ia esté funcionando");
      console.log("   2. Verificar endpoint /api/auth/identify-user");
      console.log("   3. Login manual con credenciales reales");
    }

    console.log("\n=== NAVEGADOR ABIERTO 2 MINUTOS ===\n");
    await page.waitForTimeout(120000);

  } catch (error) {
    console.log("\n❌ Error:", error.message);
    await screenshot(page, "V5-error");
    await page.waitForTimeout(60000);
  }

  await browser.close();
})();
