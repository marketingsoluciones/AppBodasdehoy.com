#!/usr/bin/env node

/**
 * Script para verificar que el toolbar con botones esté visible
 */

import { chromium } from '@playwright/test';

async function verificarToolbar() {
  console.log('🔍 Verificando toolbar del editor...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // 1. Navegar sin cache
    console.log('1️⃣ Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Hard reload para forzar cache clear
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('   ✅ Página cargada\n');

    // 2. Abrir copilot
    console.log('2️⃣ Abriendo Copilot...');
    try {
      const copilotBtn = await page.locator('button:has-text("Copilot")').first();
      if (await copilotBtn.isVisible({ timeout: 5000 })) {
        await copilotBtn.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Copilot abierto\n');
      }
    } catch (e) {
      console.log('   ⚠️  Botón no encontrado, puede estar ya abierto\n');
    }

    // 3. Verificar estructura del editor
    console.log('3️⃣ Verificando estructura del editor...\n');

    // Buscar ChatInput wrapper
    const chatInput = await page.locator('[data-chat-input="true"], .chat-input, [class*="ChatInput"]').first();
    const hasChatInput = await chatInput.count() > 0;
    console.log(`   ChatInput wrapper: ${hasChatInput ? '✅' : '❌'}`);

    // Buscar ChatInputActionBar (el toolbar)
    const actionBar = await page.locator('[class*="ActionBar"], [class*="action-bar"], footer').first();
    const hasActionBar = await actionBar.count() > 0;
    console.log(`   ActionBar (toolbar): ${hasActionBar ? '✅' : '❌'}`);

    // Buscar botones de formato
    const boldButton = await page.locator('button:has([class*="lucide-bold"]), button[title*="Negrita"]');
    const hasBold = await boldButton.count() > 0;
    console.log(`   Botón Bold: ${hasBold ? '✅' : '❌'}`);

    const italicButton = await page.locator('button:has([class*="lucide-italic"]), button[title*="Cursiva"]');
    const hasItalic = await italicButton.count() > 0;
    console.log(`   Botón Italic: ${hasItalic ? '✅' : '❌'}`);

    const codeButton = await page.locator('button:has([class*="lucide-code"]), button[title*="Código"]');
    const hasCode = await codeButton.count() > 0;
    console.log(`   Botón Code: ${hasCode ? '✅' : '❌'}`);

    const tableButton = await page.locator('button:has([class*="lucide-table"]), button[title*="tabla"]');
    const hasTable = await tableButton.count() > 0;
    console.log(`   Botón Table: ${hasTable ? '✅' : '❌'}`);

    const sendButton = await page.locator('button:has-text("Enviar")');
    const hasSend = await sendButton.count() > 0;
    console.log(`   Botón Enviar: ${hasSend ? '✅' : '❌'}\n`);

    // 4. Verificar errores en consola
    console.log('4️⃣ Errores en consola:\n');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log(`   ⚠️  ${errors.length} errores encontrados:`);
      errors.slice(0, 5).forEach(err => {
        console.log(`      - ${err.substring(0, 150)}...`);
      });
      console.log('');
    } else {
      console.log('   ✅ No hay errores en consola\n');
    }

    // 5. Tomar screenshot
    console.log('5️⃣ Tomando screenshot...');
    await page.screenshot({
      path: 'verificacion-toolbar.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot: verificacion-toolbar.png\n');

    // 6. Análisis final
    console.log('📊 ANÁLISIS FINAL:\n');

    const allButtonsPresent = hasBold && hasItalic && hasCode && hasTable && hasSend;

    if (allButtonsPresent) {
      console.log('✅ ¡ÉXITO! TOOLBAR COMPLETO DETECTADO');
      console.log('   Todos los botones de formato están presentes');
      console.log('   - Bold (Negrita) ✅');
      console.log('   - Italic (Cursiva) ✅');
      console.log('   - Code (Código) ✅');
      console.log('   - Table (Tabla) ✅');
      console.log('   - Send (Enviar) ✅\n');
      console.log('🎉 El editor ahora tiene el toolbar visual con botones!\n');
    } else {
      console.log('⚠️  TOOLBAR INCOMPLETO');
      console.log('   Algunos botones no se detectaron\n');
      console.log('💡 Posibles causas:');
      console.log('   1. Cache del navegador - intenta hard reload (Ctrl+Shift+R)');
      console.log('   2. Componente aún no compilado - espera unos segundos más');
      console.log('   3. Error de importación - revisa la consola del navegador\n');
    }

    // Mantener abierto para inspección manual
    console.log('🔧 Navegador abierto para inspección manual');
    console.log('   Presiona Ctrl+C cuando termines\n');

    await page.waitForTimeout(300000); // 5 minutos

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'verificacion-toolbar-error.png' });
    console.error('   Screenshot: verificacion-toolbar-error.png\n');
  } finally {
    await browser.close();
  }
}

verificarToolbar().catch(console.error);
