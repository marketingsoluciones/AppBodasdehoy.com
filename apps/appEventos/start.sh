#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
exec pnpm next start -p 8080
