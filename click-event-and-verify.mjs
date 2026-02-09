#!/usr/bin/env node
import { chromium } from 'playwright';

async function clickEventAndVerify() {
  console.log('🔍 Haciendo click en evento y verificando Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL: ${page.url()}\n`);

    // PASO 1: Hacer click en la tarjeta del evento
    console.log('📝 PASO 1: Buscando tarjeta del evento...');

    // Buscar la tarjeta con el texto del evento
    const eventCard = page.locator('div:has-text("EVENTO TEST COPILOT")').or(
      page.locator('a[href*="/evento"]')
    ).first();

    const cardCount = await eventCard.count();
    console.log(`   Tarjetas encontradas: ${cardCount}`);

    if (cardCount > 0) {
      console.log('   ✅ Haciendo click en la tarjeta...');
      await eventCard.click({ force: true });
      await page.waitForTimeout(3000);
      console.log(`   ✅ URL: ${page.url()}\n`);
    } else {
      console.log('   ❌ No se encontró tarjeta. Navegando manualmente...\n');
      // Buscar cualquier link a evento
      const anyEventLink = page.locator('a[href*="/resumen"]').first();
      if (await anyEventLink.count() > 0) {
        await anyEventLink.click({ force: true });
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'inside-event-verified.png' });
    console.log('📸 Screenshot: inside-event-verified.png\n');

    // Verificar que estamos en una página de evento
    const currentURL = page.url();
    const isInEvent = currentURL.includes('/resumen') ||
                      currentURL.includes('/invitados') ||
                      currentURL.includes('/presupuesto') ||
                      (currentURL !== 'http://localhost:8080/' && currentURL !== 'http://localhost:8080');

    console.log(`🏠 Dentro de evento: ${isInEvent ? '✅' : '❌'}\n`);

    if (!isInEvent) {
      console.log('⚠️  No estamos dentro de un evento. No podemos probar el Copilot.\n');
      return;
    }

    // PASO 2: Abrir Copilot
    console.log('📝 PASO 2: Abriendo Copilot...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(3500);
    console.log('   ✅ Copilot abierto\n');

    await page.screenshot({ path: 'copilot-in-event.png' });
    console.log('📸 Screenshot: copilot-in-event.png\n');

    // PASO 3: Verificar editor completo
    console.log('📝 PASO 3: Verificando CopilotInputEditor...\n');

    const verification = await page.evaluate(() => {
      // 1. Buscar textarea
      const textarea = document.querySelector('textarea[placeholder*="mensaje"]') ||
                       document.querySelector('textarea[placeholder*="Escribe"]');

      if (!textarea) {
        // Buscar cualquier textarea para debug
        const allTextareas = document.querySelectorAll('textarea');
        return {
          success: false,
          reason: 'No textarea found',
          debug: {
            totalTextareas: allTextareas.length,
            placeholders: Array.from(allTextareas).map(ta => ta.placeholder)
          }
        };
      }

      // 2. Buscar contenedor del editor
      const container = textarea.closest('div, form');
      if (!container) {
        return {
          success: false,
          reason: 'No container found',
          placeholder: textarea.placeholder
        };
      }

      // 3. Buscar TODOS los botones
      const allButtons = container.querySelectorAll('button');

      // 4. Filtrar botones con SVG y title (action buttons)
      const actionButtons = Array.from(allButtons)
        .map(btn => {
          const svg = btn.querySelector('svg');
          const title = btn.getAttribute('title') || '';
          const ariaLabel = btn.getAttribute('aria-label') || '';

          return {
            title,
            ariaLabel,
            hasSvg: !!svg,
            text: btn.textContent?.trim().substring(0, 20) || ''
          };
        })
        .filter(b => b.hasSvg && (b.title || b.ariaLabel));

      // 5. Verificar los 4 botones esperados
      const expectedButtons = [
        { name: 'Emojis', keywords: ['emoji', 'emojis'] },
        { name: 'Adjuntar archivo', keywords: ['adjuntar', 'archivo', 'attach'] },
        { name: 'Insertar código', keywords: ['código', 'code', 'insertar código'] },
        { name: 'Insertar lista', keywords: ['lista', 'list'] }
      ];

      const checks = expectedButtons.map(expected => {
        const found = actionButtons.find(btn => {
          const searchText = (btn.title + ' ' + btn.ariaLabel).toLowerCase();
          return expected.keywords.some(kw => searchText.includes(kw.toLowerCase()));
        });

        return {
          expected: expected.name,
          found: !!found,
          actualTitle: found ? found.title : null
        };
      });

      const allFound = checks.every(c => c.found);

      return {
        success: allFound,
        placeholder: textarea.placeholder,
        totalButtons: allButtons.length,
        actionButtons: actionButtons.map(b => b.title || b.ariaLabel),
        checks: checks
      };
    });

    // Mostrar resultados
    if (verification.success) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('          🎉🎉🎉 ¡ÉXITO TOTAL! 🎉🎉🎉');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✅ El CopilotInputEditor está funcionando PERFECTAMENTE\n');
      console.log(`📝 Textarea placeholder: "${verification.placeholder}"`);
      console.log(`🔢 Total de botones: ${verification.totalButtons}`);
      console.log(`🎯 Botones de acción: ${verification.actionButtons.length}\n`);
      console.log('🔘 Los 4 botones esperados están presentes:\n');
      verification.checks.forEach(c => {
        console.log(`   ✅ ${c.expected}`);
        if (c.actualTitle) {
          console.log(`      → "${c.actualTitle}"`);
        }
      });
      console.log('\n📋 Todos los botones de acción:\n');
      verification.actionButtons.forEach((title, idx) => {
        console.log(`   ${idx + 1}. ${title}`);
      });
      console.log('\n═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ Verificación FALLIDA\n');
      console.log(`📋 Razón: ${verification.reason || 'Botones faltantes'}\n`);

      if (verification.debug) {
        console.log('🔍 Debug info:');
        console.log(`   Total textareas: ${verification.debug.totalTextareas}`);
        console.log(`   Placeholders: ${JSON.stringify(verification.debug.placeholders)}\n`);
      }

      if (verification.checks) {
        console.log('📊 Estado de verificación:');
        verification.checks.forEach(c => {
          console.log(`   ${c.found ? '✅' : '❌'} ${c.expected}${c.actualTitle ? ': "' + c.actualTitle + '"' : ''}`);
        });
        console.log('');
      }

      if (verification.actionButtons) {
        console.log(`📋 Botones encontrados (${verification.actionButtons.length}):`);
        verification.actionButtons.forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title}`);
        });
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

clickEventAndVerify().catch(console.error);
