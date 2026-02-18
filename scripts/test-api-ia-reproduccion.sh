#!/bin/bash

# Script de Pruebas para Equipo api-ia
# Fecha: 2026-02-11
# Propósito: Reproducir problemas reportados por Copilot LobeChat

echo "🧪 SCRIPT DE PRUEBAS PARA api-ia.bodasdehoy.com"
echo "================================================"
echo ""
echo "Ejecuten estos comandos para reproducir los problemas que reportamos."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "SECCIÓN 1: VERIFICAR ESTADO DEL SERVICIO"
echo "========================================="
echo ""

echo -e "${YELLOW}Test 1.1: Health Check${NC}"
echo "Comando:"
echo "curl -s https://api-ia.bodasdehoy.com/health"
echo ""
echo "Resultado:"
curl -s https://api-ia.bodasdehoy.com/health | jq '.'
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 1.2: Info del Servidor${NC}"
echo "Comando:"
echo "curl -s https://api-ia.bodasdehoy.com/"
echo ""
echo "Resultado:"
curl -s https://api-ia.bodasdehoy.com/ | jq '.'
echo ""
echo "---"
echo ""

echo "========================================="
echo "SECCIÓN 2: VERIFICAR CREDENCIALES"
echo "========================================="
echo ""

echo -e "${YELLOW}Test 2.1: AI Config de bodasdehoy${NC}"
echo "Comando:"
echo "curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-config"
echo ""
echo "Resultado:"
curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-config | jq '.'
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 2.2: Credenciales de IA (CRÍTICO)${NC}"
echo "Comando:"
echo "curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials"
echo ""
echo "Resultado:"
CREDENTIALS=$(curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials)
echo "$CREDENTIALS" | jq '.'
echo ""

# Extraer API keys para verificación
ANTHROPIC_KEY=$(echo "$CREDENTIALS" | jq -r '.credentials.anthropic.apiKey')
GROQ_KEY=$(echo "$CREDENTIALS" | jq -r '.credentials.groq.apiKey')

echo -e "${RED}⚠️  PROBLEMA DETECTADO:${NC}"
echo "La API key de Anthropic empieza con: ${ANTHROPIC_KEY:0:8}..."
echo "Formato correcto de Anthropic: sk-ant-"
echo "Formato actual (INCORRECTO): sk-proj- (esto es formato OpenAI)"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 2.3: Providers Configurados${NC}"
echo "Comando:"
echo "curl -s https://api-ia.bodasdehoy.com/api/providers/bodasdehoy"
echo ""
echo "Resultado:"
PROVIDERS=$(curl -s https://api-ia.bodasdehoy.com/api/providers/bodasdehoy)
echo "$PROVIDERS" | jq '.'
echo ""

GROQ_MODEL=$(echo "$PROVIDERS" | jq -r '.providers[] | select(.provider=="groq") | .model')
echo -e "${RED}⚠️  PROBLEMA DETECTADO:${NC}"
echo "Modelo de Groq configurado: $GROQ_MODEL"
echo "Este modelo fue DESCOMISIONADO por Groq"
echo "Modelo correcto actual: llama-3.3-70b-versatile"
echo ""
echo "---"
echo ""

echo "========================================="
echo "SECCIÓN 3: TESTS DIRECTOS A PROVIDERS"
echo "========================================="
echo ""

echo -e "${YELLOW}Test 3.1: Test DIRECTO a OpenAI con la key actual${NC}"
echo "Comando:"
echo "curl -s https://api.openai.com/v1/chat/completions \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer $ANTHROPIC_KEY' \\"
echo "  -d '{\"model\": \"gpt-4o-mini\", \"messages\": [{\"role\": \"user\", \"content\": \"test\"}], \"max_tokens\": 5}'"
echo ""
echo "Resultado:"
curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANTHROPIC_KEY" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}], "max_tokens": 5}' | jq '.'
echo ""
echo -e "${RED}Esperado: Error 429 - insufficient_quota (sin saldo)${NC}"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 3.2: Test DIRECTO a Anthropic con la key actual${NC}"
echo "Comando:"
echo "curl -s https://api.anthropic.com/v1/messages \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-api-key: $ANTHROPIC_KEY' \\"
echo "  -H 'anthropic-version: 2023-06-01' \\"
echo "  -d '{\"model\": \"claude-3-5-sonnet-20241022\", \"max_tokens\": 10, \"messages\": [{\"role\": \"user\", \"content\": \"test\"}]}'"
echo ""
echo "Resultado:"
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}' | jq '.'
echo ""
echo -e "${RED}Esperado: Error 401 - invalid x-api-key (porque es key de OpenAI)${NC}"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 3.3: Test DIRECTO a Groq con el modelo actual${NC}"
echo "Comando:"
echo "curl -s https://api.groq.com/openai/v1/chat/completions \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer $GROQ_KEY' \\"
echo "  -d '{\"model\": \"llama-3.1-70b-versatile\", \"messages\": [{\"role\": \"user\", \"content\": \"test\"}], \"max_tokens\": 10}'"
echo ""
echo "Resultado:"
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GROQ_KEY" \
  -d '{"model": "llama-3.1-70b-versatile", "messages": [{"role": "user", "content": "test"}], "max_tokens": 10}' | jq '.'
echo ""
echo -e "${RED}Esperado: Error 400 - model_decommissioned${NC}"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 3.4: Modelos DISPONIBLES en Groq (ahora)${NC}"
echo "Comando:"
echo "curl -s https://api.groq.com/openai/v1/models \\"
echo "  -H 'Authorization: Bearer $GROQ_KEY'"
echo ""
echo "Resultado (primeros 5 modelos):"
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_KEY" | jq '.data[:5]'
echo ""
echo -e "${GREEN}Busquen el modelo: llama-3.3-70b-versatile (este es el actual)${NC}"
echo ""
echo "---"
echo ""

echo "========================================="
echo "SECCIÓN 4: TESTS A SUS ENDPOINTS DE CHAT"
echo "========================================="
echo ""

echo -e "${YELLOW}Test 4.1: Chat con Anthropic (SIN stream)${NC}"
echo "Comando:"
echo "curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/anthropic' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Development: bodasdehoy' \\"
echo "  -d '{\"messages\": [{\"role\":\"user\",\"content\":\"test\"}], \"model\": \"claude-3-5-sonnet-20241022\", \"stream\": false}'"
echo ""
echo "Resultado:"
ANTHROPIC_RESULT=$(curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages": [{"role":"user","content":"test"}], "model": "claude-3-5-sonnet-20241022", "stream": false}')
echo "$ANTHROPIC_RESULT" | jq '.'
echo ""
TRACE_ID_ANTHROPIC=$(echo "$ANTHROPIC_RESULT" | jq -r '.trace_id')
echo -e "${RED}⚠️  Trace ID para revisar en logs: $TRACE_ID_ANTHROPIC${NC}"
echo -e "${RED}Esperado: AUTH_ERROR (401)${NC}"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 4.2: Chat con Groq${NC}"
echo "Comando:"
echo "curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/groq' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Development: bodasdehoy' \\"
echo "  -d '{\"messages\": [{\"role\":\"user\",\"content\":\"test\"}], \"model\": \"llama-3.1-70b-versatile\", \"stream\": false}'"
echo ""
echo "Resultado:"
GROQ_RESULT=$(curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/groq" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages": [{"role":"user","content":"test"}], "model": "llama-3.1-70b-versatile", "stream": false}')
echo "$GROQ_RESULT" | jq '.'
echo ""
TRACE_ID_GROQ=$(echo "$GROQ_RESULT" | jq -r '.trace_id')
echo -e "${RED}⚠️  Trace ID para revisar en logs: $TRACE_ID_GROQ${NC}"
echo -e "${RED}Esperado: EMPTY_RESPONSE (modelo descomisionado)${NC}"
echo ""
echo "---"
echo ""

echo -e "${YELLOW}Test 4.3: Auto-routing${NC}"
echo "Comando:"
echo "curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/auto' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Development: bodasdehoy' \\"
echo "  -d '{\"messages\": [{\"role\":\"user\",\"content\":\"test\"}], \"stream\": false}'"
echo ""
echo "Resultado:"
AUTO_RESULT=$(curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages": [{"role":"user","content":"test"}], "stream": false}')
echo "$AUTO_RESULT" | jq '.'
echo ""
TRACE_ID_AUTO=$(echo "$AUTO_RESULT" | jq -r '.trace_id')
echo -e "${RED}⚠️  Trace ID para revisar en logs: $TRACE_ID_AUTO${NC}"
echo ""
echo "---"
echo ""

echo "========================================="
echo "RESUMEN DE PROBLEMAS ENCONTRADOS"
echo "========================================="
echo ""
echo -e "${RED}1. CREDENCIALES DE ANTHROPIC INCORRECTAS${NC}"
echo "   - Key actual: $ANTHROPIC_KEY"
echo "   - Formato actual: sk-proj-... (OpenAI)"
echo "   - Formato esperado: sk-ant-... (Anthropic)"
echo ""
echo -e "${RED}2. MODELO DE GROQ DESCOMISIONADO${NC}"
echo "   - Modelo actual: llama-3.1-70b-versatile"
echo "   - Modelo correcto: llama-3.3-70b-versatile"
echo ""
echo -e "${RED}3. API KEY DE OPENAI SIN SALDO${NC}"
echo "   - Key tiene cuota excedida (insufficient_quota)"
echo ""
echo "========================================="
echo "TRACE IDS PARA REVISAR EN SUS LOGS"
echo "========================================="
echo ""
echo "Anthropic: $TRACE_ID_ANTHROPIC"
echo "Groq: $TRACE_ID_GROQ"
echo "Auto-routing: $TRACE_ID_AUTO"
echo ""
echo "========================================="
echo "FIN DEL SCRIPT DE PRUEBAS"
echo "========================================="
echo ""
echo "Por favor:"
echo "1. Ejecuten este script completo"
echo "2. Revisen los trace IDs en sus logs"
echo "3. Verifiquen las credenciales en su base de datos"
echo "4. Corrijan la configuración"
echo ""
echo "Pueden respondernos en Slack: #copilot-api-ia"
