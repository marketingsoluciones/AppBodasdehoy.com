#!/bin/bash
# Script para analizar el tamaño de las extensiones de Cursor

echo "📊 Analizando tamaño de extensiones de Cursor..."
echo ""

# Rutas posibles donde se guardan las extensiones
EXT_PATHS=(
    "$HOME/.cursor/extensions"
    "$HOME/.vscode/extensions"
    "$HOME/Library/Application Support/Cursor/User/extensions"
)

EXT_DIR=""
for path in "${EXT_PATHS[@]}"; do
    if [ -d "$path" ]; then
        EXT_DIR="$path"
        break
    fi
done

if [ -z "$EXT_DIR" ]; then
    echo "❌ No se encontró el directorio de extensiones."
    echo ""
    echo "🔍 Buscando en ubicaciones comunes..."
    find "$HOME" -maxdepth 3 -type d -name "extensions" 2>/dev/null | head -5
    echo ""
    echo "💡 Si encuentras el directorio, puedes ejecutar manualmente:"
    echo "   du -sh <ruta-al-directorio-extensions>"
    exit 1
fi

echo "✅ Directorio encontrado: $EXT_DIR"
echo ""

# Tamaño total
TOTAL_SIZE=$(du -sh "$EXT_DIR" 2>/dev/null | cut -f1)
echo "💾 Tamaño total de extensiones: $TOTAL_SIZE"
echo ""

# Tamaño por extensión (top 10 más grandes)
echo "📦 Top 10 extensiones más grandes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
du -sh "$EXT_DIR"/* 2>/dev/null | sort -hr | head -10 | while read -r size name; do
    ext_name=$(basename "$name")
    echo "  $size  →  $ext_name"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Contar extensiones
EXT_COUNT=$(ls -1 "$EXT_DIR" 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Total de extensiones instaladas: $EXT_COUNT"
echo ""

# Extensiones grandes (>50MB)
echo "⚠️  Extensiones grandes (>50MB):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
du -sm "$EXT_DIR"/* 2>/dev/null | awk '$1 > 50 {print $1 "MB  →  " $2}' | sort -hr | while read -r line; do
    echo "  $line"
done

echo ""
echo "💡 Para ver todas las extensiones:"
echo "   ls -lh $EXT_DIR"
