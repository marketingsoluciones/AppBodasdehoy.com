#!/usr/bin/env node
/**
 * Pruebas reales contra chat-test y app-test.
 * Genera evidencia (JSON + resumen) con timestamp para demostrar si están fallando.
 *
 * Uso: node scripts/pruebas-reales-chat-app-test.mjs
 *      node scripts/pruebas-reales-chat-app-test.mjs > resultados-pruebas-reales.txt
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const now = new Date();
const iso = now.toISOString();
const dateLabel = now.toISOString().slice(0, 19).replace(/[-:T]/g, '');

async function probe(url, options = {}) {
  const timeout = options.timeout ?? 15000;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': 'PruebasReales-ChatAppTest/1.0' },
    });
    const body = await res.text();
    const elapsed = Date.now() - start;
    return {
      url,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      elapsedMs: elapsed,
      contentType: res.headers.get('content-type') || '',
      bodyPreview: body.slice(0, 500).replace(/\s+/g, ' ').trim(),
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    return {
      url,
      error: err.message || String(err),
      elapsedMs: elapsed,
      status: null,
      ok: false,
    };
  }
}

async function main() {
  const baseApp = 'https://app-test.bodasdehoy.com';
  const baseChat = 'https://chat-test.bodasdehoy.com';

  const urls = [
    { url: `${baseApp}/`, name: 'app-test (raíz)' },
    { url: `${baseApp}/login`, name: 'app-test /login' },
    { url: `${baseChat}/`, name: 'chat-test (raíz)' },
    { url: `${baseChat}/api/health`, name: 'chat-test /api/health' },
  ];

  const results = [];
  console.log('Ejecutando pruebas reales...\n');

  for (const { url, name } of urls) {
    process.stdout.write(`  ${name} ... `);
    const r = await probe(url);
    results.push({ name, url, ...r });
    if (r.status != null) {
      console.log(`HTTP ${r.status} (${r.elapsedMs} ms)`);
    } else {
      console.log(`ERROR: ${r.error}`);
    }
  }

  const report = {
    timestamp: iso,
    dateLabel,
    summary: {
      appTestRoot: results.find((x) => x.name === 'app-test (raíz)'),
      chatTestRoot: results.find((x) => x.name === 'chat-test (raíz)'),
    },
    all: results,
    conclusion: {
      appTestOk: results.find((x) => x.name === 'app-test (raíz)')?.ok ?? false,
      chatTestOk: results.find((x) => x.name === 'chat-test (raíz)')?.ok ?? false,
    },
  };

  const outDir = join(ROOT, 'test-results');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, `pruebas-reales-chat-app-test-${dateLabel}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    '# Pruebas reales – chat-test y app-test',
    '',
    `**Fecha:** ${iso}`,
    '',
    '## Resultados',
    '',
    '| URL | HTTP | Tiempo (ms) | Estado |',
    '|-----|------|-------------|--------|',
    ...results.map((r) => {
      const status = r.status != null ? r.status : (r.error || '—');
      const ok = r.ok ? '✅ OK' : '❌ FALLO';
      return `| ${r.name} | ${status} | ${r.elapsedMs} | ${ok} |`;
    }),
    '',
    '## Conclusión',
    '',
    `- **app-test (raíz):** ${report.conclusion.appTestOk ? 'OK' : 'FALLO'} (HTTP ${report.summary.appTestRoot?.status ?? 'error'})`,
    `- **chat-test (raíz):** ${report.conclusion.chatTestOk ? 'OK' : 'FALLO'} (HTTP ${report.summary.chatTestRoot?.status ?? 'error'})`,
    '',
    'Evidencia completa en: `' + jsonPath + '`',
  ];
  const mdPath = join(outDir, `pruebas-reales-chat-app-test-${dateLabel}.md`);
  writeFileSync(mdPath, lines.join('\n'), 'utf8');

  console.log('\n--- Resumen ---');
  console.log('app-test (raíz):', report.conclusion.appTestOk ? 'OK' : 'FALLO', `(HTTP ${report.summary.appTestRoot?.status ?? 'error'})`);
  console.log('chat-test (raíz):', report.conclusion.chatTestOk ? 'OK' : 'FALLO', `(HTTP ${report.summary.chatTestRoot?.status ?? 'error'})`);
  console.log('\nEvidencia guardada:');
  console.log('  ', jsonPath);
  console.log('  ', mdPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
