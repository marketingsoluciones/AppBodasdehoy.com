#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
# Puerto 3220 — CF tunnel: app-dev.bodasdehoy.com → 127.0.0.1:3220
pnpm next dev -H 127.0.0.1 -p 3220 &
NEXT_PID=$!

# Pre-warm: esperar que arranque y compilar rutas frecuentes
sleep 12
curl -s http://127.0.0.1:3220/api/health --max-time 90 > /dev/null 2>&1 || true
curl -s http://127.0.0.1:3220/ --max-time 90 > /dev/null 2>&1 || true

wait $NEXT_PID
