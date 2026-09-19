#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# get-test-jwt.sh — Login programático Firebase para obtener el mcp_jwt_token (=idToken).
#
# El mcp_jwt_token de chat-ia ES el idToken de Firebase (verificado en EventosAutoAuth:415
# "SOLO usar idToken"). Así que login = POST a Firebase Identity Toolkit signInWithPassword.
# NO necesita navegador ni Playwright.
#
# USO:
#   TEST_EMAIL="user@test" TEST_PASSWORD="..." bash apps/chat-ia/scripts/get-test-jwt.sh
#   (lee NEXT_PUBLIC_FIREBASE_API_KEY de .env.local automáticamente)
#
# Imprime SOLO el idToken en stdout (para capturar: JWT=$(bash get-test-jwt.sh)).
# Los logs van a stderr.
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

err() { echo "$@" >&2; }

if [ -z "${TEST_EMAIL:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
  err "❌ Faltan credenciales. Uso: TEST_EMAIL=... TEST_PASSWORD=... bash $0"
  exit 1
fi

# Leer la Firebase API key del env (sin imprimirla)
API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:-}"
if [ -z "$API_KEY" ] && [ -f .env.local ]; then
  API_KEY="$(grep -E '^NEXT_PUBLIC_FIREBASE_API_KEY' .env.local 2>/dev/null | head -1 | sed -E "s/^[^=]+=['\"]?//; s/['\"]?$//")"
fi
if [ -z "$API_KEY" ]; then
  err "❌ No encuentro NEXT_PUBLIC_FIREBASE_API_KEY (ni en env ni en .env.local)"
  exit 1
fi

err "🔑 Login Firebase para ${TEST_EMAIL}..."
RESP="$(curl -s --max-time 20 \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"returnSecureToken\":true}" 2>/dev/null)"

ID_TOKEN="$(echo "$RESP" | grep -oE '"idToken"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"idToken"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"

if [ -z "$ID_TOKEN" ]; then
  err "❌ Login falló. Respuesta Firebase:"
  err "$(echo "$RESP" | head -c 300)"
  exit 1
fi

LOCAL_ID="$(echo "$RESP" | grep -oE '"localId"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
err "✅ Login OK. firebase_uid=${LOCAL_ID}, idToken len=${#ID_TOKEN}"
# stdout = solo el token (capturable)
echo "$ID_TOKEN"
