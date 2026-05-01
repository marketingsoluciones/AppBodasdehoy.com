#!/bin/bash
# Script para obtener UID del usuario principal de champagne events via SSH a API2
# Asume que tienes acceso SSH al equipo API2

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Obteniendo UID de champagne events via SSH${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Configuración (ajusta según tu entorno)
SSH_USER="${SSH_USER:-tu_usuario}"
SSH_HOST="${SSH_HOST:-api3-mcp-graphql.eventosorganizador.com}"
EMAIL="${1:-admin@champagne-events.com.mx}"

echo -e "${GREEN}📋 Configuración:${NC}"
echo -e "  👤 SSH User: ${SSH_USER}"
echo -e "  🌐 SSH Host: ${SSH_HOST}"
echo -e "  📧 Email buscado: ${EMAIL}"

echo -e "\n${YELLOW}⚠️  IMPORTANTE: Este script asume que:${NC}"
echo -e "  1. Tienes acceso SSH a ${SSH_HOST}"
echo -e "  2. Conoces las credenciales o tienes key SSH"
echo -e "  3. La base de datos está en ese servidor"

echo -e "\n${GREEN}🔧 Opción 1: Comandos SSH manuales${NC}"
cat << EOF

# Conectar al servidor API2
ssh ${SSH_USER}@${SSH_HOST}

# Una vez conectado, buscar el usuario:

# Si usas MongoDB:
mongo --eval "db = db.getSiblingDB('champagne_events'); db.users.find({email: '${EMAIL}'}, {_id: 1, email: 1, name: 1}).pretty()"

# O si la BD tiene otro nombre:
mongo --eval "db = db.getSiblingDB('app_eventos'); db.users.find({email: '${EMAIL}'}, {_id: 1, email: 1, name: 1}).pretty()"

# Si usas PostgreSQL:
sudo -u postgres psql -d champagne_events -c "SELECT uid, email, name FROM users WHERE email = '${EMAIL}';"

# Buscar en todas las bases de datos posibles:
for db in champagne_events app_eventos bodasdehoy eventosorganizador; do
  echo "=== Buscando en DB: \$db ==="
  mongo --eval "db = db.getSiblingDB('\$db'); db.users.find({email: '${EMAIL}'}, {_id: 1, email: 1}).pretty()" 2>/dev/null || true
done

EOF

echo -e "${GREEN}🔧 Opción 2: Script automático (si tienes configuración SSH)${NC}"
cat << 'EOF'
#!/bin/bash
# get-uid-auto.sh - Versión automática (requiere configuración previa)

SSH_USER="tu_usuario"
SSH_HOST="api3-mcp-graphql.eventosorganizador.com"
EMAIL="${1:-admin@champagne-events.com.mx}"

# Comando SSH que ejecuta remotamente
REMOTE_CMD=$(cat << REMOTE_EOF
# Intentar diferentes bases de datos
for db in champagne_events app_eventos bodasdehoy eventosorganizador; do
  echo "=== Buscando en DB: \$db ==="
  mongo --quiet --eval "
    try {
      db = db.getSiblingDB('\$db');
      var user = db.users.findOne({email: '${EMAIL}'}, {_id: 1, email: 1});
      if (user) {
        print('✅ Encontrado en ' + \$db + ':');
        print('UID: ' + user._id);
        print('Email: ' + user.email);
        process.exit(0);
      }
    } catch(e) {}
  " 2>/dev/null
done

echo "❌ Usuario no encontrado en ninguna BD"
exit 1
REMOTE_EOF
)

# Ejecutar via SSH
ssh ${SSH_USER}@${SSH_HOST} "$REMOTE_CMD"
EOF

echo -e "\n${GREEN}🔧 Opción 3: Buscar en Firebase (alternativa)${NC}"
cat << EOF

# Si no encuentras en la BD local, busca en Firebase:
# 1. Ve a https://console.firebase.google.com/
# 2. Selecciona el proyecto "champagne-events-mx"
# 3. Ve a Authentication → Users
# 4. Busca el usuario por email: ${EMAIL}
# 5. Copia el "User UID"

# O usa la API de Firebase Admin (si tienes credenciales):
curl -X POST \
  -H "Authorization: Bearer \$(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/v1/projects/champagne-events-mx/accounts:lookup" \
  -d '{"email": ["${EMAIL}"]}'

EOF

echo -e "\n${GREEN}🎯 UIDs comunes de prueba (si no encuentras el real):${NC}"
echo -e "   ${YELLOW}TEST_OWNER_UID_001${NC} - Del fixture champagne events"
echo -e "   ${YELLOW}upSETrmXc7ZnsIhrjDjbHd7u2up1${NC} - UID común de prueba"
echo -e "   ${YELLOW}jcc_uid_champagne${NC} - Podría ser el UID de JCC en champagne"

echo -e "\n${GREEN}🚀 Una vez tengas el UID:${NC}"
echo -e "1. ${YELLOW}Abre el bypass local:${NC}"
echo -e "   open scripts/local-bypass-champagne.html"
echo -e "2. ${YELLOW}Completa los campos:${NC}"
echo -e "   - Email: ${EMAIL}"
echo -e "   - Development: champagne-events"
echo -e "   - UID: [pega el UID obtenido]"
echo -e "3. ${YELLOW}Haz clic en 'Activar Bypass Local'${NC}"
echo -e "4. ${YELLOW}Sigue las instrucciones para pegar en consola${NC}"

echo -e "\n${GREEN}📝 Si no encuentras el usuario:${NC}"
echo -e "1. ${YELLOW}Prueba con otros emails:${NC}"
echo -e "   - jcc@bodasdehoy.com"
echo -e "   - test@champagne-events.com.mx"
echo -e "   - contacto@champagne-events.com.mx"
echo -e "   - admin@champagne-events.com.mx"
echo -e "2. ${YELLOW}Contacta al equipo de champagne events${NC}"
echo -e "3. ${YELLOW}Crea un usuario nuevo en champagne events test${NC}"

echo -e "\n${BLUE}✅ Script listo. Usa SSH para obtener el UID real del usuario.${NC}"
echo -e "${YELLOW}💡 Consejo: Si el equipo te da acceso SSH, pídeles también el email/UID del super admin.${NC}"
