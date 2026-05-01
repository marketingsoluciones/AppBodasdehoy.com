#!/usr/bin/env bash
# ============================================================================
# Slack Agent Setup — copiar a CUALQUIER repo (FrontApp / api-ia / api-mcp / FrontCRM)
# ============================================================================
# Uso: source scripts/slack-agent-setup.sh
#
# Este script es autónomo: solo necesita curl + bash. Sin dependencias de Node ni pnpm.
# Carga el token desde ~/.slack-bodasdehoy.env (un solo archivo por máquina, fuera de git).
#
# Después de cargarlo, usar las funciones:
#   slack_send "#canal" "mensaje"        → envía mensaje
#   slack_read "#canal" [N]              → lee últimos N mensajes
#
# Canales predefinidos:
#   slack_send_api_ia "mensaje"          → #copilot-api-ia
#   slack_send_mcp  "mensaje"           → #api-ia-api2-sync
#   slack_send_frontend "mensaje"       → #app-bodas-alqtm
#   slack_send_coordinacion "mensaje"   → #bodasdehoy-backend-coordinacion
# ============================================================================

set -euo pipefail

# ─── Cargar token desde ubicación estándar (FUERA de git) ───
SLACK_ENV_FILE="${HOME}/.slack-bodasdehoy.env"

if [ -f "$SLACK_ENV_FILE" ]; then
  set -a && source "$SLACK_ENV_FILE" && set +a
fi

SLACK_BOT_TOKEN="${SLACK_BOT_TOKEN:-}"
SLACK_WORKSPACE="${SLACK_WORKSPACE:-EventosOrganizador}"

# ─── Canales oficiales ───
CH_ID_FRONTEND="C04C34S2CJ3"       #app-bodas-alqtm (solo FrontApp)
CH_ID_API_IA="C0AEV0GCLM7"         #copilot-api-ia (FrontApp ↔ api-ia)
CH_ID_MCP="C0AE8K47VNF"            #api-ia-api2-sync (api-ia ↔ api-mcp ↔ FrontCRM)
CH_ID_COORD="C0AV8EV5495"          #bodasdehoy-backend-coordinacion (legacy)

# ─── Funciones ───
_slack_ensure_token() {
  if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "❌ SLACK_BOT_TOKEN no definido."
    echo ""
    echo "   Crea el archivo: $SLACK_ENV_FILE"
    echo "   Con el contenido:"
    echo '     SLACK_BOT_TOKEN=xoxb-...'
    echo ""
    echo "   El token es el del bot @api-ia Bot (workspace EventosOrganizador)."
    echo "   Pedir a JCC o al admin del workspace si no lo tienes."
    return 1
  fi
}

slack_send() {
  local channel_id="${1:-}"
  local message="${2:-}"
  _slack_ensure_token || return 1
  if [ -z "$channel_id" ] || [ -z "$message" ]; then
    echo "Uso: slack_send <channel_id> <mensaje>"
    return 1
  fi
  curl -sS --max-time 15 -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json,sys; print(json.dumps({'channel':sys.argv[1],'text':sys.argv[2]}))" "$channel_id" "$message")" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅' if d.get('ok') else '❌ '+d.get('error',''))"
}

slack_read() {
  local channel_id="${1:-$CH_ID_COORD}"
  local limit="${2:-10}"
  _slack_ensure_token || return 1
  curl -sS --max-time 15 \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    "https://slack.com/api/conversations.history?channel=${channel_id}&limit=${limit}" \
    | python3 -c "
import json, sys
d = json.load(sys.stdin)
if not d.get('ok'):
  print('❌', d.get('error',''))
  exit()
for m in reversed(d.get('messages',[]) or []):
  ts = m.get('ts','')
  user = m.get('username','') or m.get('user','?')
  text = (m.get('text','') or '')[:200].replace('\n',' ')
  print(f'[{user}] {text}')
"
}

# ─── Shortcuts ───
slack_send_api_ia()    { slack_send "$CH_ID_API_IA" "$1"; }
slack_send_mcp()       { slack_send "$CH_ID_MCP" "$1"; }
slack_send_frontend()  { slack_send "$CH_ID_FRONTEND" "$1"; }
slack_send_coordinacion() { slack_send "$CH_ID_COORD" "$1"; }

slack_read_api_ia()    { slack_read "$CH_ID_API_IA" "${1:-10}"; }
slack_read_mcp()       { slack_read "$CH_ID_MCP" "${1:-10}"; }
slack_read_frontend()  { slack_read "$CH_ID_FRONTEND" "${1:-10}"; }
slack_read_coordinacion() { slack_read "$CH_ID_COORD" "${1:-10}"; }

# ─── Banner al cargar ───
if [ "${SLACK_AGENT_QUIET:-}" != "1" ]; then
  if [ -n "$SLACK_BOT_TOKEN" ]; then
    echo "✅ Slack listo (workspace: $SLACK_WORKSPACE, bot: apiia_bot)"
    echo "   Enviar: slack_send_api_ia \"mensaje\" | slack_send_mcp \"mensaje\""
    echo "   Leer:   slack_read_api_ia | slack_read_mcp"
  else
    echo "⚠️  Slack no configurado. Ver instrucciones ejecutando:"
    echo "   bash scripts/slack-agent-setup.sh --help"
  fi
fi

# ─── Help ───
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo ""
  echo "═══ Slack Agent Setup — Kit autónomo para cualquier equipo ═══"
  echo ""
  echo "CONFIGURACIÓN INICIAL (solo una vez por máquina):"
  echo ""
  echo "  1. Crea el archivo ~/.slack-bodasdehoy.env con:"
  echo "     SLACK_BOT_TOKEN=xoxb-..."
  echo ""
  echo "     El token es el del bot @api-ia Bot."
  echo "     Workspace: EventosOrganizador"
  echo ""
  echo "  2. Carga las funciones en tu sesión:"
  echo "     source scripts/slack-agent-setup.sh"
  echo ""
  echo "  3. Ya puedes usar:"
  echo "     slack_send_api_ia \"Hola desde api-ia\""
  echo "     slack_read_mcp 5"
  echo ""
  echo "CANALES OFICIALES:"
  echo "  #copilot-api-ia                 → FrontApp ↔ api-ia (IA, chat)"
  echo "  #api-ia-api2-sync               → api-ia ↔ api-mcp ↔ FrontCRM"
  echo "  #app-bodas-alqtm                → Solo FrontApp (interno)"
  echo ""
  echo "NO crear canales nuevos. NO compartir tokens por Slack."
  exit 0
fi
