#!/usr/bin/env node

/**
 * Script para verificar que el componente ORIGINAL de LobeChat se carga correctamente
 */

import { chromium } from '@playwright/test';

async function verificarComponenteOriginal() {
  console.log('🔍 Verificando componente ORIGINAL de LobeChat...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Capturar errores de consola
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    // Log de componente
    if (msg.text().includes('[CopilotInputOriginal]') || msg.text().includes('ORIGINAL')) {
      console.log(`   📝 ${msg.text()}`);
    }
  });

  try {
    // 1. Navegar
    console.log('1️⃣ Navegando a localhost:8080...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    console.log('   ✅ Página cargada\n');

    // 2. Abrir copilot
    console.log('2️⃣ Abriendo Copilot...');
    try {
      const copilotBtn = await page.locator('button:has-text("Copilot")').first();
      if (await copilotBtn.isVisible({ timeout: 5000 })) {
        await copilotBtn.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ Copilot abierto\n');
      }
    } catch (e) {
      console.log('   ⚠️  Botón no encontrado\n');
    }

    // 3. Verificar errores
    console.log('3️⃣ Verificando errores de compilación...\n');
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`   ❌ ${consoleErrors.length} errores encontrados:\n`);
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 200)}`);
        if (err.length > 200) console.log('      ...');
      });
      console.log('');
    } else {
      console.log('   ✅ No hay errores en consola\n');
    }

    // 4. Verificar si cargó el componente original
    console.log('4️⃣ Verificando qué componente se cargó...\n');

    // Buscar elementos del componente original de LobeChat
    const checks = {
      'ChatInput wrapper': false,
      'ActionBar (toolbar)': false,
      'Editor contenteditable': false,
      'Botones de formato': false,
    };

    // ChatInput wrapper
    try {
      const chatInput = await page.locator('[class*="ChatInput"], [data-chat-input]').first();
      checks['ChatInput wrapper'] = await chatInput.count() > 0;
    } catch (e) {}

    // ActionBar
    try {
      const actionBar = await page.locator('[class*="ActionBar"], [class*="action-bar"], footer').first();
      checks['ActionBar (toolbar)'] = await actionBar.count() > 0;
    } catch (e) {}

    // Editor
    try {
      const editor = await page.locator('[contenteditable="true"]').first();
      checks['Editor contenteditable'] = await editor.count() > 0;
    } catch (e) {}

    // Botones
    try {
      const buttons = await page.locator('button').count();
      checks['Botones de formato'] = buttons > 3;
    } catch (e) {}

    // Mostrar resultados
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}`);
    });
    console.log('');

    // 5. Verificar estructura del DOM
    console.log('5️⃣ Analizando estructura del editor...\n');

    const editorInfo = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (!editor) return { found: false };

      // Buscar elementos relacionados con LobeChat
      const hasLobeChatClasses = document.querySelector('[class*="lobe"], [class*="Lobe"]');
      const hasActionBar = document.querySelector('[class*="ActionBar"], [class*="action-bar"]');

      return {
        found: true,
        hasLobeChatClasses: !!hasLobeChatClasses,
        hasActionBar: !!hasActionBar,
        editorClasses: editor.className,
      };
    });

    if (editorInfo.found) {
      console.log(`   ✅ Editor encontrado`);
      console.log(`   ${editorInfo.hasLobeChatClasses ? '✅' : '❌'} Clases de LobeChat`);
      console.log(`   ${editorInfo.hasActionBar ? '✅' : '❌'} ActionBar presente`);
      console.log(`   Clases del editor: ${editorInfo.editorClasses.substring(0, 100)}...`);
    } else {
      console.log('   ❌ Editor no encontrado');
    }
    console.log('');

    // 6. Tomar screenshot
    console.log('6️⃣ Tomando screenshot...');
    await page.screenshot({
      path: 'verificacion-componente-original.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot: verificacion-componente-original.png\n');

    // 7. Análisis final
    console.log('📊 ANÁLISIS FINAL:\n');

    const allChecksPass = Object.values(checks).every(v => v);
    const hasErrors = consoleErrors.length > 0;

    if (hasErrors) {
      console.log('❌ ERRORES DE COMPILACIÓN DETECTADOS');
      console.log('   El componente original tiene problemas de dependencias\n');
      console.log('💡 Posibles causas:');
      console.log('   1. Path aliases (@/) no resueltos en apps/web');
      console.log('   2. Stores de Zustand no disponibles');
      console.log('   3. Hooks personalizados no encontrados\n');
    } else if (allChecksPass) {
      console.log('✅ COMPONENTE ORIGINAL FUNCIONANDO');
      console.log('   El componente de LobeChat se cargó correctamente');
      console.log('   Todos los elementos están presentes\n');
    } else {
      console.log('⚠️  COMPONENTE PARCIALMENTE CARGADO');
      console.log('   Algunos elementos no se detectaron\n');
    }

    // Mantener abierto
    console.log('🔧 Navegador abierto para inspección manual');
    console.log('   Presiona Ctrl+C cuando termines\n');

    await page.waitForTimeout(300000); // 5 minutos

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'verificacion-original-error.png' });
  } finally {
    await browser.close();
  }
}

verificarComponenteOriginal().catch(console.error);
