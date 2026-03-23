#!/usr/bin/env bash
#
# Caso reproducible: LobeChat KB middleware (RAG) en api-ia
# Mismo contrato que usa chat-ia en lobechatKBMiddlewareService.ts (POST .../search)
#
# Uso:
#   ./scripts/test-lobechat-kb-api-ia.sh
#   BASE=https://api-ia.bodasdehoy.com ./scripts/test-lobechat-kb-api-ia.sh
#
# Para adjuntar a Slack: copiar salida completa (status + headers + body).

set -euo pipefail

BASE="${BASE:-${NEXT_PUBLIC_BACKEND_URL:-${PYTHON_BACKEND_URL:-https://api-ia.bodasdehoy.com}}}"
BASE="${BASE%/}"

echo "================================================"
echo "LobeChat KB — prueba contra: $BASE"
echo "================================================"
echo ""

TMP_JSON=$(mktemp)
trap 'rm -f "$TMP_JSON"' EXIT

cat >"$TMP_JSON" <<'EOF'
{"query":"test","user_id":"slack-debug-frontend","limit":2,"min_score":0.5}
EOF

echo "1) POST $BASE/api/lobechat-kb/search"
echo "   Body: $(cat "$TMP_JSON")"
echo ""

# -D - dump headers to stdout; -w status code
HTTP_CODE=$(curl -sS --max-time 25 -o /tmp/lobechat-kb-body.txt -w '%{http_code}' \
  -D /tmp/lobechat-kb-hdr.txt \
  -X POST "$BASE/api/lobechat-kb/search" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary @"$TMP_JSON") || true

echo "--- Response headers (buscar trace / request-id) ---"
cat /tmp/lobechat-kb-hdr.txt || true
echo ""
echo "--- HTTP status: $HTTP_CODE ---"
echo "--- Body ---"
cat /tmp/lobechat-kb-body.txt 2>/dev/null || echo "(vacío)"
echo ""

if command -v jq &>/dev/null; then
  echo "--- Body (jq, si es JSON) ---"
  jq '.' /tmp/lobechat-kb-body.txt 2>/dev/null || true
fi

echo ""
echo "2) POST $BASE/api/lobechat-kb/embed (smoke; puede fallar si requiere auth)"
EMBED_PAYLOAD='{"text":"hola mundo kb test","user_id":"slack-debug-frontend","file_id":"debug_file_1","metadata":{"source":"lobechat"}}'
curl -sS --max-time 25 -w "\nHTTP:%{http_code}\n" \
  -X POST "$BASE/api/lobechat-kb/embed" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$EMBED_PAYLOAD" || echo "(curl embed falló)"

echo ""
echo "Listo. Si api-ia devuelve trace_id en otro header, indicad el nombre exacto."
