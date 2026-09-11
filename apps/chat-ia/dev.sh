#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/Users/juancarlosparra/.bun/bin:$PATH"
export NEXT_TELEMETRY_DISABLED="1"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3210 — CF tunnel: chat-dev.bodasdehoy.com → 192.168.1.48:3210
#
# Modo exposición pública por tunnel: next start (requiere build previo manual).
exec pnpm next start -p 3210 -H 0.0.0.0
