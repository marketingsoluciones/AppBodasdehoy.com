#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// audit-fetching-real.mjs — Audita las queries TAL CUAL están en Fetching.ts
// (extrayéndolas del propio archivo) contra api-mcp producción.
// Detecta shape mismatch REAL (no falsos positivos de queries inventadas).
//
// Uso:
//   node scripts/audit-fetching-real.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';

const API_MCP = process.env.API_MCP_URL || 'https://api-mcp.eventosorganizador.com/graphql';
const DEV = process.env.X_DEVELOPMENT || 'bodasdehoy';

// 1. Parsear queries del Fetching.ts
const src = fs.readFileSync('apps/appEventos/utils/Fetching.ts', 'utf8');
const queries = {};
// Match: opName: `query|mutation ... `,
const re = /^  ([a-zA-Z][a-zA-Z0-9_]*): `((?:[^`\\]|\\.)*)`,?\s*$/gms;
let m;
while ((m = re.exec(src)) !== null) {
  queries[m[1]] = m[2];
}

console.log(`📋 ${Object.keys(queries).length} queries extraídas del Fetching.ts\n`);

// 2. Variables dummy genéricas (cubren los $vars típicos del front)
const DUMMY_VARS = {
  // IDs/strings
  uid: 'x', uids: ['x'], eventID: 'x', eventoID: 'x', evento_id: 'x',
  guestID: 'x', invitado_id: 'x', invitados_array: [], invitados: [],
  categoria_id: 'x', gasto_id: 'x', pago_id: 'x', menu_id: 'x', menuId: 'x',
  template_id: 'x', element_id: 'x', mesa_id: 'x', planSpace_id: 'x',
  itinerario_id: 'x', tarea_id: 'x', notification_id: 'x',
  id: 'x', _id: 'x',
  // Pagos / objetos
  pago: {}, datos: {}, args: {}, input: { nombre: 'x', tipo: 'BODA', fecha: '2026-01-01', pais: 'x', poblacion: 'x' },
  menu: {}, grupo: 'app', grupo_id: 'x',
  updates: {}, value: {},
  // Compartir
  permisos: { rol: 'view' }, emails: ['x@x'], usuario_id: 'x', usuarios_array: [],
  // Stripe / paginación
  pag: { page: 1, limit: 1 }, dev: 'bodasdehoy', development: 'bodasdehoy',
  email: 'x@x', items: [], plan_id: 'x', billing_period: 'monthly',
  success_url: 'http://x', cancel_url: 'http://x', mode: 'payment',
  // Otros
  q: '', filter: {}, sort: {}, skip: 0, limit: 1, criteria: {},
  template: 'x', design: {}, html: '<p>x</p>', configTemplate: {},
  body: 'x', text: 'x', notes: 'x',
  phone: '+34000000000', cellPhone: '+34000000000', countryCode: '34',
  // Upload
  file: null, eventId: 'x', category: 'x',
  // Permisos
  data: {},
};

// 3. Ejecutar cada query
const results = { ok: [], fail: [], skip: [] };

for (const [name, query] of Object.entries(queries)) {
  // Detectar variables que necesita
  const varNames = [...query.matchAll(/\$([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map(m => m[1]);
  const vars = {};
  let missingVar = false;
  for (const v of varNames) {
    if (DUMMY_VARS[v] === undefined) {
      missingVar = true;
      vars[v] = null;
    } else {
      vars[v] = DUMMY_VARS[v];
    }
  }

  // Si no hay vars o todas conocidas, ejecutar
  let resp;
  try {
    const res = await fetch(API_MCP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Development': DEV },
      body: JSON.stringify({ query, variables: vars }),
    });
    resp = await res.text();
  } catch (e) {
    results.fail.push({ name, reason: 'network', detail: e.message });
    continue;
  }

  // Clasificar respuesta
  let reason = '';
  if (/Cannot query field/.test(resp)) {
    const f = resp.match(/Cannot query field "([^"]+)" on type "([^"]+)"/);
    reason = f ? `campo "${f[1]}" no existe en ${f[2]}` : 'Cannot query field';
  } else if (/Unknown argument/.test(resp)) {
    const f = resp.match(/Unknown argument "([^"]+)" on field "([^"]+)"/);
    reason = f ? `arg "${f[1]}" no existe en ${f[2]}` : 'Unknown argument';
  } else if (/must not have a selection/.test(resp)) {
    reason = 'tipo escalar con subselection inválida';
  } else if (/Unknown type/.test(resp)) {
    const f = resp.match(/Unknown type "([^"]+)"/);
    reason = f ? `tipo "${f[1]}" no existe` : 'Unknown type';
  } else if (/MongoNotConnectedError/.test(resp)) {
    reason = 'P0 MongoDB';
  }

  if (reason) {
    results.fail.push({ name, reason, detail: resp.substring(0, 160) });
  } else {
    results.ok.push({ name });
  }
}

// 4. Reporte
console.log(`✅ ${results.ok.length} schemas OK`);
console.log(`❌ ${results.fail.length} schemas FAIL`);
console.log('');

if (results.fail.length) {
  console.log('💥 FAILS detallados:\n');
  for (const f of results.fail) {
    console.log(`  ❌ ${f.name}`);
    console.log(`     razón:  ${f.reason}`);
    console.log(`     resp:   ${f.detail}`);
    console.log('');
  }
  process.exit(1);
}
process.exit(0);
