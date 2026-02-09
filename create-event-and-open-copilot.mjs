#!/usr/bin/env node
import { chromium } from 'playwright';

async function createEventAndOpenCopilot() {
  console.log('🔍 Creando evento y abriendo Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    const url = page.url();
    console.log(`📍 URL actual: ${url}\n`);

    // Paso 1: Buscar si ya existe algún evento en la lista
    console.log('📝 PASO 1: Verificando eventos existentes...');

    const existingEvents = await page.evaluate(() => {
      // Buscar cards de eventos (pueden tener diferentes clases)
      const eventCards = document.querySelectorAll('[class*="card"], [class*="event"], a[href*="/evento"]');
      return Array.from(eventCards).map(card => ({
        text: card.textContent?.trim().substring(0, 50),
        href: card.getAttribute('href')
      })).filter(e => e.href && !e.href.includes('crear'));
    });

    console.log(`   Eventos encontrados: ${existingEvents.length}`);

    if (existingEvents.length > 0) {
      console.log(`   ✅ Usando evento existente: ${existingEvents[0].href}\n`);

      // Navegar al primer evento
      await page.goto(`http://localhost:8080${existingEvents[0].href}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      console.log(`📍 Dentro del evento: ${page.url()}\n`);
    } else {
      console.log('   ⚠️  No hay eventos, creando uno nuevo...\n');

      // Buscar el botón "Crear un evento"
      const createEventButton = page.locator('button:has-text("Crear"), button:has-text("crear")').first();

      const buttonExists = await createEventButton.count() > 0;

      if (!buttonExists) {
        console.log('   ❌ No se encontró botón "Crear un evento"\n');
        return;
      }

      console.log('   ✅ Botón "Crear un evento" encontrado');
      await createEventButton.click({ force: true });
      await page.waitForTimeout(1500);

      // Llenar formulario básico de evento
      console.log('   📝 Llenando formulario de evento...');

      // Buscar campo de nombre
      const nameInput = page.locator('input[name="nombre"], input[placeholder*="nombre"], input[type="text"]').first();
      await nameInput.fill('Evento de Prueba Copilot');
      await page.waitForTimeout(500);

      // Buscar campo de tipo de evento
      const typeSelect = page.locator('select[name="tipo"], select').first();
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption({ index: 0 });
        await page.waitForTimeout(500);
      }

      // Buscar y hacer click en botón Guardar/Crear
      const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]').first();
      if (await saveButton.count() > 0) {
        await saveButton.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('   ✅ Evento creado\n');
      }
    }

    // Tomar screenshot dentro del evento
    await page.screenshot({ path: 'inside-event.png' });
    console.log('📸 Screenshot: inside-event.png\n');

    // Paso 2: Abrir Copilot desde dentro del evento
    console.log('📝 PASO 2: Abriendo Copilot...');

    const copilotButton = page.locator('button:has-text("Copilot"), [title*="Copilot"]').first();

    if (await copilotButton.count() === 0) {
      console.log('   ❌ No se encontró botón Copilot\n');
      return;
    }

    console.log('   ✅ Botón Copilot encontrado');
    await copilotButton.click({ force: true, timeout: 10000 });
    console.log('   ✅ Click realizado\n');

    // Esperar a que aparezca el panel del Copilot
    await page.waitForTimeout(3000);

    // Tomar screenshot del Copilot abierto
    await page.screenshot({ path: 'copilot-panel-opened.png' });
    console.log('📸 Screenshot: copilot-panel-opened.png\n');

    // Paso 3: Inspeccionar el editor
    console.log('📝 PASO 3: Inspeccionando editor del Copilot...\n');

    const editorInfo = await page.evaluate(() => {
      // Buscar diferentes selectores posibles para el textarea
      const textareaSelectors = [
        'textarea[placeholder*="mensaje"]',
        'textarea[placeholder*="Escribe"]',
        'textarea',
        '[contenteditable="true"]'
      ];

      let textarea = null;
      for (const selector of textareaSelectors) {
        textarea = document.querySelector(selector);
        if (textarea) break;
      }

      if (!textarea) {
        return {
          found: false,
          message: 'No se encontró textarea',
          html: document.body.innerHTML.substring(0, 500)
        };
      }

      // Buscar el contenedor del editor
      const editorContainer = textarea.closest('[class*="editor"], [class*="input"], [class*="copilot"], form, div');

      if (!editorContainer) {
        return {
          found: true,
          hasContainer: false,
          placeholder: textarea.placeholder || textarea.getAttribute('placeholder')
        };
      }

      // Buscar TODOS los botones en el contenedor
      const buttons = editorContainer.querySelectorAll('button');
      const buttonInfo = Array.from(buttons).map(btn => {
        const svg = btn.querySelector('svg');
        return {
          text: btn.textContent?.trim() || '',
          title: btn.getAttribute('title') || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          hasSvg: svg !== null,
          svgPath: svg ? svg.innerHTML.substring(0, 80) : '',
          classes: btn.className
        };
      });

      return {
        found: true,
        hasContainer: true,
        placeholder: textarea.placeholder || textarea.getAttribute('placeholder'),
        buttonCount: buttons.length,
        buttons: buttonInfo,
        containerClasses: editorContainer.className
      };
    });

    if (!editorInfo.found) {
      console.log(`❌ ${editorInfo.message}\n`);
      if (editorInfo.html) {
        console.log(`HTML muestra: ${editorInfo.html}\n`);
      }
      return;
    }

    console.log(`📊 Información del editor:`);
    console.log(`   Placeholder: ${editorInfo.placeholder}`);
    console.log(`   Botones encontrados: ${editorInfo.buttonCount}\n`);

    if (editorInfo.buttons && editorInfo.buttons.length > 0) {
      console.log(`📋 Detalles de los botones:\n`);

      editorInfo.buttons.forEach((btn, idx) => {
        console.log(`   Botón ${idx + 1}:`);
        console.log(`      Texto: "${btn.text}"`);
        console.log(`      Title: "${btn.title}"`);
        console.log(`      Tiene SVG: ${btn.hasSvg ? '✅ SÍ' : '❌ NO'}`);
        if (btn.hasSvg && btn.svgPath) {
          console.log(`      SVG: ${btn.svgPath}...`);
        }
        console.log('');
      });

      // Verificar si son los 4 botones esperados de CopilotInputEditor
      const expectedTitles = ['Emojis', 'Adjuntar archivo', 'Insertar código', 'Insertar lista'];

      const matchingButtons = editorInfo.buttons.filter(btn =>
        expectedTitles.some(title => btn.title.includes(title)) && btn.hasSvg
      );

      console.log(`\n✅ Botones correctos (con SVG) encontrados: ${matchingButtons.length}/4\n`);

      if (matchingButtons.length === 4) {
        console.log('🎉 ¡ÉXITO! El editor CopilotInputEditor está mostrándose correctamente');
        console.log('    Los 4 botones con iconos SVG de react-icons están presentes:\n');
        matchingButtons.forEach(btn => {
          console.log(`    ✓ ${btn.title}`);
        });
        console.log('');
      } else {
        console.log('⚠️  El editor no tiene los 4 botones esperados con SVG\n');
        console.log('Botones encontrados:');
        editorInfo.buttons.forEach(btn => {
          console.log(`  - "${btn.title || btn.text}" (SVG: ${btn.hasSvg})`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️  No se encontraron botones en el editor\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createEventAndOpenCopilot().catch(console.error);
