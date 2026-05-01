#!/bin/bash
# Script para bypass de champagne events usando SSH a MCP
# Para cuando no hay conectividad web pero sí acceso SSH

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Bypass Champagne Events via SSH/MCP${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}📋 Opciones disponibles:${NC}"
echo -e "1. ${YELLOW}Usar bypass local (sin conectividad web)${NC}"
echo -e "2. ${YELLOW}Obtener UID del usuario desde MCP via SSH${NC}"
echo -e "3. ${YELLOW}Combinar ambos${NC}"

echo -e "\n${GREEN}🔧 Opción 1: Bypass local${NC}"
echo -e "   Abre el archivo HTML local:"
echo -e "   ${YELLOW}open scripts/local-bypass-champagne.html${NC}"
echo -e "   O usa:"
echo -e "   ${YELLOW}./scripts/champagne-events-bypass.sh <email> local${NC}"

echo -e "\n${GREEN}🔐 Opción 2: Obtener UID desde MCP${NC}"
echo -e "${YELLOW}Si tienes acceso SSH a MCP, puedes obtener el UID del usuario:${NC}"

cat << 'EOF'

# Ejemplo de comandos SSH para obtener UID:
# 1. Conectarse a MCP
ssh usuario@api3-mcp-graphql.eventosorganizador.com

# 2. Buscar usuario en la base de datos
# Depende de la estructura de la BD, pero podría ser algo como:
mongo --eval "db.users.find({email: 'admin@champagne-events.com.mx'}, {_id: 1, email: 1})"

# O si usas PostgreSQL:
psql -c "SELECT uid, email FROM users WHERE email = 'admin@champagne-events.com.mx';"

# 3. También puedes obtener el UID desde Firebase:
# En la consola de Firebase de champagne events:
# - Ir a Authentication → Users
# - Buscar el usuario por email
# - Copiar el User UID

EOF

echo -e "${GREEN}🔄 Opción 3: Combinar ambos${NC}"
echo -e "${YELLOW}Usa el UID obtenido en el bypass local:${NC}"

cat << 'EOF'

1. Obtén el UID del usuario principal de champagne events
2. Abre scripts/local-bypass-champagne.html
3. Completa los campos:
   - Email: admin@champagne-events.com.mx (o el correcto)
   - Development: champagne-events
   - UID: [pega el UID obtenido]
4. Haz clic en "Activar Bypass Local"
5. Sigue las instrucciones para pegar el código en consola

EOF

echo -e "${GREEN}📝 Script para obtener UID automáticamente (si tienes credenciales):${NC}"

cat << 'EOF'
#!/bin/bash
# get-champagne-uid.sh
# Necesita configuración de acceso a la BD

EMAIL="${1:-admin@champagne-events.com.mx}"

# Ejemplo con MongoDB (ajusta credenciales)
# MONGO_URI="mongodb://user:pass@localhost:27017/champagne_events"
# UID=$(mongo "$MONGO_URI" --quiet --eval "db.users.findOne({email: '$EMAIL'})._id.toString()")

# Ejemplo con curl a API interna (si existe)
# API_KEY="tu_api_key"
# UID=$(curl -s -H "Authorization: Bearer $API_KEY" \
#   "https://api.internal.champagne-events.com.mx/users?email=$EMAIL" | jq -r '.uid')

echo "UID para $EMAIL: $UID"
EOF

echo -e "\n${GREEN}🎯 Resumen de archivos creados:${NC}"
echo -e "1. ${YELLOW}scripts/local-bypass-champagne.html${NC} - Bypass local sin servidor"
echo -e "2. ${YELLOW}scripts/champagne-events-bypass.sh${NC} - Bypass con parámetros"
echo -e "3. ${YELLOW}scripts/test-bypass-champagne.sh${NC} - Test de conectividad"
echo -e "4. ${YELLOW}scripts/bypass-champagne-ssh.sh${NC} - Este script"

echo -e "\n${GREEN}🚀 Para empezar:${NC}"
echo -e "1. ${YELLOW}Abre el bypass local:${NC}"
echo -e "   open scripts/local-bypass-champagne.html"
echo -e "2. ${YELLOW}O usa el email del usuario JCC:${NC}"
echo -e "   ./scripts/champagne-events-bypass.sh jcc@bodasdehoy.com local"
echo -e "3. ${YELLOW}Si tienes el UID real, úsalo en el formulario${NC}"

echo -e "\n${BLUE}✅ Solución lista. El bypass funciona estableciendo localStorage directamente.${NC}"
echo -e "${YELLOW}💡 Nota: Si el usuario no tiene eventos, necesitas el email/UID correcto del super admin de champagne events.${NC}"
