const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://app-test.bodasdehoy.com/login", { waitUntil: "networkidle", timeout: 15000 });

  // Evaluar isLocalhost en el cliente
  const isLocalhost = await page.evaluate(() => {
    const hostname = window.location.hostname;
    const result = typeof window !== "undefined" &&
      (hostname === "localhost" ||
       hostname === "127.0.0.1" ||
       hostname.includes("-test."));
    return {
      hostname: hostname,
      isLocalhost: result,
      includesTest: hostname.includes("-test.")
    };
  });
  console.log("isLocalhost evaluation:", JSON.stringify(isLocalhost, null, 2));

  await browser.close();
})();
