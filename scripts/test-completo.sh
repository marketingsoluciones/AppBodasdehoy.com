#!/bin/bash
# Test completo de todas las funcionalidades

set -e

echo "🧪 TEST COMPLETO DE OPTIMIZACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
tests=0
exitosos=0
fallidos=0

# Función de test
test_comando() {
    local nombre=$1
    local comando=$2
    
    ((tests++))
    echo -n "   Test: $nombre... "
    
    if eval "$comando" > /dev/null 2>&1; then
        echo "${GREEN}✅${NC}"
        ((exitosos++))
        return 0
    else
        echo "${RED}❌${NC}"
        ((fallidos++))
        return 1
    fi
}

echo "${BLUE}📁 Tests de Scripts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_comando "ver-estado.sh existe y es ejecutable" "[ -x scripts/ver-estado.sh ]"
test_comando "cleanup.sh existe y es ejecutable" "[ -x scripts/cleanup.sh ]"
test_comando "mantenimiento-automatico.sh existe" "[ -x scripts/mantenimiento-automatico.sh ]"
test_comando "optimizacion-completa.sh existe" "[ -x scripts/optimizacion-completa.sh ]"
test_comando "dashboard.sh existe" "[ -x scripts/dashboard.sh ]"

echo ""
echo "${BLUE}📚 Tests de Documentación${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_comando "README_OPTIMIZACION.md existe" "[ -f README_OPTIMIZACION.md ]"
test_comando "CONFIGURACION_COMPLETA.md existe" "[ -f CONFIGURACION_COMPLETA.md ]"
test_comando "PRÓXIMOS_PASOS.md existe" "[ -f PRÓXIMOS_PASOS.md ]"

echo ""
echo "${BLUE}⚙️  Tests de Configuración${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_comando ".vscode/settings.json existe" "[ -f .vscode/settings.json ]"
test_comando "Alias mantenimiento-bodas configurado" "grep -q 'mantenimiento-bodas' ~/.zshrc 2>/dev/null"

echo ""
echo "${BLUE}🔌 Tests de Herramientas Externas${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_comando "Cursor instalado" "command -v cursor > /dev/null"
test_comando "PNPM instalado" "command -v pnpm > /dev/null"

echo ""
echo "${BLUE}📊 Tests de Funcionalidad${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test de ejecución de scripts (solo verificar que no den error fatal)
test_comando "ver-estado.sh ejecutable" "bash scripts/ver-estado.sh > /dev/null 2>&1"
test_comando "dashboard.sh ejecutable" "bash scripts/dashboard.sh > /dev/null 2>&1"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${BLUE}📊 RESUMEN DE TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total de tests: $tests"
echo "   ${GREEN}✅ Exitosos: $exitosos${NC}"
if [ $fallidos -gt 0 ]; then
    echo "   ${RED}❌ Fallidos: $fallidos${NC}"
else
    echo "   ${GREEN}✅ Fallidos: 0${NC}"
fi

PORCENTAJE=$((exitosos * 100 / tests))
echo "   Porcentaje de éxito: ${BLUE}$PORCENTAJE%${NC}"
echo ""

if [ $fallidos -eq 0 ]; then
    echo "${GREEN}✅ ¡Todos los tests pasaron!${NC}"
    echo ""
    echo "💡 Próximos pasos:"
    echo "   • Ejecuta: ./scripts/dashboard.sh para ver el dashboard"
    echo "   • Usa: mantenimiento-bodas para mantenimiento semanal"
    echo "   • Revisa: README_OPTIMIZACION.md para la guía completa"
else
    echo "${YELLOW}⚠️  Algunos tests fallaron${NC}"
    echo "   Revisa los errores arriba"
fi
echo ""
