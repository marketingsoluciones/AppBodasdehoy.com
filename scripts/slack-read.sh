#!/usr/bin/env bash
#
# Lee mensajes de canales Slack del proyecto.
#
# Canales disponibles:
#   (default)       → #bodasdehoy-backend-coordinacion (C0AV8EV5495)
#   --from frontend → #app-bodas-alqtm (C04C34S2CJ3)
#   --from api-ia   → #copilot-api-ia (C0AEV0GCLM7)
#   --from mcp      → #api-ia-api2-sync (C0AE8K47VNF)
#
# Uso:
#   ./scripts/slack-read.sh              # últimos 10 de #coordinacion
#   ./scripts/slack-read.sh 20           # últimos 20
#   ./scripts/slack-read.sh --from api-ia      # leer #copilot-api-ia
#   ./scripts/slack-read.sh --from mcp 5       # 5 mensajes de #api-ia-api2-sync
#
# Requiere: SLACK_BOT_TOKEN en .env.slack.local

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$ROOT_DIR/.env.slack.local" ]; then
  set -a && source "$ROOT_DIR/.env.slack.local" && set +a
elif [ -f "$ROOT_DIR/.env.local" ]; then
  set -a && source "$ROOT_DIR/.env.local" && set +a
elif [ -f "$ROOT_DIR/.env" ]; then
  set -a && source "$ROOT_DIR/.env" && set +a
fi

# Fallback: archivo compartido de credenciales (todos los equipos)
if [ -z "${SLACK_BOT_TOKEN:-}" ] && [ -f "$HOME/.slack-bodasdehoy.env" ]; then
  set -a && source "$HOME/.slack-bodasdehoy.env" && set +a
fi

# --- Canales ---
CHANNEL_COORDINACION="C0AV8EV5495"
CHANNEL_FRONTEND_TEAM="C04C34S2CJ3"
CHANNEL_API_IA="C0AEV0GCLM7"
CHANNEL_MCP_SYNC="C0AE8K47VNF"

SOURCE=""
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --from)
      SOURCE="${2:-}"
      shift 2
      ;;
    --from=*)
      SOURCE="${1#--from=}"
      shift
      ;;
    *)
      break
      ;;
  esac
done

LIMIT="${1:-${LIMIT:-10}}"
TOKEN="${SLACK_BOT_TOKEN:-${SLACK_OAUTH_TOKEN:-}}"

# Seleccionar canal
if [ "$SOURCE" = "frontend" ] || [ "$SOURCE" = "app-bodas-alqtm" ]; then
  CHANNEL_ID="$CHANNEL_FRONTEND_TEAM"
  CHANNEL_NAME="#app-bodas-alqtm"
elif [ "$SOURCE" = "api-ia" ]; then
  CHANNEL_ID="$CHANNEL_API_IA"
  CHANNEL_NAME="#copilot-api-ia"
elif [ "$SOURCE" = "mcp" ] || [ "$SOURCE" = "backend" ] || [ "$SOURCE" = "api2" ]; then
  CHANNEL_ID="$CHANNEL_MCP_SYNC"
  CHANNEL_NAME="#api-ia-api2-sync"
else
  CHANNEL_ID="$CHANNEL_COORDINACION"
  CHANNEL_NAME="#bodasdehoy-backend-coordinacion"
fi

if [ -z "$TOKEN" ]; then
  echo "Error: SLACK_BOT_TOKEN no está definido en .env.slack.local"
  echo "Añade: SLACK_BOT_TOKEN=xoxb-..."
  exit 1
fi

echo "Leyendo últimos $LIMIT mensajes de $CHANNEL_NAME ($CHANNEL_ID)..."
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
