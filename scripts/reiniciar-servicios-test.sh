#!/bin/bash

# Script para reiniciar servicios app-test y chat-test
# Uso: ./scripts/reiniciar-servicios-test.sh

echo "======================================"
echo "Reinicio de Servicios Test"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si estamos en el directorio correcto
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}Error: No se encontró ecosystem.config.js${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo -e "${YELLOW}1. Estado actual de PM2...${NC}"
pm2 list

echo ""
echo -e "${YELLOW}2. Deteniendo servicios...${NC}"
pm2 stop app-test chat-test 2>/dev/null || echo "Servicios no estaban corriendo"

echo ""
echo -e "${YELLOW}3. Eliminando servicios de PM2...${NC}"
pm2 delete app-test chat-test 2>/dev/null || echo "Servicios no estaban en PM2"

echo ""
echo -e "${YELLOW}4. Verificando builds...${NC}"

# Verificar build de app-test
if [ ! -d "apps/web/.next" ]; then
    echo -e "${RED}⚠️  Build de apps/web no encontrado${NC}"
    echo "Ejecutando build..."
    pnpm --filter @bodasdehoy/web build
else
    echo -e "${GREEN}✓ Build de apps/web existe${NC}"
fi

# Verificar build de chat-test
if [ ! -d "apps/copilot/.next" ]; then
    echo -e "${RED}⚠️  Build de apps/copilot no encontrado${NC}"
    echo "Ejecutando build..."
    pnpm build:copilot
else
    echo -e "${GREEN}✓ Build de apps/copilot existe${NC}"
fi

echo ""
echo -e "${YELLOW}5. Iniciando servicios con PM2...${NC}"
pm2 start ecosystem.config.js

echo ""
echo -e "${YELLOW}6. Estado de servicios...${NC}"
pm2 list

echo ""
echo -e "${YELLOW}7. Guardando configuración PM2...${NC}"
pm2 save

echo ""
echo -e "${YELLOW}8. Verificando puertos...${NC}"
echo -n "Puerto 3000 (app-test): "
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ En uso${NC}"
else
    echo -e "${RED}✗ No responde${NC}"
fi

echo -n "Puerto 3210 (chat-test): "
if lsof -i :3210 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ En uso${NC}"
else
    echo -e "${RED}✗ No responde${NC}"
fi

echo ""
echo -e "${YELLOW}9. Verificando URLs...${NC}"

# Función para verificar URL
check_url() {
    local url=$1
    local name=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)

    echo -n "$name: "
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ $status${NC}"
    else
        echo -e "${RED}✗ $status${NC}"
    fi
}

check_url "https://app-test.bodasdehoy.com" "app-test"
check_url "https://chat-test.bodasdehoy.com" "chat-test"

echo ""
echo -e "${GREEN}======================================"
echo "Reinicio completado"
echo "======================================${NC}"
echo ""
echo "Para ver logs:"
echo "  pm2 logs app-test"
echo "  pm2 logs chat-test"
echo ""
echo "Para monitorear:"
echo "  pm2 monit"
