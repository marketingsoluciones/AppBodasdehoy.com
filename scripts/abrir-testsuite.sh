#!/bin/bash

# Script para abrir el TestSuite en el navegador
# Uso: ./scripts/abrir-testsuite.sh [url]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Abriendo TestSuite...${NC}"

# Determinar URL base
if [ -z "$1" ]; then
  # Intentar detectar URL automáticamente
  if [ -f ".env.local" ]; then
    # Leer NEXT_PUBLIC_CHAT o similar
    CHAT_URL=$(grep -E "^NEXT_PUBLIC_CHAT=" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")
  fi
  
  if [ -z "$CHAT_URL" ]; then
    CHAT_URL="https://chat-test.bodasdehoy.com"
  fi
  
  # Construir URL del TestSuite
  # El TestSuite está en /admin/tests según el código
  TESTSUITE_URL="${CHAT_URL}/bodasdehoy/admin/tests"
else
  TESTSUITE_URL="$1"
fi

echo -e "${YELLOW}📍 URL del TestSuite: ${TESTSUITE_URL}${NC}"

# Verificar conectividad
echo -e "${YELLOW}🔍 Verificando conectividad...${NC}"
if curl -s --head --fail "${TESTSUITE_URL}" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Servidor responde${NC}"
else
  echo -e "${RED}⚠️  El servidor no responde. Verifica que esté corriendo.${NC}"
  echo -e "${YELLOW}💡 Intenta:${NC}"
  echo -e "   1. Verificar que el servidor esté corriendo"
  echo -e "   2. Verificar VPN si es necesario"
  echo -e "   3. Probar con: http://localhost:3210/bodasdehoy/admin/tests"
fi

# Abrir en navegador según OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo -e "${GREEN}🌐 Abriendo en navegador (macOS)...${NC}"
  # Usar python para abrir URL de forma más confiable
  python3 -m webbrowser "${TESTSUITE_URL}" 2>/dev/null || open -a "Google Chrome" "${TESTSUITE_URL}" 2>/dev/null || open -a "Safari" "${TESTSUITE_URL}" 2>/dev/null || echo -e "${YELLOW}💡 Abre manualmente: ${TESTSUITE_URL}${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo -e "${GREEN}🌐 Abriendo en navegador (Linux)...${NC}"
  xdg-open "${TESTSUITE_URL}" 2>/dev/null || sensible-browser "${TESTSUITE_URL}" 2>/dev/null || firefox "${TESTSUITE_URL}" 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # Windows
  echo -e "${GREEN}🌐 Abriendo en navegador (Windows)...${NC}"
  start "${TESTSUITE_URL}"
else
  echo -e "${RED}❌ No se pudo determinar el sistema operativo${NC}"
  echo -e "${YELLOW}💡 Abre manualmente: ${TESTSUITE_URL}${NC}"
fi

echo -e "${GREEN}✅ Listo!${NC}"
echo -e "${YELLOW}💡 Si no carga, verifica:${NC}"
echo -e "   - Que el servidor esté corriendo"
echo -e "   - Que tengas autenticación válida"
echo -e "   - Que la VPN esté configurada correctamente"
echo -e ""
echo -e "${YELLOW}📊 Para ver logs en tiempo real, abre la consola del navegador (F12)${NC}"
