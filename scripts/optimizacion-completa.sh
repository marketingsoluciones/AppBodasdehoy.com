#!/bin/bash
# Script de optimización completa - Ejecuta todas las optimizaciones

set -e

echo "🚀 OPTIMIZACIÓN COMPLETA DEL PROYECTO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para mostrar sección
show_section() {
    echo ""
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}$1${NC}"
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Obtener tamaño inicial
TAMANO_INICIAL=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Tamaño inicial del proyecto: $TAMANO_INICIAL"
echo ""

# 1. Limpieza del proyecto
show_section "1️⃣  LIMPIEZA DEL PROYECTO"
bash scripts/cleanup.sh

# 2. Análisis de extensiones
show_section "2️⃣  ANÁLISIS DE EXTENSIONES"
echo "Extensiones instaladas:"
cursor --list-extensions 2>/dev/null | wc -l | xargs echo "   Total:"
echo ""

# 3. Verificar archivos grandes
show_section "3️⃣  BUSCANDO ARCHIVOS GRANDES"
echo "Buscando archivos mayores a 50MB..."
ARCHIVOS_GRANDES=$(find . -type f -size +50M -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" 2>/dev/null | head -5)
if [ -z "$ARCHIVOS_GRANDES" ]; then
    echo "   ${GREEN}✅ No se encontraron archivos grandes fuera de node_modules${NC}"
else
    echo "   ${YELLOW}⚠️  Archivos grandes encontrados:${NC}"
    echo "$ARCHIVOS_GRANDES" | while read -r archivo; do
        if [ -n "$archivo" ]; then
            tamaño=$(du -sh "$archivo" 2>/dev/null | cut -f1)
            echo "      $tamaño - $archivo"
        fi
    done
fi

# 4. Verificar store de PNPM
show_section "4️⃣  VERIFICANDO STORE DE PNPM"
if command -v pnpm &> /dev/null; then
    STORE_PATH=$(pnpm store path 2>/dev/null)
    if [ -n "$STORE_PATH" ] && [ -d "$STORE_PATH" ]; then
        STORE_SIZE=$(du -sh "$STORE_PATH" 2>/dev/null | cut -f1)
        echo "   Store de PNPM: $STORE_PATH"
        echo "   Tamaño: $STORE_SIZE"
        echo ""
        echo "   ${YELLOW}💡 Para limpiar el store (afecta todos los proyectos):${NC}"
        echo "      pnpm store prune"
    else
        echo "   ${YELLOW}⚠️  Store de PNPM no encontrado${NC}"
    fi
else
    echo "   ${YELLOW}⚠️  PNPM no está instalado${NC}"
fi

# 5. Resumen final
show_section "5️⃣  RESUMEN FINAL"
TAMANO_FINAL=$(du -sh . 2>/dev/null | cut -f1)
EXT_COUNT=$(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Estado Final:"
echo "   Tamaño del proyecto: $TAMANO_FINAL"
echo "   Extensiones instaladas: $EXT_COUNT"
echo ""

# Calcular espacio liberado (aproximado)
echo "${GREEN}✅ Optimización completada!${NC}"
echo ""
echo "💡 Scripts disponibles:"
echo "   ./scripts/cleanup.sh - Limpieza del proyecto"
echo "   ./scripts/analizar-extensiones-cursor.sh - Ver extensiones"
echo "   ./scripts/analizar-tamano-extensiones.sh - Ver tamaños"
echo "   ./scripts/eliminar-extensiones-avanzado.sh - Eliminar extensiones"
echo ""
