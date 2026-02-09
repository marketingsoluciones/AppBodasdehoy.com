#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('\n🔍 DEBUG del Copilot Sidebar\n');
console.log('================================\n');

const browser = await chromium.launch({
  headless: false,
  slowMo: 800,
});

const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
});

const page = await context.newPage();

try {
  console.log('1️⃣ Navegando a la página principal...');
  await page.goto('http://localhost:8080/', {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  await page.waitForTimeout(2000);
  console.log('✓ Página cargada\n');

  console.log('2️⃣ Buscando botón "Copilot"...');
  const copilotButton = await page.locator('button:has-text("Copilot")').first();
  const buttonExists = await copilotButton.count() > 0;

  if (!buttonExists) {
    console.log('❌ Botón "Copilot" no encontrado');
    console.log('ℹ Puede que necesites hacer login\n');
    await browser.close();
    process.exit(1);
  }

  console.log('✓ Botón encontrado\n');

  console.log('3️⃣ Estado ANTES de hacer click:');
  
  // Verificar si hay algún sidebar visible
  const sidebarsBefore = await page.locator('[class*="ChatSidebar"], [class*="copilot"], [class*="fixed"][class*="right"], [class*="fixed"][class*="left"]').count();
  console.log(`   Elementos tipo sidebar encontrados: ${sidebarsBefore}`);

  // Screenshot antes
  await page.screenshot({ path: 'debug-antes-click.png' });
  console.log('   📸 Screenshot: debug-antes-click.png\n');

  console.log('4️⃣ Haciendo CLICK en el botón...');
  await copilotButton.click();
  await page.waitForTimeout(3000); // Esperar animación
  console.log('✓ Click ejecutado\n');

  console.log('5️⃣ Estado DESPUÉS de hacer click:');

  // Buscar elementos del sidebar
  const motionDivs = await page.locator('motion\\. div, [class*="motion"]').count();
  const fixedElements = await page.locator('[class*="fixed"]').count();
  const copilotElements = await page.locator('[class*="Copilot"], [class*="copilot"], [class*="chat"]').count();

  console.log(`   motion.div encontrados: ${motionDivs}`);
  console.log(`   Elementos position:fixed: ${fixedElements}`);
  console.log(`   Elementos con "copilot" o "chat": ${copilotElements}\n`);

  // Buscar el panel del chat específicamente
  console.log('6️⃣ Buscando panel del chat:');
  
  const chatPanel = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    
    // Buscar elementos que contengan "CopilotChatNative" o similares
    const chatElements = elements.filter(el => {
      const classes = el.className || '';
      const id = el.id || '';
      return classes.includes('chat') || 
             classes.includes('copilot') || 
             classes.includes('sidebar') ||
             id.includes('chat') ||
             id.includes('copilot');
    });

    if (chatElements.length === 0) return null;

    // Obtener info del primer elemento relevante
    const first = chatElements[0];
    const rect = first.getBoundingClientRect();
    const styles = window.getComputedStyle(first);

    return {
      tag: first.tagName,
      classes: first.className,
      id: first.id,
      position: styles.position,
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
      totalChatElements: chatElements.length
    };
  });

  if (chatPanel) {
    console.log('   ✅ Panel encontrado en el DOM:');
    console.log(`      Tag: ${chatPanel.tag}`);
    console.log(`      Position: ${chatPanel.position}`);
    console.log(`      Display: ${chatPanel.display}`);
    console.log(`      Visibility: ${chatPanel.visibility}`);
    console.log(`      Opacity: ${chatPanel.opacity}`);
    console.log(`      Z-Index: ${chatPanel.zIndex}`);
    console.log(`      Dimensiones: ${Math.round(chatPanel.width)}x${Math.round(chatPanel.height)}`);
    console.log(`      Posición: top=${Math.round(chatPanel.top)}, left=${Math.round(chatPanel.left)}`);
    console.log(`      En viewport: ${chatPanel.inViewport ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`      Total elementos chat: ${chatPanel.totalChatElements}\n`);
  } else {
    console.log('   ❌ Panel NO encontrado en el DOM\n');
  }

  // Screenshot después
  await page.screenshot({ path: 'debug-despues-click.png', fullPage: true });
  console.log('7️⃣ 📸 Screenshot: debug-despues-click.png\n');

  // Verificar contexto de ChatSidebar
  const chatContext = await page.evaluate(() => {
    const body = document.body.innerHTML;
    return {
      hasReactRoot: body.includes('__next'),
      hasChatSidebar: body.includes('ChatSidebar') || body.includes('chat-sidebar'),
      hasCopilot: body.includes('Copilot') || body.includes('copilot'),
      bodyClasses: document.body.className,
    };
  });

  console.log('8️⃣ Contexto de React/ChatSidebar:');
  console.log(`   React root existe: ${chatContext.hasReactRoot ? 'SÍ' : 'NO'}`);
  console.log(`   ChatSidebar en HTML: ${chatContext.hasChatSidebar ? 'SÍ' : 'NO'}`);
  console.log(`   Copilot en HTML: ${chatContext.hasCopilot ? 'SÍ' : 'NO'}`);
  console.log(`   Body classes: ${chatContext.bodyClasses || '(ninguna)'}\n`);

  console.log('================================');
  console.log('✅ DEBUG COMPLETADO\n');
  console.log('📁 Archivos generados:');
  console.log('   - debug-antes-click.png');
  console.log('   - debug-despues-click.png\n');

  console.log('⏳ Navegador permanece abierto para inspección manual...');
  console.log('   Presiona Ctrl+C cuando termines.\n');

  await page.waitForTimeout(300000);

} catch (error) {
  console.error(`\n❌ ERROR: ${error.message}\n`);
  await page.screenshot({ path: 'debug-error.png' });
  console.log('📸 Screenshot del error: debug-error.png\n');
} finally {
  // No cerrar automáticamente
}
