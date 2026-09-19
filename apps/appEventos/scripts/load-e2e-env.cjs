/**
 * Carga variables E2E: `apps/appEventos/.env.e2e.local` y, desde la raíz del monorepo,
 * `.env.e2e.test.local` y `.env.e2e.dev.local` (gitignored). No sobrescribe claves ya definidas.
 */
const fs = require("node:fs");
const path = require("node:path");

function applyEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function loadE2eEnv() {
  const appLocal = path.join(__dirname, "..", ".env.e2e.local");
  const root = path.join(__dirname, "..", "..", "..");
  applyEnvFile(appLocal);
  applyEnvFile(path.join(root, ".env.e2e.test.local"));
  applyEnvFile(path.join(root, ".env.e2e.dev.local"));
}

module.exports = loadE2eEnv;
