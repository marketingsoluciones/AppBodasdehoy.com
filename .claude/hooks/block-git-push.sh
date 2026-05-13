#!/usr/bin/env bash
# PreToolUse hook que BLOQUEA cualquier `git push` ejecutado por Claude.
#
# REGLA ABSOLUTA: solo el user humano puede ejecutar push.
# Incidente origen: 2026-05-13, €200 pérdida por push automatizado de agente IA.
# Memoria: feedback_solo_user_push.md + feedback_no_push_sin_confirmacion.md
#
# Si Claude necesita que algo llegue a remote, debe:
#   1. Crear el commit local
#   2. Imprimir al user el comando exacto: `git push origin <rama>`
#   3. ESPERAR a que el user lo ejecute manualmente
#
# Para bypassear este hook (solo el user humano debe hacerlo):
#   - Eliminar/renombrar este script
#   - O ejecutar `git push` directamente desde una shell fuera de Claude

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
  cat >&2 <<EOF
══════════════════════════════════════════════════════════════════════
🚫 BLOQUEADO POR HOOK: git push no autorizado
══════════════════════════════════════════════════════════════════════

REGLA ABSOLUTA del proyecto AppBodasdehoy:
  - SOLO el user humano (Juan Carlos) puede ejecutar git push.
  - Incidente origen: 2026-05-13, €200 pérdida por push automatizado de IA.
  - La rama 'test' está VETADA — nadie pushea sin tests al 100%.

QUÉ HACER EN SU LUGAR:
  1. Tu commit local ya está creado (eso sí está permitido).
  2. Imprime al user el comando exacto:
       git push origin <rama>
  3. ESPERA a que él lo ejecute manualmente.

Comando bloqueado:
  ${CMD}

Si crees que esto es un falso positivo o el user te autorizó explícitamente,
PIDE al user que ejecute el push él mismo desde su terminal.
══════════════════════════════════════════════════════════════════════
EOF
  exit 2
fi

# Cualquier otro comando: permitir
exit 0
