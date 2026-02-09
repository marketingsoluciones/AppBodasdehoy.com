#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('\n🚀 Abriendo Copilot Sidebar...\n');

const browser = await chromium.launch({
  headless: false,
  slowMo: 300,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 800 },
});

const page = await context.newPage();

console.log('✓ Navegador abierto');
console.log('ℹ Navegando a /eventos (donde está el sidebar del Copilot)...\n');

await page.goto('http://localhost:8080/eventos', {
  waitUntil: 'networkidle',
  timeout: 15000
});

await page.waitForTimeout(2000);

const currentUrl = page.url();
console.log(`✓ URL actual: ${currentUrl}\n`);

if (currentUrl.includes('/login')) {
  console.log('🔐 Se requiere LOGIN\n');
  console.log('📝 INSTRUCCIONES:\n');
  console.log('1. El navegador está abierto en la página de login');
  console.log('2. Ingresa tus credenciales');
  console.log('3. Después del login, serás redirigido a /eventos');
  console.log('4. Verás el SIDEBAR del Copilot en el lado IZQUIERDO');
  console.log('5. Busca el input de chat en la parte inferior del sidebar');
  console.log('6. Escribe: "Hola, ¿cómo estás?"');
  console.log('7. Presiona Enter');
  console.log('8. Observa la respuesta con markdown\n');

  await page.screenshot({ path: 'login-required.png' });
  console.log('📸 Screenshot guardado: login-required.png\n');

} else {
  console.log('✅ Ya estás logueado\n');
  console.log('📝 INSTRUCCIONES:\n');
  console.log('1. Busca el SIDEBAR del Copilot en el lado IZQUIERDO');
  console.log('2. Si no lo ves, busca un botón flotante de chat');
  console.log('3. En el input del chat, escribe: "Hola, ¿cómo estás?"');
  console.log('4. Presiona Enter');
  console.log('5. Observa la respuesta con markdown renderizado\n');

  await page.screenshot({ path: 'copilot-sidebar-ready.png', fullPage: true });
  console.log('📸 Screenshot guardado: copilot-sidebar-ready.png\n');
}

console.log('⏳ El navegador permanecerá abierto...');
console.log('   Prueba el chat y presiona Ctrl+C cuando termines.\n');
console.log('💡 TIP: El sidebar está en el LADO IZQUIERDO de la pantalla\n');

// Mantener abierto
await page.waitForTimeout(600000); // 10 minutos
