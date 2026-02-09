#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('\n🚀 Abriendo y Mostrando el Copilot...\n');

const browser = await chromium.launch({
  headless: false,
  slowMo: 500,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
});

const page = await context.newPage();

console.log('✓ Navegador abierto');
console.log('ℹ Navegando a la página principal...\n');

await page.goto('http://localhost:8080/', {
  waitUntil: 'networkidle',
  timeout: 15000
});

await page.waitForTimeout(2000);

console.log('✓ Página cargada');
console.log('ℹ Buscando el botón "Copilot" en el header...\n');

// Buscar el botón del Copilot
const copilotButton = await page.locator('button:has-text("Copilot")').first();
const buttonExists = await copilotButton.count() > 0;

if (buttonExists) {
  console.log('✅ Botón "Copilot" encontrado en el header');
  console.log('ℹ Haciendo click para abrir el sidebar...\n');

  await copilotButton.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'copilot-abierto.png', fullPage: true });
  console.log('📸 Screenshot guardado: copilot-abierto.png\n');

  console.log('✅ COPILOT ABIERTO\n');
  console.log('📝 AHORA PUEDES:\n');
  console.log('1. Ver el sidebar del Copilot en el lado izquierdo');
  console.log('2. Buscar el input de chat en la parte inferior del sidebar');
  console.log('3. Escribir: "Hola, ¿cómo estás?"');
  console.log('4. Presionar Enter');
  console.log('5. Ver la respuesta con markdown renderizado\n');

} else {
  console.log('⚠️  Botón "Copilot" no encontrado');
  console.log('ℹ Puede que necesites hacer login primero\n');

  await page.screenshot({ path: 'sin-boton-copilot.png' });
  console.log('📸 Screenshot guardado: sin-boton-copilot.png\n');
}

console.log('⏳ El navegador permanecerá abierto...');
console.log('   Prueba el chat y presiona Ctrl+C cuando termines.\n');

await page.waitForTimeout(600000);
