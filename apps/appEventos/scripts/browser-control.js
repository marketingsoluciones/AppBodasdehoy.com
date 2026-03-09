const { chromium } = require("playwright");
const fs = require("fs");

const COMMANDS_FILE = "/tmp/browser-commands.txt";

(async () => {
  console.log("=== NAVEGADOR CONTROLADO REMOTAMENTE ===\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  // Limpiar archivo de comandos
  fs.writeFileSync(COMMANDS_FILE, "");

  console.log("Navegador listo. Esperando comandos...\n");
  console.log("Comandos disponibles:");
  console.log("  goto:URL         - Navegar a URL");
  console.log("  click:SELECTOR   - Click en elemento");
  console.log("  type:TEXT        - Escribir texto");
  console.log("  wait:MS          - Esperar milisegundos");
  console.log("  screenshot       - Tomar captura");
  console.log("  eval:CODE        - Ejecutar JS en página");
  console.log("  quit             - Cerrar navegador\n");

  // Loop para leer comandos
  while (true) {
    await new Promise(r => setTimeout(r, 500));

    if (fs.existsSync(COMMANDS_FILE)) {
      const cmd = fs.readFileSync(COMMANDS_FILE, "utf8").trim();
      if (cmd) {
        fs.writeFileSync(COMMANDS_FILE, ""); // Limpiar

        console.log(`> Ejecutando: ${cmd}`);

        try {
          if (cmd.startsWith("goto:")) {
            const url = cmd.slice(5);
            await page.goto(url, { timeout: 60000 });
            console.log(`  Navegado a ${url}`);

          } else if (cmd.startsWith("click:")) {
            const selector = cmd.slice(6);
            await page.click(selector);
            console.log(`  Click en ${selector}`);

          } else if (cmd.startsWith("type:")) {
            const text = cmd.slice(5);
            await page.keyboard.type(text, { delay: 50 });
            console.log(`  Escrito: ${text}`);

          } else if (cmd.startsWith("wait:")) {
            const ms = parseInt(cmd.slice(5));
            await page.waitForTimeout(ms);
            console.log(`  Esperado ${ms}ms`);

          } else if (cmd === "screenshot") {
            await page.screenshot({ path: "/tmp/screenshot.png" });
            console.log("  Captura guardada en /tmp/screenshot.png");

          } else if (cmd.startsWith("eval:")) {
            const code = cmd.slice(5);
            const result = await page.evaluate(code);
            console.log(`  Resultado: ${JSON.stringify(result)}`);

          } else if (cmd === "login") {
            // Comando especial para login completo
            console.log("  Ejecutando login automático...");
            await page.goto("https://app-test.bodasdehoy.com/login", { timeout: 60000 });
            await page.waitForTimeout(5000);

            const inputs = await page.$$("input");
            if (inputs.length >= 2) {
              await inputs[0].fill("bodasdehoy.com@gmail.com");
              await inputs[1].fill("lorca2012M*+");
              const btns = await page.$$("button");
              if (btns.length > 0) await btns[btns.length-1].click();
              console.log("  Login enviado");
            }

          } else if (cmd === "quit") {
            console.log("  Cerrando navegador...");
            break;

          } else {
            console.log(`  Comando no reconocido: ${cmd}`);
          }
        } catch (err) {
          console.log(`  Error: ${err.message}`);
        }
      }
    }
  }

  await browser.close();
  console.log("\nNavegador cerrado.");
})();
