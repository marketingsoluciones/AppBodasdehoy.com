#!/bin/bash

# Script completo para ejecutar TestSuite
# Abre el TestSuite, verifica conectividad y proporciona instrucciones

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Ejecutar TestSuite Completo                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Determinar URL base
if [ -f "apps/web/.env.production" ]; then
  CHAT_URL=$(grep -E "^NEXT_PUBLIC_CHAT=" apps/web/.env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")
fi

if [ -z "$CHAT_URL" ]; then
  CHAT_URL="https://chat-test.bodasdehoy.com"
fi

# Construir URL del TestSuite
TESTSUITE_URL="${CHAT_URL}/bodasdehoy/admin/tests"

echo -e "${CYAN}━━━ Configuración ━━━${NC}\n"
echo -e "URL del Chat: ${CHAT_URL}"
echo -e "URL del TestSuite: ${TESTSUITE_URL}\n"

# Verificar conectividad
echo -e "${CYAN}━━━ Verificando Conectividad ━━━${NC}\n"

echo -e "${YELLOW}ℹ${NC} Verificando backend IA..."
if node scripts/verificar-backend-ia.mjs 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Backend IA verificado\n"
else
  echo -e "${YELLOW}⚠️${NC} Backend IA tiene problemas (puede ser VPN)\n"
fi

echo -e "${YELLOW}ℹ${NC} Verificando TestSuite..."
if curl -s --head --fail "${TESTSUITE_URL}" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} TestSuite responde\n"
else
  echo -e "${YELLOW}⚠️${NC} TestSuite no responde desde terminal (puede ser VPN)\n"
  echo -e "${YELLOW}💡${NC} El navegador puede resolver DNS aunque la terminal no pueda\n"
fi

# Abrir en navegador
echo -e "${CYAN}━━━ Abriendo TestSuite ━━━${NC}\n"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo -e "${GREEN}🌐${NC} Abriendo en navegador (macOS)..."
  python3 -m webbrowser "${TESTSUITE_URL}" 2>/dev/null || \
  open -a "Google Chrome" "${TESTSUITE_URL}" 2>/dev/null || \
  open -a "Safari" "${TESTSUITE_URL}" 2>/dev/null || \
  echo -e "${YELLOW}💡${NC} Abre manualmente: ${TESTSUITE_URL}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo -e "${GREEN}🌐${NC} Abriendo en navegador (Linux)..."
  xdg-open "${TESTSUITE_URL}" 2>/dev/null || \
  sensible-browser "${TESTSUITE_URL}" 2>/dev/null || \
  firefox "${TESTSUITE_URL}" 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # Windows
  echo -e "${GREEN}🌐${NC} Abriendo en navegador (Windows)..."
  start "${TESTSUITE_URL}"
fi

echo ""

# Instrucciones
echo -e "${CYAN}━━━ Instrucciones ━━━${NC}\n"

echo -e "${GREEN}1.${NC} En el TestSuite que se abrió:"
echo -e "   - Verifica que los tests se carguen correctamente"
echo -e "   - Revisa el contador: 'X tests disponibles'"
echo ""
echo -e "${GREEN}2.${NC} Seleccionar tests:"
echo -e "   - Marca los checkboxes de los tests que quieres ejecutar"
echo -e "   - Puedes seleccionar todos o un subconjunto"
echo ""
echo -e "${GREEN}3.${NC} Ejecutar tests:"
echo -e "   - Haz click en el botón 'Run Tests'"
echo -e "   - Observa el progreso en el banner azul"
echo -e "   - Los resultados aparecerán en la tabla"
echo ""
echo -e "${GREEN}4.${NC} Verificar resultados:"
echo -e "   - Revisa el estado de cada test (passed/failed)"
echo -e "   - Revisa los detalles de errores si hay"
echo -e "   - Verifica estadísticas finales"
echo ""

# Verificar DevTools
echo -e "${CYAN}━━━ Debugging ━━━${NC}\n"
echo -e "${YELLOW}💡${NC} Para ver logs detallados:"
echo -e "   - Abre DevTools (F12)"
echo -e "   - Ve a la pestaña 'Console'"
echo -e "   - Busca logs que empiecen con '[TestSuite]'"
echo ""

# Verificar errores comunes
echo -e "${CYAN}━━━ Troubleshooting ━━━${NC}\n"

echo -e "Si hay problemas:"
echo -e "  ${YELLOW}1.${NC} Verificar autenticación:"
echo -e "     - Asegúrate de estar logueado"
echo -e "     - Verifica que la sesión sea válida"
echo ""
echo -e "  ${YELLOW}2.${NC} Verificar backend IA:"
echo -e "     - Ejecuta: node scripts/verificar-backend-ia.mjs"
echo -e "     - Verifica desde navegador: https://api-ia.bodasdehoy.com"
echo ""
echo -e "  ${YELLOW}3.${NC} Verificar VPN:"
echo -e "     - Si usas VPN, puede estar bloqueando conexiones"
echo -e "     - Prueba desactivarla temporalmente"
echo ""
echo -e "  ${YELLOW}4.${NC} Verificar fix de i18n:"
echo -e "     - Si ves 'error.title' o 'error.desc', el fix no está aplicado"
echo -e "     - Verifica que los cambios estén compilados"
echo ""

echo -e "${GREEN}✅${NC} TestSuite abierto. Sigue las instrucciones arriba para ejecutar tests.\n"
