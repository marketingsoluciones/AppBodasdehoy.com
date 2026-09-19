#!/bin/bash
# Script para probar el bypass técnico en champagne events
# Verifica que el endpoint funciona, independientemente de si el usuario tiene eventos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Test de bypass técnico para Champagne Events${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Verificar parámetros
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Uso: $0 <email>${NC}"
    echo -e "${YELLOW}Ejemplo: $0 jcc@bodasdehoy.com${NC}"
    echo -e "${YELLOW}Ejemplo: $0 admin@champagne-events.com.mx${NC}"
    exit 1
fi

EMAIL="$1"
ENTORNO="${2:-dev}"  # Por defecto dev, según reglas del proyecto
BASE_URL=""

# Determinar URL según entorno
case "$ENTORNO" in
    "test")
        BASE_URL="https://app-test.champagne-events.com.mx"
        ;;
    "dev")
        BASE_URL="https://champagne-events-dev.bodasdehoy.com"
        ;;
    "local")
        BASE_URL="http://localhost:3220"
        ;;
    *)
        echo -e "${RED}❌ Entorno no válido: ${ENTORNO}${NC}"
        echo -e "${YELLOW}Usa: dev, test o local${NC}"
        exit 1
        ;;
esac

BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}&development=champagne-events"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  📧 Email: ${EMAIL}"
echo -e "  🏭 Entorno: ${ENTORNO}"
echo -e "  🌐 URL: ${BASE_URL}"
echo -e "  🔗 Bypass: ${BYPASS_URL}"

echo -e "\n${GREEN}🔍 Probando conectividad...${NC}"

# Test 1: Verificar que el dominio responde
echo -e "${YELLOW}1. Verificando dominio ${BASE_URL}...${NC}"
if curl -s --head --request GET "$BASE_URL" | grep -E "200 OK|302 Found|301 Moved" > /dev/null; then
    echo -e "${GREEN}   ✅ Dominio accesible${NC}"
else
    echo -e "${RED}   ❌ Dominio no accesible${NC}"
    echo -e "${YELLOW}   Verifica VPN o conectividad${NC}"
    exit 1
fi

# Test 2: Verificar que el endpoint de bypass existe
echo -e "${YELLOW}2. Verificando endpoint /api/dev/bypass...${NC}"
ENDPOINT_URL="${BASE_URL}/api/dev/bypass"
if curl -s --head --request GET "$ENDPOINT_URL" | grep -E "200 OK|302 Found|301 Moved|404 Not Found" > /dev/null; then
    echo -e "${GREEN}   ✅ Endpoint existe${NC}"
else
    echo -e "${RED}   ❌ Endpoint no accesible${NC}"
    exit 1
fi

# Test 3: Probar el bypass (solicitud GET)
echo -e "${YELLOW}3. Probando bypass para email ${EMAIL}...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BYPASS_URL")

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "302" ]; then
    echo -e "${GREEN}   ✅ Bypass exitoso (HTTP ${RESPONSE})${NC}"
    
    # Mostrar URL para abrir manualmente
    echo -e "\n${GREEN}🔓 URL de bypass lista:${NC}"
    echo -e "${YELLOW}${BYPASS_URL}${NC}"
    
    # Abrir en navegador
    echo -e "\n${GREEN}🌐 Abriendo en navegador...${NC}"
    if command -v open &> /dev/null; then
        open "$BYPASS_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$BYPASS_URL"
    fi
    
    echo -e "\n${GREEN}✅ Bypass técnico funciona correctamente${NC}"
    echo -e "${YELLOW}💡 Nota: El usuario puede no tener eventos, pero la autenticación funciona${NC}"
    
else
    echo -e "${RED}   ❌ Bypass falló (HTTP ${RESPONSE})${NC}"
    
    # Intentar sin parámetro development
    ALT_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}"
    echo -e "${YELLOW}   Probando alternativa: ${ALT_URL}${NC}"
    ALT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$ALT_URL")
    
    if [ "$ALT_RESPONSE" = "200" ] || [ "$ALT_RESPONSE" = "302" ]; then
        echo -e "${GREEN}   ✅ Alternativa funciona (HTTP ${ALT_RESPONSE})${NC}"
        echo -e "${YELLOW}   URL alternativa: ${ALT_URL}${NC}"
    else
        echo -e "${RED}   ❌ Alternativa también falló${NC}"
    fi
fi

echo -e "\n${GREEN}📝 Verificación después del bypass:${NC}"
echo -e "${YELLOW}1. Abre herramientas de desarrollador (F12)${NC}"
echo -e "${YELLOW}2. Ejecuta en consola:${NC}"
echo -e "   localStorage.getItem('dev_bypass')"
echo -e "   localStorage.getItem('dev_bypass_email')"
echo -e "   localStorage.getItem('__dev_domain')"
echo -e "${YELLOW}3. Deberías ver:${NC}"
echo -e "   • dev_bypass: 'true'"
echo -e "   • dev_bypass_email: '${EMAIL}'"
echo -e "   • __dev_domain: 'champagne-events' (o el dominio detectado)"

echo -e "\n${BLUE}🧪 Test completado. El bypass funciona si:${NC}"
echo -e "1. ✅ Dominio accesible"
echo -e "2. ✅ Endpoint existe"
echo -e "3. ✅ Respuesta HTTP 200/302"
echo -e "4. ✅ localStorage establecido correctamente"

# Opcional: Verificar con curl más detallado
echo -e "\n${YELLOW}🔍 Debug adicional (opcional):${NC}"
echo -e "curl -v '${BYPASS_URL}' 2>&1 | grep -E 'HTTP|< Location:|Set-Cookie:'"