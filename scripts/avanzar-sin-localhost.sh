#!/usr/bin/env bash
# Trabajar con el dominio app-test/chat-test SIN usar localhost.
# Opción A: En esta máquina → /etc/hosts + http con puerto (Firebase acepta el dominio).
# Opción B: Cuando Cloudflare esté configurado → https sin puerto.
# Uso: ./scripts/avanzar-sin-localhost.sh [--añadir-hosts]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ADD_HOSTS=false
[ "$1" = "--añadir-hosts" ] && ADD_HOSTS=true

echo "=== Trabajar con app-test / chat-test (no localhost) ==="
echo ""

# 1. /etc/hosts
echo "1. /etc/hosts (para que app-test y chat-test resuelvan en esta máquina):"
MISSING=""
grep -q "app-test.bodasdehoy.com" /etc/hosts 2>/dev/null || MISSING="app-test"
grep -q "chat-test.bodasdehoy.com" /etc/hosts 2>/dev/null || MISSING="${MISSING:+$MISSING }chat-test"

if [ -z "$MISSING" ]; then
  echo "   ✅ app-test y chat-test ya están en /etc/hosts"
else
  echo "   ⚠️  Faltan: $MISSING"
  if [ "$ADD_HOSTS" = true ]; then
    echo "   Añadiendo entradas (pedirá sudo)..."
    for name in app-test chat-test; do
      if ! grep -q "${name}.bodasdehoy.com" /etc/hosts 2>/dev/null; then
        echo "127.0.0.1 ${name}.bodasdehoy.com" | sudo tee -a /etc/hosts
      fi
    done
    echo "   ✅ Hecho. Comprueba con: grep -E 'app-test|chat-test' /etc/hosts"
  else
    echo "   Ejecuta para añadirlos:"
    echo "   echo '127.0.0.1 app-test.bodasdehoy.com' | sudo tee -a /etc/hosts"
    echo "   echo '127.0.0.1 chat-test.bodasdehoy.com' | sudo tee -a /etc/hosts"
    echo "   O ejecuta este script con: $0 --añadir-hosts"
  fi
fi
echo ""

# 2. Puertos
echo "2. Servicios (web 8080, Copilot 3210):"
WEB_OK=false
COPILOT_OK=false
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:8080 2>/dev/null | grep -q "200\|301\|302\|304" && WEB_OK=true
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://127.0.0.1:3210 2>/dev/null | grep -q "200\|301\|302\|304" && COPILOT_OK=true

if [ "$WEB_OK" = true ]; then echo "   ✅ Web (8080) responde"; else echo "   ❌ Web no responde → en otra terminal: pnpm dev (o pnpm dev:web)"; fi
if [ "$COPILOT_OK" = true ]; then echo "   ✅ Copilot (3210) responde"; else echo "   ❌ Copilot no responde → en otra terminal: pnpm dev (o pnpm dev:copilot)"; fi
echo ""

# 3. URLs a usar (dominio, no localhost)
echo "3. URLs que debes usar (dominio real → login y Copilot funcionan):"
echo ""
echo "   Web (login, eventos, Copilot en iframe):"
echo "   → http://app-test.bodasdehoy.com:8080"
echo "   → Login: http://app-test.bodasdehoy.com:8080/login?d=app"
echo ""
echo "   Copilot (solo chat):"
echo "   → http://chat-test.bodasdehoy.com:3210"
echo ""
echo "   (No uses http://localhost:8080 ni localhost:3210 para el flujo con login.)"
echo ""

# 4. Comprobar si con /etc/hosts las URLs responden
if [ -z "$MISSING" ] && [ "$WEB_OK" = true ] && [ "$COPILOT_OK" = true ]; then
  if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://app-test.bodasdehoy.com:8080 2>/dev/null | grep -q "200\|301\|302\|304"; then
    echo "   ✅ http://app-test.bodasdehoy.com:8080 responde OK"
  fi
  if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://chat-test.bodasdehoy.com:3210 2>/dev/null | grep -q "200\|301\|302\|304"; then
    echo "   ✅ http://chat-test.bodasdehoy.com:3210 responde OK"
  fi
  echo ""
  echo "=== Listo: abre http://app-test.bodasdehoy.com:8080 y haz login. ==="
else
  echo "=== Cuando tengas /etc/hosts y pnpm dev en marcha, usa las URLs de arriba. ==="
fi
echo ""
echo "Para que funcione por HTTPS sin puerto (app-test.bodasdehoy.com y chat-test.bodasdehoy.com):"
echo "  alguien con Cloudflare debe configurar DNS + Public Hostnames. Envía la petición: ./scripts/slack-pedir-cloudflare.sh"
echo ""
