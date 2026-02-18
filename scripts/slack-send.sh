#!/bin/bash

# Enviar mensajes a api-ia vía Slack identificando equipo y repo.
# Uso:
#   ./slack-send.sh "Mensaje"                    # usa .env SLACK_SENDER_NAME o SLACK_REPO
#   ./slack-send.sh --copilot "Mensaje"          # Equipo: Front Copilot LobeChat · Repo: apps/copilot
#   ./slack-send.sh --web "Mensaje"               # Equipo: Front App Bodasdehoy · Repo: apps/web
# Webhook: .env SLACK_WEBHOOK_FRONTEND o SLACK_WEBHOOK.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

WEBHOOK_URL="${SLACK_WEBHOOK_FRONTEND:-${SLACK_WEBHOOK:-https://hooks.slack.com/services/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}}"

# Identidad por equipo/repo (--copilot | --web) o por .env (SLACK_REPO=copilot|web, o SLACK_SENDER_NAME)
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
  REPO_LINE="Repo: apps/copilot"
elif [ "$REPO" = "web" ]; then
  SLACK_SENDER="Front App Bodasdehoy"
  SLACK_DE="De: Front App Bodasdehoy"
  REPO_LINE="Repo: apps/web"
else
  SLACK_SENDER="${SLACK_SENDER_NAME:-Frontend Bodasdehoy · Copilot LobeChat}"
  SLACK_DE="${SLACK_MSG_DE:-De: Frontend / Copilot LobeChat}"
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

# Enviar mensaje a Slack (username = remitente visible)
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$MESSAGE_ESC\", \"username\": \"$SENDER_ESC\"}"

echo ""
echo "✅ Mensaje enviado a #copilot-api-ia"
