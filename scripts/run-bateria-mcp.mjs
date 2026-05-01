#!/usr/bin/env node
/**
 * Batería de pruebas contra api3-mcp-graphql.eventosorganizador.com (GraphQL).
 * Ejecuta varias operaciones y reporta HTTP status + resumen coherente/incoherente.
 *
 * Uso: node scripts/run-bateria-mcp.mjs [--json] [--output resultado-mcp.json]
 * Env: API_MCP_GRAPHQL_URL, DEVELOPMENT, SUPPORT_KEY (opcionales)
 */

const MCP_GRAPHQL_URL =
  process.env.API_MCP_GRAPHQL_URL ||
  process.env.API3_MCP_GRAPHQL_URL ||
  process.env.API2_URL ||
  'https://api3-mcp-graphql.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.DEVELOPMENT || 'bodasdehoy';
const SUPPORT_KEY = process.env.SUPPORT_KEY || 'SK-bodasdehoy-a71f5b3c';
const USER_EMAIL = process.env.USER_EMAIL || 'bodasdehoy.com@gmail.com';

const TESTS = [
  {
    id: 'getWhitelabelBySlug',
    query: `query GetWhitelabelBySlug($slug: String!) { getWhitelabelBySlug(slug: $slug) { success whitelabel { id slug development name } errors { field message code } } }`,
    variables: { slug: DEVELOPMENT },
  },
  {
    id: 'getUserProfile',
    query: `query GetUserProfile($email: String!) { getUserProfile(email: $email) { id email name role development } }`,
    variables: { email: USER_EMAIL },
  },
  {
    id: 'getUserApiConfigs',
    query: `query GetUserApiConfigs($userId: String!) { getUserApiConfigs(userId: $userId) { userId development apiConfigs { provider enabled } } }`,
    variables: { userId: USER_EMAIL },
  },
  {
    id: 'getUserChats',
    query: `query GetUserChats($email: String!, $development: String!) { getUserChats(email: $email, development: $development) { chats { id } } }`,
    variables: { email: USER_EMAIL, development: DEVELOPMENT },
  },
  {
    id: 'getUserEventsByEmail',
    query: `query GetUserEventsByEmail($email: String!, $development: String!) { getUserEventsByEmail(email: $email, development: $development) { eventos { id tipo estatus } } }`,
    variables: { email: USER_EMAIL, development: DEVELOPMENT },
  },
  // Introspection desactivada en MCP en producción → esperamos 400
  {
    id: 'introspection_disabled',
    query: `{ __schema { queryType { name } } }`,
    variables: {},
    expectBadRequest: true,
  },
];

function isCoherent(result, test) {
  if (test.expectBadRequest) return result.httpStatus === 400;
  if (result.httpStatus !== 200) return false;
  const body = result.body || {};
  if (body.errors && body.errors.length) return false;
  return true;
}

async function runOne(test) {
  const expectBadRequest = !!test.expectBadRequest;
  const headers = {
    'Content-Type': 'application/json',
    'X-Development': DEVELOPMENT,
    'X-Origin': `https://${DEVELOPMENT}.com`,
    'X-Support-Key': SUPPORT_KEY,
  };
  const body = JSON.stringify({ query: test.query, variables: test.variables });
  let httpStatus = 0;
  let responseText = '';
  try {
    const res = await fetch(MCP_GRAPHQL_URL, { method: 'POST', headers, body });
    httpStatus = res.status;
    responseText = await res.text();
  } catch (e) {
    responseText = e.message || String(e);
  }
  let parsed = {};
  try {
    parsed = JSON.parse(responseText);
  } catch (_) {}
  return {
    id: test.id,
    httpStatus,
    body: parsed,
    responseText: responseText.slice(0, 500),
    coherente: isCoherent({ httpStatus, body: parsed }, test),
  };
}

async function main() {
  const outputJson = process.argv.includes('--json');
  const outIdx = process.argv.indexOf('--output');
  const outputFile = outIdx >= 0 ? process.argv[outIdx + 1] : null;

  console.log(`\n🧪 Batería MCP → ${MCP_GRAPHQL_URL}\n`);

  const resultados = [];
  let coherentes = 0;
  let incoherentes = 0;

  for (const test of TESTS) {
    const r = await runOne(test);
    resultados.push(r);
    if (r.coherente) coherentes++; else incoherentes++;
    const icon = r.coherente ? '✅' : '❌';
    console.log(`${icon} ${r.id} → HTTP ${r.httpStatus}`);
  }

  console.log(`\n--- Resumen: ${coherentes} coherentes, ${incoherentes} incoherentes (${TESTS.length} total)\n`);

  const salida = {
    bateria: 'mcp',
    fecha: new Date().toISOString(),
    mcpGraphqlUrl: MCP_GRAPHQL_URL,
    development: DEVELOPMENT,
    total: TESTS.length,
    coherentes,
    incoherentes,
    resultados,
  };

  if (outputJson || outputFile) {
    const path = outputFile || `resultados-bateria-mcp-${new Date().toISOString().split('T')[0]}.json`;
    const fs = await import('fs');
    fs.writeFileSync(path, JSON.stringify(salida, null, 2), 'utf8');
    console.log(`Salida guardada en ${path}\n`);
  }

  process.exit(incoherentes > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
