#!/usr/bin/env bash
# Cambia al directorio raíz de este monorepo (donde está pnpm-workspace.yaml).
#
# Uso (recomendado — hace cd en tu shell actual):
#   source scripts/ir-al-monorepo.sh
#
# Solo imprimir la ruta absoluta (útil para cd "$(...)") :
#   ./scripts/ir-al-monorepo.sh --path
#
# Nota (Aider / REPL): una línea que sea solo una ruta con "/" inicial puede
# interpretarse como comando interno, no como ruta. Prefiere:
#   cd "$(./scripts/ir-al-monorepo.sh --path)"

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${1:-}" == "--path" ]]; then
  printf '%s\n' "$ROOT"
  exit 0
fi

if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
  cd "$ROOT"
  echo "Monorepo: $ROOT"
else
  echo "Raíz del monorepo:"
  echo "  $ROOT"
  echo ""
  echo "Para entrar en esta carpeta:"
  echo "  source scripts/ir-al-monorepo.sh"
  echo "  # o:"
  echo "  cd \"${ROOT}\""
fi
