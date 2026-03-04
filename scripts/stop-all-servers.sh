#!/bin/bash
# Detiene todos los servidores y libera memoria

echo "🛑 Deteniendo todos los servidores..."

# Detener servidor web (puerto 8080)
if lsof -i :8080 &>/dev/null; then
  echo "📍 Deteniendo servidor web (8080)..."
  lsof -ti :8080 | xargs kill -9 2>/dev/null
  echo "✅ Servidor web detenido"
fi

# Detener servidor copilot (puerto 3210)
if lsof -i :3210 &>/dev/null; then
  echo "🤖 Deteniendo servidor copilot (3210)..."
  lsof -ti :3210 | xargs kill -9 2>/dev/null
  echo "✅ Servidor copilot detenido"
fi

# Detener procesos next-server huérfanos
echo "🧹 Limpiando procesos Next.js..."
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "pnpm.*dev" 2>/dev/null

# Limpiar cachés
echo "🧹 Limpiando cachés..."
rm -rf apps/appEventos/.next/cache 2>/dev/null
rm -rf apps/chat-ia/.next/cache 2>/dev/null

# Limpiar logs temporales
echo "🧹 Limpiando logs temporales..."
rm -f /tmp/*.log 2>/dev/null

# Cerrar Chrome con debugging si existe
if pgrep -f "remote-debugging-port=9222" &>/dev/null; then
  echo "🌐 Cerrando Chrome con debugging..."
  pkill -f "remote-debugging-port=9222" 2>/dev/null
fi

sleep 2

echo ""
echo "✅ Todos los servidores detenidos"
echo "📊 Memoria liberada:"
top -l 1 | grep PhysMem
