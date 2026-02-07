#!/bin/bash

# ========================================
# MENÚ PRINCIPAL - Tests del Copilot
# ========================================

clear

echo ""
echo "======================================================================"
echo "               TESTS DEL COPILOT - MENÚ PRINCIPAL"
echo "======================================================================"
echo ""
echo "Selecciona cómo quieres obtener las cookies de autenticación:"
echo ""
echo "  1) Setup Rápido (30 seg) ⭐ RECOMENDADO"
echo "     → Copiar 2 valores desde DevTools"
echo "     → El método MÁS RÁPIDO"
echo ""
echo "  2) Completar Login en Firefox (en curso)"
echo "     → Firefox se abrió hace ~7 minutos"
echo "     → Completa el login manualmente"
echo ""
echo "  3) Copiar Cookies con Asistente Interactivo (1 min)"
echo "     → Similar a opción 1, con validaciones"
echo ""
echo "  4) Ver Estado Actual"
echo "     → ¿Ya tengo las cookies guardadas?"
echo ""
echo "  5) Ejecutar Test Automatizado"
echo "     → Si ya tienes las cookies guardadas"
echo ""
echo "  6) Ver Documentación"
echo "     → README, guías, etc."
echo ""
echo "  0) Salir"
echo ""
echo "======================================================================"
echo ""

read -p "Elige una opción [1-6, 0]: " option

case $option in
    1)
        echo ""
        echo "🚀 Ejecutando Setup Rápido..."
        echo ""
        ./setup-rapido-30-segundos.sh
        ;;
    2)
        echo ""
        echo "📋 Login Manual en Firefox"
        echo ""
        echo "Estado: Script ejecutándose en background"
        echo ""
        echo "Para ver progreso:"
        echo "  tail -f /private/tmp/claude/-Users-juancarlosparra-Projects-AppBodasdehoy-com/tasks/bddfc71.output"
        echo ""
        echo "Ve a la ventana de Firefox que se abrió y completa el login:"
        echo "  Email: bodasdehoy.com@gmail.com"
        echo "  Password: lorca2012M*+"
        echo ""
        ;;
    3)
        echo ""
        echo "🚀 Ejecutando Asistente Interactivo..."
        echo ""
        node copiar-cookies-manual.js
        ;;
    4)
        echo ""
        echo "📊 Estado Actual:"
        echo ""

        if [ -f "./copilot-test-cookies.json" ]; then
            echo "✅ Cookies guardadas exitosamente!"
            echo ""
            echo "Archivo: ./copilot-test-cookies.json"
            echo "Tamaño: $(wc -c < ./copilot-test-cookies.json) bytes"
            echo ""
            echo "🚀 Listo para ejecutar test automatizado:"
            echo "   node test-copilot-automated-with-cookies.js"
        else
            echo "❌ Cookies no encontradas"
            echo ""
            echo "Necesitas ejecutar una de las opciones para obtener las cookies:"
            echo "  - Opción 1: Setup Rápido (RECOMENDADO)"
            echo "  - Opción 2: Completar login en Firefox"
            echo "  - Opción 3: Asistente interactivo"
        fi
        echo ""
        ;;
    5)
        echo ""
        if [ -f "./copilot-test-cookies.json" ]; then
            echo "🚀 Ejecutando Test Automatizado..."
            echo ""
            node test-copilot-automated-with-cookies.js
        else
            echo "❌ Error: No se encontraron cookies"
            echo ""
            echo "Primero ejecuta una de las opciones para obtener las cookies."
            echo ""
        fi
        ;;
    6)
        echo ""
        echo "📚 Documentación Disponible:"
        echo ""
        echo "  - README-EMPIEZA-AQUI.md          ← EMPIEZA AQUÍ"
        echo "  - COMO-EMPEZAR.md                 ← Guía completa"
        echo "  - SOLUCION-FIREBASE-DETECCION.md  ← Explicación técnica"
        echo "  - GUIA-RAPIDA-COPILOT-TESTS.md    ← Referencia rápida"
        echo "  - RESUMEN-EJECUTIVO-COPILOT-TESTS.md ← Vista general"
        echo ""
        echo "Para abrir:"
        echo "  open README-EMPIEZA-AQUI.md"
        echo ""
        ;;
    0)
        echo ""
        echo "👋 ¡Hasta pronto!"
        echo ""
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Opción inválida"
        echo ""
        ;;
esac

echo ""
echo "======================================================================"
echo ""
