#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const ENDPOINT_GROUPS = [
  {
    name: 'API_IA_URL',
    canonical: ['API_IA_URL', 'NEXT_PUBLIC_API_IA_URL'],
    legacy: [
      'API3_IA_URL',
      'NEXT_PUBLIC_API3_IA_URL',
      'PYTHON_BACKEND_URL',
      'NEXT_PUBLIC_BACKEND_URL',
      'BACKEND_URL',
      'BACKEND_INTERNAL_URL',
      'NEXT_PUBLIC_BACKEND_URL',
    ],
  },
  {
    name: 'API_MCP_GRAPHQL_URL',
    canonical: ['API_MCP_GRAPHQL_URL', 'NEXT_PUBLIC_API_MCP_GRAPHQL_URL'],
    legacy: [
      'API3_MCP_GRAPHQL_URL',
      'NEXT_PUBLIC_API3_MCP_GRAPHQL_URL',
      'API2_GRAPHQL_URL',
      'NEXT_PUBLIC_API2_GRAPHQL_URL',
      'GRAPHQL_ENDPOINT',
      'NEXT_PUBLIC_API2_URL',
      'API2_URL',
    ],
  },
];

function parseEnvLike(content) {
  const out = {};
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function listEnvFiles() {
  const candidates = [];
  const includeLocal = process.env.LINT_ENV_INCLUDE_LOCAL === '1';
  const roots = [
    ROOT,
    path.join(ROOT, 'apps', 'chat-ia'),
    path.join(ROOT, 'apps', 'appEventos'),
    path.join(ROOT, 'apps', 'memories-web'),
    path.join(ROOT, 'apps', 'editor-web'),
  ];
  const names = [
    ...(includeLocal
      ? [
          '.env',
          '.env.local',
          '.env.development',
          '.env.development.local',
          '.env.production',
          '.env.production.local',
        ]
      : []),
    '.env.example',
    '.env.development.local.example',
    '.env.production.example',
    '.env.e2e.example',
  ];

  for (const dir of roots) {
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) candidates.push(p);
    }
  }
  return Array.from(new Set(candidates));
}

function normalizeUrl(u) {
  return (u || '').trim().replace(/\/+$/g, '');
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = parseEnvLike(content);
  const issues = [];

  for (const group of ENDPOINT_GROUPS) {
    const allKeys = [...group.canonical, ...group.legacy];
    const present = allKeys
      .map((k) => ({ k, v: env[k] }))
      .filter((x) => x.v !== undefined && x.v !== '');

    if (!present.length) continue;

    const canonicalPresent = group.canonical.filter((k) => env[k]);
    const legacyPresent = group.legacy.filter((k) => env[k]);

    if (!canonicalPresent.length && legacyPresent.length) {
      issues.push({
        type: 'missing_canonical',
        group: group.name,
        message: `Usa canónica (${group.canonical[0]}) en vez de legacy: ${legacyPresent.join(', ')}`,
      });
    }

    const uniqueValues = Array.from(
      new Set(
        present
          .map((x) => normalizeUrl(x.v))
          .filter(Boolean),
      ),
    );

    if (uniqueValues.length > 1) {
      issues.push({
        type: 'conflict',
        group: group.name,
        message: `Conflicto: varias URLs distintas: ${uniqueValues.join(' | ')}`,
      });
    }
  }

  return issues;
}

function main() {
  const files = listEnvFiles();
  const all = [];

  for (const f of files) {
    const issues = checkFile(f);
    if (issues.length) all.push({ file: f, issues });
  }

  if (!all.length) {
    process.stdout.write('✅ Env endpoints: OK (sin duplicados/conflictos)\n');
    return;
  }

  process.stdout.write('❌ Env endpoints: hay incidencias\n');
  for (const entry of all) {
    process.stdout.write(`\n- ${path.relative(ROOT, entry.file)}\n`);
    for (const i of entry.issues) {
      process.stdout.write(`  - [${i.type}] ${i.group}: ${i.message}\n`);
    }
  }
  process.exitCode = 1;
}

main();
