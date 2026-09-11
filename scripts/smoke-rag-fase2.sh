#!/bin/bash
# Smoke RAG Fase 2 — file_id PURO (sin file_url/text). Ejecutar cuando api-ia confirme lookup R2.
# Uso: bash scripts/smoke-rag-fase2.sh <FILE_ID_REAL> <USER_ID_REAL>
# Verifica: el front manda solo {file_id,user_id} y api-ia resuelve la URL en R2, trocea y vectoriza.
set -u
BASE="https://api-ia.bodasdehoy.com"
DEV="bodasdehoy"
FILE_ID="${1:-}"
USER_ID="${2:-smoke-coord}"

if [ -z "$FILE_ID" ]; then
  echo "Falta FILE_ID. Primero obtén uno real:"
  echo "  curl -s '$BASE/api/files/list?development=$DEV&user_id=$USER_ID&limit=5' -H 'X-Development: $DEV'"
  exit 1
fi

echo "=== 1) batch-embed-file con file_id PURO (sin file_url/text) ==="
curl -s --max-time 40 -X POST "$BASE/api/lobechat-kb/batch-embed-file" \
  -H "Content-Type: application/json" -H "X-Development: $DEV" \
  -d "{\"file_id\":\"$FILE_ID\",\"user_id\":\"$USER_ID\"}"
echo ""
echo "=== 2) search recupera lo vectorizado ==="
curl -s --max-time 25 -X POST "$BASE/api/lobechat-kb/search" \
  -H "Content-Type: application/json" -H "X-Development: $DEV" \
  -d "{\"query\":\"contenido del archivo\",\"user_id\":\"$USER_ID\",\"limit\":5}"
echo ""
echo "=== 3) cleanup ==="
curl -s --max-time 15 -X DELETE "$BASE/api/lobechat-kb/embed/$USER_ID/$FILE_ID" -H "X-Development: $DEV"
echo ""
echo "Si 1) da success+total_chunks>0 SIN mandar file_url => fase 2 cerrada."
