#!/bin/bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/Users/juancarlosparra/.bun/bin:$PATH"
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia
# Puerto 3210 — CF tunnel: chat-dev.bodasdehoy.com → 192.168.1.48:3210
#
# Usa next build + next start (igual que appEventos/dev.sh) en vez de next dev --turbopack.
# Motivo: Turbopack compila rutas de forma lazy (312s+ en primera petición),
# lo que provoca 502 Bad Gateway en el CF tunnel (timeout ~30s).
# Con next start todas las rutas están pre-compiladas → respuesta inmediata.
#
# Para hot reload durante desarrollo: usar "pnpm dev:copilot" en localhost directo.
# Para publicar cambios en chat-dev.bodasdehoy.com: pnpm rebuild:chat

# Solo rebuildar si no existe .next o si hay cambios en src desde el último build
if [ ! -f ".next/BUILD_ID" ] || [ -n "$(find src packages -newer .next/BUILD_ID \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | head -1)" ]; then
  echo "[dev.sh] Compilando chat-ia... (primera vez tarda 10-15 min)"
  # Ejecutar next build directamente sin prebuild (lint) ni postbuild (requiere bun)
  ENABLE_OIDC=0 APP_URL=http://localhost:8000 NODE_OPTIONS=--max-old-space-size=8192 NEXT_TELEMETRY_DISABLED=1 pnpm exec next build --no-lint
  if [ $? -ne 0 ]; then
    echo "[dev.sh] ERROR: next build fallido."
    exit 1
  fi
  # copy-locales: necesario para i18n en producción
  npm run copy-locales 2>/dev/null || echo "[dev.sh] Aviso: copy-locales falló (ignorado)"
  echo "[dev.sh] Build completado."
fi

echo "[dev.sh] Arrancando chat-ia en modo producción (puerto 3210)"
exec pnpm next start -p 3210 -H 0.0.0.0
