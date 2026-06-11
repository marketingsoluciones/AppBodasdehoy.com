#!/bin/bash
# Build de producción de chat-ia en el MacBook Pro 24GB (Tailscale) y traer el .next a este Mac.
# Motivo: este Mac (16GB) da OOM al buildear chat-ia (~21k módulos). El portátil tiene 24GB.
# Uso: bash scripts/build-en-portatil.sh
#   - Verifica RAM libre del portátil ANTES de buildear (no lanza si está ocupado → evita OOM).
#   - Actualiza el repo del portátil a la branch BRANCH, buildea, y rsync del .next de vuelta.
# Requisitos: Tailscale activo + portátil online + SSH ok (100.105.48.36).
set -euo pipefail

REMOTE_HOST="100.105.48.36"          # macbook-pro-de-juan (Tailscale)
REMOTE_DIR="~/Projects/AppBodasdehoy.com"
REMOTE_PATH="/opt/homebrew/bin"      # node@26 + pnpm están aquí (no en PATH SSH por defecto)
BRANCH="tj/refactor/adelgazar-chat-ia"
LOCAL_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
MIN_FREE_MB=6000                     # RAM libre mínima en el portátil para buildear sin OOM

echo "=== 1) Verificar portátil online + RAM libre ==="
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE_HOST" 'echo ok' >/dev/null 2>&1; then
  echo "❌ Portátil NO accesible por SSH ($REMOTE_HOST). ¿Tailscale activo? ¿portátil encendido?"
  exit 1
fi
FREE_MB=$(ssh -o BatchMode=yes "$REMOTE_HOST" 'vm_stat | awk "/Pages free/{f=\$3} /Pages inactive/{i=\$3} END{gsub(/\./,\"\",f);gsub(/\./,\"\",i);print int((f+i)*4096/1024/1024)}"' 2>/dev/null || echo 0)
echo "RAM libre+inactiva en portátil: ${FREE_MB}MB (mínimo requerido: ${MIN_FREE_MB}MB)"
if [ "${FREE_MB:-0}" -lt "$MIN_FREE_MB" ]; then
  echo "⚠️  RAM insuficiente en el portátil ahora mismo (probablemente en uso: Chrome/apps)."
  echo "    Espera a que esté ocioso o cierra apps en el portátil, y reintenta. NO lanzo el build (evito OOM)."
  exit 2
fi

echo "=== 2) Actualizar repo del portátil a $BRANCH ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR && \
  git fetch origin $BRANCH --quiet && \
  git checkout $BRANCH 2>/dev/null || git checkout -b $BRANCH origin/$BRANCH && \
  git reset --hard origin/$BRANCH && \
  echo 'repo en:' \$(git log --oneline -1)"

echo "=== 3) pnpm install (por si lockfile cambió) ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR && pnpm install --frozen-lockfile 2>&1 | tail -3"

echo "=== 4) next build chat-ia (24GB, heap 8GB) ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR/apps/chat-ia && \
  NODE_OPTIONS=--max-old-space-size=8192 NEXT_TELEMETRY_DISABLED=1 pnpm exec next build --no-lint 2>&1 | tail -15"

echo "=== 5) Verificar BUILD_ID generado en el portátil ==="
BID=$(ssh -o BatchMode=yes "$REMOTE_HOST" "cat $REMOTE_DIR/apps/chat-ia/.next/BUILD_ID 2>/dev/null" || echo "")
if [ -z "$BID" ]; then echo "❌ Build NO generó BUILD_ID en el portátil (revisar OOM/errores arriba)"; exit 3; fi
echo "✅ BUILD_ID portátil: $BID"

echo "=== 6) rsync .next del portátil → este Mac ==="
rsync -az --delete -e "ssh -o BatchMode=yes" \
  "$REMOTE_HOST:$REMOTE_DIR/apps/chat-ia/.next/" \
  "$LOCAL_DIR/apps/chat-ia/.next/"
echo "✅ .next copiado. BUILD_ID local: $(cat $LOCAL_DIR/apps/chat-ia/.next/BUILD_ID 2>/dev/null)"

echo ""
echo "=== LISTO. Ahora en este Mac:"
echo "    pm2 restart chat-dev   (o /tmp/start-chat.sh = next start -p 3210)"
echo "    → chat-ia servirá el build de producción CON los fixes."
