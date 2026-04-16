#!/bin/bash

# Enviar mensajes a un espacio de Google Chat (webhook de entrada).
# Uso cuando quieras usar solo Google Chat en lugar de Slack para coordinación (copilot-api-ia).
#
# Uso:
#   ./google-chat-send.sh "Mensaje"
#   ./google-chat-send.sh --copilot "Mensaje"
#   ./google-chat-send.sh --web "Mensaje"
#
# Requiere: .env con GOOGLE_CHAT_WEBHOOK_URL (URL del webhook del espacio en Google Chat).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

WEBHOOK_URL="${GOOGLE_CHAT_WEBHOOK_URL:-}"

if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: GOOGLE_CHAT_WEBHOOK_URL no está definido en .env"
  echo "Añade la URL del webhook de entrada del espacio de Google Chat."
  exit 1
fi

# Prefijo opcional por equipo/repo (igual que slack-send)
PREFIX=""
if [ "$1" = "--copilot" ]; then
  PREFIX="[Copilot] "
  shift
elif [ "$1" = "--web" ]; then
  PREFIX="[Web] "
  shift
fi

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar un mensaje"
  echo "Uso: $0 [--copilot|--web] \"Tu mensaje aquí\""
  exit 1
fi

MESSAGE="${PREFIX}$1"

# Escapar para JSON (comillas, backslash, saltos de línea)
escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
MESSAGE_ESC=$(escape_json "$MESSAGE")

# Google Chat webhook: POST con JSON {"text": "..."}
curl -sS -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json; charset=UTF-8' \
  -d "{\"text\": \"$MESSAGE_ESC\"}"

echo ""
echo "✅ Mensaje enviado a Google Chat"
