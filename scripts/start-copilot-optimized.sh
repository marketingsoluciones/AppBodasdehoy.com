#!/bin/bash
# Inicia el servidor copilot (puerto 3210) - Optimizado para bajo consumo de memoria

echo "🤖 Iniciando servidor copilot optimizado..."

# Variables de entorno para reducir uso de memoria
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
export NEXT_TELEMETRY_DISABLED=1

cd "$(dirname "$0")/.."

# Verificar si ya está corriendo
if lsof -i :3210 &>/dev/null; then
  echo "⚠️  Servidor copilot ya está corriendo en puerto 3210"
  exit 0
fi

# Limpiar caché antes de iniciar
echo "🧹 Limpiando caché..."
rm -rf apps/copilot/.next/cache

# Iniciar copilot
pnpm --filter @bodasdehoy/copilot dev &
COPILOT_PID=$!

echo "✅ Servidor copilot iniciado (PID: $COPILOT_PID)"
echo "📍 URL: http://localhost:3210"
echo "💾 Límite de memoria: 2GB"
echo "⏳ Esperando compilación inicial (puede tardar 30-60s)..."

# Esperar que compile
sleep 10
echo "✅ Copilot iniciando..."
