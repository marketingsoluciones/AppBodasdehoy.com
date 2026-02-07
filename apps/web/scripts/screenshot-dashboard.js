const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error') || text.includes('400') || text.includes('Axios')) {
      logs.push({ type: msg.type(), text: text.substring(0, 300) });
    }
  });

  console.log("1. Navegando a login...");
  await page.goto("https://app-test.bodasdehoy.com/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log("2. Ingresando credenciales...");
  await page.fill('input[type="email"], input[name="identifier"], input[placeholder*="correo" i], input[placeholder*="email" i]', 'bodasdehoy.com@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'lorca2012M*+');

  console.log("3. Haciendo click en login...");
  await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")');

  console.log("4. Esperando carga completa (15 segundos)...");
  await page.waitForTimeout(15000);

  const finalUrl = page.url();
  console.log("5. URL final:", finalUrl);

  // Verificar si hay contenido cargado
  const pageContent = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasEvents: body.includes('evento') || body.includes('boda') || body.includes('Crear'),
      loadingVisible: body.includes('Un momento'),
      textSample: body.substring(0, 500)
    };
  });
  console.log("6. Estado de la página:", JSON.stringify(pageContent, null, 2));

  // Tomar screenshot
  const screenshotPath = '/Users/juancarlosparra/Projects/AppBodasdehoy.com/.screenshots/dashboard-loaded.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("7. Screenshot guardado en:", screenshotPath);

  if (logs.length > 0) {
    console.log("\n8. Errores detectados:");
    logs.slice(0, 5).forEach(l => console.log("   [" + l.type + "] " + l.text));
  }

  await browser.close();
})();
