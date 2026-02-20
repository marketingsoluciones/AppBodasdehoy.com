#!/bin/bash
# Limpia caché y logs de Cursor para ganar velocidad y liberar ~400 MB+.
# IMPORTANTE: Cierra Cursor por completo antes de ejecutar este script.

set -e

CURSOR_SUPPORT="$HOME/Library/Application Support/Cursor"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧹 Limpieza de caché de Cursor (ganar velocidad)"
echo ""

if pgrep -x "Cursor" > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Cursor está abierto. Ciérralo por completo y vuelve a ejecutar este script.${NC}"
    echo "   (Cursor → Salir, o Cmd+Q)"
    exit 1
fi

total_antes=0
for dir in "$CURSOR_SUPPORT/Cache" "$CURSOR_SUPPORT/Code Cache" "$CURSOR_SUPPORT/logs" "$CURSOR_SUPPORT/GPUCache"; do
    if [ -d "$dir" ]; then
        size=$(du -sk "$dir" 2>/dev/null | cut -f1)
        total_antes=$((total_antes + size))
    fi
done

echo "📁 Eliminando caché y logs..."
for dir in "Cache" "Code Cache" "logs" "GPUCache"; do
    path="$CURSOR_SUPPORT/$dir"
    if [ -d "$path" ]; then
        rm -rf "$path"/*
        echo -e "   ${GREEN}✓${NC} $dir"
    fi
done

echo ""
echo -e "${GREEN}✅ Listo. Puedes volver a abrir Cursor.${NC}"
echo "   (Se liberan típicamente ~400 MB entre Cache, Code Cache y logs)"
echo ""
echo "💡 Si sigue lento: revisa extensiones, cierra pestañas y añade exclusiones en .cursorignore (ver docs/LIMPIAR-ESPACIO-Y-RECURSOS-CURSOR.md)"
