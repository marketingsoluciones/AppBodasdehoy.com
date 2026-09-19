#!/usr/bin/env bash
# PreToolUse hook que CONTROLA `git push` ejecutado por Claude.
#
# REGLA actualizada 2026-05-17 (autorización user explícita):
#   - PERMITIDO: push a `dev` o feature branches `tj/feat/*`
#   - BLOQUEADO: push a `test`, `master`, `masterv1` (críticos)
#
# Incidente origen: 2026-05-13, €200 pérdida por push automatizado de IA.
# Memoria: feedback_solo_user_push.md + feedback_no_push_sin_confirmacion.md

set -euo pipefail

# Leer JSON de stdin
INPUT="$(cat)"

# Extraer el comando bash
CMD="$(printf '%s' "$INPUT" | /usr/bin/python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || echo '')"

# Detectar `git push` (con todas sus variantes: git push, git -C ... push, git push --force, etc.)
# Excluye git push --help / --version y similar (no afectan)
if printf '%s' "$CMD" | grep -qE '(^|[^a-zA-Z0-9_-])git([[:space:]]+-[A-Za-z]+[[:space:]]+[^[:space:]]+)*[[:space:]]+push([[:space:]]|$)'; then
  if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+push[[:space:]]+(--help|-h|--version)'; then
    # --help y --version son inofensivos, permitir
    exit 0
  fi

  # BLOQUEAR siempre push a ramas críticas (test/master/masterv1)
  if printf '%s' "$CMD" | grep -qE '(:|[[:space:]])(test|master|masterv1)([[:space:]]|$)' \
     && ! printf '%s' "$CMD" | grep -qE '(:|[[:space:]])(masterv1[[:alnum:]]|test[[:alnum:]])'; then
    cat >&2 <<EOF
══════════════════════════════════════════════════════════════════════
🚫 BLOQUEADO POR HOOK: push a rama crítica (test/master/masterv1)
══════════════════════════════════════════════════════════════════════

Las ramas test, master y masterv1 están VETADAS para push automatizado.
Solo humano puede pushear ahí, y solo con tests al 100%.

Comando bloqueado:
  ${CMD}
══════════════════════════════════════════════════════════════════════
EOF
    exit 2
  fi

  # FORZAR --force bloqueado siempre (excepto en feature branches con autorización)
  if printf '%s' "$CMD" | grep -qE '\-\-force([[:space:]]|$)|\-f([[:space:]]|$)'; then
    cat >&2 <<EOF
══════════════════════════════════════════════════════════════════════
🚫 BLOQUEADO POR HOOK: git push --force no autorizado
══════════════════════════════════════════════════════════════════════

Force push puede sobrescribir trabajo en remote. Sólo humano puede ejecutarlo.

Comando bloqueado:
  ${CMD}
══════════════════════════════════════════════════════════════════════
EOF
    exit 2
  fi

  # Permitir push a dev o feature branches (autorización user 2026-05-17)
  # No requiere matching explícito — si llega aquí (no test/master/masterv1, no --force), permitir
  exit 0
fi

# Cualquier otro comando: permitir
exit 0
