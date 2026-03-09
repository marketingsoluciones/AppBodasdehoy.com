#!/bin/bash
# Script avanzado para eliminar extensiones no necesarias
# Maneja errores y ofrece opciones interactivas

set -e

echo "🗑️  Eliminación Avanzada de Extensiones"
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
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
eliminadas=0
errores=0
no_instaladas=0

# Función mejorada para eliminar extensión
remove_ext() {
    local ext_id=$1
    local reason=$2
    local force=${3:-false}
    
    # Verificar si está instalada
    if ! $CURSOR_CMD --list-extensions 2>/dev/null | grep -q "^${ext_id}$"; then
        echo "   ${YELLOW}⚠️  No instalada: $ext_id${NC}"
        ((no_instaladas++))
        return 0
    fi
    
    echo "   ${YELLOW}Eliminando: $ext_id${NC}"
    echo "      Razón: $reason"
    
    # Intentar eliminar
    if $CURSOR_CMD --uninstall-extension "$ext_id" 2>&1; then
        echo "      ${GREEN}✅ Eliminada exitosamente${NC}"
        ((eliminadas++))
        echo ""
        return 0
    else
        echo "      ${RED}❌ Error al eliminar${NC}"
        ((errores++))
        
        if [ "$force" = "true" ]; then
            echo "      ${BLUE}💡 Intentando forzar eliminación...${NC}"
            # Intentar eliminar del directorio directamente
            EXT_DIR="$HOME/.cursor/extensions"
            if [ -d "$EXT_DIR" ]; then
                EXT_PATH=$(find "$EXT_DIR" -maxdepth 1 -type d -name "${ext_id}-*" 2>/dev/null | head -1)
                if [ -n "$EXT_PATH" ]; then
                    echo "      ${BLUE}Eliminando desde: $EXT_PATH${NC}"
                    rm -rf "$EXT_PATH" && echo "      ${GREEN}✅ Eliminada manualmente${NC}" || echo "      ${RED}❌ Error en eliminación manual${NC}"
                fi
            fi
        fi
        echo ""
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE PYTHON (forzado)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-python.python" "No necesario para Next.js/React" true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE MONGODB (si no lo usas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "mongodb.mongodb-vscode" "MongoDB no aparece en dependencias principales" false
remove_ext "joeyyizhao.mongo-runner" "Runner de MongoDB no necesario" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE DOCKER/CONTAINERS (si no los usas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-azuretools.vscode-docker" "Docker no necesario para desarrollo web frontend" false
remove_ext "ms-azuretools.vscode-containers" "Containers no necesario" false
remove_ext "anysphere.remote-containers" "Remote containers no necesario" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE FIREBASE (revisar si realmente lo usas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ${YELLOW}⚠️  ADVERTENCIA: Firebase aparece en dependencias${NC}"
echo "   ${YELLOW}   Si lo usas activamente, NO elimines estas extensiones${NC}"
echo ""
# Comentado por defecto - descomentar si no usas Firebase
# remove_ext "jsayol.firebase-explorer" "Firebase explorer" false
# remove_ext "toba.vsfire" "Firebase tools" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE REDIS (si no lo usas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "redis.redis-for-vscode" "Redis no necesario para Next.js frontend" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE TESTING/WALLABY (si no las usas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "wallabyjs.quokka-vscode" "Quokka - solo si no lo usas activamente" false
remove_ext "wallabyjs.wallaby-vscode" "Wallaby - solo si no lo usas activamente" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO EXTENSIONES DE COLABORACIÓN (si no colaboras en tiempo real)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "ms-vsliveshare.vsliveshare" "Live Share - solo si no colaboras en tiempo real" false

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 ELIMINANDO OTRAS EXTENSIONES DUPLICADAS O NO NECESARIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remove_ext "apollographql.vscode-apollo" "Apollo - ya tienes GraphQL extension" false
remove_ext "github.codespaces" "GitHub Codespaces - solo si no lo usas" false
remove_ext "github.remotehub" "Remote Hub - solo si no lo usas" false
remove_ext "ms-vscode.remote-repositories" "Remote Repositories - solo si no lo usas" false
remove_ext "formulahendry.terminal" "Terminal - duplicado con terminal integrado" false

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ${GREEN}✅ Eliminadas exitosamente: $eliminadas${NC}"
echo "   ${RED}❌ Errores: $errores${NC}"
echo "   ${YELLOW}⚠️  No instaladas: $no_instaladas${NC}"
echo ""

if [ $errores -gt 0 ]; then
    echo "💡 Para extensiones con errores:"
    echo "   1. Cierra completamente Cursor"
    echo "   2. Elimina manualmente desde: ~/.cursor/extensions/"
    echo "   3. O reinicia Cursor y vuelve a intentar"
    echo ""
fi

echo "${GREEN}✅ Proceso completado!${NC}"
echo ""
echo "💡 Para ver el espacio liberado, ejecuta:"
echo "   ./scripts/analizar-tamano-extensiones.sh"
echo ""
