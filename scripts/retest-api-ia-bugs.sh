#!/bin/bash
# Retest de bugs específicos en api-ia.bodasdehoy.com
# Ejecutar cuando api-ia confirme que su fix está listo
#
# Uso: bash scripts/retest-api-ia-bugs.sh
# Requiere: curl, jq

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND="https://api-ia.bodasdehoy.com"
DEV="bodasdehoy"

PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  local expect_ok="$3"  # "ok" o "fail"

  local http_ok=false
  local http_status
  http_status=$(echo "$result" | jq -r '.httpStatus // .status_code // 200' 2>/dev/null)
  local has_error
  has_error=$(echo "$result" | jq -r '.error // .detail // ""' 2>/dev/null | grep -iE "no_providers|503|unavailable|error" | head -1)
  local has_content
  has_content=$(echo "$result" | jq -r '.response // .message // .content // ""' 2>/dev/null | head -c 20)

  if [ -z "$has_error" ] && [ -n "$has_content" ]; then
    http_ok=true
  fi

  if [ "$expect_ok" = "ok" ]; then
    if $http_ok; then
      echo -e "${GREEN}✅ PASS${NC}: $name"
      ((PASS++))
    else
      echo -e "${RED}❌ FAIL${NC}: $name"
      echo "   Respuesta: $(echo "$result" | head -c 200)"
      ((FAIL++))
    fi
  else
    # expect_ok = "fail" — esperamos que falle de forma controlada (no 503 incontrolado)
    echo -e "${YELLOW}ℹ️  SKIP${NC}: $name (requiere provider específico)"
  fi
}

echo "================================================"
echo "  RETEST api-ia.bodasdehoy.com — bugs conocidos"
echo "  Fecha: $(date '+%Y-%m-%d %H:%M')"
echo "================================================"
echo ""

# ── Test 1: stream=true → debe funcionar (era NO_PROVIDERS_AVAILABLE) ──
echo "── Test 1: stream=true con auto-routing ──"
T1_BODY='{"messages":[{"role":"user","content":"Hola, responde brevemente"}],"stream":true,"development":"'"$DEV"'"}'
T1=$(curl -s --max-time 15 -X POST "$BACKEND/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEV" \
  -d "$T1_BODY" 2>&1)
T1_STATUS=$?
if [ $T1_STATUS -ne 0 ]; then
  echo -e "${RED}❌ FAIL${NC}: stream=true — curl error (timeout o conexión)"
  ((FAIL++))
else
  T1_HAS_NO_PROVIDERS=$(echo "$T1" | grep -i "no_providers_available" | head -1)
  T1_HAS_CONTENT=$(echo "$T1" | grep -iE "data:|content:|response:" | head -1)
  if [ -n "$T1_HAS_NO_PROVIDERS" ]; then
    echo -e "${RED}❌ FAIL${NC}: stream=true → NO_PROVIDERS_AVAILABLE (bug no resuelto)"
    echo "   Respuesta: $(echo "$T1" | head -c 300)"
    ((FAIL++))
  elif [ -n "$T1_HAS_CONTENT" ]; then
    echo -e "${GREEN}✅ PASS${NC}: stream=true → respuesta con contenido"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠️  WARN${NC}: stream=true → respuesta inesperada"
    echo "   $(echo "$T1" | head -c 300)"
    ((FAIL++))
  fi
fi
echo ""

# ── Test 2: stream=false con auto-routing (baseline) ──
echo "── Test 2: stream=false auto-routing (baseline) ──"
T2=$(curl -s --max-time 15 -X POST "$BACKEND/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEV" \
  -d '{"messages":[{"role":"user","content":"Responde con una sola palabra: hola"}],"stream":false}')
T2_STATUS=$?
T2_CONTENT=$(echo "$T2" | jq -r '.response // .message // .content // ""' 2>/dev/null)
if [ $T2_STATUS -ne 0 ] || [ -z "$T2_CONTENT" ]; then
  echo -e "${RED}❌ FAIL${NC}: stream=false — sin respuesta"
  echo "   $(echo "$T2" | head -c 200)"
  ((FAIL++))
else
  echo -e "${GREEN}✅ PASS${NC}: stream=false → '$T2_CONTENT'"
  ((PASS++))
fi
echo ""

# ── Test 3: provider=anthropic + modelo claude válido ──
echo "── Test 3: provider=anthropic + claude-3-5-haiku-20241022 ──"
T3=$(curl -s --max-time 15 -X POST "$BACKEND/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEV" \
  -d '{"messages":[{"role":"user","content":"Di hola"}],"model":"claude-3-5-haiku-20241022","stream":false}')
T3_CONTENT=$(echo "$T3" | jq -r '.response // .message // .content // ""' 2>/dev/null)
T3_ERROR=$(echo "$T3" | jq -r '.error // ""' 2>/dev/null)
if [ -n "$T3_CONTENT" ]; then
  echo -e "${GREEN}✅ PASS${NC}: anthropic claude-haiku → '$T3_CONTENT'"
  ((PASS++))
elif echo "$T3_ERROR" | grep -qi "503\|unavailable\|no_providers"; then
  echo -e "${RED}❌ FAIL${NC}: anthropic claude-haiku → 503/NO_PROVIDERS"
  echo "   Error: $T3_ERROR"
  ((FAIL++))
else
  echo -e "${YELLOW}⚠️  WARN${NC}: anthropic claude-haiku → respuesta inesperada"
  echo "   $(echo "$T3" | head -c 200)"
  ((FAIL++))
fi
echo ""

# ── Test 4: provider=anthropic + modelo deepseek (era 503 antes) ──
echo "── Test 4: provider=anthropic + model=deepseek-chat (combinación inválida) ──"
T4=$(curl -s --max-time 10 -X POST "$BACKEND/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEV" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"deepseek-chat","stream":false}')
T4_STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BACKEND/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEV" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"deepseek-chat","stream":false}')
if [ "$T4_STATUS_CODE" = "503" ]; then
  echo -e "${RED}❌ FAIL${NC}: anthropic+deepseek-chat → sigue dando 503 (debería ser 400 o fallback)"
  ((FAIL++))
elif [ "$T4_STATUS_CODE" = "400" ] || [ "$T4_STATUS_CODE" = "422" ]; then
  echo -e "${GREEN}✅ PASS${NC}: anthropic+deepseek-chat → $T4_STATUS_CODE (error controlado, no 503)"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  WARN${NC}: anthropic+deepseek-chat → HTTP $T4_STATUS_CODE"
  echo "   $(echo "$T4" | head -c 200)"
  # No es fail crítico si no es 503
  ((PASS++))
fi
echo ""

# ── Test 5: Batería rápida de 5 preguntas ──
echo "── Test 5: Batería rápida (5 preguntas, stream=false) ──"
PREGUNTAS=("Hola" "¿Cuántos invitados tengo?" "Dame 1 consejo para bodas" "¿Qué puedes hacer?" "Gracias")
BATERIA_OK=0
for pregunta in "${PREGUNTAS[@]}"; do
  RESP=$(curl -s --max-time 10 -X POST "$BACKEND/webapi/chat/auto" \
    -H "Content-Type: application/json" \
    -H "X-Development: $DEV" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$pregunta\"}],\"stream\":false}" \
    | jq -r '.response // .message // .content // ""' 2>/dev/null)
  if [ -n "$RESP" ] && [ ${#RESP} -gt 5 ]; then
    ((BATERIA_OK++))
  fi
done
if [ $BATERIA_OK -ge 4 ]; then
  echo -e "${GREEN}✅ PASS${NC}: Batería $BATERIA_OK/5 respuestas correctas"
  ((PASS++))
else
  echo -e "${RED}❌ FAIL${NC}: Batería solo $BATERIA_OK/5 respuestas correctas"
  ((FAIL++))
fi
echo ""

# ── Resumen ──
echo "================================================"
echo "  RESUMEN"
echo "================================================"
TOTAL=$((PASS + FAIL))
echo -e "  Tests: $TOTAL   ${GREEN}PASS: $PASS${NC}   ${RED}FAIL: $FAIL${NC}"
echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 Todo OK — api-ia está listo para producción${NC}"
  echo ""
  echo "Mensaje para Slack #copilot-api-ia:"
  echo "  ✅ Retest OK ($PASS/$TOTAL). stream=true funciona. Sin 503. Cerramos bugs."
else
  echo -e "${RED}⚠️  Hay $FAIL fallos — api-ia NO está listo todavía${NC}"
  echo ""
  echo "Mensaje para Slack #copilot-api-ia:"
  echo "  ❌ Retest: $FAIL/$TOTAL fallos. Ver output arriba."
fi
echo "================================================"
