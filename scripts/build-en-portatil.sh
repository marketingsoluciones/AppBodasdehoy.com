#!/bin/bash
# Build de producción de chat-ia en el MacBook Pro 24GB (Tailscale).
# Este Mac (16GB) da OOM al buildear chat-ia (~21k módulos). Portátil tiene 24GB.
#
# USO:
#   bash scripts/build-en-portatil.sh all      # encadena todo (foreground)
#   bash scripts/build-en-portatil.sh <step>   # ejecuta un step solo
#
# STEPS: check | gitsync | rsync-up | shared | build | rsync-down | restart | verify
#
# APRENDIZAJES (builds reales):
#   - HEAP 16GB (8GB da OOM en chat-ia).
#   - RSYNC node_modules (NO pnpm install): repo tiene deps "fantasma" (ollama,
#     ua-parser-js) importadas pero NO declaradas → pnpm install las pierde.
#   - Build tarda ~4 min (97s webpack + ~2min generate static pages SSG).
#   - Script monolítico con `nohup ... &` muere silencioso entre steps.
#     Por eso ahora son sub-comandos idempotentes. Memoria:
#     feedback_builds_portatil_no_background.md
set -euo pipefail

REMOTE_HOST="100.105.48.36"
REMOTE_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
REMOTE_PATH="/opt/homebrew/bin"
BRANCH="${BUILD_BRANCH:-tj/refactor/adelgazar-chat-ia}"
LOCAL_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
HEAP_MB=16384

step_check() {
  echo "=== check) Verificar portátil online ==="
  ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" 'echo ok' >/dev/null || {
    echo "❌ portátil no accesible (Tailscale activo? portátil encendido?)"; exit 1;
  }
  local unused_mb
  unused_mb=$(ssh -o BatchMode=yes "$REMOTE_HOST" "top -l 1 | awk '/PhysMem/{for(i=1;i<=NF;i++)if(\$i~/unused/){gsub(/[A-Z]/,\"\",\$(i-1));print \$(i-1)}}'" 2>/dev/null || echo "?")
  echo "✅ portátil OK — RAM unused: ${unused_mb}MB (heap build: ${HEAP_MB}MB)"
}

step_gitsync() {
  echo "=== gitsync) Actualizar repo del portátil a $BRANCH ==="
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
export PATH=$REMOTE_PATH:\$PATH
cd $REMOTE_DIR
git stash 2>/dev/null || true
git fetch origin $BRANCH 2>&1 | tail -1
git reset --hard FETCH_HEAD 2>&1 | tail -1
echo "repo en: \$(git log --oneline -1)"
EOF
}

step_rsync_up() {
  echo "=== rsync-up) node_modules local → portátil ==="
  rsync -az --delete -e "ssh -o BatchMode=yes" \
    "$LOCAL_DIR/node_modules/" "$REMOTE_HOST:$REMOTE_DIR/node_modules/"
  rsync -az --delete -e "ssh -o BatchMode=yes" \
    "$LOCAL_DIR/apps/chat-ia/node_modules/" "$REMOTE_HOST:$REMOTE_DIR/apps/chat-ia/node_modules/"
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
mkdir -p "$REMOTE_DIR/apps/chat-ia/node_modules/@lobechat"
ln -sfn "$REMOTE_DIR/apps/chat-ia/packages/model-runtime" \
  "$REMOTE_DIR/apps/chat-ia/node_modules/@lobechat/model-runtime"
ln -sfn "$REMOTE_DIR/node_modules/.pnpm/ollama@0.6.3/node_modules/ollama" \
  "$REMOTE_DIR/apps/chat-ia/node_modules/ollama"
EOF
  echo "✅ node_modules raíz + chat-ia sincronizados (workspace links reparados)"
}

step_shared() {
  echo "=== shared) Rebuild packages compartidos (main→dist) en portátil ==="
  # chat-ia BUNDLEA el dist de estos packages (no el src) y el dist está gitignored,
  # así que gitsync NO lo trae → hay que recompilarlo aquí o el build usa código viejo.
  # (10-ago: un fix en auth-ui/LoginForm no llegó a chat-dev por saltarse auth-ui.)
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
export PATH=$REMOTE_PATH:\$PATH
for pkg in shared auth-ui; do
  echo "--- tsc packages/\$pkg ---"
  cd $REMOTE_DIR/packages/\$pkg && npx tsc 2>&1 | tail -5
done
echo '✅ shared + auth-ui dist rebuilded'
EOF
}

step_build() {
  echo "=== build) next build chat-ia (heap ${HEAP_MB}MB, ~4 min) ==="
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
export PATH=$REMOTE_PATH:\$PATH
cd $REMOTE_DIR/apps/chat-ia
NODE_OPTIONS=--max-old-space-size=$HEAP_MB NEXT_TELEMETRY_DISABLED=1 pnpm exec next build --no-lint 2>&1 | tail -20
EOF
  local bid
  bid=$(ssh -o BatchMode=yes "$REMOTE_HOST" "cat $REMOTE_DIR/apps/chat-ia/.next/BUILD_ID 2>/dev/null" || echo "")
  [ -z "$bid" ] && { echo "❌ Build NO generó BUILD_ID (¿OOM?)"; exit 3; }
  echo "✅ BUILD_ID portátil: $bid"
}

step_rsync_down() {
  echo "=== rsync-down) .next + public/sw.* portátil → local ==="
  rsync -az --delete -e "ssh -o BatchMode=yes" \
    "$REMOTE_HOST:$REMOTE_DIR/apps/chat-ia/.next/" "$LOCAL_DIR/apps/chat-ia/.next/"
  # Serwist genera public/sw.js + sw.js.map durante el build. Sin esto,
  # Next start sirve el fallback SPA en /sw.js (HTML) y las Web Push notifs
  # nunca llegan al browser. Ver docs/SPRINT-4-WEB-PUSH.md.
  rsync -az -e "ssh -o BatchMode=yes" \
    --include="sw.js" --include="sw.js.map" --exclude="*" \
    "$REMOTE_HOST:$REMOTE_DIR/apps/chat-ia/public/" "$LOCAL_DIR/apps/chat-ia/public/"
  echo "✅ BUILD_ID local: $(cat "$LOCAL_DIR/apps/chat-ia/.next/BUILD_ID" 2>/dev/null)"
  echo "✅ sw.js local: $(ls -la "$LOCAL_DIR/apps/chat-ia/public/sw.js" 2>/dev/null | awk '{print $5" bytes"}' || echo 'MISSING')"
}

step_restart() {
  echo "=== restart) PM2 chat-dev (kill zombis + arrancar UNO) ==="
  pm2 delete chat-dev 2>/dev/null || true
  pkill -9 -f "next start -p 3210" 2>/dev/null || true
  pkill -9 -f "apps/chat-ia/.bin/next" 2>/dev/null || true
  lsof -ti:3210 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 3
  if lsof -ti:3210 >/dev/null 2>&1; then
    echo "⚠️ puerto 3210 AÚN ocupado tras kill — revisar zombis"
  fi

  # Path persistente — /tmp se limpia y dispara 561 restarts (aprendido 30-jun).
  mkdir -p "$HOME/.pm2-scripts"
  cat > "$HOME/.pm2-scripts/start-chat.sh" <<'INNER'
#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
exec pnpm next start -p 3210 -H 0.0.0.0
INNER
  chmod +x "$HOME/.pm2-scripts/start-chat.sh"

  pm2 start "$HOME/.pm2-scripts/start-chat.sh" --name chat-dev --interpreter bash --log /tmp/pm2-chat-dev.log 2>&1 | tail -3
  sleep 8
  echo "✅ PM2 status: $(pm2 jlist 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); p=[x for x in d if x['name']=='chat-dev']; print(p[0]['pm2_env']['status'] if p else 'NO ENCONTRADO')" 2>/dev/null)"
}

step_verify() {
  echo "=== verify) HTTP + BUILD_ID online ==="
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://chat-dev.bodasdehoy.com/ || echo "000")
  echo "HTTP: $code"
  local local_bid
  local_bid=$(cat "$LOCAL_DIR/apps/chat-ia/.next/BUILD_ID" 2>/dev/null)
  echo "BUILD_ID local: $local_bid"
  local match
  # grep -F (literal) + -e (anti-flag-injection): BUILD_IDs pueden empezar con `-`
  match=$(curl -s --max-time 10 https://chat-dev.bodasdehoy.com/chat | grep -F -c -e "$local_bid" || echo "0")
  if [ "$code" = "200" ] && [ "$match" -ge 1 ]; then
    echo "✅ DEPLOY VERIFICADO — chat-dev sirve el build nuevo"
  else
    echo "⚠️ verificación inconsistente (HTTP=$code, matches=$match)"
  fi
}

run_all() {
  step_check
  step_gitsync
  step_rsync_up
  step_shared
  step_build
  step_rsync_down
  step_restart
  step_verify
}

cmd="${1:-all}"
case "$cmd" in
  check)       step_check ;;
  gitsync)     step_gitsync ;;
  rsync-up)    step_rsync_up ;;
  shared)      step_shared ;;
  build)       step_build ;;
  rsync-down)  step_rsync_down ;;
  restart)     step_restart ;;
  verify)      step_verify ;;
  all)         run_all ;;
  *)
    echo "USO: $0 {check|gitsync|rsync-up|shared|build|rsync-down|restart|verify|all}"
    exit 2
    ;;
esac
