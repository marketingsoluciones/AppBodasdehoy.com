#!/bin/bash
# Script para verificar que todas las optimizaciones estén funcionando

set -e

echo "🔍 VERIFICACIÓN DE OPTIMIZACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contador de verificaciones
total=0
exitosas=0
fallidas=0

# Función para verificar
verificar() {
    local descripcion=$1
    local comando=$2
    
    ((total++))
    echo -n "   Verificando: $descripcion... "
    
    if eval "$comando" > /dev/null 2>&1; then
        echo "${GREEN}✅${NC}"
        ((exitosas++))
        return 0
    else
        echo "${RED}❌${NC}"
        ((fallidas++))
        return 1
    fi
}

echo "📁 Verificando scripts..."
echo ""

# Verificar scripts
SCRIPTS=(
    "ver-estado.sh"
    "cleanup.sh"
    "mantenimiento-automatico.sh"
    "optimizacion-completa.sh"
    "analizar-extensiones-cursor.sh"
    "analizar-tamano-extensiones.sh"
    "eliminar-extensiones-no-necesarias.sh"
    "eliminar-extensiones-avanzado.sh"
    "generar-reporte.sh"
    "configurar-mantenimiento.sh"
    "limpiar-archivos-adicionales.sh"
)

for script in "${SCRIPTS[@]}"; do
    verificar "Script $script" "[ -f scripts/$script ] && [ -x scripts/$script ]"
done

echo ""
echo "📚 Verificando documentación..."
echo ""

# Verificar documentación
DOCS=(
    "README_OPTIMIZACION.md"
    "ANALISIS_OPTIMIZACION.md"
    "RESUMEN_OPTIMIZACION.md"
    "RESULTADO_FINAL_OPTIMIZACION.md"
    "OPTIMIZACION_COMPLETA.md"
    "RESUMEN_FINAL_COMPLETO.md"
)

for doc in "${DOCS[@]}"; do
    verificar "Documento $doc" "[ -f $doc ]"
done

echo ""
echo "⚙️  Verificando configuración..."
echo ""

# Verificar configuración
verificar "Configuración .vscode/settings.json" "[ -f .vscode/settings.json ]"

echo ""
echo "🔌 Verificando herramientas externas..."
echo ""

# Verificar herramientas
verificar "Cursor instalado" "command -v cursor > /dev/null"
verificar "PNPM instalado" "command -v pnpm > /dev/null"

echo ""
echo "📊 Verificando estado del proyecto..."
echo ""

# Verificar que no haya builds grandes
if [ ! -d "apps/chat-ia/.next" ] || [ "$(du -sm apps/chat-ia/.next 2>/dev/null | cut -f1)" -lt 100 ]; then
    echo "   ${GREEN}✅ Builds .next: OK${NC}"
    ((exitosas++))
else
    echo "   ${YELLOW}⚠️  Builds .next: Grande ($(du -sh apps/chat-ia/.next 2>/dev/null | cut -f1))${NC}"
    echo "      Ejecuta: ./scripts/cleanup.sh"
fi
((total++))

if [ ! -d "apps/chat-ia/.vercel/output" ]; then
    echo "   ${GREEN}✅ Builds Vercel: OK${NC}"
    ((exitosas++))
else
    echo "   ${YELLOW}⚠️  Builds Vercel: Existen${NC}"
    echo "      Ejecuta: ./scripts/cleanup.sh"
fi
((total++))

# Verificar extensiones
if command -v cursor &> /dev/null; then
    EXT_COUNT=$(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')
    if [ "$EXT_COUNT" -le 60 ]; then
        echo "   ${GREEN}✅ Extensiones: $EXT_COUNT (optimizado)${NC}"
        ((exitosas++))
    else
        echo "   ${YELLOW}⚠️  Extensiones: $EXT_COUNT (considera eliminar más)${NC}"
    fi
    ((total++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total de verificaciones: $total"
echo "   ${GREEN}✅ Exitosas: $exitosas${NC}"
if [ $fallidas -gt 0 ]; then
    echo "   ${RED}❌ Fallidas: $fallidas${NC}"
else
    echo "   ${GREEN}✅ Fallidas: 0${NC}"
fi
echo ""

if [ $fallidas -eq 0 ]; then
    echo "${GREEN}✅ ¡Todas las verificaciones pasaron!${NC}"
    echo ""
    echo "💡 Próximos pasos:"
    echo "   1. Configurar mantenimiento automático: ./scripts/configurar-mantenimiento.sh"
    echo "   2. Ejecutar mantenimiento semanal: ./scripts/mantenimiento-automatico.sh"
    echo "   3. Revisar documentación: cat README_OPTIMIZACION.md"
else
    echo "${YELLOW}⚠️  Algunas verificaciones fallaron${NC}"
    echo "   Revisa los errores arriba y corrige los problemas"
fi
echo ""
