const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1. Navegando a login...");
  await page.goto("https://app-test.bodasdehoy.com/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log("2. Ingresando credenciales...");
  await page.fill('input[type="email"], input[name="identifier"], input[placeholder*="correo" i], input[placeholder*="email" i]', 'bodasdehoy.com@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'lorca2012M*+');

  console.log("3. Haciendo click en login...");
  await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")');

  console.log("4. Esperando navegación y carga...");
  await page.waitForTimeout(8000);

  const finalUrl = page.url();
  console.log("5. URL final:", finalUrl);

  // Tomar screenshot
  const screenshotPath = '/Users/juancarlosparra/Projects/AppBodasdehoy.com/.screenshots/after-login.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("6. Screenshot guardado en:", screenshotPath);

  await browser.close();
})();
