import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();
  
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  const copilotBtn = page.locator('button:has-text("Copilot")').first();
  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    console.log('Clicking Copilot...');
    await copilotBtn.click();
    await page.waitForTimeout(2000);
    
    const state = await page.evaluate(() => ({
      editors: document.querySelectorAll('[contenteditable="true"]').length,
      textareas: document.querySelectorAll('textarea').length,
      motionDivs: document.querySelectorAll('[class*="motion"]').length,
    }));
    
    console.log('State:', state);
    await page.screenshot({ path: 'quick-copilot.png', fullPage: true });
  }
  
  console.log('Waiting 60s...');
  await page.waitForTimeout(60000);
  await browser.close();
}
run();
