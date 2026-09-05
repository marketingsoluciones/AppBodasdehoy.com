#!/bin/bash
# Script para usar bypass en champagne events (entorno de desarrollo)
# Especialmente para pruebas con usuario "mari luz"

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍾 Script de bypass para Champagne Events${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verificar que tenemos los parámetros necesarios
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Uso: $0 <email> [entorno] [evento_id]${NC}"
    echo -e "${YELLOW}Ejemplos:${NC}"
    echo -e "  $0 jcc@bodasdehoy.com test"
    echo -e "  $0 test@champagne-events.com.mx dev EVENTO_123"
    echo -e "  $0 admin@champagne-events.com.mx test"
    echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo -e "  • El email debe existir en el sistema de champagne events"
    echo -e "  • Si no tienes el email exacto de 'mari luz', usa uno que exista"
    echo -e "  • El bypass solo funciona si el usuario existe en la base de datos"
    echo -e "\n${YELLOW}Emails sugeridos para pruebas:${NC}"
    echo -e "  • jcc@bodasdehoy.com (usuario JCC multi-marca)"
    echo -e "  • test@champagne-events.com.mx"
    echo -e "  • admin@champagne-events.com.mx"
    echo -e "  • contacto@champagne-events.com.mx"
    echo -e "\n${YELLOW}Entornos disponibles:${NC}"
    echo -e "  - test (app-test.champagne-events.com.mx)"
    echo -e "  - dev (app-dev.champagne-events.com.mx)"
    echo -e "  - local (localhost:3220 con development=champagne-events)"
    exit 1
fi

EMAIL="$1"
ENTORNO="${2:-test}"  # Por defecto test, que es el más común
EVENTO_ID="${3:-}"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  🍾 Whitlelabel: Champagne Events"
echo -e "  📧 Email: ${EMAIL}"
echo -e "  🏭 Entorno: ${ENTORNO} (por defecto: test)"
echo -e "  🎉 Evento ID: ${EVENTO_ID:-No especificado}"
echo -e "\n${YELLOW}💡 Nota: Si no ves eventos ni mensajes, el email puede no existir en champagne events${NC}"
echo -e "   • Prueba con jcc@bodasdehoy.com (usuario JCC multi-marca)"
echo -e "   • O contacta al equipo para obtener credenciales válidas"

# Determinar la URL base según el entorno
case "$ENTORNO" in
    "test")
        # Dominio correcto para champagne events test
        BASE_URL="https://app-test.champagne-events.com.mx"
        echo -e "${GREEN}✅ Usando dominio correcto para champagne events test${NC}"
        ;;
    "dev")
        # Para desarrollo champagne events
        BASE_URL="https://app-dev.champagne-events.com.mx"
        ;;
    "local")
        BASE_URL="http://localhost:3220"
        echo -e "${YELLOW}⚠️  Nota: Para local, asegúrate de:${NC}"
        echo -e "  1. Tener el servidor corriendo (pnpm dev en apps/appEventos)"
        echo -e "  2. Usar development=champagne-events"
        ;;
    *)
        echo -e "${RED}❌ Entorno no válido: $ENTORNO${NC}"
        echo -e "${YELLOW}Usa: dev, test o local${NC}"
        exit 1
        ;;
esac

# Construir URL de bypass con parámetro de development
# Para champagne events, siempre agregamos development=champagne-events
if [ -n "$EVENTO_ID" ]; then
    BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}&development=champagne-events&d=/evento/${EVENTO_ID}"
else
    BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}&development=champagne-events"
fi

echo -e "\n${GREEN}🔓 URL de bypass:${NC}"
echo -e "${YELLOW}${BYPASS_URL}${NC}"

# Mostrar URL alternativa sin development (por si la detección automática funciona)
echo -e "\n${YELLOW}💡 URL alternativa (sin development explícito):${NC}"
if [ -n "$EVENTO_ID" ]; then
    echo -e "   ${BASE_URL}/api/dev/bypass?email=${EMAIL}&d=/evento/${EVENTO_ID}"
else
    echo -e "   ${BASE_URL}/api/dev/bypass?email=${EMAIL}"
fi

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

echo -e "\n${GREEN}📝 Instrucciones específicas para Champagne Events:${NC}"
echo -e "1. ${YELLOW}Espera a que se cargue la página${NC}"
echo -e "2. ${YELLOW}Verifica que el tema sea champagne events (colores beige/marrón)${NC}"
echo -e "3. ${YELLOW}Busca el icono de campana 🔔 para notificaciones${NC}"
echo -e "4. ${YELLOW}Revisa si hay notificaciones pendientes${NC}"

echo -e "\n${GREEN}🔍 Para verificar que estás en Champagne Events:${NC}"
echo -e "${YELLOW}1. Abre las herramientas de desarrollador (F12)${NC}"
echo -e "${YELLOW}2. Ejecuta en consola:${NC}"
echo -e "   localStorage.getItem('dev_bypass_email')"
echo -e "   localStorage.getItem('dev_bypass')"
echo -e "   window.location.hostname"

echo -e "\n${GREEN}🔄 Scripts alternativos:${NC}"
echo -e "${YELLOW}Para probar envío de emails:${NC}"
echo -e "  tsx scripts/test-email-delivery.ts --email=${EMAIL} --evento=EVENTO_ID --dev=champagne-events"

echo -e "\n${BLUE}✅ Script completado. Usa el bypass para champagne events.${NC}"

# Verificar conectividad
echo -e "\n${GREEN}🔍 Verificando conectividad con ${BASE_URL}...${NC}"
if command -v curl &> /dev/null; then
    if curl -s --head --request GET "$BASE_URL" | grep -E "200 OK|302 Found|301 Moved" > /dev/null; then
        echo -e "${GREEN}✅ El entorno ${ENTORNO} está accesible${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo verificar la conectividad con ${BASE_URL}${NC}"
        echo -e "${YELLOW}   Asegúrate de que:${NC}"
        echo -e "   • El entorno esté funcionando"
        echo -e "   • Tengas acceso VPN si es necesario"
        echo -e "   • El dominio sea correcto"
        
        # Sugerir alternativas
        echo -e "\n${YELLOW}🔧 Alternativas si no funciona:${NC}"
        echo -e "1. Usar localhost:"
        echo -e "   ./scripts/champagne-events-bypass.sh ${EMAIL} local"
        echo -e "2. Verificar dominios disponibles:"
        echo -e "   curl -I https://app-dev.bodasdehoy.com"
        echo -e "   curl -I https://champagne-events-dev.bodasdehoy.com"
    fi
fi