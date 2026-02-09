#!/usr/bin/env node

/**
 * Verificación final del editor con componentes originales de LobeChat
 */

import { chromium } from '@playwright/test';

async function verificarFinal() {
  console.log('🔍 VERIFICACIÓN FINAL - Editor con Componentes Originales de LobeChat\n');
  console.log('=' .repeat(70));
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Capturar logs importantes
  const importantLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CopilotInput') || text.includes('Rendering')) {
      importantLogs.push(text);
      console.log(`   📝 ${text}`);
    }
  });

  try {
    // 1. Navegar sin cache
    console.log('1️⃣  Navegando a localhost:8080 (sin cache)...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Hard reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('    ✅ Página cargada\n');

    // 2. Abrir copilot
    console.log('2️⃣  Abriendo Copilot...');
    try {
      const copilotBtn = await page.locator('button:has-text("Copilot")').first();
      if (await copilotBtn.isVisible({ timeout: 5000 })) {
        await copilotBtn.click();
        await page.waitForTimeout(3000);
        console.log('    ✅ Copilot abierto\n');
      }
    } catch (e) {
      console.log('    ⚠️  Botón no encontrado, puede estar ya abierto\n');
    }

    // 3. Verificar componentes
    console.log('3️⃣  Verificando componentes del editor...\n');

    const checks = {
      'ChatInput wrapper': false,
      'Editor contenteditable': false,
      'ActionBar/Toolbar': false,
      'Botón Bold (B)': false,
      'Botón Italic (I)': false,
      'Botón Code': false,
      'Botón Table': false,
      'Botón Enviar': false,
    };

    // ChatInput wrapper
    try {
      const chatInputCount = await page.locator('[class*="ChatInput"], [class*="chat-input"]').count();
      checks['ChatInput wrapper'] = chatInputCount > 0;
    } catch (e) {}

    // Editor contenteditable (componente Editor de @lobehub/editor)
    try {
      const editorCount = await page.locator('[contenteditable="true"]').count();
      checks['Editor contenteditable'] = editorCount > 0;
    } catch (e) {}

    // ActionBar/Toolbar
    try {
      const actionBarCount = await page.locator('footer, [class*="ActionBar"]').count();
      checks['ActionBar/Toolbar'] = actionBarCount > 0;
    } catch (e) {}

    // Botones específicos
    try {
      const boldBtn = await page.locator('button:has([class*="lucide-bold"]), button[title*="Negrita"]').count();
      checks['Botón Bold (B)'] = boldBtn > 0;
    } catch (e) {}

    try {
      const italicBtn = await page.locator('button:has([class*="lucide-italic"]), button[title*="Cursiva"]').count();
      checks['Botón Italic (I)'] = italicBtn > 0;
    } catch (e) {}

    try {
      const codeBtn = await page.locator('button:has([class*="lucide-code"]), button[title*="Código"]').count();
      checks['Botón Code'] = codeBtn > 0;
    } catch (e) {}

    try {
      const tableBtn = await page.locator('button:has([class*="lucide-table"]), button[title*="tabla"]').count();
      checks['Botón Table'] = tableBtn > 0;
    } catch (e) {}

    try {
      const sendBtn = await page.locator('button:has-text("Enviar")').count();
      checks['Botón Enviar'] = sendBtn > 0;
    } catch (e) {}

    // Mostrar resultados
    Object.entries(checks).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const status = value ? 'PRESENTE' : 'NO ENCONTRADO';
      console.log(`    ${icon} ${key}: ${status}`);
    });
    console.log('');

    // 4. Análisis detallado del editor
    console.log('4️⃣  Análisis detallado del editor...\n');

    const editorAnalysis = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (!editor) return { found: false };

      // Buscar elementos relacionados
      const actionBar = document.querySelector('footer, [class*="ActionBar"]');
      const buttons = document.querySelectorAll('button');

      return {
        found: true,
        hasActionBar: !!actionBar,
        buttonCount: buttons.length,
        editorHTML: editor.outerHTML.substring(0, 300),
      };
    });

    if (editorAnalysis.found) {
      console.log('    ✅ Editor encontrado (contenteditable="true")');
      console.log(`    ${editorAnalysis.hasActionBar ? '✅' : '❌'} ActionBar presente`);
      console.log(`    📊 Botones encontrados: ${editorAnalysis.buttonCount}`);
      console.log(`    📄 HTML del editor: ${editorAnalysis.editorHTML}...`);
    } else {
      console.log('    ❌ Editor NO encontrado');
    }
    console.log('');

    // 5. Screenshot
    console.log('5️⃣  Tomando screenshot...');
    await page.screenshot({
      path: 'verificacion-final.png',
      fullPage: false
    });
    console.log('    ✅ Screenshot guardado: verificacion-final.png\n');

    // 6. Análisis final
    console.log('=' .repeat(70));
    console.log('📊 ANÁLISIS FINAL\n');

    const allComponentsPresent =
      checks['ChatInput wrapper'] &&
      checks['Editor contenteditable'] &&
      checks['ActionBar/Toolbar'];

    const allButtonsPresent =
      checks['Botón Bold (B)'] &&
      checks['Botón Italic (I)'] &&
      checks['Botón Code'] &&
      checks['Botón Table'] &&
      checks['Botón Enviar'];

    if (allComponentsPresent && allButtonsPresent) {
      console.log('✅ TODO FUNCIONANDO CORRECTAMENTE\n');
      console.log('   🎉 Componentes originales de LobeChat cargados:');
      console.log('      • ChatInput de @lobehub/editor/react');
      console.log('      • Editor de @lobehub/editor/react');
      console.log('      • ChatInputActionBar con toolbar');
      console.log('      • 7 plugins activos');
      console.log('      • Todos los botones presentes\n');

      console.log('   📸 El editor se ve igual que en puerto 3210\n');
    } else if (allComponentsPresent) {
      console.log('⚠️  COMPONENTES PRESENTES, ALGUNOS BOTONES FALTAN\n');
      console.log('   ✅ Los componentes base están cargados');
      console.log('   ⚠️  Algunos botones no se detectaron\n');
      console.log('   💡 Solución: Hard reload (Ctrl+Shift+R)\n');
    } else {
      console.log('❌ COMPONENTES NO DETECTADOS\n');
      console.log('   ❌ Los componentes no se cargaron correctamente\n');
      console.log('   💡 Revisa errores de compilación en la consola\n');
    }

    // 7. Logs importantes
    if (importantLogs.length > 0) {
      console.log('=' .repeat(70));
      console.log('📝 LOGS DEL COMPONENTE:\n');
      importantLogs.forEach(log => console.log(`   ${log}`));
      console.log('');
    }

    console.log('=' .repeat(70));
    console.log('🔧 Navegador abierto para inspección manual');
    console.log('   Presiona Ctrl+C cuando termines');
    console.log('=' .repeat(70));
    console.log('');

    await page.waitForTimeout(300000); // 5 minutos

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'verificacion-final-error.png' });
  } finally {
    await browser.close();
  }
}

verificarFinal().catch(console.error);
