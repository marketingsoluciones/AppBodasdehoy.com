#!/usr/bin/env node

/**
 * Test de Login con Limpieza Completa de Sesión
 *
 * Este script limpia TODA la sesión de Firebase antes de hacer login
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function runTests() {
  console.log('🚀 Test de Login con Limpieza Completa\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // 1 segundo entre acciones
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log('📝 Paso 1: Limpiando TODA la sesión anterior...');

    // Ir a la página para poder acceder al localStorage
    await page.goto(BASE_URL);

    // Limpiar TODO el almacenamiento
    await page.evaluate(() => {
      // Limpiar localStorage
      localStorage.clear();
      // Limpiar sessionStorage
      sessionStorage.clear();
      // Limpiar IndexedDB de Firebase
      if (window.indexedDB) {
        const dbs = ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database'];
        dbs.forEach(dbName => {
          try {
            window.indexedDB.deleteDatabase(dbName);
          } catch (e) {
            console.log('No se pudo eliminar', dbName);
          }
        });
      }
    });

    // Limpiar cookies
    await context.clearCookies();

    console.log('   ✅ Almacenamiento limpiado');
    await page.waitForTimeout(2000);

    console.log('\n📝 Paso 2: Navegando a /login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Página cargada');

    // Esperar 3 segundos y verificar que NO redirige
    console.log('   ⏱️  Esperando 3s para verificar que permanece en /login...');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('   ⚠️  ADVERTENCIA: Se redirigió a:', currentUrl);
      console.log('   🔄 Volviendo a /login...');
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    } else {
      console.log('   ✅ Permanece en /login');
    }

    console.log('\n📝 Paso 3: Llenando formulario de login...');

    // Esperar a que el formulario esté completamente cargado
    await page.waitForTimeout(2000);

    // Buscar el campo de email
    console.log('   Buscando campo de email...');
    const emailInput = page.locator('input[type="email"]').first();

    try {
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      console.log('   ✅ Campo de email encontrado');
    } catch (e) {
      console.log('   ❌ No se encontró el campo de email');
      // Tomar screenshot para debugging
      await page.screenshot({ path: 'login-error.png' });
      console.log('   📸 Screenshot guardado en: login-error.png');
      throw e;
    }

    // Click y escribir email
    await emailInput.click();
    await page.waitForTimeout(500);
    console.log('   ⌨️  Escribiendo email...');

    // Escribir carácter por carácter
    for (const char of EMAIL) {
      await emailInput.pressSequentially(char);
      await page.waitForTimeout(80);
    }

    console.log('   ✅ Email ingresado:', EMAIL);
    await page.waitForTimeout(1000);

    // Buscar el campo de password
    console.log('   Buscando campo de password...');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✅ Campo de password encontrado');

    // Click y escribir password
    await passwordInput.click();
    await page.waitForTimeout(500);
    console.log('   ⌨️  Escribiendo password...');

    // Escribir password carácter por carácter
    for (const char of PASSWORD) {
      await passwordInput.pressSequentially(char);
      await page.waitForTimeout(80);
    }

    console.log('   ✅ Password ingresado');
    await page.waitForTimeout(1000);

    // Buscar botón de submit
    console.log('   Buscando botón de submit...');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✅ Botón encontrado');

    console.log('\n📝 Paso 4: Enviando formulario...');
    await submitButton.click();
    console.log('   ✅ Click realizado');

    // Esperar respuesta (puede tardar un poco)
    console.log('   ⏱️  Esperando respuesta del servidor (8 segundos)...');
    await page.waitForTimeout(8000);

    // Verificar si hubo redirección exitosa
    const finalUrl = page.url();
    console.log('   URL final:', finalUrl);

    if (finalUrl !== `${BASE_URL}/login`) {
      console.log('   ✅ Login exitoso - redirigió a:', finalUrl);
    } else {
      console.log('   ⚠️  Aún en /login - puede haber error de credenciales');
      await page.screenshot({ path: 'login-after-submit.png' });
      console.log('   📸 Screenshot guardado en: login-after-submit.png');
    }

    console.log('\n📝 Paso 5: Verificando sesión...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar icono de usuario
    const userIcon = page.locator('[class*="ImageAvatar"], [class*="Profile"]').first();
    const isUserIconVisible = await userIcon.isVisible().catch(() => false);

    if (isUserIconVisible) {
      console.log('   ✅ Usuario logueado - icono visible');

      console.log('\n📝 Paso 6: Probando menú de usuario...');
      await userIcon.click();
      await page.waitForTimeout(1500);

      const dropdown = page.locator('[class*="title-display"]').first();
      const isDropdownVisible = await dropdown.isVisible().catch(() => false);

      if (isDropdownVisible) {
        console.log('   ✅ Menú de usuario se abre correctamente');
      } else {
        console.log('   ❌ Menú de usuario NO se abre');
      }
    } else {
      console.log('   ❌ No se detectó usuario logueado');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTS COMPLETADOS');
    console.log('='.repeat(60));
    console.log('\n⏸️  El navegador permanecerá abierto 2 minutos para inspección...');
    console.log('   Presiona Ctrl+C para cerrar antes\n');

    // Mantener abierto 2 minutos
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Screenshot de error guardado en: error-screenshot.png');

    // Mantener el navegador abierto para ver el error
    console.log('\n⏸️  Navegador abierto para inspección (1 minuto)...');
    await page.waitForTimeout(60000);
  } finally {
    await browser.close();
    console.log('\n👋 Navegador cerrado');
  }
}

runTests().catch(console.error);
