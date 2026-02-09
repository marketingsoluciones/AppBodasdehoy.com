#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function runTests() {
  console.log('🚀 Test de Login con Flag de Debugging\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('📝 Paso 1: Navegando a /login con flag debug-no-redirect=1...');
    await page.goto(`${BASE_URL}/login?debug-no-redirect=1`, { waitUntil: 'networkidle' });
    console.log('   ✅ Página cargada\n');

    console.log('⏱️  Esperando 5 segundos para verificar que NO hay redirect...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`   📍 URL actual: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('   ✅ ¡ÉXITO! Permanece en /login sin redirect\n');
    } else {
      console.log(`   ❌ FALLÓ: Se redirigió a ${currentUrl}\n`);
      throw new Error('Redirect ocurrió a pesar del flag de debugging');
    }

    // Buscar campos del formulario
    console.log('📝 Paso 2: Verificando que los campos del formulario son visibles...');

    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000, state: 'visible' });
    console.log('   ✅ Campo de email encontrado');

    const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 5000, state: 'visible' });
    console.log('   ✅ Campo de password encontrado\n');

    // Llenar formulario
    console.log('📝 Paso 3: Llenando formulario...');
    await emailInput.fill(EMAIL);
    console.log(`   ✅ Email: ${EMAIL}`);

    await passwordInput.fill(PASSWORD);
    console.log(`   ✅ Password: ${'*'.repeat(PASSWORD.length)}\n`);

    // Buscar botón de submit
    console.log('📝 Paso 4: Buscando botón de submit...');
    const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000, state: 'visible' });
    const buttonText = await submitButton.textContent();
    console.log(`   ✅ Botón encontrado: "${buttonText?.trim()}"\n`);

    console.log('📝 Paso 5: Clickeando botón de login...');
    await submitButton.click();
    console.log('   ✅ Botón clickeado');

    // Esperar respuesta
    console.log('   ⏱️  Esperando respuesta del servidor (10s)...\n');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    console.log(`   📍 URL final: ${finalUrl}`);

    // Verificar si hay errores
    const hasError = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
      return errorElements.length > 0;
    });

    if (hasError) {
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
        return Array.from(errorElements).map(el => el.textContent).join(', ');
      });
      console.log(`   ⚠️  Errores encontrados: ${errorText}`);
    }

    // Si aún estamos en /login, podría ser error de credenciales
    // Si estamos en /, el login fue exitoso
    if (finalUrl === `${BASE_URL}/`) {
      console.log('   ✅ Login exitoso - Redirigido a home\n');

      // Verificar menú de usuario
      console.log('📝 Paso 6: Verificando menú de usuario...');
      const userMenu = await page.evaluate(() => {
        return document.querySelector('[alt*="avatar"], [class*="profile"], [class*="user"]') !== null;
      });

      if (userMenu) {
        console.log('   ✅ Menú de usuario visible');
      } else {
        console.log('   ⚠️  Menú de usuario no encontrado');
      }
    } else if (finalUrl.includes('/login')) {
      console.log('   ⚠️  Aún en /login - Verificar credenciales o revisar logs\n');
    }

    console.log('\n⏸️  Navegador abierto para inspección (30 segundos)...');
    await page.waitForTimeout(30000);

    console.log('\n✅ Test completado');

  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    console.log('📸 Tomando screenshot...');
    await page.screenshot({ path: 'test-debug-error.png', fullPage: true });

    console.log('\n⏸️  Navegador abierto para inspección del error (30 segundos)...');
    await page.waitForTimeout(30000);
  } finally {
    console.log('\n👋 Cerrando navegador');
    await context.close();
    await browser.close();
  }
}

runTests().catch(console.error);
