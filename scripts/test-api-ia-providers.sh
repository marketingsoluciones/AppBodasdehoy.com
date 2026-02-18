#!/usr/bin/env bash
#
# Test de todos los proveedores de IA en api-ia.bodasdehoy.com
# Comprueba si cada provider (anthropic, groq, openai, auto) responde correctamente.
#
# Uso:
#   ./scripts/test-api-ia-providers.sh
#   BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" ./scripts/test-api-ia-providers.sh
#
# Salida: tabla con estado por proveedor (OK / FAIL / WARN) y detalle.
#

set -euo pipefail

BASE_URL="${BASE_URL:-https://api-ia.bodasdehoy.com}"
DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
MAX_TIME="${MAX_TIME:-30}"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Requiere curl. jq opcional (mejor salida).
if ! command -v curl &>/dev/null; then
  echo "Error: se necesita 'curl'. Instálalo y vuelve a ejecutar."
  exit 1
fi

if command -v jq &>/dev/null; then
  HAS_JQ=1
else
  HAS_JQ=0
fi

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Test de proveedores IA - api-ia${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo "Base URL:    $BASE_URL"
echo "Development: $DEVELOPMENT"
echo "Fecha:       $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# --- 1) Health ---
echo -e "${CYAN}[1/3] Verificando salud del servicio...${NC}"
HEALTH=$(curl -sS --max-time "$MAX_TIME" "$BASE_URL/health" || true)
if [ $HAS_JQ -eq 1 ]; then
  STATUS=$(echo "$HEALTH" | jq -r '.status // "unknown"')
else
  STATUS=$(echo "$HEALTH" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
fi
if [ "$STATUS" = "healthy" ] || [ -n "$(echo "$HEALTH" | grep -i healthy)" ]; then
  echo -e "  ${GREEN}OK${NC} Servicio operativo"
else
  echo -e "  ${RED}FAIL${NC} Servicio no responde healthy: $HEALTH"
  echo "  No se pueden probar los proveedores. Abortando."
  exit 1
fi
echo ""

# --- 2) Providers configurados ---
echo -e "${CYAN}[2/3] Obteniendo proveedores configurados...${NC}"
PROVIDERS_JSON=$(curl -sS --max-time "$MAX_TIME" -H "X-Development: $DEVELOPMENT" "$BASE_URL/api/providers/$DEVELOPMENT" || true)
if [ $HAS_JQ -eq 1 ]; then
  echo "$PROVIDERS_JSON" | jq '.' 2>/dev/null || echo "$PROVIDERS_JSON"
else
  echo "$PROVIDERS_JSON"
fi
echo ""

# --- 3) Probar cada proveedor de chat ---
echo -e "${CYAN}[3/3] Probando endpoints de chat por proveedor...${NC}"
echo ""

# Modelos por defecto si api-ia no devuelve o no usamos jq
DEFAULT_ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
DEFAULT_GROQ_MODEL="llama-3.3-70b-versatile"
DEFAULT_OPENAI_MODEL="gpt-4o-mini"

if [ $HAS_JQ -eq 1 ]; then
  ANTHROPIC_MODEL=$(echo "$PROVIDERS_JSON" | jq -r '.providers[]? | select(.provider=="anthropic") | .model // empty' | head -1)
  GROQ_MODEL=$(echo "$PROVIDERS_JSON" | jq -r '.providers[]? | select(.provider=="groq") | .model // empty' | head -1)
  OPENAI_MODEL=$(echo "$PROVIDERS_JSON" | jq -r '.providers[]? | select(.provider=="openai") | .model // empty' | head -1)
fi
ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-$DEFAULT_ANTHROPIC_MODEL}"
GROQ_MODEL="${GROQ_MODEL:-$DEFAULT_GROQ_MODEL}"
OPENAI_MODEL="${OPENAI_MODEL:-$DEFAULT_OPENAI_MODEL}"

run_chat_test() {
  local provider="$1"
  local model="$2"
  local body
  if [ -n "$model" ]; then
    body="{\"messages\":[{\"role\":\"user\",\"content\":\"Responde solo: OK\"}],\"model\":\"$model\",\"stream\":false}"
  else
    body="{\"messages\":[{\"role\":\"user\",\"content\":\"Responde solo: OK\"}],\"stream\":false}"
  fi

  local tmpfile
  tmpfile=$(mktemp)
  local http_code
  http_code=$(curl -sS -w "%{http_code}" -o "$tmpfile" --max-time "$MAX_TIME" \
    -X POST "$BASE_URL/webapi/chat/$provider" \
    -H "Content-Type: application/json" \
    -H "X-Development: $DEVELOPMENT" \
    --data "$body")
  local response
  response=$(cat "$tmpfile")
  rm -f "$tmpfile"

  local status="FAIL"
  local detail=""

  if [ "$http_code" = "200" ]; then
    if [ $HAS_JQ -eq 1 ]; then
      local success
      success=$(echo "$response" | jq -r '.success // false')
      local msg
      msg=$(echo "$response" | jq -r '.message // .content // ""' 2>/dev/null | head -c 200)
      local err_code
      err_code=$(echo "$response" | jq -r '.error_code // ""' 2>/dev/null)
      local trace_id
      trace_id=$(echo "$response" | jq -r '.trace_id // ""' 2>/dev/null)

      if [ "$success" = "true" ] && [ -n "$msg" ] && [ "$msg" != "null" ]; then
        status="OK"
        detail="Respuesta recibida"
      elif [ -n "$err_code" ] && [ "$err_code" != "null" ]; then
        status="FAIL"
        detail="$err_code"
        [ -n "$trace_id" ] && [ "$trace_id" != "null" ] && detail="$detail (trace: $trace_id)"
      elif [ "$success" = "true" ] && ([ -z "$msg" ] || [ "$msg" = "null" ]); then
        status="FAIL"
        detail="success=true pero mensaje vacío"
      else
        detail="${err_code:-$http_code} $msg"
      fi
    else
      if echo "$response" | grep -q '"success"[[:space:]]*:[[:space:]]*true' && \
         echo "$response" | grep -qE '"message"[[:space:]]*:[[:space:]]*"[^"]+' ; then
        status="OK"
        detail="Respuesta recibida"
      elif echo "$response" | grep -q '"error_code"'; then
        status="FAIL"
        detail=$(echo "$response" | grep -oE '"error_code"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
      else
        detail="200 sin contenido válido"
      fi
    fi
  else
    if [ $HAS_JQ -eq 1 ]; then
      local err_code
      err_code=$(echo "$response" | jq -r '.error_code // ""' 2>/dev/null)
      local trace_id
      trace_id=$(echo "$response" | jq -r '.trace_id // ""' 2>/dev/null)
      detail="HTTP $http_code"
      [ -n "$err_code" ] && [ "$err_code" != "null" ] && detail="$detail - $err_code"
      [ -n "$trace_id" ] && [ "$trace_id" != "null" ] && detail="$detail (trace: $trace_id)"
    else
      detail="HTTP $http_code"
    fi
    if [ "$http_code" = "429" ]; then
      status="WARN"
      detail="Rate limit / sin saldo (429)"
    fi
  fi

  printf "%s\t%s\n" "$status" "$detail"
}

# Tabla de resultados
declare -a RESULTS
declare -a DETAILS

# Anthropic
echo -n "  Probando anthropic ($ANTHROPIC_MODEL)... "
result=$(run_chat_test "anthropic" "$ANTHROPIC_MODEL")
status="${result%%$'\t'*}"
detail="${result#*$'\t'}"
RESULTS+=( "$status" )
detail_flat="${detail//$'\n'/ }"
DETAILS+=( "$detail_flat" )
[ "$status" = "OK" ] && echo -e "${GREEN}$status${NC}" || { [ "$status" = "WARN" ] && echo -e "${YELLOW}$status${NC}" || echo -e "${RED}$status${NC}"; }
echo "    $detail_flat"

# Groq
echo -n "  Probando groq ($GROQ_MODEL)... "
result=$(run_chat_test "groq" "$GROQ_MODEL")
status="${result%%$'\t'*}"
detail="${result#*$'\t'}"
RESULTS+=( "$status" )
detail_flat="${detail//$'\n'/ }"
DETAILS+=( "$detail_flat" )
[ "$status" = "OK" ] && echo -e "${GREEN}$status${NC}" || { [ "$status" = "WARN" ] && echo -e "${YELLOW}$status${NC}" || echo -e "${RED}$status${NC}"; }
echo "    $detail_flat"

# OpenAI
echo -n "  Probando openai ($OPENAI_MODEL)... "
result=$(run_chat_test "openai" "$OPENAI_MODEL")
status="${result%%$'\t'*}"
detail="${result#*$'\t'}"
RESULTS+=( "$status" )
detail_flat="${detail//$'\n'/ }"
DETAILS+=( "$detail_flat" )
[ "$status" = "OK" ] && echo -e "${GREEN}$status${NC}" || { [ "$status" = "WARN" ] && echo -e "${YELLOW}$status${NC}" || echo -e "${RED}$status${NC}"; }
echo "    $detail_flat"

# Auto (sin model fijo)
echo -n "  Probando auto (routing)... "
result=$(run_chat_test "auto" "")
status="${result%%$'\t'*}"
detail="${result#*$'\t'}"
RESULTS+=( "$status" )
detail_flat="${detail//$'\n'/ }"
DETAILS+=( "$detail_flat" )
[ "$status" = "OK" ] && echo -e "${GREEN}$status${NC}" || { [ "$status" = "WARN" ] && echo -e "${YELLOW}$status${NC}" || echo -e "${RED}$status${NC}"; }
echo "    $detail_flat"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  RESUMEN - Proveedores de IA${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
printf "  %-12s | %-6s | %s\n" "Proveedor" "Estado" "Detalle"
echo "  -------------+--------+----------------------------------------"
printf "  %-12s | " "anthropic"
[ "${RESULTS[0]}" = "OK" ] && echo -ne "${GREEN}OK${NC}    | " || { [ "${RESULTS[0]}" = "WARN" ] && echo -ne "${YELLOW}WARN${NC}  | " || echo -ne "${RED}FAIL${NC}   | "; }
echo "${DETAILS[0]}"
printf "  %-12s | " "groq"
[ "${RESULTS[1]}" = "OK" ] && echo -ne "${GREEN}OK${NC}    | " || { [ "${RESULTS[1]}" = "WARN" ] && echo -ne "${YELLOW}WARN${NC}  | " || echo -ne "${RED}FAIL${NC}   | "; }
echo "${DETAILS[1]}"
printf "  %-12s | " "openai"
[ "${RESULTS[2]}" = "OK" ] && echo -ne "${GREEN}OK${NC}    | " || { [ "${RESULTS[2]}" = "WARN" ] && echo -ne "${YELLOW}WARN${NC}  | " || echo -ne "${RED}FAIL${NC}   | "; }
echo "${DETAILS[2]}"
printf "  %-12s | " "auto"
[ "${RESULTS[3]}" = "OK" ] && echo -ne "${GREEN}OK${NC}    | " || { [ "${RESULTS[3]}" = "WARN" ] && echo -ne "${YELLOW}WARN${NC}  | " || echo -ne "${RED}FAIL${NC}   | "; }
echo "${DETAILS[3]}"
echo ""

OK_COUNT=0
for r in "${RESULTS[@]}"; do [ "$r" = "OK" ] && OK_COUNT=$((OK_COUNT+1)); done
if [ "$OK_COUNT" -eq 4 ]; then
  echo -e "${GREEN}Todos los proveedores responden correctamente.${NC}"
  exit 0
elif [ "$OK_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}$OK_COUNT de 4 proveedores OK. Revisa los que fallan (credenciales, modelos, saldo).${NC}"
  exit 0
else
  echo -e "${RED}Ningún proveedor respondió correctamente. Revisa credenciales y configuración en api-ia.${NC}"
  exit 1
fi
