#!/bin/bash

# Test Copilot - Menú de opciones

echo "======================================================================"
echo "TEST COPILOT - Selecciona una opción"
echo "======================================================================"
echo ""
echo "1. Login Manual + Test Automático"
echo "   - Tú haces login, el script hace las preguntas"
echo "   - Usuario REAL"
echo "   - Navegador VISIBLE"
echo ""
echo "2. Login Automático con Espera Larga"
echo "   - Espera 60s a que Firebase se inicialice"
echo "   - Probablemente FALLARÁ (Firebase no funciona en Playwright)"
echo "   - Útil para confirmar el problema"
echo ""
echo "3. Dev Bypass (RECOMENDADO) ⭐"
echo "   - 100% confiable"
echo "   - Usuario dev simulado"
echo "   - Navegador VISIBLE"
echo "   - Más rápido"
echo ""
echo "======================================================================"
echo ""
read -p "Elige opción (1, 2 o 3): " option

case $option in
  1)
    echo ""
    echo "🚀 Ejecutando Opción 1: Login Manual..."
    echo ""
    node scripts/test-copilot-con-usuario-real.js
    ;;
  2)
    echo ""
    echo "🚀 Ejecutando Opción 2: Login Automático con Espera..."
    echo ""
    node scripts/test-copilot-espera-larga.js
    ;;
  3)
    echo ""
    echo "🚀 Ejecutando Opción 3: Dev Bypass..."
    echo ""
    node scripts/test-copilot-bypass-visible.js
    ;;
  *)
    echo ""
    echo "❌ Opción inválida. Usa 1, 2 o 3"
    exit 1
    ;;
esac
