#!/usr/bin/env node
import { chromium } from 'playwright';

async function completeEventCreation() {
  console.log('🔍 Completando creación de evento...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    console.log(`📍 URL inicial: ${page.url()}\n`);

    // Cerrar cualquier modal abierto
    console.log('📝 PASO 1: Cerrando modales...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('   ✅ Modales cerrados\n');

    // Click en "Crear un evento"
    console.log('📝 PASO 2: Abriendo formulario de crear evento...');
    const createBtn = page.locator('button:has-text("Crear")').first();

    if (await createBtn.count() === 0) {
      console.log('   ❌ No se encontró botón Crear un evento\n');
      return;
    }

    await createBtn.click({ force: true });
    await page.waitForTimeout(1500);
    console.log('   ✅ Modal abierto\n');

    // Tomar screenshot del formulario
    await page.screenshot({ path: 'create-event-form.png' });
    console.log('📸 Screenshot: create-event-form.png\n');

    // Llenar el formulario
    console.log('📝 PASO 3: Llenando formulario...\n');

    // Campo nombre
    const nameInput = page.locator('input[placeholder*="nombre"], input[name*="nombre"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Copilot Event');
      console.log('   ✅ Nombre: "Test Copilot Event"');
    }

    // Tipo de evento (select)
    const typeSelect = page.locator('select').first();
    if (await typeSelect.count() > 0) {
      // Seleccionar la primera opción que no sea "Seleccionar"
      await typeSelect.selectOption({ index: 1 });
      console.log('   ✅ Tipo de evento seleccionado');
    }

    // Fecha
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill('2026-12-31');
      console.log('   ✅ Fecha: 2026-12-31');
    }

    // Zona horaria
    const timezoneSelect = page.locator('select').last();
    if (await timezoneSelect.count() > 1) {
      await timezoneSelect.selectOption({ index: 1 });
      console.log('   ✅ Zona horaria seleccionada');
    }

    await page.waitForTimeout(1000);

    // Tomar screenshot antes de guardar
    await page.screenshot({ path: 'before-save-event.png' });
    console.log('\n📸 Screenshot: before-save-event.png\n');

    // Click en Guardar
    console.log('📝 PASO 4: Guardando evento...');
    const saveBtn = page.locator('button:has-text("Guardar"), button[type="submit"]').first();

    if (await saveBtn.count() === 0) {
      console.log('   ❌ No se encontró botón Guardar\n');
      return;
    }

    await saveBtn.click({ force: true });
    console.log('   ✅ Click en Guardar');

    // Esperar navegación o cierre de modal
    await page.waitForTimeout(3000);

    const currentURL = page.url();
    console.log(`\n📍 URL actual: ${currentURL}\n`);

    // Tomar screenshot después de guardar
    await page.screenshot({ path: 'after-save-event.png' });
    console.log('📸 Screenshot: after-save-event.png\n');

    // Verificar si estamos dentro de un evento
    if (currentURL.includes('/evento') || currentURL !== 'http://localhost:8080/') {
      console.log('✅ Navegación exitosa al evento\n');
    } else {
      console.log('⚠️  Parece que seguimos en la home. Buscando evento creado...\n');

      // Buscar y hacer click en el evento creado
      const eventLink = page.locator('a[href*="/evento"], div:has-text("Test Copilot")').first();

      if (await eventLink.count() > 0) {
        console.log('   ✅ Evento encontrado, haciendo click...');
        await eventLink.click({ force: true });
        await page.waitForTimeout(2000);
        console.log(`   📍 URL: ${page.url()}\n`);
      }
    }

    // Ahora intentar abrir el Copilot
    console.log('📝 PASO 5: Abriendo Copilot con ⌘⇧C...');
    await page.keyboard.press('Meta+Shift+KeyC');
    await page.waitForTimeout(2000);
    console.log('   ✅ Atajo presionado\n');

    // Tomar screenshot final
    await page.screenshot({ path: 'final-with-copilot.png' });
    console.log('📸 Screenshot: final-with-copilot.png\n');

    console.log('✅ Proceso completado\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeEventCreation().catch(console.error);
