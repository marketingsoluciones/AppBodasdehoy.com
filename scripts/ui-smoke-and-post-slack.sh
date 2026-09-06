#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_URL="${BASE_URL:-https://app-dev.bodasdehoy.com}"
CHANNEL="${SLACK_TO:-coordinacion}"
MODE="${UI_SMOKE_MODE:-bypass}"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo '')"

BASE_CHECK="$(curl -sS --max-time 12 "$BASE_URL/" 2>/dev/null | head -n 5 || true)"
if [ -z "${BASE_CHECK//[[:space:]]/}" ]; then
  MSG="$(cat <<EOF
DE: FRONT-appEventos | PARA: COORDINACIÓN + war-room | DRI: @front_lead
ASUNTO: UI smoke — BLOCKED (web inaccesible)

Base: $BASE_URL
Modo: $MODE
Node: $(node -v 2>/dev/null || echo unknown)

Motivo: no se pudo obtener respuesta HTTP del front (timeout / red / DNS).
EOF
)"
  MSG_SAFE="$(printf '%s' "$MSG" | tr -d '\000-\010\013\014\016-\037\177')"
  "$ROOT_DIR/scripts/slack-send.sh" --web --to "$CHANNEL" "$MSG_SAFE" || true
  exit 2
fi

if echo "$BASE_CHECK" | grep -qi "Internal Server Error"; then
  MSG="$(cat <<EOF
DE: FRONT-appEventos | PARA: COORDINACIÓN + war-room | DRI: @front_lead
ASUNTO: UI smoke — BLOCKED (web 500)

Base: $BASE_URL
Modo: $MODE
Node: $(node -v 2>/dev/null || echo unknown)

Motivo: el front devuelve 'Internal Server Error' antes de ejecutar tests, no es fallo de flujo de usuario.
EOF
)"
  MSG_SAFE="$(printf '%s' "$MSG" | tr -d '\000-\010\013\014\016-\037\177')"
  "$ROOT_DIR/scripts/slack-send.sh" --web --to "$CHANNEL" "$MSG_SAFE" || true
  exit 2
fi

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  missing=""
  for v in SLACK_BOT_TOKEN API_MCP_GRAPHQL_URL FIREBASE_API_KEY SMOKE_EMAIL SMOKE_PASSWORD; do
    if [ -z "${!v:-}" ]; then
      missing="$missing $v"
    fi
  done
  if [ -n "$missing" ]; then
    MSG="$(cat <<EOF
DE: FRONT-appEventos | PARA: COORDINACIÓN + war-room | DRI: @front_lead
ASUNTO: UI smoke (CI) — BLOCKED (faltan secrets)

Base: $BASE_URL
Modo: $MODE
Faltan:$missing
EOF
)"
    MSG_SAFE="$(printf '%s' "$MSG" | tr -d '\000-\010\013\014\016-\037\177')"
    "$ROOT_DIR/scripts/slack-send.sh" --web --to "$CHANNEL" "$MSG_SAFE" || true
    exit 2
  fi
fi

if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -ge 24 ]; then
  echo "⚠️  Node v$(node -v) fuera del rango soportado; puede causar flakiness en Next dev." >&2
fi

if [ "$MODE" = "bypass" ] && [ -z "${UI_BYPASS_EVENTOS:-}" ]; then
  if [ -n "${FIREBASE_API_KEY:-}" ] && [ -n "${SMOKE_EMAIL:-}" ] && [ -n "${SMOKE_PASSWORD:-}" ] && [ -n "${API_MCP_GRAPHQL_URL:-}" ]; then
    SMOKE_DEVELOPMENT="${SMOKE_DEVELOPMENT:-bodasdehoy}"
    BYPASS_FILE="$ROOT_DIR/.tmp/ui-bypass-eventos.json"
    mkdir -p "$ROOT_DIR/.tmp"
    export UI_BYPASS_EMAIL="$SMOKE_EMAIL"
    export UI_BYPASS_ROLE="${UI_BYPASS_ROLE:-creator}"
    export UI_BYPASS_UID="$(node - <<'NODE'
const apiKey = process.env.FIREBASE_API_KEY;
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
(async () => {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}` , {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || `signIn failed (${r.status})`);
  process.stdout.write(String(j.localId || ''));
})().catch((e) => { console.error(e.message); process.exit(1); });
NODE
)"

    UI_BYPASS_UID="$UI_BYPASS_UID" UI_BYPASS_EMAIL="$UI_BYPASS_EMAIL" node - <<'NODE' >"$BYPASS_FILE"
const apiKey = process.env.FIREBASE_API_KEY;
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const dev = process.env.SMOKE_DEVELOPMENT || 'bodasdehoy';
const url = process.env.API_MCP_GRAPHQL_URL;

async function signIn() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}` , {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || `signIn failed (${r.status})`);
  return j.idToken;
}

async function gql(idToken) {
  const query = `query GetAllUserRelatedEventsByEmail($email: String!, $development: String!, $pagination: CRM_PaginationInput!) {
    getAllUserRelatedEventsByEmail(email: $email, development: $development, pagination: $pagination) {
      eventos { _id nombre estatus tipo fecha timeZone usuario_id usuario_nombre compartido_array }
    }
  }`;

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      'X-Development': dev,
      Development: dev,
      IsProduction: 'false',
    },
    body: JSON.stringify({ query, variables: { email, development: dev, pagination: { page: 1, limit: 20 } } }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || j?.errors?.length) {
    const msg = j?.errors?.[0]?.message || `GraphQL failed (${r.status})`;
    throw new Error(msg);
  }
  return j?.data?.getAllUserRelatedEventsByEmail?.eventos || [];
}

(async () => {
  const idToken = await signIn();
  const eventos = await gql(idToken);
  const normalizeStatus = (s) => {
    const v = String(s || '').toLowerCase();
    if (v.includes('archiv')) return 'archivado';
    if (v.includes('realiz') || v.includes('pasad') || v.includes('hecho')) return 'realizado';
    return 'pendiente';
  };
  const safe = (Array.isArray(eventos) ? eventos : []).map((e) => ({
    ...e,
    estatus: normalizeStatus(e?.estatus),
    fecha_creacion: e?.fecha_creacion || e?.fecha || String(Date.now()),
    fecha_actualizacion: e?.fecha_actualizacion || e?.fecha || String(Date.now()),
    compartido_array: Array.isArray(e?.compartido_array) ? e.compartido_array : [],
    detalles_compartidos_array: [],
    detalles_usuario_id: {
      uid: process.env.UI_BYPASS_UID || '',
      email: process.env.UI_BYPASS_EMAIL || email,
      displayName: String(process.env.UI_BYPASS_EMAIL || email).split('@')[0] || 'user',
      photoURL: '',
      onLine: { status: false, dateConection: 0 },
      planSpaceSelect: '',
    },
    permissions: [],
    invitados_array: [],
    menus_array: [],
    itinerarios_array: [],
    notificaciones_array: [],
    planSpace: [],
    planSpaceSelect: e?.planSpaceSelect || '',
  }));
  process.stdout.write(JSON.stringify(safe));
})().catch((e) => { console.error(e.message); process.exit(1); });
NODE

    export UI_BYPASS_EVENTOS_FILE="$BYPASS_FILE"
  fi
fi

if [ "${DRY_RUN:-}" = "1" ]; then
  echo "DRY_RUN=1" >&2
  echo "- Ejecutaría: pnpm exec playwright test e2e-app/ui-smoke-dev.spec.ts" >&2
  echo "- Publicaría en Slack: $CHANNEL" >&2
  exit 0
fi

if [ "$MODE" != "bypass" ]; then
  if [ -z "${TEST_USER_EMAIL:-}" ] || [ -z "${TEST_USER_PASSWORD:-}" ]; then
    echo "❌ Faltan credenciales UI: TEST_USER_EMAIL y/o TEST_USER_PASSWORD" >&2
    exit 1
  fi
fi

pnpm exec playwright install webkit >/dev/null 2>&1 || true

JSON_OUT="$ROOT_DIR/.tmp/ui-smoke-playwright.json"
mkdir -p "$ROOT_DIR/.tmp"

set +e
E2E_SKIP_HEALTH=1 \
BASE_URL="$BASE_URL" TEST_USER_EMAIL="${TEST_USER_EMAIL:-}" TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-}" UI_SMOKE_MODE="$MODE" \
UI_BYPASS_EMAIL="${UI_BYPASS_EMAIL:-}" UI_BYPASS_UID="${UI_BYPASS_UID:-}" UI_BYPASS_ROLE="${UI_BYPASS_ROLE:-}" UI_BYPASS_EVENTOS="${UI_BYPASS_EVENTOS:-}" \
UI_BYPASS_EVENTOS_FILE="${UI_BYPASS_EVENTOS_FILE:-}" \
  pnpm exec playwright test e2e-app/ui-smoke-dev.spec.ts --reporter=json >"$JSON_OUT"
PW_EXIT=$?
set -e

SMOKE_TEXT="$(JSON_OUT="$JSON_OUT" BASE_URL="$BASE_URL" TEST_USER_EMAIL="${TEST_USER_EMAIL:-}" SLACK_TO="$CHANNEL" UI_SMOKE_MODE="$MODE" UI_BYPASS_EMAIL="${UI_BYPASS_EMAIL:-}" node - <<'NODE'
const fs = require('fs');
const path = process.env.JSON_OUT;
const baseUrl = process.env.BASE_URL;
const email = process.env.TEST_USER_EMAIL || process.env.UI_BYPASS_EMAIL;
const mode = process.env.UI_SMOKE_MODE || 'bypass';
const channel = process.env.SLACK_TO || 'coordinacion';

const raw = fs.readFileSync(path, 'utf8');
let j;
try {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('missing json braces');
  const slice = raw.slice(start, end + 1);
  j = JSON.parse(slice);
} catch (e) {
  console.log('DE: FRONT-appEventos | PARA: COORDINACIÓN + war-room | DRI: @front_lead');
  console.log('ASUNTO: UI smoke (-dev) — FAIL (reporter json no parseable)');
  console.log('');
  console.log(`Base: ${baseUrl}`);
  console.log(`User: ${email}`);
  console.log('');
  console.log('Nota: el fichero de reporter contiene logs antes/después del JSON.');
  process.exit(0);
}

const errors = Array.isArray(j.errors) ? j.errors : [];

let passed = 0, failed = 0, skipped = 0, flaky = 0;
const failedItems = [];
const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '').replace(/[\u0000-\u001F\u007F]/g, '');
function walk(suites) {
  if (!Array.isArray(suites)) return;
  for (const s of suites) {
    for (const sp of (s.specs || [])) {
      for (const t of (sp.tests || [])) {
        for (const r of (t.results || [])) {
          const st = r.status;
          if (st === 'passed') passed++;
          else if (st === 'failed' || st === 'timedOut') {
            failed++;
            if (failedItems.length < 5) {
              const msg = stripAnsi(String(r.error?.message || 'unknown error').split('\n')[0]);
              failedItems.push({ title: sp.title, msg });
            }
          }
          else if (st === 'skipped') skipped++;
          else if (st === 'flaky') flaky++;
        }
      }
    }
    walk(s.suites);
  }
}

walk(j.suites);

const ok = errors.length === 0 && failed === 0;
const lines = [];
lines.push(`DE: FRONT-appEventos | PARA: COORDINACIÓN + war-room | DRI: @front_lead`);
lines.push(`ASUNTO: UI smoke (-dev) — ${ok ? 'OK' : 'FAIL'} (passed=${passed}, failed=${failed}, skipped=${skipped}, flaky=${flaky}, errors=${errors.length})`);
lines.push('');
lines.push(`Base: ${baseUrl}`);
lines.push(`Modo: ${mode}`);
if (email) lines.push(`User: ${email}`);
lines.push('');
lines.push('Tests:');
lines.push('- login + seleccionar evento');
lines.push('- invitados: carga lista');
lines.push('- planes/billing: carga sin crash');
lines.push('- Copilot: toggle visible y abre panel');

if (!ok) {
  lines.push('');
  if (errors.length) {
    lines.push('Errores globales (primeros 3):');
    for (const e of errors.slice(0, 3)) {
      const msg = stripAnsi(String(e?.message || 'unknown error').split('\n')[0]);
      lines.push(`- ${msg}`);
    }
  }
  if (failedItems.length) {
    lines.push('');
    lines.push('Fallos (primeros 5):');
    for (const it of failedItems) {
      lines.push(`- ${it.title}: ${it.msg}`);
    }
  }
}

process.stdout.write(lines.join('\n'));
NODE
)"

SMOKE_TEXT_SAFE="$(printf '%s' "$SMOKE_TEXT" | tr -d '\000-\010\013\014\016-\037\177')"
"$ROOT_DIR/scripts/slack-send.sh" --web --to "$CHANNEL" "$SMOKE_TEXT_SAFE"

exit "$PW_EXIT"
