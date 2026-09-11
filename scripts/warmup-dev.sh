#!/usr/bin/env bash
# Pre-calienta las rutas de chat-ia y appEventos para que Turbopack compile todo
# Uso: bash scripts/warmup-dev.sh

set -euo pipefail

CHAT=http://localhost:3210
APP=http://localhost:3220

CHAT_ROUTES=(
  /
  /messages
  /settings/integrations
  /settings/billing/planes
  /chat
)

APP_ROUTES=(
  /
  /invitados
  /presupuesto
  /servicios
  /itinerario
  /mesas
)

warmup() {
  local base=$1; shift
  local label=$1; shift
  echo "--- $label ($base) ---"
  for route in "$@"; do
    printf "  %-30s " "$route"
    local t0=$(python3 -c 'import time;print(int(time.time()*1000))')
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 120 "$base$route" 2>/dev/null || echo "ERR")
    local t1=$(python3 -c 'import time;print(int(time.time()*1000))')
    local ms=$(( t1 - t0 ))
    if [ "$ms" -gt 5000 ]; then
      echo "${ms}ms (HTTP $code) << LENTO"
    else
      echo "${ms}ms (HTTP $code)"
    fi
  done
  echo ""
}

echo "Precalentando rutas dev (Turbopack cold compile)..."
echo ""

# Check which servers are up
if curl -s -o /dev/null --max-time 2 "$CHAT/" 2>/dev/null; then
  warmup "$CHAT" "chat-ia" "${CHAT_ROUTES[@]}"
else
  echo "chat-ia no responde en $CHAT — saltando"
  echo ""
fi

if curl -s -o /dev/null --max-time 2 "$APP/" 2>/dev/null; then
  warmup "$APP" "appEventos" "${APP_ROUTES[@]}"
else
  echo "appEventos no responde en $APP — saltando"
  echo ""
fi

echo "Listo. Todas las rutas compiladas."
