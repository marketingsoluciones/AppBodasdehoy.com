#!/bin/bash
# Script para limpiar archivos adicionales que pueden optimizarse

set -e

echo "🧹 LIMPIEZA DE ARCHIVOS ADICIONALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Contador
eliminados=0
espacio_liberado=0

# Función para eliminar archivo
remove_file() {
    local archivo=$1
    local descripcion=$2
    local pregunta=${3:-false}
    
    if [ ! -e "$archivo" ]; then
        return 0
    fi
    
    tamaño=$(du -sh "$archivo" 2>/dev/null | cut -f1 || echo "N/A")
    echo "   ${YELLOW}Encontrado: $descripcion ($tamaño)${NC}"
    echo "      Archivo: $archivo"
    
    if [ "$pregunta" = "true" ]; then
        read -p "      ¿Eliminar? (s/n): " respuesta
        if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
            echo "      ${BLUE}⏭️  Omitido${NC}"
            return 0
        fi
    fi
    
    if rm -rf "$archivo" 2>/dev/null; then
        echo "      ${GREEN}✅ Eliminado${NC}"
        ((eliminados++))
        return 0
    else
        echo "      ${RED}❌ Error al eliminar${NC}"
        return 1
    fi
}

echo "📦 Buscando archivos ZIP en el proyecto..."
echo ""

# Archivos ZIP encontrados
ZIP_FILES=(
    "apps/copilot/wedding-icons-bodasdehoy.zip:Archivo ZIP de iconos (ya extraído)"
    "apps/copilot/._wedding-icons-bodasdehoy.zip:Archivo ZIP de macOS (metadatos)"
    "apps/web/public/FormRegister/french-fries-packaging-mockups-2021-04-03-14-37-18-utc.zip:Archivo ZIP de mockups"
    "apps/web/public/FormRegister/cascadia-code.zip:Archivo ZIP de fuente"
)

for item in "${ZIP_FILES[@]}"; do
    IFS=':' read -r archivo descripcion <<< "$item"
    if [ -e "$archivo" ]; then
        remove_file "$archivo" "$descripcion" true
        echo ""
    fi
done

echo "📁 Buscando archivos grandes (>10MB)..."
echo ""

# Buscar archivos grandes (excepto node_modules y .git)
find . -type f -size +10M \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/.next/*" \
    -not -path "*/.vercel/*" \
    2>/dev/null | while read -r archivo; do
    if [ -f "$archivo" ]; then
        tamaño=$(du -sh "$archivo" 2>/dev/null | cut -f1 || echo "N/A")
        echo "   ${YELLOW}Archivo grande encontrado: $archivo ($tamaño)${NC}"
        echo "      ${BLUE}💡 Revisa si es necesario mantener este archivo${NC}"
    fi
done

echo ""
echo "🗑️  Buscando archivos temporales de macOS..."
echo ""

# Archivos .DS_Store y ._*
DS_STORE_COUNT=$(find . -name ".DS_Store" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' ')
DOT_UNDERSCORE_COUNT=$(find . -name "._*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$DS_STORE_COUNT" -gt 0 ] || [ "$DOT_UNDERSCORE_COUNT" -gt 0 ]; then
    echo "   ${YELLOW}Encontrados:${NC}"
    echo "      .DS_Store: $DS_STORE_COUNT archivos"
    echo "      ._* (metadatos macOS): $DOT_UNDERSCORE_COUNT archivos"
    echo ""
    read -p "   ¿Eliminar archivos temporales de macOS? (s/n): " respuesta
    if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
        find . -name ".DS_Store" -not -path "*/node_modules/*" -not -path "*/.git/*" -delete 2>/dev/null
        find . -name "._*" -not -path "*/node_modules/*" -not -path "*/.git/*" -delete 2>/dev/null
        echo "      ${GREEN}✅ Eliminados${NC}"
        ((eliminados++))
    fi
else
    echo "   ${GREEN}✅ No se encontraron archivos temporales de macOS${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ${GREEN}✅ Archivos eliminados: $eliminados${NC}"
echo ""

echo "${GREEN}✅ Limpieza completada!${NC}"
echo ""
