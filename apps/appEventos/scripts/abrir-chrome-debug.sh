#!/bin/bash

echo "======================================================================"
echo "ABRIENDO CHROME CON DEBUGGING HABILITADO"
echo "======================================================================"
echo ""
echo "Este script abre tu Chrome NORMAL con debugging habilitado."
echo "Esto permite que Puppeteer se conecte a tu Chrome real."
echo ""
echo "✅ Tus plugins MCP estarán disponibles"
echo "✅ Firebase funcionará correctamente"
echo "✅ Podrás hacer login manual"
echo ""
echo "======================================================================" echo ""
echo "🚀 Abriendo Chrome..."
echo ""

# Cerrar Chrome si está abierto
osascript -e 'quit app "Google Chrome"' 2>/dev/null

# Esperar a que cierre
sleep 2

# Abrir Chrome con debugging en puerto 9222
open -a "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-blink-features=AutomationControlled

echo "✅ Chrome abierto con debugging en puerto 9222"
echo ""
echo "Ahora ejecuta el test:"
echo "  cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts"
echo "  node test-copilot-chrome-real.js"
echo ""
echo "======================================================================"