#!/bin/bash
# Script para analizar extensiones de Cursor/VS Code instaladas

echo "🔍 Analizando extensiones de Cursor..."
echo ""

# Detectar si Cursor está instalado
CURSOR_CMD="cursor"
if ! command -v $CURSOR_CMD &> /dev/null; then
    echo "⚠️  Comando 'cursor' no encontrado. Intentando con 'code' (VS Code)..."
    CURSOR_CMD="code"
fi

if ! command -v $CURSOR_CMD &> /dev/null; then
    echo "❌ No se encontró ni 'cursor' ni 'code' en el PATH."
    echo ""
    echo "💡 Alternativas:"
    echo "   1. Busca manualmente en: ~/.cursor/extensions o ~/.vscode/extensions"
    echo "   2. Abre Cursor y ve a View > Extensions (Cmd+Shift+X)"
    echo "   3. Verifica que Cursor esté en tu PATH"
    exit 1
fi

echo "✅ Usando comando: $CURSOR_CMD"
echo ""

# Listar extensiones instaladas
echo "📦 Extensiones instaladas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
$CURSOR_CMD --list-extensions --show-versions 2>/dev/null | while IFS=@ read -r ext version; do
    echo "  • $ext @ $version"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Contar extensiones
EXT_COUNT=$($CURSOR_CMD --list-extensions 2>/dev/null | wc -l | tr -d ' ')
echo "📊 Total de extensiones: $EXT_COUNT"
echo ""

# Ver tamaño de directorio de extensiones
if [ -d "$HOME/.cursor/extensions" ]; then
    EXT_SIZE=$(du -sh "$HOME/.cursor/extensions" 2>/dev/null | cut -f1)
    echo "💾 Tamaño de ~/.cursor/extensions: $EXT_SIZE"
elif [ -d "$HOME/.vscode/extensions" ]; then
    EXT_SIZE=$(du -sh "$HOME/.vscode/extensions" 2>/dev/null | cut -f1)
    echo "💾 Tamaño de ~/.vscode/extensions: $EXT_SIZE"
fi

echo ""
echo "💡 Para desinstalar una extensión, ejecuta:"
echo "   $CURSOR_CMD --uninstall-extension <extension-id>"
echo ""
echo "💡 Para ver más detalles, abre Cursor y presiona Cmd+Shift+X"
