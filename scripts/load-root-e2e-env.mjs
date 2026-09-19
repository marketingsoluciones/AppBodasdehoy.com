/**
 * Carga `.env.e2e.<env>` y `.env.e2e.<env>.local` desde la raíz del monorepo.
 * No sobrescribe variables ya definidas en process.env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

function parseAndApply(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
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

/**
 * @param {'test'|'dev'|'prod'} env
 */
export function loadRootE2eEnv(env = 'test') {
  for (const suffix of [`.env.e2e.${env}`, `.env.e2e.${env}.local`]) {
    const file = path.join(ROOT, suffix);
    if (!fs.existsSync(file)) continue;
    parseAndApply(fs.readFileSync(file, 'utf8'));
  }
}
