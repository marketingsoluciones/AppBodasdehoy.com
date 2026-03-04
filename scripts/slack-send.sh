#!/bin/bash

# Enviar mensajes a api-ia vía Slack. Canal: #copilot-api-ia.
# Usa chat.postMessage (bot token) como el otro equipo; si no hay token, usa webhook.
# Uso:
#   ./slack-send.sh "Mensaje"
#   ./slack-send.sh --copilot "Mensaje"
#   ./slack-send.sh --web "Mensaje"
# Requiere: .env con SLACK_BOT_TOKEN (recomendado) o SLACK_WEBHOOK_FRONTEND / SLACK_WEBHOOK_LOBECHAT.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

CHANNEL_ID="${SLACK_CHANNEL_FRONTEND:-C0AEV0GCLM7}"
BOT_TOKEN="${SLACK_BOT_TOKEN:-}"
WEBHOOK_URL="${SLACK_WEBHOOK_FRONTEND:-${SLACK_WEBHOOK_LOBECHAT:-${SLACK_WEBHOOK_URL:-}}}"

# Identidad por equipo/repo (--copilot | --web) o por .env
REPO=""
if [ "$1" = "--copilot" ]; then
  REPO="copilot"
  shift
elif [ "$1" = "--web" ]; then
  REPO="web"
  shift
elif [ -n "${SLACK_REPO:-}" ]; then
  REPO="$SLACK_REPO"
fi

if [ "$REPO" = "copilot" ]; then
  SLACK_SENDER="Front Copilot LobeChat"
  SLACK_DE="De: Front Copilot LobeChat"
  REPO_LINE="Repo: apps/chat-ia"
elif [ "$REPO" = "web" ]; then
  SLACK_SENDER="Front App Bodasdehoy"
  SLACK_DE="De: Front App Bodasdehoy"
  REPO_LINE="Repo: apps/appEventos"
else
  SLACK_SENDER="${SLACK_SENDER_NAME:-Frontend Bodasdehoy · Copilot LobeChat}"
  SLACK_DE="De: Frontend / Copilot LobeChat"
  REPO_LINE=""
fi

SLACK_PARA="${SLACK_MSG_PARA:-Para: Equipo api-ia (#copilot-api-ia)}"
PREFIX="${SLACK_DE}\n${SLACK_PARA}\n\n"
[ -n "$REPO_LINE" ] && PREFIX="${PREFIX}${REPO_LINE}\n\n"

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar un mensaje"
  echo "Uso: $0 [--copilot|--web] \"Tu mensaje aquí\""
  exit 1
fi

MESSAGE="${PREFIX}$1"

# Escapar comillas y backslash para JSON
escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
MESSAGE_ESC=$(escape_json "$MESSAGE")
SENDER_ESC=$(escape_json "$SLACK_SENDER")

if [ -n "$BOT_TOKEN" ]; then
  # Enviar con API chat.postMessage (mismo método que el otro equipo)
  RESP=$(curl -sS --max-time 15 -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\": \"$CHANNEL_ID\", \"text\": \"$MESSAGE_ESC\", \"username\": \"$SENDER_ESC\"}")
  if command -v jq &>/dev/null; then
    OK=$(echo "$RESP" | jq -r '.ok // false')
    if [ "$OK" = "true" ]; then
      echo ""
      echo "✅ Mensaje enviado a #copilot-api-ia (chat.postMessage)"
      exit 0
    fi
    ERR=$(echo "$RESP" | jq -r '.error // "unknown"')
    echo "❌ Slack API error: $ERR" >&2
    echo "$RESP" | jq '.' >&2
    exit 1
  else
    if echo "$RESP" | grep -q '"ok":true'; then
      echo ""
      echo "✅ Mensaje enviado a #copilot-api-ia (chat.postMessage)"
      exit 0
    fi
    echo "❌ Slack API error: $RESP" >&2
    exit 1
  fi
fi

# Fallback: webhook (si no hay bot token)
if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: define SLACK_BOT_TOKEN (recomendado) o SLACK_WEBHOOK_FRONTEND/SLACK_WEBHOOK_LOBECHAT en .env" >&2
  exit 1
fi

curl -sS -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$MESSAGE_ESC\", \"username\": \"$SENDER_ESC\"}"

echo ""
echo "✅ Mensaje enviado a #copilot-api-ia (webhook)"
