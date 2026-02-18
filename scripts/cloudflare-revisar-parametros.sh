#!/usr/bin/env bash
# Revisar parámetros en Cloudflare (SOLO LECTURA – no modifica nada).
# Requiere: CLOUDFLARE_API_TOKEN (permiso DNS Read y Zone Read) y opcionalmente CLOUDFLARE_ZONE_ID.
# Si no tienes ZONE_ID, el script intenta obtenerlo listando zonas (name=bodasdehoy.com).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cargar .env si existe (no sobrescribir variables ya definidas)
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/.env" 2>/dev/null || true
  set +a
fi
if [ -f "$REPO_ROOT/apps/copilot/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$REPO_ROOT/apps/copilot/.env" 2>/dev/null || true
  set +a
fi

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
BASE_URL="https://api.cloudflare.com/client/v4"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Falta CLOUDFLARE_API_TOKEN (solo lectura: DNS Read + Zone Read)."
  echo "Crear token en: Cloudflare Dashboard → My Profile → API Tokens → Create Token (template 'Read all resources')."
  echo "Luego: export CLOUDFLARE_API_TOKEN=..."
  exit 1
fi

echo "=== Cloudflare: revisión de parámetros (solo lectura) ==="
echo ""

# 1) Obtener Zone ID de bodasdehoy.com si no está definido
if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Obteniendo Zone ID para bodasdehoy.com..."
  ZONES_JSON=$(curl -sS -X GET "$BASE_URL/zones?name=bodasdehoy.com" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")
  if ! echo "$ZONES_JSON" | grep -q '"success":true'; then
    echo "Error listando zonas. Respuesta:"
    echo "$ZONES_JSON" | head -20
    exit 2
  fi
  CLOUDFLARE_ZONE_ID=$(echo "$ZONES_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "No se encontró zona bodasdehoy.com. Comprueba el token y el dominio."
    exit 3
  fi
  echo "Zone ID: $CLOUDFLARE_ZONE_ID"
  echo ""
fi

# 2) Listar DNS records de la zona (solo los que nos interesan: app-test, chat-test)
echo "--- DNS records (app-test, chat-test) ---"
DNS_JSON=$(curl -sS -X GET "$BASE_URL/zones/$CLOUDFLARE_ZONE_ID/dns_records?per_page=100" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

if ! echo "$DNS_JSON" | grep -q '"success":true'; then
  echo "Error listando DNS. Respuesta:"
  echo "$DNS_JSON" | head -20
  exit 4
fi

# Filtrar por nombre app-test o chat-test
echo "$DNS_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
target = 'cfargotunnel.com'
for r in data.get('result', []):
    name = r.get('name', '')
    if 'app-test' in name or 'chat-test' in name:
        print('Nombre:', r.get('name'))
        print('Tipo:', r.get('type'))
        print('Contenido:', r.get('content'))
        print('Proxied:', r.get('proxied'))
        print('ID:', r.get('id'))
        print('---')
" 2>/dev/null || {
  echo "Registros DNS (raw):"
  echo "$DNS_JSON" | python3 -m json.tool 2>/dev/null | head -80
}

echo ""
echo "Valores esperados para que app-test y chat-test carguen:"
echo "  CNAME app-test.bodasdehoy.com  -> 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com (Proxied: true)"
echo "  CNAME chat-test.bodasdehoy.com -> 30fdf520-9577-470f-a224-4cda1e5eb3f0.cfargotunnel.com (Proxied: true)"
echo ""
echo "Public Hostnames (Zero Trust) hay que revisarlos en el dashboard:"
echo "  Zero Trust → Tunnels → lobe-chat-harbor → app-test.bodasdehoy.com → localhost:8080"
echo "  Zero Trust → Tunnels → lobe-chat-harbor → chat-test.bodasdehoy.com → localhost:3210"
echo ""
echo "=== Fin (no se ha modificado nada en Cloudflare) ==="
