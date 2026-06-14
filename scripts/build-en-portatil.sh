#!/bin/bash
# Build de producción de chat-ia en el MacBook Pro 24GB (Tailscale) y traer el .next a este Mac.
# Motivo: este Mac (16GB) da OOM al buildear chat-ia (~21k módulos). El portátil tiene 24GB.
# Uso: bash scripts/build-en-portatil.sh
#
# APRENDIZAJES (build real 2026-06-12, BUILD_ID durvB6K7k50pV17Kskj7m, ~4min):
#   - HEAP 16GB (no 8GB): con 8192 dio OOM; 16384 cabe en los 24GB del portátil.
#   - RSYNC node_modules (no pnpm install): el repo tiene deps "fantasma" (ollama, ua-parser-js)
#     importadas pero NO declaradas en package.json → pnpm install limpio las pierde y rompe el build.
#     El node_modules de ESTE Mac (que sí compila) es la fuente de verdad. Ambos arm64 → rsync directo.
#   - El build tarda ~4min: 97s webpack + ~2min generar 277 páginas estáticas (SSG). Normal con RAM ok.
# Requisitos: Tailscale activo + portátil online + SSH ok (100.105.48.36) + node@26/pnpm en /opt/homebrew/bin.
set -euo pipefail

REMOTE_HOST="100.105.48.36"          # macbook-pro-de-juan (Tailscale)
REMOTE_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
REMOTE_PATH="/opt/homebrew/bin"      # node@26 + pnpm (no en PATH SSH por defecto)
BRANCH="tj/refactor/adelgazar-chat-ia"
LOCAL_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
HEAP_MB=16384                        # 16GB heap (8GB da OOM en chat-ia)

echo "=== 1) Verificar portátil online ==="
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_HOST" 'echo ok' >/dev/null 2>&1; then
  echo "❌ Portátil NO accesible por SSH ($REMOTE_HOST). ¿Tailscale activo? ¿portátil encendido?"
  exit 1
fi
# Memoria realmente disponible (PhysMem unused). Aviso si está muy justa, pero NO abortamos:
# con heap 16GB + 24GB físicos hay margen aunque vm_stat 'free' parezca bajo.
UNUSED_MB=$(ssh -o BatchMode=yes "$REMOTE_HOST" "top -l 1 | awk '/PhysMem/{for(i=1;i<=NF;i++)if(\$i~/unused/){gsub(/[A-Z]/,\"\",\$(i-1));print \$(i-1)}}'" 2>/dev/null || echo "?")
echo "RAM 'unused' en portátil: ${UNUSED_MB}MB (heap del build: ${HEAP_MB}MB). Si <2000, considera cerrar apps."

echo "=== 2) Actualizar repo del portátil a $BRANCH ==="
# OJO: el portátil puede NO tener refspec para esta branch (solo inbox-fase1). Por eso
# NO usamos origin/$BRANCH (da 'unknown revision'); fetch a FETCH_HEAD + reset --hard FETCH_HEAD.
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR && \
  git stash 2>/dev/null; \
  git fetch origin $BRANCH 2>&1 | tail -1 && \
  git reset --hard FETCH_HEAD 2>&1 | tail -1 && \
  echo 'repo en:' \$(git log --oneline -1)"

echo "=== 3) Sincronizar node_modules de ESTE Mac → portátil (evita deps fantasma) ==="
rsync -az --delete -e "ssh -o BatchMode=yes" \
  "$LOCAL_DIR/node_modules/" "$REMOTE_HOST:$REMOTE_DIR/node_modules/"
echo "node_modules sincronizado."

echo "=== 4) next build chat-ia (heap ${HEAP_MB}MB) ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR/apps/chat-ia && \
  NODE_OPTIONS=--max-old-space-size=$HEAP_MB NEXT_TELEMETRY_DISABLED=1 pnpm exec next build --no-lint 2>&1 | tail -18"

echo "=== 5) Verificar BUILD_ID generado en el portátil ==="
BID=$(ssh -o BatchMode=yes "$REMOTE_HOST" "cat $REMOTE_DIR/apps/chat-ia/.next/BUILD_ID 2>/dev/null" || echo "")
if [ -z "$BID" ]; then echo "❌ Build NO generó BUILD_ID (revisar OOM/errores arriba)"; exit 3; fi
echo "✅ BUILD_ID portátil: $BID"

echo "=== 6) rsync .next del portátil → este Mac ==="
rsync -az --delete -e "ssh -o BatchMode=yes" \
  "$REMOTE_HOST:$REMOTE_DIR/apps/chat-ia/.next/" \
  "$LOCAL_DIR/apps/chat-ia/.next/"
echo "✅ .next copiado. BUILD_ID local: $(cat $LOCAL_DIR/apps/chat-ia/.next/BUILD_ID 2>/dev/null)"

echo "=== 7) Arrancar chat-ia con next start (build con fixes) ==="
pm2 delete chat-dev 2>/dev/null || true
lsof -ti:3210 2>/dev/null | xargs kill -9 2>/dev/null || true
pm2 start /tmp/start-chat.sh --name chat-dev --log /tmp/pm2-chat-start.log 2>&1 | tail -1 || \
  echo "⚠️ arranca manual: cd $LOCAL_DIR/apps/chat-ia && pnpm next start -p 3210 -H 0.0.0.0"

echo ""
echo "=== LISTO. chat-ia sirve el build de producción CON los fixes. Verifica: curl localhost:3210/chat"
