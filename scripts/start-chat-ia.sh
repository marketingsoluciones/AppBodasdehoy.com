#!/bin/bash
# Auto-restart chat-ia cuando Turbopack crashea con ENOENT en .next/
# Reinicia el servidor preservando el cache para no recompilar desde cero.

REPO=/Users/juancarlosparra/Projects/AppBodasdehoy.com
LOG=/tmp/chat-ia-dev.log
CRASHES=0
MAX_CRASHES=10

cd "$REPO"

while [ $CRASHES -lt $MAX_CRASHES ]; do
  echo "[chat-ia] Arrancando... (intento $((CRASHES+1)))" | tee -a "$LOG"

  NODE_OPTIONS=--max-old-space-size=8192 \
    pnpm --filter @bodasdehoy/chat-ia exec next dev --turbopack -H 0.0.0.0 -p 3210 \
    >> "$LOG" 2>&1

  EXIT=$?
  CRASHES=$((CRASHES+1))

  if [ $EXIT -eq 0 ]; then
    echo "[chat-ia] Salida limpia." | tee -a "$LOG"
    break
  fi

  echo "[chat-ia] Crash detectado (exit $EXIT). Limpiando manifiestos corruptos..." | tee -a "$LOG"

  # Solo borrar los ficheros tmp corruptos, NO todo .next (para conservar cache)
  find "$REPO/apps/chat-ia/.next/static/development" -name "_buildManifest.js.tmp.*" -delete 2>/dev/null
  find "$REPO/apps/chat-ia/.next/server/app" -name "server-reference-manifest.json.tmp.*" -delete 2>/dev/null

  echo "[chat-ia] Reiniciando en 3s..." | tee -a "$LOG"
  sleep 3
done

echo "[chat-ia] Demasiados crashes ($MAX_CRASHES). Deteniendo." | tee -a "$LOG"
