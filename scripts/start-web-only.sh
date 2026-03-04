#!/bin/bash
# Inicia solo el servidor web (puerto 8080) - Optimizado para bajo consumo de memoria

echo "🚀 Iniciando servidor web optimizado..."

# Variables de entorno para reducir uso de memoria
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"
export NEXT_TELEMETRY_DISABLED=1

cd "$(dirname "$0")/.."

# Verificar si ya está corriendo
if lsof -i :8080 &>/dev/null; then
  echo "⚠️  Servidor web ya está corriendo en puerto 8080"
  exit 0
fi

# Iniciar solo web app
pnpm --filter @bodasdehoy/appEventos dev &
WEB_PID=$!

echo "✅ Servidor web iniciado (PID: $WEB_PID)"
echo "📍 URL: http://127.0.0.1:8080"
echo "💾 Límite de memoria: 1GB"

# Esperar que inicie
sleep 5
echo "✅ Listo"
