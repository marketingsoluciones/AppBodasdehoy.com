#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# smoke-api-ia.sh — Verifica los endpoints de api-ia que la migración Opción A usa,
# ANTES del E2E conjunto. Prueba los shapes reales contra api-ia con un JWT real, sin
# necesitar el dev server local (golpea api-ia directo).
#
# USO:
#   JWT="<mcp_jwt_token de usuario test bodasdehoy>" \
#   ORG_ID="<org_id / development>" \
#   bash apps/chat-ia/scripts/smoke-api-ia.sh
#
# Variables opcionales:
#   API_IA_URL   (default https://api-ia.bodasdehoy.com)
#   USER_ID      (firebase_uid; default = se intenta extraer del JWT)
#   SESSION_ID   (para probar lectura de mensajes; default crea una sesión)
#
# Salida: una línea por check con OK/FAIL + código HTTP. Exit 1 si algún check crítico falla.
# NO escribe datos destructivos salvo el ciclo create→delete de su propia sesión/mensaje de prueba.
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail

API_IA_URL="${API_IA_URL:-https://api-ia.bodasdehoy.com}"
DEV="${ORG_ID:-bodasdehoy}"

if [ -z "${JWT:-}" ]; then
  echo "❌ Falta JWT. Uso: JWT=<token> ORG_ID=<dev> bash $0"
  exit 1
fi

PASS=0; FAIL=0; CRIT_FAIL=0
AUTH=(-H "Authorization: Bearer ${JWT}" -H "X-Development: ${DEV}" -H "Content-Type: application/json")

# check <nombre> <crítico:1|0> <método> <path> [body]
check() {
  local name="$1" crit="$2" method="$3" path="$4" body="${5:-}"
  local args=(-s -o /tmp/smoke_resp.txt -w "%{http_code}" -X "$method" "${API_IA_URL}${path}" "${AUTH[@]}" --max-time 20)
  [ -n "$body" ] && args+=(-d "$body")
  local code; code="$(curl "${args[@]}" 2>/dev/null)"
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    echo "  ✅ OK   [$code] $name"
    PASS=$((PASS+1))
  else
    local mark="⚠️ "; [ "$crit" = "1" ] && { mark="❌"; CRIT_FAIL=$((CRIT_FAIL+1)); }
    echo "  $mark [$code] $name  → $(head -c 120 /tmp/smoke_resp.txt 2>/dev/null)"
    FAIL=$((FAIL+1))
  fi
}

echo "═══ SMOKE api-ia (${API_IA_URL}, dev=${DEV}) ═══"

echo "── 1. SESIONES (lectura + crear) ──"
USER_ID="${USER_ID:-}"
check "GET /chat/sessions?userId" 1 GET "/chat/sessions?userId=${USER_ID}&limit=5"
# crear sesión de prueba y capturar su id
CREATE_CODE="$(curl -s -o /tmp/smoke_sess.txt -w "%{http_code}" -X POST "${API_IA_URL}/chat/session" "${AUTH[@]}" \
  -d "{\"development\":\"${DEV}\",\"title\":\"SMOKE-test\",\"type\":\"agent\"}" --max-time 20 2>/dev/null)"
SESSION_ID="${SESSION_ID:-$(grep -oE '"(id|_id|sessionId)":"[^"]+"' /tmp/smoke_sess.txt 2>/dev/null | head -1 | grep -oE '[^"]+$')}"
if [ "$CREATE_CODE" -ge 200 ] && [ "$CREATE_CODE" -lt 300 ] && [ -n "$SESSION_ID" ]; then
  echo "  ✅ OK   [$CREATE_CODE] POST /chat/session → id=${SESSION_ID}"; PASS=$((PASS+1))
else
  echo "  ❌ [$CREATE_CODE] POST /chat/session (sin id)"; CRIT_FAIL=$((CRIT_FAIL+1))
fi

echo "── 2. MENSAJES (CRUD) ──"
if [ -n "$SESSION_ID" ]; then
  MSG_CODE="$(curl -s -o /tmp/smoke_msg.txt -w "%{http_code}" -X POST "${API_IA_URL}/chat/messages" "${AUTH[@]}" \
    -d "{\"sessionId\":\"${SESSION_ID}\",\"role\":\"user\",\"content\":\"smoke ping\"}" --max-time 20 2>/dev/null)"
  MSG_ID="$(grep -oE '"(id|_id)":"[^"]+"' /tmp/smoke_msg.txt 2>/dev/null | head -1 | grep -oE '[^"]+$')"
  [ "$MSG_CODE" -ge 200 ] && [ "$MSG_CODE" -lt 300 ] && { echo "  ✅ OK   [$MSG_CODE] POST /chat/messages → id=${MSG_ID}"; PASS=$((PASS+1)); } \
    || { echo "  ❌ [$MSG_CODE] POST /chat/messages"; CRIT_FAIL=$((CRIT_FAIL+1)); }
  check "GET /chat/messages?sessionId" 1 GET "/chat/messages?sessionId=${SESSION_ID}&limit=10"
  [ -n "$MSG_ID" ] && check "PATCH /chat/messages/{id}" 0 PATCH "/chat/messages/${MSG_ID}" '{"content":"smoke edit"}'
  [ -n "$MSG_ID" ] && check "DELETE /chat/messages/{id}" 0 DELETE "/chat/messages/${MSG_ID}?reason=smoke"
else
  echo "  ⏭  saltado (sin SESSION_ID)"
fi

echo "── 3. SESSION GROUPS (CRUD) ──"
check "GET /chat/session-groups" 0 GET "/chat/session-groups"

echo "── 4. TOPICS (CRUD) ──"
[ -n "$SESSION_ID" ] && check "GET /chat/topics?sessionId" 0 GET "/chat/topics?sessionId=${SESSION_ID}"

echo "── 5. INBOX (6 lecturas) ──"
check "GET /api/users/by-email" 0 GET "/api/users/by-email?email=bodasdehoy.com@gmail.com&development=${DEV}"
check "GET /api/users/related-events" 0 GET "/api/users/related-events?email=bodasdehoy.com@gmail.com&development=${DEV}&page=1&limit=5"
check "GET /webapi/config/whitelabel" 0 GET "/webapi/config/whitelabel?development=${DEV}"

echo "── 6. CLEANUP (borrar sesión de prueba) ──"
[ -n "$SESSION_ID" ] && check "DELETE /chat/sessions/{id}" 0 DELETE "/chat/sessions/${SESSION_ID}"

echo ""
echo "═══ RESULTADO: ${PASS} OK · ${FAIL} fallos (${CRIT_FAIL} críticos) ═══"
[ "$CRIT_FAIL" -gt 0 ] && { echo "❌ Hay fallos CRÍTICOS — NO activar el flag hasta resolverlos con api-ia."; exit 1; }
echo "✅ Checks críticos OK. Listos para activar USE_API_IA_ENDPOINTS en el E2E."
exit 0
