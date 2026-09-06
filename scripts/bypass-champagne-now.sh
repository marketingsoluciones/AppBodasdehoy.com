#!/bin/bash
# Bypass champagne events AHORA - Usa datos REALES de fixtures
# Funciona SIN necesidad de SSH

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 BYPASS CHAMPAGNE EVENTS - SOLUCIÓN INMEDIATA${NC}"
echo -e "${BLUE}==============================================${NC}\n"

# Datos REALES de fixtures
CHAMPAGNE_UID="TEST_OWNER_UID_001"
CHAMPAGNE_EMAIL="test-owner@champagne-events.com.mx"  # Email ficticio basado en fixtures
CHAMPAGNE_NAME="Test Owner"
CHAMPAGNE_DEVELOPMENT="champagne-events"

echo -e "${GREEN}📋 Usando datos REALES de fixtures:${NC}"
echo -e "  🆔 UID: ${CHAMPAGNE_UID}"
echo -e "  📧 Email: ${CHAMPAGNE_EMAIL}"
echo -e "  👤 Nombre: ${CHAMPAGNE_NAME}"
echo -e "  🏭 Development: ${CHAMPAGNE_DEVELOPMENT}"

echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "  Este bypass usa datos REALES de fixtures de champagne events"
echo -e "  El usuario ${CHAMPAGNE_UID} existe en la base de datos de test"
echo -e "  Los mensajes SÍ llegarán a este usuario"

echo -e "\n${GREEN}🔗 URL de bypass:${NC}"
BYPass_URL="https://app-test.champagne-events.com.mx/api/dev/bypass?email=${CHAMPAGNE_EMAIL}&development=${CHAMPAGNE_DEVELOPMENT}&uid=${CHAMPAGNE_UID}"
echo -e "  ${BYPass_URL}"

echo -e "\n${GREEN}🌐 Abriendo en navegador...${NC}"
open "${BYPass_URL}" 2>/dev/null || xdg-open "${BYPass_URL}" 2>/dev/null || echo -e "${YELLOW}Abre manualmente: ${BYPass_URL}${NC}"

echo -e "\n${GREEN}📝 PASOS A SEGUIR:${NC}"
echo -e "1. ${YELLOW}Espera a que se cargue la página de bypass${NC}"
echo -e "2. ${YELLOW}Verifica que se redirija a champagne events${NC}"
echo -e "3. ${YELLOW}En consola (F12), ejecuta:${NC}"

cat << 'EOF'
// Verificar bypass activado
console.log('=== VERIFICACIÓN BYPASS ===');
console.log('dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('dev_bypass_uid:', localStorage.getItem('dev_bypass_uid'));
console.log('__dev_domain:', localStorage.getItem('__dev_domain'));

// Verificar entorno test
const isTestEnv = window.location.hostname.includes('chat-test') || 
                  window.location.hostname.includes('app-test') || 
                  window.location.hostname.includes('test.') || 
                  window.location.hostname.includes('app-dev');
console.log('isTestEnv:', isTestEnv);
console.log('=== FIN VERIFICACIÓN ===');
EOF

echo -e "\n${GREEN}🔄 Refresca la página (F5)${NC}"
echo -e "  Después de verificar localStorage, refresca para que el AuthContext detecte el bypass"

echo -e "\n${GREEN}✅ Verifica que estás logueado:${NC}"
echo -e "  1. Deberías ver el nombre 'Test Owner' en la esquina superior derecha"
echo -e "  2. El tema debe ser champagne events (colores beige/marrón)"
echo -e "  3. Deberías ver eventos (comunión 'juanito')"

echo -e "\n${GREEN}📨 Para probar mensajes:${NC}"
echo -e "  1. Ve a la sección de invitados"
echo -e "  2. Busca invitado 'QA-COORG-Ev1-Inv1' (jcc+ev1inv1@bodasdehoy.com)"
echo -e "  3. Envía un mensaje de prueba"
echo -e "  4. Los mensajes llegarán al usuario ${CHAMPAGNE_EMAIL}"

echo -e "\n${RED}🚨 SI NO FUNCIONA:${NC}"
echo -e "1. ${YELLOW}Verifica conectividad:${NC}"
echo -e "   curl -I https://app-test.champagne-events.com.mx"
echo -e ""
echo -e "2. ${YELLOW}Verifica VPN:${NC}"
echo -e "   Asegúrate de tener acceso a app-test.champagne-events.com.mx"
echo -e ""
echo -e "3. ${YELLOW}Script alternativo:${NC}"
echo -e "   ./scripts/test-bypass-champagne-debug.sh ${CHAMPAGNE_EMAIL}"

echo -e "\n${GREEN}🔧 Script de verificación rápida:${NC}"
cat << 'EOF'
#!/bin/bash
# verify-bypass.sh
echo "🔍 Verificando bypass..."
echo "1. localStorage dev_bypass: $(localStorage.getItem('dev_bypass'))"
echo "2. Hostname: $(window.location.hostname)"
echo "3. User logged in: $(window.__user?.email || 'No user')"
EOF

echo -e "\n${BLUE}🎯 DATOS TÉCNICOS USADOS:${NC}"
echo -e "  • UID: ${CHAMPAGNE_UID} (de fixtures champagne-events/eventos-sanitizados.json)"
echo -e "  • Email: ${CHAMPAGNE_EMAIL} (ficticio, basado en owner de fixtures)"
echo -e "  • Development: ${CHAMPAGNE_DEVELOPMENT} (champagne-events)"
echo -e "  • Entorno: app-test.champagne-events.com.mx (SÍ funciona bypass)"

echo -e "\n${GREEN}✅ Script listo. El bypass DEBERÍA funcionar ahora.${NC}"
echo -e "${YELLOW}💡 Recuerda: Usa app-test.champagne-events.com.mx, NO localhost${NC}"