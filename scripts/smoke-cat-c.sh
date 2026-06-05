#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# smoke-cat-c.sh — Verificar las 10 ops Cat C en producción api-mcp.
#
# USO:
#   TEST_EMAIL="bodasdehoy.com@gmail.com" TEST_PASSWORD="..." bash scripts/smoke-cat-c.sh
#
# CRITERIO ÉXITO: 10/10 ops responden sin "Cannot query field" ni
#                 "MongoNotConnectedError" (no requiere data válida,
#                 solo que el schema acepte la query).
#
# Devuelve exit code 0 si 10/10 verde, 1 si alguna falla.
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail

API_MCP="${API_MCP_URL:-https://api-mcp.eventosorganizador.com/graphql}"
DEV="${X_DEVELOPMENT:-bodasdehoy}"

# 1. Obtener JWT vía helper Firebase existente
if [ -z "${MCP_JWT:-}" ]; then
  echo "🔑 Obteniendo JWT Firebase..." >&2
  if [ -z "${TEST_EMAIL:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
    echo "❌ Falta TEST_EMAIL + TEST_PASSWORD (o pasar MCP_JWT directamente)" >&2
    exit 1
  fi
  MCP_JWT="$(bash apps/chat-ia/scripts/get-test-jwt.sh 2>/dev/null)"
  if [ -z "$MCP_JWT" ]; then
    echo "❌ get-test-jwt.sh no devolvió JWT" >&2
    exit 1
  fi
fi
echo "✅ JWT obtenido (${#MCP_JWT} chars)" >&2

# 2. Lista de queries — cada op con UNA query mínima que solo valide el schema
#    (NO ejecutamos mutations destructivas; solo intentamos la query y
#    verificamos que el error NO sea de validación de schema).

declare -a OPS=(
  "nuevoPago|mutation{ nuevoPago(evento_id:\"x\", gasto_id:\"x\", pago:{}){ success } }"
  "editPago|mutation{ editPago(evento_id:\"x\", gasto_id:\"x\", pago_id:\"x\", datos:{}){ success } }"
  "borraPago|mutation{ borraPago(evento_id:\"x\", gasto_id:\"x\", pago_id:\"x\"){ success } }"
  "deletepayment|mutation{ deletepayment(evento_id:\"x\", gasto_id:\"x\", pago_id:\"x\"){ success } }"
  "getAllBusinesses|query{ getAllBusinesses{ total } }"
  "getAllProducts|query{ getAllProducts{ total } }"
  "getPlanSpaceSelect|query{ getPlanSpaceSelect{ _id } }"
  "getPsTemplate|query{ getPsTemplate(id:\"x\"){ _id } }"
  "getItinerario|query{ getItinerario(eventId:\"x\"){ _id } }"
  "duplicateItinerario|mutation{ duplicateItinerario(eventoId:\"x\", itinerarioId:\"x\", datos:{}){ success } }"
)

PASS=0
FAIL=0
declare -a RESULTS=()

echo "" >&2
echo "🧪 Ejecutando 10 smoke tests contra ${API_MCP}" >&2
echo "" >&2

for entry in "${OPS[@]}"; do
  op="${entry%%|*}"
  query="${entry#*|}"

  resp="$(curl -sS --max-time 15 -X POST "$API_MCP" \
    -H "Authorization: Bearer $MCP_JWT" \
    -H "X-Development: $DEV" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$query\"}" 2>&1)"

  # CRITERIOS DE FALLO (en orden):
  #  1. "Cannot query field"            → op NO existe en schema (CRITICAL)
  #  2. "Unknown argument"               → argumento no soportado (CRITICAL)
  #  3. "MongoNotConnectedError"         → P0 abierto (CRITICAL)
  #  4. Connection refused / timeout      → backend caído (CRITICAL)
  #
  # NO son fallos del smoke:
  #  - "evento not found"                → schema OK, solo no hay data con id "x"
  #  - "BAD_USER_INPUT"                  → schema OK, valida input
  #  - "Unauthorized" / "Forbidden"      → schema OK, falta permiso

  fail_reason=""
  if echo "$resp" | grep -q "Cannot query field"; then
    fail_reason="op no existe en schema"
  elif echo "$resp" | grep -q "Unknown argument"; then
    fail_reason="argumento no soportado"
  elif echo "$resp" | grep -q "MongoNotConnectedError"; then
    fail_reason="P0 MongoDB caída"
  elif echo "$resp" | grep -q "Connection refused\|Could not resolve\|timeout"; then
    fail_reason="backend caído"
  fi

  if [ -n "$fail_reason" ]; then
    FAIL=$((FAIL+1))
    RESULTS+=("❌ $op  →  $fail_reason")
    echo "❌ $op  →  $fail_reason" >&2
    echo "    resp: $(echo "$resp" | head -c 200)" >&2
  else
    PASS=$((PASS+1))
    RESULTS+=("✅ $op  →  schema OK")
    echo "✅ $op" >&2
  fi
done

echo "" >&2
echo "═══════════════════════════════════════════════════════════════" >&2
echo "  RESULTADO: $PASS/10 schemas OK · $FAIL/10 fallan" >&2
echo "═══════════════════════════════════════════════════════════════" >&2

if [ "$FAIL" -gt 0 ]; then
  echo "" >&2
  echo "❌ FAIL — Cat C NO certificada. Revisar errores arriba." >&2
  echo "   NO apagar apiapp.bodasdehoy.com hasta que 10/10 verde." >&2
  exit 1
fi

echo "" >&2
echo "✅ PASS — Cat C certificada en api-mcp. Puede procederse al" >&2
echo "   apagado de apiapp.bodasdehoy.com tras E2E Playwright." >&2
exit 0
