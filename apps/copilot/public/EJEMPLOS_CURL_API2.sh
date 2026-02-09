#!/bin/bash

# ========================================
# EJEMPLOS DE PETICIONES A API2
# ========================================
# 
# Todas estas peticiones están retornando 400 Bad Request
# Por favor, verificar qué está fallando
#
# ========================================

API2_URL="https://api2.eventosorganizador.com/graphql"
DEVELOPMENT="bodasdehoy"
SUPPORT_KEY="SK-bodasdehoy-a71f5b3c"
USER_EMAIL="bodasdehoy.com@gmail.com"

echo "================================================"
echo "PROBANDO PETICIONES A API2"
echo "================================================"
echo ""

# ========================================
# 1. TEST: getWhitelabelBySlug
# ========================================
echo "1️⃣  TEST: getWhitelabelBySlug"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "query GetWhitelabelBySlug($slug: String!) { getWhitelabelBySlug(slug: $slug) { success whitelabel { id slug development name description enabled branding { logo favicon } colors { primary secondary } } errors { field message code } } }",
    "variables": {
      "slug": "'"$DEVELOPMENT"'"
    }
  }' | jq '.'

echo ""
echo ""

# ========================================
# 2. TEST: getUserProfile
# ========================================
echo "2️⃣  TEST: getUserProfile"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "query GetUserProfile($email: String!) { getUserProfile(email: $email) { id email name phone avatar role development } }",
    "variables": {
      "email": "'"$USER_EMAIL"'"
    }
  }' | jq '.'

echo ""
echo ""

# ========================================
# 3. TEST: getUserApiConfigs
# ========================================
echo "3️⃣  TEST: getUserApiConfigs"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "query GetUserApiConfigs($userId: String!) { getUserApiConfigs(userId: $userId) { userId development apiConfigs { provider apiKey model enabled } } }",
    "variables": {
      "userId": "'"$USER_EMAIL"'"
    }
  }' | jq '.'

echo ""
echo ""

# ========================================
# 4. TEST: getUserChats
# ========================================
echo "4️⃣  TEST: getUserChats"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "query GetUserChats($email: String!, $development: String!) { getUserChats(email: $email, development: $development) { id channel lastMessage lastMessageAt unreadCount participants { name avatar } } }",
    "variables": {
      "email": "'"$USER_EMAIL"'",
      "development": "'"$DEVELOPMENT"'"
    }
  }' | jq '.'

echo ""
echo ""

# ========================================
# 5. TEST: getUserEvents
# ========================================
echo "5️⃣  TEST: getUserEventsByEmail"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "query GetUserEventsByEmail($email: String!, $development: String!) { getUserEventsByEmail(email: $email, development: $development) { id name date type status } }",
    "variables": {
      "email": "'"$USER_EMAIL"'",
      "development": "'"$DEVELOPMENT"'"
    }
  }' | jq '.'

echo ""
echo ""

# ========================================
# 6. TEST: Verificar endpoint básico
# ========================================
echo "6️⃣  TEST: Endpoint básico (sin query)"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -H "X-Development: $DEVELOPMENT" \
  -H "X-Origin: https://${DEVELOPMENT}.com" \
  -H "X-Support-Key: $SUPPORT_KEY" \
  -d '{
    "query": "{ __schema { queryType { name } } }"
  }' | jq '.'

echo ""
echo ""

# ========================================
# 7. TEST: Sin headers personalizados
# ========================================
echo "7️⃣  TEST: Sin headers X-Development (para comparar)"
echo "-------------------------------"

curl -X POST "$API2_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ __schema { queryType { name } } }"
  }' | jq '.'

echo ""
echo ""

echo "================================================"
echo "✅ TESTS COMPLETADOS"
echo "================================================"
echo ""
echo "Si todos retornan 400, el problema puede ser:"
echo "  1. Headers incorrectos"
echo "  2. supportKey inválido"
echo "  3. Queries no existen en el schema"
echo "  4. Endpoint GraphQL no está activo"
echo ""
echo "Por favor, revisar logs del servidor API2"
echo ""

