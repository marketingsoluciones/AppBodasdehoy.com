#!/usr/bin/env node
/**
 * Ejecuta todas las pruebas reales en un solo comando:
 * - chat-test y app-test (GET)
 * - api-ia (POST /webapi/chat/auto, 3 queries reales)
 * - mcp (POST /graphql getSubscriptionPlans)
 * Genera un único informe en test-results/ para enviar evidencia.
 *
 * Uso: node scripts/ejecutar-pruebas-reales-todas.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_IA_BASE =
  process.env.API_IA_URL ||
  process.env.API3_IA_URL ||
  process.env.PYTHON_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'https://api3-ia.eventosorganizador.com';
const MCP_GRAPHQL =
  process.env.API_MCP_GRAPHQL_URL ||
  process.env.API3_MCP_GRAPHQL_URL ||
  process.env.API2_GRAPHQL_URL ||
  'https://api3-mcp-graphql.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';
const FIREBASE_JWT = process.env.FIREBASE_JWT || '';
const BASE_APP = 'https://app-test.bodasdehoy.com';
const BASE_CHAT = 'https://chat-test.bodasdehoy.com';

const QUERIES_API_IA = ['Hola', '¿Cuántos invitados tengo?', 'Dame un resumen de mi evento'];
const GET_SUBSCRIPTION_PLANS_QUERY = `
  query GetSubscriptionPlans($development: String!, $tier: SubscriptionTier, $is_public: Boolean) {
    getSubscriptionPlans(development: $development, tier: $tier, is_public: $is_public) {
      _id plan_id name tier is_active is_public
      pricing { monthly_fee annual_fee trial_days }
    }
  }
`;

async function get(url, timeout = 15000) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': 'PruebasReales-Completo/1.0' },
    });
    const body = await res.text();
    return {
      url,
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - start,
      bodyPreview: body.slice(0, 400).replace(/\s+/g, ' ').trim(),
    };
  } catch (err) {
    return { url, error: err.message || String(err), elapsedMs: Date.now() - start, ok: false, status: null };
  }
}

async function postApiIa(query) {
  const url = `${API_IA_BASE}/webapi/chat/auto`;
  const body = { messages: [{ role: 'user', content: query }], stream: false };
  const headers = { 'Content-Type': 'application/json', 'X-Development': DEVELOPMENT };
  if (FIREBASE_JWT) headers['Authorization'] = `Bearer ${FIREBASE_JWT}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
    const raw = await res.text();
    let preview = raw;
    try {
      if (raw.length > 600) preview = JSON.stringify(JSON.parse(raw)).slice(0, 600);
      else preview = raw.slice(0, 600);
    } catch (_) {}
    return {
      query,
      url,
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - start,
      responsePreview: preview,
    };
  } catch (err) {
    return { query, url, error: err.message || String(err), elapsedMs: Date.now() - start, ok: false, status: null };
  }
}

async function postMcp() {
  const body = { query: GET_SUBSCRIPTION_PLANS_QUERY, variables: { development: DEVELOPMENT, is_public: true } };
  const headers = { 'Content-Type': 'application/json', 'X-Development': DEVELOPMENT };
  const start = Date.now();
  try {
    const res = await fetch(MCP_GRAPHQL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const raw = await res.text();
    let preview = raw.slice(0, 500);
    try {
      const j = JSON.parse(raw);
      if (j.errors) preview = JSON.stringify({ errors: j.errors });
      else if (j.data) preview = JSON.stringify({ data: 'getSubscriptionPlans: ' + (j.data.getSubscriptionPlans?.length ?? 0) + ' planes' });
    } catch (_) {}
    return {
      url: MCP_GRAPHQL,
      query: 'getSubscriptionPlans',
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - start,
      responsePreview: preview,
    };
  } catch (err) {
    return { url: MCP_GRAPHQL, query: 'getSubscriptionPlans', error: err.message || String(err), elapsedMs: Date.now() - start, ok: false, status: null };
  }
}

async function main() {
  const now = new Date();
  const iso = now.toISOString();
  const dateLabel = iso.slice(0, 19).replace(/[-:T]/g, '');

  console.log('Ejecutando todas las pruebas reales...\n');

  const report = {
    timestamp: iso,
    dateLabel,
    env: { API_IA_BASE, BASE_APP, BASE_CHAT, DEVELOPMENT, MCP_GRAPHQL, hasFirebaseJwt: !!FIREBASE_JWT },
    chatAppTest: null,
    apiIa: null,
    mcp: null,
    conclusion: {},
  };

  // 1) Chat / App-test
  console.log('1) chat-test y app-test');
  const urls = [
    { name: 'app-test (raíz)', url: `${BASE_APP}/` },
    { name: 'app-test /login', url: `${BASE_APP}/login` },
    { name: 'app-test /api/health', url: `${BASE_APP}/api/health` },
    { name: 'chat-test (raíz)', url: `${BASE_CHAT}/` },
    { name: 'chat-test /api/health', url: `${BASE_CHAT}/api/health` },
  ];
  const chatAppResults = [];
  for (const { name, url } of urls) {
    process.stdout.write(`   ${name} ... `);
    const r = await get(url);
    chatAppResults.push({ name, ...r });
    console.log(r.status != null ? `HTTP ${r.status} (${r.elapsedMs} ms)` : `ERROR: ${r.error}`);
  }
  report.chatAppTest = {
    results: chatAppResults,
    appTestOk: chatAppResults.find((x) => x.name === 'app-test (raíz)')?.ok ?? false,
    chatTestOk: chatAppResults.find((x) => x.name === 'chat-test (raíz)')?.ok ?? false,
  };
  report.conclusion.chatAppTest = report.chatAppTest.appTestOk && report.chatAppTest.chatTestOk;

  // 2) api-ia
  console.log('\n2) api-ia (queries reales)');
  const apiIaResults = [];
  for (const q of QUERIES_API_IA) {
    process.stdout.write(`   "${q.slice(0, 35)}${q.length > 35 ? '…' : ''}" ... `);
    const r = await postApiIa(q);
    apiIaResults.push(r);
    console.log(r.status != null ? `HTTP ${r.status} (${r.elapsedMs} ms)` : `ERROR: ${r.error}`);
  }
  report.apiIa = {
    url: `${API_IA_BASE}/webapi/chat/auto`,
    results: apiIaResults,
    allOk: apiIaResults.every((r) => r.ok),
    statuses: apiIaResults.map((r) => r.status),
  };
  report.conclusion.apiIa = report.apiIa.allOk;

  // 3) mcp
  console.log('\n3) mcp (getSubscriptionPlans)');
  process.stdout.write('   getSubscriptionPlans ... ');
  const mcpResult = await postMcp();
  console.log(mcpResult.status != null ? `HTTP ${mcpResult.status} (${mcpResult.elapsedMs} ms)` : `ERROR: ${mcpResult.error}`);
  report.mcp = { result: mcpResult, ok: mcpResult.ok };
  report.conclusion.mcp = mcpResult.ok;

  const outDir = join(ROOT, 'test-results');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, `pruebas-reales-completo-${dateLabel}.json`);
  const mdPath = join(outDir, `pruebas-reales-completo-${dateLabel}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# Pruebas reales – informe completo',
    '',
    `**Fecha:** ${iso}`,
    '',
    '## 1. chat-test y app-test',
    '',
    '| URL | HTTP | Tiempo (ms) | Estado |',
    '|-----|------|-------------|--------|',
    ...chatAppResults.map((r) => `| ${r.name} | ${r.status ?? '—'} | ${r.elapsedMs} | ${r.ok ? '✅ OK' : '❌ FALLO'} |`),
    '',
    '## 2. api-ia (POST /webapi/chat/auto)',
    '',
    '| Query | HTTP | Tiempo (ms) | Estado |',
    '|-------|------|-------------|--------|',
    ...apiIaResults.map((r) => `| ${(r.query || '').replace(/\|/g, '\\|').slice(0, 45)} | ${r.status ?? '—'} | ${r.elapsedMs} | ${r.ok ? '✅ OK' : '❌ FALLO'} |`),
    '',
    '## 3. mcp (POST /graphql)',
    '',
    `| getSubscriptionPlans | ${mcpResult.status ?? '—'} | ${mcpResult.elapsedMs} ms | ${mcpResult.ok ? '✅ OK' : '❌ FALLO'} |`,
    '',
    '## Conclusión',
    '',
    `- **chat/app-test:** ${report.conclusion.chatAppTest ? 'OK' : 'FALLO'}`,
    `- **api-ia:** ${report.conclusion.apiIa ? 'OK' : 'FALLO'}`,
    `- **mcp:** ${report.conclusion.mcp ? 'OK' : 'FALLO'}`,
    '',
    `Evidencia completa: \`test-results/pruebas-reales-completo-${dateLabel}.json\``,
  ].join('\n');
  writeFileSync(mdPath, md, 'utf8');

  console.log('\n--- Resumen ---');
  console.log('chat/app-test:', report.conclusion.chatAppTest ? 'OK' : 'FALLO');
  console.log('api-ia:      ', report.conclusion.apiIa ? 'OK' : 'FALLO');
  console.log('mcp:         ', report.conclusion.mcp ? 'OK' : 'FALLO');
  console.log('\nEvidencia:');
  console.log('  ', jsonPath);
  console.log('  ', mdPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
