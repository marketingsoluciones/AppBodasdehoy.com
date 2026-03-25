#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3210 — CF tunnel: chat-dev.bodasdehoy.com → 192.168.1.48:3210
pnpm next dev -p 3210 &
NEXT_PID=$!

# Pre-warm: esperar arranque y compilar rutas frecuentes en background
sleep 15
(
  BASE="http://192.168.1.48:3210"
  for ROUTE in "/login" "/widget/bodasdehoy" "/en-US__0__light" "/messages"; do
    curl -s "$BASE$ROUTE" --max-time 180 > /dev/null 2>&1 &
  done
  wait
  echo "[dev.sh] Pre-warm completado"
) &

wait $NEXT_PID
