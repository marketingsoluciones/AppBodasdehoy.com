#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
# Puerto 8080: debe coincidir con config/cloudflared-config.yml (app-test → 8080)
exec pnpm next start -p 8080
