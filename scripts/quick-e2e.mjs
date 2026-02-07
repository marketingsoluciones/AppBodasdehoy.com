import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3210';
const routes = ['/', '/chat', '/discover', '/files', '/settings'];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🧪 Ejecutando tests E2E rápidos...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const route of routes) {
    try {
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = response?.status() || 0;
      
      if (status < 400) {
        console.log(`✅ ${route} - Status: ${status}`);
        passed++;
      } else {
        console.log(`❌ ${route} - Status: ${status}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${route} - Error: ${err.message.split('\n')[0]}`);
      failed++;
    }
  }
  
  await browser.close();
  
  console.log(`\n📊 Resultados: ${passed} pasaron, ${failed} fallaron`);
  return failed === 0;
}

runTests().then(success => process.exit(success ? 0 : 1));
