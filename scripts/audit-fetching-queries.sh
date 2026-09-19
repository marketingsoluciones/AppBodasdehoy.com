#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# audit-fetching-queries.sh — Lanza cada query crítica de Fetching.ts contra
# api-mcp con args dummy y detecta shape mismatch (igual que smoke-cat-c.sh).
#
# Salida:
#   ✅ <name>    schema OK (response válida)
#   ❌ <name>    <razón fail>
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

API_MCP="${API_MCP_URL:-https://api-mcp.eventosorganizador.com/graphql}"
DEV="${X_DEVELOPMENT:-bodasdehoy}"

# Definimos cada query como: NAME|QUERY_GRAPHQL|VARS_JSON
# Queries extraídas del propio Fetching.ts del front (igual que las usa el código)

declare -a OPS=(
  # Auth / User
  'getCurrentUser|query{ getCurrentUser{ uid email displayName } }|{}'
  'getUser|query($uid:String!){ getUser(uid:$uid){ uid email } }|{"uid":"x"}'
  'getUsers|query($uids:[String!]){ getUsers(uids:$uids){ uid email } }|{"uids":["x"]}'
  'updateUser|mutation($uid:String!,$args:JSON!){ updateUser(uid:$uid, args:$args){ success } }|{"uid":"x","args":{}}'
  'createUser|mutation($args:JSON!){ createUser(args:$args){ success } }|{"args":{}}'
  'createUserWithPassword|mutation($args:JSON!){ createUserWithPassword(args:$args){ success } }|{"args":{}}'

  # Eventos / CRUD core
  'eventCreate|mutation($input:EventoInput!){ eventCreate(input:$input){ success errors{ field message code } evento{ _id } } }|{"input":{"nombre":"x","tipo":"BODA","fecha":"2026-01-01","pais":"x","poblacion":"x"}}'
  'eventUpdate|mutation($eventID:ID!,$input:JSON!){ eventUpdate(eventID:$eventID, input:$input){ success errors{ field message code } evento{ _id } } }|{"eventID":"x","input":{}}'
  'eventDelete|mutation($eventID:ID!){ eventDelete(eventID:$eventID){ success errors{ field message code } } }|{"eventID":"x"}'
  'getEventosByUsuario|query($uid:String!,$pag:CRM_PaginationInput!,$dev:String){ getEventosByUsuario(usuario_id:$uid,pagination:$pag,development:$dev){ total } }|{"uid":"x","pag":{"page":1,"limit":1},"dev":"bodasdehoy"}'
  'getEventsByID|query($eventID:ID!){ getEventoById(id:$eventID){ _id nombre } }|{"eventID":"x"}'

  # Invitados
  'createGuests|mutation($eventID:ID!,$datos:JSON!){ agregarInvitado(evento_id:$eventID, datos:$datos){ success } }|{"eventID":"x","datos":{}}'
  'editGuests|mutation($eventID:ID!,$invitado_id:ID!,$datos:JSON!){ editarInvitado(evento_id:$eventID, invitado_id:$invitado_id, datos:$datos){ success } }|{"eventID":"x","invitado_id":"x","datos":{}}'
  'removeGuests|mutation($eventID:ID!,$invitado_id:ID!){ removerInvitado(evento_id:$eventID, invitado_id:$invitado_id){ success } }|{"eventID":"x","invitado_id":"x"}'

  # Mesas
  'createElement|mutation($evento_id:ID!,$datos:JSON!){ createElement(evento_id:$evento_id, datos:$datos){ success } }|{"evento_id":"x","datos":{}}'
  'editElement|mutation($evento_id:ID!,$element_id:ID!,$datos:JSON!){ editElement(evento_id:$evento_id, element_id:$element_id, datos:$datos){ success } }|{"evento_id":"x","element_id":"x","datos":{}}'
  'deleteElement|mutation($evento_id:ID!,$element_id:ID!){ deleteElement(evento_id:$evento_id, element_id:$element_id){ success } }|{"evento_id":"x","element_id":"x"}'

  # Presupuesto
  'editPresupuesto|mutation($evento_id:ID!,$datos:JSON!){ editPresupuesto(evento_id:$evento_id, datos:$datos){ success } }|{"evento_id":"x","datos":{}}'
  'editCategoria|mutation($evento_id:ID!,$categoria_id:ID!,$datos:JSON!){ editCategoria(evento_id:$evento_id, categoria_id:$categoria_id, datos:$datos){ success } }|{"evento_id":"x","categoria_id":"x","datos":{}}'
  'deletepayment|mutation($evento_id:ID!,$gasto_id:ID!,$pago_id:ID!){ borraPago(evento_id:$evento_id,gasto_id:$gasto_id,pago_id:$pago_id){ success errors{ field message code } evento{ _id } } }|{"evento_id":"x","gasto_id":"x","pago_id":"x"}'

  # Menús
  'createMenu|mutation($evento_id:ID!,$datos:JSON!){ createMenu(evento_id:$evento_id, datos:$datos){ success } }|{"evento_id":"x","datos":{}}'
  'deleteMenu|mutation($evento_id:ID!,$menu_id:ID!){ deleteMenu(evento_id:$evento_id, menu_id:$menu_id){ success } }|{"evento_id":"x","menu_id":"x"}'

  # Compartir
  'createGroup|mutation($evento_id:ID!,$datos:JSON!){ createGroup(evento_id:$evento_id, datos:$datos){ success } }|{"evento_id":"x","datos":{}}'

  # Directorio / Stripe legacy
  'getAllProducts|query($grupo:String){ getAllProducts(grupo:$grupo){ total } }|{"grupo":"app"}'
  'getAllBusiness|query($development:String!){ getAllBusinesses(development:$development){ total } }|{"development":"bodasdehoy"}'

  # Stripe (los que el front llama)
  'createCheckoutSession|mutation($items:[JSON],$email:String,$cancel_url:String,$success_url:String,$mode:String){ createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, success_url:$success_url, mode:$mode) }|{"items":[],"email":"x@x","cancel_url":"http://x","success_url":"http://x","mode":"payment"}'
  'createSubscripcion|mutation($plan_id:String!,$billing_period:String){ subscribeToPlan(plan_id:$plan_id, billing_period:$billing_period){ success } }|{"plan_id":"x","billing_period":"monthly"}'
  'getCustomer|query{ getCustomer{ name email } }|{}'
  'updateCustomer|mutation($args:inputCustomer){ updateCustomer(args:$args) }|{"args":{}}'
  'getInvoices|query{ getInvoices{ total } }|{}'
  'getCheckoutItems|query{ getCheckoutItems{ id } }|{}'
  'setCheckoutItems|mutation($items:[JSON]){ setCheckoutItems(items:$items){ id } }|{"items":[]}'
  'getEventTicket|query{ getEventTicket{ total } }|{}'

  # Upload
  'singleUpload|mutation($file:Upload!,$development:String!,$eventId:ID!,$category:String){ singleUpload(file:$file, development:$development, eventId:$eventId, category:$category){ success } }|{"file":null,"development":"bodasdehoy","eventId":"x","category":"x"}'
)

PASS=0
FAIL=0
declare -a FAILS=()

echo ""
echo "🧪 Auditoría queries Fetching.ts contra $API_MCP"
echo ""

for entry in "${OPS[@]}"; do
  op="${entry%%|*}"
  rest="${entry#*|}"
  query="${rest%%|*}"
  vars="${rest#*|}"

  body=$(printf '{"query":%s,"variables":%s}' \
    "$(printf '%s' "$query" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
    "$vars")

  resp=$(curl -sS --max-time 15 -X POST "$API_MCP" \
    -H "X-Development: $DEV" \
    -H "Content-Type: application/json" \
    -d "$body" 2>&1)

  fail_reason=""
  if echo "$resp" | grep -q "Cannot query field"; then
    fail_reason="op/campo no existe en schema"
  elif echo "$resp" | grep -q "Unknown argument"; then
    arg=$(echo "$resp" | sed -nE 's/.*Unknown argument "([^"]+)".*/\1/p' | head -1)
    fail_reason="argumento no soportado: $arg"
  elif echo "$resp" | grep -q "must not have a selection"; then
    fail_reason="tipo escalar con subselection inválida"
  elif echo "$resp" | grep -q "must have a selection"; then
    fail_reason="falta subselection para tipo objeto"
  elif echo "$resp" | grep -q "Unknown type"; then
    tipo=$(echo "$resp" | sed -nE 's/.*Unknown type "([^"]+)".*/\1/p' | head -1)
    fail_reason="tipo desconocido: $tipo"
  elif echo "$resp" | grep -q "is required, but it was not provided"; then
    fail_reason="argumento requerido faltante"
  elif echo "$resp" | grep -q "MongoNotConnectedError"; then
    fail_reason="P0 MongoDB caída"
  elif echo "$resp" | grep -qE "Connection refused|Could not resolve"; then
    fail_reason="backend caído"
  elif echo "$resp" | grep -q "Field .* of required type"; then
    fail_reason="tipo requerido violado"
  fi

  short=$(printf '%s' "$resp" | head -c 130)
  if [ -n "$fail_reason" ]; then
    FAIL=$((FAIL+1))
    FAILS+=("$op|$fail_reason|$short")
    echo "❌ $op  →  $fail_reason"
  else
    PASS=$((PASS+1))
    echo "✅ $op"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  RESULTADO: $PASS PASS · $FAIL FAIL · ${#OPS[@]} total"
echo "═══════════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "💥 FAILS detallados:"
  for f in "${FAILS[@]}"; do
    op="${f%%|*}"
    rest="${f#*|}"
    reason="${rest%%|*}"
    short="${rest##*|}"
    echo ""
    echo "  ❌ $op"
    echo "     razón:  $reason"
    echo "     resp:   $short"
  done
  exit 1
fi
exit 0
