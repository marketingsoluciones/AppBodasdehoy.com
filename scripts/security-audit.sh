#!/usr/bin/env bash
# scripts/security-audit.sh
# ─────────────────────────────────────────────────────────────────────────────
# Auditoría de seguridad automatizada — corre standalone, en pre-commit, o CI.
#
# Detecta:
#   1. Secrets hardcoded en código (fallbacks `process.env.X || 'valor'`)
#   2. Archivos .env* versionados con valores reales (no .example)
#   3. Patrones de credenciales típicas (AWS, Google, Slack, Firebase, JWT)
#   4. Endpoints /api/public/* sin protección (CAPTCHA + rate limit)
#   5. console.log con secrets en producción
#
# Uso:
#   bash scripts/security-audit.sh           # full audit, exit 1 si hay críticos
#   bash scripts/security-audit.sh --quick   # solo hardcoded + .env tracked
#   bash scripts/security-audit.sh --json    # output JSON para CI
#
# Política asociada: PROHIBIDO FALLBACK + AWS SES Trust & Safety (rotar keys
# + no almacenar credenciales en repos terceros).
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

QUICK=0
JSON=0
for arg in "$@"; do
  [ "$arg" = "--quick" ] && QUICK=1
  [ "$arg" = "--json" ] && JSON=1
done

CRITICAL=0
HIGH=0
MEDIUM=0

report() {
  local sev=$1; local msg=$2
  if [ "$JSON" = "1" ]; then
    printf '{"sev":"%s","msg":%s}\n' "$sev" "$(printf '%s' "$msg" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')"
  else
    case "$sev" in
      CRITICAL) printf "${RED}🔴 CRITICAL${NC}  %s\n" "$msg"; CRITICAL=$((CRITICAL+1));;
      HIGH)     printf "${YELLOW}⚠️  HIGH${NC}      %s\n" "$msg"; HIGH=$((HIGH+1));;
      MEDIUM)   printf "${BLUE}🟡 MEDIUM${NC}    %s\n" "$msg"; MEDIUM=$((MEDIUM+1));;
    esac
  fi
}

section() {
  [ "$JSON" = "1" ] && return
  printf "\n${BLUE}═══ %s ═══${NC}\n" "$1"
}

# ─── 1. Hardcoded fallback secrets ──────────────────────────────────────────
section "1. Hardcoded fallback secrets (process.env.X || 'valor')"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  # Solo flag si el valor es >20 chars (descarta defaults cortos como puerto/lang)
  val=$(echo "$line" | grep -oE "\|\|\s*['\"][^'\"]{20,}['\"]" | head -1)
  [ -z "$val" ] && continue
  # Skip si es URL pública obvia (https://*.bodasdehoy.com)
  echo "$val" | grep -qE "https://[a-z]+\.bodasdehoy\.com['\"]" && continue
  report HIGH "Fallback hardcoded: $line"
done < <(grep -rnE "process\.env\.[A-Z_]+\s*\|\|\s*['\"][^'\"]{20,}['\"]" \
  apps/appEventos apps/chat-ia/src packages \
  --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null \
  | grep -v "node_modules\|\.next/\|\.test\.\|/dist/" \
  | head -15)

# ─── 2. .env files versionados con secrets reales ───────────────────────────
section "2. .env files versionados con secrets"

# Solo archivos .env tracked en git (no .example, no .gitignored)
for f in $(git ls-files | grep -E "\.env(\.|$)" | grep -v "\.example$" | grep -v "docker-compose/"); do
  [ ! -f "$f" ] && continue
  # Buscar líneas con valores que parezcan secrets (>=20 chars alfanum-like)
  hits=$(grep -E "^[A-Z_]+=[\"']?[A-Za-z0-9+/=_.-]{20,}" "$f" 2>/dev/null | \
    grep -vE "https?://|=true|=false|=production|=development" | wc -l | tr -d ' ')
  if [ "$hits" -gt 0 ]; then
    # Listar nombres de las claves (sin valores)
    keys=$(grep -E "^[A-Z_]+=[\"']?[A-Za-z0-9+/=_.-]{20,}" "$f" | \
      grep -vE "https?://|=true|=false|=production|=development" | \
      cut -d= -f1 | head -5 | tr '\n' ',' | sed 's/,$//')
    report CRITICAL "$f tracked con $hits secretos: $keys"
  fi
done

# ─── 3. Patrones de credenciales típicas en código ─────────────────────────
if [ "$QUICK" = "0" ]; then
section "3. Patrones de credenciales en código fuente"

# AWS Access Key
while IFS= read -r line; do
  [ -z "$line" ] && continue
  report CRITICAL "AWS Access Key pattern: $line"
done < <(grep -rnE "AKIA[0-9A-Z]{16}" \
  apps packages scripts 2>/dev/null \
  | grep -v "node_modules\|\.next/" | head -5)

# Google OAuth Secret (suelen ser 24-char base64-ish)
while IFS= read -r line; do
  [ -z "$line" ] && continue
  report CRITICAL "Possible Google OAuth Secret: $line"
done < <(grep -rnE "GOOGLE_OAUTH_CLIENT_SECRET\s*[=:]\s*['\"][A-Za-z0-9_-]{20,}['\"]" \
  apps packages scripts 2>/dev/null \
  | grep -v "node_modules\|\.next/\|\.env" | head -5)

# Slack bot token
while IFS= read -r line; do
  [ -z "$line" ] && continue
  report CRITICAL "Slack bot token: $line"
done < <(grep -rnE "xoxb-[0-9]{10,}" \
  apps packages scripts e2e-app 2>/dev/null \
  | grep -v "node_modules\|\.next/\|\.env" | head -5)

# JWT en código (eyJhbGc... larguísimo)
while IFS= read -r line; do
  [ -z "$line" ] && continue
  report HIGH "Hardcoded JWT in source: $line"
done < <(grep -rnE "eyJ[A-Za-z0-9_-]{50,}\.[A-Za-z0-9_-]{50,}" \
  apps packages 2>/dev/null \
  | grep -v "node_modules\|\.next/\|\.env\|test\|spec" | head -5)
fi

# ─── 4. Endpoints /api/public/* sin protección ─────────────────────────────
section "4. Endpoints /api/public/* — protección CAPTCHA + rate limit"

PUBLIC_ENDPOINTS=$(find apps/appEventos/pages/api/public \
  apps/chat-ia/src/app/api -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | grep -v node_modules)

PROT_LIB_PRESENT=0
grep -rqE "turnstile|hCaptcha|reCAPTCHA|@upstash/ratelimit|express-rate-limit|next-rate-limit" \
  apps packages scripts 2>/dev/null && PROT_LIB_PRESENT=1

for ep in $PUBLIC_ENDPOINTS; do
  has_captcha=$(grep -lE "turnstile|hCaptcha|reCAPTCHA" "$ep" 2>/dev/null)
  has_ratelimit=$(grep -lE "ratelimit|rateLimit|@upstash" "$ep" 2>/dev/null)
  has_auth=$(grep -lE "Authorization|verifyToken|getSession|requireAuth" "$ep" 2>/dev/null)
  if [ -z "$has_captcha" ] && [ -z "$has_ratelimit" ] && [ -z "$has_auth" ]; then
    rel=$(echo "$ep" | sed "s|$ROOT/||")
    report HIGH "Endpoint público sin CAPTCHA + rate limit + auth: $rel"
  fi
done

if [ "$PROT_LIB_PRESENT" = "0" ]; then
  report MEDIUM "NO dependencia de protección instalada (turnstile, hcaptcha, upstash/ratelimit, etc)"
fi

# ─── 5. console.log con secrets ─────────────────────────────────────────────
if [ "$QUICK" = "0" ]; then
section "5. console.log con secrets en código vivo"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  report MEDIUM "console.log con var sensitiva: $line"
done < <(grep -rnE "console\.(log|warn|error).*\b(token|password|secret|apiKey|api_key|jwt)\b" \
  apps/appEventos/pages apps/appEventos/components apps/chat-ia/src \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|\.next/\|test\|spec\|sentry\|DEBUG\|debug:" \
  | head -8)
fi

# ─── Resumen ───────────────────────────────────────────────────────────────
if [ "$JSON" = "0" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "RESUMEN"
  echo "═══════════════════════════════════════════════════════════"
  printf "${RED}🔴 CRÍTICOS:${NC} %d\n" "$CRITICAL"
  printf "${YELLOW}⚠️  ALTOS:${NC}    %d\n" "$HIGH"
  printf "${BLUE}🟡 MEDIOS:${NC}   %d\n" "$MEDIUM"
  echo ""
  if [ "$CRITICAL" -gt 0 ]; then
    printf "${RED}AUDIT FALLA: hay %d críticos. Fix antes de commit/deploy.${NC}\n" "$CRITICAL"
  elif [ "$HIGH" -gt 0 ]; then
    printf "${YELLOW}AUDIT WARNING: %d altos. Revisar.${NC}\n" "$HIGH"
  else
    printf "${GREEN}AUDIT PASSED.${NC}\n"
  fi
fi

# Exit code: 1 si críticos, 0 si solo altos/medios (no bloquea pero alerta)
[ "$CRITICAL" -gt 0 ] && exit 1
exit 0
