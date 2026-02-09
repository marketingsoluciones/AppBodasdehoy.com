#!/usr/bin/env node
import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8080/copilot', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'copilot-current-state.png', fullPage: true });
  console.log('✓ Screenshot guardado: copilot-current-state.png');

  await browser.close();
}

takeScreenshot().catch(console.error);
