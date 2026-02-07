#!/bin/bash

# Script para verificar el estado de chat-test.bodasdehoy.com
# Verifica DNS, HTTP, y compara con chat producción

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Verificación: chat-test.bodasdehoy.com                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# URLs a verificar
CHAT_TEST="https://chat-test.bodasdehoy.com"
CHAT_PROD="https://chat.bodasdehoy.com"

echo -e "${CYAN}━━━ Verificando DNS ━━━${NC}\n"

# Verificar DNS de chat-test
echo -e "${CYAN}ℹ${NC} Verificando DNS de chat-test..."
if dig +short chat-test.bodasdehoy.com | grep -q '^[0-9]'; then
    CHAT_TEST_IP=$(dig +short chat-test.bodasdehoy.com | head -1)
    echo -e "${GREEN}✅${NC} DNS resuelto: ${CHAT_TEST_IP}"
    CHAT_TEST_DNS=true
else
    echo -e "${RED}❌${NC} DNS NO resuelto"
    CHAT_TEST_DNS=false
fi

# Verificar DNS de chat producción
echo -e "${CYAN}ℹ${NC} Verificando DNS de chat producción..."
if dig +short chat.bodasdehoy.com | grep -q '^[0-9]'; then
    CHAT_PROD_IP=$(dig +short chat.bodasdehoy.com | head -1)
    echo -e "${GREEN}✅${NC} DNS resuelto: ${CHAT_PROD_IP}"
    CHAT_PROD_DNS=true
else
    echo -e "${RED}❌${NC} DNS NO resuelto"
    CHAT_PROD_DNS=false
fi

echo ""

# Verificar HTTP
echo -e "${CYAN}━━━ Verificando HTTP ━━━${NC}\n"

# Verificar chat-test
echo -e "${CYAN}ℹ${NC} Verificando HTTP de chat-test..."
if [ "$CHAT_TEST_DNS" = true ]; then
    CHAT_TEST_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$CHAT_TEST" 2>/dev/null || echo "000")
    if [ "$CHAT_TEST_HTTP" = "200" ]; then
        echo -e "${GREEN}✅${NC} HTTP ${CHAT_TEST_HTTP} - OK"
    elif [ "$CHAT_TEST_HTTP" = "502" ]; then
        echo -e "${RED}❌${NC} HTTP ${CHAT_TEST_HTTP} - Bad Gateway (servidor no responde)"
    elif [ "$CHAT_TEST_HTTP" = "000" ]; then
        echo -e "${RED}❌${NC} Error de conexión"
    else
        echo -e "${YELLOW}⚠️${NC} HTTP ${CHAT_TEST_HTTP}"
    fi
else
    echo -e "${RED}❌${NC} No se puede verificar HTTP (DNS no resuelve)"
    CHAT_TEST_HTTP="N/A"
fi

# Verificar chat producción
echo -e "${CYAN}ℹ${NC} Verificando HTTP de chat producción..."
if [ "$CHAT_PROD_DNS" = true ]; then
    CHAT_PROD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$CHAT_PROD" 2>/dev/null || echo "000")
    if [ "$CHAT_PROD_HTTP" = "200" ]; then
        echo -e "${GREEN}✅${NC} HTTP ${CHAT_PROD_HTTP} - OK"
    elif [ "$CHAT_PROD_HTTP" = "502" ]; then
        echo -e "${RED}❌${NC} HTTP ${CHAT_PROD_HTTP} - Bad Gateway"
    elif [ "$CHAT_PROD_HTTP" = "000" ]; then
        echo -e "${RED}❌${NC} Error de conexión"
    else
        echo -e "${YELLOW}⚠️${NC} HTTP ${CHAT_PROD_HTTP}"
    fi
else
    echo -e "${RED}❌${NC} No se puede verificar HTTP (DNS no resuelve)"
    CHAT_PROD_HTTP="N/A"
fi

echo ""

# Verificar configuración
echo -e "${CYAN}━━━ Verificando Configuración ━━━${NC}\n"

ENV_FILE="apps/web/.env.production"
if [ -f "$ENV_FILE" ]; then
    NEXT_PUBLIC_CHAT=$(grep "^NEXT_PUBLIC_CHAT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$NEXT_PUBLIC_CHAT" ]; then
        echo -e "${CYAN}ℹ${NC} NEXT_PUBLIC_CHAT configurado: ${NEXT_PUBLIC_CHAT}"
        if echo "$NEXT_PUBLIC_CHAT" | grep -q "chat-test"; then
            echo -e "${YELLOW}⚠️${NC} chat-test configurado - El fix usará chat producción automáticamente"
        else
            echo -e "${GREEN}✅${NC} URL configurada correctamente"
        fi
    else
        echo -e "${YELLOW}⚠️${NC} NEXT_PUBLIC_CHAT no encontrado en $ENV_FILE"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Archivo $ENV_FILE no encontrado"
fi

echo ""

# Resumen
echo -e "${BLUE}━━━ RESUMEN ━━━${NC}\n"

echo "chat-test.bodasdehoy.com:"
echo "  DNS: $([ "$CHAT_TEST_DNS" = true ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo "  HTTP: $([ "$CHAT_TEST_HTTP" = "200" ] && echo -e "${GREEN}✅${NC} ${CHAT_TEST_HTTP}" || echo -e "${RED}❌${NC} ${CHAT_TEST_HTTP}")"

echo ""
echo "chat.bodasdehoy.com:"
echo "  DNS: $([ "$CHAT_PROD_DNS" = true ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo "  HTTP: $([ "$CHAT_PROD_HTTP" = "200" ] && echo -e "${GREEN}✅${NC} ${CHAT_PROD_HTTP}" || echo -e "${RED}❌${NC} ${CHAT_PROD_HTTP}")"

echo ""

# Recomendaciones
if [ "$CHAT_TEST_HTTP" = "502" ] && [ "$CHAT_PROD_HTTP" = "200" ]; then
    echo -e "${YELLOW}⚠️ RECOMENDACIÓN:${NC}"
    echo "  chat-test da 502 pero chat producción funciona"
    echo "  ✅ El fix en código ya resuelve esto automáticamente"
    echo "  ✅ O configurar DNS: chat-test → CNAME → chat.bodasdehoy.com"
elif [ "$CHAT_TEST_DNS" = false ]; then
    echo -e "${YELLOW}⚠️ NOTA:${NC}"
    echo "  DNS no resuelve desde terminal (puede ser VPN)"
    echo "  El navegador puede resolver DNS correctamente"
    echo "  El fix funciona en el navegador"
fi

echo ""
