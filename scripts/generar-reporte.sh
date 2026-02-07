#!/bin/bash
# Script para generar un reporte completo de optimización

set -e

REPORTE_FILE="REPORTE_OPTIMIZACION_$(date +%Y%m%d_%H%M%S).md"

echo "📊 Generando reporte de optimización..."
echo ""

# Colores para el reporte
cat > "$REPORTE_FILE" << 'EOF'
# 📊 Reporte de Optimización del Proyecto

**Fecha de generación**: $(date)
**Proyecto**: AppBodasdehoy.com

---

## 📈 Resumen Ejecutivo

EOF

# Agregar información al reporte
{
    echo ""
    echo "### Tamaño del Proyecto"
    echo "\`\`\`"
    du -sh . 2>/dev/null | awk '{print "   Total: " $1}'
    echo "\`\`\`"
    echo ""
    
    echo "### Extensiones de Cursor"
    if command -v cursor &> /dev/null; then
        EXT_COUNT=$(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')
        EXT_SIZE=$(du -sh ~/.cursor/extensions 2>/dev/null | cut -f1 || echo "N/A")
        echo "- **Total instaladas**: $EXT_COUNT"
        echo "- **Tamaño total**: $EXT_SIZE"
    else
        echo "- Cursor no encontrado en PATH"
    fi
    echo ""
    
    echo "### Directorios Principales"
    echo "| Directorio | Tamaño |"
    echo "|------------|--------|"
    du -sh apps/copilot/node_modules apps/web/node_modules .git 2>/dev/null | \
        awk '{printf "| %s | %s |\n", $2, $1}'
    echo ""
    
    echo "### Estado de Builds y Cachés"
    echo ""
    if [ -d "apps/copilot/.next" ]; then
        NEXT_SIZE=$(du -sh apps/copilot/.next 2>/dev/null | cut -f1)
        echo "⚠️ **.next existe**: $NEXT_SIZE (puede limpiarse)"
    else
        echo "✅ **.next**: No existe (limpio)"
    fi
    
    if [ -d "apps/copilot/.vercel/output" ]; then
        VERCEL_SIZE=$(du -sh apps/copilot/.vercel/output 2>/dev/null | cut -f1)
        echo "⚠️ **.vercel/output existe**: $VERCEL_SIZE (puede limpiarse)"
    else
        echo "✅ **.vercel/output**: No existe (limpio)"
    fi
    
    LOG_COUNT=$(find . -name "*.log" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$LOG_COUNT" -gt 0 ]; then
        echo "⚠️ **Archivos .log**: $LOG_COUNT encontrados"
    else
        echo "✅ **Archivos .log**: Ninguno encontrado"
    fi
    echo ""
    
    echo "### Extensiones Instaladas"
    echo ""
    if command -v cursor &> /dev/null; then
        echo "Total: $(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ') extensiones"
        echo ""
        echo "Lista completa:"
        echo "\`\`\`"
        cursor --list-extensions --show-versions 2>/dev/null | head -20
        echo "\`\`\`"
    fi
    echo ""
    
    echo "### Scripts Disponibles"
    echo ""
    ls -1 scripts/*.sh 2>/dev/null | while read -r script; do
        echo "- \`$(basename "$script")\`"
    done
    echo ""
    
    echo "### Recomendaciones"
    echo ""
    echo "1. Ejecutar \`./scripts/mantenimiento-automatico.sh\` semanalmente"
    echo "2. Revisar extensiones cada 2-3 meses"
    echo "3. Verificar espacio del proyecto mensualmente"
    echo ""
    
} >> "$REPORTE_FILE"

# Reemplazar la fecha en el reporte
sed -i '' "s/\$(date)/$(date)/" "$REPORTE_FILE" 2>/dev/null || \
    sed -i "s/\$(date)/$(date)/" "$REPORTE_FILE" 2>/dev/null

echo "✅ Reporte generado: $REPORTE_FILE"
echo ""
