#!/bin/bash

# Script para monitorear el progreso del login manual en tiempo real

COOKIE_FILE="./copilot-test-cookies.json"
OUTPUT_FILE="/private/tmp/claude/-Users-juancarlosparra-Projects-AppBodasdehoy-com/tasks/bddfc71.output"

echo "=========================================="
echo "Monitor de Progreso - Login Manual"
echo "=========================================="
echo ""

# Función para verificar si las cookies fueron guardadas
check_cookies() {
    if [ -f "$COOKIE_FILE" ]; then
        echo "✅ ¡COOKIES GUARDADAS!"
        echo ""
        echo "Archivo: $COOKIE_FILE"
        echo "Tamaño: $(ls -lh "$COOKIE_FILE" | awk '{print $5}')"
        echo ""
        echo "🚀 Próximo paso:"
        echo "   node test-copilot-automated-with-cookies.js"
        echo ""
        return 0
    else
        return 1
    fi
}

# Mostrar estado inicial
echo "📍 Estado Actual:"
echo ""

if check_cookies; then
    exit 0
fi

echo "⏳ Esperando login manual..."
echo ""
echo "Firefox está abierto en la página de login."
echo "Por favor completa el login manualmente:"
echo ""
echo "  Email: bodasdehoy.com@gmail.com"
echo "  Password: "$TEST_USER_PASSWORD""
echo ""
echo "=========================================="
echo ""

# Mostrar las últimas líneas del log
if [ -f "$OUTPUT_FILE" ]; then
    echo "📄 Últimas líneas del log:"
    echo ""
    tail -5 "$OUTPUT_FILE"
    echo ""
fi

echo "=========================================="
echo ""
echo "💡 Para ver el log completo en tiempo real:"
echo "   tail -f $OUTPUT_FILE"
echo ""
echo "💡 Para verificar si las cookies fueron guardadas:"
echo "   ls -lh $COOKIE_FILE"
echo ""
