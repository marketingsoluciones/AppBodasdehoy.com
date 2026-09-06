#!/usr/bin/env node
// Envía un evento sintético a cada DSN configurado en apps/*/.env.local
// para verificar end-to-end: DSN → Sentry ingest → dashboard.
// Uso: node scripts/sentry-test-event.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const ENV_FILES = [
  { app: 'appEventos',    file: 'apps/appEventos/.env.local' },
  { app: 'chat-ia',       file: 'apps/chat-ia/.env.development.local' },
  { app: 'memories-web',  file: 'apps/memories-web/.env.local' },
  { app: 'editor-web',    file: 'apps/editor-web/.env.local' },
];

async function readDsn(envFile) {
  try {
    const content = await fs.readFile(path.join(ROOT, envFile), 'utf8');
    const m = content.match(/^NEXT_PUBLIC_SENTRY_DSN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

function parseDsn(dsn) {
  // https://<key>@<host>/<project_id>
  const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return null;
  return { key: m[1], host: m[2], projectId: m[3] };
}

async function sendTestEvent(dsn, appName) {
  const parsed = parseDsn(dsn);
  if (!parsed) return { ok: false, reason: 'invalid DSN format' };

  const url = `https://${parsed.host}/api/${parsed.projectId}/store/?sentry_key=${parsed.key}&sentry_version=7`;
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'info',
    logger: 'sentry-bootstrap-verify',
    environment: 'development',
    message: {
      message: `Test event from sentry-test-event.mjs — verifying ${appName} DSN connectivity`,
    },
    tags: {
      app: appName,
      source: 'bootstrap-verify',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'sentry-bootstrap-verify/1.0',
    },
    body: JSON.stringify(event),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 200), eventId: event.event_id };
}

console.log('Enviando 1 evento sintético a cada DSN...\n');

for (const { app, file } of ENV_FILES) {
  const dsn = await readDsn(file);
  if (!dsn) {
    console.log(`✗ ${app.padEnd(15)} — no DSN encontrado en ${file}`);
    continue;
  }
  const result = await sendTestEvent(dsn, app);
  if (result.ok) {
    console.log(`✓ ${app.padEnd(15)} — event_id=${result.eventId} (status ${result.status})`);
  } else {
    console.log(`✗ ${app.padEnd(15)} — status ${result.status}: ${result.body}`);
  }
}

console.log('\nVerifica en: https://sentry.io/organizations/itel-0n/issues/');
console.log('Filtra por tag `source:bootstrap-verify` para encontrar los 4 eventos.');
