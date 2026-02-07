#!/bin/bash
# Script para ejecutar todos los pasos de optimización y configuración

set -e

echo "🚀 EJECUTANDO TODOS LOS PASOS DE OPTIMIZACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR=$(pwd)

# Paso 1: Verificar optimización
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}PASO 1: Verificando optimización...${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash scripts/verificar-optimizacion.sh
echo ""

# Paso 2: Ver estado actual
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}PASO 2: Estado actual del proyecto...${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash scripts/ver-estado.sh
echo ""

# Paso 3: Configurar alias (si no existe)
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}PASO 3: Configurando alias de mantenimiento...${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! grep -q "mantenimiento-bodas" ~/.zshrc 2>/dev/null; then
    echo "   Agregando alias a ~/.zshrc..."
    echo "" >> ~/.zshrc
    echo "# Mantenimiento automático AppBodasdehoy" >> ~/.zshrc
    echo "alias mantenimiento-bodas='cd $PROJECT_DIR && ./scripts/mantenimiento-automatico.sh'" >> ~/.zshrc
    echo "   ${GREEN}✅ Alias agregado${NC}"
    echo ""
    echo "   ${YELLOW}💡 Ejecuta: source ~/.zshrc${NC}"
    echo "   Luego podrás usar: mantenimiento-bodas"
else
    echo "   ${GREEN}✅ Alias ya está configurado${NC}"
fi
echo ""

# Paso 4: Generar reporte
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}PASO 4: Generando reporte de optimización...${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash scripts/generar-reporte.sh
echo ""

# Paso 5: Resumen final
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}✅ TODOS LOS PASOS COMPLETADOS${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📊 Resumen:"
echo "   ✅ Verificación completada"
echo "   ✅ Estado verificado"
echo "   ✅ Alias configurado"
echo "   ✅ Reporte generado"
echo ""

echo "💡 Comandos disponibles:"
echo "   ./scripts/ver-estado.sh - Ver estado"
echo "   ./scripts/mantenimiento-automatico.sh - Mantenimiento"
echo "   mantenimiento-bodas - Mantenimiento (después de source ~/.zshrc)"
echo ""

echo "${GREEN}✅ ¡Configuración completa!${NC}"
echo ""
