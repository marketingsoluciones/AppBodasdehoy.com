#!/bin/bash

# Enviar mensajes de coordinación del FRONTEND vía Slack.
#
# Canal por defecto: #bodasdehoy-backend-coordinacion (C0AV8EV5495)
# Canal frontend team: #app-bodas-alqtm (C04C34S2CJ3)
# Canal api-ia:      #copilot-api-ia (C0AEV0GCLM7)        → --to api-ia
# Canal backend (MCP): #api-ia-api2-sync (C0AE8K47VNF)       → --to mcp
#
# NOTA: El bot token actual es apiia_bot — los mensajes aparecen con ese
# avatar en Slack. Hasta que Dirección cree un bot propio para frontend,
# el texto del mensaje incluye cabecera "De: ..." para identificarnos.
#
# Uso:
#   ./slack-send.sh "Mensaje"                    # → #bodasdehoy-backend-coordinacion
#   ./slack-send.sh --web "Mensaje"              # → idem, identificado como appEventos
#   ./slack-send.sh --copilot "Mensaje"          # → idem, identificado como chat-ia
#   ./slack-send.sh --to frontend "Mensaje"      # → #app-bodas-alqtm
#   ./slack-send.sh --to api-ia "Mensaje"        # → #copilot-api-ia
#   ./slack-send.sh --to mcp "Mensaje"           # → #api-ia-api2-sync
#
# Requiere: SLACK_BOT_TOKEN en .env.slack.local

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
DE_TEAM=""
PARA_TEAM=""
DRI_HANDLE=""

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
    --de)
      DE_TEAM="${2:-}"
      shift 2
      ;;
    --de=*)
      DE_TEAM="${1#--de=}"
      shift
      ;;
    --para-equipo)
      PARA_TEAM="${2:-}"
      shift 2
      ;;
    --para-equipo=*)
      PARA_TEAM="${1#--para-equipo=}"
      shift
      ;;
    --dri)
      DRI_HANDLE="${2:-}"
      shift 2
      ;;
    --dri=*)
      DRI_HANDLE="${1#--dri=}"
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

# --- Identificación del remitente ---
if [ "$REPO" = "copilot" ]; then
  SLACK_SENDER="Frontend Bodasdehoy (chat-ia)"
  SLACK_DE="De: Frontend Bodasdehoy (chat-ia)"
  REPO_LINE="Repo: apps/chat-ia"
elif [ "$REPO" = "web" ]; then
  SLACK_SENDER="Frontend Bodasdehoy (appEventos)"
  SLACK_DE="De: Frontend Bodasdehoy (appEventos)"
  REPO_LINE="Repo: apps/appEventos"
elif [ "$REPO" = "memories" ]; then
  SLACK_SENDER="Frontend Bodasdehoy (memories-web)"
  SLACK_DE="De: Frontend Bodasdehoy (memories-web)"
  REPO_LINE="Repo: apps/memories-web"
else
  SLACK_SENDER="${SLACK_SENDER_NAME:-Frontend Bodasdehoy}"
  SLACK_DE="De: Frontend Bodasdehoy"
  REPO_LINE=""
fi

# --- Canal destino ---
# Default: #bodasdehoy-backend-coordinacion (el canal correcto para frontend)
CHANNEL_COORDINACION="C0AV8EV5495"
CHANNEL_FRONTEND_TEAM="C04C34S2CJ3"
CHANNEL_API_IA="C0AEV0GCLM7"
CHANNEL_MCP_SYNC="C0AE8K47VNF"

DEST_LABEL="coordinacion"
CHANNEL_ID="$CHANNEL_COORDINACION"
DEST_PARA="Para: #bodasdehoy-backend-coordinacion"

if [ "$DEST" = "frontend" ] || [ "$DEST" = "app-bodas-alqtm" ]; then
  DEST_LABEL="app-bodas-alqtm"
  CHANNEL_ID="$CHANNEL_FRONTEND_TEAM"
  DEST_PARA="Para: Equipo de frontEnd (#app-bodas-alqtm)"
elif [ "$DEST" = "api-ia" ]; then
  DEST_LABEL="api-ia"
  CHANNEL_ID="$CHANNEL_API_IA"
  DEST_PARA="Para: Equipo api-ia (#copilot-api-ia)"
elif [ "$DEST" = "mcp" ] || [ "$DEST" = "backend" ] || [ "$DEST" = "api2" ]; then
  DEST_LABEL="mcp"
  CHANNEL_ID="$CHANNEL_MCP_SYNC"
  DEST_PARA="Para: Equipo MCP (#api-ia-api2-sync)"
fi

# Override por env si existe
if [ -n "${SLACK_CHANNEL_OVERRIDE:-}" ]; then
  CHANNEL_ID="$SLACK_CHANNEL_OVERRIDE"
fi

# --- Directorio (equipos) ---
if [ -z "$DE_TEAM" ] && [ -n "${SLACK_DE_TEAM:-}" ]; then
  DE_TEAM="$SLACK_DE_TEAM"
fi
if [ -z "$DE_TEAM" ]; then
  if [ "$REPO" = "web" ]; then
    DE_TEAM="FRONT-appEventos"
  else
    DE_TEAM="FRONT-appEventos"
  fi
fi

if [ -z "$PARA_TEAM" ] && [ -n "${SLACK_PARA_TEAM:-}" ]; then
  PARA_TEAM="$SLACK_PARA_TEAM"
fi
if [ -z "$PARA_TEAM" ]; then
  if [ "$DEST" = "mcp" ] || [ "$DEST" = "backend" ] || [ "$DEST" = "api2" ]; then
    PARA_TEAM="BACKEND-MCP/GraphQL"
  elif [ "$DEST" = "api-ia" ]; then
    PARA_TEAM="BACKEND-API-IA (Realtime/Webhooks)"
  elif [ "$DEST" = "frontend" ] || [ "$DEST" = "app-bodas-alqtm" ]; then
    PARA_TEAM="FRONT-appEventos"
  else
    PARA_TEAM="BACKEND-MCP/GraphQL"
  fi
fi

if [ -z "$DRI_HANDLE" ] && [ -n "${SLACK_DRI_HANDLE:-}" ]; then
  DRI_HANDLE="$SLACK_DRI_HANDLE"
fi
if [ -z "$DRI_HANDLE" ]; then
  DRI_HANDLE="@backend_oncall"
fi

SLACK_PARA="${SLACK_MSG_PARA:-$DEST_PARA}"
HEADER_LINE="DE: ${DE_TEAM} | PARA: ${PARA_TEAM} | DRI: ${DRI_HANDLE}"
PREFIX="${HEADER_LINE}\n\n${SLACK_DE}\n${SLACK_PARA}\n\n"
[ -n "$REPO_LINE" ] && PREFIX="${PREFIX}${REPO_LINE}\n\n"

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar un mensaje"
  echo "Uso: $0 [--copilot|--web|--memories] [--de <equipo>] [--para-equipo <equipo>] [--dri @handle] [--to frontend|coordinacion|api-ia|mcp] \"Tu mensaje aquí\""
  echo ""
  echo "Canales:"
  echo "  --to frontend   → #app-bodas-alqtm ($CHANNEL_FRONTEND_TEAM)"
  echo "  --to coordinacion → #bodasdehoy-backend-coordinacion ($CHANNEL_COORDINACION)"
  echo "  --to api-ia     → #copilot-api-ia ($CHANNEL_API_IA)"
  echo "  --to mcp        → #api-ia-api2-sync ($CHANNEL_MCP_SYNC)"
  exit 1
fi

MESSAGE="${PREFIX}$1"

# Escapar comillas y backslash para JSON
escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
MESSAGE_ESC=$(escape_json "$MESSAGE")
SENDER_ESC=$(escape_json "$SLACK_SENDER")

echo "Enviando a #${DEST_LABEL} ($CHANNEL_ID)..."

if [ -n "$BOT_TOKEN" ]; then
  RESP=$(curl -sS --max-time 15 -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\": \"$CHANNEL_ID\", \"text\": \"$MESSAGE_ESC\", \"username\": \"$SENDER_ESC\"}")
  if command -v jq &>/dev/null; then
    OK=$(echo "$RESP" | jq -r '.ok // false')
    if [ "$OK" = "true" ]; then
      echo "✅ Mensaje enviado a #${DEST_LABEL} (chat.postMessage)"
      exit 0
    fi
    ERR=$(echo "$RESP" | jq -r '.error // "unknown"')
    echo "❌ Slack API error: $ERR" >&2
    echo "$RESP" | jq '.' >&2
    exit 1
  else
    if echo "$RESP" | grep -q '"ok":true'; then
      echo "✅ Mensaje enviado a #${DEST_LABEL} (chat.postMessage)"
      exit 0
    fi
    echo "❌ Slack API error: $RESP" >&2
    exit 1
  fi
fi

# Fallback: webhook (si no hay bot token)
if [ -z "$WEBHOOK_URL" ]; then
  echo "Error: define SLACK_BOT_TOKEN (recomendado) o SLACK_WEBHOOK_FRONTEND en .env.slack.local" >&2
  exit 1
fi

curl -sS -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$MESSAGE_ESC\", \"username\": \"$SENDER_ESC\"}"

echo ""
echo "✅ Mensaje enviado a #${DEST_LABEL} (webhook)"
