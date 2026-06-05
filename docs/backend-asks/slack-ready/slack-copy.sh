#!/bin/bash
# slack-copy.sh — copia un mensaje al portapapeles para pegar en Slack con Cmd+V
#
# Uso:
#   ./slack-copy.sh              # menú interactivo
#   ./slack-copy.sh api-ia       # copia 1c-RE-API-IA-decision-plugin-c.txt
#   ./slack-copy.sh api-mcp      # copia 2b-RE-API-MCP-CatC.txt
#
# Requisito: macOS (usa pbcopy).

set -e
cd "$(dirname "$0")"

choice="$1"

if [ -z "$choice" ]; then
  cat <<'MENU'

╔════════════════════════════════════════════════════════════╗
║       MENSAJES SLACK LISTOS PARA ENVIAR (05-jun)          ║
╚════════════════════════════════════════════════════════════╝

  [1] PARA api-ia  →  decisión plugin opción (c) DEPRECAR
                      + pregunta colateral aiProvider/chatGroup/KB
                      ENVIAR EN: hilo 1779046688.849779 (#coordinacion)

  [2] PARA api-mcp →  confirmación P0 OK + Cat C 12/13
                      + 2 ops NO necesarias (generatePdf/getGeoInfo)
                      + call-sites "Por verificar"
                      ENVIAR EN: hilo 1779046688.849779 (#coordinacion)

  [s] Salir

Elige (1/2/s):
MENU
  read choice
fi

case "$choice" in
  1|api-ia|ia)
    file="1c-RE-API-IA-decision-plugin-c.txt"
    target="api-ia (hilo 1779046688.849779)"
    ;;
  2|api-mcp|mcp)
    file="2b-RE-API-MCP-CatC.txt"
    target="api-mcp (hilo 1779046688.849779)"
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

📋 Cmd+Tab a Slack → pulsa Cmd+V dentro del mensaje del hilo → enviar.

EOF
