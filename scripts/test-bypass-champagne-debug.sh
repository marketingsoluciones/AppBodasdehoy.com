#!/bin/bash
# Script de debug para bypass de champagne events
# Identifica por qué el bypass no hace login

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 DEBUG BYPASS CHAMPAGNE EVENTS${NC}"
echo -e "${BLUE}================================${NC}\n"

EMAIL="${1:-mariluz@champagne-events.com.mx}"
ENV="${2:-test}"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  📧 Email: ${EMAIL}"
echo -e "  🏭 Entorno: ${ENV}"

echo -e "\n${YELLOW}⚠️  PROBLEMA IDENTIFICADO:${NC}"
echo -e "  El bypass solo funciona en entornos TEST (app-test, chat-test)"
echo -e "  NO funciona en localhost según el código AuthContext"
echo -e "  Línea 296-313: 'isTestEnv && devBypass'"

echo -e "\n${GREEN}🔍 Paso 1: Verificar entorno actual${NC}"
echo "Hostname actual: $(hostname)"
echo "URL actual: (abre navegador y mira la barra de direcciones)"

echo -e "\n${GREEN}🔍 Paso 2: Verificar localStorage${NC}"
cat << 'EOF'
// En consola del navegador (F12), ejecuta:
console.log('=== DEBUG BYPASS ===');
console.log('Hostname:', window.location.hostname);
console.log('dev_bypass:', localStorage.getItem('dev_bypass'));
console.log('dev_bypass_email:', localStorage.getItem('dev_bypass_email'));
console.log('dev_bypass_uid:', localStorage.getItem('dev_bypass_uid'));
console.log('__dev_domain:', localStorage.getItem('__dev_domain'));

// Verificar si es entorno test
const isTestEnv = window.location.hostname.includes('chat-test') || 
                  window.location.hostname.includes('app-test') || 
                  window.location.hostname.includes('test.') || 
                  window.location.hostname.includes('app-dev');
console.log('isTestEnv:', isTestEnv);
console.log('devBypass activo:', localStorage.getItem('dev_bypass') === 'true');
console.log('=== FIN DEBUG ===');
EOF

echo -e "\n${GREEN}🔍 Paso 3: URLs de bypass para champagne events${NC}"
echo -e "${YELLOW}Para entorno TEST (funciona):${NC}"
echo -e "  https://app-test.champagne-events.com.mx/api/dev/bypass?email=${EMAIL}&development=champagne-events"
echo -e ""
echo -e "${YELLOW}Para entorno DEV (puede no funcionar):${NC}"
echo -e "  https://champagne-events-dev.bodasdehoy.com/api/dev/bypass?email=${EMAIL}&development=champagne-events"
echo -e ""
echo -e "${YELLOW}Para localhost (NO funciona según código):${NC}"
echo -e "  http://localhost:3220/api/dev/bypass?email=${EMAIL}&development=champagne-events"

echo -e "\n${GREEN}🔍 Paso 4: Verificar conectividad${NC}"
echo "Probando conectividad a champagne events test..."
curl -s -o /dev/null -w "%{http_code}" "https://app-test.champagne-events.com.mx" 2>/dev/null || echo "ERROR"
echo " (200 = OK, otros = error)"

echo -e "\n${GREEN}🔍 Paso 5: Verificar configuración champagne events${NC}"
cat << 'EOF'
// En consola, verificar configuración:
console.log('=== CONFIGURACIÓN CHAMPAGNE ===');
console.log('NEXT_PUBLIC_API2_URL:', process.env.NEXT_PUBLIC_API2_URL);
console.log('NEXT_PUBLIC_DEV_WHITELABEL:', process.env.NEXT_PUBLIC_DEV_WHITELABEL);
console.log('Config development:', window.__config?.development);
console.log('Config domain:', window.__config?.domain);
console.log('Config pathDomain:', window.__config?.pathDomain);

// Verificar si champagne events está en la lista de developments
try {
  const devs = require('@bodasdehoy/shared').developments || [];
  const champagne = devs.find(d => d.development === 'champagne-events');
  console.log('Champagne en developments:', champagne);
} catch(e) {
  console.log('Error cargando developments:', e.message);
}
EOF

echo -e "\n${RED}🚨 SOLUCIONES:${NC}"
echo -e "1. ${YELLOW}Usar entorno TEST (no localhost):${NC}"
echo -e "   https://app-test.champagne-events.com.mx"
echo -e ""
echo -e "2. ${YELLOW}Verificar que localStorage tenga:${NC}"
echo -e "   dev_bypass: 'true'"
echo -e "   dev_bypass_email: '${EMAIL}'"
echo -e "   __dev_domain: 'champagne-events'"
echo -e ""
echo -e "3. ${YELLOW}Si usas localhost, modificar AuthContext:${NC}"
echo -e "   Cambiar línea 296: agregar 'localhost' a isTestEnv"
echo -e ""
echo -e "4. ${YELLOW}Probar con UID específico:${NC}"
echo -e "   https://app-test.champagne-events.com.mx/api/dev/bypass?email=${EMAIL}&uid=TEST_OWNER_UID_001"
echo -e ""
echo -e "5. ${YELLOW}Verificar que el usuario existe en champagne events:${NC}"
echo -e "   Usar SSH a API2: ./scripts/find-champagne-super-admin.sh"

echo -e "\n${GREEN}🔧 Script rápido de prueba:${NC}"
cat << 'EOF'
#!/bin/bash
# test-bypass-quick.sh
EMAIL="mariluz@champagne-events.com.mx"
URL="https://app-test.champagne-events.com.mx/api/dev/bypass?email=${EMAIL}&development=champagne-events&uid=TEST_OWNER_UID_001"

echo "🔗 URL: ${URL}"
echo "🌐 Abriendo en navegador..."
open "${URL}" || xdg-open "${URL}" || echo "Abre manualmente: ${URL}"

echo ""
echo "📝 Después de abrir, en consola (F12):"
echo "1. localStorage.getItem('dev_bypass') // debe ser 'true'"
echo "2. localStorage.getItem('dev_bypass_email') // debe ser '${EMAIL}'"
echo "3. localStorage.getItem('__dev_domain') // debe ser 'champagne-events'"
echo "4. Refrescar página (F5)"
echo "5. Verificar que aparezca logged in"
EOF

echo -e "\n${BLUE}✅ Script de debug listo.${NC}"
echo -e "${YELLOW}💡 Recuerda: El bypass solo funciona en app-test.champagne-events.com.mx${NC}"
echo -e "${YELLOW}💡 No funciona en localhost según el código actual.${NC}"