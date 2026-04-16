#!/usr/bin/env bash
# Sistema de testing: verificación de entornos + opcionalmente smoke E2E.
# Uso: pnpm test:sistema
# Si CI=true o TEST_SISTEMA_E2E=1, tras verificar entornos ejecuta smoke E2E (headless).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERIFY="$ROOT/scripts/verificar-app-test-chat-test.sh"

echo "[1/2] Verificando entornos (app-test + chat-test)..."
if ! bash "$VERIFY"; then
  echo "[1/2] FALLO — Revisar docs/RUNBOOK-APP-TEST-CHAT-TEST.md"
  exit 1
fi
echo ""

if [[ "$CI" == "true" || "$TEST_SISTEMA_E2E" == "1" ]]; then
  echo "[2/2] Ejecutando smoke E2E (app-test)..."
  BASE_URL="${BASE_URL:-https://app-test.bodasdehoy.com}" \
    pnpm exec playwright test --config=playwright.config.ts e2e-app/smoke.spec.ts --reporter=list
  echo "[2/2] Smoke E2E OK."
else
  echo "[2/2] Omitido (solo verificación). Para incluir smoke E2E: TEST_SISTEMA_E2E=1 pnpm test:sistema"
fi

echo ""
echo "=== Sistema de testing: OK ==="
