#!/bin/bash
# Script para ver el estado actual de optimización

echo "📊 ESTADO ACTUAL DE OPTIMIZACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tamaño del proyecto
TAMANO=$(du -sh . 2>/dev/null | cut -f1)
echo "📁 Tamaño del proyecto: ${BLUE}$TAMANO${NC}"
echo ""

# Extensiones
if command -v cursor &> /dev/null; then
    EXT_COUNT=$(cursor --list-extensions 2>/dev/null | wc -l | tr -d ' ')
    EXT_SIZE=$(du -sh ~/.cursor/extensions 2>/dev/null | cut -f1 || echo "N/A")
    echo "🔌 Extensiones de Cursor:"
    echo "   Total instaladas: ${BLUE}$EXT_COUNT${NC}"
    echo "   Tamaño total: ${BLUE}$EXT_SIZE${NC}"
else
    echo "⚠️  Cursor no encontrado en PATH"
fi
echo ""

# Directorios principales
echo "📂 Directorios principales:"
echo "   node_modules (copilot): $(du -sh apps/chat-ia/node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo "   node_modules (web): $(du -sh apps/appEventos/node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo "   .git: $(du -sh .git 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""

# Verificar builds
echo "🔍 Verificando builds y cachés:"
if [ -d "apps/chat-ia/.next" ]; then
    NEXT_SIZE=$(du -sh apps/chat-ia/.next 2>/dev/null | cut -f1)
    echo "   ${YELLOW}⚠️  .next existe: $NEXT_SIZE (puede limpiarse)${NC}"
else
    echo "   ${GREEN}✅ .next no existe${NC}"
fi

if [ -d "apps/chat-ia/.vercel/output" ]; then
    VERCEL_SIZE=$(du -sh apps/chat-ia/.vercel/output 2>/dev/null | cut -f1)
    echo "   ${YELLOW}⚠️  .vercel/output existe: $VERCEL_SIZE (puede limpiarse)${NC}"
else
    echo "   ${GREEN}✅ .vercel/output no existe${NC}"
fi

LOG_COUNT=$(find . -name "*.log" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOG_COUNT" -gt 0 ]; then
    echo "   ${YELLOW}⚠️  Archivos .log encontrados: $LOG_COUNT${NC}"
else
    echo "   ${GREEN}✅ No hay archivos .log${NC}"
fi
echo ""

# Scripts disponibles
echo "🛠️  Scripts disponibles:"
ls -1 scripts/*.sh 2>/dev/null | while read -r script; do
    echo "   - $(basename "$script")"
done
echo ""

# Documentación
echo "📚 Documentación disponible:"
ls -1 *.md 2>/dev/null | grep -iE 'optimizacion|resultado|completa' | while read -r doc; do
    echo "   - $doc"
done
echo ""

echo "${GREEN}✅ Estado verificado${NC}"
echo ""
