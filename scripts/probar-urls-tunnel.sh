#!/usr/bin/env bash
# Probar desde terminal que las URLs del tunnel (app-test, chat-test y el resto) responden.
# Uso: ./scripts/probar-urls-tunnel.sh
# Requiere: curl

set -e
echo "=== Probando URLs (tunnel lobe-chat-harbor) ==="
echo ""

test_url() {
  local url="$1"
  local name="$2"
  local code
  # Siempre pasar URL entre comillas para que ? y & no los interprete zsh
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$url" 2>/dev/null) || code="ERR"
  if [[ "$code" == "200" || "$code" == "301" || "$code" == "302" || "$code" == "304" ]]; then
    echo "  OK   $code  $name"
    echo "       $url"
  else
    echo "  FAIL $code  $name"
    echo "       $url"
  fi
  echo ""
}

echo "--- Básicos (app-test, chat-test) ---"
test_url "https://app-test.bodasdehoy.com/" "app-test (web)"
test_url "https://app-test.bodasdehoy.com/login?d=app" "app-test login"
test_url "https://chat-test.bodasdehoy.com/" "chat-test (Copilot)"

echo "--- Otros dominios en este equipo (mismo tunnel) ---"
test_url "https://chat-test.eventosorganizador.com/" "chat-test eventosorganizador"
test_url "https://auth-test.bodasdehoy.com/" "auth-test"
test_url "https://api-ia.bodasdehoy.com/health" "api-ia (remoto)"
test_url "https://backend-chat-test.bodasdehoy.com/" "backend-chat-test (remoto)"
test_url "https://crm-leads.eventosorganizador.com/" "crm-leads"
test_url "https://python-api.eventosorganizador.com/" "python-api"

echo "=== Fin. Si OK = DNS/Public Hostnames correctos; si FAIL = revisar Cloudflare (CNAME + Public Hostnames). ==="
