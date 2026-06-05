#!/bin/bash
# slack-copy.sh — copia un mensaje al portapapeles para pegar en Slack con Cmd+V
#
# CANAL Slack: #coordinacion (C0AV8EV5495)
# WORKSPACE:   eventosorganizador.slack.com
# HILO único:  1778170638.897419 (todos los mensajes van en ESTE hilo)
#
# Uso:
#   ./slack-copy.sh                # menú interactivo
#   ./slack-copy.sh 1              # mensaje 1
#   ./slack-copy.sh 2              # mensaje 2
#   ./slack-copy.sh 3              # mensaje 3
#   ./slack-copy.sh 4              # mensaje 4
#
# Requisito: macOS (usa pbcopy).

set -e
cd "$(dirname "$0")"

choice="$1"

if [ -z "$choice" ]; then
  cat <<'MENU'

╔══════════════════════════════════════════════════════════════╗
║   MENSAJES SLACK LISTOS PARA ENVIAR — 05-jun                ║
║   Canal: #coordinacion · Hilo: 1778170638.897419            ║
╚══════════════════════════════════════════════════════════════╝

  [1] → api-mcp  ✅ Cat C + P0 confirmados, call-sites por verificar
  [2] → api-ia   ✅ decisión plugin opción (c) DEPRECAR
  [3] → api-mcp  ⚠️  Thread CONFIRMADO + 4 ajustes contrato
  [4] → api-ia   ⚠️  Thread se MANTIENE + 3 servicios pendientes (A/B/C)
  [s] → salir

Elige (1/2/3/4/s):
MENU
  read choice
fi

case "$choice" in
  1|cat-c|mcp-cat)
    file="2b-RE-API-MCP-CatC.txt"
    target="api-mcp"
    note="confirmación Cat C + P0 + 2 ops NO necesarias"
    ;;
  2|plugin|ia-plugin)
    file="1c-RE-API-IA-decision-plugin-c.txt"
    target="api-ia"
    note="decisión plugin opción (c) DEPRECAR"
    ;;
  3|thread-mcp|mcp-thread)
    file="3-PARA-API-MCP-Thread-ajustes-contrato.txt"
    target="api-mcp"
    note="Thread CONFIRMADO + 4 ajustes al contrato GraphQL"
    ;;
  4|thread-ia|ia-thread)
    file="1d-PARA-API-IA-Thread-mantener-y-3-pendientes.txt"
    target="api-ia"
    note="Thread se MANTIENE + 3 servicios CAPA 2 pendientes (aiProvider/chatGroup/knowledgeBase)"
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
