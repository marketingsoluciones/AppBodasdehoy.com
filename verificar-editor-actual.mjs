#!/usr/bin/env node

/**
 * Script para verificar y forzar actualización del editor
 */

import { chromium } from '@playwright/test';

async function verificarEditor() {
  console.log('🔍 Verificando estado del editor...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // 1. Navegar con cache disabled
    console.log('1️⃣ Navegando sin cache...');
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Forzar reload sin cache
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

    // 3. Buscar el editor
    console.log('3️⃣ Analizando componente del editor...\n');

    // Buscar diferentes tipos de inputs
    const checks = {
      'textarea': false,
      'input[type="text"]': false,
      '[contenteditable="true"]': false,
      '[data-lexical-editor="true"]': false,
      'div[role="textbox"]': false,
    };

    for (const selector of Object.keys(checks)) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          checks[selector] = true;
          console.log(`   ✅ Encontrado: ${selector}`);

          // Obtener más info
          const html = await element.evaluate(el => el.outerHTML.substring(0, 200));
          console.log(`      HTML: ${html}...\n`);
        }
      } catch (e) {
        // No existe este selector
      }
    }

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
      errors.slice(0, 3).forEach(err => {
        console.log(`      - ${err.substring(0, 150)}...`);
      });
      console.log('');
    } else {
      console.log('   ✅ No hay errores en consola\n');
    }

    // 5. Verificar imports de @lobehub/editor
    console.log('5️⃣ Verificando @lobehub/editor...\n');

    const hasLobeHub = await page.evaluate(() => {
      // Buscar en scripts cargados
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('lobehub'));
    });

    console.log(`   @lobehub/editor cargado: ${hasLobeHub ? '✅' : '❌'}\n`);

    // 6. Tomar screenshot
    console.log('6️⃣ Tomando screenshot...');
    await page.screenshot({
      path: 'verificacion-editor-actual.png',
      fullPage: false
    });
    console.log('   ✅ Screenshot: verificacion-editor-actual.png\n');

    // 7. Análisis final
    console.log('📊 ANÁLISIS:\n');

    if (checks['[contenteditable="true"]'] || checks['[data-lexical-editor="true"]']) {
      console.log('✅ EDITOR CORRECTO DETECTADO');
      console.log('   El editor de @lobehub/editor está activo');
      console.log('   Tiene contenteditable="true"\n');
    } else if (checks['textarea'] || checks['input[type="text"]']) {
      console.log('❌ EDITOR VIEJO DETECTADO');
      console.log('   Se está renderizando un textarea o input básico');
      console.log('   El componente CopilotInputWithPlugins NO se está usando\n');
      console.log('💡 SOLUCIÓN:');
      console.log('   1. Verificar que el import es correcto');
      console.log('   2. Reiniciar servidor Next.js');
      console.log('   3. Hard reload del navegador (Ctrl+Shift+R)\n');
    } else {
      console.log('⚠️  NO SE ENCONTRÓ NINGÚN INPUT');
      console.log('   El editor puede no estar visible\n');
    }

    // Mantener abierto para inspección manual
    console.log('🔧 Navegador abierto para inspección manual');
    console.log('   Presiona Ctrl+C cuando termines\n');

    await page.waitForTimeout(300000); // 5 minutos

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'verificacion-error.png' });
    console.error('   Screenshot: verificacion-error.png\n');
  } finally {
    await browser.close();
  }
}

verificarEditor().catch(console.error);
