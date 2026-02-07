const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  console.log("1. Navegando a login...");
  await page.goto("https://app-test.bodasdehoy.com/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log("2. Ingresando credenciales...");
  await page.fill('input[type="email"], input[name="identifier"], input[placeholder*="correo" i], input[placeholder*="email" i]', 'bodasdehoy.com@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'lorca2012M*+');

  console.log("3. Haciendo click en login...");
  await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")');

  console.log("4. Esperando navegación...");
  await page.waitForTimeout(5000);

  const finalUrl = page.url();
  console.log("5. URL final:", finalUrl);
  console.log("6. Login exitoso:", !finalUrl.includes('/login'));

  // Filtrar logs relevantes
  const relevantLogs = logs.filter(l =>
    l.text.includes('Error') ||
    l.text.includes('error') ||
    l.text.includes('CORS') ||
    l.text.includes('400') ||
    l.text.includes('proxy') ||
    l.text.includes('api.bodasdehoy')
  );

  if (relevantLogs.length > 0) {
    console.log("\n7. Logs relevantes:");
    relevantLogs.slice(0, 10).forEach(l => {
      const shortText = l.text.length > 200 ? l.text.substring(0, 200) + '...' : l.text;
      console.log("   [" + l.type + "] " + shortText);
    });
  } else {
    console.log("\n7. No hay errores CORS ni 400");
  }

  await browser.close();
})();
