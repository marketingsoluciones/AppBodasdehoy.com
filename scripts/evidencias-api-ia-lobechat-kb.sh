#!/usr/bin/env bash
#
# Re-test lobechat-kb → evidencia para #copilot-api-ia
# Incluye X-Request-ID en cada request para correlación en logs del servidor.
#
# Uso:
#   export API_IA_BASE="https://api-ia.bodasdehoy.com"
#   export KB_USER_ID="usuario@correo.com"
#   export KB_EXTRA_HEADER='Authorization: Bearer xxx'   # opcional
#   export OUTPUT_FILE="./evidencia-lobechat-kb.txt"        # opcional: guardar + consola
#   pnpm evidencias:api-ia:lobechat-kb

API_IA_BASE="${API_IA_BASE:-https://api-ia.bodasdehoy.com}"
KB_USER_ID="${KB_USER_ID:-REEMPLAZAR_USER_ID}"

if [[ -n "${OUTPUT_FILE:-}" ]]; then
  touch "$OUTPUT_FILE"
  exec > >(tee -a "$OUTPUT_FILE")
fi

utc_now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

gen_request_id() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen
  else
    printf 'lobechat-%s-%s' "$(date +%s)" "$(openssl rand -hex 8 2>/dev/null || echo manual)"
  fi
}

extract_trace_id_body() {
  local body="$1"
  if command -v jq >/dev/null 2>&1; then
    echo "$body" | jq -r '
      .trace_id // .traceId //
      .detail.trace_id // .error.trace_id //
      (if (.detail | type) == "object" then .detail.trace_id else empty end) //
      (if (.detail | type) == "string" then (.detail | try fromjson catch empty | .trace_id) else empty end) //
      empty
    ' 2>/dev/null | head -1
  else
    echo "$body" | grep -oE '"trace_id"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true
  fi
}

extract_trace_id_headers() {
  local hdr_file="$1"
  [[ ! -f "$hdr_file" ]] && return
  grep -i -E '^(x-trace-id|x-request-id|traceparent|x-correlation-id):' "$hdr_file" 2>/dev/null | tr -d '\r' | head -5
}

run_one() {
  local name="$1"
  local path="$2"
  local json_body="$3"
  local url="${API_IA_BASE}${path}"
  local utc
  utc="$(utc_now)"
  local client_rid
  client_rid="$(gen_request_id)"

  local tmp_body tmp_hdr
  tmp_body="$(mktemp)"
  tmp_hdr="$(mktemp)"

  local code
  code="$(
    curl -sS -D "$tmp_hdr" -o "$tmp_body" -w '%{http_code}' -X POST "$url" \
      -H 'Content-Type: application/json' \
      -H "X-Request-ID: ${client_rid}" \
      ${KB_EXTRA_HEADER:+-H "$KB_EXTRA_HEADER"} \
      -d "$json_body" 2>/dev/null || echo '000'
  )"

  local body
  body="$(cat "$tmp_body" 2>/dev/null || true)"
  rm -f "$tmp_body"

  local server_tid
  server_tid="$(extract_trace_id_body "$body")"
  local hdr_lines
  hdr_lines="$(extract_trace_id_headers "$tmp_hdr")"

  if [[ -z "$server_tid" || "$server_tid" == "null" ]]; then
    server_tid="$(grep -i '^x-trace-id:' "$tmp_hdr" 2>/dev/null | head -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//')"
  fi
  local resp_req_id
  resp_req_id="$(grep -i '^x-request-id:' "$tmp_hdr" 2>/dev/null | head -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//')"
  if [[ -z "$server_tid" ]]; then
    server_tid="$resp_req_id"
  fi
  if [[ -z "$server_tid" ]]; then
    server_tid="(no devuelto por api-ia; usar correlación con X-Request-ID cliente abajo)"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "[Chat-IA → api-ia] Re-test lobechat-kb — ${name}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "1) Request real"
  echo "   - método: POST"
  echo "   - URL/path: ${url}"
  echo "   - headers:"
  echo "       Content-Type: application/json"
  echo "       X-Request-ID: ${client_rid}  (generado por este script — buscar en logs api-ia)"
  [[ -n "${KB_EXTRA_HEADER:-}" ]] && echo "       ${KB_EXTRA_HEADER}"
  echo "   - body:"
  echo "       ${json_body}"
  echo ""
  echo "2) Response real completa"
  echo "   - status code: ${code}"
  echo "   - cabeceras de respuesta (filtradas: trace/request/correlation):"
  if [[ -n "$hdr_lines" ]]; then
    echo "$hdr_lines" | sed 's/^/       /'
  else
    echo "       (ninguna típica; SAVE_HEADERS=1 para listar todo)"
  fi
  echo "   - body completo:"
  echo "$body" | sed 's/^/       /'
  echo ""
  echo "3) trace_id / correlación"
  echo "   - trace_id (body o cabecera respuesta): ${server_tid}"
  echo "   - X-Request-ID enviado (cliente, para vuestros logs): ${client_rid}"
  echo ""
  echo "4) hora UTC (aprox. ejecución): ${utc}"
  echo ""

  if [[ "${SAVE_HEADERS:-}" == "1" ]]; then
    echo "   --- cabeceras respuesta completas (SAVE_HEADERS=1) ---"
    sed 's/^/       /' "$tmp_hdr"
    echo ""
  fi
  rm -f "$tmp_hdr"
}

SEARCH_JSON='{"query":"re-test cierre lobechat-kb search","user_id":"'"${KB_USER_ID}"'","limit":3,"min_score":0.3}'
EMBED_JSON='{"text":"re-test cierre lobechat-kb embed","user_id":"'"${KB_USER_ID}"'","file_id":"evidencia-'"$(date +%s)"'","metadata":{}}'

echo "Generando 2 evidencias (search + embed). Opcional: SAVE_HEADERS=1"

run_one "POST /api/lobechat-kb/search" "/api/lobechat-kb/search" "$SEARCH_JSON"
run_one "POST /api/lobechat-kb/embed" "/api/lobechat-kb/embed" "$EMBED_JSON"

echo "Fin. Copiar al hilo #copilot-api-ia."
