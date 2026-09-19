#!/usr/bin/env bash
# Deploy app eventos (Vercel project app-bodasdehoy-com). El enlace `.vercel` está en la raíz del monorepo.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
exec vercel deploy "$@"
