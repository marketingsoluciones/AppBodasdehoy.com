#!/bin/bash
# Script de mantenimiento automático - Para ejecutar periódicamente

set -e

echo "🔧 MANTENIMIENTO AUTOMÁTICO DEL PROYECTO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Fecha: $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Función para verificar y limpiar
cleanup_item() {
    local item=$1
    local description=$2
    
    if [ -e "$item" ] || [ -d "$item" ]; then
        size=$(du -sh "$item" 2>/dev/null | cut -f1)
        echo "   ${YELLOW}Eliminando: $description ($size)${NC}"
        rm -rf "$item" 2>/dev/null && \
            echo "      ${GREEN}✅ Eliminado${NC}" || \
            echo "      ${RED}❌ Error${NC}"
        return 0
    else
        return 1
    fi
}

echo "📁 Limpiando builds y cachés..."
cleanup_count=0

# Limpiar .next
find . -type d -name ".next" -not -path "*/node_modules/*" 2>/dev/null | while read -r dir; do
    cleanup_item "$dir" "Build .next"
    ((cleanup_count++))
done

# Limpiar .vercel/output
find . -path "*/.vercel/output" -type d 2>/dev/null | while read -r dir; do
    cleanup_item "$dir" "Build Vercel"
    ((cleanup_count++))
done

# Limpiar logs
log_count=$(find . -name "*.log" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$log_count" -gt 0 ]; then
    echo "   ${YELLOW}Eliminando $log_count archivos .log${NC}"
    find . -name "*.log" -not -path "*/node_modules/*" -delete 2>/dev/null
    echo "      ${GREEN}✅ Eliminados${NC}"
fi

# Limpiar tsbuildinfo
tsb_count=$(find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$tsb_count" -gt 0 ]; then
    echo "   ${YELLOW}Eliminando $tsb_count archivos .tsbuildinfo${NC}"
    find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete 2>/dev/null
    echo "      ${GREEN}✅ Eliminados${NC}"
fi

# Limpiar .cache
find . -type d -name ".cache" -not -path "*/node_modules/*" 2>/dev/null | while read -r dir; do
    cleanup_item "$dir" "Caché"
done

# Limpiar screenshots
cleanup_item ".screenshots" "Screenshots"

echo ""
echo "${GREEN}✅ Mantenimiento completado!${NC}"
echo ""

# Mostrar tamaño final
TAMANO=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Tamaño actual del proyecto: $TAMANO"
echo ""

# Sugerencias
echo "💡 Sugerencias:"
echo "   - Ejecuta este script semanalmente"
echo "   - Revisa extensiones cada 2-3 meses"
echo "   - Considera 'pnpm store prune' si trabajas en múltiples proyectos"
echo ""
