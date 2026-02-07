#!/bin/bash

echo "======================================================================"
echo "TEST COPILOT COMPLETO - Con Chrome Real"
echo "======================================================================"
echo ""
echo "Este script hará TODO automáticamente:"
echo "  1️⃣  Abrirá tu Chrome NORMAL con debugging"
echo "  2️⃣  Esperará 5 segundos a que Chrome inicie"
echo "  3️⃣  Conectará el test al Chrome"
echo "  4️⃣  Esperará tu login manual"
echo "  5️⃣  Ejecutará las 3 preguntas automáticamente"
echo ""
echo "======================================================================" echo ""

# Ir al directorio de scripts
cd "$(dirname "$0")"

echo "🔧 Paso 1: Cerrando Chrome si está abierto..."
osascript -e 'quit app "Google Chrome"' 2>/dev/null
sleep 2
echo "   ✅ Chrome cerrado"
echo ""

echo "🚀 Paso 2: Abriendo Chrome con debugging..."
open -a "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  --disable-blink-features=AutomationControlled &

echo "   ✅ Chrome abierto en puerto 9222"
echo ""

echo "⏳ Paso 3: Esperando 5 segundos a que Chrome inicie..."
for i in {5..1}; do
  echo "   ${i}..."
  sleep 1
done
echo "   ✅ Chrome listo"
echo ""

echo "🔗 Paso 4: Conectando test al Chrome..."
echo ""
echo "======================================================================"
echo ""

# Ejecutar el test
node test-copilot-chrome-real.js

# Si el test falla, mostrar ayuda
if [ $? -ne 0 ]; then
  echo ""
  echo "======================================================================"
  echo "⚠️  El test no se pudo conectar a Chrome"
  echo "======================================================================"
  echo ""
  echo "Verifica que Chrome esté corriendo con:"
  echo "  ps aux | grep 'remote-debugging-port'"
  echo ""
  echo "Si no aparece, ejecuta manualmente:"
  echo "  ./abrir-chrome-debug.sh"
  echo ""
  echo "======================================================================"
fi
