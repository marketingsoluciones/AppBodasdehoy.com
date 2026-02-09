#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function runTests() {
  console.log('🚀 Test de Login con Modo Incógnito\n');

  // Lanzar navegador en modo incógnito (nueva sesión limpia)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1500,
  });

  // Crear contexto de incógnito (garantiza sesión completamente limpia)
  const context = await browser.newContext({
    // Modo incógnito: no cookies, no cache, no localStorage previo
    storageState: undefined,
  });

  const page = await context.newPage();

  // Configurar viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('📝 Paso 1: Navegador en modo incógnito (sesión limpia garantizada)');
    console.log('   ✅ Sin cookies previas');
    console.log('   ✅ Sin localStorage previo');
    console.log('   ✅ Sin sessionStorage previo');
    console.log('   ✅ Sin IndexedDB previo\n');

    // ====================
    // PASO 2: Navegar a login y verificar que NO redirige
    // ====================
    console.log('📝 Paso 2: Navegando a /login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    console.log('   ✅ Página cargada');

    // Esperar 5 segundos y verificar que seguimos en /login
    console.log('   ⏱️  Esperando 5s para verificar que permanece en /login...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (currentUrl !== `${BASE_URL}/login`) {
      console.log('   ❌ FALLÓ: Se redirigió a:', currentUrl);
      console.log('   📸 Tomando screenshot...');
      await page.screenshot({ path: 'login-redirect-error.png', fullPage: true });

      // Intentar volver a login
      console.log('   🔄 Intentando volver a /login...');
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const urlDespuesDeVolver = page.url();
      if (urlDespuesDeVolver !== `${BASE_URL}/login`) {
        console.log('   ❌ FALLÓ NUEVAMENTE: Se redirigió a:', urlDespuesDeVolver);
        throw new Error('No se puede mantener en /login - redirect automático activo');
      }
      console.log('   ✅ Ahora sí permanece en /login');
    } else {
      console.log('   ✅ Permanece correctamente en /login\n');
    }

    // ====================
    // PASO 3: Buscar campos del formulario
    // ====================
    console.log('📝 Paso 3: Buscando campos del formulario...');

    // Intentar varios selectores posibles para el email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="correo" i]',
      '#email',
      'input[autocomplete="email"]'
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        console.log(`   Intentando selector: ${selector}`);
        emailInput = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (emailInput) {
          console.log(`   ✅ Campo de email encontrado con: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  No encontrado con: ${selector}`);
      }
    }

    if (!emailInput) {
      console.log('   ❌ No se encontró el campo de email con ningún selector');
      console.log('   📸 Tomando screenshot...');
      await page.screenshot({ path: 'login-no-email-field.png', fullPage: true });

      // Imprimir HTML de la página para debugging
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log('   📄 HTML de la página (primeros 500 caracteres):');
      console.log(bodyHTML.substring(0, 500));

      throw new Error('Campo de email no encontrado');
    }

    // Intentar varios selectores posibles para el password
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="contraseña" i]',
      'input[placeholder*="password" i]',
      '#password',
      'input[autocomplete="current-password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        console.log(`   Intentando selector: ${selector}`);
        passwordInput = await page.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (passwordInput) {
          console.log(`   ✅ Campo de password encontrado con: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  No encontrado con: ${selector}`);
      }
    }

    if (!passwordInput) {
      console.log('   ❌ No se encontró el campo de password con ningún selector');
      console.log('   📸 Tomando screenshot...');
      await page.screenshot({ path: 'login-no-password-field.png', fullPage: true });
      throw new Error('Campo de password no encontrado');
    }

    console.log('   ✅ Ambos campos encontrados\n');

    // ====================
    // PASO 4: Llenar formulario LENTAMENTE
    // ====================
    console.log('📝 Paso 4: Llenando formulario de login...');
    console.log(`   📧 Email: ${EMAIL}`);

    // Limpiar campo antes de escribir
    await emailInput.click({ clickCount: 3 }); // Seleccionar todo
    await page.keyboard.press('Backspace');

    // Escribir email carácter por carácter con delay visible
    for (let i = 0; i < EMAIL.length; i++) {
      await emailInput.pressSequentially(EMAIL[i]);
      await page.waitForTimeout(100); // 100ms entre caracteres
      // Mostrar progreso cada 5 caracteres
      if ((i + 1) % 5 === 0) {
        console.log(`   ⌨️  Escrito: ${EMAIL.substring(0, i + 1)}`);
      }
    }
    console.log(`   ✅ Email completo: ${EMAIL}`);

    console.log(`   🔒 Password: ${'*'.repeat(PASSWORD.length)}`);

    // Limpiar campo antes de escribir
    await passwordInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');

    // Escribir password carácter por carácter
    for (let i = 0; i < PASSWORD.length; i++) {
      await passwordInput.pressSequentially(PASSWORD[i]);
      await page.waitForTimeout(100);
      if ((i + 1) % 3 === 0) {
        console.log(`   🔑 Escrito: ${'*'.repeat(i + 1)}`);
      }
    }
    console.log(`   ✅ Password completo: ${'*'.repeat(PASSWORD.length)}\n`);

    // ====================
    // PASO 5: Buscar y clickear botón de login
    // ====================
    console.log('📝 Paso 5: Buscando botón de login...');

    const buttonSelectors = [
      'button[type="submit"]',
      'button:has-text("Iniciar")',
      'button:has-text("Login")',
      'button:has-text("Entrar")',
      'input[type="submit"]'
    ];

    let loginButton = null;
    for (const selector of buttonSelectors) {
      try {
        loginButton = await page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        if (loginButton) {
          const buttonText = await loginButton.textContent();
          console.log(`   ✅ Botón encontrado: "${buttonText?.trim()}"`);
          break;
        }
      } catch (e) {
        console.log(`   ⚠️  No encontrado con: ${selector}`);
      }
    }

    if (!loginButton) {
      console.log('   ⚠️  Botón no encontrado, intentando enviar formulario con Enter');
      await passwordInput.press('Enter');
    } else {
      console.log('   🖱️  Clickeando botón...');
      await loginButton.click();
    }

    console.log('   ⏱️  Esperando respuesta del servidor...\n');

    // ====================
    // PASO 6: Verificar login exitoso
    // ====================
    console.log('📝 Paso 6: Verificando login...');

    // Esperar a que algo cambie (redirect o mensaje de error)
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    console.log(`   📍 URL final: ${finalUrl}`);

    if (finalUrl.includes('/login')) {
      // Buscar mensajes de error
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
        return Array.from(errorElements).map(el => el.textContent).join(', ');
      });

      if (errorMessage) {
        console.log(`   ❌ Error de login: ${errorMessage}`);
      } else {
        console.log('   ⚠️  Aún en /login pero sin mensaje de error visible');
      }

      console.log('   📸 Screenshot del estado actual...');
      await page.screenshot({ path: 'login-after-submit.png', fullPage: true });
    } else {
      console.log('   ✅ Login exitoso - Redirigido fuera de /login');

      // Verificar si hay usuario en el menú
      const userMenu = await page.evaluate(() => {
        // Buscar elementos que indiquen usuario logueado
        const profileElements = document.querySelectorAll('[class*="profile"], [class*="user"], [alt*="avatar"]');
        return profileElements.length > 0;
      });

      if (userMenu) {
        console.log('   ✅ Menú de usuario visible');
      }
    }

    // ====================
    // PASO 7: Mantener navegador abierto para inspección
    // ====================
    console.log('\n⏸️  Navegador abierto para inspección (1 minuto)...');
    await page.waitForTimeout(60000);

    console.log('\n✅ Test completado');

  } catch (error) {
    console.error('\n❌ Error durante los tests:', error.message);
    console.log('📸 Screenshot de error...');
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });

    // Mantener navegador abierto para ver el error
    console.log('\n⏸️  Navegador abierto para inspección del error (1 minuto)...');
    await page.waitForTimeout(60000);
  } finally {
    console.log('\n👋 Cerrando navegador');
    await context.close();
    await browser.close();
  }
}

runTests().catch(console.error);
