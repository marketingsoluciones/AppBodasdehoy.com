#!/usr/bin/env bash
# Obtiene un idToken de Firebase (email/password) para usarlo en pruebas contra api-ia.
# Uso:
#   TEST_USER_EMAIL=usuario@ejemplo.com TEST_USER_PASSWORD='clave' ./scripts/get-firebase-token.sh
#   export FIREBASE_JWT=$(TEST_USER_EMAIL=... TEST_USER_PASSWORD=... ./scripts/get-firebase-token.sh)
# Las credenciales NUNCA se guardan en el repo; solo por env. El front puede facilitar email/password.
set -euo pipefail

API_KEY="AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM"
URL="https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}"

EMAIL="${TEST_USER_EMAIL:-}"
PASSWORD="${TEST_USER_PASSWORD:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Uso: TEST_USER_EMAIL=... TEST_USER_PASSWORD=... $0" >&2
  echo "Las credenciales las puede facilitar el front. No las guardes en el repo." >&2
  exit 1
fi

BODY=$(jq -n --arg email "$EMAIL" --arg password "$PASSWORD" \
  '{email: $email, password: $password, returnSecureToken: true}')

RESP=$(curl -sS --max-time 15 -X POST "$URL" -H "Content-Type: application/json" -d "$BODY") || true

if echo "$RESP" | jq -e '.idToken' >/dev/null 2>&1; then
  echo "$RESP" | jq -r '.idToken'
else
  echo "Error obteniendo token: $(echo "$RESP" | jq -r '.error.message // .error // .')" >&2
  exit 1
fi
