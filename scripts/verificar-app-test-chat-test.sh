#!/usr/bin/env bash
# Verificación autónoma: app-test y chat-test por HTTPS.
# Uso: ./scripts/verificar-app-test-chat-test.sh
# Exit 0 = todo OK. Exit 1 = algo falla (imprime qué hacer).

set -e
APP_URL="${APP_URL:-https://app-test.bodasdehoy.com}"
CHAT_URL="${CHAT_URL:-https://chat-test.bodasdehoy.com}"
FAIL=0

echo "=== Verificación app-test y chat-test ==="
echo ""

# app-test: debe ser 200 o 3xx
CODE_APP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$APP_URL/" 2>/dev/null || echo "000")
if [[ "$CODE_APP" =~ ^(200|301|302|307)$ ]]; then
  echo "✅ app-test: HTTP $CODE_APP"
else
  echo "❌ app-test: HTTP $CODE_APP (esperado 200 o 3xx)"
  echo "   → Revisar: proceso en 8080, config/cloudflared-config.yml app-test → 8080, túnel activo."
  echo "   → Runbook: docs/RUNBOOK-APP-TEST-CHAT-TEST.md"
  FAIL=1
fi

# chat-test: 307 a /en-US__0__light o 200
CODE_CHAT=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$CHAT_URL/" 2>/dev/null || echo "000")
LOCATION=$(curl -sI --connect-timeout 10 "$CHAT_URL/" 2>/dev/null | grep -i "^location:" | tr -d '\r' || true)
if [[ "$CODE_CHAT" == "307" ]] && echo "$LOCATION" | grep -q "en-US__0__light"; then
  echo "✅ chat-test: HTTP 307 → variante (redirect OK)"
elif [[ "$CODE_CHAT" == "200" ]]; then
  echo "✅ chat-test: HTTP 200"
elif [[ "$CODE_CHAT" == "404" ]]; then
  echo "❌ chat-test: HTTP 404"
  echo "   → Desplegar build reciente (middleware hace redirect / → /en-US__0__light)."
  echo "   → Runbook: docs/RUNBOOK-APP-TEST-CHAT-TEST.md"
  FAIL=1
else
  echo "❌ chat-test: HTTP $CODE_CHAT"
  echo "   → Revisar: proceso en 3210, config/cloudflared-config.yml chat-test → 3210, túnel activo."
  echo "   → Runbook: docs/RUNBOOK-APP-TEST-CHAT-TEST.md"
  FAIL=1
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "=== Estado: OK ==="
  exit 0
else
  echo "=== Estado: FALLO — ver docs/RUNBOOK-APP-TEST-CHAT-TEST.md ==="
  exit 1
fi
