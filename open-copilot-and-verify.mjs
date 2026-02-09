#!/usr/bin/env node
import { chromium } from 'playwright';

async function openCopilotAndVerify() {
  console.log('🔍 Abriendo Copilot y verificando editor...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL actual: ${page.url()}\n`);

    // Verificar si hay eventos
    console.log('📝 PASO 1: Verificando eventos disponibles...');
    const hasEvents = await page.evaluate(() => {
      const eventCards = document.querySelectorAll('[class*="card"], [class*="event"]');
      return eventCards.length > 0;
    });

    if (!hasEvents) {
      console.log('   ⚠️  No hay eventos visibles en la home\n');
      console.log('   Creando evento de prueba...');

      const createBtn = page.locator('button:has-text("Crear un evento")').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(2000);

        // Llenar nombre
        const nameInput = page.locator('input[name="nombre"], input[placeholder*="nombre"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Evento Test para Copilot');
          await page.waitForTimeout(500);

          // Click en cualquier parte para avanzar
          const guardarBtn = page.locator('button:has-text("Guardar")').first();
          if (await guardarBtn.isVisible()) {
            // Intentar guardar aunque falten campos
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
          }
        }
      }
    } else {
      console.log('   ✅ Hay eventos disponibles\n');
    }

    // Buscar y abrir Copilot
    console.log('📝 PASO 2: Abriendo Copilot...');
    const copilotButton = page.locator('button:has-text("Copilot"), [class*="copilot"]').first();

    if (await copilotButton.isVisible()) {
      console.log('   ✅ Botón Copilot encontrado');
      await copilotButton.click();
      console.log('   🖱️  Click en Copilot');

      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'copilot-opened.png', fullPage: true });
      console.log('   📸 Screenshot: copilot-opened.png\n');

      // Verificar el editor
      console.log('📝 PASO 3: Inspeccionando editor del Copilot...');
      await page.waitForTimeout(2000);

      const editorInfo = await page.evaluate(() => {
        // Buscar textarea
        const textarea = document.querySelector('textarea[placeholder*="Escribe"]');
        if (!textarea) return { found: false };

        // Buscar contenedor padre
        const container = textarea.closest('[style*="border"]') || textarea.parentElement?.parentElement;

        // Buscar botones en la action bar
        const buttons = container ? Array.from(container.querySelectorAll('button')) : [];

        return {
          found: true,
          placeholder: textarea.placeholder,
          buttonCount: buttons.length,
          buttons: buttons.map(btn => ({
            title: btn.title || btn.getAttribute('title') || '',
            innerHTML: btn.innerHTML.substring(0, 100),
            textContent: btn.textContent?.trim().substring(0, 50) || '',
            hasIcon: btn.querySelector('svg') !== null,
            iconType: btn.querySelector('svg') ? 'SVG' : (btn.textContent?.match(/[😊📎<>•]/) ? 'EMOJI' : 'TEXT')
          }))
        };
      });

      if (editorInfo.found) {
        console.log(`   ✅ Editor encontrado`);
        console.log(`   📝 Placeholder: "${editorInfo.placeholder}"`);
        console.log(`   🔢 Botones encontrados: ${editorInfo.buttonCount}\n`);

        console.log('   📊 Detalles de botones:\n');
        editorInfo.buttons.forEach((btn, idx) => {
          console.log(`      Botón ${idx + 1}:`);
          console.log(`         Título: ${btn.title || 'Sin título'}`);
          console.log(`         Tipo: ${btn.iconType}`);
          console.log(`         Contenido: ${btn.textContent || btn.innerHTML.substring(0, 50)}`);
          console.log('');
        });

        // Verificar si son los iconos correctos (IoHappy, IoAttach, IoCode, IoList de react-icons)
        const hasReactIcons = editorInfo.buttons.some(b => b.iconType === 'SVG' && b.innerHTML.includes('svg'));

        if (hasReactIcons) {
          console.log('   ✅ ¡EDITOR CORRECTO! Usando iconos de react-icons\n');
        } else {
          console.log('   ⚠️  Posible problema con iconos\n');
        }

      } else {
        console.log('   ❌ Editor no encontrado\n');
      }

    } else {
      console.log('   ❌ Botón Copilot no encontrado\n');
    }

    console.log('✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-copilot-verify.png', fullPage: true });
  }
}

openCopilotAndVerify().catch(console.error);
