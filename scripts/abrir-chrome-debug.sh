#!/bin/bash
# Relanza Google Chrome con el puerto de debugging 9222.
# Tu sesión (cookies, login, tabs) se conserva intacta.
# Solo hace falta ejecutarlo una vez; después Claude Code se conecta automáticamente.
#
# NOTA: Usa /tmp/chrome-profile como symlink a tu perfil real para evitar
# problemas con espacios en el path "Application Support".

set -e

echo "Cerrando Chrome..."
osascript -e 'quit app "Google Chrome"' 2>/dev/null || true
sleep 2
pkill -9 -f "Google Chrome" 2>/dev/null || true
sleep 1

# Crear symlink al perfil real (evita problemas de espacios en el path)
ln -sfn "$HOME/Library/Application Support/Google/Chrome" /tmp/chrome-profile

echo "Abriendo Chrome con puerto de debugging 9222..."
nohup /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile \
  --no-first-run \
  --no-default-browser-check \
  > /tmp/chrome-debug.log 2>&1 &

sleep 6

# Verificar que el puerto está activo
if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  echo "✅ Chrome arrancó con debugging activo"
  curl -s http://127.0.0.1:9222/json/version | python3 -c "import sys,json; d=json.load(sys.stdin); print('   Browser:', d.get('Browser','?'))"
  echo "   Ahora reinicia Claude Code / Cursor para conectar el MCP."
else
  echo "⏳ Chrome está arrancando... espera unos segundos y prueba:"
  echo "   curl http://127.0.0.1:9222/json/version"
  cat /tmp/chrome-debug.log | tail -5
fi
