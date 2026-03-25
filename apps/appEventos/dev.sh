#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
# Puerto 3220 — CF tunnel: app-dev.bodasdehoy.com → 127.0.0.1:3220
# Usa next start (build previo) en vez de next dev — más estable con deps ESM pesadas
exec pnpm next start -p 3220 -H 127.0.0.1
