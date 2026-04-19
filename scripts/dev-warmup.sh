#!/bin/bash
# dev-warmup.sh — Arranca appEventos + chat-ia y pre-compila rutas principales.
# Uso: bash scripts/dev-warmup.sh

set -e

echo "🚀 Arrancando servidores dev..."

# Matar instancias previas
lsof -ti:3220 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3210 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Arrancar servidores en background
pnpm --filter @bodasdehoy/appEventos dev > /tmp/appEventos-dev.log 2>&1 &
pnpm --filter @bodasdehoy/chat-ia dev > /tmp/chat-ia-dev.log 2>&1 &

echo "⏳ Servidores arrancando..."
echo "   appEventos → http://127.0.0.1:3220"
echo "   chat-ia    → http://localhost:3210"
echo ""

# Warmup en paralelo (cada uno espera su server)
echo "🔥 Pre-compilando rutas (esto tarda 1-3 min la primera vez)..."
node apps/appEventos/scripts/warmup-dev.mjs &
node apps/chat-ia/scripts/warmup-dev.mjs &
wait

echo ""
echo "✅ Todo listo. Servidores corriendo y rutas pre-compiladas."
echo "   Logs: /tmp/appEventos-dev.log y /tmp/chat-ia-dev.log"
