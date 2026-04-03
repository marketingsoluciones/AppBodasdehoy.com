#!/usr/bin/env node
/**
 * e2e-run.mjs — Runner de tests por ID o tag
 *
 * Uso:
 *   node scripts/e2e-run.mjs S01 P01 P02          # por ID
 *   node scripts/e2e-run.mjs @smoke                # por tag
 *   node scripts/e2e-run.mjs @crud @deterministic  # múltiples tags (AND)
 *   node scripts/e2e-run.mjs --ls                  # listar todos los tests
 *   node scripts/e2e-run.mjs --ls @smoke           # listar tests con tag
 *   node scripts/e2e-run.mjs --ls CRUD             # listar tests de grupo
 *
 * Alias npm: pnpm test:e2e:run S01 P01
 */

import { readFileSync, existsSync } from 'fs';
import { execSync, spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const CATALOG = resolve(ROOT, 'e2e-app/TEST-CATALOG.tsv');
const E2E_DIR = resolve(ROOT, 'e2e-app');

// ─── Leer catálogo ────────────────────────────────────────────────────────────

function parseTsv(path) {
  if (!existsSync(path)) throw new Error(`Catálogo no encontrado: ${path}`);
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

const catalog = parseTsv(CATALOG);

// ─── Parsear argumentos ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const listMode = args.includes('--ls') || args.includes('--list');
const filters = args.filter(a => a !== '--ls' && a !== '--list');

if (args.length === 0) {
  printHelp();
  process.exit(0);
}

// ─── Modo lista ───────────────────────────────────────────────────────────────

if (listMode) {
  const matches = filterTests(catalog, filters);
  printTable(matches);
  process.exit(0);
}

// ─── Modo ejecución ───────────────────────────────────────────────────────────

const targets = filterTests(catalog, filters);

if (targets.length === 0) {
  console.error(`\n❌ No se encontraron tests para: ${filters.join(', ')}`);
  console.error('   Usa --ls para ver el catálogo.\n');
  process.exit(1);
}

const autoTests = targets.filter(t => t['Tipo'] === 'Auto' && t['Spec']);
const manualTests = targets.filter(t => t['Tipo'] === 'Manual' || !t['Spec']);

// Mostrar tests manuales como instrucciones
if (manualTests.length > 0) {
  console.log('\n📋 Tests MANUALES (ejecutar a mano):');
  for (const t of manualTests) {
    console.log(`\n  [${t['ID']}] ${t['Descripcion']}`);
    if (t['Pregunta']) console.log(`         Entrada: ${t['Pregunta']}`);
    console.log(`         Esperado: ${t['Resultado esperado']}`);
    if (t['Comentario']) console.log(`         💬 ${t['Comentario']}`);
  }
  console.log('');
}

if (autoTests.length === 0) {
  console.log('✅ Solo había tests manuales — nada que ejecutar con Playwright.');
  process.exit(0);
}

// Agrupar tests automáticos por spec file
const bySpec = {};
for (const t of autoTests) {
  const spec = t['Spec'];
  if (!bySpec[spec]) bySpec[spec] = [];
  bySpec[spec].push(t);
}

console.log(`\n🧪 Ejecutando ${autoTests.length} test(s) automáticos...\n`);

let totalFailed = 0;

for (const [spec, tests] of Object.entries(bySpec)) {
  const specPath = resolve(E2E_DIR, spec);
  if (!existsSync(specPath)) {
    console.warn(`⚠️  Spec no encontrado: ${spec} — saltando`);
    continue;
  }

  // Construir patrón grep: \[S01\]|\[P01\]
  const grepParts = tests.map(t => `\\[${escapeRegex(t['ID'])}\\]`);
  const grepPattern = grepParts.join('|');

  console.log(`\n📂 ${spec}`);
  console.log(`   Tests: ${tests.map(t => t['ID']).join(', ')}`);
  console.log(`   Grep:  "${grepPattern}"\n`);

  const env = {
    ...process.env,
    E2E_ENV: process.env.E2E_ENV || 'dev',
  };

  const result = spawnSync(
    'npx',
    [
      'playwright', 'test',
      '--config=playwright.config.ts',
      '--project=webkit',
      `--grep=${grepPattern}`,
      '--reporter=list',
      specPath,
    ],
    { cwd: ROOT, stdio: 'inherit', env }
  );

  if (result.status !== 0) totalFailed++;
}

process.exit(totalFailed > 0 ? 1 : 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterTests(catalog, filters) {
  if (filters.length === 0) return catalog;

  return catalog.filter(row => {
    return filters.every(f => {
      if (f.startsWith('@')) {
        // Tag filter
        return row['Tags'].toLowerCase().includes(f.toLowerCase());
      }
      // ID filter (exact) or group substring
      return (
        row['ID'].toUpperCase() === f.toUpperCase() ||
        row['Grupo'].toLowerCase().includes(f.toLowerCase())
      );
    });
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printTable(rows) {
  if (rows.length === 0) {
    console.log('\n  (sin resultados)\n');
    return;
  }

  const STATUS_ICON = { pass: '✅', fail: '❌', skip: '⏭', pendiente: '⬜' };
  const cols = ['ID', 'Tipo', 'Grupo', 'Ultimo resultado', 'Spec', 'Descripcion'];
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => (r[c] || '').length)));
  widths[5] = Math.min(widths[5], 55); // truncar descripción

  const sep = cols.map((_, i) => '─'.repeat(widths[i] + 2)).join('┼');
  const header = cols.map((c, i) => ` ${c.padEnd(widths[i])} `).join('│');

  console.log(`\n┌${sep.replace(/┼/g, '┬')}┐`);
  console.log(`│${header}│`);
  console.log(`├${sep}┤`);

  for (const row of rows) {
    const icon = STATUS_ICON[row['Ultimo resultado']] ?? '❓';
    const cells = cols.map((c, i) => {
      let val = c === 'Ultimo resultado' ? `${icon} ${row[c]}` : (row[c] || '');
      if (c === 'Descripcion') val = val.slice(0, widths[i]);
      return ` ${val.padEnd(widths[i])} `;
    });
    console.log(`│${cells.join('│')}│`);
  }
  console.log(`└${sep.replace(/┼/g, '┴')}┘`);
  console.log(`  ${rows.length} test(s)\n`);
}

function printHelp() {
  console.log(`
e2e-run — Ejecutar tests E2E por ID o tag

Uso:
  pnpm test:e2e:run <ID|@tag> [...]

Ejemplos:
  pnpm test:e2e:run S01              → ejecutar test [S01]
  pnpm test:e2e:run S01 S02 P01     → ejecutar 3 tests
  pnpm test:e2e:run @smoke           → todos los tests @smoke
  pnpm test:e2e:run @crud            → todos los tests @crud
  pnpm test:e2e:run @permissions     → todos los de permisos
  pnpm test:e2e:run --ls             → listar todos los tests
  pnpm test:e2e:run --ls @smoke      → listar solo @smoke
  pnpm test:e2e:run --ls Smoke       → listar grupo "Smoke"
`);
}
