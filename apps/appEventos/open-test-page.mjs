
import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }})).newPage();

  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('[Console]', msg.type(), text);
    if (msg.type() === 'error') errors.push(text);
  });

  page.on('pageerror', err => {
    console.log('[PageError]', err.message);
    errors.push(err.message);
  });

  console.log('Opening test page...');
  await page.goto('http://localhost:8080/test-lobehub-editor', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'test-page.png', fullPage: true });
  console.log('Screenshot saved: test-page.png');

  if (errors.length > 0) {
    console.log('
Errors found:', errors.length);
    errors.slice(0, 5).forEach((err, i) => console.log(i + 1 + '.', err.substring(0, 200)));
  } else {
    console.log('
No errors!');
  }

  console.log('
Browser open 90s...');
  await page.waitForTimeout(90000);
  await browser.close();
}
test();
