#!/bin/bash
# Levanta app-dev (web 3220) y chat-dev (3210). Mata lo que use esos puertos antes.
# Uso: ./scripts/levantar-app-test-chat-test.sh   o   pnpm dev:levantar

cd "$(dirname "$0")/.."

for port in 3220 3210; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Liberando puerto $port (PID $pid)..."
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
done

# Evitar EMFILE (too many open files) en macOS
ulimit -n 10240 2>/dev/null || true

./scripts/iniciar-tunnel.sh >/dev/null 2>&1 || true

echo "Arrancando web (3220) y chat (3210)..."
exec node scripts/levantar-para-proxy.mjs
