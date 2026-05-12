#!/usr/bin/env bash
# Carga variables públicas (.env.e2e.<entorno>) y secretos (.env.e2e.<entorno>.local) desde la raíz del monorepo.
# Uso: bash scripts/with-root-e2e-env.sh test|dev|prod <comando...>
# Ej.: bash scripts/with-root-e2e-env.sh test playwright test --config=playwright.config.ts e2e-app/smoke.spec.ts
set -euo pipefail
set +H
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV="${1:?Uso: $0 test|dev|prod <comando...>}"
shift
case "$ENV" in
  test|dev|prod) ;;
  *) echo "Entorno inválido: $ENV (use test, dev o prod)" >&2; exit 1 ;;
esac
set -a
f1="$ROOT/.env.e2e.$ENV"
f2="$ROOT/.env.e2e.${ENV}.local"
[[ -f "$f1" ]] && # shellcheck disable=SC1090
source "$f1"
[[ -f "$f2" ]] && source "$f2"
set +a
export E2E_ENV="${E2E_ENV:-$ENV}"
exec "$@"
