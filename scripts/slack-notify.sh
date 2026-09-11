#!/bin/bash

# Notificaciones a api-ia vía Slack. Nuestro único canal: #copilot-api-ia.
# Uso: ./slack-notify.sh [--copilot|--web] <tipo> <mensaje> [detalles]
# Tipos: error, help, success, info, warning, question

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

BOT_TOKEN="${SLACK_BOT_TOKEN:-}"
WEBHOOK_URL="${SLACK_WEBHOOK_FRONTEND:-${SLACK_WEBHOOK_LOBECHAT:-${SLACK_WEBHOOK_URL:-}}}"

REPO=""
DEST=""

while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --copilot)
      REPO="copilot"
      shift
      ;;
    --web)
      REPO="web"
      shift
      ;;
    --memories)
      REPO="memories"
      shift
      ;;
    --to)
      DEST="${2:-}"
      shift 2
      ;;
    --to=*)
      DEST="${1#--to=}"
      shift
      ;;
    *)
      break
      ;;
  esac
done

if [ -z "$REPO" ] && [ -n "${SLACK_REPO:-}" ]; then
  REPO="$SLACK_REPO"
fi

if [ -z "$DEST" ] && [ -n "${SLACK_TO:-}" ]; then
  DEST="$SLACK_TO"
fi

if [ "$REPO" = "copilot" ]; then
  SLACK_SENDER="appbodas-Copilot (chat-ia)"
  SLACK_DE="De: appbodas-Copilot (chat-ia)"
  REPO_LINE="Repo: apps/chat-ia"
elif [ "$REPO" = "web" ]; then
  SLACK_SENDER="app-bodas (appEventos)"
  SLACK_DE="De: app-bodas (appEventos)"
  REPO_LINE="Repo: apps/appEventos"
elif [ "$REPO" = "memories" ]; then
  SLACK_SENDER="memories (memories-web)"
  SLACK_DE="De: memories (memories-web)"
  REPO_LINE="Repo: apps/memories-web"
else
  SLACK_SENDER="${SLACK_SENDER_NAME:-Frontend Bodasdehoy · Copilot LobeChat}"
  SLACK_DE="${SLACK_MSG_DE:-De: Frontend / Copilot LobeChat}"
  REPO_LINE=""
fi

DEST_LABEL="api-ia"
DEFAULT_CHANNEL_ID="C0AEV0GCLM7"
DEFAULT_PARA="Para: Equipo api-ia (#copilot-api-ia)"

if [ "$DEST" = "mcp" ] || [ "$DEST" = "backend" ] || [ "$DEST" = "api2" ]; then
  DEST_LABEL="mcp"
  DEFAULT_CHANNEL_ID="C0AE8K47VNF"
  DEFAULT_PARA="Para: Equipo MCP (#api-ia-api2-sync)"
fi

if [ -n "${SLACK_CHANNEL_FRONTEND:-}" ]; then
  CHANNEL_ID="$SLACK_CHANNEL_FRONTEND"
else
  CHANNEL_ID="$DEFAULT_CHANNEL_ID"
fi

SLACK_PARA="${SLACK_MSG_PARA:-$DEFAULT_PARA}"
PREFIX="${SLACK_DE}\n${SLACK_PARA}\n\n"
[ -n "$REPO_LINE" ] && PREFIX="${PREFIX}${REPO_LINE}\n\n"

# Función de ayuda
show_help() {
  cat << EOF
📢 Notificaciones a Slack (#copilot-api-ia) identificando equipo y repo

Uso:
  $0 [--copilot|--web] <tipo> <mensaje> [detalles]

Equipo/repo (opcional):
  --copilot   Remitente: Front Copilot LobeChat · Repo: apps/chat-ia
  --web       Remitente: Front App Bodasdehoy · Repo: apps/appEventos
  (si no se indica, usa SLACK_REPO o SLACK_SENDER_NAME de .env)

Tipos de notificación:
  error     - ❌ Reportar un error
  help      - 🆘 Solicitar ayuda
  success   - ✅ Notificar éxito
  info      - 💬 Información general
  warning   - ⚠️  Advertencia
  question  - ❓ Hacer una pregunta

Ejemplos:
  $0 --web error "Error en login" "Trace ID: abc123"
  $0 --copilot help "Credenciales Anthropic"
  $0 --web success "Deploy apps/appEventos completado"
  $0 --copilot info "Nueva versión Copilot desplegada"

EOF
  exit 0
}

# Verificar argumentos
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  show_help
fi

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Error: Debes proporcionar tipo y mensaje"
  echo "Usa -h o --help para ver ejemplos"
  exit 1
fi

TYPE="$1"
MESSAGE="$2"
DETAILS="${3:-}"

# Seleccionar emoji según tipo
case "$TYPE" in
  error)
    EMOJI="❌"
    TITLE="ERROR"
    ;;
  help)
    EMOJI="🆘"
    TITLE="SOLICITUD DE AYUDA"
    ;;
  success)
    EMOJI="✅"
    TITLE="ÉXITO"
    ;;
  info)
    EMOJI="💬"
    TITLE="INFORMACIÓN"
    ;;
  warning)
    EMOJI="⚠️"
    TITLE="ADVERTENCIA"
    ;;
  question)
    EMOJI="❓"
    TITLE="PREGUNTA"
    ;;
  *)
    echo "❌ Tipo no válido: $TYPE"
    echo "Tipos válidos: error, help, success, info, warning, question"
    exit 1
    ;;
esac

# Construir mensaje (incluye De/Para al inicio)
FULL_MESSAGE="${PREFIX}$EMOJI *$TITLE*\n\n$MESSAGE"

if [ -n "$DETAILS" ]; then
  FULL_MESSAGE="$FULL_MESSAGE\n\n_Detalles:_ $DETAILS"
fi

# Escapar para JSON
escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
FULL_ESC=$(escape_json "$FULL_MESSAGE")
SENDER_ESC=$(escape_json "$SLACK_SENDER")

if [ -n "$BOT_TOKEN" ]; then
  # Enviar con API chat.postMessage (como el otro equipo)
  RESP=$(curl -sS --max-time 15 -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\": \"$CHANNEL_ID\", \"text\": \"$FULL_ESC\", \"username\": \"$SENDER_ESC\", \"mrkdwn\": true}")
  if echo "$RESP" | grep -q '"ok":true'; then
    echo "✅ Mensaje enviado a #copilot-api-ia"
    exit 0
  fi
  echo "❌ Error Slack API: $(echo "$RESP" | jq -r '.error // .' 2>/dev/null || echo "$RESP")"
  exit 1
fi

if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: define SLACK_BOT_TOKEN (recomendado) o SLACK_WEBHOOK_FRONTEND/SLACK_WEBHOOK_LOBECHAT en .env"
  exit 1
fi

# Fallback: webhook
curl -sS -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$FULL_ESC\", \"mrkdwn\": true, \"username\": \"$SENDER_ESC\"}"

echo "✅ Mensaje enviado a #copilot-api-ia"
