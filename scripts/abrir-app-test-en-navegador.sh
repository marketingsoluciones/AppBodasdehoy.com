#!/usr/bin/env bash
# Abre app-test (y opcionalmente chat-test) en el navegador por defecto del sistema.
# Así ves la app y el Copilot sin depender de Playwright.
# Uso: ./scripts/abrir-app-test-en-navegador.sh   o   pnpm abrir:app-test
cd "$(dirname "$0")/.."
open "https://app-test.bodasdehoy.com"
echo "Abriendo https://app-test.bodasdehoy.com en tu navegador."
echo "Si no ves nada, comprueba: pnpm verificar:entornos"
