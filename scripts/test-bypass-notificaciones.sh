#!/bin/bash
# Script para usar bypass en entorno test y verificar notificaciones pendientes

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Script de bypass para test - Verificar notificaciones${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# Verificar que tenemos los parámetros necesarios
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Uso: $0 <email> [entorno] [evento_id]${NC}"
    echo -e "${YELLOW}Ejemplos:${NC}"
    echo -e "  $0 jcc@bodasdehoy.com test"
    echo -e "  $0 jcc@eventosorganizador.com test EVENTO_123"
    echo -e "  $0 test@example.com test"
    echo -e "\n${YELLOW}Entornos disponibles:${NC}"
    echo -e "  - test (app-test.bodasdehoy.com)"
    echo -e "  - dev (app-dev.bodasdehoy.com)"
    echo -e "  - local (localhost:3220)"
    exit 1
fi

EMAIL="$1"
ENTORNO="${2:-test}"
EVENTO_ID="${3:-}"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  📧 Email: ${EMAIL}"
echo -e "  🏭 Entorno: ${ENTORNO}"
echo -e "  🎉 Evento ID: ${EVENTO_ID:-No especificado}"

# Determinar la URL base según el entorno
case "$ENTORNO" in
    "test")
        BASE_URL="https://app-test.bodasdehoy.com"
        ;;
    "dev")
        BASE_URL="https://app-dev.bodasdehoy.com"
        ;;
    "local")
        BASE_URL="http://localhost:3220"
        ;;
    *)
        echo -e "${RED}❌ Entorno no válido: $ENTORNO${NC}"
        echo -e "${YELLOW}Usa: test, dev o local${NC}"
        exit 1
        ;;
esac

# Construir URL de bypass
if [ -n "$EVENTO_ID" ]; then
    BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}&d=/evento/${EVENTO_ID}"
else
    BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}"
fi

echo -e "\n${GREEN}🔓 URL de bypass:${NC}"
echo -e "${YELLOW}${BYPASS_URL}${NC}"

# Abrir el bypass en el navegador predeterminado
echo -e "\n${GREEN}🌐 Abriendo bypass en navegador...${NC}"
if command -v open &> /dev/null; then
    open "$BYPASS_URL"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$BYPASS_URL"
else
    echo -e "${YELLOW}⚠️  No se pudo abrir automáticamente. Por favor abre manualmente:${NC}"
    echo -e "   ${BYPASS_URL}"
fi

echo -e "\n${GREEN}📝 Instrucciones para verificar notificaciones:${NC}"
echo -e "1. ${YELLOW}Espera a que se cargue la página principal${NC}"
echo -e "2. ${YELLOW}Busca el icono de campana 🔔 en la esquina superior derecha${NC}"
echo -e "3. ${YELLOW}Haz clic en el icono de notificaciones${NC}"
echo -e "4. ${YELLOW}Revisa si hay notificaciones pendientes${NC}"
echo -e "5. ${YELLOW}Si hay un número rojo sobre el icono, indica notificaciones no leídas${NC}"

echo -e "\n${GREEN}🔍 Tipos de notificaciones que puedes encontrar:${NC}"
echo -e "  • ${YELLOW}Invitaciones pendientes de confirmación${NC}"
echo -e "  • ${YELLOW}Mensajes de proveedores${NC}"
echo -e "  • ${YELLOW}Recordatorios de eventos${NC}"
echo -e "  • ${YELLOW}Actualizaciones de presupuesto${NC}"
echo -e "  • ${YELLOW}Notificaciones del sistema${NC}"

echo -e "\n${GREEN}🔄 Para verificar notificaciones programáticamente:${NC}"
echo -e "${YELLOW}1. Abre las herramientas de desarrollador (F12)${NC}"
echo -e "${YELLOW}2. Ve a la pestaña 'Console'${NC}"
echo -e "${YELLOW}3. Ejecuta este comando:${NC}"
echo -e "   localStorage.getItem('dev_bypass_email')"
echo -e "${YELLOW}4. Para ver notificaciones en consola:${NC}"
echo -e "   fetch('/api/notifications').then(r => r.json()).then(console.log)"

echo -e "\n${BLUE}✅ Script completado. Usa el bypass para verificar notificaciones pendientes.${NC}"

# Opcional: Verificar si el entorno test está accesible
echo -e "\n${GREEN}🔍 Verificando conectividad con ${BASE_URL}...${NC}"
if command -v curl &> /dev/null; then
    if curl -s --head --request GET "$BASE_URL" | grep "200 OK" > /dev/null; then
        echo -e "${GREEN}✅ El entorno ${ENTORNO} está accesible${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo verificar la conectividad con ${BASE_URL}${NC}"
        echo -e "${YELLOW}   Asegúrate de que el entorno esté funcionando${NC}"
    fi
fi