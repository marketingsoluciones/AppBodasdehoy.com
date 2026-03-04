#!/bin/bash

# Script para abrir el TestSuite con la URL correcta
# Asegura que se acceda al frontend, no al backend

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Abrir TestSuite - URL Correcta                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Determinar URL base del frontend (NO del backend)
if [ -f "apps/appEventos/.env.production" ]; then
  CHAT_URL=$(grep -E "^NEXT_PUBLIC_CHAT=" apps/appEventos/.env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")
fi

if [ -z "$CHAT_URL" ]; then
  CHAT_URL="https://chat-test.bodasdehoy.com"
fi

# Construir URL completa del TestSuite
# IMPORTANTE: Debe incluir /bodasdehoy/admin/tests
TESTSUITE_URL="${CHAT_URL}/bodasdehoy/admin/tests"

echo -e "${CYAN}━━━ Configuración ━━━${NC}\n"
echo -e "URL del Frontend (Chat): ${CHAT_URL}"
echo -e "URL del TestSuite: ${TESTSUITE_URL}\n"

echo -e "${YELLOW}⚠️ IMPORTANTE:${NC}"
echo -e "   Estás viendo JSON del backend porque accediste a:"
echo -e "   ${RED}https://api-ia.bodasdehoy.com${NC} (backend)"
echo ""
echo -e "   Necesitas acceder al frontend:"
echo -e "   ${GREEN}${TESTSUITE_URL}${NC} (frontend)\n"

# Verificar que no sea la URL del backend
if [[ "$TESTSUITE_URL" == *"api-ia.bodasdehoy.com"* ]]; then
  echo -e "${RED}❌ ERROR:${NC} La URL apunta al backend, no al frontend"
  echo -e "${YELLOW}💡${NC} Usando URL de fallback: https://chat.bodasdehoy.com/bodasdehoy/admin/tests"
  TESTSUITE_URL="https://chat.bodasdehoy.com/bodasdehoy/admin/tests"
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
echo -e "${CYAN}━━━ Qué Deberías Ver ━━━${NC}\n"

echo -e "${GREEN}✅ Interfaz Web del TestSuite:${NC}"
echo -e "   - Header con título 'Test Suite'"
echo -e "   - Contador: 'X tests disponibles'"
echo -e "   - Tabla con tests (checkboxes, ID, pregunta, categoría, etc.)"
echo -e "   - Botones: 'Run Tests', 'Reset', etc."
echo -e "   - Filtros y estadísticas"
echo ""
echo -e "${RED}❌ NO deberías ver:${NC}"
echo -e "   - Solo JSON con 'Lobe Chat Harbor...'"
echo -e "   - Marcadores 'error.title' o 'error.desc'"
echo -e "   - Error 404 o 502"
echo ""

# Si aún ves JSON
echo -e "${CYAN}━━━ Si Aún Ves JSON ━━━${NC}\n"
echo -e "${YELLOW}1.${NC} Verifica que la URL sea exactamente:"
echo -e "   ${GREEN}${TESTSUITE_URL}${NC}"
echo ""
echo -e "${YELLOW}2.${NC} Asegúrate de estar en el frontend, no en el backend:"
echo -e "   ❌ NO: https://api-ia.bodasdehoy.com"
echo -e "   ✅ SÍ: ${TESTSUITE_URL}"
echo ""
echo -e "${YELLOW}3.${NC} Verifica autenticación:"
echo -e "   - Debes estar logueado"
echo -e "   - Si no estás logueado, te redirigirá al login"
echo ""

echo -e "${GREEN}✅${NC} TestSuite abierto. Verifica que veas la interfaz web, no solo JSON.\n"
