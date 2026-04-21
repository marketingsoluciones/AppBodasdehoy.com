#!/usr/bin/env node
/**
 * Comprobación rápida de rutas públicas (monitoring local / preview).
 * Uso: BASE_URL=https://app-dev.bodasdehoy.com node scripts/smoke-public-routes.mjs
 *
 * Incluye páginas públicas con getServerSideProps (slug incompleto → 200 + UI de error,
 * no debe ser 5xx). Con SMOKE_PUBLIC_BODY=1 revisa que no quede el texto legacy "Page not found error 404".
 */
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3220").replace(/\/$/, "");
const CHECK_BODY = process.env.SMOKE_PUBLIC_BODY === "1";

const paths = [
  "/",
  "/login",
  "/signout?end=true",
  "/public-itinerary/itinerary",
  "/public-card/incomplete",
];

async function check(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "follow", headers: { Accept: "text/html" } });
  let bodyNote = "";
  if (CHECK_BODY && res.ok && path.startsWith("/public-")) {
    const html = await res.text();
    if (html.includes("Page not found error 404")) {
      bodyNote = "\t(fail: aún aparece texto legacy 404)";
    }
  }
  return { path, status: res.status, finalUrl: res.url, bodyNote };
}

(async () => {
  console.log("BASE_URL:", BASE, CHECK_BODY ? "(SMOKE_PUBLIC_BODY=1)" : "");
  let failed = false;
  for (const p of paths) {
    try {
      const r = await check(p);
      const tail = r.finalUrl !== BASE + p ? ` → ${r.finalUrl}` : "";
      console.log(`${r.status}\t${p}${tail}${r.bodyNote || ""}`);
      if (r.status >= 500) failed = true;
      if (r.bodyNote?.includes("fail")) failed = true;
    } catch (e) {
      console.log(`ERR\t${p}\t${e?.message || e}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
})();
