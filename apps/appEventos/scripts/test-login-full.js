const { webkit } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const LOCK_PATH = path.join("/tmp", "app-eventos-playwright-webkit.lock");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureSinglePlaywrightSession = async () => {
  try {
    if (!fs.existsSync(LOCK_PATH)) return;
    const raw = fs.readFileSync(LOCK_PATH, "utf8").trim();
    const previousPid = Number(raw);
    if (!Number.isFinite(previousPid) || previousPid <= 0 || previousPid === process.pid) return;
    try {
      process.kill(previousPid, 0);
      console.log(`[lock] Sesion Playwright previa detectada (${previousPid}), cerrando...`);
      process.kill(previousPid, "SIGTERM");
      await sleep(1000);
    } catch (_err) {
      // El proceso previo ya no existe; continuar.
    }
  } catch (err) {
    console.warn("[lock] No se pudo verificar lock Playwright:", err?.message || err);
  }
};

const writeLock = () => {
  fs.writeFileSync(LOCK_PATH, String(process.pid));
};

const clearLock = () => {
  try {
    if (fs.existsSync(LOCK_PATH)) {
      const raw = fs.readFileSync(LOCK_PATH, "utf8").trim();
      if (Number(raw) === process.pid) {
        fs.unlinkSync(LOCK_PATH);
      }
    }
  } catch (_err) {
    // Evitar romper salida por fallo de limpieza de lock.
  }
};

(async () => {
  await ensureSinglePlaywrightSession();
  writeLock();
  process.on("exit", clearLock);
  process.on("SIGINT", () => { clearLock(); process.exit(130); });
  process.on("SIGTERM", () => { clearLock(); process.exit(143); });

  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  const failedRequests = [];
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  page.on("response", async (response) => {
    if (response.status() >= 400) {
      let bodySnippet = "";
      try {
        const text = await response.text();
        bodySnippet = text.slice(0, 300);
      } catch (_err) {
        bodySnippet = "<sin cuerpo legible>";
      }
      failedRequests.push({
        status: response.status(),
        url: response.url(),
        bodySnippet,
      });
    }
  });

  console.log("1. Navegando a login...");
  await page.goto("https://app-dev.bodasdehoy.com/login", { waitUntil: "domcontentloaded", timeout: 30000 });
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
    l.text.includes('api2.bodasdehoy')
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

  if (failedRequests.length > 0) {
    console.log("\n8. Requests fallidos:");
    failedRequests.slice(0, 10).forEach((r) => {
      const shortBody = r.bodySnippet.length > 180 ? r.bodySnippet.slice(0, 180) + "..." : r.bodySnippet;
      console.log(`   [${r.status}] ${r.url}`);
      console.log(`      body: ${shortBody}`);
    });
  } else {
    console.log("\n8. No se detectaron requests >= 400");
  }

  await browser.close();
  clearLock();
})();
