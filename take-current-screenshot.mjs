#!/usr/bin/env node
import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  console.log(`📍 URL: ${page.url()}`);
  await page.screenshot({ path: 'current-state.png', fullPage: false });
  console.log('📸 Screenshot: current-state.png');

  // Abrir Copilot con atajo
  console.log('\n⌨️  Abriendo Copilot con ⌘⇧C...');
  await page.keyboard.press('Meta+Shift+KeyC');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'copilot-reopened.png', fullPage: false });
  console.log('📸 Screenshot: copilot-reopened.png\n');
}

takeScreenshot().catch(console.error);
