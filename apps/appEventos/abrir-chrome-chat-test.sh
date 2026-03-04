#!/bin/bash
# Abre Chrome con remote debugging y navega a chat-test.
# Necesario para que el navegador de Cursor (Chrome DevTools MCP) funcione.

echo "🌐 Abriendo Chrome con remote debugging (puerto 9222)..."
echo "   Luego podrás usar el navegador de Cursor para probar chat-test."
echo ""

# Cerrar Chrome si está abierto (opcional, comenta si no quieres)
# osascript -e 'quit app "Google Chrome"' 2>/dev/null
# sleep 2

# Ruta típica en macOS
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -f "$CHROME" ]; then
  echo "❌ No se encontró Chrome en $CHROME"
  echo "   Ajusta CHROME en el script o abre Chrome manualmente con:"
  echo "   Chrome --remote-debugging-port=9222"
  exit 1
fi

# Abrir Chrome con debugging y directamente chat-test
"$CHROME" --remote-debugging-port=9222 "https://chat-test.bodasdehoy.com" &

echo "✅ Chrome iniciado. Espera unos segundos y en Cursor pide:"
echo "   'Prueba en el navegador chat-test' o 'Navega a chat-test'"
echo ""
echo "   Verifica: curl http://127.0.0.1:9222/json/version"
