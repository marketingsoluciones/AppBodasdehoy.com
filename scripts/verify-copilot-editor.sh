#!/bin/bash

# Script de Verificación del Editor del Copilot
# Verifica que todos los archivos y funcionalidades estén en su lugar

echo "🧪 Verificación del Editor del Copilot"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de checks
PASSED=0
FAILED=0

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
  fi
}

# 1. Verificar archivos del componente
echo "📁 Verificando archivos del componente..."
echo ""

test -f "apps/appEventos/components/Copilot/CopilotInputEditor.tsx"
check "CopilotInputEditor.tsx existe"

test -f "apps/appEventos/components/Copilot/CopilotChatNative.tsx"
check "CopilotChatNative.tsx existe"

test -f "apps/appEventos/components/ChatSidebar/ChatSidebar.tsx"
check "ChatSidebar.tsx existe"

test -f "apps/appEventos/components/Copilot/__tests__/CopilotInputEditor.test.tsx"
check "Tests del CopilotInputEditor existen"

echo ""

# 2. Verificar imports en CopilotChatNative
echo "🔍 Verificando imports..."
echo ""

grep -q "import CopilotInputEditor from './CopilotInputEditor'" apps/appEventos/components/Copilot/CopilotChatNative.tsx
check "CopilotInputEditor está importado"

grep -q "<CopilotInputEditor" apps/appEventos/components/Copilot/CopilotChatNative.tsx
check "CopilotInputEditor está siendo usado"

echo ""

# 3. Verificar imports en ChatSidebar
echo "🔍 Verificando ChatSidebar..."
echo ""

grep -q "import CopilotChatNative from '../Copilot/CopilotChatNative'" apps/appEventos/components/ChatSidebar/ChatSidebar.tsx
check "CopilotChatNative está importado en ChatSidebar"

grep -q "<CopilotChatNative" apps/appEventos/components/ChatSidebar/ChatSidebar.tsx
check "CopilotChatNative está siendo usado en ChatSidebar"

echo ""

# 4. Verificar dependencias
echo "📦 Verificando dependencias..."
echo ""

grep -q "@lobehub/editor" apps/appEventos/package.json
check "@lobehub/editor está en package.json"

grep -q "@lobehub/ui" apps/appEventos/package.json
check "@lobehub/ui está en package.json"

echo ""

# 5. Verificar funcionalidades en el código
echo "⚙️ Verificando funcionalidades del editor..."
echo ""

# Verificar botones de acción
grep -q "IoHappy" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Botón de emojis implementado"

grep -q "IoAttach" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Botón de adjuntar implementado"

grep -q "IoCode" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Botón de código implementado"

grep -q "IoList" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Botón de lista implementado"

# Verificar selector de emojis
grep -q "commonEmojis" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Selector de emojis implementado"

# Verificar auto-resize
grep -q "scrollHeight" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Auto-resize del textarea implementado"

# Verificar estados visuales
grep -q "isFocused" apps/appEventos/components/Copilot/CopilotInputEditor.tsx
check "Estados visuales (focus) implementados"

echo ""

# 6. Verificar documentación
echo "📚 Verificando documentación..."
echo ""

test -f "RESUMEN_EDITOR_COPILOT_2026-02-07.md"
check "Resumen del editor existe"

test -f "PLAN_PRUEBAS_COPILOT_2026-02-07.md"
check "Plan de pruebas existe"

test -f "README.md"
check "README principal existe"

test -f "docs/README.md"
check "Índice de documentación existe"

echo ""

# 7. Verificar build
echo "🔨 Verificando build..."
echo ""

test -d "apps/appEventos/.next"
check "Directorio .next existe (build realizado)"

echo ""

# 8. Verificar servidor
echo "🌐 Verificando servidor..."
echo ""

# Verificar que el puerto 8080 está abierto
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${GREEN}✓${NC} Servidor corriendo en puerto 8080"
  ((PASSED++))

  # Verificar respuesta HTTP
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Servidor responde HTTP 200"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} Servidor responde HTTP $HTTP_STATUS (esperado 200)"
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}⚠${NC} Servidor no está corriendo en puerto 8080"
  echo "   Ejecuta: pnpm dev:web"
fi

echo ""

# 9. Resumen final
echo "======================================"
echo "📊 Resumen de Verificación"
echo "======================================"
echo ""
echo -e "${GREEN}Pasadas:${NC} $PASSED"
echo -e "${RED}Fallidas:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ¡Todas las verificaciones pasaron!${NC}"
  echo ""
  echo "🎉 El editor del Copilot está listo para usar"
  echo ""
  echo "Próximos pasos:"
  echo "1. Abrir http://localhost:8080 en el navegador"
  echo "2. Hacer login"
  echo "3. Abrir el Copilot (sidebar derecho)"
  echo "4. Probar todas las funcionalidades"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Algunas verificaciones fallaron${NC}"
  echo ""
  echo "Por favor revisa los errores arriba"
  echo ""
  exit 1
fi
