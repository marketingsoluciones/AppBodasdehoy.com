#!/usr/bin/env bash
#
# Prueba todas las credenciales de Slack: lectura (tokens) y escritura (webhooks).
# Canal objetivo: #copilot-api-ia (C0AEV0GCLM7).
# Uso: ./scripts/slack-test-credentials.sh
#

set -euo pipefail

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Falta el comando requerido: $1"
    exit 1
  fi
}

require_cmd curl
require_cmd jq

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "${SLACK_BOT_TOKEN:-}" ] && [ -z "${SLACK_OAUTH_TOKEN:-}" ] && [ -z "${SLACK_WEBHOOK_URL:-}" ] && [ -z "${SLACK_WEBHOOK_LOBECHAT:-}" ] && [ -z "${SLACK_WEBHOOK_FRONTEND:-}" ] && [ -z "${SLACK_WEBHOOK_API2:-}" ]; then
  if [ -f "$ROOT_DIR/.env.slack.local" ]; then
    set -a
    source "$ROOT_DIR/.env.slack.local"
    set +a
  elif [ -f "$ROOT_DIR/.env.local" ]; then
    set -a
    source "$ROOT_DIR/.env.local"
    set +a
  elif [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env"
    set +a
  fi
fi

CHANNEL_ID="${SLACK_CHANNEL_OVERRIDE:-${SLACK_CHANNEL_FRONTEND:-C0AEV0GCLM7}}"
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
  TMP_RESP="$(mktemp -t slack_wh_resp.XXXXXX)"
  trap 'rm -f "$TMP_RESP"' EXIT
  HTTP=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" --max-time 10 -X POST "$URL" -H 'Content-Type: application/json' -d "$BODY")
  RESP_BODY=$(cat "$TMP_RESP" 2>/dev/null || true)
  rm -f "$TMP_RESP"
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
