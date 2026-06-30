#!/bin/bash
# Build de producción de appEventos en el MacBook Pro 24GB (Tailscale).
#
# USO:
#   bash scripts/build-app-en-portatil.sh all      # encadena todo (foreground)
#   bash scripts/build-app-en-portatil.sh <step>   # ejecuta un step solo
#
# STEPS: check | gitsync | rsync-up | shared | build | rsync-down | restart | verify
#
# WHY sub-comandos: el script monolítico con `nohup ... &` muere silencioso
# entre pasos (observado 2 veces 2026-06-23 — corte tras step 4 sin error).
# Cada step ahora es idempotente y se puede reanudar desde donde fallara.
# Memoria: feedback_builds_portatil_no_background.md
set -euo pipefail

REMOTE_HOST="100.105.48.36"
REMOTE_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
REMOTE_PATH="/opt/homebrew/bin"
BRANCH="${BUILD_BRANCH:-tj/refactor/adelgazar-chat-ia}"
LOCAL_DIR="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
HEAP_MB=8192

step_check() {
  echo "=== check) Verificar portátil online ==="
  ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" 'echo ok' >/dev/null || {
    echo "❌ portátil no accesible (Tailscale activo? portátil encendido?)"; exit 1;
  }
  echo "✅ portátil OK"
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
  echo "✅ node_modules sincronizado"
}

step_shared() {
  echo "=== shared) Rebuild packages/shared en portátil ==="
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
export PATH=$REMOTE_PATH:\$PATH
cd $REMOTE_DIR/packages/shared
npx tsc 2>&1 | tail -5
echo '✅ shared/dist rebuilded'
EOF
}

step_build() {
  echo "=== build) next build appEventos (heap ${HEAP_MB}MB) ==="
  ssh -o BatchMode=yes -T "$REMOTE_HOST" <<EOF
export PATH=$REMOTE_PATH:\$PATH
cd $REMOTE_DIR/apps/appEventos
NODE_OPTIONS=--max-old-space-size=$HEAP_MB NEXT_TELEMETRY_DISABLED=1 pnpm exec next build 2>&1 | tail -20
EOF
  local bid
  bid=$(ssh -o BatchMode=yes "$REMOTE_HOST" "cat $REMOTE_DIR/apps/appEventos/.next/BUILD_ID 2>/dev/null" || echo "")
  [ -z "$bid" ] && { echo "❌ Build NO generó BUILD_ID"; exit 3; }
  echo "✅ BUILD_ID portátil: $bid"
}

step_rsync_down() {
  echo "=== rsync-down) .next portátil → local ==="
  rsync -az --delete -e "ssh -o BatchMode=yes" \
    "$REMOTE_HOST:$REMOTE_DIR/apps/appEventos/.next/" "$LOCAL_DIR/apps/appEventos/.next/"
  echo "✅ BUILD_ID local: $(cat "$LOCAL_DIR/apps/appEventos/.next/BUILD_ID" 2>/dev/null)"
}

step_restart() {
  echo "=== restart) PM2 app-dev (kill zombis + arrancar UNO) ==="
  pm2 delete app-dev 2>/dev/null || true
  pkill -9 -f "next start -p 3220" 2>/dev/null || true
  pkill -9 -f "apps/appEventos/.bin/next" 2>/dev/null || true
  lsof -ti:3220 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 3
  if lsof -ti:3220 >/dev/null 2>&1; then
    echo "⚠️ puerto 3220 AÚN ocupado tras kill"
  fi

  # Path persistente — /tmp se limpia y dispara N restarts (aprendido 30-jun).
  mkdir -p "$HOME/.pm2-scripts"
  cat > "$HOME/.pm2-scripts/start-app.sh" <<'INNER'
#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos
exec pnpm next start -p 3220 -H 0.0.0.0
INNER
  chmod +x "$HOME/.pm2-scripts/start-app.sh"

  pm2 start "$HOME/.pm2-scripts/start-app.sh" --name app-dev --interpreter bash --log /tmp/pm2-app-dev.log 2>&1 | tail -3
  sleep 6
  echo "✅ PM2 status: $(pm2 jlist 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); p=[x for x in d if x['name']=='app-dev']; print(p[0]['pm2_env']['status'] if p else 'NO ENCONTRADO')" 2>/dev/null)"
}

step_verify() {
  echo "=== verify) HTTP + BUILD_ID online ==="
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://app-dev.bodasdehoy.com/ || echo "000")
  echo "HTTP: $code"
  local online_bid
  online_bid=$(curl -s --max-time 10 https://app-dev.bodasdehoy.com/ | grep -oE 'buildId":"[^"]+"' | head -1)
  echo "BUILD_ID online: $online_bid"
  local local_bid
  local_bid=$(cat "$LOCAL_DIR/apps/appEventos/.next/BUILD_ID" 2>/dev/null)
  echo "BUILD_ID local:  $local_bid"
  if [ "$code" = "200" ] && [[ "$online_bid" == *"$local_bid"* ]]; then
    echo "✅ DEPLOY VERIFICADO — chat-dev sirve el build nuevo"
  else
    echo "⚠️ verificación inconsistente — revisar"
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
