#!/usr/bin/env bash
# E2E Copilot — flujo estandarizado. Ver docs/E2E-COPILOT-ESTANDAR.md
# Un solo navegador. Capa 1: Verificar/levantar app-test y chat-test. Capa 2: Login, abrir Copilot (comprobar que se puede escribir), enviar preguntas, resultado a la derecha, pausa para confirmación. Prohibido abrir varios navegadores.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERIFY="$ROOT/scripts/verificar-app-test-chat-test.sh"
SLEEP_AFTER_START=35

echo "[1/2] Comprobando que el sistema está levantado (app-test + chat-test)..."
if ! bash "$VERIFY" 2>/dev/null; then
  echo "[1/2] No OK. Levantando servicios (app 8080 + chat 3210) y túnel..."
  pnpm dev:levantar &
  sleep 3
  [[ -x "$ROOT/scripts/iniciar-tunnel.sh" ]] && "$ROOT/scripts/iniciar-tunnel.sh" &
  echo "[1/2] Esperando ${SLEEP_AFTER_START}s..."
  sleep $SLEEP_AFTER_START
  if bash "$VERIFY" 2>/dev/null; then
    echo "[1/2] OK — Sistema levantado tras arranque."
  else
    echo "[1/2] AVISO — Verificación sigue fallando. Abriendo navegador de todos modos."
  fi
else
  echo "[1/2] OK — Sistema levantado."
fi

echo ""
echo "[2/2] Abriendo navegador y mostrando cada pregunta al Copilot; tú solo confirmas si la respuesta es correcta."
CI= E2E_HEADED=1 E2E_WAIT_FOR_VISUAL_CONFIRMATION=1 BASE_URL=https://app-test.bodasdehoy.com PLAYWRIGHT_BROWSER=webkit \
  pnpm exec playwright test --config=playwright.config.ts e2e-app/flujo-copilot-confirmacion-visual.spec.ts --headed
echo "Listo."
