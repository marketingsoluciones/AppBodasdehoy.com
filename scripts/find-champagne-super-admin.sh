#!/bin/bash
# Script específico para encontrar el SUPER ADMINISTRADOR REAL de champagne events
# Los mensajes van a este usuario, así que es crítico encontrarlo

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 BUSCANDO SUPER ADMINISTRADOR REAL DE CHAMPAGNE EVENTS${NC}"
echo -e "${BLUE}========================================================${NC}\n"

echo -e "${RED}⚠️  ⚠️  ⚠️  IMPORTANTE CRÍTICO ⚠️  ⚠️  ⚠️ ${NC}"
echo -e "${RED}Los mensajes van al SUPER ADMIN real de champagne events${NC}"
echo -e "${RED}Necesitas encontrar al usuario REAL, no uno de prueba${NC}\n"

SSH_USER="${SSH_USER:-$USER}"
SSH_HOST="${SSH_HOST:-api3-mcp-graphql.eventosorganizador.com}"

echo -e "${GREEN}📋 Configuración SSH:${NC}"
echo -e "  👤 Usuario: ${SSH_USER}"
echo -e "  🌐 Host: ${SSH_HOST}"

echo -e "\n${YELLOW}🎯 Este script buscará específicamente:${NC}"
echo -e "  1. Usuarios con rol 'superadmin', 'admin', 'owner', 'creator'"
echo -e "  2. Usuarios con dominio @champagne-events.com.mx"
echo -e "  3. Usuarios creados más recientemente (probablemente los activos)"
echo -e "  4. Usuarios con status 'active' o similar"

REMOTE_CMD=$(cat << 'REMOTE_EOF'
#!/bin/bash
echo "=== 🔍 BUSQUEDA ESPECÍFICA DE SUPER ADMIN CHAMPAGNE EVENTS ==="
echo ""

# Buscar en champagne_events primero (la BD más probable)
echo "=== 1. BUSCANDO EN champagne_events ==="
MONGO_CHAMPAGNE=$(cat << MONGO_EOF
try {
  db = db.getSiblingDB('champagne_events');
  
  // Buscar SUPER ADMINS primero
  var superAdmins = db.users.find({
    \$or: [
      {role: 'superadmin'},
      {role: 'admin'},
      {role: 'owner'},
      {role: 'creator'},
      {email: /champagne-events\\.com\\.mx/i},
      {email: /admin@/i}
    ]
  }, {
    _id: 1,
    email: 1,
    name: 1,
    role: 1,
    status: 1,
    createdAt: 1,
    lastLogin: 1
  }).sort({createdAt: -1}).limit(10).toArray();
  
  if (superAdmins.length > 0) {
    print("🎯 SUPER ADMINS ENCONTRADOS EN champagne_events:");
    superAdmins.forEach(function(user, i) {
      print("");
      print((i + 1) + ". 📧 EMAIL: " + user.email);
      print("   🆔 UID: " + user._id);
      print("   👤 NOMBRE: " + (user.name || 'N/A'));
      print("   🎭 ROL: " + (JSON.stringify(user.role) || 'N/A'));
      print("   📊 STATUS: " + (user.status || 'N/A'));
      if (user.createdAt) print("   📅 CREADO: " + user.createdAt);
      if (user.lastLogin) print("   🔐 ÚLTIMO LOGIN: " + user.lastLogin);
      
      // Marcar como probable super admin real
      if (user.email && user.email.includes('champagne-events.com.mx')) {
        print("   ✅ ✅ ✅ PROBABLE SUPER ADMIN REAL (dominio champagne-events)");
      }
      if (user.role && (user.role.includes('super') || user.role.includes('admin'))) {
        print("   ⭐ ROL DE ADMINISTRADOR");
      }
    });
  } else {
    print("❌ No se encontraron super admins en champagne_events");
  }
  
  // También buscar TODOS los usuarios para ver el panorama
  var allUsers = db.users.find({}, {_id: 1, email: 1, role: 1})
    .sort({createdAt: -1}).limit(5).toArray();
  
  if (allUsers.length > 0) {
    print("");
    print("=== 👥 ÚLTIMOS 5 USUARIOS EN champagne_events ===");
    allUsers.forEach(function(user) {
      print("   • " + user.email + " (UID: " + user._id + ", Rol: " + (user.role || 'N/A') + ")");
    });
  }
  
} catch(e) {
  print("❌ Error: " + e.message);
}
MONGO_EOF
)

echo "$MONGO_CHAMPAGNE" | mongo --quiet 2>/dev/null || echo "  ⚠️  No se pudo acceder a champagne_events"

echo ""
echo "=== 2. BUSCANDO EN OTRAS BASES DE DATOS ==="
# Buscar en otras BD por si acaso
DBS=("app_eventos" "bodasdehoy" "eventosorganizador")
for DB in "${DBS[@]}"; do
  echo ""
  echo "--- Buscando en $DB ---"
  MONGO_OTHER=$(cat << MONGO_EOF
try {
  db = db.getSiblingDB('$DB');
  var users = db.users.find({
    \$or: [
      {email: /champagne-events\\.com\\.mx/i},
      {email: /admin@/i},
      {role: {\$in: ['superadmin', 'admin', 'owner', 'creator']}}
    ]
  }, {_id: 1, email: 1, name: 1, role: 1}).toArray();
  
  if (users.length > 0) {
    print("✅ Encontrados en $DB:");
    users.forEach(function(user) {
      print("   • " + user.email + " (UID: " + user._id + ", Rol: " + (JSON.stringify(user.role) || 'N/A') + ")");
    });
  }
} catch(e) {}
MONGO_EOF
  )
  echo "$MONGO_OTHER" | mongo --quiet 2>/dev/null || true
done

echo ""
echo "=== 3. BUSQUEDA POR DOMINIO ESPECÍFICO ==="
DOMAIN_CMD=$(cat << DOMAIN_EOF
try {
  var results = [];
  var dbs = ['champagne_events', 'app_eventos', 'bodasdehoy', 'eventosorganizador'];
  
  dbs.forEach(function(dbName) {
    try {
      var db = db.getSiblingDB(dbName);
      var users = db.users.find({email: /champagne-events\\.com\\.mx/i}, 
        {_id: 1, email: 1, name: 1, role: 1, createdAt: 1})
        .sort({createdAt: -1})
        .toArray();
      
      if (users.length > 0) {
        print("🎯 USUARIOS CON DOMINIO champagne-events.com.mx en " + dbName + ":");
        users.forEach(function(user) {
          print("   📧 " + user.email);
          print("   🆔 " + user._id);
          print("   👤 " + (user.name || 'N/A'));
          print("   🎭 " + (JSON.stringify(user.role) || 'N/A'));
          if (user.createdAt) print("   📅 " + user.createdAt);
          print("");
          results.push(user);
        });
      }
    } catch(e) {}
  });
  
  if (results.length === 0) {
    print("❌ NO HAY USUARIOS CON DOMINIO champagne-events.com.mx");
    print("");
    print("⚠️  ⚠️  ⚠️  PROBLEMA CRÍTICO ⚠️  ⚠️  ⚠️");
    print("No se encontró NINGÚN usuario con dominio champagne-events.com.mx");
    print("Los mensajes NO PUEDEN llegar si no existe este usuario.");
    print("");
    print("🔧 SOLUCIONES:");
    print("1. Contactar URGENTEMENTE al equipo de champagne events");
    print("2. Preguntar por el email del SUPER ADMIN real");
    print("3. Crear un usuario admin en champagne events test");
  }
  
} catch(e) {
  print("Error en búsqueda por dominio: " + e.message);
}
DOMAIN_EOF
)

echo "$DOMAIN_CMD" | mongo --quiet 2>/dev/null || echo "  ⚠️  Error en búsqueda por dominio"

echo ""
echo "=== 🚨 INSTRUCCIONES CRÍTICAS ==="
echo "1. Si encuentras usuario con dominio @champagne-events.com.mx:"
echo "   • ESE es el SUPER ADMIN real"
echo "   • Usa ESE email y UID para el bypass"
echo ""
echo "2. Si NO encuentras usuario con ese dominio:"
echo "   • Contacta URGENTE al equipo de champagne events"
echo "   • Pregunta: '¿Cuál es el email del super admin de champagne events?'"
echo "   • Pide que te den acceso o creen el usuario"
echo ""
echo "3. Emails probables del super admin real:"
echo "   • admin@champagne-events.com.mx"
echo "   • contacto@champagne-events.com.mx"
echo "   • info@champagne-events.com.mx"
echo "   • soporte@champagne-events.com.mx"
echo "   • [nombre]@champagne-events.com.mx (ej: maria@, juan@, etc.)"
echo ""
echo "4. SIN el usuario real, los mensajes NO llegarán"
REMOTE_EOF
)

echo -e "\n${GREEN}🚀 Ejecutando búsqueda CRÍTICA en ${SSH_HOST}...${NC}"
echo -e "${RED}(Esto es esencial para que los mensajes funcionen)${NC}"

ssh -t ${SSH_USER}@${SSH_HOST} "$REMOTE_CMD" || {
  echo -e "${RED}❌❌❌ ERROR CONECTANDO A ${SSH_HOST} ❌❌❌${NC}"
  echo -e "${YELLOW}Sin acceso SSH, NO puedes encontrar al super admin real.${NC}"
  echo -e ""
  echo -e "${RED}ACCIONES URGENTES:${NC}"
  echo -e "1. ${YELLOW}Pide acceso SSH a ${SSH_HOST} AL EQUIPO${NC}"
  echo -e "2. ${YELLOW}Pregunta directamente: '¿Cuál es el email del super admin de champagne events?'${NC}"
  echo -e "3. ${YELLOW}Si no hay respuesta, contacta al equipo de champagne events directamente${NC}"
}

echo -e "\n${RED}🎯 PASO FINAL (CRÍTICO):${NC}"
echo -e "1. ${YELLOW}Ejecuta este script cuando tengas acceso SSH${NC}"
echo -e "2. ${YELLOW}Encuentra el email y UID del SUPER ADMIN real${NC}"
echo -e "3. ${YELLOW}Usa esos datos en: open scripts/local-bypass-champagne.html${NC}"
echo -e "4. ${YELLOW}Los mensajes SOLO llegarán si usas el usuario REAL${NC}"

echo -e "\n${BLUE}📞 CONTACTOS DE EMERGENCIA:${NC}"
echo -e "• Equipo API2: Pide acceso SSH"
echo -e "• Equipo Champagne Events: Pregunta por el super admin"
echo -e "• Slack: Canal #copilot-api-ia para escalar"
