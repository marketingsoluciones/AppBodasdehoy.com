#!/usr/bin/env bash
# Deploy chat-ia (Vercel project chat-ia-bodasdehoy) desde la RAÍZ del monorepo.
# Motivo: en Vercel el Root Directory es `apps/chat-ia`. Si ejecutas `vercel deploy`
# dentro de `apps/chat-ia`, la ruta se duplica (…/apps/chat-ia/apps/chat-ia) y falla.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
export VERCEL_ORG_ID="$(node -p "require('$REPO_ROOT/apps/chat-ia/.vercel/project.json').orgId")"
export VERCEL_PROJECT_ID="$(node -p "require('$REPO_ROOT/apps/chat-ia/.vercel/project.json').projectId")"
exec vercel deploy "$@"
