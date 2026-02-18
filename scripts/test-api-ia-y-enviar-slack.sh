#!/usr/bin/env bash
# Ejecuta pruebas reales contra api-ia.bodasdehoy.com y envía el resumen por Slack
# para que el equipo api-ia pueda ver si el fallo depende de ellos o de nuestro lado.
#
# Uso:
#   bash scripts/test-api-ia-y-enviar-slack.sh
#   BASE_URL="https://api-ia.bodasdehoy.com" bash scripts/test-api-ia-y-enviar-slack.sh
#
# Requiere: .env con SLACK_WEBHOOK_FRONTEND o SLACK_WEBHOOK (opcional, hay default en slack-send.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

BASE_URL="${BASE_URL:-https://api-ia.bodasdehoy.com}"
DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
# Opcional: si api-ia necesita X-Support-Key para resolver whitelabel desde API2
SUPPORT_KEY="${SUPPORT_KEY:-}"
MAX_TIME="${MAX_TIME:-25}"
REQ_ID="test_$(date +%Y%m%d_%H%M%S)"

# Usuario real: FIREBASE_JWT o obtenerlo con TEST_USER_EMAIL + TEST_USER_PASSWORD (el front puede facilitarlos)
if [ -z "${FIREBASE_JWT:-}" ] && [ -n "${TEST_USER_EMAIL:-}" ] && [ -n "${TEST_USER_PASSWORD:-}" ]; then
  echo "🔑 Obteniendo token de Firebase para usuario ${TEST_USER_EMAIL}..."
  FIREBASE_JWT=$("$SCRIPT_DIR/get-firebase-token.sh" 2>/dev/null) || FIREBASE_JWT=""
fi
AUTH_HEADER=""
CHAT_MODE="sin usuario (solo X-Development)"
if [ -n "${FIREBASE_JWT:-}" ]; then
  AUTH_HEADER="Authorization: Bearer ${FIREBASE_JWT}"
  CHAT_MODE="con usuario (Authorization: Bearer <token>)"
fi

# Resultados en variables
HEALTH_STATUS=""
HEALTH_SUMMARY=""
CHAT_STATUS=""
CHAT_SUMMARY=""

echo "🧪 Ejecutando pruebas reales contra api-ia..."
echo "   BASE_URL=$BASE_URL"
echo "   Chat: $CHAT_MODE"
echo ""

# 1) Health
echo "1/3 GET /health"
HEALTH_RESP=$(curl -sS -w "\n%{http_code}" --max-time "$MAX_TIME" "${BASE_URL}/health" 2>/dev/null || true)
HEALTH_BODY=$(echo "$HEALTH_RESP" | sed '$d')
HEALTH_STATUS=$(echo "$HEALTH_RESP" | tail -n 1)
if [ "$HEALTH_STATUS" = "200" ]; then
  HEALTH_SUMMARY="OK"
  if echo "$HEALTH_BODY" | grep -q '"status"'; then
    HEALTH_SUMMARY="OK ($(echo "$HEALTH_BODY" | grep -o '"status"[^,}]*' | head -1))"
  fi
else
  HEALTH_SUMMARY="body: ${HEALTH_BODY:0:120}"
fi
echo "   → HTTP $HEALTH_STATUS - $HEALTH_SUMMARY"
echo ""

# 2) POST /webapi/chat/auto (stream: false); con usuario si FIREBASE_JWT o TEST_USER_* están definidos
echo "2/3 POST /webapi/chat/auto (mensaje real) $CHAT_MODE"
CHAT_TMP=$(mktemp)
CHAT_BODY='{"messages":[{"role":"user","content":"Di hola en una palabra."}],"stream":false}'
CURL_CHAT_HEADERS=(-H "Content-Type: application/json" -H "X-Development: ${DEVELOPMENT}" -H "X-Request-Id: ${REQ_ID}")
[ -n "${FIREBASE_JWT:-}" ] && CURL_CHAT_HEADERS+=(-H "Authorization: Bearer ${FIREBASE_JWT}")
HTTP_CHAT=$(curl -sS -w "%{http_code}" -o "$CHAT_TMP" --max-time "$MAX_TIME" \
  -X POST "${BASE_URL}/webapi/chat/auto" \
  "${CURL_CHAT_HEADERS[@]}" \
  -d "$CHAT_BODY" 2>/dev/null || echo "000")
CHAT_STATUS="$HTTP_CHAT"
CHAT_RESP=$(cat "$CHAT_TMP" 2>/dev/null || true)
rm -f "$CHAT_TMP"

if [ "$CHAT_STATUS" = "200" ]; then
  if echo "$CHAT_RESP" | grep -q '"choices"'; then
    CONTENT=$(echo "$CHAT_RESP" | grep -o '"content":"[^"]*"' | head -1 | cut -c12- | tr -d '"' | head -c 80)
    CHAT_SUMMARY="OK - respuesta recibida${CONTENT:+: \"$CONTENT\"}"
  elif echo "$CHAT_RESP" | grep -q '"message"'; then
    MSG=$(echo "$CHAT_RESP" | grep -o '"message":"[^"]*"' | head -1 | cut -c12- | tr -d '"' | head -c 80)
    CHAT_SUMMARY="OK - message: ${MSG:-vacío}"
  else
    CHAT_SUMMARY="OK - cuerpo: ${CHAT_RESP:0:80}"
  fi
else
  ERR=$(echo "$CHAT_RESP" | grep -o '"message":"[^"]*"\|"error":"[^"]*"\|"detail":"[^"]*"' | head -1 | cut -d'"' -f4 | head -c 100)
  CHAT_SUMMARY="${ERR:-${CHAT_RESP:0:100}}"
fi
echo "   → HTTP $CHAT_STATUS - $CHAT_SUMMARY"
echo ""

# 3) GET /api/config/bodasdehoy (usado por Copilot embed)
echo "3/3 GET /api/config/bodasdehoy"
CONFIG_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" --max-time "$MAX_TIME" "${BASE_URL}/api/config/bodasdehoy" 2>/dev/null || echo "000")
echo "   → HTTP $CONFIG_STATUS"
echo ""

# Construir mensaje para Slack (resumen corto para que quepa y sea legible)
SLACK_MSG="*Pruebas reales api-ia (Frontend)* – $(date -u +"%Y-%m-%d %H:%M UTC")
Base: \`${BASE_URL}\` | RequestId: \`${REQ_ID}\` | Chat: ${CHAT_MODE}

1️⃣ GET /health → HTTP \`${HEALTH_STATUS}\` ${HEALTH_SUMMARY}
2️⃣ POST /webapi/chat/auto → HTTP \`${CHAT_STATUS}\` ${CHAT_SUMMARY}
3️⃣ GET /api/config/bodasdehoy → HTTP \`${CONFIG_STATUS}\`

_Si los fallos son 502/503/timeout, el problema está en api-ia. Si todo es 200 y el Copilot sigue sin responder, el problema puede ser nuestro proxy o CORS._ Con usuario: \`TEST_USER_EMAIL=... TEST_USER_PASSWORD=... bash scripts/test-api-ia-y-enviar-slack.sh\`"

# Enviar por Slack
echo "📤 Enviando resumen a Slack (#copilot-api-ia)..."
if [ -x "$SCRIPT_DIR/slack-send.sh" ]; then
  "$SCRIPT_DIR/slack-send.sh" "$SLACK_MSG"
else
  # Fallback: llamar a slack-notify con tipo "info" y el resumen
  "$SCRIPT_DIR/slack-notify.sh" "info" "Pruebas api-ia ejecutadas" "$SLACK_MSG"
fi

echo ""
echo "✅ Hecho. Revisa #copilot-api-ia para que api-ia analice los resultados."
