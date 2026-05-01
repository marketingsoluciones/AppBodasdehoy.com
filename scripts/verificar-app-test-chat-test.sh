#!/usr/bin/env bash
# Verificación autónoma: app-dev y chat-dev por HTTPS.
# Uso: ./scripts/verificar-app-test-chat-test.sh
# Exit 0 = todo OK. Exit 1 = algo falla (imprime qué hacer).

set -e
APP_URL="${APP_URL:-https://app-dev.bodasdehoy.com}"
CHAT_URL="${CHAT_URL:-https://chat-dev.bodasdehoy.com}"
FAIL=0

echo "=== Verificación app-dev y chat-dev ==="
echo ""

# app-dev: debe ser 200 o 3xx
CODE_APP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$APP_URL/" 2>/dev/null || echo "000")
if [[ "$CODE_APP" =~ ^(200|301|302|307)$ ]]; then
  echo "✅ app-dev: HTTP $CODE_APP"
else
  echo "❌ app-dev: HTTP $CODE_APP (esperado 200 o 3xx)"
  echo "   → Revisar: proceso en 3220, config/cloudflared-config.yml app-dev → 3220, túnel activo."
  FAIL=1
fi

# chat-dev: 307 a /en-US__0__light o 200
CODE_CHAT=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$CHAT_URL/" 2>/dev/null || echo "000")
LOCATION=$(curl -sI --connect-timeout 10 "$CHAT_URL/" 2>/dev/null | grep -i "^location:" | tr -d '\r' || true)
if [[ "$CODE_CHAT" == "307" ]] && echo "$LOCATION" | grep -q "en-US__0__light"; then
  echo "✅ chat-dev: HTTP 307 → variante (redirect OK)"
elif [[ "$CODE_CHAT" == "200" ]]; then
  echo "✅ chat-dev: HTTP 200"
elif [[ "$CODE_CHAT" == "404" ]]; then
  echo "❌ chat-dev: HTTP 404"
  echo "   → Levantar chat-ia local (3210) y comprobar el ingress del túnel."
  FAIL=1
else
  echo "❌ chat-dev: HTTP $CODE_CHAT"
  echo "   → Revisar: proceso en 3210, config/cloudflared-config.yml chat-dev → 3210, túnel activo."
  FAIL=1
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "=== Estado: OK ==="
  exit 0
else
  echo "=== Estado: FALLO ==="
  exit 1
fi
