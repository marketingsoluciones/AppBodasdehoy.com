#!/usr/bin/env node
/**
 * run-scenario.mjs — Ejecuta escenarios de test por ID del catálogo.
 *
 * Uso:
 *   pnpm test:scenario 1.7.2          → un escenario concreto
 *   pnpm test:scenario 1.7            → todos los escenarios del grupo 1.7
 *   pnpm test:scenario 1              → todos los escenarios de appEventos
 *   pnpm test:scenario 1.7.2 1.10.3   → varios IDs a la vez
 *   pnpm test:scenario --list         → muestra el catálogo completo
 *   pnpm test:scenario --list 1.7     → muestra solo el grupo 1.7
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = resolve(ROOT, 'tests/registry.json');

// ─── Colores ANSI ──────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Recorre el registry y devuelve todos los escenarios ejecutables bajo un prefijo de ID */
function resolveScenarios(prefix) {
  const results = [];
  for (const [id, entry] of Object.entries(registry)) {
    if (id.startsWith('_')) continue;
    if (!id.startsWith(prefix)) continue;
    if (entry.type === 'group') continue;
    // Coincidencia exacta o el prefijo termina en "." (sub-grupo)
    if (id === prefix || id.startsWith(prefix + '.')) {
      results.push({ id, ...entry });
    }
  }
  // Ordenar por ID (numérico donde sea posible, lexicográfico para Q.*)
  return results.sort((a, b) => compareIds(a.id, b.id));
}

function compareIds(a, b) {
  const partsA = a.split('.');
  const partsB = b.split('.');
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const pa = partsA[i] ?? '';
    const pb = partsB[i] ?? '';
    const na = Number(pa);
    const nb = Number(pb);
    // Si ambas partes son numéricas, comparar numéricamente
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else {
      // Comparación lexicográfica (ej: "Q" vs "1")
      if (pa < pb) return -1;
      if (pa > pb) return 1;
    }
  }
  return 0;
}

/** Agrupa escenarios por archivo E2E para lanzar un solo proceso playwright por spec */
function groupByFile(scenarios) {
  const groups = new Map();
  for (const s of scenarios) {
    if (s.type === 'e2e') {
      const key = s.file;
      if (!groups.has(key)) groups.set(key, { file: s.file, greps: new Set() });
      groups.get(key).greps.add(s.grep);
    }
  }
  // Convertir Set → Array para uso posterior
  for (const [, g] of groups) g.greps = [...g.greps];
  return groups;
}

/** Construye el comando playwright para un archivo + lista de greps */
function playwrightCmd(file, greps) {
  const combined = greps.map(g => `(${g})`).join('|');
  return `pnpm exec playwright test e2e-app/${file} --grep "${combined}"`;
}

/** Construye el comando jest para un archivo de unit test */
function jestCmd(app, file) {
  const appDir = app === 'appEventos' ? 'apps/appEventos' : `apps/${app}`;
  return `cd ${ROOT}/${appDir} && pnpm exec jest --testPathPattern="${file}" --silent`;
}

/** Construye el comando vitest para un archivo */
function vitestCmd(app, file) {
  return `cd ${ROOT}/apps/${app} && bunx vitest run --silent='passed-only' '${file}'`;
}

// ─── Listado del catálogo ──────────────────────────────────────────────────────

function listCatalog(prefix = '') {
  console.log(`\n${C.bold}${C.blue}═══ Catálogo de Escenarios de Test${C.reset}`);
  if (prefix) console.log(`${C.dim}Filtrando por: ${prefix}${C.reset}\n`);
  else console.log(`${C.dim}Uso: pnpm test:scenario <ID>${C.reset}\n`);

  const TYPE_COLORS = { e2e: C.green, unit: C.cyan, integration: C.yellow, group: C.blue };
  const TYPE_LABELS = { e2e: 'E2E ', unit: 'UNIT', integration: 'INT ', group: '    ' };
  const STATUS_COLORS = { covered: C.green, partial: C.yellow, todo: C.red, unit: C.cyan };
  const STATUS_LABELS = { covered: '✓', partial: '~', todo: '○', unit: '·' };

  for (const [id, entry] of Object.entries(registry)) {
    if (id.startsWith('_')) continue;
    if (prefix && !id.startsWith(prefix)) continue;

    const depth = id.split('.').length - 1;
    const indent = '  '.repeat(depth);
    const color = TYPE_COLORS[entry.type] ?? C.reset;
    const label = TYPE_LABELS[entry.type] ?? '    ';
    const idStr = `${C.bold}${id.padEnd(8)}${C.reset}`;
    const sc = STATUS_COLORS[entry.status] ?? C.dim;
    const sl = STATUS_LABELS[entry.status] ?? ' ';

    if (entry.type === 'group') {
      console.log(`${indent}${C.blue}${C.bold}▸ ${id}${C.reset} ${C.dim}${entry.name}${C.reset}`);
    } else {
      console.log(`${indent}${idStr} ${color}[${label}]${C.reset} ${sc}${sl}${C.reset} ${entry.name}`);
      if (entry.file) console.log(`${indent}         ${C.gray}${entry.file}${C.reset}`);
      if (entry.notes) console.log(`${indent}         ${C.dim}↳ ${entry.notes}${C.reset}`);
    }
  }

  // Leyenda de estado
  console.log(`\n${C.dim}Leyenda: ${C.green}✓ covered${C.reset} ${C.dim}${C.yellow}~ partial${C.reset} ${C.dim}${C.red}○ todo${C.reset} ${C.dim}${C.cyan}· unit${C.reset}\n`);
  console.log('');
}

// ─── Ejecución ─────────────────────────────────────────────────────────────────

function runScenarios(ids) {
  // Recoger todos los escenarios únicos
  const allScenarios = [];
  const seen = new Set();

  for (const prefix of ids) {
    const scenarios = resolveScenarios(prefix);
    if (scenarios.length === 0) {
      console.error(`${C.red}✗ No se encontraron escenarios para ID: ${prefix}${C.reset}`);
      continue;
    }
    for (const s of scenarios) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        allScenarios.push(s);
      }
    }
  }

  if (allScenarios.length === 0) {
    console.error(`${C.red}No hay escenarios que ejecutar.${C.reset}`);
    process.exit(1);
  }

  // Separar por tipo
  const e2eScenarios = allScenarios.filter(s => s.type === 'e2e');
  const unitScenarios = allScenarios.filter(s => s.type === 'unit');

  console.log(`\n${C.bold}${C.blue}═══ Ejecutando ${allScenarios.length} escenario(s)${C.reset}\n`);

  let totalFailed = 0;

  // ── E2E (Playwright) ──
  if (e2eScenarios.length > 0) {
    const grouped = groupByFile(e2eScenarios);

    for (const [file, { greps }] of grouped) {
      const cmd = playwrightCmd(file, greps);
      console.log(`${C.green}▸ E2E${C.reset} ${C.bold}${file}${C.reset}`);
      console.log(`${C.gray}  ${cmd}${C.reset}\n`);

      try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
        console.log(`${C.green}  ✓ OK${C.reset}\n`);
      } catch {
        console.log(`${C.red}  ✗ FALLÓ${C.reset}\n`);
        totalFailed++;
      }
    }
  }

  // ── Unit tests (Jest / Vitest) ──
  if (unitScenarios.length > 0) {
    // Agrupar por runner + app
    const jestGroups = new Map();
    const vitestGroups = new Map();

    for (const s of unitScenarios) {
      if (s.runner === 'jest') {
        const key = s.app;
        if (!jestGroups.has(key)) jestGroups.set(key, { app: s.app, files: [] });
        jestGroups.get(key).files.push(s.file);
      } else if (s.runner === 'vitest') {
        const key = s.app;
        if (!vitestGroups.has(key)) vitestGroups.set(key, { app: s.app, files: [] });
        vitestGroups.get(key).files.push(s.file);
      }
    }

    // ── Jest ──
    for (const [, { app, files }] of jestGroups) {
      const pattern = files.join('|');
      const cmd = jestCmd(app, pattern);
      console.log(`${C.cyan}▸ UNIT (jest)${C.reset} ${C.bold}${app}${C.reset}: ${files.join(', ')}`);
      console.log(`${C.gray}  ${cmd}${C.reset}\n`);

      try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
        console.log(`${C.green}  ✓ OK${C.reset}\n`);
      } catch {
        console.log(`${C.red}  ✗ FALLÓ${C.reset}\n`);
        totalFailed++;
      }
    }

    // ── Vitest ──
    for (const [, { app, files }] of vitestGroups) {
      // Agrupar todos los archivos del mismo app en un único proceso vitest
      const cmd = vitestCmd(app, files.length === 1 ? files[0] : `(${files.join('|')})`);
      console.log(`${C.cyan}▸ UNIT (vitest)${C.reset} ${C.bold}${app}${C.reset}: ${files.join(', ')}`);
      console.log(`${C.gray}  ${cmd}${C.reset}\n`);

      try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
        console.log(`${C.green}  ✓ OK${C.reset}\n`);
      } catch {
        console.log(`${C.red}  ✗ FALLÓ${C.reset}\n`);
        totalFailed++;
      }
    }
  }

  // ── Resumen ──
  const passed = allScenarios.length - totalFailed;
  const statusColor = totalFailed === 0 ? C.green : C.red;
  console.log(`${C.bold}${statusColor}═══ Resultado: ${passed}/${allScenarios.length} grupos OK${C.reset}\n`);

  if (totalFailed > 0) process.exit(1);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
${C.bold}run-scenario — Ejecuta escenarios de test por ID${C.reset}

${C.bold}Uso:${C.reset}
  pnpm test:scenario <id>              Ejecutar escenario concreto
  pnpm test:scenario <id1> <id2> ...   Varios escenarios
  pnpm test:scenario 1.7              Todos los escenarios del grupo 1.7
  pnpm test:scenario --list            Ver catálogo completo
  pnpm test:scenario --list 2.4       Ver grupo 2.4

${C.bold}Estructura de IDs:${C.reset}
  1      appEventos — Organizador (auth, invitados, mesas, presupuesto, servicios...)
  2      chat-ia — Copilot & Chat IA (tools, billing, bandeja, KB, memories...)
  3      Integraciones cross-app (SSO, PostMessage, multi-usuario, R2...)
  4      Edge cases & Resiliencia (HTTP errors, visitor limit, widget embed...)
  5      Unit tests — Jest (appEventos API routes, copilot-shared exports...)
  6      Unit tests — Vitest (chat-ia stores, tools, auth, file, memories...)
  Q      Preguntas al Copilot — catálogo de mensajes reales (Q.1–Q.10)

${C.bold}Ejemplos:${C.reset}
  pnpm test:scenario 1.7.4            Drag & Drop kanban
  pnpm test:scenario 1.7              Todos los tests de Servicios
  pnpm test:scenario 2.2.2 2.3.1     CRUD via IA + filter_view
  pnpm test:scenario 5                Todos los unit tests Jest (appEventos)
  pnpm test:scenario 6                Todos los unit tests Vitest (chat-ia)
  pnpm test:scenario Q.6              Todos los CRUD via chat (crear entidades)
  pnpm test:scenario Q.8.2           ¿Cómo se llama el fotógrafo? (RAG)
`);
  process.exit(0);
}

if (args[0] === '--list') {
  listCatalog(args[1] ?? '');
  process.exit(0);
}

runScenarios(args);
