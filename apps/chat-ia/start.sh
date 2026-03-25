#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3211: separado de chat-dev (3210) para evitar conflicto EADDRINUSE
exec pnpm next start -p 3211
