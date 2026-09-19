import { chromium, Browser, Page } from 'playwright';

const URLS = {
  appTest: 'https://app-test.bodasdehoy.com',
  chatTest: 'https://chat-test.bodasdehoy.com',
};

const CREDENTIALS = {
  email: 'bodasdehoy.com@gmail.com',
  password: (process.env.TEST_USER_PASSWORD || ''),
};

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function visualTest() {
  console.log('🚀 Iniciando test visual...\n');

  const browser: Browser = await chromium.launch({
    headless: false, // Modo visual - puedes ver el navegador
    slowMo: 500, // Ralentiza las acciones para que puedas ver
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page: Page = await context.newPage();

  try {
    // 1. Navegar a app-test
    console.log('📍 Navegando a app-test.bodasdehoy.com...');
    await page.goto(URLS.appTest, { waitUntil: 'networkidle' });
    await delay(2000);

    // 2. Verificar que la página cargó
    const title = await page.title();
    console.log(`✅ Página cargada: ${title}`);

    // 3. Ir a login
    console.log('📍 Navegando a página de login...');
    await page.goto(`${URLS.appTest}/login`, { waitUntil: 'networkidle' });
    await delay(2000);

    // 4. Buscar campos de login
    console.log('🔍 Buscando campos de login...');

    // Esperar a que los campos estén visibles
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    if (await emailInput.isVisible()) {
      console.log('✅ Campo de email encontrado');

      // Llenar credenciales
      console.log('✍️ Ingresando credenciales...');
      await emailInput.fill(CREDENTIALS.email);
      await delay(500);

      await passwordInput.fill(CREDENTIALS.password);
      await delay(500);

      // Buscar botón de submit
      const submitButton = page.locator('button[type="submit"]').first();

      if (await submitButton.isVisible()) {
        console.log('🔘 Haciendo clic en iniciar sesión...');
        await submitButton.click();

        // Esperar respuesta
        console.log('⏳ Esperando respuesta del servidor...');
        await delay(5000);

        // Verificar resultado
        const currentUrl = page.url();
        console.log(`📍 URL actual: ${currentUrl}`);

        if (!currentUrl.includes('/login')) {
          console.log('✅ ¡Login exitoso! Redirigido fuera de /login');
        } else {
          console.log('⚠️ Aún en página de login - verificar errores');

          // Buscar mensajes de error
          const errorMessage = page.locator('.text-red, .error, [class*="error"]');
          if (await errorMessage.count() > 0) {
            const errorText = await errorMessage.first().textContent();
            console.log(`❌ Error: ${errorText}`);
          }
        }
      }
    } else {
      console.log('⚠️ Campo de email no visible, verificando página...');

      // Quizás ya está logueado
      const userMenu = page.locator('[class*="profile"], [class*="user"], [class*="avatar"]');
      if (await userMenu.count() > 0) {
        console.log('✅ Usuario ya está logueado');
      }
    }

    // Mantener navegador abierto para inspección
    console.log('\n👀 Navegador abierto para inspección manual...');
    console.log('   Presiona Ctrl+C para cerrar\n');

    // Esperar indefinidamente (hasta que el usuario cierre)
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
visualTest().catch(console.error);
