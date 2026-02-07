#!/usr/bin/env bash
set -euo pipefail

# Smoke test para Backend IA (api-ia.bodasdehoy.com o el que indiques)
# Objetivo: generar evidencia reproducible (status codes + headers + primeros bytes).
#
# Uso:
#   bash scripts/smoke-test-backend-ia.sh
#   BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" bash scripts/smoke-test-backend-ia.sh
#
# Salida: imprime resultados por consola (copiable a ticket).

BASE_URL="${BASE_URL:-https://api-ia.bodasdehoy.com}"
DEVELOPMENT="${DEVELOPMENT:-bodasdehoy}"
#
# IMPORTANTE:
# - Para `provider=auto` NO debemos forzar un `model` tipo `openrouter/auto`,
#   porque eso deja de ser auto-routing y puede alterar el resultado.
# - Si quieres forzar un model para pruebas, pásalo vía env: MODEL="..."
MODEL="${MODEL:-}"
MAX_TIME="${MAX_TIME:-25}"
# Lista de providers a probar (separados por espacio)
PROVIDERS="${PROVIDERS:-auto}"

REQ_ID="smoke_$(date +%Y%m%d_%H%M%S)_$RANDOM"
REPORT_DIR="${REPORT_DIR:-docs/reports}"
REPORT_FILE="${REPORT_FILE:-${REPORT_DIR}/BACKEND_IA_SMOKE_${REQ_ID}.md}"

mkdir -p "${REPORT_DIR}"

run() {
  # Imprime a consola y además lo guarda en el .md
  tee -a "${REPORT_FILE}"
}

{
  echo "## Smoke Test Backend IA"
  echo
  echo "- **Base URL**: \`${BASE_URL}\`"
  echo "- **Development**: \`${DEVELOPMENT}\`"
  echo "- **Providers**: \`${PROVIDERS}\`"
  echo "- **Model (default)**: \`${MODEL}\`"
  echo "- **RequestId**: \`${REQ_ID}\`"
  echo "- **Fecha (UTC)**: \`$(date -u +"%Y-%m-%dT%H:%M:%SZ")\`"
  echo
  echo "### 1) Health"
  echo '```'
  curl -sS -i --max-time "${MAX_TIME}" "${BASE_URL}/health" | head -n 60 || true
  echo '```'
  echo

  for PROVIDER in ${PROVIDERS}; do
    echo "### 2) Models (${PROVIDER})"
    echo '```'
    curl -sS -i --max-time "${MAX_TIME}" -H "X-Development: ${DEVELOPMENT}" "${BASE_URL}/webapi/models/${PROVIDER}" | head -n 120 || true
    echo '```'
    echo

    echo "### 3) Chat (${PROVIDER}) stream:false (esperado: JSON)"
    echo '```'
    TMP_FILE="$(mktemp)"
    CHAT_DATA="{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"stream\":false}"
    if [ -n "${MODEL}" ]; then
      CHAT_DATA="{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"model\":\"${MODEL}\",\"stream\":false}"
    fi
    curl -sS -i --max-time "${MAX_TIME}" \
      -X POST "${BASE_URL}/webapi/chat/${PROVIDER}" \
      -H "Content-Type: application/json" \
      -H "X-Development: ${DEVELOPMENT}" \
      -H "X-Request-Id: ${REQ_ID}" \
      --data "${CHAT_DATA}" \
      > "${TMP_FILE}" || true
    head -n 180 "${TMP_FILE}" || true
    echo '```'
    # Evaluación mínima: detectar respuesta vacía o error en JSON
    EMPTY_SUCCESS=0
    if grep -q '"success"[[:space:]]*:[[:space:]]*true' "${TMP_FILE}" && grep -q '"message"[[:space:]]*:[[:space:]]*""' "${TMP_FILE}"; then
      EMPTY_SUCCESS=1
    fi

    echo
    if [ "${EMPTY_SUCCESS}" -eq 1 ]; then
      echo "**Resultado:** ❌ FAIL — success:true pero message:\"\" (respuesta vacía; debe ser error estructurado o contenido real)."
    else
      HTTP_STATUS="$(grep -m1 -E '^HTTP/[0-9.]+' "${TMP_FILE}" | cut -d' ' -f2 || true)"
      HAS_429=0
      # detectar rate limit / upstream 429 en cuerpo (varios formatos)
      if grep -Eq '"upstream_status"[[:space:]]*:[[:space:]]*429|Error de OpenAI: 429|rate limit|Rate limit|429' "${TMP_FILE}"; then
        HAS_429=1
      fi
      HAS_OLLAMA_UNAVAILABLE=0
      if grep -Eqi 'Ollama no disponible|\"provider\"[[:space:]]*:[[:space:]]*\"ollama\"' "${TMP_FILE}"; then
        HAS_OLLAMA_UNAVAILABLE=1
      fi

      # OK si el backend devuelve error estructurado (503) cuando no hay respuesta real / no hay providers
      if [ "${HTTP_STATUS}" = "503" ] && grep -q '"error_code"[[:space:]]*:[[:space:]]*"EMPTY_RESPONSE"' "${TMP_FILE}"; then
        if [ "${HAS_OLLAMA_UNAVAILABLE}" -eq 1 ]; then
          echo "**Resultado:** ❌ FAIL — 503 EMPTY_RESPONSE pero la causa parece ser \"Ollama no disponible\" (debería ser PROVIDER_UNAVAILABLE y/o no seleccionar Ollama si no está disponible)."
          echo
          echo "**Sugerencia (backend):** devolver error_code=PROVIDER_UNAVAILABLE (o similar) y upstream_status explícito; y evitar fallback/selección a Ollama cuando no está disponible."
        elif [ "${HAS_429}" -eq 1 ]; then
          echo "**Resultado:** ⚠️ WARN — 503 con error_code: EMPTY_RESPONSE pero el upstream parece ser 429 (rate limit)."
          echo
          echo "**Sugerencia (backend):** devolver error_code=UPSTREAM_RATE_LIMIT (o similar) y upstream_status=429 explícito, en lugar de error_code=EMPTY_RESPONSE."
        else
          echo "**Resultado:** ✅ OK (503 esperado: EMPTY_RESPONSE)."
        fi
      elif [ "${HTTP_STATUS}" = "503" ] && grep -q '"error_code"[[:space:]]*:[[:space:]]*"NO_PROVIDERS_AVAILABLE"' "${TMP_FILE}"; then
        echo "**Resultado:** ✅ OK (503 esperado: NO_PROVIDERS_AVAILABLE)."
      elif [ "${HTTP_STATUS}" = "503" ] && grep -q '"error_code"[[:space:]]*:[[:space:]]*"TIMEOUT_ERROR"' "${TMP_FILE}"; then
        echo "**Resultado:** ✅ OK (503 esperado: TIMEOUT_ERROR)."
      # FAIL si devuelve 200 con mensaje genérico “no pude generar…”
      elif [ "${HTTP_STATUS}" = "200" ] && grep -qi 'no pude generar una respuesta' "${TMP_FILE}"; then
        echo "**Resultado:** ❌ FAIL — 200 con mensaje genérico (debe ser 503 estructurado)."
      else
        echo "**Resultado:** ✅ OK (no se detectó respuesta vacía ni 200 genérico)."
      fi
    fi
    rm -f "${TMP_FILE}" || true
    echo

    echo "### 4) Chat (${PROVIDER}) stream:true (esperado: SSE sin event:error, o 503 JSON estructurado)"
    echo '```'
    TMP_FILE="$(mktemp)"
    CHAT_DATA="{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"stream\":true}"
    if [ -n "${MODEL}" ]; then
      CHAT_DATA="{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"model\":\"${MODEL}\",\"stream\":true}"
    fi
    curl -sS -i --max-time "${MAX_TIME}" \
      -X POST "${BASE_URL}/webapi/chat/${PROVIDER}" \
      -H "Content-Type: application/json" \
      -H "X-Development: ${DEVELOPMENT}" \
      -H "X-Request-Id: ${REQ_ID}" \
      --data "${CHAT_DATA}" \
      > "${TMP_FILE}" || true
    head -n 220 "${TMP_FILE}" || true
    echo '```'
    echo
    # OK si:
    # - SSE sin `event: error`, o
    # - backend responde JSON 503 con `error_code: NO_PROVIDERS_AVAILABLE|TIMEOUT_ERROR`
    if grep -q '^event: error' "${TMP_FILE}"; then
      echo "**Resultado:** ❌ FAIL — stream contiene event: error."
    elif grep -q '^HTTP/[0-9.]* 503' "${TMP_FILE}" && grep -q '"error_code"[[:space:]]*:[[:space:]]*"NO_PROVIDERS_AVAILABLE"' "${TMP_FILE}"; then
      echo "**Resultado:** ✅ OK (503 esperado: NO_PROVIDERS_AVAILABLE)."
    elif grep -q '^HTTP/[0-9.]* 503' "${TMP_FILE}" && grep -q '"error_code"[[:space:]]*:[[:space:]]*"TIMEOUT_ERROR"' "${TMP_FILE}"; then
      echo "**Resultado:** ✅ OK (503 esperado: TIMEOUT_ERROR)."
    else
      echo "**Resultado:** ✅ OK (sin event:error en los primeros 220 líneas)."
    fi
    rm -f "${TMP_FILE}" || true
    echo
  done

  echo "### 6) Provider forzado (debe respetarse o devolver AUTH_ERROR/PROVIDER_ERROR; NO caer a Ollama)"
  echo

  echo "#### 6.1) Chat (google) stream:false"
  echo '```'
  TMP_FILE="$(mktemp)"
  curl -sS -i --max-time "${MAX_TIME}" \
    -X POST "${BASE_URL}/webapi/chat/google" \
    -H "Content-Type: application/json" \
    -H "X-Development: ${DEVELOPMENT}" \
    -H "X-Request-Id: ${REQ_ID}_force_google" \
    --data "{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"model\":\"gemini-1.5-pro\",\"stream\":false}" \
    > "${TMP_FILE}" || true
  head -n 200 "${TMP_FILE}" || true
  echo '```'
  echo
  if grep -q "\"provider\"[[:space:]]*:[[:space:]]*\"ollama\"" "${TMP_FILE}"; then
    echo "**Resultado:** ❌ FAIL — provider=google terminó usando provider=ollama."
  elif grep -q '"error_code"[[:space:]]*:[[:space:]]*"AUTH_ERROR"' "${TMP_FILE}" || grep -q '"error_code"[[:space:]]*:[[:space:]]*"PROVIDER_ERROR"' "${TMP_FILE}"; then
    echo "**Resultado:** ✅ OK (error estructurado esperado para provider forzado)."
  else
    echo "**Resultado:** ✅ OK/INFO — revisar provider/model en body para confirmar que se respetó google."
  fi
  rm -f "${TMP_FILE}" || true
  echo

  echo "#### 6.2) Chat (openai) stream:false"
  echo '```'
  TMP_FILE="$(mktemp)"
  curl -sS -i --max-time "${MAX_TIME}" \
    -X POST "${BASE_URL}/webapi/chat/openai" \
    -H "Content-Type: application/json" \
    -H "X-Development: ${DEVELOPMENT}" \
    -H "X-Request-Id: ${REQ_ID}_force_openai" \
    --data "{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"model\":\"gpt-4o-mini\",\"stream\":false}" \
    > "${TMP_FILE}" || true
  head -n 200 "${TMP_FILE}" || true
  echo '```'
  echo
  if grep -q "\"provider\"[[:space:]]*:[[:space:]]*\"ollama\"" "${TMP_FILE}"; then
    echo "**Resultado:** ❌ FAIL — provider=openai terminó usando provider=ollama."
  else
    echo "**Resultado:** ✅ OK/INFO — revisar error_code (429 debería ser UPSTREAM_RATE_LIMIT) o éxito."
  fi
  rm -f "${TMP_FILE}" || true
  echo

  echo "#### 6.3) Chat (anthropic) stream:false"
  echo '```'
  TMP_FILE="$(mktemp)"
  curl -sS -i --max-time "${MAX_TIME}" \
    -X POST "${BASE_URL}/webapi/chat/anthropic" \
    -H "Content-Type: application/json" \
    -H "X-Development: ${DEVELOPMENT}" \
    -H "X-Request-Id: ${REQ_ID}_force_anthropic" \
    --data "{\"messages\":[{\"role\":\"user\",\"content\":\"hola smoke test\"}],\"model\":\"claude-3-opus-20240229\",\"stream\":false}" \
    > "${TMP_FILE}" || true
  head -n 200 "${TMP_FILE}" || true
  echo '```'
  echo
  if grep -q "\"provider\"[[:space:]]*:[[:space:]]*\"ollama\"" "${TMP_FILE}"; then
    echo "**Resultado:** ❌ FAIL — provider=anthropic terminó usando provider=ollama."
  else
    echo "**Resultado:** ✅ OK/INFO — revisar si devuelve AUTH_ERROR (sin créditos) o fallback."
  fi
  rm -f "${TMP_FILE}" || true
  echo

  echo "### 5) API chat alternativa (/api/chat) (solo para comparar contrato)"
  echo '```'
  curl -sS -i --max-time "${MAX_TIME}" \
    -X POST "${BASE_URL}/api/chat" \
    -H "Content-Type: application/json" \
    -H "X-Development: ${DEVELOPMENT}" \
    -H "X-Request-Id: ${REQ_ID}" \
    --data "{\"message\":\"hola smoke test\",\"metadata\":{\"development\":\"${DEVELOPMENT}\"}}" \
    | head -n 220 || true
  echo '```'
  echo

  echo "## Fin smoke test"
  echo "- **RequestId**: \`${REQ_ID}\`"
  echo "- **Reporte**: \`${REPORT_FILE}\`"
} | run

echo
echo "Reporte generado en: ${REPORT_FILE}"
exit 0

