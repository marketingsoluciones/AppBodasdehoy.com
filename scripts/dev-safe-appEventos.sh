#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/juancarlosparra/Projects/AppBodasdehoy.com"
APP_DIR="$ROOT/apps/appEventos"
PORT="${1:-3220}"

echo "[dev-safe] Limpiando procesos/puerto $PORT..."
kill -9 "$(lsof -tiTCP:$PORT -sTCP:LISTEN)" 2>/dev/null || true
pkill -f "node_modules/next/dist/bin/next dev" 2>/dev/null || true

echo "[dev-safe] Limpiando cache .next..."
rm -rf "$APP_DIR/.next"

echo "[dev-safe] Arrancando appEventos en $PORT..."
cd "$APP_DIR"
node node_modules/next/dist/bin/next dev -H 127.0.0.1 -p "$PORT"
