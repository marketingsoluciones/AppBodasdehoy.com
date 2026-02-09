import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();

  console.log('Loading...');
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  console.log('Opening Copilot...');
  const btn = page.locator('button:has-text("Copilot")').first();
  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(4000); // Esperar más tiempo para que cargue

    try {
      const info = await page.evaluate(() => {
        const ce = document.querySelector('[contenteditable="true"]');
        if (!ce) return { found: false };

        const styles = window.getComputedStyle(ce);
        const parentEl = ce.parentElement;

        return {
          found: true,
          tag: ce.tagName,
          display: styles.display,
          placeholder: ce.getAttribute('placeholder') || ce.getAttribute('data-placeholder'),
          parentTag: parentEl?.tagName,
          parentClass: parentEl?.className.substring(0, 150),
          innerHTML: ce.innerHTML.substring(0, 300),
          hasLobehub: ce.className.includes('lobehub') || ce.innerHTML.includes('lobehub'),
        };
      });

      console.log('\nEditor Info:');
      console.log('  Found:', info.found);
      if (info.found) {
        console.log('  Tag:', info.tag);
        console.log('  Display:', info.display);
        console.log('  Placeholder:', info.placeholder);
        console.log('  Parent:', info.parentTag);
        console.log('  Has Lobehub:', info.hasLobehub);
        console.log('  Parent classes:', info.parentClass);
      }

      await page.screenshot({ path: 'editor-check.png', fullPage: true });
      console.log('\nScreenshot: editor-check.png');

    } catch (err) {
      console.log('Error checking:', err.message);
    }
  }

  console.log('\nBrowser open 60s...');
  await page.waitForTimeout(60000);
  await browser.close();
}

check();
