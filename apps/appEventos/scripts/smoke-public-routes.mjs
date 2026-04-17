#!/usr/bin/env node
/**
 * Comprobación rápida de rutas públicas (monitoring local / preview).
 * Uso: BASE_URL=https://app-dev.bodasdehoy.com node scripts/smoke-public-routes.mjs
 */
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3220").replace(/\/$/, "");
const paths = ["/", "/login", "/signout?end=true"];

async function check(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "follow", headers: { Accept: "text/html" } });
  return { path, status: res.status, finalUrl: res.url };
}

(async () => {
  console.log("BASE_URL:", BASE);
  for (const p of paths) {
    try {
      const r = await check(p);
      console.log(`${r.status}\t${p}${r.finalUrl !== BASE + p ? ` → ${r.finalUrl}` : ""}`);
    } catch (e) {
      console.log(`ERR\t${p}\t${e?.message || e}`);
    }
  }
})();
