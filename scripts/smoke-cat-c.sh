#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# smoke-cat-c.sh — Verificar las 10 ops Cat C en producción api-mcp.
#
# v2 (2026-06-05): shapes corregidos con los del MCP_ADAPTERS del front +
# uso de archivos JSON para body (evita quoting hell del shell).
#
# USO:
#   bash scripts/smoke-cat-c.sh                         # JWT dummy (basta para schema)
#   MCP_JWT=$tokenReal bash scripts/smoke-cat-c.sh     # JWT real (opcional)
#
# CRITERIO ÉXITO: 10/10 ops responden sin
#   - "Cannot query field"        (op no existe)
#   - "Unknown argument"           (arg incorrecto)
#   - "must not have a selection"  (subselection inválida)
#   - "must have a selection"      (falta subselection)
#   - "MongoNotConnectedError"     (P0 abierto)
#   - "of type ... is required, but"  (arg requerido faltante)
#
# NO son fallos:
#   - {"data":{...}} con success:false  → schema OK, solo no hay data
#   - "not found", "Unauthorized"        → schema OK
#
# Exit 0 si 10/10 verde, 1 si alguna falla.
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

API_MCP="${API_MCP_URL:-https://api-mcp.eventosorganizador.com/graphql}"
DEV="${X_DEVELOPMENT:-bodasdehoy}"
JWT="${MCP_JWT:-dummy_smoke_token}"

# Definimos cada op como: NAME|QUERY|VARS_JSON
# Las queries usan variables GraphQL (no string interpolation) → JSON limpio.
# Shapes extraídos de apps/appEventos/utils/{Fetching.ts, apiMcpAdapter.ts}.

declare -a OPS=(
  # Pagos boda (4 ops verificadas) — usan _id ficticios "x" para validar schema
  'nuevoPago|mutation($evento_id:ID!,$gasto_id:ID!,$pago:JSON!){ nuevoPago(evento_id:$evento_id,gasto_id:$gasto_id,pago:$pago){ success } }|{"evento_id":"x","gasto_id":"x","pago":{}}'
  'editPago|mutation($evento_id:ID!,$gasto_id:ID!,$pago_id:ID!,$datos:JSON!){ editPago(evento_id:$evento_id,gasto_id:$gasto_id,pago_id:$pago_id,datos:$datos){ success } }|{"evento_id":"x","gasto_id":"x","pago_id":"x","datos":{}}'
  # Shape canonical confirmado: NO acepta categoria_id, types ID!, devuelve EventoResponse
  'borraPago|mutation($evento_id:ID!,$gasto_id:ID!,$pago_id:ID!){ borraPago(evento_id:$evento_id,gasto_id:$gasto_id,pago_id:$pago_id){ success errors{ field message code } evento{ _id } } }|{"evento_id":"x","gasto_id":"x","pago_id":"x"}'
  # deletepayment es alias front a borraPago — re-probamos con shape de borraPago canonical
  'deletepayment|mutation($evento_id:ID!,$gasto_id:ID!,$pago_id:ID!){ borraPago(evento_id:$evento_id,gasto_id:$gasto_id,pago_id:$pago_id){ success } }|{"evento_id":"x","gasto_id":"x","pago_id":"x"}'

  # Directorio (2 ops verificadas)
  'getAllBusinesses|query($development:String!){ getAllBusinesses(development:$development){ total } }|{"development":"bodasdehoy"}'
  'getAllProducts|query($grupo:String){ getAllProducts(grupo:$grupo){ total } }|{"grupo":"app"}'

  # Plan space (2 ops verificadas) — getPlanSpaceSelect/getPsTemplate devuelven JSON escalar (sin subselection)
  'getPlanSpaceSelect|query($evento_id:ID!,$development:String!){ getPlanSpaceSelect(evento_id:$evento_id,development:$development) }|{"evento_id":"x","development":"bodasdehoy"}'
  'getPsTemplate|query($evento_id:ID!,$development:String!){ getPsTemplate(evento_id:$evento_id,development:$development) }|{"evento_id":"x","development":"bodasdehoy"}'

  # Itinerario (2 ops) — getItinerario NO existe, front lo resuelve via getEventoById
  'getItinerario|query($id:ID!){ getEventoById(id:$id){ _id nombre } }|{"id":"x"}'
  # updateTasksOrder (api-mcp 2026-06-05 commit cb9b33c) — última Cat C
  'updateTasksOrder|mutation($evento_id:ID!,$itinerario_id:ID!,$taskIds:[ID!]!){ updateTasksOrder(evento_id:$evento_id,itinerario_id:$itinerario_id,taskIds:$taskIds){ success errors{ field message code } evento{ _id } } }|{"evento_id":"x","itinerario_id":"x","taskIds":["a","b"]}'
  'duplicateItinerario|mutation($evento_id:ID!,$itinerario_id:ID!){ duplicateItinerario(evento_id:$evento_id,itinerario_id:$itinerario_id){ success } }|{"evento_id":"x","itinerario_id":"x"}'
)

PASS=0
FAIL=0

echo "" >&2
echo "🧪 Smoke Cat C contra $API_MCP" >&2
echo "" >&2

for entry in "${OPS[@]}"; do
  op="${entry%%|*}"
  rest="${entry#*|}"
  query="${rest%%|*}"
  vars="${rest#*|}"

  # Construir body JSON con jq para escape correcto
  body=$(printf '{"query":%s,"variables":%s}' \
    "$(printf '%s' "$query" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
    "$vars")

  # Solo enviamos Authorization si JWT es real (no dummy). Sin token, las queries
  # ejecutan en modo público — la respuesta sigue siendo válida para verificar schema.
  if [ "$JWT" = "dummy_smoke_token" ]; then
    resp=$(curl -sS --max-time 15 -X POST "$API_MCP" \
      -H "X-Development: $DEV" \
      -H "Content-Type: application/json" \
      -d "$body" 2>&1)
  else
    resp=$(curl -sS --max-time 15 -X POST "$API_MCP" \
      -H "Authorization: Bearer $JWT" \
      -H "X-Development: $DEV" \
      -H "Content-Type: application/json" \
      -d "$body" 2>&1)
  fi

  fail_reason=""
  if echo "$resp" | grep -q "Cannot query field"; then
    fail_reason="op no existe en schema"
  elif echo "$resp" | grep -q "Unknown argument"; then
    fail_reason="argumento no soportado"
  elif echo "$resp" | grep -q "must not have a selection"; then
    fail_reason="tipo escalar con subselection inválida"
  elif echo "$resp" | grep -q "must have a selection"; then
    fail_reason="falta subselection para tipo objeto"
  elif echo "$resp" | grep -q "MongoNotConnectedError"; then
    fail_reason="P0 MongoDB caída"
  elif echo "$resp" | grep -q "is required, but it was not provided"; then
    fail_reason="argumento requerido faltante"
  elif echo "$resp" | grep -qE "Connection refused|Could not resolve|timeout"; then
    fail_reason="backend caído"
  elif echo "$resp" | grep -q "Formato de token JWT inválido"; then
    fail_reason="JWT rechazado — usar MCP_JWT=<jwt_real>"
  elif echo "$resp" | grep -q "INTERNAL_SERVER_ERROR"; then
    fail_reason="500 backend"
  fi

  short=$(printf '%s' "$resp" | head -c 140)
  if [ -n "$fail_reason" ]; then
    FAIL=$((FAIL+1))
    echo "❌ $op  →  $fail_reason" >&2
    echo "    resp: $short" >&2
  else
    PASS=$((PASS+1))
    echo "✅ $op  →  ${short:0:80}" >&2
  fi
done

echo "" >&2
echo "═══════════════════════════════════════════════════════════════" >&2
echo "  RESULTADO: $PASS/10 schemas OK · $FAIL/10 fallan" >&2
echo "═══════════════════════════════════════════════════════════════" >&2

if [ "$FAIL" -gt 0 ]; then
  echo "" >&2
  echo "❌ FAIL — Cat C NO certificada. Pasar los shape mismatch a api-mcp." >&2
  exit 1
fi

echo "" >&2
echo "✅ PASS — Cat C certificada en api-mcp." >&2
exit 0
