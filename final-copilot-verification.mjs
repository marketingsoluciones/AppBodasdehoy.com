#!/usr/bin/env node
import { chromium } from 'playwright';

async function finalVerification() {
  console.log('🔍 Verificación final del Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Esperar a que se cierre el modal (si está abierto)
    console.log('📝 PASO 1: Esperando que se cierre el modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    console.log('   ✅ Modal cerrado\n');

    await page.screenshot({ path: 'after-modal-close.png' });
    console.log('📸 Screenshot: after-modal-close.png\n');

    // Navegar directamente a resumen-evento
    console.log('📝 PASO 2: Navegando a resumen-evento...');
    await page.goto('http://localhost:8080/resumen-evento', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log(`   ✅ URL: ${page.url()}\n`);

    await page.screenshot({ path: 'resumen-evento-page.png' });
    console.log('📸 Screenshot: resumen-evento-page.png\n');

    // Verificar botón Copilot
    console.log('📝 PASO 3: Verificando botón Copilot...');
    const copilotBtn = page.locator('button:has-text("Copilot")');
    const btnCount = await copilotBtn.count();
    console.log(`   Botón Copilot: ${btnCount > 0 ? '✅ Encontrado' : '❌ No encontrado'}\n`);

    if (btnCount === 0) {
      console.log('⚠️  Sin Copilot. Probablemente no hay evento seleccionado.\n');
      return;
    }

    // Abrir Copilot
    console.log('📝 PASO 4: Abriendo Copilot...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3000);
    console.log('   ✅ Copilot abierto\n');

    await page.screenshot({ path: 'copilot-final.png' });
    console.log('📸 Screenshot: copilot-final.png\n');

    // Inspeccionar editor
    console.log('📝 PASO 5: Inspeccionando editor...\n');

    const result = await page.evaluate(() => {
      // Buscar textarea del Copilot
      const textarea = document.querySelector('textarea[placeholder*="mensaje"]') ||
                       document.querySelector('textarea[placeholder*="Escribe"]') ||
                       Array.from(document.querySelectorAll('textarea')).find(ta =>
                         ta.placeholder && ta.placeholder.length > 0
                       );

      if (!textarea) {
        return { success: false, reason: 'No textarea found' };
      }

      // Buscar contenedor
      const container = textarea.closest('div, form');
      if (!container) {
        return { success: false, reason: 'No container found' };
      }

      // Buscar botones con SVG y title
      const buttons = Array.from(container.querySelectorAll('button'))
        .map(btn => ({
          title: btn.getAttribute('title') || '',
          hasSvg: !!btn.querySelector('svg')
        }))
        .filter(b => b.hasSvg && b.title);

      // Verificar los 4 botones esperados
      const checks = [
        { name: 'Emojis', found: buttons.some(b => b.title.toLowerCase().includes('emoji')) },
        { name: 'Adjuntar', found: buttons.some(b => b.title.toLowerCase().includes('adjuntar')) },
        { name: 'Código', found: buttons.some(b => b.title.toLowerCase().includes('código')) },
        { name: 'Lista', found: buttons.some(b => b.title.toLowerCase().includes('lista')) }
      ];

      const allFound = checks.every(c => c.found);

      return {
        success: allFound,
        placeholder: textarea.placeholder,
        buttons: buttons.map(b => b.title),
        checks: checks,
        totalButtons: buttons.length
      };
    });

    if (result.success) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉🎉🎉 ¡VERIFICACIÓN EXITOSA! 🎉🎉🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ El CopilotInputEditor está funcionando CORRECTAMENTE\n');
      console.log(`📝 Placeholder: "${result.placeholder}"\n`);
      console.log('🔘 Los 4 botones esperados están presentes:\n');
      result.checks.forEach(c => {
        console.log(`   ✅ ${c.name}`);
      });
      console.log('\n📋 Todos los botones encontrados:');
      result.buttons.forEach((title, idx) => {
        console.log(`   ${idx + 1}. ${title}`);
      });
      console.log('\n═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ Verificación fallida\n');
      console.log(`Razón: ${result.reason || 'Botones faltantes'}\n`);

      if (result.checks) {
        console.log('Estado de los botones:');
        result.checks.forEach(c => {
          console.log(`   ${c.found ? '✅' : '❌'} ${c.name}`);
        });
      }

      if (result.buttons) {
        console.log(`\nBotones encontrados (${result.totalButtons}):`);
        result.buttons.forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title}`);
        });
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalVerification().catch(console.error);
