#!/bin/bash
# Script para ejecutar tests con datos reales del backend
# Usa las 1,000 preguntas y 300-600 acciones guardadas

set -e

BACKEND_URL="${BACKEND_URL:-https://api-ia.bodasdehoy.com}"
DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
MAX_TIME=30

echo "🧪 Ejecutando tests con datos reales del backend"
echo "📍 Backend: ${BACKEND_URL}"
echo "🏢 Development: ${DEVELOPMENT}"
echo ""

# 1. Health check
echo "1️⃣ Verificando health del backend..."
if curl -f --max-time "${MAX_TIME}" "${BACKEND_URL}/health" > /dev/null 2>&1; then
  echo "✅ Backend está disponible"
else
  echo "❌ Backend no está disponible en ${BACKEND_URL}"
  exit 1
fi
echo ""

# 2. Obtener estadísticas de tests
echo "2️⃣ Obteniendo estadísticas de tests..."
STATS=$(curl -s --max-time "${MAX_TIME}" \
  "${BACKEND_URL}/api/admin/tests/stats" \
  -H "Authorization: Bearer ${JWT_TOKEN:-}" 2>/dev/null || echo "{}")

if [ "$STATS" != "{}" ]; then
  echo "📊 Estadísticas:"
  echo "$STATS" | jq '.' 2>/dev/null || echo "$STATS"
else
  echo "⚠️ No se pudieron obtener estadísticas (puede requerir autenticación)"
fi
echo ""

# 3. Obtener preguntas reales (primeras 10 para prueba)
echo "3️⃣ Obteniendo preguntas del backend..."
QUESTIONS=$(curl -s --max-time "${MAX_TIME}" \
  "${BACKEND_URL}/api/admin/tests/questions?limit=10" \
  -H "Authorization: Bearer ${JWT_TOKEN:-}" 2>/dev/null || echo "[]")

QUESTION_COUNT=$(echo "$QUESTIONS" | jq 'length' 2>/dev/null || echo "0")
echo "📋 Preguntas obtenidas: ${QUESTION_COUNT}"

if [ "$QUESTION_COUNT" -gt 0 ]; then
  echo "✅ Preguntas disponibles"
  echo ""
  
  # 4. Ejecutar tests con preguntas reales
  echo "4️⃣ Ejecutando tests con preguntas reales..."
  echo "$QUESTIONS" | jq -r '.[] | .question' | head -3 | while read -r question; do
    echo "  Testing: ${question:0:50}..."
    
    RESPONSE=$(curl -s --max-time "${MAX_TIME}" \
      -X POST "${BACKEND_URL}/webapi/chat/auto" \
      -H "Content-Type: application/json" \
      -H "X-Development: ${DEVELOPMENT}" \
      -H "Authorization: Bearer ${JWT_TOKEN:-}" \
      -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$question\"}],\"stream\":false}" 2>/dev/null || echo "{}")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")
    if [ "$SUCCESS" = "true" ]; then
      echo "    ✅ Respuesta exitosa"
    else
      ERROR=$(echo "$RESPONSE" | jq -r '.error // .message // "Error desconocido"' 2>/dev/null || echo "Error")
      echo "    ❌ Error: $ERROR"
    fi
  done
else
  echo "⚠️ No se pudieron obtener preguntas (puede requerir autenticación)"
fi
echo ""

# 5. Verificar acciones (si el endpoint existe)
echo "5️⃣ Verificando acciones guardadas..."
for endpoint in "/api/admin/tests/actions" "/api/admin/actions" "/api/tests/actions"; do
  ACTIONS=$(curl -s --max-time "${MAX_TIME}" \
    "${BACKEND_URL}${endpoint}?limit=10" \
    -H "Authorization: Bearer ${JWT_TOKEN:-}" 2>/dev/null || echo "[]")
  
  ACTION_COUNT=$(echo "$ACTIONS" | jq 'length' 2>/dev/null || echo "0")
  if [ "$ACTION_COUNT" -gt 0 ]; then
    echo "✅ Acciones encontradas en ${endpoint}: ${ACTION_COUNT}"
    break
  fi
done
echo ""

echo "✅ Tests completados"
echo ""
echo "📝 Nota: Para ejecutar tests completos, usa:"
echo "   cd apps/chat-ia && pnpm test-app test-helpers/integration/"
