#!/usr/bin/env node

/**
 * Test: Verificar que el link "Abrir Copilot Completo" funciona
 *
 * Prueba que:
 * 1. El sidebar del copilot se abre correctamente
 * 2. El link "Abrir Copilot Completo" existe
 * 3. El link tiene el href correcto (http://localhost:3210)
 * 4. El link tiene target="_blank" para abrir en nueva pestaña
 */

import { chromium } from '@playwright/test';

async function testCopilotLink() {
  console.log('🚀 Iniciando test del link del Copilot...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Ir a la página principal
    console.log('1️⃣ Navegando a http://localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ Página cargada\n');

    // 2. Abrir el sidebar del Copilot
    console.log('2️⃣ Abriendo sidebar del Copilot...');

    // Buscar el botón del copilot - puede tener diferentes selectores
    const copilotButton = await page.locator('button:has-text("Copilot"), [aria-label*="Copilot"], [title*="Copilot"]').first();

    if (await copilotButton.isVisible()) {
      await copilotButton.click();
      await page.waitForTimeout(1500);
      console.log('   ✅ Sidebar abierto\n');
    } else {
      console.log('   ⚠️  Botón Copilot no encontrado, el sidebar puede estar ya abierto\n');
    }

    // 3. Buscar el link "Abrir Copilot Completo"
    console.log('3️⃣ Verificando link "Abrir Copilot Completo"...');

    const expandLink = await page.locator('a:has-text("Abrir Copilot Completo"), a:has-text("Ver en Pantalla Completa")').first();

    if (!await expandLink.isVisible()) {
      throw new Error('Link "Abrir Copilot Completo" no encontrado');
    }
    console.log('   ✅ Link encontrado\n');

    // 4. Verificar atributos del link
    console.log('4️⃣ Verificando atributos del link...');

    const href = await expandLink.getAttribute('href');
    const target = await expandLink.getAttribute('target');
    const rel = await expandLink.getAttribute('rel');

    console.log(`   - href: ${href}`);
    console.log(`   - target: ${target}`);
    console.log(`   - rel: ${rel}`);

    // Validaciones
    const checks = {
      'href correcto': href === 'http://localhost:3210',
      'target="_blank"': target === '_blank',
      'rel contiene noopener': rel?.includes('noopener'),
      'rel contiene noreferrer': rel?.includes('noreferrer'),
    };

    console.log('\n📋 Resultados de validación:');
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      if (!passed) allPassed = false;
    }

    if (!allPassed) {
      throw new Error('Algunas validaciones fallaron');
    }

    // 5. Tomar screenshot del sidebar con el link
    console.log('\n5️⃣ Tomando screenshot...');
    await page.screenshot({
      path: 'test-copilot-link-result.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot guardado: test-copilot-link-result.png\n');

    // 6. Intentar hacer click en el link (abrirá nueva pestaña)
    console.log('6️⃣ Probando click en el link...');

    // Esperar a que se abra nueva página
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      expandLink.click()
    ]);

    await newPage.waitForLoadState('networkidle', { timeout: 30000 });
    console.log(`   ✅ Nueva pestaña abierta: ${newPage.url()}\n`);

    // Verificar que la nueva página es el copilot completo
    if (!newPage.url().includes('localhost:3210')) {
      throw new Error(`URL incorrecta: ${newPage.url()}`);
    }

    // 7. Verificar que el editor completo cargó
    console.log('7️⃣ Verificando editor completo...');
    await newPage.waitForTimeout(3000);

    // Buscar elementos característicos del editor completo
    const hasEditor = await newPage.locator('[class*="editor"], [class*="chat-input"], [data-testid*="editor"]').first().isVisible().catch(() => false);

    console.log(`   ${hasEditor ? '✅' : '⚠️'} Editor completo ${hasEditor ? 'encontrado' : 'no detectado (puede tardar en cargar)'}\n`);

    // Screenshot del editor completo
    await newPage.screenshot({
      path: 'test-copilot-full-editor.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot del editor completo: test-copilot-full-editor.png\n');

    console.log('✅ TODOS LOS TESTS PASARON\n');
    console.log('📝 Resumen:');
    console.log('   ✅ Link "Abrir Copilot Completo" funciona correctamente');
    console.log('   ✅ Abre en nueva pestaña (target="_blank")');
    console.log('   ✅ URL correcta: http://localhost:3210');
    console.log('   ✅ Seguridad configurada (noopener, noreferrer)');
    console.log('   ✅ No hay bloqueo de popup (es un link, no window.open)\n');

    await browser.close();
    return 0;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📸 Tomando screenshot del error...');
    await page.screenshot({ path: 'test-copilot-link-error.png' });
    console.error('   Screenshot guardado: test-copilot-link-error.png\n');

    await browser.close();
    return 1;
  }
}

// Ejecutar test
testCopilotLink()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
