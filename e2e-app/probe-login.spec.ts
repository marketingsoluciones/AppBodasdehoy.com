import { test } from '@playwright/test';

test('probe visitor access', async ({ page }) => {
  // Probar acceso directo al root como visitante (sin login)
  await page.goto('https://chat-dev.bodasdehoy.com/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(4000);
  const url = page.url();
  const btns = await page.locator('button').allTextContents();
  const hasInput = await page.locator('textarea, [contenteditable="true"]').count();
  console.log('URL después de /', url);
  console.log('BUTTONS:', JSON.stringify(btns.slice(0, 10)));
  console.log('HAS CHAT INPUT:', hasInput);
});
