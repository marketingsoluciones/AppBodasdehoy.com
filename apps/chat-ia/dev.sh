#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3210 — CF tunnel: chat-dev.bodasdehoy.com → 192.168.1.48:3210
exec pnpm next dev -p 3210
