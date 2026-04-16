#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('\n🧪 Probando el Botón "Abrir Copilot Completo"\n');
console.log('=============================================\n');

const browser = await chromium.launch({
  headless: false,
  slowMo: 500,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
});

const page = await context.newPage();

try {
  console.log('1️⃣ Abriendo página principal (puerto 8080)...');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2️⃣ Haciendo click en botón "Copilot" del header...');
  const copilotHeaderButton = await page.locator('button:has-text("Copilot")').first();
  await copilotHeaderButton.click();
  await page.waitForTimeout(2000);

  console.log('3️⃣ Buscando el botón "Abrir Copilot Completo"...');
  const expandButton = await page.locator('button:has-text("Abrir Copilot Completo"), button:has-text("Ver en Pantalla Completa")').first();
  
  const buttonExists = await expandButton.count() > 0;
  
  if (buttonExists) {
    console.log('   ✅ Botón encontrado!');
    
    // Esperar a que se abra la nueva pestaña
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      expandButton.click()
    ]);

    await newPage.waitForLoadState('networkidle');
    const newUrl = newPage.url();
    
    console.log(`\n4️⃣ Nueva pestaña abierta: ${newUrl}`);
    
    if (newUrl.includes('3210')) {
      console.log('\n✅ ÉXITO!');
      console.log('   El botón abrió correctamente el Copilot completo en puerto 3210\n');
      
      await newPage.waitForTimeout(2000);
      await newPage.screenshot({ path: 'copilot-completo-abierto.png', fullPage: true });
      console.log('📸 Screenshot guardado: copilot-completo-abierto.png\n');
      
      console.log('🎯 AHORA PUEDES:');
      console.log('   1. Ver el editor avanzado con toolbar completo');
      console.log('   2. Usar los íconos de formato (bold, italic, etc.)');
      console.log('   3. Escribir "/" para ver comandos');
      console.log('   4. Usar @ mentions');
      console.log('   5. Todo el poder del LobeChat original\n');
      
    } else {
      console.log(`\n⚠️  URL inesperada: ${newUrl}`);
    }
    
    console.log('⏳ Ambos navegadores permanecen abiertos para que pruebes.');
    console.log('   Presiona Ctrl+C cuando termines.\n');
    
    await page.waitForTimeout(300000);
    
  } else {
    console.log('   ❌ Botón NO encontrado');
    console.log('   Verifica que el sidebar esté abierto\n');
  }

} catch (error) {
  console.error(`\n❌ ERROR: ${error.message}\n`);
}
