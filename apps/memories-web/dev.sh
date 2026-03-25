#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/memories-web
# Puerto 3240 — CF tunnel: memories-dev.bodasdehoy.com → 127.0.0.1:3240
pnpm next dev -H 127.0.0.1 -p 3240 &
NEXT_PID=$!

sleep 10
curl -s http://127.0.0.1:3240/ --max-time 60 > /dev/null 2>&1 || true

wait $NEXT_PID
