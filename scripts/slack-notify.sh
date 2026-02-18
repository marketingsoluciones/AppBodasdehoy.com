#!/bin/bash

# Notificaciones a api-ia vía Slack identificando equipo y repo.
# Uso: ./slack-notify.sh [--copilot|--web] <tipo> <mensaje> [detalles]
# Tipos: error, help, success, info, warning, question
# Ejemplos: ./slack-notify.sh --web info "Deploy completado"; ./slack-notify.sh --copilot error "Chat 503"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

WEBHOOK_URL="${SLACK_WEBHOOK_FRONTEND:-${SLACK_WEBHOOK:-https://hooks.slack.com/services/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}}"

# Identidad por equipo/repo
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

# Función de ayuda
show_help() {
  cat << EOF
📢 Notificaciones a Slack (#copilot-api-ia) identificando equipo y repo

Uso:
  $0 [--copilot|--web] <tipo> <mensaje> [detalles]

Equipo/repo (opcional):
  --copilot   Remitente: Front Copilot LobeChat · Repo: apps/copilot
  --web       Remitente: Front App Bodasdehoy · Repo: apps/web
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
  $0 --web success "Deploy apps/web completado"
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

# Enviar a Slack (username = remitente visible)
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$FULL_ESC\", \"mrkdwn\": true, \"username\": \"$SENDER_ESC\"}" \
  -s -o /dev/null -w "%{http_code}"

HTTP_CODE=$?

if [ $HTTP_CODE -eq 0 ]; then
  echo "✅ Mensaje enviado a #copilot-api-ia"
else
  echo "❌ Error al enviar mensaje (código: $HTTP_CODE)"
  exit 1
fi
