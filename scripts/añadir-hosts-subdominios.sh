#!/usr/bin/env bash
# Añade app-test y chat-test a /etc/hosts para que funcionen en esta máquina.
# Ejecutar UNA VEZ (pedirá tu contraseña): sudo ./scripts/añadir-hosts-subdominios.sh

set -e
cd "$(dirname "$0")/.."

for name in app-test chat-test; do
  if grep -q "${name}.bodasdehoy.com" /etc/hosts 2>/dev/null; then
    echo "✅ ${name}.bodasdehoy.com ya está en /etc/hosts"
  else
    echo "127.0.0.1 ${name}.bodasdehoy.com" >> /etc/hosts
    echo "✅ Añadido ${name}.bodasdehoy.com"
  fi
done
echo ""
echo "Listo. URLs que funcionarán (con pnpm dev en marcha):"
echo "  http://app-test.bodasdehoy.com:8080"
echo "  http://chat-test.bodasdehoy.com:3210"
