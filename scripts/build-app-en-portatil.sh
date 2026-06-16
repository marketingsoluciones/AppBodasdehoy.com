#!/bin/bash
# Build de producción de appEventos en el MacBook Pro 24GB (Tailscale) y traer el .next.
set -e
REMOTE_HOST="100.105.48.36"
REMOTE_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
REMOTE_PATH="/opt/homebrew/bin"
BRANCH="tj/refactor/adelgazar-chat-ia"
LOCAL_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
HEAP_MB=8192

echo "=== 1) Verificar portátil ==="
ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" 'echo ok' >/dev/null || { echo "❌ portátil no accesible"; exit 1; }

echo "=== 2) Actualizar repo del portátil a $BRANCH ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR && \
  git stash 2>/dev/null; git fetch origin $BRANCH 2>&1 | tail -1 && \
  git reset --hard FETCH_HEAD 2>&1 | tail -1 && echo 'repo en:' \$(git log --oneline -1)"

echo "=== 3) Sincronizar node_modules ==="
rsync -az --delete -e "ssh -o BatchMode=yes" "$LOCAL_DIR/node_modules/" "$REMOTE_HOST:$REMOTE_DIR/node_modules/"

echo "=== 4) next build appEventos (heap ${HEAP_MB}MB) ==="
ssh -o BatchMode=yes "$REMOTE_HOST" "export PATH=$REMOTE_PATH:\$PATH; cd $REMOTE_DIR/apps/appEventos && \
  NODE_OPTIONS=--max-old-space-size=$HEAP_MB NEXT_TELEMETRY_DISABLED=1 pnpm exec next build 2>&1 | tail -15"

echo "=== 5) Verificar BUILD_ID ==="
BID=$(ssh -o BatchMode=yes "$REMOTE_HOST" "cat $REMOTE_DIR/apps/appEventos/.next/BUILD_ID 2>/dev/null" || echo "")
[ -z "$BID" ] && { echo "❌ Build NO generó BUILD_ID"; exit 3; }
echo "✅ BUILD_ID portátil: $BID"

echo "=== 6) rsync .next del portátil → este Mac ==="
rsync -az --delete -e "ssh -o BatchMode=yes" "$REMOTE_HOST:$REMOTE_DIR/apps/appEventos/.next/" "$LOCAL_DIR/apps/appEventos/.next/"
echo "✅ .next copiado. BUILD_ID local: $(cat $LOCAL_DIR/apps/appEventos/.next/BUILD_ID 2>/dev/null)"

echo "=== 7) Reiniciar app-dev (matar zombis por patrón + arrancar UNO) ==="
pm2 delete app-dev 2>/dev/null || true
pkill -9 -f "next start -p 3220" 2>/dev/null || true
lsof -ti:3220 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2
cat > /tmp/start-app.sh <<'EOF'
#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
exec pnpm next start -p 3220 -H 0.0.0.0
EOF
chmod +x /tmp/start-app.sh
pm2 start /tmp/start-app.sh --name app-dev --log /tmp/pm2-app.log 2>&1 | tail -1
echo "=== LISTO appEventos. Verifica: curl localhost:3220/"
