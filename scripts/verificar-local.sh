#!/usr/bin/env bash
# Verificación rápida para desarrollo local (app-test + chat-test)
# Uso: ./scripts/verificar-local.sh

set -e
echo "=== Verificación desarrollo local (app-test / chat-test) ==="
echo ""

# 1. /etc/hosts
echo "1. Comprobando /etc/hosts..."
if grep -q "app-test.bodasdehoy.com" /etc/hosts 2>/dev/null && grep -q "chat-test.bodasdehoy.com" /etc/hosts 2>/dev/null; then
  echo "   ✅ app-test.bodasdehoy.com y chat-test.bodasdehoy.com están en /etc/hosts"
else
  echo "   ❌ Faltan entradas en /etc/hosts. Añade:"
  echo "      127.0.0.1   app-test.bodasdehoy.com"
  echo "      127.0.0.1   chat-test.bodasdehoy.com"
  echo "      (sudo nano /etc/hosts)"
fi
echo ""

# 2. Puertos en uso
echo "2. Comprobando si los servidores están levantados (puertos 8080 y 3210)..."
WEB_OK=0
COPILOT_OK=0
if command -v lsof >/dev/null 2>&1; then
  lsof -i :8080 -sTCP:LISTEN -t >/dev/null 2>&1 && WEB_OK=1
  lsof -i :3210 -sTCP:LISTEN -t >/dev/null 2>&1 && COPILOT_OK=1
fi
if [ "$WEB_OK" -eq 1 ]; then
  echo "   ✅ Puerto 8080 (app web) en uso"
else
  echo "   ⚠️  Puerto 8080 no está en uso. Levanta con: pnpm dev:local o pnpm dev:web:local"
fi
if [ "$COPILOT_OK" -eq 1 ]; then
  echo "   ✅ Puerto 3210 (copilot) en uso"
else
  echo "   ⚠️  Puerto 3210 no está en uso. Levanta con: pnpm dev:local o pnpm dev:copilot:local"
fi
echo ""

# 3. Resolución DNS local
echo "3. Resolución de dominios (debe ser 127.0.0.1):"
if command -v ping >/dev/null 2>&1; then
  APP_IP=$(ping -c 1 -n app-test.bodasdehoy.com 2>/dev/null | grep -oE '\([0-9.]+\)' | tr -d '()' || echo "")
  if [ "$APP_IP" = "127.0.0.1" ]; then
    echo "   ✅ app-test.bodasdehoy.com → 127.0.0.1"
  else
    echo "   ❌ app-test.bodasdehoy.com no resuelve a 127.0.0.1 (¿/etc/hosts?)"
  fi
  CHAT_IP=$(ping -c 1 -n chat-test.bodasdehoy.com 2>/dev/null | grep -oE '\([0-9.]+\)' | tr -d '()' || echo "")
  if [ "$CHAT_IP" = "127.0.0.1" ]; then
    echo "   ✅ chat-test.bodasdehoy.com → 127.0.0.1"
  else
    echo "   ❌ chat-test.bodasdehoy.com no resuelve a 127.0.0.1 (¿/etc/hosts?)"
  fi
else
  echo "   (ping no disponible, salta esta comprobación)"
fi
echo ""

echo "=== URLs para abrir en el navegador ==="
echo "   App:   http://app-test.bodasdehoy.com:8080"
echo "   Chat:  http://chat-test.bodasdehoy.com:3210"
echo ""
echo "Si la pantalla sigue en blanco: espera 2–3 segundos, abre F12 → Console y revisa errores en rojo."
echo "Limpia caché Next: pnpm clean:next y vuelve a levantar con pnpm dev:local"
