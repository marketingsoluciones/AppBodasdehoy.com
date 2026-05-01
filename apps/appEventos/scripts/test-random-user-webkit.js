/**
 * Smoke WebKit “tipo usuario”: elige al azar (o por env) entre
 *   - invitados: crear invitado (GraphQL creaInvitado)
 *   - servicios: crear tarea/servicio (GraphQL createTask)
 *
 * Credenciales: variables de entorno o `.env.e2e.local` (gitignored; ver `.env.e2e.example`).
 *   TEST_EMAIL + TEST_PASSWORD   o   TEST_USER_EMAIL + TEST_USER_PASSWORD
 *
 * Opcional:
 *   BASE_URL (default https://app-dev.bodasdehoy.com)
 *   TEST_EVENT_ID (Mongo id del evento de prueba)
 *   TEST_RANDOM_SCENARIO = random | guests | services
 */
const { webkit } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
require("./load-e2e-env.cjs")();

const BASE_URL = (process.env.BASE_URL || "https://app-dev.bodasdehoy.com").replace(/\/$/, "");
const LOGIN_URL = `${BASE_URL}/login`;
const EMAIL = process.env.TEST_EMAIL || process.env.TEST_USER_EMAIL || "";
const PASSWORD = process.env.TEST_PASSWORD || process.env.TEST_USER_PASSWORD || "";
const EVENT_ID = process.env.TEST_EVENT_ID || "66a9042dec5c58aa734bca44";
const LOCK_PATH = path.join("/tmp", "app-eventos-playwright-webkit.lock");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const scenarioRaw = (process.env.TEST_RANDOM_SCENARIO || "random").toLowerCase();

function pickScenario() {
  if (scenarioRaw === "guests") return "guests";
  if (scenarioRaw === "services") return "services";
  if (scenarioRaw !== "random") {
    console.warn(`TEST_RANDOM_SCENARIO desconocido "${scenarioRaw}", uso aleatorio guests|services`);
  }
  return Math.random() < 0.5 ? "guests" : "services";
}

const ensureSinglePlaywrightSession = async () => {
  if (!fs.existsSync(LOCK_PATH)) return;
  const previousPid = Number(fs.readFileSync(LOCK_PATH, "utf8").trim());
  if (!Number.isFinite(previousPid) || previousPid <= 0 || previousPid === process.pid) return;
  try {
    process.kill(previousPid, 0);
    process.kill(previousPid, "SIGTERM");
    await sleep(1000);
  } catch (_e) {
    /* no existe */
  }
};

const writeLock = () => fs.writeFileSync(LOCK_PATH, String(process.pid));
const clearLock = () => {
  try {
    if (!fs.existsSync(LOCK_PATH)) return;
    const raw = fs.readFileSync(LOCK_PATH, "utf8").trim();
    if (Number(raw) === process.pid) fs.unlinkSync(LOCK_PATH);
  } catch (_e) {
    /* */
  }
};

const safeGoto = async (page, url, timeout = 45000) => {
  try {
    await page.goto(url, { waitUntil: "commit", timeout });
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (!msg.includes("interrupted by another navigation")) throw err;
  }
};

const clickFirstVisible = async (page, selectors) => {
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.click({ timeout: 2500 });
        return selector;
      } catch (_e) {
        /* */
      }
    }
  }
  return null;
};

const clickByContainsText = async (page, snippets) => {
  return page.evaluate((candidates) => {
    const norm = (v) => (v || "").toLowerCase();
    const all = Array.from(document.querySelectorAll("body *"));
    for (const snippet of candidates) {
      const target = all.find((el) => norm(el.textContent).includes(norm(snippet)));
      if (!target) continue;
      const clickable = target.closest("button, a, [role='button'], [onclick], li, div") || target;
      clickable.scrollIntoView({ block: "center" });
      clickable.click();
      return snippet;
    }
    return null;
  }, snippets);
};

const waitUntilNotAuthLoading = async (page, timeoutMs = 45000) => {
  await page.waitForFunction(
    () => {
      const txt = (document.body?.innerText || "").toLowerCase();
      const authLoading =
        txt.includes("si ves esto, la app está respondiendo") || txt.includes("continuar como invitado");
      return !authLoading;
    },
    { timeout: timeoutMs },
  );
};

async function doLogin(page) {
  await page.goto(LOGIN_URL, { waitUntil: "commit", timeout: 90000 });
  await page.waitForFunction(
    () => {
      const txt = (document.body?.innerText || "").toLowerCase();
      return txt.length > 20 && !txt.includes("si ves esto, la app está respondiendo");
    },
    { timeout: 90000 },
  );
  await page.waitForTimeout(1500);

  const emailInput = page
    .locator('input[type="email"], input[name="identifier"], input[placeholder*="correo" i], input[placeholder*="email" i]')
    .first();
  try {
    await emailInput.waitFor({ timeout: 8000 });
  } catch (_e) {
    /* sesión */
  }

  if (await emailInput.count()) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")').first().click();
    await page.waitForTimeout(5000);
  }

  const refreshResponse = await page.request.post(`${BASE_URL}/api/dev/refresh-session`, {
    data: { email: EMAIL },
    headers: { "content-type": "application/json" },
  });
  console.log(`[login] refresh-session: ${refreshResponse.status()}`);
  await page.waitForTimeout(1200);
  await safeGoto(page, `${BASE_URL}/`, 45000);
  await page.waitForTimeout(2500);

  if (page.url().includes("/login")) {
    let bodyText = (await page.locator("body").innerText()).slice(0, 1200);
    if (/cargando/i.test(bodyText) && /si ves esto/i.test(bodyText)) {
      await safeGoto(page, `${BASE_URL}/`, 45000);
      await page.waitForTimeout(4000);
      bodyText = (await page.locator("body").innerText()).slice(0, 1200);
    }
    const seemsLogged = /inici[oó]\s+sesi[oó]n\s+con\s+[eé]xito/i.test(bodyText) || /copilot/i.test(bodyText);
    if (seemsLogged) {
      await safeGoto(page, `${BASE_URL}/`, 45000);
      await page.waitForTimeout(2000);
    } else {
      throw new Error(`Sigue en /login. Fragmento: ${bodyText.slice(0, 400)}`);
    }
  }
}

async function waitHomeEvents(page) {
  await safeGoto(page, `${BASE_URL}/`, 45000);
  await page.waitForFunction(
    () => {
      const t = (document.body?.innerText || "").toLowerCase();
      return !t.includes("cargando eventos");
    },
    { timeout: 120000 },
  );
  await page.waitForFunction(
    () => !!(document.querySelector("#rootsection") || document.querySelector(".cardEvento")),
    { timeout: 120000 },
  );
  if (!(await page.locator(".cardEvento").count())) {
    await safeGoto(page, `${BASE_URL}/eventos`, 45000);
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(1200);
}

async function pickIsabelCard(page) {
  const tabBar = page.locator("div.inline-flex.gap-4.py-2").locator("button");
  const tabCount = await tabBar.count();
  const tabsToScan = tabCount > 0 ? tabCount : 0;
  for (let ti = 0; ti < Math.max(tabsToScan, 3); ti++) {
    if (tabsToScan > 0) {
      await tabBar.nth(ti % tabsToScan).click({ timeout: 5000 }).catch(() => null);
    }
    await page.waitForTimeout(1200);
    const card = page.locator(".cardEvento").filter({ hasText: /ISABEL/i }).first();
    if (await card.count()) {
      await card.click();
      return true;
    }
  }
  const v = await clickFirstVisible(page, [
    '.cardEvento:has-text("ISABEL")',
    'text=/BODA\\s+DE\\s+ISABEL/i',
    'text=/Isabel\\s*&\\s*Ra[uú]l/i',
  ]);
  if (v) return true;
  const t = await clickByContainsText(page, ["BODA DE ISABEL & RAÚ", "BODA DE ISABEL", "ISABEL"]);
  return !!t;
}

const graphqlPostIncludes = (res, needle) => {
  if (!res.url().includes("graphql") || res.request().method() !== "POST") return false;
  try {
    const pd = res.request().postDataJSON();
    return typeof pd?.query === "string" && pd.query.includes(needle);
  } catch {
    return false;
  }
};

async function runGuests(page) {
  const unique = Date.now();
  const guestName = `Invitado Rand ${unique}`;
  const guestEmail = `invitado.rand.${unique}@example.com`;
  const guestPhone = `+346${String(unique % 100000000).padStart(8, "0")}`;

  await waitHomeEvents(page);
  const picked = await pickIsabelCard(page);
  if (picked) {
    try {
      await page.waitForURL(/\/resumen-evento|\/resumen/i, { timeout: 25000 });
    } catch (_e) {
      /* */
    }
    await page.waitForTimeout(2500);
  }

  const invitadosUrl = `${BASE_URL}/invitados?event=${EVENT_ID}`;
  await safeGoto(page, invitadosUrl, 45000);
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => null);
  await page.waitForFunction(
    () => {
      const txt = (document.body?.innerText || "").toLowerCase();
      return !txt.includes("cargando...si ves esto");
    },
    { timeout: 90000 },
  );
  await waitUntilNotAuthLoading(page, 60000);
  await page.waitForTimeout(2000);

  const bodyInv = (await page.locator("body").innerText()).toLowerCase();
  if (/elige un evento activo|choose an active event/i.test(bodyInv)) {
    throw new Error("No hay evento en contexto");
  }

  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    const t = await page.locator("body").innerText();
    if (/Cargando eventos por más tiempo/i.test(t)) {
      throw new Error("eventsGroup no termina de cargar");
    }
    if (/Error al cargar los datos|El servidor no responde/i.test(t)) {
      throw new Error("Error al cargar eventos");
    }
    if (/Mis invitados|My guests/i.test(t)) {
      ready = true;
      break;
    }
    await page.waitForTimeout(2000);
  }
  if (!ready) throw new Error("Timeout cabecera invitados");

  const addInvitadoBtn = page.locator("section.bg-base button").filter({ hasText: /^(invitados|guests)$/i }).first();
  await addInvitadoBtn.waitFor({ state: "visible", timeout: 45000 });
  await addInvitadoBtn.click();
  await page.getByRole("heading", { name: /invitado/i }).first().waitFor({ state: "visible", timeout: 20000 });

  const responsePromise = page.waitForResponse(
    (res) => graphqlPostIncludes(res, "creaInvitado") && res.status() === 200,
    { timeout: 90000 },
  );

  await page.locator('input[name="telefono"]').first().fill(guestPhone);
  await page.locator('input[name="nombre"]').first().fill(guestName);
  await page.locator('input[name="correo"]').first().fill(guestEmail);

  const rolSelect = page.locator('select[name="rol"]');
  if (await rolSelect.count()) {
    const optCount = await rolSelect.locator("option").count();
    if (optCount > 1) await rolSelect.selectOption({ index: 1 });
  }

  await page.getByRole("button", { name: /crear invitado/i }).click();
  const createRes = await responsePromise;
  const createJson = await createRes.json();
  const invitados = createJson?.data?.creaInvitado?.invitados_array;
  if (!Array.isArray(invitados) || !invitados.length) {
    throw new Error(`creaInvitado inesperado: ${JSON.stringify(createJson).slice(0, 400)}`);
  }
  const created =
    invitados.find((g) => (g?.nombre || "").includes(String(unique))) || invitados[invitados.length - 1];
  console.log("[guests] OK invitado _id=", created?._id, guestName);
}

async function runServices(page) {
  await waitHomeEvents(page);
  await safeGoto(page, `${BASE_URL}/servicios?event=${EVENT_ID}`, 45000);
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => null);
  await waitUntilNotAuthLoading(page, 60000);
  await page.waitForTimeout(1500);
  // El botón de nueva tarea solo aparece en vista cards/table (ItineraryTabs).
  await page.evaluate(() => {
    try {
      window.localStorage.setItem("VIEWservicios", JSON.stringify({ view: "cards" }));
    } catch (_e) {
      /* */
    }
  });
  await safeGoto(page, `${BASE_URL}/servicios?event=${EVENT_ID}`, 45000);
  await page.waitForTimeout(2000);

  const body = (await page.locator("body").innerText()).toLowerCase();
  if (/elige un evento activo|choose an active event/i.test(body)) {
    throw new Error("Servicios: sin evento en contexto");
  }

  await page.waitForFunction(
    () => {
      const t = (document.body?.innerText || "").toLowerCase();
      return t.includes("tasks") || t.includes("servicio") || t.includes("tarea");
    },
    { timeout: 120000 },
  );

  const responsePromise = page.waitForResponse(
    (res) => graphqlPostIncludes(res, "createTask") && res.status() === 200,
    { timeout: 90000 },
  );

  const addCandidates = [
    "section.bg-base .inline-flex.space-x-2 button.bg-primary",
    "section.bg-base button.bg-primary:has(svg)",
    "section.bg-base .flex.items-center.space-x-2 button.bg-primary",
  ];
  let clicked = false;
  for (const sel of addCandidates) {
    const btn = page.locator(sel).first();
    if (await btn.count()) {
      try {
        await btn.waitFor({ state: "visible", timeout: 8000 });
        await btn.click({ timeout: 5000 });
        clicked = true;
        console.log("[services] click add:", sel);
        break;
      } catch (_e) {
        /* */
      }
    }
  }
  if (!clicked) {
    throw new Error("No se encontró botón de agregar tarea/servicio (vista cards + permisos?)");
  }

  const res = await responsePromise;
  const json = await res.json();
  const task = json?.data?.createTask;
  if (!task?._id) {
    throw new Error(`createTask inespero: ${JSON.stringify(json).slice(0, 500)}`);
  }
  console.log("[services] OK tarea _id=", task._id, task.descripcion || "");
}

(async () => {
  if (!EMAIL || !PASSWORD) {
    console.error(
      "Faltan credenciales: TEST_EMAIL/TEST_PASSWORD o TEST_USER_*, o ficheros .env.e2e.local / raíz .env.e2e.test.local (ver .env.e2e.credentials.example).",
    );
    process.exit(1);
  }
  const effectiveScenario = pickScenario();

  console.log(`[random-user-webkit] BASE_URL=${BASE_URL} escenario=${effectiveScenario} EVENT_ID=${EVENT_ID}`);

  await ensureSinglePlaywrightSession();
  writeLock();
  process.on("exit", clearLock);
  process.on("SIGINT", () => {
    clearLock();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    clearLock();
    process.exit(143);
  });

  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  try {
    await doLogin(page);
    if (effectiveScenario === "guests") {
      await runGuests(page);
    } else {
      await runServices(page);
    }
    console.log("RESULTADO: OK");
  } finally {
    await browser.close();
    clearLock();
  }
})();
