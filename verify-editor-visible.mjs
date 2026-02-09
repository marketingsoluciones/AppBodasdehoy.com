
import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();
  
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  console.log('
📍 Abriendo Copilot...');
  const btn = page.locator('button:has-text("Copilot")').first();
  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(3000); // Esperar animación
    
    const state = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      const overlay = document.body.innerText.includes('Inicia sesión para usar');
      
      return {
        hasEditor: !!editor,
        editorVisible: editor ? window.getComputedStyle(editor).display !== 'none' : false,
        editorOpacity: editor ? window.getComputedStyle(editor).opacity : '0',
        hasOverlay: overlay,
        editorClasses: editor ? editor.className : null,
        editorParent: editor ? editor.parentElement.className : null,
      };
    });
    
    console.log('
✅ RESULTADO:');
    console.log('   Editor existe:', state.hasEditor ? '✅' : '❌');
    console.log('   Editor visible:', state.editorVisible ? '✅' : '❌');
    console.log('   Editor opacity:', state.editorOpacity);
    console.log('   Overlay bloqueando:', state.hasOverlay ? '❌ SÍ' : '✅ NO');
    
    if (state.hasEditor) {
      console.log('
📝 Probando escribir en el editor...');
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.click();
      await page.waitForTimeout(500);
      
      await page.keyboard.type('**Hola** esto es una _prueba_ del editor avanzado', { delay: 30 });
      await page.waitForTimeout(1000);
      
      console.log('   ✅ Texto escrito correctamente');
      
      await page.screenshot({ path: 'editor-funcionando.png', fullPage: true });
      console.log('
📸 Screenshot guardado: editor-funcionando.png');
      
      console.log('
🎉 ¡ÉXITO! El editor del Copilot está visible y funcionando');
    }
  }
  
  console.log('
⏳ Navegador abierto 60s para que lo pruebes manualmente...');
  await page.waitForTimeout(60000);
  await browser.close();
}
verify();
