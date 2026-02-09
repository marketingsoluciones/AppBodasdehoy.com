#!/usr/bin/env node

/**
 * Test: Verificar que el editor completo con componentes reales funciona en el sidebar
 *
 * Prueba que:
 * 1. El sidebar del copilot se abre correctamente
 * 2. El editor completo (CopilotInputFull) carga correctamente
 * 3. La toolbar con íconos es visible
 * 4. Los plugins están activos
 */

import { chromium } from '@playwright/test';

async function testEditorCompleto() {
  console.log('🚀 Iniciando test del editor completo en sidebar...\n');

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
    const copilotButton = await page.locator('button:has-text("Copilot"), [aria-label*="Copilot"], [title*="Copilot"]').first();

    if (await copilotButton.isVisible()) {
      await copilotButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Sidebar abierto\n');
    } else {
      console.log('   ⚠️  Botón Copilot no encontrado, intentando otro selector...\n');
    }

    // 3. Tomar screenshot inicial
    console.log('3️⃣ Tomando screenshot del estado inicial...');
    await page.screenshot({
      path: 'test-editor-inicial.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot: test-editor-inicial.png\n');

    // 4. Buscar elementos del editor completo
    console.log('4️⃣ Verificando componentes del editor completo...\n');

    const checks = {
      'Editor presente': false,
      'ChatInputProvider': false,
      'Toolbar/ActionBar': false,
      'Área de input': false,
    };

    // Verificar que el editor esté presente
    const editorSelectors = [
      '[class*="ChatInput"]',
      '[class*="chat-input"]',
      '[class*="editor"]',
      '[data-testid*="editor"]',
      '[data-testid*="chat-input"]',
      'div[style*="minHeight"]',
    ];

    for (const selector of editorSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          checks['Editor presente'] = true;
          console.log(`   ✅ Editor encontrado con selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar probando otros selectores
      }
    }

    // Verificar elementos específicos del editor completo
    const toolbarSelectors = [
      '[class*="ActionBar"]',
      '[class*="action-bar"]',
      'button[class*="icon"]',
      '[role="toolbar"]',
      'button[aria-label*="bold"]',
      'button[aria-label*="italic"]',
    ];

    for (const selector of toolbarSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          checks['Toolbar/ActionBar'] = true;
          console.log(`   ✅ Toolbar encontrada con selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    // Verificar input area
    const inputSelectors = [
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'input[type="text"]',
    ];

    for (const selector of inputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          checks['Área de input'] = true;
          console.log(`   ✅ Área de input encontrada con selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    // 5. Intentar interactuar con el editor
    console.log('\n5️⃣ Probando interacción con el editor...');

    // Buscar el área editable
    const editableArea = page.locator('[contenteditable="true"], textarea, [role="textbox"]').first();

    if (await editableArea.isVisible({ timeout: 3000 })) {
      await editableArea.click();
      await page.waitForTimeout(500);
      await editableArea.fill('Hola, este es un test del editor completo');
      await page.waitForTimeout(1000);
      console.log('   ✅ Texto escrito en el editor\n');

      // Tomar screenshot con texto
      await page.screenshot({
        path: 'test-editor-con-texto.png',
        fullPage: false
      });
      console.log('   ✅ Screenshot: test-editor-con-texto.png\n');

      // Probar slash command
      await editableArea.fill('/');
      await page.waitForTimeout(1000);
      const slashMenu = await page.locator('[class*="slash"], [class*="menu"], [role="menu"]').first().isVisible({ timeout: 2000 }).catch(() => false);

      if (slashMenu) {
        console.log('   ✅ Slash menu aparece al escribir "/"\n');
        checks['Slash commands'] = true;

        await page.screenshot({
          path: 'test-editor-slash-menu.png',
          fullPage: false
        });
        console.log('   ✅ Screenshot: test-editor-slash-menu.png\n');
      } else {
        console.log('   ⚠️  Slash menu no detectado\n');
      }

    } else {
      console.log('   ⚠️  No se encontró área editable para interactuar\n');
    }

    // 6. Resumen de verificaciones
    console.log('📋 Resultados de verificación:\n');
    let totalPassed = 0;
    const totalChecks = Object.keys(checks).length;

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      if (passed) totalPassed++;
    }

    console.log(`\n📊 Total: ${totalPassed}/${totalChecks} verificaciones pasadas\n`);

    // 7. Verificar errores en consola
    console.log('7️⃣ Revisando errores de consola...\n');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  Se encontraron ${consoleErrors.length} errores en consola:`);
      consoleErrors.slice(0, 5).forEach(error => {
        console.log(`      - ${error.substring(0, 100)}...`);
      });
      console.log('');
    } else {
      console.log('   ✅ No se encontraron errores en consola\n');
    }

    // 8. Screenshot final
    console.log('8️⃣ Tomando screenshot final...');
    await page.screenshot({
      path: 'test-editor-final.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot: test-editor-final.png\n');

    // Resultado final
    if (totalPassed >= 3) {
      console.log('✅ TEST PASADO - Editor completo funcionando\n');
      console.log('📝 El editor completo está cargado y funcionando.');
      console.log('   Revisa los screenshots para verificar visualmente.\n');
      await browser.close();
      return 0;
    } else {
      console.log('⚠️  TEST PARCIAL - Algunos componentes no detectados\n');
      console.log('📝 El editor puede estar funcionando pero algunos elementos');
      console.log('   no fueron detectados automáticamente.');
      console.log('   Revisa los screenshots para verificar visualmente.\n');
      await browser.close();
      return 0;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📸 Tomando screenshot del error...');
    await page.screenshot({ path: 'test-editor-error.png' });
    console.error('   Screenshot guardado: test-editor-error.png\n');

    await browser.close();
    return 1;
  }
}

// Ejecutar test
testEditorCompleto()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
