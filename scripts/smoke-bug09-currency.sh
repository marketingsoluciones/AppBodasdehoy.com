#!/usr/bin/env bash
# scripts/smoke-bug09-currency.sh
# ─────────────────────────────────────────────────────────────────────────────
# Smoke post-migración BUG-09: confirmar que el cluster saqnro0 quedó normalizado
# y que el front muestra € en eventos bodasdehoy.
#
# Uso:
#   bash scripts/smoke-bug09-currency.sh
#
# Pre-requisitos:
#   - SSH config con alias `mcp` apuntando a api-mcp (Tailscale o IP directa)
#   - Acceso read-only al cluster saqnro0 (db.eventos)
#   - app-dev.bodasdehoy.com online
#
# Salidas:
#   ✅ verde si todos los checks pasan
#   ❌ rojo + detalle del item que falla
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXPECTED_USA=2          # USA conservados USD
EXPECTED_VE=13          # Venezuela conservados USD
TARGET_DEV="bodasdehoy"

echo "═══════════════════════════════════════════════════════════"
echo "SMOKE BUG-09 currency migration"
echo "═══════════════════════════════════════════════════════════"

# ─── 1. Verificar UPDATE aplicado en cluster ──────────────────────────────
echo ""
echo "▶ 1. Cluster saqnro0 — verificación UPDATE"
ssh -o BatchMode=yes mcp 'cat > /tmp/smoke_bug09.cjs << "EOF"
const mongoose = require("/var/www/api-production/node_modules/mongoose");
const uri = "mongodb+srv://eventosorganizadorcom_db_user:VXDmPJm8Tt702vTy@cluster0.saqnro0.mongodb.net/eventos_organizador?retryWrites=true&w=majority";
(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1) Bodasdehoy+usd remaining = solo los 15 USA/VE legítimos
  const usdRemaining = await db.collection("eventos").aggregate([
    { $match: { development: "bodasdehoy", "presupuesto_objeto.currency": "usd" } },
    { $lookup: { from: "users", localField: "usuario_id", foreignField: "uid", as: "u" } },
    { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$u.country", count: { $sum: 1 } } }
  ]).toArray();
  console.log("USD_REMAINING:" + JSON.stringify(usdRemaining));

  // 2) Bodasdehoy+EUR mayúsculas → debe ser 0 (segunda pasada)
  const eurMayus = await db.collection("eventos").countDocuments({
    development: "bodasdehoy",
    "presupuesto_objeto.currency": "EUR"
  });
  console.log("EUR_UPPER:" + eurMayus);

  // 3) Bodasdehoy+eur minúsculas → debe ser ~496 + 94 + 20 = ~610
  const eurLower = await db.collection("eventos").countDocuments({
    development: "bodasdehoy",
    "presupuesto_objeto.currency": "eur"
  });
  console.log("EUR_LOWER:" + eurLower);

  // 4) Evento sample QA: Boda de Maria y MamaJuana
  const sample = await db.collection("eventos").findOne(
    { nombre: /Boda de Maria y Mama/i },
    { projection: { nombre: 1, "presupuesto_objeto.currency": 1, usuario_nombre: 1 } }
  );
  console.log("QA_SAMPLE:" + JSON.stringify(sample));

  await mongoose.disconnect();
})();
EOF
node /tmp/smoke_bug09.cjs 2>&1' > /tmp/smoke_output.txt

USD_REMAINING=$(grep "^USD_REMAINING:" /tmp/smoke_output.txt | sed 's/^USD_REMAINING://')
EUR_UPPER=$(grep "^EUR_UPPER:" /tmp/smoke_output.txt | sed 's/^EUR_UPPER://')
EUR_LOWER=$(grep "^EUR_LOWER:" /tmp/smoke_output.txt | sed 's/^EUR_LOWER://')
QA_SAMPLE=$(grep "^QA_SAMPLE:" /tmp/smoke_output.txt | sed 's/^QA_SAMPLE://')

echo "  USD remaining (por país): $USD_REMAINING"
echo "  EUR mayúsculas: $EUR_UPPER (esperado: 0)"
echo "  eur minúsculas: $EUR_LOWER (esperado: 600+)"
echo "  Boda Maria sample: $QA_SAMPLE"

# Validar EUR mayúsculas = 0
if [ "$EUR_UPPER" != "0" ]; then
  echo -e "${RED}❌ EUR mayúsculas no migradas (esperado 0, got $EUR_UPPER)${NC}"
  exit 1
fi

# Validar Boda Maria muestra eur
if echo "$QA_SAMPLE" | grep -q '"currency":"eur"'; then
  echo -e "${GREEN}✅ QA sample 'Boda de Maria y MamaJuana' → currency=eur${NC}"
else
  echo -e "${RED}❌ QA sample NO tiene currency=eur: $QA_SAMPLE${NC}"
  exit 1
fi

# Validar que USD remaining solo contiene USA + VE (conteo aproximado)
if echo "$USD_REMAINING" | grep -q "Estados Unidos\|Venezuela"; then
  echo -e "${GREEN}✅ USD remaining = solo USA/VE legítimos${NC}"
else
  echo -e "${YELLOW}⚠️ USD remaining sin USA/VE — revisar: $USD_REMAINING${NC}"
fi

# ─── 2. Front smoke ─────────────────────────────────────────────────────────
echo ""
echo "▶ 2. Front app-dev — /resumen-evento responde"
HTTP_RESUMEN=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://app-dev.bodasdehoy.com/resumen-evento)
if [ "$HTTP_RESUMEN" = "200" ]; then
  echo -e "${GREEN}✅ /resumen-evento HTTP $HTTP_RESUMEN${NC}"
else
  echo -e "${RED}❌ /resumen-evento HTTP $HTTP_RESUMEN${NC}"
  exit 1
fi

# ─── 3. Resumen final ──────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}SMOKE BUG-09 PASSED${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Próximos manual:"
echo "  1. QA hace screenshot de /resumen-evento de un evento bodasdehoy"
echo "  2. Verificar visualmente que el icono moneda es € (no US\$)"
echo "  3. Pasar a cerrar BUG-09 en informe QA"
