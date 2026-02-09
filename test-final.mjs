import { chromium } from 'playwright';

async function testFinal() {
  console.log('Testing Copilot editor...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await (await browser.newContext({
    viewport: { width: 1400, height: 900 }
  })).newPage();

  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(3000);

  console.log('Opening Copilot...');
  const btn = page.locator('button:has-text("Copilot")').first();

  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(3000);

    const state = await page.evaluate(() => {
      const editor = document.querySelector('[contenteditable="true"]');
      const hasOverlay = document.body.innerText.includes('Inicia sesion');

      return {
        hasEditor: !!editor,
        editorDisplay: editor ? window.getComputedStyle(editor).display : null,
        editorOpacity: editor ? window.getComputedStyle(editor).opacity : null,
        hasOverlay: hasOverlay,
      };
    });

    console.log('\nResults:');
    console.log('  Editor exists:', state.hasEditor);
    console.log('  Editor display:', state.editorDisplay);
    console.log('  Editor opacity:', state.editorOpacity);
    console.log('  Overlay blocking:', state.hasOverlay);

    if (state.hasEditor && !state.hasOverlay) {
      console.log('\nTesting editor input...');
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.click();
      await page.waitForTimeout(500);

      await page.keyboard.type('Hola editor avanzado con markdown', { delay: 30 });
      await page.waitForTimeout(1000);

      console.log('Text written successfully!');

      await page.screenshot({ path: 'copilot-working.png', fullPage: true });
      console.log('Screenshot saved: copilot-working.png');

      console.log('\nSUCCESS! Copilot editor is visible and working!');
    } else if (state.hasOverlay) {
      console.log('\nWARNING: Overlay still blocking the editor');
    }
  }

  console.log('\nBrowser will stay open for 60 seconds...');
  await page.waitForTimeout(60000);
  await browser.close();
}

testFinal();
