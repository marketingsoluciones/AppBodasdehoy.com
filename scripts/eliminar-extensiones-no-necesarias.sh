#!/bin/bash
# Script para eliminar extensiones no necesarias para proyectos Next.js/React/TypeScript

set -e

echo "🗑️  Eliminando extensiones no necesarias..."
echo ""

# Detectar comando
CURSOR_CMD="cursor"
if ! command -v $CURSOR_CMD &> /dev/null; then
    CURSOR_CMD="code"
fi

if ! command -v $CURSOR_CMD &> /dev/null; then
    echo "❌ No se encontró 'cursor' ni 'code'"
    exit 1
fi

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para eliminar extensión
remove_ext() {
    local ext_id=$1
    local reason=$2
    
    if $CURSOR_CMD --list-extensions 2>/dev/null | grep -q "^${ext_id}$"; then
        echo "   ${YELLOW}Eliminando: $ext_id${NC}"
        echo "      Razón: $reason"
        $CURSOR_CMD --uninstall-extension "$ext_id" 2>/dev/null && \
            echo "      ${GREEN}✅ Eliminada${NC}" || \
            echo "      ${RED}❌ Error al eliminar${NC}"
        echo ""
    else
        echo "   ${YELLOW}⚠️  No instalada: $ext_id${NC}"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE PYTHON (si no desarrollas en Python)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-python.python" "No necesario para proyectos Next.js/React"
remove_ext "ms-python.debugpy" "Debugger de Python no necesario"
remove_ext "ms-python.black-formatter" "Formatter de Python no necesario"
remove_ext "ms-python.flake8" "Linter de Python no necesario"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE JUPYTER (si no usas notebooks)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-toolsai.jupyter" "Jupyter notebooks no se usan en Next.js"
remove_ext "ms-toolsai.jupyter-renderers" "Renderers de Jupyter no necesarios"
remove_ext "ms-toolsai.jupyter-keymap" "Keymap de Jupyter no necesario"
remove_ext "ms-toolsai.vscode-jupyter-cell-tags" "Cell tags de Jupyter no necesarios"
remove_ext "ms-toolsai.vscode-jupyter-slideshow" "Slideshow de Jupyter no necesario"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE GEMINI (duplicado con Claude/Cursor AI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "google.geminicodeassist" "Duplicado con Claude Code de Cursor"
remove_ext "google.gemini-cli-vscode-ide-companion" "Duplicado con Claude"
remove_ext "google.colab" "Google Colab no necesario"
remove_ext "google.cros-ide" "Chrome OS IDE no necesario"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE GRAPHQL (si no usas GraphQL extensivamente)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ${YELLOW}⚠️  ADVERTENCIA: Si usas GraphQL, NO ejecutes esta sección${NC}"
echo ""
# Comentado por defecto - descomentar si no usas GraphQL
# remove_ext "graphql.vscode-graphql" "GraphQL no usado extensivamente"
# remove_ext "graphql.vscode-graphql-syntax" "Syntax de GraphQL duplicado"
# remove_ext "kumar-harsh.graphql-for-vscode" "GraphQL duplicado"
# remove_ext "mquandalle.graphql" "GraphQL duplicado"
# remove_ext "orsenkucher.vscode-graphql" "GraphQL duplicado"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO OTRAS EXTENSIONES PROBABLEMENTE NO NECESARIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-vscode.powershell" "PowerShell no necesario en macOS"
remove_ext "ms-vscode.cmake-tools" "CMake no necesario para Next.js"
remove_ext "twxs.cmake" "CMake no necesario"
remove_ext "ms-vscode.makefile-tools" "Makefile tools no necesario"
remove_ext "ms-kubernetes-tools.vscode-kubernetes-tools" "Kubernetes no necesario para desarrollo web"

echo ""
echo "${GREEN}✅ Proceso completado!${NC}"
echo ""
echo "💡 Para ver el espacio liberado, ejecuta:"
echo "   ./scripts/analizar-tamano-extensiones.sh"
echo ""
