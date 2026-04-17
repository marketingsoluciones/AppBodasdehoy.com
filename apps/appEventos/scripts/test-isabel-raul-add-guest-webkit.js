const { webkit } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

/**
 * E2E WebKit: login → evento Isabel & Raúl → crear invitado → token pGuest → confirmar asistencia.
 *
 * Variables útiles:
 *   BASE_URL              (default https://app-dev.bodasdehoy.com)
 *   TEST_EMAIL / TEST_PASSWORD / TEST_EVENT_ID
 *   TEST_DIRECT_INVITADOS=1   Omite la home y abre /invitados?event=… (requiere sync ?event en invitados.tsx desplegado, o servidor local con ese cambio).
 */
const BASE_URL = process.env.BASE_URL || "https://app-dev.bodasdehoy.com";
const LOGIN_URL = `${BASE_URL}/login`;
const EMAIL = process.env.TEST_EMAIL || "bodasdehoy.com@gmail.com";
const PASSWORD = process.env.TEST_PASSWORD || "lorca2012M*+";
const EVENT_ID = process.env.TEST_EVENT_ID || "66a9042dec5c58aa734bca44";
const DIRECT_INVITADOS = process.env.TEST_DIRECT_INVITADOS === "1";
const LOCK_PATH = path.join("/tmp", "app-eventos-playwright-webkit.lock");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureSinglePlaywrightSession = async () => {
  if (!fs.existsSync(LOCK_PATH)) return;
  const previousPid = Number(fs.readFileSync(LOCK_PATH, "utf8").trim());
  if (!Number.isFinite(previousPid) || previousPid <= 0 || previousPid === process.pid) return;
  try {
    process.kill(previousPid, 0);
    console.log(`[lock] Sesion previa detectada (${previousPid}), cerrando...`);
    process.kill(previousPid, "SIGTERM");
    await sleep(1000);
  } catch (_err) {
    // Proceso previo no existe.
  }
};

const writeLock = () => fs.writeFileSync(LOCK_PATH, String(process.pid));
const clearLock = () => {
  try {
    if (!fs.existsSync(LOCK_PATH)) return;
    const raw = fs.readFileSync(LOCK_PATH, "utf8").trim();
    if (Number(raw) === process.pid) fs.unlinkSync(LOCK_PATH);
  } catch (_err) {
    // Ignorar fallo de limpieza.
  }
};

const clickFirstVisible = async (page, selectors) => {
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.click({ timeout: 2500 });
        return selector;
      } catch (_err) {
        // Intentar siguiente selector.
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
      const clickable =
        target.closest("button, a, [role='button'], [onclick], li, div") || target;
      clickable.scrollIntoView({ block: "center" });
      clickable.click();
      return snippet;
    }
    return null;
  }, snippets);
};

const safeGoto = async (page, url, timeout = 45000) => {
  try {
    await page.goto(url, { waitUntil: "commit", timeout });
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (!msg.includes("interrupted by another navigation")) {
      throw err;
    }
  }
};

const waitUntilNotAuthLoading = async (page, timeoutMs = 45000) => {
  await page.waitForFunction(() => {
    const txt = (document.body?.innerText || "").toLowerCase();
    const authLoading = txt.includes("si ves esto, la app está respondiendo") || txt.includes("continuar como invitado");
    return !authLoading;
  }, { timeout: timeoutMs });
};

const buildGuestToken = (guestId, eventId) => `${guestId}${eventId.slice(3, 9)}${eventId}`;

(async () => {
  await ensureSinglePlaywrightSession();
  writeLock();
  process.on("exit", clearLock);
  process.on("SIGINT", () => { clearLock(); process.exit(130); });
  process.on("SIGTERM", () => { clearLock(); process.exit(143); });

  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  const unique = Date.now();
  const guestName = `Invitado Test ${unique}`;
  const guestEmail = `invitado.test.${unique}@example.com`;
  const guestPhone = `+346${String(unique % 100000000).padStart(8, "0")}`;

  try {
    console.log(`[1/9] Abriendo login en ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { waitUntil: "commit", timeout: 90000 });
    await page.waitForFunction(() => {
      const txt = (document.body?.innerText || "").toLowerCase();
      return txt.length > 20 && !txt.includes("si ves esto, la app está respondiendo");
    }, { timeout: 90000 });
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="email"], input[name="identifier"], input[placeholder*="correo" i], input[placeholder*="email" i]').first();
    try {
      await emailInput.waitFor({ timeout: 8000 });
    } catch (_err) {
      // Puede que ya exista una sesion activa.
    }

    if (await emailInput.count()) {
      console.log("[2/9] Haciendo login");
      await emailInput.fill(EMAIL);
      await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Entrar"), button:has-text("Login")').first().click();
      await page.waitForTimeout(5000);
    } else {
      console.log("[2/9] Sesion ya iniciada, se omite login");
    }

    console.log(`[3/9] URL post-login: ${page.url()}`);
    console.log("[3.1/9] Refrescando sesion dev (sin force)...");
    const refreshResponse = await page.request.post(`${BASE_URL}/api/dev/refresh-session`, {
      data: { email: EMAIL },
      headers: { "content-type": "application/json" },
    });
    console.log(`[3.2/9] refresh-session status: ${refreshResponse.status()}`);
    await page.waitForTimeout(1200);
    await safeGoto(page, `${BASE_URL}/`, 45000);
    await page.waitForTimeout(2500);

    if (page.url().includes("/login")) {
      let bodyText = (await page.locator("body").innerText()).slice(0, 1200);
      if (/cargando/i.test(bodyText) && /si ves esto/i.test(bodyText)) {
        console.log("[3.0/9] Login en estado de carga; reintentando en /");
        await safeGoto(page, `${BASE_URL}/`, 45000);
        await page.waitForTimeout(4000);
        bodyText = (await page.locator("body").innerText()).slice(0, 1200);
      }
      const seemsLogged = /inici[oó]\s+sesi[oó]n\s+con\s+[eé]xito/i.test(bodyText) || /copilot/i.test(bodyText);
      if (seemsLogged) {
        console.log("[3.3/9] Login parece exitoso sin redirect; forzando navegacion a /");
        await safeGoto(page, `${BASE_URL}/`, 45000);
        await page.waitForTimeout(2000);
      } else {
        throw new Error(`Sigue en /login tras intento de autenticacion. Evidencia: ${bodyText}`);
      }
    }

    let eventPicked = null;
    if (DIRECT_INVITADOS) {
      console.log("[4/9] TEST_DIRECT_INVITADOS=1: se omite la home (usa /invitados?event= con app que sincronice ?event)");
      eventPicked = "direct-invite";
    } else {
      console.log("[4/9] Abriendo evento Isabel & Raul (tabs + tarjeta → setEvent + resumen)");
      const homeUrl = `${BASE_URL.replace(/\/$/, "")}/`;
      await safeGoto(page, homeUrl, 45000);
      await page.waitForFunction(() => {
        const t = (document.body?.innerText || "").toLowerCase();
        return !t.includes("cargando eventos");
      }, { timeout: 120000 });
      await page.waitForFunction(
        () => !!(document.querySelector("#rootsection") || document.querySelector(".cardEvento")),
        { timeout: 120000 },
      );
      if (!(await page.locator(".cardEvento").count())) {
        console.log("[4.0/9] Sin tarjetas en /; probando /eventos");
        await safeGoto(page, `${BASE_URL}/eventos`, 45000);
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(1500);

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
          eventPicked = `tab[${ti}]`;
          break;
        }
      }
      if (!eventPicked) {
        eventPicked = await clickFirstVisible(page, [
          '.cardEvento:has-text("ISABEL")',
          'text=/BODA\\s+DE\\s+ISABEL/i',
          'text=/Isabel\\s*&\\s*Ra[uú]l/i',
        ]);
      }
      if (!eventPicked) eventPicked = await clickByContainsText(page, ["BODA DE ISABEL & RAÚ", "BODA DE ISABEL", "ISABEL"]);
      if (eventPicked) {
        try {
          await page.waitForURL(/\/resumen-evento|\/resumen/i, { timeout: 25000 });
        } catch (_err) {
          console.log("[4.1/9] No hubo redirect a resumen; continuando");
        }
        await page.waitForTimeout(2500);
      } else {
        console.log("[4.2/9] No se encontro tarjeta Isabel; fallback /invitados?event= (requiere deploy de sync ?event en invitados)");
      }
    }

    console.log("[5/9] Abriendo lista de invitados");
    const invitadosUrl =
      DIRECT_INVITADOS || !eventPicked
        ? `${BASE_URL}/invitados?event=${EVENT_ID}`
        : `${BASE_URL}/invitados`;
    await safeGoto(page, invitadosUrl, 45000);
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => null);
    await page.waitForFunction(() => {
      const txt = (document.body?.innerText || "").toLowerCase();
      return !txt.includes("cargando...si ves esto");
    }, { timeout: 90000 });
    await waitUntilNotAuthLoading(page, 60000);
    await page.waitForTimeout(2000);

    const bodyInv = (await page.locator("body").innerText()).toLowerCase();
    if (
      /elige un evento activo|choose an active event|elige un evento en la pantalla de inicio/i.test(bodyInv)
    ) {
      throw new Error("No hay evento en contexto: elige un evento activo en inicio");
    }

    const deadline = Date.now() + 120000;
    let ready = false;
    while (Date.now() < deadline) {
      const t = await page.locator("body").innerText();
      if (/Cargando eventos por más tiempo de lo normal/i.test(t)) {
        throw new Error(
          "La lista de eventos del usuario no termina de cargar (eventsGroup). Revisa GraphQL/sesión en este entorno o ejecuta el test contra un servidor local estable.",
        );
      }
      if (/Error al cargar los datos|El servidor no responde/i.test(t)) {
        throw new Error("Error al cargar eventos (EventLoadingOrError). Revisa API y reintenta.");
      }
      if (/Mis invitados|My guests/i.test(t)) {
        ready = true;
        break;
      }
      await page.waitForTimeout(2000);
    }
    if (!ready) {
      const sample = (await page.locator("body").innerText()).slice(0, 900);
      throw new Error(`Timeout esperando cabecera de invitados. Fragmento de UI: ${sample}`);
    }

    console.log("[6/9] Abriendo modal Nuevo invitado (primer boton + de la barra: ES invitados / EN guests)");
    const addInvitadoBtn = page
      .locator("section.bg-base button")
      .filter({ hasText: /^(invitados|guests)$/i })
      .first();
    await addInvitadoBtn.waitFor({ state: "visible", timeout: 45000 });
    await addInvitadoBtn.click();
    await page.getByRole("heading", { name: /invitado/i }).first().waitFor({ state: "visible", timeout: 20000 });

    const graphqlPredicate = (response) => {
      if (!response.url().includes("graphql") || response.request().method() !== "POST") return false;
      try {
        const pd = response.request().postDataJSON();
        return typeof pd?.query === "string" && pd.query.includes("creaInvitado");
      } catch {
        return false;
      }
    };

    const responsePromise = page.waitForResponse(
      (res) => graphqlPredicate(res) && res.status() === 200,
      { timeout: 90000 },
    );

    console.log("[7/9] Rellenando FormInvitado y enviando");
    await page.locator('input[name="telefono"]').first().fill(guestPhone);
    await page.locator('input[name="nombre"]').first().fill(guestName);
    await page.locator('input[name="correo"]').first().fill(guestEmail);

    const rolSelect = page.locator('select[name="rol"]');
    if (await rolSelect.count()) {
      const optCount = await rolSelect.locator("option").count();
      if (optCount > 1) {
        await rolSelect.selectOption({ index: 1 });
      }
    }

    await page.getByRole("button", { name: /crear invitado/i }).click();

    const createRes = await responsePromise;
    const createJson = await createRes.json();
    const invitados = createJson?.data?.creaInvitado?.invitados_array;
    if (!Array.isArray(invitados) || !invitados.length) {
      throw new Error(`Respuesta creaInvitado inesperada: ${JSON.stringify(createJson).slice(0, 500)}`);
    }
    const created = invitados.find((g) => (g?.nombre || "").includes(String(unique))) || invitados[invitados.length - 1];
    const guestId = created?._id;
    if (!guestId) {
      throw new Error("No se obtuvo _id del invitado creado");
    }
    const pToken = buildGuestToken(guestId, EVENT_ID);
    console.log(`[7.1/9] Invitado creado _id=${guestId}`);
    console.log(`[7.2/9] Token confirmacion (pGuestEvent): ${pToken}`);

    const rsvpCheck = await page.request.get(`${BASE_URL}/api/public/rsvp-guest?p=${encodeURIComponent(pToken)}`);
    console.log(`[8/9] GET rsvp-guest: ${rsvpCheck.status()}`);
    if (rsvpCheck.status() !== 200) {
      const errBody = await rsvpCheck.text();
      throw new Error(`rsvp-guest fallo: ${rsvpCheck.status()} ${errBody.slice(0, 200)}`);
    }

    console.log("[9/9] Confirmar asistencia (pagina publica)");
    const confirmUrl = `${BASE_URL}/confirmar-asistencia?pGuestEvent=${encodeURIComponent(pToken)}`;
    await safeGoto(page, confirmUrl, 45000);
    await page.waitForSelector('input[name="nombre"]', { state: "visible", timeout: 60000 });

    const confirmSelect = page.locator('select[name="confirmacion"]');
    if (await confirmSelect.count()) {
      await confirmSelect.selectOption({ label: "Confirmado" }).catch(async () => {
        await confirmSelect.selectOption({ value: "confirmado" });
      });
    }

    await page.getByRole("button", { name: /confirmar asistencia/i }).click();

    await page.waitForFunction(() => {
      const t = (document.body?.innerText || "").toLowerCase();
      return t.includes("exito") || t.includes("éxito") || t.includes("successfully");
    }, { timeout: 60000 });

    const bodyFinal = (await page.locator("body").innerText()).toLowerCase();
    const uiListed = bodyFinal.includes(guestName.toLowerCase());

    console.log("RESULTADO:");
    console.log(`- Evento home: ${eventPicked}`);
    console.log(`- Invitados: /invitados?event=${EVENT_ID}`);
    console.log(`- Invitado: ${guestName} / ${guestEmail} / ${guestPhone}`);
    console.log(`- Enlace confirmacion: ${confirmUrl}`);
    console.log(`- RSVP confirmado UI: SI`);
    console.log(`- Nombre visible en ultima pagina: ${uiListed ? "SI" : "N/A (pagina distinta)"}`);
  } finally {
    await browser.close();
    clearLock();
  }
})();
