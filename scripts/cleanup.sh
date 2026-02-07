#!/bin/bash
# Script de limpieza del proyecto
# Elimina archivos temporales, builds y cachés para liberar espacio

set -e

echo "🧹 Iniciando limpieza del proyecto..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar el tamaño antes de eliminar
show_size() {
    if [ -d "$1" ] || [ -f "$1" ]; then
        size=$(du -sh "$1" 2>/dev/null | cut -f1)
        echo "   ${YELLOW}Eliminando: $1 (${size})${NC}"
        return 0
    else
        return 1
    fi
}

# Contador de espacio liberado (aproximado)
space_freed=0

echo "📁 Limpiando directorios de build..."

# Limpiar .next
if show_size "apps/copilot/.next"; then
    rm -rf apps/copilot/.next
    space_freed=$((space_freed + 1))
fi

# Limpiar todos los .next en .vercel
if [ -d "apps/copilot/.vercel/output" ]; then
    if show_size "apps/copilot/.vercel/output"; then
        rm -rf apps/copilot/.vercel/output
        space_freed=$((space_freed + 1))
    fi
fi

# Buscar otros .next
find . -type d -name ".next" -not -path "*/node_modules/*" 2>/dev/null | while read dir; do
    if show_size "$dir"; then
        rm -rf "$dir"
    fi
done

echo ""
echo "🗑️  Limpiando archivos temporales..."

# Limpiar logs
log_count=$(find . -name "*.log" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$log_count" -gt 0 ]; then
    echo "   ${YELLOW}Eliminando $log_count archivos .log${NC}"
    find . -name "*.log" -not -path "*/node_modules/*" -delete
fi

# Limpiar tsbuildinfo
tsb_count=$(find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$tsb_count" -gt 0 ]; then
    echo "   ${YELLOW}Eliminando $tsb_count archivos .tsbuildinfo${NC}"
    find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete
fi

echo ""
echo "💾 Limpiando cachés..."

# Limpiar .cache
find . -type d -name ".cache" -not -path "*/node_modules/*" 2>/dev/null | while read dir; do
    if show_size "$dir"; then
        rm -rf "$dir"
    fi
done

# Limpiar .screenshots
if [ -d ".screenshots" ]; then
    if show_size ".screenshots"; then
        rm -rf .screenshots
    fi
fi

echo ""
echo "${GREEN}✅ Limpieza completada!${NC}"
echo ""
echo "💡 Recomendaciones adicionales:"
echo "   - Ejecuta 'pnpm store prune' para limpiar el store global de PNPM (afecta todos los proyectos)"
echo "   - Revisa extensiones de Cursor/VS Code no utilizadas"
echo "   - Considera usar 'npm run clean:node_modules' si necesitas reinstalar dependencias"
echo ""
