#!/bin/bash

echo "🧪 Probando API de Chat con IA..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Mensaje simple
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Mensaje de saludo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Enviando:${NC} \"Hola, ¿en qué puedes ayudarme?\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8080/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, ¿en qué puedes ayudarme?",
    "metadata": {
      "userId": "test@example.com",
      "eventId": "test-event-123",
      "eventName": "Boda de Prueba",
      "development": "bodasdehoy"
    },
    "messages": [],
    "stream": false
  }' 2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Request exitoso${NC}"
  echo ""
  echo -e "${YELLOW}Respuesta del Copilot:${NC}"
  echo "$RESPONSE" | jq -r '.choices[0].message.content // .response // "No se encontró respuesta"' 2>/dev/null || echo "$RESPONSE"
  echo ""
else
  echo -e "${RED}✗ Error en el request${NC}"
  echo "$RESPONSE"
  echo ""
fi

# Test 2: Consulta sobre invitados
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Consulta sobre funcionalidades"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Enviando:${NC} \"¿Qué puedes hacer con los invitados?\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8080/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué puedes hacer con los invitados?",
    "metadata": {
      "userId": "test@example.com",
      "eventId": "test-event-123",
      "eventName": "Boda de Prueba",
      "development": "bodasdehoy"
    },
    "messages": [
      {
        "role": "user",
        "content": "Hola, ¿en qué puedes ayudarme?"
      },
      {
        "role": "assistant",
        "content": "¡Hola! Soy Copilot, tu asistente para organizar eventos."
      }
    ],
    "stream": false
  }' 2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Request exitoso${NC}"
  echo ""
  echo -e "${YELLOW}Respuesta del Copilot:${NC}"
  echo "$RESPONSE" | jq -r '.choices[0].message.content // .response // "No se encontró respuesta"' 2>/dev/null || echo "$RESPONSE"
  echo ""
else
  echo -e "${RED}✗ Error en el request${NC}"
  echo "$RESPONSE"
  echo ""
fi

# Test 3: Solicitud de acción (agregar invitado)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Solicitud de acción (agregar invitado)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Enviando:${NC} \"Agrega a Juan Pérez como invitado\""
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8080/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Agrega a Juan Pérez como invitado",
    "metadata": {
      "userId": "test@example.com",
      "eventId": "test-event-123",
      "eventName": "Boda de Prueba",
      "development": "bodasdehoy"
    },
    "messages": [],
    "stream": false
  }' 2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Request exitoso${NC}"
  echo ""
  echo -e "${YELLOW}Respuesta del Copilot:${NC}"
  echo "$RESPONSE" | jq -r '.choices[0].message.content // .response // "No se encontró respuesta"' 2>/dev/null || echo "$RESPONSE"
  echo ""

  # Verificar si hay usage info
  USAGE=$(echo "$RESPONSE" | jq -r '.usage // empty' 2>/dev/null)
  if [ ! -z "$USAGE" ]; then
    echo -e "${YELLOW}Uso de tokens:${NC}"
    echo "$USAGE" | jq '.' 2>/dev/null
    echo ""
  fi
else
  echo -e "${RED}✗ Error en el request${NC}"
  echo "$RESPONSE"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tests completados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Nota:${NC} Para probar en el navegador, abre:"
echo "   👉 http://localhost:8080/copilot"
echo ""
