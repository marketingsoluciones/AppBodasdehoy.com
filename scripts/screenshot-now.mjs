import { chromium } from 'playwright';

async function takeScreenshot() {
  // Connect to existing browser
  const browser = await chromium.connectOverCDP('http://localhost:9222').catch(() => null);

  if (!browser) {
    // Launch new browser and take screenshot
    const newBrowser = await chromium.launch({ headless: false });
    const page = await newBrowser.newPage();
    await page.goto('https://app-test.bodasdehoy.com', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click Copilot
    const btn = await page.$('button:has-text("Copilot")');
    if (btn) await btn.click();
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/tmp/copilot-current.png' });
    console.log('Screenshot saved: /tmp/copilot-current.png');

    // Check iframe content
    const iframes = await page.$$('iframe');
    for (const iframe of iframes) {
      const src = await iframe.getAttribute('src');
      if (src && src.includes('chat')) {
        try {
          const frame = await iframe.contentFrame();
          if (frame) {
            const text = await frame.evaluate(() => document.body.innerText.substring(0, 500));
            console.log('\nIframe content:\n' + text);
          }
        } catch(e) {
          console.log('Cannot read iframe (cross-origin)');
        }
      }
    }

    await newBrowser.close();
  }
}

takeScreenshot();
