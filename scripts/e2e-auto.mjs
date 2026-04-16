#!/usr/bin/env node
/**
 * Ejecuta pruebas E2E automáticamente cuando cambian los specs o la app.
 * Uso: pnpm test:e2e:app:auto
 * Requiere: servidor ya levantado (pnpm dev:web) o BASE_URL=https://app-test.bodasdehoy.com
 *
 * Modos:
 *   E2E_AUTO_MODE=smoke   → solo smoke.spec.ts (default, ~30s)
 *   E2E_AUTO_MODE=full    → todos los specs (~5min)
 *   E2E_AUTO_MODE=bandeja → bandeja-mensajes.spec.ts
 *   E2E_AUTO_MODE=crud    → acciones-crud.spec.ts
 *   E2E_AUTO_MODE=multi   → multi-developer.spec.ts
 */
import { watch, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const e2eDir = path.join(root, 'e2e-app');
const appEventosPages = path.join(root, 'apps', 'appEventos', 'pages');
const appEventosComponents = path.join(root, 'apps', 'appEventos', 'components');

const MODE = process.env.E2E_AUTO_MODE || 'smoke';
const BASE_URL = process.env.BASE_URL || 'https://app-test.bodasdehoy.com';

const SPEC_BY_MODE = {
  smoke: ['e2e-app/smoke.spec.ts'],
  bandeja: ['e2e-app/bandeja-mensajes.spec.ts'],
  crud: ['e2e-app/acciones-crud.spec.ts'],
  multi: ['e2e-app/multi-developer.spec.ts'],
  filter: ['e2e-app/filter-view.spec.ts'],
  full: [],
  usuario2: ['e2e-app/usuario-secundario-vivetuboda.spec.ts'],
};

const specs = SPEC_BY_MODE[MODE] ?? SPEC_BY_MODE.smoke;

let timer = null;
let running = false;
const DEBOUNCE_MS = 2500;

function runTests(triggeredBy = 'manual') {
  if (running) {
    console.log('[E2E-auto] Ya hay una ejecución en curso, esperando...');
    return;
  }
  running = true;

  const label = specs.length ? specs.map(s => path.basename(s)).join(', ') : 'todos los specs';
  console.log(`\n[E2E-auto] Ejecutando ${label} (modo=${MODE}, trigger=${triggeredBy})...`);

  const args = ['exec', 'playwright', 'test', '--config=playwright.config.ts', '--reporter=list', ...specs];

  const child = spawn('pnpm', args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      BASE_URL,
      PLAYWRIGHT_BROWSER: process.env.PLAYWRIGHT_BROWSER || 'webkit',
      E2E_FAST: MODE === 'smoke' ? '1' : '0',
    },
  });

  child.on('close', (code) => {
    running = false;
    const icon = code === 0 ? '✅' : '❌';
    console.log(`[E2E-auto] ${icon} Terminado (código ${code}). Esperando cambios...\n`);
  });
}

function scheduleRun(filename) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => runTests(filename), DEBOUNCE_MS);
}

const watchExts = new Set(['.ts', '.tsx', '.js', '.jsx']);

function watchDir(dir, label) {
  if (!existsSync(dir)) return;
  watch(dir, { recursive: true }, (_, filename) => {
    if (filename && watchExts.has(path.extname(filename))) {
      console.log(`[E2E-auto] Cambio en ${label}/${filename}`);
      scheduleRun(filename);
    }
  });
  console.log(`[E2E-auto] Observando ${label}`);
}

console.log(`[E2E-auto] Modo: ${MODE} | BASE_URL: ${BASE_URL}`);
console.log('[E2E-auto] Asegúrate de tener VPN activa si usas app-test.\n');

watchDir(e2eDir, 'e2e-app');
watchDir(appEventosPages, 'pages');
watchDir(appEventosComponents, 'components');

runTests('inicio');
