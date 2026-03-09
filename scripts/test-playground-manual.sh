#!/bin/bash

# Script para abrir el Playground y realizar pruebas manuales
# debido a que el backend Python tiene problemas con el provider Groq

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Test Manual del Playground                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# URLs
PLAYGROUND_URL="http://localhost:3210/bodasdehoy/admin/playground"
COPILOT_URL="http://localhost:3210"
WEB_URL="http://localhost:8080"

echo -e "${YELLOW}📋 Verificando servicios...${NC}\n"

# Verificar Web
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null || echo "000")
if [ "$WEB_STATUS" = "200" ]; then
  echo -e "${GREEN}✅${NC} Web App funcionando (puerto 8080)"
else
  echo -e "${RED}❌${NC} Web App no responde (puerto 8080)"
  echo -e "${YELLOW}   Ejecuta: cd apps/appEventos && pnpm dev${NC}"
fi

# Verificar Copilot
COPILOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$COPILOT_URL" 2>/dev/null || echo "000")
if [ "$COPILOT_STATUS" = "200" ]; then
  echo -e "${GREEN}✅${NC} Copilot funcionando (puerto 3210)"
else
  echo -e "${RED}❌${NC} Copilot no responde (puerto 3210)"
  echo -e "${YELLOW}   Ejecuta: cd apps/chat-ia && pnpm dev${NC}"
  exit 1
fi

# Verificar Backend Python
BACKEND_STATUS=$(curl -s "https://api-ia.bodasdehoy.com/health" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$BACKEND_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅${NC} Backend Python IA funcionando"
else
  echo -e "${RED}❌${NC} Backend Python IA no responde"
fi

echo ""
echo -e "${BLUE}━━━ Problema Conocido ━━━${NC}"
echo -e "${YELLOW}⚠️${NC}  El backend Python está configurado para usar Groq por defecto"
echo -e "   Groq está devolviendo respuestas vacías (EMPTY_RESPONSE)"
echo -e "   ${YELLOW}Solución temporal:${NC} Usar el Playground con tests visuales"
echo ""

echo -e "${BLUE}━━━ Abriendo Playground ━━━${NC}\n"

# Abrir Playground
echo -e "${GREEN}🚀${NC} Abriendo Playground en: ${PLAYGROUND_URL}"
open "$PLAYGROUND_URL" 2>/dev/null || {
  echo -e "${YELLOW}⚠️${NC}  No se pudo abrir el navegador automáticamente"
  echo -e "   Abre manualmente: ${PLAYGROUND_URL}"
}

sleep 2

echo ""
echo -e "${BLUE}━━━ Instrucciones de Prueba Manual ━━━${NC}\n"

echo "1️⃣  ${GREEN}Verificar Carga de Preguntas${NC}"
echo "   - La tabla debe mostrar las preguntas disponibles"
echo "   - Deberías ver ~9 preguntas cargadas"
echo ""

echo "2️⃣  ${GREEN}Seleccionar Preguntas${NC}"
echo "   - Haz clic en los checkboxes para seleccionar preguntas"
echo "   - Selecciona 2-3 preguntas para probar"
echo ""

echo "3️⃣  ${GREEN}Configurar Provider${NC}"
echo "   - En el dropdown de Provider, selecciona uno diferente a 'auto'"
echo "   - Opciones: anthropic, openai, groq"
echo "   - ${YELLOW}Nota:${NC} Si Groq falla, el sistema debería hacer fallback"
echo ""

echo "4️⃣  ${GREEN}Ejecutar Tests${NC}"
echo "   - Haz clic en 'Ejecutar Seleccionadas'"
echo "   - Observa el streaming en tiempo real"
echo "   - Verifica el cursor parpadeante mientras escribe"
echo ""

echo "5️⃣  ${GREEN}Verificar Resultados${NC}"
echo "   - Al terminar, deberías ver el análisis automático"
echo "   - Score: 0-100"
echo "   - Keywords detectadas"
echo "   - Status: ✅ Pass o ❌ Fail"
echo ""

echo -e "${BLUE}━━━ Tests Alternativos ━━━${NC}\n"

echo "🌐 ${GREEN}Chat Test (iframe)${NC}"
echo "   URL: http://localhost:8080/probar-chat-test.html"
echo "   - Prueba el iframe del chat directamente"
echo ""

echo "📊 ${GREEN}TestSuite Online${NC}"
echo "   URL: https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests"
echo "   - Suite completa de tests en producción"
echo "   - ${YELLOW}Nota:${NC} También puede tener el problema de Groq"
echo ""

echo -e "${BLUE}━━━ Comandos Útiles ━━━${NC}\n"

echo "# Ver logs del copilot"
echo "tail -f /tmp/copilot-restart.log"
echo ""

echo "# Reiniciar copilot"
echo "pkill -9 -f 'next.*3210' && cd apps/chat-ia && pnpm dev"
echo ""

echo "# Verificar estado del backend"
echo "curl -s https://api-ia.bodasdehoy.com/health | jq '.'"
echo ""

echo -e "${GREEN}✅ Playground abierto y listo para pruebas manuales${NC}"
echo -e "${YELLOW}💡 Tip:${NC} Abre la consola del navegador (F12) para ver logs detallados"
echo ""
