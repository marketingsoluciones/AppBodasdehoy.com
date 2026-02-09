#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('\n🚀 Abriendo Copilot COMPLETO con Editor Avanzado\n');

const browser = await chromium.launch({
  headless: false,
  slowMo: 300,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
});

const page = await context.newPage();

console.log('ℹ Navegando a http://localhost:3210 (Copilot completo)...\n');

await page.goto('http://localhost:3210', {
  waitUntil: 'networkidle',
  timeout: 15000
});

await page.waitForTimeout(3000);

await page.screenshot({ path: 'copilot-completo.png', fullPage: true });
console.log('📸 Screenshot guardado: copilot-completo.png\n');

console.log('✅ COPILOT COMPLETO ABIERTO\n');
console.log('Este es el copilot con:');
console.log('  ✓ Editor avanzado con toolbar completo');
console.log('  ✓ Plugins de markdown (@lobehub/editor)');
console.log('  ✓ Slash commands (/ para ver menú)');
console.log('  ✓ @mentions');
console.log('  ✓ Formato: Bold, Italic, Code, Listas, etc.\n');

console.log('⏳ Navegador abierto. Prueba escribir en el editor.\n');
console.log('💡 TIP: Escribe "/" para ver el menú de comandos\n');

await page.waitForTimeout(600000);
