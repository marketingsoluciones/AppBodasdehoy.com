#!/bin/bash
# Levanta app-test (web 8080) y chat-test (3210). Mata lo que use esos puertos antes.
# Uso: ./scripts/levantar-app-test-chat-test.sh   o   pnpm dev:levantar

cd "$(dirname "$0")/.."

for port in 8080 3210; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Liberando puerto $port (PID $pid)..."
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
done

# Evitar EMFILE (too many open files) en macOS
ulimit -n 10240 2>/dev/null || true

echo "Arrancando web (8080) y chat (3210)..."
exec node scripts/levantar-para-proxy.mjs
