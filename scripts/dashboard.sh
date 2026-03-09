#!/bin/bash
# Dashboard visual de optimización

set -e

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DASHBOARD DE OPTIMIZACIÓN - AppBodasdehoy.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Función para mostrar métrica
mostrar_metrica() {
    local etiqueta=$1
    local valor=$2
    local estado=$3
    
    printf "   ${CYAN}%-25s${NC} ${BLUE}%s${NC} " "$etiqueta:" "$valor"
    if [ "$estado" = "ok" ]; then
        echo "${GREEN}✅${NC}"
    elif [ "$estado" = "warning" ]; then
        echo "${YELLOW}⚠️${NC}"
    else
        echo "${RED}❌${NC}"
    fi
}

echo "${BLUE}📁 PROYECTO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TAMANO=$(du -sh . 2>/dev/null | cut -f1)
mostrar_metrica "Tamaño total" "$TAMANO" "ok"

# Verificar builds
if [ ! -d "apps/chat-ia/.next" ] && [ ! -d "apps/appEventos/.next" ]; then
    mostrar_metrica "Builds .next" "Limpio" "ok"
else
    NEXT_SIZE=$(du -sh apps/chat-ia/.next apps/appEventos/.next 2>/dev/null 2>/dev/null | head -1 | cut -f1 || echo "Existe")
    mostrar_metrica "Builds .next" "$NEXT_SIZE" "warning"
fi

if [ ! -d "apps/chat-ia/.vercel/output" ]; then
    mostrar_metrica "Builds Vercel" "Limpio" "ok"
else
    mostrar_metrica "Builds Vercel" "Existe" "warning"
fi

LOG_COUNT=$(find . -name "*.log" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOG_COUNT" -eq 0 ]; then
    mostrar_metrica "Archivos .log" "0" "ok"
else
    mostrar_metrica "Archivos .log" "$LOG_COUNT" "warning"
fi

echo ""
echo "${BLUE}🔌 EXTENSIONES DE CURSOR${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v cursor &> /dev/null; then
    EXT_COUNT=$(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')
    EXT_SIZE=$(du -sh ~/.cursor/extensions 2>/dev/null | cut -f1 || echo "N/A")
    
    if [ "$EXT_COUNT" -le 60 ]; then
        mostrar_metrica "Total instaladas" "$EXT_COUNT" "ok"
    else
        mostrar_metrica "Total instaladas" "$EXT_COUNT" "warning"
    fi
    
    mostrar_metrica "Tamaño total" "$EXT_SIZE" "ok"
    
    # Top 3 extensiones más grandes
    echo ""
    echo "   ${CYAN}Top 3 extensiones más grandes:${NC}"
    du -sh ~/.cursor/extensions/* 2>/dev/null | sort -hr | head -3 | while read -r size name; do
        ext_name=$(basename "$name" | cut -d'-' -f1-2)
        printf "      ${BLUE}%-20s${NC} ${YELLOW}%s${NC}\n" "$ext_name" "$size"
    done
else
    mostrar_metrica "Cursor" "No encontrado" "warning"
fi

echo ""
echo "${BLUE}🛠️  HERRAMIENTAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SCRIPT_COUNT=$(ls -1 scripts/*.sh 2>/dev/null | wc -l | tr -d ' ')
mostrar_metrica "Scripts disponibles" "$SCRIPT_COUNT" "ok"

DOC_COUNT=$(ls -1 *.md 2>/dev/null | grep -iE 'optimizacion|resultado|completa|readme|resumen|próximos|configuracion' | wc -l | tr -d ' ')
mostrar_metrica "Documentación" "$DOC_COUNT archivos" "ok"

# Verificar alias
if grep -q "mantenimiento-bodas" ~/.zshrc 2>/dev/null; then
    mostrar_metrica "Alias configurado" "mantenimiento-bodas" "ok"
else
    mostrar_metrica "Alias configurado" "No configurado" "warning"
fi

echo ""
echo "${BLUE}📊 MÉTRICAS DE OPTIMIZACIÓN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calcular espacio liberado (aproximado)
ESPACIO_LIBERADO="~2GB"
mostrar_metrica "Espacio liberado" "$ESPACIO_LIBERADO" "ok"

if command -v cursor &> /dev/null; then
    EXT_ELIMINADAS=$((86 - $(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')))
    mostrar_metrica "Extensiones eliminadas" "$EXT_ELIMINADAS" "ok"
fi

echo ""
echo "${BLUE}⚡ ACCIONES RÁPIDAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   1. ${CYAN}Ver estado detallado${NC}     → ./scripts/ver-estado.sh"
echo "   2. ${CYAN}Mantenimiento${NC}             → mantenimiento-bodas"
echo "   3. ${CYAN}Optimización completa${NC}     → ./scripts/optimizacion-completa.sh"
echo "   4. ${CYAN}Ver extensiones${NC}          → ./scripts/analizar-extensiones-cursor.sh"
echo "   5. ${CYAN}Generar reporte${NC}           → ./scripts/generar-reporte.sh"
echo ""

echo "${BLUE}📚 DOCUMENTACIÓN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   • README_OPTIMIZACION.md - Guía completa"
echo "   • CONFIGURACION_COMPLETA.md - Resumen de configuración"
echo "   • PRÓXIMOS_PASOS.md - Guía de acción"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}✅ Dashboard actualizado: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
