#!/usr/bin/env bash
# Verificación pasos 1 y 2: tests de la web + comprobar que la API responde.
# Uso: desde la raíz del monorepo, ./scripts/verificar-copilot-embed.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Paso 1: Tests de apps/web (datos reales, fixtures) ==="
echo "Incluye: copilotChat (contrato, SSE event_card/usage/reasoning, historial API2, fallback),"
echo "  /api/chat/messages, /api/copilot/chat-history, /api/copilot/chat (body, 503)."
echo "Si falla 'jest: command not found', ejecuta antes: pnpm install (o pnpm install --no-frozen-lockfile)"
echo "Ver también: docs/PROBAR-SIN-NAVEGADOR.md (validar sin navegador)"
pnpm test:web
echo ""

echo "=== Paso 2: APIs de la web (sin levantar servidor) ==="
echo "Para comprobar en local: ejecuta 'pnpm dev:web:local' y en otra terminal:"
echo "  curl -s http://127.0.0.1:8080/api/health"
echo "  curl -s 'http://127.0.0.1:8080/api/chat/messages?sessionId=test123'"
echo "  curl -s -X POST -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hola\"}],\"stream\":false}' http://127.0.0.1:8080/api/copilot/chat  # requiere JWT en header Authorization"
echo ""
echo "Listo."
