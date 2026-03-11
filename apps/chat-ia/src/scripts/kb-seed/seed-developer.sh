#!/bin/bash
# seed-developer.sh
# Inyecta la plantilla de presupuesto de boda en la KB de un developer/planner.
#
# Uso:
#   ADMIN_API_KEY=tu_clave USER_ID=uid_del_usuario ./seed-developer.sh
#
# O con el servidor corriendo en otro puerto:
#   BASE_URL=https://chat-test.bodasdehoy.com ADMIN_API_KEY=... USER_ID=... ./seed-developer.sh

BASE_URL="${BASE_URL:-http://localhost:3210}"
ADMIN_API_KEY="${ADMIN_API_KEY:?Error: ADMIN_API_KEY es requerida}"
USER_ID="${USER_ID:?Error: USER_ID es requerido}"

echo "→ Seeding KB de bodas para usuario: $USER_ID"
echo "→ Endpoint: $BASE_URL/api/admin/seed-wedding-kb"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/seed-wedding-kb" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -d "{\"userId\": \"$USER_ID\"}")

echo "← Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q '"created":true'; then
  echo "✅ KB creada correctamente"
elif echo "$RESPONSE" | grep -q '"created":false'; then
  echo "ℹ️  KB ya existía para este usuario"
else
  echo "❌ Error al crear KB"
  exit 1
fi
