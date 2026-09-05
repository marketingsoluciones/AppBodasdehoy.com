#!/usr/bin/env bash
# Verificación rápida para desarrollo local (app-test + chat-test)
# Uso: ./scripts/verificar-local.sh

set -e
echo "=== Verificación desarrollo local (web + chat) ==="
echo ""

# 1. /etc/hosts
echo "1. Comprobando /etc/hosts..."
HAS_APP_TEST_HOST=0
HAS_CHAT_TEST_HOST=0
HAS_APP_DEV_HOST=0
HAS_CHAT_DEV_HOST=0

grep -q "app-test.bodasdehoy.com" /etc/hosts 2>/dev/null && HAS_APP_TEST_HOST=1
grep -q "chat-test.bodasdehoy.com" /etc/hosts 2>/dev/null && HAS_CHAT_TEST_HOST=1
grep -q "app-dev.bodasdehoy.com" /etc/hosts 2>/dev/null && HAS_APP_DEV_HOST=1
grep -q "chat-dev.bodasdehoy.com" /etc/hosts 2>/dev/null && HAS_CHAT_DEV_HOST=1

if [ "$HAS_APP_TEST_HOST" -eq 1 ] && [ "$HAS_CHAT_TEST_HOST" -eq 1 ]; then
  echo "   ✅ app-test.bodasdehoy.com y chat-test.bodasdehoy.com están en /etc/hosts"
elif [ "$HAS_APP_DEV_HOST" -eq 1 ] && [ "$HAS_CHAT_DEV_HOST" -eq 1 ]; then
  echo "   ✅ app-dev.bodasdehoy.com y chat-dev.bodasdehoy.com están en /etc/hosts"
else
  echo "   ⚠️  No detecto entradas (esto solo es necesario si quieres usar subdominios en local sin túnel)."
  echo "   Añade (uno de estos pares):"
  echo "      127.0.0.1   app-test.bodasdehoy.com"
  echo "      127.0.0.1   chat-test.bodasdehoy.com"
  echo "      127.0.0.1   app-dev.bodasdehoy.com"
  echo "      127.0.0.1   chat-dev.bodasdehoy.com"
  echo "      (sudo nano /etc/hosts)"
fi
echo ""

# 2. Puertos en uso
echo "2. Comprobando si los servidores están levantados (puertos 3220/8080 y 3210)..."
WEB_OK=0
WEB_PORT=""
COPILOT_OK=0
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    WEB_OK=1
    WEB_PORT="8080"
  elif lsof -i :3220 -sTCP:LISTEN -t >/dev/null 2>&1; then
    WEB_OK=1
    WEB_PORT="3220"
  fi
  lsof -i :3210 -sTCP:LISTEN -t >/dev/null 2>&1 && COPILOT_OK=1
fi
if [ "$WEB_OK" -eq 1 ]; then
  echo "   ✅ Web en uso (puerto $WEB_PORT)"
else
  echo "   ⚠️  Web no está en uso (ni 8080 ni 3220). Levanta con: pnpm dev:levantar (o pnpm dev:web / pnpm dev:web:local)"
fi
if [ "$COPILOT_OK" -eq 1 ]; then
  echo "   ✅ Puerto 3210 (copilot) en uso"
else
  echo "   ⚠️  Puerto 3210 no está en uso. Levanta con: pnpm dev:levantar (o pnpm dev:copilot / pnpm dev:copilot:local)"
fi
echo ""

# 3. Resolución DNS local
echo "3. Resolución de dominios (debe ser 127.0.0.1):"
if command -v ping >/dev/null 2>&1; then
  if [ "$HAS_APP_TEST_HOST" -eq 1 ]; then
    APP_IP=$(ping -c 1 -n app-test.bodasdehoy.com 2>/dev/null | grep -oE '\([0-9.]+\)' | tr -d '()' || echo "")
    if [ "$APP_IP" = "127.0.0.1" ]; then
      echo "   ✅ app-test.bodasdehoy.com → 127.0.0.1"
    else
      echo "   ❌ app-test.bodasdehoy.com no resuelve a 127.0.0.1 (¿/etc/hosts?)"
    fi
  else
    echo "   (app-test.bodasdehoy.com no está en /etc/hosts; se omite)"
  fi

  if [ "$HAS_CHAT_TEST_HOST" -eq 1 ]; then
    CHAT_IP=$(ping -c 1 -n chat-test.bodasdehoy.com 2>/dev/null | grep -oE '\([0-9.]+\)' | tr -d '()' || echo "")
    if [ "$CHAT_IP" = "127.0.0.1" ]; then
      echo "   ✅ chat-test.bodasdehoy.com → 127.0.0.1"
    else
      echo "   ❌ chat-test.bodasdehoy.com no resuelve a 127.0.0.1 (¿/etc/hosts?)"
    fi
  else
    echo "   (chat-test.bodasdehoy.com no está en /etc/hosts; se omite)"
  fi
else
  echo "   (ping no disponible, salta esta comprobación)"
fi
echo ""

echo "=== URLs para abrir en el navegador ==="
if [ "$WEB_OK" -eq 1 ] && [ "$WEB_PORT" = "8080" ]; then
  echo "   Web:   http://127.0.0.1:8080"
elif [ "$WEB_OK" -eq 1 ] && [ "$WEB_PORT" = "3220" ]; then
  echo "   Web:   http://127.0.0.1:3220"
else
  echo "   Web:   (no levantado)"
fi
echo "   Chat:  http://127.0.0.1:3210"
echo "   Túnel: https://app-dev.bodasdehoy.com y https://chat-dev.bodasdehoy.com"
echo ""
echo "Si la pantalla sigue en blanco: espera 2–3 segundos, abre F12 → Console y revisa errores en rojo."
echo "Limpia caché Next: pnpm clean:next y vuelve a levantar con pnpm dev:levantar"
