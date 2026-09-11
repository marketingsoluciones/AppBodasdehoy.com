#!/usr/bin/env bash
# Pre-calienta las rutas pesadas de chat-ia tras arrancar el dev server.
#
# Por qué: chat-ia (fork LobeChat) compila ~40k módulos por ruta on-demand en dev.
# La 1ª vez que abres /chat esperas ~10min. Este script dispara esas compilaciones
# en background JUSTO tras arrancar, para que cuando llegues ya estén listas (200 rápido).
#
# Uso:
#   bash scripts/warmup-chat-ia.sh          # calienta rutas por defecto
#   PORT=3210 bash scripts/warmup-chat-ia.sh
#
# Recomendado: ejecutarlo justo después de `pm2 start "pnpm dev:local" ...`

set -u
PORT="${PORT:-3210}"
BASE="http://localhost:${PORT}"
CURL="$(command -v curl || echo /usr/bin/curl)"

# Rutas más usadas (las que compilan 40k módulos). Ajustar según uso real.
ROUTES=(
  "/chat"
  "/settings"
  "/messages"
)

echo "[warmup] esperando a que el server responda en ${BASE}/ ..."
i=0
until [ "$("$CURL" -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}/" 2>/dev/null)" = "200" ] || [ "$i" -ge 30 ]; do
  i=$((i+1)); sleep 5
done

echo "[warmup] server listo. Calentando rutas (compilación on-demand, puede tardar varios min/ruta)..."
for r in "${ROUTES[@]}"; do
  echo "[warmup] → ${r} (disparando compilación)"
  # timeout alto: la 1ª compilación de una ruta puede tardar mucho con RAM ajustada
  code=$("$CURL" -s -o /dev/null -w '%{http_code}' --max-time 720 "${BASE}${r}" 2>/dev/null)
  echo "[warmup]   ${r} → ${code}"
done

echo "[warmup] completado. Las rutas calientes responden en ~2-4s a partir de ahora (mientras no se reinicie el server ni se borre .next/cache)."
