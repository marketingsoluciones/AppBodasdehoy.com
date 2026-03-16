#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3210: debe coincidir con config/cloudflared-config.yml (chat-test → 3210)
exec pnpm next start -p 3210
