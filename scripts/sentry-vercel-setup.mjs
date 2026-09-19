#!/usr/bin/env node
// Configura NEXT_PUBLIC_SENTRY_DSN (y opcional SENTRY_AUTH_TOKEN) en los proyectos
// Vercel linkeados del monorepo, para los targets `preview` y `production`.
//
// Mapeo branch → environment Vercel:
//   - rama `test`   → preview   → app-test.bodasdehoy.com, chat-test.bodasdehoy.com, ...
//   - rama `master` → production → app.bodasdehoy.com,    chat.bodasdehoy.com, ...
//
// Vercel auto-inyecta NEXT_PUBLIC_VERCEL_ENV y NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
// que Sentry usa como tags `environment` y `release` (ver sentry.server.config.ts).
// Por eso aquí SOLO seteamos el DSN; el resto Vercel lo da gratis.
//
// Uso:
//   VERCEL_TOKEN=xxx node scripts/sentry-vercel-setup.mjs
//   VERCEL_TOKEN=xxx SENTRY_AUTH_TOKEN=sntryu_xxx node scripts/sentry-vercel-setup.mjs  (también sube SENTRY_AUTH_TOKEN)
//
// Token: https://vercel.com/account/tokens (scope: Full Access o este team)

import { promises as fs } from 'node:fs';
import path from 'node:path';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const ROOT = path.resolve(process.cwd());

if (!VERCEL_TOKEN) {
  console.error('ERROR: define VERCEL_TOKEN. Obtener en https://vercel.com/account/tokens');
  process.exit(1);
}

const APPS = [
  { name: 'appEventos',    vercelLink: 'apps/appEventos/.vercel/project.json',    envFile: 'apps/appEventos/.env.local' },
  { name: 'chat-ia',       vercelLink: 'apps/chat-ia/.vercel/project.json',       envFile: 'apps/chat-ia/.env.development.local' },
  { name: 'memories-web',  vercelLink: 'apps/memories-web/.vercel/project.json',  envFile: 'apps/memories-web/.env.local' },
  { name: 'editor-web',    vercelLink: 'apps/editor-web/.vercel/project.json',    envFile: 'apps/editor-web/.env.local' },
];

const TARGETS = ['production', 'preview'];

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8')); }
  catch { return null; }
}

async function readDsn(envFile) {
  try {
    const content = await fs.readFile(path.join(ROOT, envFile), 'utf8');
    const m = content.match(/^NEXT_PUBLIC_SENTRY_DSN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

async function vercelApi(pathPart, init = {}) {
  const res = await fetch(`https://api.vercel.com${pathPart}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { ok: res.ok, status: res.status, body: json };
}

async function upsertEnvVar({ projectId, teamId, key, value, type, target }) {
  // Usa ?upsert=true para crear o sobreescribir en una sola llamada
  const teamQ = teamId ? `&teamId=${teamId}` : '';
  const res = await vercelApi(`/v10/projects/${projectId}/env?upsert=true${teamQ}`, {
    method: 'POST',
    body: JSON.stringify({ key, value, type, target }),
  });
  return res;
}

console.log('═══ Sentry → Vercel env setup ═══\n');
console.log(`Targets: ${TARGETS.join(', ')}`);
console.log(`SENTRY_AUTH_TOKEN: ${SENTRY_AUTH_TOKEN ? 'sí (se sube como secret)' : 'no (skip)'}\n`);

let okCount = 0;
let skipCount = 0;
let failCount = 0;

for (const app of APPS) {
  const link = await readJson(app.vercelLink);
  if (!link) {
    console.log(`· ${app.name.padEnd(15)} SKIP — sin .vercel/project.json (proyecto no linkeado todavía)`);
    skipCount++;
    continue;
  }
  const dsn = await readDsn(app.envFile);
  if (!dsn) {
    console.log(`· ${app.name.padEnd(15)} SKIP — sin DSN en ${app.envFile}`);
    skipCount++;
    continue;
  }

  // 1. NEXT_PUBLIC_SENTRY_DSN (encrypted aunque es semi-pública, evita exponerla en logs UI)
  const dsnRes = await upsertEnvVar({
    projectId: link.projectId,
    teamId: link.orgId,
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    value: dsn,
    type: 'encrypted',
    target: TARGETS,
  });
  if (dsnRes.ok) {
    console.log(`✓ ${app.name.padEnd(15)} NEXT_PUBLIC_SENTRY_DSN → ${TARGETS.join('+')} (project ${link.projectName})`);
    okCount++;
  } else {
    console.log(`✗ ${app.name.padEnd(15)} NEXT_PUBLIC_SENTRY_DSN FAILED: ${dsnRes.status} ${JSON.stringify(dsnRes.body).slice(0, 200)}`);
    failCount++;
    continue;
  }

  // 2. SENTRY_AUTH_TOKEN opcional (para upload de source maps en build CI)
  if (SENTRY_AUTH_TOKEN) {
    const tokRes = await upsertEnvVar({
      projectId: link.projectId,
      teamId: link.orgId,
      key: 'SENTRY_AUTH_TOKEN',
      value: SENTRY_AUTH_TOKEN,
      type: 'sensitive',
      target: TARGETS,
    });
    if (tokRes.ok) {
      console.log(`  ${''.padEnd(15)} SENTRY_AUTH_TOKEN     → ${TARGETS.join('+')}`);
    } else {
      console.log(`  ${''.padEnd(15)} SENTRY_AUTH_TOKEN FAILED: ${tokRes.status}`);
    }
  }
}

console.log(`\n═══ Resumen: ${okCount} OK · ${skipCount} skip · ${failCount} fail ═══`);

if (skipCount > 0) {
  console.log('\nPara linkear editor-web a Vercel:');
  console.log('  cd apps/editor-web && vercel link');
  console.log('Luego re-ejecuta este script.');
}

if (!SENTRY_AUTH_TOKEN) {
  console.log('\nPara source maps automáticos en cada build:');
  console.log('  1. https://sentry.io/settings/itel-0n/auth-tokens/ → crear token con scope project:releases');
  console.log('  2. Re-ejecutar con: SENTRY_AUTH_TOKEN=sntryu_xxx VERCEL_TOKEN=... node scripts/sentry-vercel-setup.mjs');
}
