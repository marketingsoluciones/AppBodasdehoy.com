#!/usr/bin/env bash
# Envía a #copilot-api-ia un mensaje URGENTE pidiendo configurar Cloudflare para app-test y chat-test.
# Así no dependemos de localhost y podemos trabajar con el dominio real por HTTPS.
# Uso: ./scripts/slack-pedir-cloudflare.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
[ -f "$ROOT_DIR/.env" ] && set -a && source "$ROOT_DIR/.env" && set +a

WEBHOOK_URL="${SLACK_WEBHOOK_FRONTEND:-${SLACK_WEBHOOK:-}}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "Falta SLACK_WEBHOOK_FRONTEND o SLACK_WEBHOOK en .env"
  exit 1
fi

# Mensaje urgente, pasos copy-paste
DE="${SLACK_MSG_DE:-De: Frontend / Copilot LobeChat}"
PARA="${SLACK_MSG_PARA:-Para: Equipo api-ia (#copilot-api-ia) – quien tenga acceso a Cloudflare}"
MSG="🚨 *URGENTE – No podemos trabajar con localhost*

Necesitamos que *app-test.bodasdehoy.com* y *chat-test.bodasdehoy.com* carguen por el túnel. Sin esto no hay login (Firebase no acepta localhost) y bloqueamos desarrollo.

*Pasos en Cloudflare (≈5 min):*
1) *DNS* → bodasdehoy.com → Crear/editar:
   • *app-test* → CNAME → 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com (Proxy: Proxied)
   • *chat-test* → CNAME → 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com (Proxy: Proxied)
2) *Zero Trust* → Access → Tunnels → *lobe-chat-harbor* → Public Hostname:
   • app-test.bodasdehoy.com → HTTP → localhost → puerto 8080
   • chat-test.bodasdehoy.com → HTTP → localhost → puerto 3210

En esta máquina ya están corriendo el túnel y pnpm dev. Detalle: docs/LOGIN-REQUIERE-SUBDOMINIOS-APP-TEST-CHAT-TEST.md"

FULL="${DE}
${PARA}

${MSG}"

# Escapar para JSON
escape_json() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'; }
FULL_ESC=$(escape_json "$FULL")
SENDER_ESC=$(escape_json "${SLACK_SENDER_NAME:-Frontend Bodasdehoy · Copilot LobeChat}")

curl -sS -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$FULL_ESC\", \"username\": \"$SENDER_ESC\"}"

echo ""
echo "✅ Petición enviada a #copilot-api-ia (URGENTE – Cloudflare app-test/chat-test)."
