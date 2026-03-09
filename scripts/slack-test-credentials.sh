#!/usr/bin/env bash
#
# Prueba todas las credenciales de Slack: lectura (tokens) y escritura (webhooks).
# Canal objetivo: #copilot-api-ia (C0AEV0GCLM7).
# Uso: ./scripts/slack-test-credentials.sh
#

set -euo pipefail

CHANNEL_ID="${SLACK_CHANNEL_FRONTEND:-C0AEV0GCLM7}"
MSG_TEST="[test creds] $(date +%H:%M) - verificación webhook"

echo "=============================================="
echo "Pruebas Slack – canal #copilot-api-ia ($CHANNEL_ID)"
echo "=============================================="
echo ""

# --- LECTURA (conversations.history) ---
echo "--- LECTURA (conversations.history) ---"

for TOKEN_NAME in SLACK_BOT_TOKEN SLACK_OAUTH_TOKEN; do
  TOKEN="${!TOKEN_NAME:-}"
  if [ -z "$TOKEN" ]; then
    echo "  $TOKEN_NAME: (no definido)"
    continue
  fi
  RESP=$(curl -sS --max-time 10 \
    -H "Authorization: Bearer $TOKEN" \
    "https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=1")
  OK=$(echo "$RESP" | jq -r '.ok // "false"')
  ERR=$(echo "$RESP" | jq -r '.error // ""')
  if [ "$OK" = "true" ]; then
    echo "  $TOKEN_NAME: OK (lee canal)"
  else
    echo "  $TOKEN_NAME: FALLO - $ERR"
  fi
done

echo ""
echo "--- ESCRITURA (Incoming Webhooks) ---"

# --- ESCRITURA (cada webhook) ---
for WH_NAME in SLACK_WEBHOOK_URL SLACK_WEBHOOK_LOBECHAT SLACK_WEBHOOK_FRONTEND SLACK_WEBHOOK_API2; do
  URL="${!WH_NAME:-}"
  if [ -z "$URL" ]; then
    echo "  $WH_NAME: (no definido)"
    continue
  fi
  BODY="{\"text\": \"$MSG_TEST - $WH_NAME\"}"
  HTTP=$(curl -sS -o /tmp/slack_wh_resp -w "%{http_code}" --max-time 10 -X POST "$URL" -H 'Content-Type: application/json' -d "$BODY")
  RESP_BODY=$(cat /tmp/slack_wh_resp 2>/dev/null || true)
  if [ "$HTTP" = "200" ] && [ -z "$RESP_BODY" ] || [ "$RESP_BODY" = "ok" ]; then
    echo "  $WH_NAME: OK (escribe en canal)"
  else
    echo "  $WH_NAME: FALLO - HTTP $HTTP body=$RESP_BODY"
  fi
done

echo ""
echo "=============================================="
echo "Resumen: usar para LEER el token que salió OK; para ESCRIBIR el webhook que salió OK."
echo "=============================================="
