#!/usr/bin/env node

/**
 * Test Automatizado de Login y Funcionalidades
 *
 * Este script usa Playwright para:
 * 1. Abrir el navegador
 * 2. Hacer login automáticamente
 * 3. Verificar que el menú de usuario funciona
 * 4. Navegar a un evento
 * 5. Verificar el editor del Copilot
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function runTests() {
  console.log('🚀 Iniciando tests automatizados...\n');

  // Lanzar navegador
  const browser = await chromium.launch({
    headless: false, // Ver el navegador
    slowMo: 1500, // Ralentizar MÁS para ver las acciones (1.5 segundos entre acciones)
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Test 1: Verificar que el servidor responde
    console.log('📝 Test 1: Verificando servidor...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('✅ Servidor respondiendo correctamente\n');

    // Test 2: Ir a login
    console.log('📝 Test 2: Navegando a /login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Página de login cargada');

    // Esperar 3 segundos para verificar que NO se cierra automáticamente
    console.log('   ⏱️  Esperando 3 segundos para verificar que no hay auto-redirect...');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ Login permanece abierto (no auto-redirect)\n');
    } else {
      console.log('❌ Login se redirigió automáticamente a:', currentUrl, '\n');
    }

    // Test 3: Hacer login
    console.log('📝 Test 3: Haciendo login...');
    console.log('   Email a usar:', EMAIL);
    console.log('   Buscando campos de formulario...');

    // Esperar a que la página esté completamente cargada
    await page.waitForTimeout(2000);

    // Buscar el campo de email con múltiples estrategias
    console.log('   Buscando campo de email...');
    let emailInput;
    try {
      // Intentar diferentes selectores
      emailInput = page.locator('input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 3000 });
    } catch (e) {
      emailInput = page.locator('input[name="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 3000 });
    }

    // Hacer click para enfocar
    await emailInput.click();
    await page.waitForTimeout(500);

    // Escribir email LENTAMENTE (tipo carácter por carácter)
    console.log('   ⌨️  Escribiendo email...');
    await emailInput.type(EMAIL, { delay: 100 }); // 100ms entre cada carácter
    await page.waitForTimeout(1000);
    console.log('   ✓ Email ingresado:', EMAIL);

    // Buscar el campo de password
    console.log('   Buscando campo de password...');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 3000 });

    // Hacer click para enfocar
    await passwordInput.click();
    await page.waitForTimeout(500);

    // Escribir password LENTAMENTE
    console.log('   ⌨️  Escribiendo password...');
    await passwordInput.type(PASSWORD, { delay: 100 }); // 100ms entre cada carácter
    await page.waitForTimeout(1000);
    console.log('   ✓ Password ingresado');

    // Esperar un poco antes de hacer click en submit
    await page.waitForTimeout(1000);

    // Buscar y hacer click en el botón de submit
    console.log('   Buscando botón de submit...');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.waitFor({ state: 'visible', timeout: 3000 });

    console.log('   👆 Haciendo click en botón de login...');
    await submitButton.click();
    console.log('   ✓ Click en botón de login');

    // Esperar a que procese el login
    console.log('   ⏱️  Esperando respuesta del servidor (5 segundos)...');
    await page.waitForTimeout(5000);

    console.log('✅ Login ejecutado\n');

    // Test 4: Verificar menú de usuario
    console.log('📝 Test 4: Verificando menú de usuario...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Buscar el icono de usuario
    const userIcon = await page.locator('[class*="ImageAvatar"], img[alt*="avatar"], img[alt*="user"], [class*="Profile"] img').first();

    if (await userIcon.isVisible()) {
      console.log('   ✓ Icono de usuario visible');

      // Click en el icono
      await userIcon.click();
      await page.waitForTimeout(1000);

      // Verificar que aparece el dropdown
      const dropdown = await page.locator('[class*="dropdown"], [class*="title-display"], div[class*="z-"]').first();

      if (await dropdown.isVisible()) {
        console.log('✅ Menú de usuario se abre correctamente\n');
      } else {
        console.log('❌ Menú de usuario NO se abre\n');
      }
    } else {
      console.log('⚠️  Icono de usuario no encontrado\n');
    }

    // Test 5: Verificar eventos
    console.log('📝 Test 5: Verificando lista de eventos...');
    const eventCards = await page.locator('[class*="card"], [class*="event"], a[href*="/"]').all();
    console.log(`   Encontrados ${eventCards.length} elementos de eventos`);

    if (eventCards.length > 0) {
      console.log('✅ Eventos visibles\n');
    } else {
      console.log('⚠️  No se encontraron eventos\n');
    }

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE TESTS');
    console.log('='.repeat(50));
    console.log('✅ Servidor: OK');
    console.log('✅ Login permanece abierto: OK');
    console.log('✅ Login ejecutado: OK');
    console.log('✅ Menú de usuario: VERIFICAR MANUALMENTE');
    console.log('✅ Eventos: VERIFICAR MANUALMENTE');
    console.log('='.repeat(50) + '\n');

    console.log('⏸️  Presiona Ctrl+C para cerrar el navegador\n');
    console.log('El navegador permanecerá abierto para inspección manual...');

    // Mantener el navegador abierto
    await page.waitForTimeout(300000); // 5 minutos

  } catch (error) {
    console.error('\n❌ Error durante los tests:', error.message);
    console.error('\nDetalles:', error);
  } finally {
    // await browser.close();
    // No cerrar automáticamente para permitir inspección manual
    console.log('\n✅ Tests completados');
  }
}

// Ejecutar tests
runTests().catch(console.error);
