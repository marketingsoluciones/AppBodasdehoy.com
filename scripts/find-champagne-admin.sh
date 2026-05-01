#!/bin/bash
# Script para encontrar automáticamente el usuario principal/admin de champagne events via SSH
# Ejecuta comandos SSH en API2 para buscar en la base de datos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Buscando usuario principal de champagne events via SSH${NC}"
echo -e "${BLUE}========================================================${NC}\n"

# Configuración SSH (ajustar según tu entorno)
SSH_USER="${SSH_USER:-$USER}"
SSH_HOST="${SSH_HOST:-api3-mcp-graphql.eventosorganizador.com}"

echo -e "${GREEN}📋 Configuración SSH:${NC}"
echo -e "  👤 Usuario: ${SSH_USER}"
echo -e "  🌐 Host: ${SSH_HOST}"
echo -e "  🔑 Asegúrate de tener acceso SSH configurado"

echo -e "\n${YELLOW}⚠️  Este script intentará:${NC}"
echo -e "  1. Conectarse a ${SSH_HOST}"
echo -e "  2. Buscar usuarios en la BD de champagne events"
echo -e "  3. Identificar usuarios admin/principales"
echo -e "  4. Mostrar emails y UIDs encontrados"

echo -e "\n${GREEN}🚀 Ejecutando búsqueda...${NC}"

# Comando SSH que se ejecutará remotamente
REMOTE_CMD=$(cat << 'REMOTE_EOF'
#!/bin/bash
echo "=== 🔍 Buscando usuarios de champagne events ==="

# Lista de bases de datos a buscar
DBS=("champagne_events" "app_eventos" "bodasdehoy" "eventosorganizador")

for DB in "${DBS[@]}"; do
  echo ""
  echo "=== Buscando en base de datos: $DB ==="
  
  # Comando MongoDB para buscar usuarios
  MONGO_CMD=$(cat << MONGO_EOF
try {
  db = db.getSiblingDB('$DB');
  
  // Buscar todos los usuarios (limitar a 20)
  var users = db.users.find({}, {_id: 1, email: 1, name: 1, role: 1, status: 1})
    .sort({createdAt: -1})
    .limit(20)
    .toArray();
  
  if (users.length > 0) {
    print("✅ Encontrados " + users.length + " usuarios en " + '$DB');
    
    // Mostrar usuarios
    users.forEach(function(user, index) {
      print((index + 1) + ". Email: " + (user.email || 'N/A'));
      print("   UID: " + user._id);
      print("   Nombre: " + (user.name || 'N/A'));
      print("   Rol: " + (JSON.stringify(user.role) || 'N/A'));
      print("   Status: " + (user.status || 'N/A'));
      print("");
    });
    
    // Buscar específicamente usuarios admin
    var admins = db.users.find({role: {$in: ['admin', 'superadmin', 'owner', 'creator']}}, 
      {_id: 1, email: 1, name: 1, role: 1}).toArray();
    
    if (admins.length > 0) {
      print("🎯 USUARIOS ADMIN ENCONTRADOS:");
      admins.forEach(function(admin, index) {
        print("   " + (index + 1) + ". " + admin.email + " (UID: " + admin._id + ")");
        print("      Rol: " + JSON.stringify(admin.role));
      });
    }
    
  } else {
    print("❌ No hay usuarios en " + '$DB');
  }
} catch(e) {
  print("⚠️  Error accediendo a " + '$DB' + ": " + e.message);
}
MONGO_EOF
  )
  
  # Ejecutar comando MongoDB
  echo "$MONGO_CMD" | mongo --quiet 2>/dev/null || echo "  ⚠️  No se pudo acceder a $DB (¿no existe?)"
done

# También buscar usuarios con email de champagne-events
echo ""
echo "=== 🔎 Buscando usuarios con dominio champagne-events.com.mx ==="
SEARCH_CMD=$(cat << SEARCH_EOF
try {
  // Buscar en todas las bases de datos
  var allUsers = [];
  var dbs = ['champagne_events', 'app_eventos', 'bodasdehoy', 'eventosorganizador'];
  
  dbs.forEach(function(dbName) {
    try {
      var db = db.getSiblingDB(dbName);
      var users = db.users.find({email: /champagne-events\.com\.mx/i}, 
        {_id: 1, email: 1, name: 1}).toArray();
      
      if (users.length > 0) {
        print("✅ En " + dbName + ":");
        users.forEach(function(user) {
          print("   • " + user.email + " (UID: " + user._id + ")");
          allUsers.push(user);
        });
      }
    } catch(e) {}
  });
  
  if (allUsers.length === 0) {
    print("❌ No se encontraron usuarios con dominio champagne-events.com.mx");
  }
} catch(e) {
  print("Error: " + e.message);
}
SEARCH_EOF
)

echo "$SEARCH_CMD" | mongo --quiet 2>/dev/null || echo "  ⚠️  Error en búsqueda por dominio"

# Mostrar resumen
echo ""
echo "=== 📊 RESUMEN ==="
echo "Para usar el bypass, necesitas:"
echo "1. Email de un usuario existente en champagne events"
echo "2. UID correspondiente"
echo ""
echo "📝 Sugerencias de emails a probar:"
echo "   • admin@champagne-events.com.mx"
echo "   • contacto@champagne-events.com.mx"
echo "   • info@champagne-events.com.mx"
echo "   • jcc@bodasdehoy.com (usuario JCC multi-marca)"
echo ""
echo "🔧 Si no encuentras usuarios, puedes:"
echo "   1. Crear un usuario nuevo en champagne events test"
echo "   2. Contactar al equipo de champagne events"
echo "   3. Usar UID de prueba: TEST_OWNER_UID_001"
REMOTE_EOF
)

echo -e "${YELLOW}Ejecutando comandos en ${SSH_HOST}...${NC}"
echo -e "${YELLOW}(Esto puede tomar unos segundos)${NC}"

# Ejecutar via SSH
ssh -t ${SSH_USER}@${SSH_HOST} "$REMOTE_CMD" || {
  echo -e "${RED}❌ Error conectando a ${SSH_HOST}${NC}"
  echo -e "${YELLOW}Posibles soluciones:${NC}"
  echo -e "  1. Verifica que tienes acceso SSH a ${SSH_HOST}"
  echo -e "  2. Configura SSH key o credenciales"
  echo -e "  3. Usa: ssh ${SSH_USER}@${SSH_HOST} para probar manualmente"
  echo -e "  4. Pide acceso al equipo si no lo tienes"
}

echo -e "\n${GREEN}🎯 Una vez tengas el email y UID:${NC}"
echo -e "1. ${YELLOW}Abre el bypass local:${NC}"
echo -e "   open scripts/local-bypass-champagne.html"
echo -e "2. ${YELLOW}Completa con los datos encontrados${NC}"
echo -e "3. ${YELLOW}Activa el bypass${NC}"
echo -e "4. ${YELLOW}Abre champagne events en tu navegador${NC}"
echo -e "5. ${YELLOW}Pega el código en consola (F12)${NC}"

echo -e "\n${BLUE}✅ Script listo. Ejecútalo cuando tengas acceso SSH.${NC}"
echo -e "${YELLOW}💡 Si no tienes acceso SSH, pídelo al equipo.${NC}"
