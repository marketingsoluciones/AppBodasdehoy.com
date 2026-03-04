#!/bin/bash
# Limpieza de proyecto + sugerencias para ganar más velocidad.
# No cierra Cursor; para limpiar también la caché de Cursor, ciérralo y ejecuta después limpiar-cursor-cache.sh.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "⚡ Optimizar velocidad — limpieza de proyecto"
echo ""

# 1. Limpieza del repo (builds, logs, .cache)
if [ -f "$SCRIPT_DIR/cleanup.sh" ]; then
    echo -e "${BLUE}Ejecutando cleanup del proyecto...${NC}"
    "$SCRIPT_DIR/cleanup.sh"
else
    echo "   Limpiando .next, logs, .cache manualmente..."
    rm -rf apps/chat-ia/.next apps/appEventos/.next 2>/dev/null || true
    find . -name "*.log" -not -path "*/node_modules/*" -delete 2>/dev/null || true
    find . -type d -name ".cache" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
    echo -e "   ${GREEN}✓${NC} Hecho"
fi

echo ""
echo -e "${YELLOW}Pasos opcionales para más velocidad:${NC}"
echo "  1. Cerrar Cursor y ejecutar: ./scripts/limpiar-cursor-cache.sh"
echo "  2. Liberar store global de pnpm: pnpm store prune"
echo "  3. Revisar extensiones pesadas: ./scripts/analizar-tamano-extensiones.sh"
echo "  4. Ver qué procesos consumen más: ./scripts/ver-uso-recursos.sh"
echo ""
echo -e "${GREEN}✅ Listo.${NC}"
