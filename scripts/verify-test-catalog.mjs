#!/usr/bin/env node
/**
 * Verifica alineación entre catálogos y ficheros reales (mejores prácticas).
 *
 * 1) e2e-app/TEST-CATALOG.tsv — cada fila con columna Spec apunta a un .spec.ts existente.
 * 2) tests/registry.json — cada escenario e2e/unit con `file` apunta a un fichero existente.
 *
 * Uso: node scripts/verify-test-catalog.mjs
 *      pnpm verify:test-catalog
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const TSV = join(ROOT, 'e2e-app', 'TEST-CATALOG.tsv');
const REGISTRY = join(ROOT, 'tests', 'registry.json');
const E2E_DIR = join(ROOT, 'e2e-app');

function parseTsv(path) {
  if (!existsSync(path)) throw new Error(`No existe: ${path}`);
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  });
}

function resolveRegistryFile(entry) {
  const { type, file, runner } = entry;
  if (!file || typeof file !== 'string') return null;
  if (type === 'e2e') return join(E2E_DIR, file);
  if (type === 'unit' && runner === 'jest') return join(ROOT, 'apps', 'appEventos', file);
  if (type === 'unit' && runner === 'vitest') return join(ROOT, 'apps', 'chat-ia', file);
  return null;
}

let errors = 0;
const log = (msg) => console.error(msg);

// ── 1. TSV ───────────────────────────────────────────────────────────────────
const rows = parseTsv(TSV);
const seenIds = new Map();
for (const row of rows) {
  const id = row['ID'] || '';
  if (id) {
    if (seenIds.has(id)) log(`[TSV] ID duplicado: ${id}`);
    seenIds.set(id, true);
  }
  const spec = (row['Spec'] || '').trim();
  if (!spec) continue;
  const abs = join(E2E_DIR, spec);
  if (!existsSync(abs)) {
    log(`[TSV] Spec no encontrado: ${spec} (ID=${id || '?'})`);
    errors++;
  }
}

// ── 2. Registry ─────────────────────────────────────────────────────────────
const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
for (const [id, entry] of Object.entries(registry)) {
  if (id.startsWith('_')) continue;
  if (!entry || typeof entry !== 'object') continue;
  if (entry.type === 'group' || entry.type === 'section') continue;
  if (!entry.file) continue;

  const abs = resolveRegistryFile(entry);
  if (!abs) {
    log(`[registry] ${id}: tipo/runner no soportado para verificar file (${JSON.stringify({ type: entry.type, runner: entry.runner })})`);
    errors++;
    continue;
  }
  if (!existsSync(abs)) {
    log(`[registry] ${id}: fichero ausente → ${entry.file} (${entry.type}${entry.runner ? `/${entry.runner}` : ''})`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nverify-test-catalog: ${errors} error(es).`);
  process.exit(1);
}
console.log(`verify-test-catalog: OK (${rows.length} filas TSV, registry verificado).`);
