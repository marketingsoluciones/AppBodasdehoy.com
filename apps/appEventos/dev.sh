#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
export NEXT_TELEMETRY_DISABLED="1"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
# Puerto 3220 — CF tunnel: app-dev.bodasdehoy.com → 127.0.0.1:3220
# Modo exposición pública por tunnel: next start (requiere build previo manual).
exec pnpm next start -p 3220 -H 0.0.0.0
