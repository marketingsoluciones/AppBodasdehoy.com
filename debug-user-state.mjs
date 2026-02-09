
import { chromium } from 'playwright';

async function debugUser() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();
  
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  console.log('Click en Copilot...');
  const btn = page.locator('button:has-text("Copilot")').first();
  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(2000);
    
    // Buscar el texto del overlay
    const overlayText = await page.evaluate(() => {
      const body = document.body.innerText;
      const hasLoginMessage = body.includes('Inicia sesión');
      const cookies = document.cookie;
      const hasCookie = cookies.includes('sessionBodas');
      
      return {
        hasLoginMessage,
        hasCookie,
        cookiePreview: cookies.substring(0, 200),
      };
    });
    
    console.log('
Estado:');
    console.log('  Mensaje "Inicia sesión":', overlayText.hasLoginMessage ? '❌ Visible' : '✅ No visible');
    console.log('  Cookie de sesión:', overlayText.hasCookie ? '✅ Existe' : '❌ No existe');
    console.log('  Cookies:', overlayText.cookiePreview);
    
    await page.screenshot({ path: 'debug-user.png', fullPage: true });
  }
  
  console.log('
Esperando 60s...');
  await page.waitForTimeout(60000);
  await browser.close();
}
debugUser();
