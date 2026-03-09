#!/usr/bin/env bash
# Inicia el túnel Cloudflare (lobe-chat-harbor) para que app-test y chat-test carguen.
# Sin este proceso, las URLs públicas dan ERR aunque DNS y Cloudflare estén bien.
#
# Config: si existe config/cloudflared-config.yml en el repo, se usa (subdominios versionados).
# Si no, usa ~/.cloudflared/config.yml (cloudflared tunnel run lobe-chat-harbor).
#
# Uso:
#   ./scripts/iniciar-tunnel.sh          # inicia en segundo plano
#   ./scripts/iniciar-tunnel.sh --foreground   # inicia en primer plano (ver logs)

set -euo pipefail
TUNNEL_NAME="${TUNNEL_NAME:-lobe-chat-harbor}"
LOG_DIR="${LOG_DIR:-.}"
LOG_FILE="${LOG_DIR}/cloudflared.log"

# Repo root (donde está config/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_REPO="${REPO_ROOT}/config/cloudflared-config.yml"

if [[ -f "$CONFIG_REPO" ]]; then
  TUNNEL_CMD=(cloudflared tunnel --config "$CONFIG_REPO" run)
  echo "Usando config del repo: $CONFIG_REPO"
else
  TUNNEL_CMD=(cloudflared tunnel run "$TUNNEL_NAME")
fi

if [[ "${1:-}" == "--foreground" ]]; then
  echo "Iniciando túnel en primer plano (Ctrl+C para parar)..."
  exec "${TUNNEL_CMD[@]}"
fi

if command -v cloudflared >/dev/null 2>&1; then
  if pgrep -f "cloudflared" >/dev/null 2>&1; then
    echo "✅ Un túnel cloudflared ya está corriendo (pgrep)."
    exit 0
  fi
  echo "Iniciando túnel $TUNNEL_NAME en segundo plano (log: $LOG_FILE)..."
  nohup "${TUNNEL_CMD[@]}" >> "$LOG_FILE" 2>&1 &
  sleep 2
  if pgrep -f "cloudflared" >/dev/null 2>&1; then
    echo "✅ Túnel iniciado. Prueba: ./scripts/probar-urls-tunnel.sh"
  else
    echo "⚠️  No se pudo comprobar el proceso. Revisa $LOG_FILE y que cloudflared esté instalado y autenticado."
  fi
else
  echo "❌ cloudflared no está instalado o no está en el PATH."
  echo "   Instalación: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi
