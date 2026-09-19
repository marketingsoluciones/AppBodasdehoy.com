#!/bin/bash
# ============================================================
# VALIDADOR DE DATOS PERSONALES EN FIXTURES
# Ejecutar ANTES de cualquier test que use datos de eventos
# ============================================================
FIXTURE_DIR="$(dirname "$0")/e2e-app/fixtures/champagne-events"
FIXTURE="$FIXTURE_DIR/eventos-sanitizados.json"

if [ ! -f "$FIXTURE" ]; then
  echo "❌ Fixture no encontrado: $FIXTURE"
  exit 1
fi

echo "🔍 Verificando que NO haya datos personales reales..."

DANGEROUS_EMAILS=(
  "norbertode@gmail.com" "adch.edch@gmail.com" "adsch.edch@gmail.com"
  "acsch.edch@gmail.com" "febmerlib@gmail.com" "eeramirezandrea@gmail.com"
  "pruebasweb11394@gmail.com" "sistemasjaihom@gmail.com" "prueba10@gmail.com"
  "albioenrriquegonzalezmora@gmail.com" "emilysmith@outlock.com"
  "jwprinces@gmail.com" "jimmy125@gmail.com" "pedroperez@gmail.com"
  "pedroperez1@gmail.com" "pedroperez3@gmail.com" "pedroperez5@gmail.com"
  "pedroperez6@gmail.com" "pedroperez7@gmail.com" "pedroperez8@gmail.com"
  "pedroperez9@gmail.com" "pedroperez10@gmail.com"
)
LEAKS=0
for email in "${DANGEROUS_EMAILS[@]}"; do
  if grep -qi "$email" "$FIXTURE"; then
    echo "  🚨 EMAIL FILTRADO: $email"
    LEAKS=$((LEAKS+1))
  fi
done

DANGEROUS_PHONES=("+584246807702" "+584246807701" "+584246025634"
  "+584149234567" "+584246025639" "+584246022634" "+584246015633"
  "+584246025534" "+584246021634" "+584246025638" "+584121234567"
  "+584121067092" "+584146032949" "+584241234567" "+584121234561"
  "+584246158537" "+584146025638" "+34622440213" "+15555551234"
  "+15555551235" "+15555551236" "+584121067085" "+584121067086"
  "+584121067087" "+584121067088" "+584121067089" "+584121067090"
  "+584121067093" "+584121067094" "+584121067095" "+584141234566")

for phone in "${DANGEROUS_PHONES[@]}"; do
  if grep -q "$phone" "$FIXTURE"; then
    echo "  🚨 TELÉFONO FILTRADO: $phone"
    LEAKS=$((LEAKS+1))
  fi
done

if grep -qi "sistemasjaihom.com" "$FIXTURE"; then
  echo "  🚨 DOMINIO FILTRADO: sistemasjaihom.com"  LEAKS=$((LEAKS+1))
fi

if [ $LEAKS -eq 0 ]; then
  echo "✅ VALIDACIÓN PASADA: 0 datos personales reales encontrados"
  echo "   Seguro para ejecutar tests."
  exit 0
else
  echo ""
  echo "🚨 VALIDACIÓN FALLIDA: $LEAKS filtraciones encontradas"
  echo "   NO ejecutar tests hasta corregir."
  exit 1
fi