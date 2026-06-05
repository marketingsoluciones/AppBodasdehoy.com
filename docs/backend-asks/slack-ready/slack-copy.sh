#!/bin/bash
# slack-copy.sh — copia un mensaje al portapapeles para pegar en Slack con Cmd+V
#
# CANAL Slack: #coordinacion (C0AV8EV5495)
# WORKSPACE:   eventosorganizador.slack.com
# HILO único:  1778170638.897419 (todos los mensajes van en ESTE hilo)
#
# Uso:
#   ./slack-copy.sh                # menú interactivo
#   ./slack-copy.sh 1..6           # mensaje por número
#   ./slack-copy.sh ls             # lista archivos vivos
#
# Requisito: macOS (usa pbcopy).

set -e
cd "$(dirname "$0")"

choice="$1"

if [ "$choice" = "ls" ]; then
  ls -1 *.txt
  exit 0
fi

if [ -z "$choice" ]; then
  cat <<'MENU'

╔══════════════════════════════════════════════════════════════╗
║   MENSAJES SLACK LISTOS PARA ENVIAR                         ║
║   Canal: #coordinacion · Hilo: 1778170638.897419            ║
╚══════════════════════════════════════════════════════════════╝

  ─ Pendientes de enviar ─────────────────────────────────

  [3] → api-mcp  ⚠️ Thread CONFIRMADO + 4 ajustes contrato
                  (probablemente ya enviado y respondido por mcp ✅)

  [4] → api-mcp  🆕 Acuse + fijar naming uppercase/lowercase
                  (URGENTE — antes que cierren merge Thread)

  [5] → api-ia   🆕 Thread desbloqueado, preparar proxy REST
                  + recordatorio decisión A/B/C (aiProvider/etc)

  [6] → api-mcp  🆕 Smoke Cat C 10/10 OK + bug producción borraPago FIXED
  [7] → api-mcp  🆕 Auditoría Fetching.ts — 3 bugs front más detectados

  ─ Históricos en mismo hilo (por si necesitas reenviar) ──

  [1] → api-mcp  Cat C + P0 confirmados + 2 ops NO necesarias
  [2] → api-ia   Decisión plugin opción (c) DEPRECAR
  [6] → api-ia   Thread se MANTIENE + 3 servicios pendientes A/B/C

  [s] → salir

Elige (1/2/3/4/5/6/s):
MENU
  read choice
fi

case "$choice" in
  1|cat-c)
    file="2b-RE-API-MCP-CatC.txt"
    target="api-mcp"
    note="confirmación Cat C + P0 + 2 ops NO necesarias"
    ;;
  2|plugin)
    file="1c-RE-API-IA-decision-plugin-c.txt"
    target="api-ia"
    note="decisión plugin opción (c) DEPRECAR"
    ;;
  3|thread-ajustes)
    file="3-PARA-API-MCP-Thread-ajustes-contrato.txt"
    target="api-mcp"
    note="Thread CONFIRMADO + 4 ajustes contrato (ya respondido por mcp)"
    ;;
  4|naming|thread-naming)
    file="4-RE-API-MCP-acuse-Thread-fijar-naming.txt"
    target="api-mcp"
    note="🆕 acuse + fijar naming enums uppercase/lowercase como role"
    ;;
  5|proxy|thread-proxy)
    file="5-PARA-API-IA-Thread-preparar-proxy-naming.txt"
    target="api-ia"
    note="🆕 Thread desbloqueado por api-mcp, preparar proxy REST + naming"
    ;;
  6|smoke|bug)
    file="6-PARA-API-MCP-bug-deletepayment-fixed.txt"
    target="api-mcp"
    note="🆕 smoke Cat C 10/10 OK + bug producción borraPago FIXED"
    ;;
  7|audit|bugs)
    file="7-PARA-API-MCP-bugs-front-mas-detectados.txt"
    target="api-mcp"
    note="🆕 auditoría Fetching.ts — 3 bugs front más detectados"
    ;;
  8|abc|3-pendientes)
    file="1d-PARA-API-IA-Thread-mantener-y-3-pendientes.txt"
    target="api-ia"
    note="Thread se MANTIENE + 3 servicios CAPA 2 pendientes A/B/C"
    ;;
  s|S|salir)
    echo "Saliendo."
    exit 0
    ;;
  *)
    echo "Opción inválida: $choice"
    exit 1
    ;;
esac

if [ ! -f "$file" ]; then
  echo "ERROR: $file no existe en $(pwd)"
  exit 1
fi

cat "$file" | pbcopy

lines=$(wc -l < "$file" | tr -d ' ')
bytes=$(wc -c < "$file" | tr -d ' ')

cat <<EOF

✅ COPIADO al portapapeles
   archivo: $file
   tamaño:  $lines líneas, $bytes bytes
   destino: $target
   asunto:  $note

📋 Cmd+Tab a Slack → canal #coordinacion (C0AV8EV5495)
   → entra al hilo 1778170638.897419
   → Cmd+V → enviar.

EOF
