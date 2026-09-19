#!/usr/bin/env node
// Crea 4 projects en Sentry, extrae DSNs y los escribe en .env.local de cada app.
// Requiere: SENTRY_AUTH_TOKEN env var (scopes: project:read project:write org:read).
// Uso: SENTRY_AUTH_TOKEN=sntrys_xxx node scripts/sentry-bootstrap.mjs [org-slug]

import { promises as fs } from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.SENTRY_AUTH_TOKEN;
const ORG_ARG = process.argv[2] || process.env.SENTRY_ORG;
const ROOT = path.resolve(process.cwd());

if (!TOKEN) {
  console.error('ERROR: define SENTRY_AUTH_TOKEN antes de ejecutar.');
  process.exit(1);
}

const PROJECTS = [
  { slug: 'app-eventos', display: 'appEventos', envFile: 'apps/appEventos/.env.local', sentryProjectField: 'app-eventos' },
  { slug: 'chat-ia', display: 'chat-ia', envFile: 'apps/chat-ia/.env.development.local', sentryProjectField: 'chat-ia' },
  { slug: 'memories-web', display: 'memories-web', envFile: 'apps/memories-web/.env.local', sentryProjectField: 'memories-web' },
  { slug: 'editor-web', display: 'editor-web', envFile: 'apps/editor-web/.env.local', sentryProjectField: 'editor-web' },
];

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(pathPart, init = {}) {
  const res = await fetch(`https://sentry.io/api/0${pathPart}`, { ...init, headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { ok: res.ok, status: res.status, body: json };
}

async function upsertEnvVar(envPath, key, value) {
  const abs = path.join(ROOT, envPath);
  let content = '';
  try { content = await fs.readFile(abs, 'utf8'); } catch {}
  const lineRe = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  if (lineRe.test(content)) {
    content = content.replace(lineRe, newLine);
  } else {
    if (content && !content.endsWith('\n')) content += '\n';
    content += `${newLine}\n`;
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content);
  return abs;
}

// 1. Listar orgs accesibles
const orgsRes = await api('/organizations/');
if (!orgsRes.ok) {
  console.error('ERROR auth:', orgsRes.status, orgsRes.body);
  process.exit(1);
}
const orgs = orgsRes.body.map((o) => o.slug);
console.log('Orgs accesibles:', orgs.join(', '));

const org = ORG_ARG || orgs[0];
if (!orgs.includes(org)) {
  console.error(`ORG "${org}" no está en las orgs accesibles.`);
  process.exit(1);
}
console.log(`Usando org: ${org}`);

// 2. Obtener primer team
const teamsRes = await api(`/organizations/${org}/teams/`);
if (!teamsRes.ok) {
  console.error('ERROR teams:', teamsRes.status, teamsRes.body);
  process.exit(1);
}
const team = teamsRes.body[0]?.slug;
if (!team) {
  console.error('No hay teams en la org. Crea uno desde la UI primero.');
  process.exit(1);
}
console.log(`Usando team: ${team}`);

// 3. Por cada project: crear (si no existe) y obtener DSN
const results = [];
for (const proj of PROJECTS) {
  // Intentar crear
  const create = await api(`/teams/${org}/${team}/projects/`, {
    method: 'POST',
    body: JSON.stringify({
      name: proj.display,
      slug: proj.slug,
      platform: 'javascript-nextjs',
    }),
  });
  if (create.ok) {
    console.log(`✓ Created project ${proj.slug}`);
  } else if (create.status === 409 || (create.body && JSON.stringify(create.body).includes('already'))) {
    console.log(`· Project ${proj.slug} ya existe`);
  } else {
    console.error(`✗ Error creando ${proj.slug}:`, create.status, create.body);
    continue;
  }

  // Obtener DSN
  const keys = await api(`/projects/${org}/${proj.slug}/keys/`);
  if (!keys.ok || !Array.isArray(keys.body) || keys.body.length === 0) {
    console.error(`✗ No keys para ${proj.slug}:`, keys.status, keys.body);
    continue;
  }
  const dsn = keys.body[0]?.dsn?.public;
  if (!dsn) {
    console.error(`✗ DSN vacío en ${proj.slug}`);
    continue;
  }

  // Escribir en .env
  const written = await upsertEnvVar(proj.envFile, 'NEXT_PUBLIC_SENTRY_DSN', dsn);
  console.log(`✓ DSN escrito en ${written}`);
  results.push({ project: proj.slug, dsn, envFile: proj.envFile });
}

console.log('\n═══ Resumen ═══');
for (const r of results) {
  console.log(`  ${r.project.padEnd(15)} → ${r.envFile}`);
}
console.log(`\nOrg slug detectado: ${org}`);
if (org !== 'itel-0n') {
  console.log(`AVISO: los next.config.{js,ts} tienen org: 'itel-0n' hardcoded.`);
  console.log(`        Reemplazar con sed:`);
  console.log(`        find apps -name 'next.config.*' -exec sed -i.bak "s/'itel-0n'/'${org}'/g" {} +`);
}
