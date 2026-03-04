#!/bin/bash

# ========================================
# SETUP RÁPIDO EN 30 SEGUNDOS
# ========================================

echo ""
echo "======================================================================"
echo "SETUP ULTRA-RÁPIDO - Copiar Cookies en 30 Segundos"
echo "======================================================================"
echo ""

COOKIES_FILE="./copilot-test-cookies.json"

# Función para solicitar un valor
ask_value() {
    local prompt="$1"
    local value
    read -p "$prompt" value
    echo "$value"
}

echo "📋 PASOS RÁPIDOS:"
echo ""
echo "1. Abre https://app-test.bodasdehoy.com en tu navegador"
echo "2. Haz login (si no lo estás ya)"
echo "3. Presiona F12 (o Cmd+Option+I en Mac)"
echo "4. Ve a: Application > Cookies > https://app-test.bodasdehoy.com"
echo ""
echo "Presiona ENTER cuando estés listo..."
read

echo ""
echo "======================================================================"
echo "COPIAR COOKIES"
echo "======================================================================"
echo ""

echo "🔍 Busca la cookie: idTokenV0.1.0"
echo "   Haz click derecho > Copy > Copy Value"
echo ""
read -p "Pega el valor aquí: " ID_TOKEN

if [ -z "$ID_TOKEN" ] || [ ${#ID_TOKEN} -lt 50 ]; then
    echo ""
    echo "❌ Error: El token parece muy corto. Asegúrate de copiar el valor completo."
    exit 1
fi

echo ""
echo "🔍 Busca la cookie: sessionBodas"
echo "   Haz click derecho > Copy > Copy Value"
echo ""
read -p "Pega el valor aquí: " SESSION

if [ -z "$SESSION" ] || [ ${#SESSION} -lt 10 ]; then
    echo ""
    echo "❌ Error: La sesión parece muy corta. Asegúrate de copiar el valor completo."
    exit 1
fi

# Calcular timestamp de expiración (30 días desde ahora)
EXPIRES=$(($(date +%s) + (30 * 24 * 60 * 60)))

# Crear archivo JSON
cat > "$COOKIES_FILE" << EOF
[
  {
    "name": "idTokenV0.1.0",
    "value": "$ID_TOKEN",
    "domain": "app-test.bodasdehoy.com",
    "path": "/",
    "expires": $EXPIRES,
    "httpOnly": false,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "sessionBodas",
    "value": "$SESSION",
    "domain": "app-test.bodasdehoy.com",
    "path": "/",
    "expires": $EXPIRES,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
EOF

echo ""
echo "======================================================================"
echo "✅ ¡COOKIES GUARDADAS EXITOSAMENTE!"
echo "======================================================================"
echo ""
echo "📁 Archivo: $COOKIES_FILE"
echo "📊 Tamaño: $(wc -c < "$COOKIES_FILE") bytes"
echo ""
echo "🚀 Próximo paso:"
echo "   node test-copilot-automated-with-cookies.js"
echo ""
echo "======================================================================"
echo ""
