#!/usr/bin/env bash
#
# Lee los últimos mensajes del canal #copilot-api-ia (Slack).
# Requiere: SLACK_BOT_OAUTH_TOKEN y opcionalmente SLACK_CHANNEL_COPILOT_API_IA en .env
# El Bot Token debe tener scope channels:history (y el bot añadido al canal).
#
# Uso:
#   ./scripts/slack-read.sh          # últimos 10 mensajes
#   ./scripts/slack-read.sh 20       # últimos 20 mensajes
#   LIMIT=5 ./scripts/slack-read.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

LIMIT="${1:-${LIMIT:-10}}"
CHANNEL_ID="${SLACK_CHANNEL_FRONTEND:-${SLACK_CHANNEL_COPILOT_API_IA:-${SLACK_CHANNEL_ID:-C0AEV0GCLM7}}}"
# Token actual para leer: SLACK_BOT_TOKEN (api-ia). SLACK_BOT_OAUTH_TOKEN (Copilot) está deprecado si da account_inactive.
TOKEN="${SLACK_BOT_TOKEN:-${SLACK_BOT_OAUTH_TOKEN:-}}"

if [ -z "$TOKEN" ]; then
  echo "Error: SLACK_BOT_TOKEN o SLACK_BOT_OAUTH_TOKEN no está definido."
  echo "Añade en $ENV_FILE:"
  echo "  SLACK_BOT_TOKEN=xoxb-..."
  echo "  SLACK_CHANNEL_ID=C0AEV0GCLM7"
  exit 1
fi

echo "Leyendo últimos $LIMIT mensajes del canal #copilot-api-ia ($CHANNEL_ID)..."
echo ""

RESPONSE=$(curl -sS --max-time 15 \
  -H "Authorization: Bearer $TOKEN" \
  "https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=${LIMIT}")

if command -v jq &>/dev/null; then
  OK=$(echo "$RESPONSE" | jq -r '.ok')
  if [ "$OK" != "true" ]; then
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "unknown"')
    echo "Error de Slack API: $ERROR"
    echo "$RESPONSE" | jq '.'
    exit 1
  fi
  echo "$RESPONSE" | jq -r '.messages[] | "\(.ts) | \(.user // .bot_id // "?") | \(.text)"'
else
  echo "$RESPONSE"
fi
