#!/bin/bash
# Script para levantar el servidor de desarrollo.
# Uso: ./start-dev.sh
#      PORT=3001 ./start-dev.sh   # si 8080 falla (EPERM, etc.)

cd "$(dirname "$0")"
PORT=${PORT:-8080}

echo "🚀 Iniciando servidor de desarrollo..."
echo "📁 Directorio: $(pwd)"
echo ""

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  El puerto $PORT está en uso. Matando proceso..."
    lsof -ti :$PORT | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "✅ Iniciando Next.js en puerto $PORT..."
echo "🌐 URL: http://127.0.0.1:$PORT"
echo ""
echo "Si falla con EPERM, prueba: PORT=3001 ./start-dev.sh"
echo "Presiona Ctrl+C para detener"
echo ""

npx next dev -H 127.0.0.1 -p "$PORT"
