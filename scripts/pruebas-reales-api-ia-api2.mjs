#!/usr/bin/env node
/**
 * Pruebas reales con queries reales contra api-ia y api2.
 * Genera evidencia (JSON + resumen .md) para demostrar si están fallando.
 *
 * api-ia: POST /webapi/chat/auto (mensajes reales)
 * api2:   POST /graphql (query getSubscriptionPlans real)
 *
 * Uso:
 *   node scripts/pruebas-reales-api-ia-api2.mjs
 *   FIREBASE_JWT=<token> node scripts/pruebas-reales-api-ia-api2.mjs  # opcional, para api-ia con usuario
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_IA_BASE = process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';
const API2_GRAPHQL = process.env.API2_GRAPHQL_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';
const FIREBASE_JWT = process.env.FIREBASE_JWT || '';

// ——— Queries reales para api-ia (chat/auto) ———
const QUERIES_API_IA = [
  'Hola',
  '¿Cuántos invitados tengo?',
  'Dame un resumen de mi evento',
];

// ——— Query real para api2 (GraphQL, pública) ———
const GET_SUBSCRIPTION_PLANS_QUERY = `
  query GetSubscriptionPlans($development: String!, $tier: SubscriptionTier, $is_public: Boolean) {
    getSubscriptionPlans(development: $development, tier: $tier, is_public: $is_public) {
      _id
      plan_id
      name
      tier
      is_active
      is_public
      pricing { monthly_fee annual_fee trial_days }
    }
  }
`;

async function probeApiIa(query) {
  const url = `${API_IA_BASE}/webapi/chat/auto`;
  const body = {
    messages: [{ role: 'user', content: query }],
    stream: false,
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-Development': DEVELOPMENT,
  };
  if (FIREBASE_JWT) headers['Authorization'] = `Bearer ${FIREBASE_JWT}`;

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const elapsed = Date.now() - start;
    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    let responseBody = raw;
    try {
      if (contentType.includes('json')) responseBody = JSON.parse(raw);
    } catch (_) {}

    const responsePreview =
      typeof responseBody === 'string'
        ? responseBody.slice(0, 600)
        : JSON.stringify(responseBody).slice(0, 600);

    return {
      url,
      method: 'POST',
      requestBody: body,
      requestHeaders: headers,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      elapsedMs: elapsed,
      responsePreview,
      responseContentType: contentType,
    };
  } catch (err) {
    return {
      url,
      method: 'POST',
      requestBody: body,
      requestHeaders: headers,
      error: err.message || String(err),
      elapsedMs: Date.now() - start,
      ok: false,
      status: null,
    };
  }
}

async function probeApi2() {
  const url = API2_GRAPHQL;
  const body = {
    query: GET_SUBSCRIPTION_PLANS_QUERY,
    variables: { development: DEVELOPMENT, is_public: true },
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-Development': DEVELOPMENT,
  };

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const elapsed = Date.now() - start;
    const raw = await res.text();
    let responseBody = raw;
    try {
      responseBody = JSON.parse(raw);
    } catch (_) {}

    const responsePreview =
      typeof responseBody === 'string'
        ? responseBody.slice(0, 800)
        : JSON.stringify(responseBody).slice(0, 800);

    return {
      url,
      method: 'POST',
      requestBody: body,
      requestHeaders: headers,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      elapsedMs: elapsed,
      responsePreview,
      hasData: !!responseBody?.data,
      hasErrors: !!responseBody?.errors?.length,
      errorsPreview:
        responseBody?.errors?.length > 0
          ? responseBody.errors.map((e) => e.message || e).slice(0, 3)
          : null,
    };
  } catch (err) {
    return {
      url,
      method: 'POST',
      requestBody: body,
      requestHeaders: headers,
      error: err.message || String(err),
      elapsedMs: Date.now() - start,
      ok: false,
      status: null,
    };
  }
}

async function main() {
  const now = new Date();
  const iso = now.toISOString();
  const dateLabel = iso.slice(0, 19).replace(/[-:T]/g, '');

  console.log('Pruebas reales – api-ia y api2 (queries reales)\n');
  console.log('api-ia:', API_IA_BASE);
  console.log('api2: ', API2_GRAPHQL);
  console.log('development:', DEVELOPMENT);
  console.log('');

  const apiIaResults = [];
  for (const query of QUERIES_API_IA) {
    process.stdout.write(`  api-ia: "${query.slice(0, 40)}${query.length > 40 ? '…' : ''}" ... `);
    const r = await probeApiIa(query);
    apiIaResults.push({ query, ...r });
    console.log(r.status != null ? `HTTP ${r.status} (${r.elapsedMs} ms)` : `ERROR: ${r.error}`);
  }

  process.stdout.write('  api2:  getSubscriptionPlans ... ');
  const api2Result = await probeApi2();
  console.log(
    api2Result.status != null ? `HTTP ${api2Result.status} (${api2Result.elapsedMs} ms)` : `ERROR: ${api2Result.error}`
  );

  const report = {
    timestamp: iso,
    dateLabel,
    env: { API_IA_BASE, API2_GRAPHQL, DEVELOPMENT, hasFirebaseJwt: !!FIREBASE_JWT },
    apiIa: {
      url: `${API_IA_BASE}/webapi/chat/auto`,
      queries: QUERIES_API_IA,
      results: apiIaResults,
      allOk: apiIaResults.every((r) => r.ok),
      statuses: apiIaResults.map((r) => r.status),
    },
    api2: {
      url: API2_GRAPHQL,
      query: 'GetSubscriptionPlans',
      result: api2Result,
      ok: api2Result.ok,
    },
    conclusion: {
      apiIaOk: apiIaResults.every((r) => r.ok),
      api2Ok: api2Result.ok,
    },
  };

  const outDir = join(ROOT, 'test-results');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, `pruebas-reales-api-ia-api2-${dateLabel}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdLines = [
    '# Pruebas reales – api-ia y api2 (queries reales)',
    '',
    `**Fecha:** ${iso}`,
    '',
    '## api-ia (POST /webapi/chat/auto)',
    '',
    '| Query | HTTP | Tiempo (ms) | Estado |',
    '|-------|------|-------------|--------|',
    ...apiIaResults.map((r) => {
      const status = r.status != null ? r.status : (r.error || '—');
      const ok = r.ok ? '✅ OK' : '❌ FALLO';
      return `| ${r.query.replace(/\|/g, '\\|').slice(0, 50)} | ${status} | ${r.elapsedMs} | ${ok} |`;
    }),
    '',
    '## api2 (POST /graphql – getSubscriptionPlans)',
    '',
    `| HTTP | Tiempo (ms) | Estado |`,
    `|------|-------------|--------|`,
    `| ${api2Result.status ?? '—'} | ${api2Result.elapsedMs} | ${api2Result.ok ? '✅ OK' : '❌ FALLO'} |`,
    '',
    '## Conclusión',
    '',
    `- **api-ia:** ${report.conclusion.apiIaOk ? 'OK' : 'FALLO'}`,
    `- **api2:** ${report.conclusion.api2Ok ? 'OK' : 'FALLO'}`,
    '',
    'Evidencia completa (requests y responses): `test-results/pruebas-reales-api-ia-api2-' + dateLabel + '.json`',
  ];
  const mdPath = join(outDir, `pruebas-reales-api-ia-api2-${dateLabel}.md`);
  writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log('\n--- Resumen ---');
  console.log('api-ia:', report.conclusion.apiIaOk ? 'OK' : 'FALLO', '(statuses:', report.apiIa.statuses.join(', ') + ')');
  console.log('api2: ', report.conclusion.api2Ok ? 'OK' : 'FALLO');
  console.log('\nEvidencia guardada:');
  console.log('  ', jsonPath);
  console.log('  ', mdPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
