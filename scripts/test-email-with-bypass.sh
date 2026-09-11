#!/bin/bash
# Script para probar envío de emails usando bypass de desarrollo
# Este script abre el bypass de desarrollo y luego instruye cómo enviar un email de prueba

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Script de prueba de envío de emails con bypass${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Verificar que tenemos los parámetros necesarios
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Uso: $0 <email> <evento_id> [development]${NC}"
    echo -e "${YELLOW}Ejemplos:${NC}"
    echo -e "  $0 jcc@bodasdehoy.com EVENTO_123"
    echo -e "  $0 test@example.com EVENTO_456 eventosorganizador"
    echo -e "\n${YELLOW}Nota:${NC} El evento debe tener un template de email configurado"
    exit 1
fi

EMAIL="$1"
EVENTO_ID="$2"
DEVELOPMENT="${3:-bodasdehoy}"
PORT="${4:-3220}"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  📧 Email: ${EMAIL}"
echo -e "  🎉 Evento ID: ${EVENTO_ID}"
echo -e "  🌐 Development: ${DEVELOPMENT}"
echo -e "  🚪 Puerto: ${PORT}"

# Determinar la URL base
if [[ "$DEVELOPMENT" == "bodasdehoy" ]]; then
    BASE_URL="http://localhost:${PORT}"
elif [[ "$DEVELOPMENT" == "eventosorganizador" ]]; then
    BASE_URL="http://localhost:${PORT}"
else
    BASE_URL="http://localhost:${PORT}"
fi

echo -e "\n${GREEN}🔓 Activando bypass de desarrollo...${NC}"
BYPASS_URL="${BASE_URL}/api/dev/bypass?email=${EMAIL}&d=/evento/${EVENTO_ID}/invitaciones"

echo -e "${YELLOW}URL de bypass:${NC} ${BYPASS_URL}"

# Abrir el bypass en el navegador predeterminado
if command -v open &> /dev/null; then
    echo -e "${GREEN}🌐 Abriendo bypass en navegador...${NC}"
    open "$BYPASS_URL"
elif command -v xdg-open &> /dev/null; then
    echo -e "${GREEN}🌐 Abriendo bypass en navegador...${NC}"
    xdg-open "$BYPASS_URL"
else
    echo -e "${YELLOW}⚠️  No se pudo abrir automáticamente. Por favor abre manualmente:${NC}"
    echo -e "   ${BYPASS_URL}"
fi

echo -e "\n${GREEN}📝 Instrucciones para probar el envío de email:${NC}"
echo -e "1. ${YELLOW}Espera a que se cargue la página de invitaciones${NC}"
echo -e "2. ${YELLOW}Ve a la sección 'Email'${NC}"
echo -e "3. ${YELLOW}Asegúrate de que hay un template de email seleccionado${NC}"
echo -e "4. ${YELLOW}En la sección 'Email de prueba', ingresa un email de destino${NC}"
echo -e "5. ${YELLOW}Haz clic en 'Enviar email de prueba'${NC}"
echo -e "6. ${YELLOW}Verifica si el email llega a la bandeja de entrada${NC}"

echo -e "\n${GREEN}🔍 Para verificar si el email llegó:${NC}"
echo -e "1. ${YELLOW}Revisa la bandeja de entrada de ${EMAIL}${NC}"
echo -e "2. ${YELLOW}Busca en la carpeta de spam${NC}"
echo -e "3. ${YELLOW}Si usas Mailinblue/Brevo, revisa el panel de estadísticas${NC}"

echo -e "\n${GREEN}🔄 Alternativa: Usar el script TypeScript${NC}"
echo -e "${YELLOW}Ejecuta:${NC}"
echo -e "  tsx scripts/test-email-delivery.ts --email=${EMAIL} --evento=${EVENTO_ID} --dev=${DEVELOPMENT}"

echo -e "\n${BLUE}✅ Script completado. Sigue las instrucciones arriba para probar el envío de emails.${NC}"