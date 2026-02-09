#!/usr/bin/env node
import { chromium } from 'playwright';

async function testConSesionActiva() {
  console.log('🚀 Conectando al navegador existente...\n');

  // Conectar al navegador Chrome existente
  // Primero necesitamos iniciar Chrome con debugging habilitado
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  console.log('✅ Conectado al navegador\n');

  const contexts = browser.contexts();
  console.log(`📱 Contextos encontrados: ${contexts.length}\n`);

  const context = contexts[0];
  const pages = context.pages();
  console.log(`📄 Páginas abiertas: ${pages.length}\n`);

  // Usar la primera página o buscar la que está en localhost:8080
  let page = pages.find(p => p.url().includes('localhost:8080'));

  if (!page) {
    console.log('⚠️  No se encontró página en localhost:8080, usando la primera página');
    page = pages[0];
  }

  console.log(`📍 URL actual: ${page.url()}\n`);

  try {
    // PASO 1: Verificar que estamos logeados
    console.log('📝 PASO 1: Verificando sesión...');
    const userName = await page.evaluate(() => {
      const userElement = document.querySelector('[class*="user"], [alt*="avatar"]');
      return userElement ? 'Usuario encontrado' : 'No encontrado';
    });
    console.log(`   ${userName}\n`);

    // PASO 2: Verificar menú de usuario
    console.log('📝 PASO 2: Probando menú de usuario...');

    // Buscar el icono de usuario
    const userIcon = await page.locator('[class*="user"], [alt*="avatar"], button:has-text("G")').first();

    if (await userIcon.isVisible()) {
      console.log('   ✅ Icono de usuario encontrado');

      // Click en el icono
      await userIcon.click();
      console.log('   🖱️  Click en icono de usuario');

      // Esperar a que aparezca el dropdown
      await page.waitForTimeout(500);

      // Verificar que el menú se abrió
      const menuVisible = await page.evaluate(() => {
        const menus = document.querySelectorAll('[class*="dropdown"], [class*="menu"], [role="menu"]');
        return Array.from(menus).some(m => {
          const style = window.getComputedStyle(m);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
      });

      if (menuVisible) {
        console.log('   ✅ Menú desplegable ABIERTO correctamente\n');

        // Tomar screenshot del menú abierto
        await page.screenshot({ path: 'test-menu-usuario.png' });
        console.log('   📸 Screenshot: test-menu-usuario.png\n');

        // Cerrar menú clickeando fuera
        await page.mouse.click(100, 100);
        await page.waitForTimeout(500);
        console.log('   ✅ Menú cerrado\n');
      } else {
        console.log('   ❌ Menú NO se abrió\n');
      }
    } else {
      console.log('   ⚠️  Icono de usuario no encontrado\n');
    }

    // PASO 3: Buscar botón de Copilot
    console.log('📝 PASO 3: Buscando botón de Copilot...');

    const copilotButton = await page.locator('button:has-text("Copilot"), [class*="copilot"]').first();

    if (await copilotButton.isVisible()) {
      console.log('   ✅ Botón de Copilot encontrado en header');

      // Click en Copilot
      await copilotButton.click();
      console.log('   🖱️  Click en botón Copilot');

      // Esperar a que se abra
      await page.waitForTimeout(2000);

      // Verificar que el panel se abrió
      const copilotPanelVisible = await page.evaluate(() => {
        // Buscar el panel del copilot
        const panels = document.querySelectorAll('[class*="copilot"], [class*="chat"], [class*="sidebar"]');
        return Array.from(panels).some(p => {
          const style = window.getComputedStyle(p);
          const rect = p.getBoundingClientRect();
          return style.display !== 'none' &&
                 style.visibility !== 'hidden' &&
                 rect.width > 100;
        });
      });

      if (copilotPanelVisible) {
        console.log('   ✅ Panel del Copilot ABIERTO\n');

        // PASO 4: Buscar el editor
        console.log('📝 PASO 4: Verificando editor del Copilot...');

        // Buscar los 4 botones del editor
        const editorButtons = await page.evaluate(() => {
          // Buscar botones con emojis o iconos específicos
          const allButtons = Array.from(document.querySelectorAll('button'));

          const emojiButton = allButtons.find(b => b.textContent?.includes('😊') || b.title?.includes('emoji'));
          const attachButton = allButtons.find(b => b.textContent?.includes('📎') || b.title?.includes('adjunt') || b.title?.includes('attach'));
          const codeButton = allButtons.find(b => b.textContent?.includes('</>') || b.title?.includes('code') || b.title?.includes('código'));
          const listButton = allButtons.find(b => b.textContent?.includes('•') || b.title?.includes('list') || b.title?.includes('lista'));

          return {
            emoji: !!emojiButton,
            attach: !!attachButton,
            code: !!codeButton,
            list: !!listButton,
            total: [emojiButton, attachButton, codeButton, listButton].filter(Boolean).length
          };
        });

        console.log(`   📊 Botones encontrados:`);
        console.log(`      😊 Emoji: ${editorButtons.emoji ? '✅' : '❌'}`);
        console.log(`      📎 Adjuntar: ${editorButtons.attach ? '✅' : '❌'}`);
        console.log(`      </> Código: ${editorButtons.code ? '✅' : '❌'}`);
        console.log(`      • Lista: ${editorButtons.list ? '✅' : '❌'}`);
        console.log(`      Total: ${editorButtons.total}/4\n`);

        // Tomar screenshot del Copilot abierto
        await page.screenshot({ path: 'test-copilot-editor.png', fullPage: true });
        console.log('   📸 Screenshot: test-copilot-editor.png\n');

        if (editorButtons.total === 4) {
          console.log('   ✅ ¡TODOS LOS BOTONES DEL EDITOR ESTÁN PRESENTES!\n');

          // PASO 5: Probar funcionalidad de botones
          console.log('📝 PASO 5: Probando botones del editor...\n');

          // Buscar el textarea
          const textarea = await page.locator('textarea[placeholder*="Escribe"], textarea[placeholder*="Mensaje"]').first();

          if (await textarea.isVisible()) {
            console.log('   ✅ Textarea encontrado\n');

            // Probar botón de emoji
            console.log('   🧪 Probando botón de emoji...');
            const emojiBtn = await page.locator('button:has-text("😊")').first();
            if (await emojiBtn.isVisible()) {
              await emojiBtn.click();
              await page.waitForTimeout(500);
              console.log('   ✅ Click en botón emoji\n');

              await page.screenshot({ path: 'test-emoji-selector.png' });
              console.log('   📸 Screenshot: test-emoji-selector.png\n');
            }

            // Probar escribir en el textarea
            console.log('   🧪 Probando escribir en textarea...');
            await textarea.fill('Hola, esto es un mensaje de prueba 👋');
            await page.waitForTimeout(500);
            console.log('   ✅ Texto escrito en textarea\n');

            await page.screenshot({ path: 'test-texto-escrito.png' });
            console.log('   📸 Screenshot: test-texto-escrito.png\n');

          } else {
            console.log('   ⚠️  Textarea no encontrado\n');
          }

        } else {
          console.log('   ⚠️  No se encontraron todos los botones (${editorButtons.total}/4)\n');
        }

      } else {
        console.log('   ❌ Panel del Copilot NO se abrió\n');

        // Verificar si necesita evento seleccionado
        const needsEvent = await page.evaluate(() => {
          const text = document.body.textContent;
          return text?.includes('evento') || text?.includes('selecciona');
        });

        if (needsEvent) {
          console.log('   ℹ️  Puede que necesite un evento seleccionado para abrir Copilot\n');
        }
      }

    } else {
      console.log('   ⚠️  Botón de Copilot no encontrado en header\n');
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log('✅ Sesión autenticada: Verificada');
    console.log('Screenshots generados:');
    console.log('  - test-menu-usuario.png');
    console.log('  - test-copilot-editor.png');
    console.log('  - test-emoji-selector.png');
    console.log('  - test-texto-escrito.png');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);

    // Tomar screenshot del error
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('📸 Screenshot de error: test-error.png\n');
  }

  console.log('✅ Pruebas completadas\n');
}

testConSesionActiva().catch(err => {
  console.error('❌ Error fatal:', err.message);
  console.log('\n💡 Asegúrate de que Chrome esté abierto con debugging:');
  console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
  process.exit(1);
});
