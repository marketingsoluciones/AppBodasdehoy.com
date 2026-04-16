import { chromium } from 'playwright';

async function monitor502Errors() {
  console.log('🚀 Iniciando navegador para monitoreo de errores 502...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=1400,900']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let error502Count = 0;
  let error5xxCount = 0;
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (status === 502) {
      error502Count++;
      console.log(`\n🔴 [502 #${error502Count}] ${new Date().toLocaleTimeString()} - ${url.substring(0, 80)}`);
    } else if (status >= 500) {
      error5xxCount++;
      console.log(`🟠 [${status}] ${url.substring(0, 80)}`);
    }
  });
  
  page.on('console', msg => {
    const text = msg.text();
    if ((text.includes('Error') || text.includes('502')) && text.length < 300) {
      console.log(`📝 ${text.substring(0, 120)}`);
    }
  });
  
  console.log('🔍 Navegando a https://app-test.bodasdehoy.com...');
  
  await page.goto('https://app-test.bodasdehoy.com', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  console.log('✅ Página cargada - Monitoreando errores...');
  console.log('👆 Haz clic en el Copilot para probarlo\n');
  
  setInterval(() => {
    console.log(`📊 [${new Date().toLocaleTimeString()}] 502: ${error502Count} | 5xx: ${error5xxCount}`);
  }, 30000);
  
  await new Promise(() => {});
}

monitor502Errors().catch(console.error);
